import { calculateBracketTax } from "./calculate-bracket-tax.js";

/**
 * Return the effective BPA for a given income, handling the federal phaseout.
 * Provincial configs pass a plain number (no phaseout) — returned as-is.
 * @param {number} income
 * @param {number|object} bpaConfig - number or { maximum, minimum, phaseoutStart, phaseoutEnd }
 * @returns {number}
 */
function getEffectiveBPA(income, bpaConfig) {
  if (typeof bpaConfig === "number") return bpaConfig;

  const { maximum, minimum, phaseoutStart, phaseoutEnd } = bpaConfig;
  if (income <= phaseoutStart) return maximum;
  if (income >= phaseoutEnd) return minimum;

  const additional = maximum - minimum;
  const reduction = additional * (income - phaseoutStart) / (phaseoutEnd - phaseoutStart);
  return maximum - reduction;
}

/**
 * Calculate federal income tax payable.
 * @param {number} income - Annual income
 * @param {object} federalConfig - Federal tax config (from federal.json)
 * @returns {number} Federal tax payable after BPA credit
 */
export function calculateFederalTax(income, federalConfig) {
  const { brackets, basicPersonalAmount } = federalConfig.incomeTax;

  const grossTax = calculateBracketTax(income, brackets);
  const effectiveBPA = getEffectiveBPA(income, basicPersonalAmount);
  const bpaCredit = effectiveBPA * brackets[0].rate;

  return Math.max(0, grossTax - bpaCredit);
}
