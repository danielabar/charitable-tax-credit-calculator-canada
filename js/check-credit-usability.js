/**
 * Determine how much of the donation credit is actually usable.
 * @param {number} totalCredit - Combined federal + provincial donation credit
 * @param {number} totalTax - Estimated total tax payable
 * @param {number} donationAmount - Original donation amount
 * @returns {object} {
 *   creditCalculated, estimatedTax, creditUsable, creditWasted,
 *   actualSavings, outOfPocketCost, state
 * }
 *   state: "O-1" (fully usable), "O-2" (partly wasted), "O-3" (entirely wasted)
 */
export function checkCreditUsability(totalCredit, totalTax, donationAmount) {
  const creditUsable = Math.min(totalCredit, totalTax);
  const creditWasted = Math.max(0, totalCredit - totalTax);
  const actualSavings = creditUsable;
  const outOfPocketCost = donationAmount - actualSavings;

  let state;
  if (totalTax === 0) {
    state = "O-3";
  } else if (creditWasted > 0) {
    state = "O-2";
  } else {
    state = "O-1";
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
