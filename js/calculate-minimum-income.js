import { calculateTotalTax } from "./calculate-total-tax.js";

/**
 * Calculate the minimum income needed to fully use a given credit amount.
 * Uses binary search to find the income that produces a total tax
 * equal to the target credit.
 * @param {number} targetTax - The credit amount that needs to be absorbed
 * @param {object} federalConfig - Federal tax config
 * @param {object} provinceConfig - Provincial tax config
 * @returns {number} Approximate minimum income (within $100)
 */
export function calculateMinimumIncome(targetTax, federalConfig, provinceConfig) {
  if (targetTax <= 0) return 0;

  let low = 0;
  let high = 500000;

  // Expand upper bound if needed
  while (calculateTotalTax(high, federalConfig, provinceConfig).totalTax < targetTax) {
    high *= 2;
  }

  // Binary search
  while (high - low > 100) {
    const mid = Math.floor((low + high) / 2);
    const tax = calculateTotalTax(mid, federalConfig, provinceConfig).totalTax;

    if (tax < targetTax) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.ceil((low + high) / 2);
}
