import { calculateBracketTax } from "./calculate-bracket-tax.js";

/**
 * Calculate federal income tax payable.
 * @param {number} income - Annual income
 * @param {object} federalConfig - Federal tax config (from federal.json)
 * @returns {number} Federal tax payable after BPA credit
 */
export function calculateFederalTax(income, federalConfig) {
  const { brackets, basicPersonalAmount } = federalConfig.incomeTax;

  const grossTax = calculateBracketTax(income, brackets);
  const bpaCredit = basicPersonalAmount * brackets[0].rate;

  return Math.max(0, grossTax - bpaCredit);
}
