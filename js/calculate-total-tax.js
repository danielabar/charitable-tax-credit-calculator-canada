import { calculateFederalTax } from "./calculate-federal-tax.js";
import { calculateProvincialTax } from "./calculate-provincial-tax.js";
import { calculateOntarioSurtax } from "./calculate-ontario-surtax.js";

/**
 * Calculate total estimated tax payable (federal + provincial + surtax).
 * @param {number} income - Annual income
 * @param {object} federalConfig - Federal tax config
 * @param {object} provinceConfig - Provincial tax config
 * @returns {object} { federalTax, provincialTax, surtax, totalTax }
 */
export function calculateTotalTax(income, federalConfig, provinceConfig) {
  const federalTax = calculateFederalTax(income, federalConfig);
  const provincialTax = calculateProvincialTax(income, provinceConfig);
  const surtax = provinceConfig.surtax
    ? calculateOntarioSurtax(provincialTax, provinceConfig.surtax)
    : 0;
  const totalTax = federalTax + provincialTax + surtax;

  return { federalTax, provincialTax, surtax, totalTax };
}
