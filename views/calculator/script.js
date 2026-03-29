import { setupForm, clearAllErrors, parseCurrency } from "../../js/ui/form.js";
import { runCalculation, runReverseCalculation } from "../../js/calculator.js";
import { renderResults } from "../../js/ui/results.js";
import { pushStateToUrl, pushModeToUrl, readStateFromUrl, clearUrl } from "../../js/ui/url-state.js";
import { loadAppSettings } from "../../js/load-config.js";
import { calculateDonationForRefund } from "../../js/calculate-donation-for-refund.js";
import { loadFederalConfig, loadProvinceConfig } from "../../js/load-config.js";
import { formatCurrency } from "../../js/format.js";
import { buildReverseWarning } from "../../js/ui/reverse-narrative.js";
import { loadTemplate } from "../../js/ui/template-loader.js";
import { trackPageView, trackPageViewDebounced, cancelPendingTracking } from "../../js/analytics.js";

let debounceTimer = null;
// Guard against popstate firing after this view is destroyed. Both the router
// and this view listen for popstate. When navigating to a different route,
// the router's handler calls destroy() — but removeEventListener during an
// event dispatch doesn't cancel already-queued handlers for the same event,
// so this flag prevents the stale handler from running.
let destroyed = false;
// Stored reference so destroy() can remove the listener that init() registers.
let popstateHandler = null;
// Stash the raw donationNeeded number from the most recent reverse calculation.
// The forward-link click handler needs this to prefill the forward form's donation
// field. We store it here rather than parsing it back from donateDisplay.textContent,
// which contains formatted currency ("$1,351.00") that would be fragile to parse.
let lastDonationNeeded = 0;

function debounce(fn, ms) {
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn(...args), ms);
  };
}

export async function init(contentEl, html) {
  contentEl.innerHTML = html;

  // --- Load slider config from app-settings.json ---
  const appSettings = await loadAppSettings();
  const sliderConfig = appSettings.reverseSlider;
  const slider = document.getElementById("refund-slider");
  slider.min = sliderConfig.min;
  slider.max = sliderConfig.max;
  slider.value = sliderConfig.defaultValue;
  slider.step = sliderConfig.step;
  document.getElementById("slider-label-min").textContent = `$${sliderConfig.min}`;
  document.getElementById("slider-label-mid").textContent = `$${Math.round((sliderConfig.min + sliderConfig.max) / 2)}`;
  document.getElementById("slider-label-max").textContent = `$${sliderConfig.max}`;

  // --- Shared elements ---
  const form = document.getElementById("calculator-form");
  const resultsContainer = document.getElementById("results-container");
  const startOverBtn = form.querySelector(".btn-start-over");

  // --- Mode toggle ---
  const modeButtons = document.querySelectorAll(".mode-toggle button");
  const forwardView = document.getElementById("forward-view");
  const reverseView = document.getElementById("reverse-view");
  let currentMode = "forward";
  destroyed = false;

  /**
   * Pure UI toggle — updates button states and view visibility.
   *
   * This is the foundation that both user-initiated switches (switchMode)
   * and browser history restoration (onPopState) build on. It has NO URL
   * side effects, so callers control whether a history entry is created.
   *
   * Always clears results and hides "Start Over" when switching modes,
   * because stale results from the previous mode would be confusing.
   */
  function setModeUI(mode) {
    currentMode = mode;
    modeButtons.forEach(b => {
      const isActive = b.dataset.mode === mode;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", String(isActive));
    });
    forwardView.hidden = mode !== "forward";
    reverseView.hidden = mode !== "reverse";
    resultsContainer.innerHTML = "";
    startOverBtn.hidden = true;
    const rd = document.getElementById("reverse-disclaimer");
    if (rd) rd.hidden = true;
  }

  /**
   * Handle user-initiated mode switch (clicking the segmented control).
   *
   * Updates the UI via setModeUI, then pushes a new history entry so the
   * browser Back button can undo the mode switch. The URL reflects the new
   * mode even before the user fills in any form fields:
   *   - Forward: "/" (clean URL, no params)
   *   - Reverse: "?mode=reverse" (mode-only, no province/income/refund yet)
   *
   * This is intentionally separate from setModeUI because history restoration
   * via onPopState must NOT push new entries — doing so would corrupt the
   * history stack the user is navigating through.
   */
  function switchMode(mode) {
    setModeUI(mode);
    if (mode === "reverse") {
      pushModeToUrl("reverse");
    } else {
      clearUrl();
    }
  }

  modeButtons.forEach(b => b.addEventListener("click", () => {
    if (b.dataset.mode === currentMode) return;
    switchMode(b.dataset.mode);
    if (b.dataset.mode === "reverse") updateSlider();
  }));

  // --- Forward mode (existing logic, unchanged) ---
  async function calculate(province, income, donation, { track = true } = {}) {
    const results = await runCalculation(province, income, donation);
    await renderResults(results);
    document.querySelector('.results-section').scrollIntoView({ behavior: 'smooth' });
    pushStateToUrl(province, income, donation);
    if (track) trackPageView('/' + location.search);
    startOverBtn.hidden = false;
  }

  setupForm(form, async (data) => {
    await calculate(data.province, data.income, data.donation);
  });

  startOverBtn.addEventListener("click", () => {
    form.reset();
    clearAllErrors(form);
    resultsContainer.innerHTML = "";
    startOverBtn.hidden = true;
    clearUrl();
  });

  // --- Reverse mode (slider) ---
  const disclaimerHtml = await loadTemplate("templates/disclaimer.html");
  const reverseDisclaimer = document.getElementById("reverse-disclaimer");
  reverseDisclaimer.innerHTML = disclaimerHtml;

  const revProvince = document.getElementById("rev-province");
  const revIncome = document.getElementById("rev-income");
  const targetDisplay = document.getElementById("target-display");
  const donateDisplay = document.getElementById("donate-display");
  const refundDisplay = document.getElementById("refund-display");
  // Separate text span inside refundDisplay — setting textContent on refundDisplay
  // directly would destroy the surtax asterisk span. This inner span holds just the
  // currency text so the asterisk sibling is preserved.
  const refundText = document.getElementById("refund-text");
  const sliderResult = document.getElementById("slider-result");
  const sliderBreakdown = document.getElementById("slider-breakdown");
  const warningContainer = document.getElementById("slider-warning");
  const segLow = document.getElementById("seg-low");
  const segHigh = document.getElementById("seg-high");
  const legendLow = document.getElementById("legend-low");
  const legendHigh = document.getElementById("legend-high");

  // Surtax footnote elements — shown only for provinces with a surtax (currently
  // Ontario). The footnote explains that the reverse calculator doesn't account for
  // surtax savings, and links to the forward calculator for a precise result.
  const surtaxFootnote = document.getElementById("surtax-footnote");
  const surtaxAsterisk = document.getElementById("surtax-asterisk");
  const surtaxForwardLink = document.getElementById("surtax-forward-link");

  async function updateSlider() {
    const province = revProvince.value;
    const incomeStr = revIncome.value;
    const income = parseCurrency(incomeStr);
    const refund = parseInt(slider.value);

    // Always update the target display
    targetDisplay.textContent = `$${refund}`;

    if (!province) {
      // No province selected — show placeholder state
      donateDisplay.textContent = "—";
      refundText.textContent = "—";
      warningContainer.innerHTML = "";
      sliderResult.classList.remove("dimmed");
      sliderBreakdown.classList.remove("dimmed");
      segLow.style.width = "0%";
      segHigh.style.width = "0%";
      legendLow.textContent = "";
      legendHigh.textContent = "";
      reverseDisclaimer.hidden = true;
      // No province selected — hide surtax footnote (we don't know if the
      // province has a surtax yet).
      surtaxFootnote.hidden = true;
      surtaxAsterisk.hidden = true;
      return;
    }

    if (incomeStr.trim() === "" || isNaN(income)) {
      // Province selected but no income — optimistic mode (assume full taxpayer)
      const [federal, prov] = await Promise.all([
        loadFederalConfig(),
        loadProvinceConfig(province),
      ]);
      const donationNeeded = calculateDonationForRefund(refund, federal, prov);
      updateSliderUI(refund, donationNeeded, null, federal, prov);
      reverseDisclaimer.hidden = false;
      return;
    }

    const results = await runReverseCalculation(province, income, refund);
    const [federal, prov] = await Promise.all([
      loadFederalConfig(),
      loadProvinceConfig(province),
    ]);
    updateSliderUI(refund, results.donationNeeded, results, federal, prov);
    reverseDisclaimer.hidden = false;
    pushStateToUrl(province, income, refund, "reverse");
    trackPageViewDebounced('/' + location.search);
  }

  function updateSliderUI(refund, donationNeeded, results, federal, prov) {
    const threshold = federal.donationCredit.lowRateThreshold;

    // Donation display
    donateDisplay.textContent = formatCurrency(donationNeeded);

    // Breakdown bar
    const lowPortion = Math.min(donationNeeded, threshold);
    const highPortion = Math.max(0, donationNeeded - threshold);
    const total = donationNeeded || 1;
    segLow.style.width = `${(lowPortion / total * 100).toFixed(1)}%`;
    segHigh.style.width = `${(highPortion / total * 100).toFixed(1)}%`;
    segLow.textContent = lowPortion > 0 ? formatCurrency(lowPortion) : "";
    segHigh.textContent = highPortion > 0 ? formatCurrency(highPortion) : "";
    legendLow.textContent = `First $${threshold} at lower rate`;
    legendHigh.textContent = highPortion > 0 ? `Above $${threshold} at higher rate` : "";

    if (!results) {
      // Optimistic mode — no income, assume full taxpayer
      refundText.textContent = formatCurrency(refund);
      refundDisplay.className = "srb-amount refund-val";
      warningContainer.innerHTML = "";
      sliderResult.classList.remove("dimmed");
      sliderBreakdown.classList.remove("dimmed");
      return;
    }

    // Full results available — check usability
    const { usability } = results;

    if (usability.state === "fully-usable") {
      refundText.textContent = formatCurrency(refund);
      refundDisplay.className = "srb-amount refund-val";
      warningContainer.innerHTML = "";
      sliderResult.classList.remove("dimmed");
      sliderBreakdown.classList.remove("dimmed");
    } else if (usability.state === "entirely-wasted") {
      refundText.textContent = "$0";
      refundDisplay.className = "srb-amount refund-val";
      refundDisplay.style.color = "var(--color-wasted)";
      warningContainer.innerHTML = buildReverseWarning(results);
      sliderResult.classList.add("dimmed");
      sliderBreakdown.classList.add("dimmed");
    } else {
      // partly-wasted
      refundText.textContent = formatCurrency(usability.creditUsable);
      refundDisplay.className = "srb-amount refund-val";
      refundDisplay.style.color = "var(--color-accent)";
      warningContainer.innerHTML = buildReverseWarning(results);
      sliderResult.classList.remove("dimmed");
      sliderBreakdown.classList.remove("dimmed");
    }

    // Stash raw donation amount for the forward-link click handler (see
    // lastDonationNeeded declaration comment at module top).
    lastDonationNeeded = donationNeeded;

    // Surtax footnote — only provinces with a surtax config (currently Ontario).
    // The reverse calculator uses simple rate algebra to invert the credit, which
    // doesn't account for the surtax amplification effect. This means the "You
    // donate" amount is slightly higher than necessary for surtax-range donors.
    // The footnote explains this and links to the forward calculator, which does
    // include surtax savings, for a precise result.
    const hasSurtax = Boolean(prov.surtax);
    surtaxFootnote.hidden = !hasSurtax;
    surtaxAsterisk.hidden = !hasSurtax;

    if (hasSurtax) {
      // Build a forward-mode URL with the reverse calculator's current values.
      // The donation param is the calculated donationNeeded (what the user would
      // need to donate), so the forward calculator shows the precise credit
      // including surtax savings for that donation amount.
      const province = revProvince.value;
      const income = parseCurrency(revIncome.value);
      const params = new URLSearchParams({ province, income: income || '', donation: donationNeeded });
      surtaxForwardLink.href = `?${params}`;
    }
  }

  slider.addEventListener("input", updateSlider);
  revIncome.addEventListener("input", debounce(updateSlider, 300));
  revProvince.addEventListener("change", updateSlider);

  /**
   * Handle click on the surtax footnote's "What do I get back?" link.
   *
   * This performs an intra-view mode switch: reverse → forward, with the
   * forward form prefilled using the reverse calculator's current values
   * (province, income, and the calculated donation amount). The forward
   * calculator includes surtax savings, so the user sees a precise result.
   *
   * Why not use data-route / the SPA router?
   * The router's navigate() calls destroy() on the current view and re-inits
   * from scratch, which would flash the page and lose state. Instead, we
   * stay in the same view instance and call setModeUI() + calculate() —
   * the same smooth transition as clicking the "What do I get back?" tab
   * toggle button.
   *
   * URL and browser history:
   * calculate() calls pushStateToUrl() internally, so the URL updates to
   * forward-mode params (e.g., ?province=ON&income=300000&donation=1351).
   * The existing onPopState handler knows how to restore both forward and
   * reverse states, so the browser Back button returns to the reverse view
   * with the user's previous province/income/slider position intact.
   */
  surtaxForwardLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const province = revProvince.value;
    const income = parseCurrency(revIncome.value);
    const donation = lastDonationNeeded;

    setModeUI("forward");

    form.querySelector("#province").value = province;
    form.querySelector("#income").value = income;
    form.querySelector("#donation").value = donation;

    await calculate(province, income, donation);
  });

  // --- URL hydration ---
  // Restore calculator state from URL query params on initial load.
  // Uses setModeUI (not switchMode) because we're restoring state that's
  // already in the URL — pushing a new history entry would double it.
  const state = readStateFromUrl();
  if (state?.mode === "reverse") {
    setModeUI("reverse");
    revProvince.value = state.province;
    revIncome.value = state.income;
    slider.value = Math.min(Math.max(state.refund, sliderConfig.min), sliderConfig.max);
    await updateSlider();
  } else if (state) {
    form.querySelector("#province").value = state.province;
    form.querySelector("#income").value = state.income;
    form.querySelector("#donation").value = state.donation;
    await calculate(state.province, state.income, state.donation, { track: false });
  } else {
    // No full state parseable — check for bare mode param.
    // Handles deep links like "?mode=reverse" (reverse mode, empty form).
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "reverse") {
      setModeUI("reverse");
      await updateSlider();
    }
  }

  // --- Popstate handler for intra-route navigation ---
  /**
   * Restore calculator state when the user navigates via browser Back/Forward.
   *
   * The SPA router (js/router.js) has a same-route guard: when popstate fires
   * and the route path hasn't changed (still "/"), the router skips re-init.
   * This means mode switches and form submissions — which change query params
   * but not the route — are invisible to the router. This handler fills that gap.
   *
   * Uses setModeUI (not switchMode) to avoid pushing a new history entry,
   * which would corrupt the history stack the user is navigating through.
   *
   * The `destroyed` guard prevents this handler from running after the view
   * has been torn down. See the comment on the `destroyed` variable for details.
   */
  async function onPopState() {
    if (destroyed) return;

    const popState = readStateFromUrl();
    if (popState?.mode === "reverse") {
      // Full reverse state — restore form fields and recalculate
      setModeUI("reverse");
      revProvince.value = popState.province;
      revIncome.value = popState.income;
      slider.value = Math.min(Math.max(popState.refund, sliderConfig.min), sliderConfig.max);
      await updateSlider();
    } else if (popState) {
      // Full forward state — restore form fields and recalculate
      setModeUI("forward");
      form.querySelector("#province").value = popState.province;
      form.querySelector("#income").value = popState.income;
      form.querySelector("#donation").value = popState.donation;
      await calculate(popState.province, popState.income, popState.donation, { track: false });
    } else {
      // No full state parseable — check for bare mode param.
      // Handles history entries like "?mode=reverse" (reverse toggled, form empty)
      // or "/" (forward mode, form empty / start-over).
      const params = new URLSearchParams(location.search);
      if (params.get("mode") === "reverse") {
        setModeUI("reverse");
        revProvince.value = "";
        revIncome.value = "";
        slider.value = sliderConfig.defaultValue;
        await updateSlider();
      } else {
        setModeUI("forward");
        form.reset();
        clearAllErrors(form);
      }
    }
  }

  // Register after hydration so the initial state is fully established first.
  popstateHandler = onPopState;
  window.addEventListener("popstate", popstateHandler);
}

export function destroy() {
  destroyed = true;
  clearTimeout(debounceTimer);
  cancelPendingTracking();
  if (popstateHandler) {
    window.removeEventListener("popstate", popstateHandler);
    popstateHandler = null;
  }
}
