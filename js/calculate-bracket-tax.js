/**
 * Calculate tax using progressive brackets.
 * Shared logic used by both federal and provincial calculations.
 * @param {number} income - Annual income
 * @param {Array} brackets - Tax brackets array
 * @returns {number} Gross tax before credits
 */
export function calculateBracketTax(income, brackets) {
  let tax = 0;
  let previousLimit = 0;

  for (const bracket of brackets) {
    const limit = bracket.upTo ?? Infinity;
    const taxableInBracket = Math.min(income, limit) - previousLimit;

    if (taxableInBracket <= 0) break;

    tax += taxableInBracket * bracket.rate;
    previousLimit = limit;
  }

  return tax;
}
