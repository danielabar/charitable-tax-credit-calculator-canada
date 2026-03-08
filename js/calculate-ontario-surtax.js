/**
 * Calculate Ontario surtax.
 * @param {number} basicProvincialTax - Ontario basic provincial tax (before surtax)
 * @param {object} surtaxConfig - Ontario surtax config ({ thresholds: [...] })
 * @returns {number} Surtax amount
 */
export function calculateOntarioSurtax(basicProvincialTax, surtaxConfig) {
  let surtax = 0;

  for (const { over, rate } of surtaxConfig.thresholds) {
    const excess = basicProvincialTax - over;
    if (excess > 0) {
      surtax += excess * rate;
    }
  }

  return surtax;
}
