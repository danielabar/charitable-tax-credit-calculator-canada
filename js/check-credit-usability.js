/**
 * Usability states for donation tax credits.
 * Describes whether a donor's non-refundable credit can actually reduce their tax.
 */
export const UsabilityState = Object.freeze({
  /** Credit ≤ tax — the full credit reduces tax owing, nothing wasted */
  FULLY_USABLE: 'fully-usable',
  /** Credit > tax, but tax > 0 — some of the credit is lost */
  PARTLY_WASTED: 'partly-wasted',
  /** Tax = $0 — the entire credit is lost (no tax to offset) */
  ENTIRELY_WASTED: 'entirely-wasted',
});

/**
 * Determine how much of the donation credit is actually usable.
 * @param {number} totalCredit - Combined federal + provincial donation credit
 * @param {number} totalTax - Estimated total tax payable
 * @param {number} donationAmount - Original donation amount
 * @returns {object} {
 *   creditCalculated, estimatedTax, creditUsable, creditWasted,
 *   actualSavings, outOfPocketCost, state
 * }
 *   state: one of UsabilityState values
 */
export function checkCreditUsability(totalCredit, totalTax, donationAmount) {
  const creditUsable = Math.min(totalCredit, totalTax);
  const creditWasted = Math.max(0, totalCredit - totalTax);
  const actualSavings = creditUsable;
  const outOfPocketCost = donationAmount - actualSavings;

  let state;
  if (totalTax === 0) {
    state = UsabilityState.ENTIRELY_WASTED;
  } else if (creditWasted > 0) {
    state = UsabilityState.PARTLY_WASTED;
  } else {
    state = UsabilityState.FULLY_USABLE;
  }

  return {
    creditCalculated: totalCredit,
    estimatedTax: totalTax,
    creditUsable,
    creditWasted,
    actualSavings,
    outOfPocketCost,
    state,
  };
}
