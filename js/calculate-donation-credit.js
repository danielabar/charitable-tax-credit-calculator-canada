/**
 * Calculate charitable donation tax credit (federal + provincial).
 * @param {number} donationAmount - Total eligible donations
 * @param {number} income - Taxable income (needed for federal top-bracket 33% rule)
 * @param {object} federalConfig - Federal config (for federal credit rates)
 * @param {object} provinceConfig - Provincial config (for provincial credit rates)
 * @returns {object} { federalCredit, provincialCredit, totalCredit, topBracketPortion }
 */
export function calculateDonationCredit(donationAmount, income, federalConfig, provinceConfig) {
  const { federalCredit, topBracketPortion } = calculateFederalCredit(donationAmount, income, federalConfig.donationCredit);
  const provincialCredit = calculateTierCredit(donationAmount, provinceConfig.donationCredit);
  const totalCredit = federalCredit + provincialCredit;

  return { federalCredit, provincialCredit, totalCredit, topBracketPortion };
}

/**
 * Federal donation credit with 3-tier logic (33% top bracket rule).
 * - lowRate on first $200
 * - topRate (33%) on the portion over $200 that corresponds to income in the top bracket
 * - highRate (29%) on any remaining amount over $200
 */
function calculateFederalCredit(amount, income, creditConfig) {
  const { lowRate, highRate, topRate, topRateThreshold, lowRateThreshold } = creditConfig;

  const lowPortion = Math.min(amount, lowRateThreshold);
  const highPortion = Math.max(0, amount - lowRateThreshold);

  // If no top rate in config, or income doesn't reach the top bracket, use standard 2-tier
  if (!topRate || !topRateThreshold || income <= topRateThreshold) {
    return {
      federalCredit: lowPortion * lowRate + highPortion * highRate,
      topBracketPortion: 0,
    };
  }

  // Income above the top bracket threshold — apply 33% to eligible portion
  const topBracketIncome = income - topRateThreshold;
  const topPortion = Math.min(highPortion, topBracketIncome);
  const remainingHighPortion = highPortion - topPortion;

  return {
    federalCredit: lowPortion * lowRate + topPortion * topRate + remainingHighPortion * highRate,
    topBracketPortion: topPortion,
  };
}

/**
 * Standard 2-tier credit calculation (used for provincial credits).
 */
function calculateTierCredit(amount, creditConfig) {
  const { lowRate, highRate, lowRateThreshold } = creditConfig;
  const lowPortion = Math.min(amount, lowRateThreshold);
  const highPortion = Math.max(0, amount - lowRateThreshold);

  return lowPortion * lowRate + highPortion * highRate;
}
