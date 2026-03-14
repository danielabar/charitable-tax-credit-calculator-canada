import { calculateDonationCredit } from "./calculate-donation-credit.js";
import { checkCreditUsability, UsabilityState } from "./check-credit-usability.js";

/**
 * Calculate threshold nudge hint.
 * Suggests a higher donation when the donor is at or near the $200 threshold
 * and their credit is fully usable.
 *
 * @param {number} donationAmount
 * @param {number} income
 * @param {object} federal - Federal config
 * @param {object} province - Province config
 * @param {object} appSettings - App settings (narrative thresholds)
 * @param {number} totalTax - Pre-calculated total tax
 * @param {string} usabilityState - Current credit usability state
 * @param {number} currentTotalCredit - Pre-calculated total credit for current donation
 * @returns {object|null} Nudge hint or null
 */
export function calculateNudge(donationAmount, income, federal, province, appSettings, totalTax, usabilityState, currentTotalCredit) {
  const threshold = federal.donationCredit.lowRateThreshold;
  const proximityPercent = appSettings.narrative.thresholdProximityPercent;

  if (
    usabilityState !== UsabilityState.FULLY_USABLE
    || donationAmount > threshold
    || donationAmount < threshold * proximityPercent
  ) {
    return null;
  }

  const nudgeAbovePercent = appSettings.narrative.nudgeAboveThresholdPercent;
  const nudgeAmount = Math.round(threshold * (1 + nudgeAbovePercent));
  const nudgeCredit = calculateDonationCredit(nudgeAmount, income, federal, province);
  const nudgeUsability = checkCreditUsability(nudgeCredit.totalCredit, totalTax, nudgeAmount);

  if (nudgeUsability.state !== UsabilityState.FULLY_USABLE) {
    return null;
  }

  return {
    hypotheticalAmount: nudgeAmount,
    hypotheticalCredit: nudgeCredit.totalCredit,
    currentCredit: currentTotalCredit,
  };
}
