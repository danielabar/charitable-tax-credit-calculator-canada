/**
 * Check if a donation exceeds the CRA annual claiming limit.
 * @param {number} donation
 * @param {number} income - The user's entered income (gross, not net)
 * @param {number} limitPercent - e.g. 0.75
 * @returns {{ exceedsLimit: boolean }}
 */
export function checkDonationClaimLimit(donation, income, limitPercent) {
  return {
    exceedsLimit: income > 0 && donation > income * limitPercent,
  };
}
