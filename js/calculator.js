/**
 * Full calculation pipeline — orchestrates all modules.
 */

import { loadFederalConfig, loadProvinceConfig, loadAppSettings } from "./load-config.js";
import { calculateTotalTax } from "./calculate-total-tax.js";
import { calculateDonationCredit } from "./calculate-donation-credit.js";
import { checkCreditUsability, UsabilityState } from "./check-credit-usability.js";
import { calculateMinimumIncome } from "./calculate-minimum-income.js";
import { calculateNudge } from "./calculate-nudge.js";

/**
 * @typedef {object} CalculationResults
 * @property {object} input
 * @property {string} input.provinceCode - e.g., "ON"
 * @property {string} input.provinceName - e.g., "Ontario"
 * @property {number} input.income
 * @property {number} input.donationAmount
 * @property {object} tax
 * @property {number} tax.federalTax
 * @property {number} tax.provincialTax
 * @property {number} tax.surtax
 * @property {number} tax.totalTax
 * @property {object} credit
 * @property {number} credit.federalCredit
 * @property {number} credit.provincialCredit
 * @property {number} credit.totalCredit
 * @property {number} credit.topBracketPortion - Amount of donation that received the 33% top bracket rate (0 if not applicable)
 * @property {object} usability
 * @property {number} usability.creditCalculated
 * @property {number} usability.estimatedTax
 * @property {number} usability.creditUsable
 * @property {number} usability.creditWasted
 * @property {number} usability.actualSavings
 * @property {number} usability.outOfPocketCost
 * @property {string} usability.state - "fully-usable" | "partly-wasted" | "entirely-wasted"
 * @property {number|null} minimumIncome - Income needed to fully use the credit (null if fully usable)
 * @property {object|null} nudge - Threshold nudge hint (null if not applicable)
 * @property {number} nudge.hypotheticalAmount
 * @property {number} nudge.hypotheticalCredit
 * @property {number} nudge.currentCredit
 * @property {object} donationRates
 * @property {number} donationRates.threshold
 * @property {{lowRate: number, highRate: number, topRate: number, topRateThreshold: number}} donationRates.federal
 * @property {{lowRate: number, highRate: number}} donationRates.provincial
 * @property {object} appSettings
 */

/**
 * Run the full calculation pipeline.
 * @param {string} provinceCode - e.g., "ON"
 * @param {number} income
 * @param {number} donationAmount
 * @returns {Promise<CalculationResults>}
 */
export async function runCalculation(provinceCode, income, donationAmount) {
  const [federal, province, appSettings] = await Promise.all([
    loadFederalConfig(),
    loadProvinceConfig(provinceCode),
    loadAppSettings(),
  ]);

  const tax = calculateTotalTax(income, federal, province);
  const credit = calculateDonationCredit(donationAmount, income, federal, province);
  const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, donationAmount);

  let minimumIncome = null;
  if (usability.state === UsabilityState.PARTLY_WASTED || usability.state === UsabilityState.ENTIRELY_WASTED) {
    minimumIncome = calculateMinimumIncome(credit.totalCredit, federal, province);
  }

  const nudge = calculateNudge(
    donationAmount, income, federal, province, appSettings,
    tax.totalTax, usability.state, credit.totalCredit
  );

  const donationRates = {
    threshold: federal.donationCredit.lowRateThreshold,
    federal: {
      lowRate: federal.donationCredit.lowRate,
      highRate: federal.donationCredit.highRate,
      topRate: federal.donationCredit.topRate,
      topRateThreshold: federal.donationCredit.topRateThreshold,
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
