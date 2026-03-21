import { loadConfig, loadFederalConfig, loadProvinceConfig } from "../../js/load-config.js";
import { calculateTotalTax } from "../../js/calculate-total-tax.js";
import { calculateDonationCredit } from "../../js/calculate-donation-credit.js";
import { checkCreditUsability } from "../../js/check-credit-usability.js";
import { calculateDonationForRefund } from "../../js/calculate-donation-for-refund.js";
import { loadTemplate, fillTemplate } from "../../js/ui/template-loader.js";

export async function init(contentEl, html) {
  const [learnConfig, federal, province, cardTemplate] = await Promise.all([
    loadConfig("config/learn.json"),
    loadFederalConfig(),
    loadProvinceConfig("ON"),
    loadTemplate("templates/refund-card.html"),
  ]);

  const scenarios = learnConfig.creditOutcomeScenarios;
  const data = {};

  for (const [key, { income, donation }] of Object.entries(scenarios)) {
    const tax = calculateTotalTax(income, federal, province);
    const credit = calculateDonationCredit(donation, income, federal, province);
    const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, donation);

    data[`${key}_income`] = formatWhole(income);
    data[`${key}_tax`] = formatWhole(tax.totalTax);
    data[`${key}_credit`] = formatWhole(credit.totalCredit);
    data[`${key}_donation`] = formatWhole(donation);
    data[`${key}_getsBack`] = formatWhole(usability.creditUsable);
  }

  // Reverse lookup cards
  const lowRate = federal.donationCredit.lowRate + province.donationCredit.lowRate;
  const highRate = federal.donationCredit.highRate + province.donationCredit.highRate;
  const threshold = federal.donationCredit.lowRateThreshold;

  const targets = learnConfig.reverseLookupTargets;
  const cardFragments = targets.map((target) => {
    const donation = calculateDonationForRefund(target, federal, province);
    const lowPortion = Math.min(donation, threshold);
    const highPortion = Math.max(0, donation - threshold);
    const lowPct = Math.round((lowPortion / donation) * 100);
    const highPct = 100 - lowPct;
    const refundPct = Math.round((target / donation) * 100);

    return fillTemplate(cardTemplate, {
      target: formatWhole(target),
      donation: formatWhole(donation),
      lowPct,
      lowLabel: `${formatWhole(lowPortion)} at ${formatPercent(lowRate)}`,
      highPct,
      highLabel: highPortion > 0
        ? `${formatWhole(highPortion)} at ${formatPercent(highRate)}`
        : '',
      refundPct,
      refundLabel: `${formatWhole(target)} back`,
    });
  });

  // Insert rate callout between first and second card — threshold from config, never hardcoded
  const formattedThreshold = formatWhole(threshold);
  const rateCallout = `<div class="rate-callout">
    <span class="rate-callout-icon">&#x26A0;</span>
    The first ${formattedThreshold} of donations earns credit at ${formatPercent(lowRate)}.
    Above ${formattedThreshold}, the rate jumps to ${formatPercent(highRate)} — more than double.
  </div>`;
  cardFragments.splice(1, 0, rateCallout);

  data.refundCards = cardFragments.join("\n");

  contentEl.innerHTML = fillTemplate(html, data);
}

export function destroy() {}

function formatWhole(amount) {
  return "$" + Math.round(amount).toLocaleString("en-CA");
}

function formatPercent(rate) {
  return Math.round(rate * 100) + '%';
}
