import { calculateBracketTax } from "./calculate-bracket-tax.js";

/**
 * Calculate provincial income tax payable (before surtax).
 * @param {number} income - Annual income
 * @param {object} provinceConfig - Provincial tax config (from XX.json)
 * @returns {number} Provincial tax payable after BPA credit (before surtax)
 */
export function calculateProvincialTax(income, provinceConfig) {
  const { brackets, basicPersonalAmount } = provinceConfig.incomeTax;

  const grossTax = calculateBracketTax(income, brackets);
  const bpaCredit = basicPersonalAmount * brackets[0].rate;

  return Math.max(0, grossTax - bpaCredit);
}
