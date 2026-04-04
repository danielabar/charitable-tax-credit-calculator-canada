/**
 * Full calculation pipeline — orchestrates all modules.
 * Provides both forward ("I donated X, what do I get back?") and
 * reverse ("I want Y back, how much do I donate?") pipelines.
 */

import { loadFederalConfig, loadProvinceConfig, loadAppSettings } from "./load-config.js";
import { calculateTotalTax } from "./calculate-total-tax.js";
import { calculateDonationCredit } from "./calculate-donation-credit.js";
import { checkCreditUsability, UsabilityState } from "./check-credit-usability.js";
import { calculateMinimumIncome } from "./calculate-minimum-income.js";
import { calculateNudge } from "./calculate-nudge.js";
import { calculateDonationForRefund } from "./calculate-donation-for-refund.js";
import { calculateSurtaxSavings } from "./calculate-surtax-savings.js";
import { checkDonationClaimLimit } from "./check-donation-claim-limit.js";

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
 * @property {{ exceedsLimit: boolean }} claimLimit
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

  let surtaxSavings = 0;
  if (province.surtax) {
    surtaxSavings = calculateSurtaxSavings(tax.provincialTax, credit.provincialCredit, province.surtax).surtaxSavings;
  }
  credit.surtaxSavings = surtaxSavings;
  credit.effectiveTotalCredit = credit.totalCredit + surtaxSavings;

  const usability = checkCreditUsability(credit.effectiveTotalCredit, tax.totalTax, donationAmount);

  let minimumIncome = null;
  if (usability.state === UsabilityState.PARTLY_WASTED || usability.state === UsabilityState.ENTIRELY_WASTED) {
    minimumIncome = calculateMinimumIncome(credit.effectiveTotalCredit, federal, province);
  }

  const nudge = calculateNudge(
    donationAmount, income, federal, province, appSettings,
    tax.totalTax, tax.provincialTax, usability.state, credit.effectiveTotalCredit
  );

  const claimLimit = checkDonationClaimLimit(donationAmount, income, appSettings.donationClaimLimitPercent);

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
    claimLimit,
    donationRates,
    appSettings,
  };
}

/**
 * @typedef {object} ReverseCalculationResults
 * @property {'reverse'} mode
 * @property {object} input
 * @property {string} input.provinceCode
 * @property {string} input.provinceName
 * @property {number} input.income
 * @property {number} input.desiredRefund
 * @property {number} donationNeeded - The central answer: how much to donate
 * @property {object} tax
 * @property {object} credit
 * @property {object} usability
 * @property {number|null} minimumIncome
 * @property {object} donationRates
 */

/**
 * Run the reverse calculation pipeline.
 * Given a desired refund, compute the donation needed and check usability.
 * @param {string} provinceCode
 * @param {number} income
 * @param {number} desiredRefund
 * @returns {Promise<ReverseCalculationResults>}
 */
export async function runReverseCalculation(provinceCode, income, desiredRefund) {
  const [federal, province] = await Promise.all([
    loadFederalConfig(),
    loadProvinceConfig(provinceCode),
  ]);

  // 1. How much to donate for the desired refund (assumes full taxpayer)
  const donationNeeded = calculateDonationForRefund(desiredRefund, federal, province);

  // 2. What tax does this person owe?
  const tax = calculateTotalTax(income, federal, province);

  // 3. What credit does this donation actually generate?
  const credit = calculateDonationCredit(donationNeeded, income, federal, province);

  let surtaxSavings = 0;
  if (province.surtax) {
    surtaxSavings = calculateSurtaxSavings(tax.provincialTax, credit.provincialCredit, province.surtax).surtaxSavings;
  }
  credit.surtaxSavings = surtaxSavings;
  credit.effectiveTotalCredit = credit.totalCredit + surtaxSavings;

  // 4. Can they use the full credit?
  const usability = checkCreditUsability(credit.effectiveTotalCredit, tax.totalTax, donationNeeded);

  // 5. If not fully usable, what income would they need?
  let minimumIncome = null;
  if (usability.state !== UsabilityState.FULLY_USABLE) {
    minimumIncome = calculateMinimumIncome(credit.totalCredit, federal, province);
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
    mode: 'reverse',
    input: { provinceCode, provinceName: province.name, income, desiredRefund },
    donationNeeded,
    tax,
    credit,
    usability,
    minimumIncome,
    donationRates,
  };
}
