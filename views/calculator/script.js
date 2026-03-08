import { setupForm, clearAllErrors } from "../../js/ui/form.js";
import { runCalculation } from "../../js/calculator.js";
import { renderResults } from "../../js/ui/results.js";
import { pushStateToUrl, readStateFromUrl, clearUrl } from "../../js/ui/url-state.js";

export async function init() {
  const form = document.getElementById("calculator-form");
  const resultsContainer = document.getElementById("results-container");
  const startOverBtn = form.querySelector(".btn-start-over");

  async function calculate(province, income, donation) {
    const results = await runCalculation(province, income, donation);
    await renderResults(results);
    pushStateToUrl(province, income, donation);
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

  // Hydrate from URL if query params are present
  const state = readStateFromUrl();
  if (state) {
    form.querySelector("#province").value = state.province;
    form.querySelector("#income").value = state.income;
    form.querySelector("#donation").value = state.donation;
    await calculate(state.province, state.income, state.donation);
  }
}

export function destroy() {
  // Cleanup when navigating away
}
