/**
 * Build warning banner HTML for REVERSE calculator mode.
 *
 * This module handles the reverse question: "I want $Y back — how much do I donate?"
 * For the forward question ("I donated $X — what do I get back?"), see narrative.js.
 *
 * Separated from narrative.js for clarity — each file handles one calculator mode
 * with no conditional branching on mode scattered throughout.
 *
 * Returns HTML for contextual warning banners shown in the slider widget:
 * - Fully usable: empty string (no warning needed)
 * - Partly wasted: amber banner explaining capped refund
 * - Entirely wasted: red banner explaining non-refundable credit
 */

import { formatCurrency } from "../format.js";

/**
 * Build the warning banner HTML for the reverse slider, or empty string if fully usable.
 * @param {import('../calculator.js').ReverseCalculationResults} results
 * @returns {string} HTML string (warning banner or empty)
 */
export function buildReverseWarning(results) {
  const { usability, input, minimumIncome } = results;

  if (usability.state === "fully-usable") {
    return "";
  }

  if (usability.state === "entirely-wasted") {
    return `<div class="slider-warning">
      <strong>Not possible at your income.</strong>
      At ${formatCurrency(input.income)}, you don't owe any income tax.
      The charitable tax credit is non-refundable — it can only reduce tax you owe.
      You'd need to earn approximately <strong>${formatCurrency(minimumIncome)}</strong>
      to get ${formatCurrency(input.desiredRefund)} back.
      <a href="learn" data-route="/learn" class="learn-link">Learn why income determines your refund <span class="arrow">&rarr;</span></a>
    </div>`;
  }

  // partly-wasted
  return `<div class="slider-partial-warning">
    <strong>You can only get ${formatCurrency(usability.creditUsable)} back at your income.</strong>
    You owe ${formatCurrency(usability.estimatedTax)} in tax — that's the most the credit can reduce.
    To get the full ${formatCurrency(input.desiredRefund)}, you'd need to earn approximately
    <strong>${formatCurrency(minimumIncome)}</strong>.
    <a href="learn" data-route="/learn" class="learn-link">Learn why income determines your refund <span class="arrow">&rarr;</span></a>
  </div>`;
}
