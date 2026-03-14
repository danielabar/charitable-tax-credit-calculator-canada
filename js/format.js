/**
 * Format a number as currency with dollars and cents.
 * @param {number} amount
 * @returns {string} e.g. "$1,234.56"
 */
export function formatCurrency(amount) {
  return "$" + amount.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a percentage (no decimals).
 * @param {number} ratio - e.g. 0.32
 * @returns {string} e.g. "32%"
 */
export function formatPercent(ratio) {
  return Math.round(ratio * 100) + "%";
}
