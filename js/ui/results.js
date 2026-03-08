/**
 * Render calculation results into the DOM.
 * Uses HTML sub-templates from templates/ directory.
 */

import { loadTemplate } from "./template-loader.js";
import { formatCurrency, formatPercent } from "../format.js";
import { buildNarrative } from "./narrative.js";

/**
 * Replace {{placeholders}} in a template string.
 */
function fillTemplate(html, data) {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

/**
 * Build the big-number headline data based on usability state.
 */
function buildHeadline(results) {
  const { input, credit, usability } = results;
  const donation = formatCurrency(input.donationAmount);
  const savings = formatCurrency(usability.actualSavings);
  const outOfPocket = formatCurrency(usability.outOfPocketCost);
  const savingsPercent = formatPercent(usability.actualSavings / input.donationAmount);

  switch (usability.state) {
    case "O-1":
      return {
        cardClass: "",
        colorClass: "positive",
        headlineLabel: `Your ${donation} donation to charity`,
        headlineNumber: `Actually costs you ${outOfPocket}`,
        headlineContext: `The tax credit saves you ${savings}, reducing your out-of-pocket cost by ${savingsPercent}.`,
      };
    case "O-2":
      return {
        cardClass: "",
        colorClass: "positive",
        headlineLabel: `Your ${donation} donation to charity`,
        headlineNumber: `Will save you ${savings} on taxes`,
        headlineContext: `Your credit is ${formatCurrency(credit.totalCredit)}, but you can only use ${savings} of it. The remaining ${formatCurrency(usability.creditWasted)} can't be refunded.`,
      };
    case "O-3":
      return {
        cardClass: "big-number-card--warning",
        colorClass: "warning",
        headlineLabel: `Your ${donation} donation to charity`,
        headlineNumber: "Won't reduce your taxes this year",
        headlineContext: "Based on your income, you don't owe enough tax to benefit from the credit. But you have options.",
      };
  }
}

/**
 * Build the summary grid HTML based on state.
 * Matches the mockup layout exactly.
 */
function buildSummaryGrid(results) {
  const { input, tax, credit, usability } = results;

  let items;
  let gridClass;

  switch (usability.state) {
    case "O-1":
      // 3-col: federal credit, provincial credit, total credit
      gridClass = "summary-grid three-col";
      items = [
        { label: "Federal credit", value: formatCurrency(credit.federalCredit), className: "teal" },
        { label: `${input.provinceName} credit`, value: formatCurrency(credit.provincialCredit), className: "teal" },
        { label: "Total credit", value: formatCurrency(credit.totalCredit), className: "teal" },
      ];
      break;
    case "O-2":
      // 2-col, 4 items: credit calculated, estimated tax, credit usable, credit wasted
      gridClass = "summary-grid";
      items = [
        { label: "Credit calculated", value: formatCurrency(credit.totalCredit), className: "teal" },
        { label: "Your estimated tax", value: formatCurrency(tax.totalTax), className: "muted" },
        { label: "Credit you can use", value: formatCurrency(usability.creditUsable), className: "teal" },
        { label: "Credit wasted", value: formatCurrency(usability.creditWasted), className: "red", highlight: true },
      ];
      break;
    case "O-3":
      // 2-col, 4 items: credit calculated, estimated tax, credit usable, credit wasted
      gridClass = "summary-grid";
      items = [
        { label: "Credit calculated", value: formatCurrency(credit.totalCredit), className: "muted" },
        { label: "Your estimated tax", value: formatCurrency(tax.totalTax), className: "muted" },
        { label: "Credit you can use", value: "$0", className: "muted" },
        { label: "Credit wasted", value: formatCurrency(credit.totalCredit), className: "red", highlight: true },
      ];
      break;
  }

  const itemsHtml = items.map(({ label, value, className, highlight }) => {
    const itemClass = highlight ? "summary-item highlight-bad" : "summary-item";
    return `<div class="${itemClass}">
      <div class="label">${label}</div>
      <div class="value ${className || ""}">${value}</div>
    </div>`;
  }).join("\n");

  return `<div class="${gridClass}">${itemsHtml}</div>`;
}

/**
 * Build the bar chart HTML based on state.
 */
function buildBarChart(results) {
  const { input, credit, usability } = results;
  const donation = formatCurrency(input.donationAmount);

  switch (usability.state) {
    case "O-1": {
      // Cost vs credit breakdown
      const costPercent = Math.round((usability.outOfPocketCost / input.donationAmount) * 100);
      const creditPercent = 100 - costPercent;
      return `<div class="bar-chart">
        <div class="bar-label">How your ${donation} donation breaks down</div>
        <div class="bar-wrapper">
          <div class="bar-segment cost" style="width:${costPercent}%">${formatCurrency(usability.outOfPocketCost)} your cost</div>
          <div class="bar-segment usable" style="width:${creditPercent}%">${formatCurrency(credit.totalCredit)} credit</div>
        </div>
        <div class="bar-legend">
          <span class="legend-cost">Your actual cost</span>
          <span class="legend-usable">Tax credit (savings)</span>
        </div>
      </div>`;
    }
    case "O-2": {
      // Usable vs wasted credit
      const usablePercent = Math.round((usability.creditUsable / credit.totalCredit) * 100);
      const wastedPercent = 100 - usablePercent;
      return `<div class="bar-chart">
        <div class="bar-label">Your ${formatCurrency(credit.totalCredit)} credit vs. your ${formatCurrency(usability.estimatedTax)} tax</div>
        <div class="bar-wrapper">
          <div class="bar-segment usable" style="width:${usablePercent}%">${formatCurrency(usability.creditUsable)} usable</div>
          <div class="bar-segment wasted" style="width:${wastedPercent}%">${formatCurrency(usability.creditWasted)} wasted</div>
        </div>
        <div class="bar-legend">
          <span class="legend-usable">Credit you can use</span>
          <span class="legend-wasted">Credit that disappears</span>
        </div>
      </div>`;
    }
    case "O-3":
      // No bar for entirely wasted — the message is clear enough
      return "";
  }
}

/**
 * Render results into the results container.
 * @param {object} results - The full results object from runCalculation
 */
export async function renderResults(results) {
  const container = document.getElementById("results-container");
  const [bigNumberTemplate, disclaimerHtml] = await Promise.all([
    loadTemplate("templates/big-number.html"),
    loadTemplate("templates/disclaimer.html"),
  ]);

  const headline = buildHeadline(results);
  const bigNumberHtml = fillTemplate(bigNumberTemplate, headline);
  const summaryHtml = buildSummaryGrid(results);
  const barHtml = buildBarChart(results);
  const narrativeHtml = buildNarrative(results);

  container.innerHTML = `
    <div class="results-section">
      ${bigNumberHtml}
      ${summaryHtml}
      ${barHtml}
      ${narrativeHtml}
      ${disclaimerHtml}
    </div>
  `;
}
