import { loadConfig, loadFederalConfig, loadProvinceConfig } from "../../js/load-config.js";
import { calculateTotalTax } from "../../js/calculate-total-tax.js";
import { calculateDonationCredit } from "../../js/calculate-donation-credit.js";
import { checkCreditUsability } from "../../js/check-credit-usability.js";
import { fillTemplate } from "../../js/ui/template-loader.js";

export async function init(contentEl, html) {
  const [learnConfig, federal, province] = await Promise.all([
    loadConfig("config/learn.json"),
    loadFederalConfig(),
    loadProvinceConfig("ON"),
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

  contentEl.innerHTML = fillTemplate(html, data);
}

export function destroy() {}

function formatWhole(amount) {
  return "$" + Math.round(amount).toLocaleString("en-CA");
}
