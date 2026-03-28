import { calculateOntarioSurtax } from "./calculate-ontario-surtax.js";

/**
 * Calculate the surtax savings from a donation credit.
 * When a donation credit reduces provincial tax, it also reduces the surtax
 * (since surtax is calculated on provincial tax after credits).
 *
 * @param {number} provincialTax - Provincial tax before donation credit
 * @param {number} provincialCredit - Provincial donation credit amount
 * @param {object} surtaxConfig - Surtax config ({ thresholds: [...] })
 * @returns {object} { surtaxBefore, surtaxAfter, surtaxSavings }
 */
export function calculateSurtaxSavings(provincialTax, provincialCredit, surtaxConfig) {
  const surtaxBefore = calculateOntarioSurtax(provincialTax, surtaxConfig);
  const taxAfterCredit = Math.max(0, provincialTax - provincialCredit);
  const surtaxAfter = calculateOntarioSurtax(taxAfterCredit, surtaxConfig);
  const surtaxSavings = surtaxBefore - surtaxAfter;

  return { surtaxBefore, surtaxAfter, surtaxSavings };
}
