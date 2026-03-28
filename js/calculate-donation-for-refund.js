/**
 * Given a desired refund amount, compute the donation needed.
 * Inverse of the donation credit calculation (federal + provincial combined).
 *
 * TODO (#28): Does not account for Ontario surtax savings — for surtax-range
 * donors, the donation needed is actually less than what this returns (conservative).
 *
 * @param {number} desiredRefund - The amount the donor wants back
 * @param {object} federalConfig - Federal config (donationCredit rates)
 * @param {object} provinceConfig - Provincial config (donationCredit rates)
 * @returns {number} Donation amount needed (rounded up to nearest dollar)
 */
export function calculateDonationForRefund(desiredRefund, federalConfig, provinceConfig) {
  const lowRate = federalConfig.donationCredit.lowRate + provinceConfig.donationCredit.lowRate;
  const highRate = federalConfig.donationCredit.highRate + provinceConfig.donationCredit.highRate;
  const threshold = federalConfig.donationCredit.lowRateThreshold;

  const maxCreditFromLowTier = threshold * lowRate;

  if (desiredRefund <= maxCreditFromLowTier) {
    return Math.ceil(desiredRefund / lowRate);
  }

  const remaining = desiredRefund - maxCreditFromLowTier;
  return Math.ceil(threshold + remaining / highRate);
}
