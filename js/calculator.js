/**
 * Full calculation pipeline — orchestrates all modules.
 */

import { loadFederalConfig, loadProvinceConfig, loadAppSettings } from "./load-config.js";
import { calculateTotalTax } from "./calculate-total-tax.js";
import { calculateDonationCredit } from "./calculate-donation-credit.js";
import { checkCreditUsability } from "./check-credit-usability.js";
import { calculateMinimumIncome } from "./calculate-minimum-income.js";

/**
 * Run the full calculation pipeline.
 * @param {string} provinceCode - e.g., "ON"
 * @param {number} income
 * @param {number} donationAmount
 * @returns {Promise<object>} Full results object
 */
export async function runCalculation(provinceCode, income, donationAmount) {
  const [federal, province, appSettings] = await Promise.all([
    loadFederalConfig(),
    loadProvinceConfig(provinceCode),
    loadAppSettings(),
  ]);

  const tax = calculateTotalTax(income, federal, province);
  const credit = calculateDonationCredit(donationAmount, federal, province);
  const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, donationAmount);

  let minimumIncome = null;
  if (usability.state === "O-2" || usability.state === "O-3") {
    minimumIncome = calculateMinimumIncome(credit.totalCredit, federal, province);
  }

  const threshold = federal.donationCredit.lowRateThreshold;
  const proximityPercent = appSettings.narrative.thresholdProximityPercent;
  let nudge = null;
  if (
    usability.state === "O-1"
    && donationAmount < threshold
    && donationAmount >= threshold * proximityPercent
  ) {
    const nudgeAbovePercent = appSettings.narrative.nudgeAboveThresholdPercent;
    const nudgeAmount = Math.round(threshold * (1 + nudgeAbovePercent));
    const nudgeCredit = calculateDonationCredit(nudgeAmount, federal, province);
    const nudgeUsability = checkCreditUsability(nudgeCredit.totalCredit, tax.totalTax, nudgeAmount);
    if (nudgeUsability.state === "O-1") {
      nudge = {
        hypotheticalAmount: nudgeAmount,
        hypotheticalCredit: nudgeCredit.totalCredit,
        currentCredit: credit.totalCredit,
      };
    }
  }

  const donationRates = {
    threshold: federal.donationCredit.lowRateThreshold,
    federal: {
      lowRate: federal.donationCredit.lowRate,
      highRate: federal.donationCredit.highRate,
    },
    provincial: {
      lowRate: province.donationCredit.lowRate,
      highRate: province.donationCredit.highRate,
    },
  };

  return {
    input: { provinceCode, provinceName: province.name, income, donationAmount },
    tax,
    credit,
    usability,
    minimumIncome,
    nudge,
    donationRates,
    appSettings,
  };
}
