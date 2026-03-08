/**
 * Calculate charitable donation tax credit (federal + provincial).
 * @param {number} donationAmount - Total eligible donations
 * @param {object} federalConfig - Federal config (for federal credit rates)
 * @param {object} provinceConfig - Provincial config (for provincial credit rates)
 * @returns {object} { federalCredit, provincialCredit, totalCredit }
 */
export function calculateDonationCredit(donationAmount, federalConfig, provinceConfig) {
  const federalCredit = calculateTierCredit(donationAmount, federalConfig.donationCredit);
  const provincialCredit = calculateTierCredit(donationAmount, provinceConfig.donationCredit);
  const totalCredit = federalCredit + provincialCredit;

  return { federalCredit, provincialCredit, totalCredit };
}

function calculateTierCredit(amount, creditConfig) {
  const { lowRate, highRate, lowRateThreshold } = creditConfig;
  const lowPortion = Math.min(amount, lowRateThreshold);
  const highPortion = Math.max(0, amount - lowRateThreshold);

  return lowPortion * lowRate + highPortion * highRate;
}
