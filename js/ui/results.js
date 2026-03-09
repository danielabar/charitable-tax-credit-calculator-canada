/**
 * Render calculation results into the DOM.
 * Uses HTML sub-templates from templates/ directory.
 */

import { loadTemplate, fillTemplate } from "./template-loader.js";
import { formatCurrency, formatPercent } from "../format.js";
import { buildNarrative } from "./narrative.js";
import { UsabilityState } from "../check-credit-usability.js";

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
    case UsabilityState.FULLY_USABLE:
      return {
        cardClass: "",
        colorClass: "positive",
        headlineLabel: `Your ${donation} donation to charity`,
        headlineNumber: `Actually costs you ${outOfPocket}`,
        headlineContext: `The tax credit saves you ${savings}, reducing your out-of-pocket cost by ${savingsPercent}.`,
      };
    case UsabilityState.PARTLY_WASTED:
      return {
        cardClass: "",
        colorClass: "positive",
        headlineLabel: `Your ${donation} donation to charity`,
        headlineNumber: `Will save you ${savings} on taxes`,
        headlineContext: `Your credit is ${formatCurrency(credit.totalCredit)}, but you can only use ${savings} of it. The remaining ${formatCurrency(usability.creditWasted)} can't be refunded.`,
      };
    case UsabilityState.ENTIRELY_WASTED:
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
 */
async function buildSummaryGrid(results) {
  const { input, tax, credit, usability } = results;
  const [gridTemplate, itemTemplate] = await Promise.all([
    loadTemplate("templates/summary-grid.html"),
    loadTemplate("templates/summary-item.html"),
  ]);

  let items;
  let gridClass;

  switch (usability.state) {
    case UsabilityState.FULLY_USABLE:
      gridClass = "summary-grid three-col";
      items = [
        { label: "Federal credit", value: formatCurrency(credit.federalCredit), className: "teal" },
        { label: `${input.provinceName} credit`, value: formatCurrency(credit.provincialCredit), className: "teal" },
        { label: "Total credit", value: formatCurrency(credit.totalCredit), className: "teal" },
      ];
      break;
    case UsabilityState.PARTLY_WASTED:
      gridClass = "summary-grid";
      items = [
        { label: "Credit calculated", value: formatCurrency(credit.totalCredit), className: "teal" },
        { label: "Your estimated tax", value: formatCurrency(tax.totalTax), className: "muted" },
        { label: "Credit you can use", value: formatCurrency(usability.creditUsable), className: "teal" },
        { label: "Credit wasted", value: formatCurrency(usability.creditWasted), className: "red", highlight: true },
      ];
      break;
    case UsabilityState.ENTIRELY_WASTED:
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
    return fillTemplate(itemTemplate, { itemClass, label, value, className: className || "" });
  }).join("\n");

  return fillTemplate(gridTemplate, { gridClass, items: itemsHtml });
}

/**
 * Build the bar chart HTML based on state.
 */
async function buildBarChart(results) {
  const { input, credit, usability } = results;

  if (usability.state === UsabilityState.ENTIRELY_WASTED) {
    return "";
  }

  const donation = formatCurrency(input.donationAmount);
  const [chartTemplate, segmentTemplate, legendTemplate] = await Promise.all([
    loadTemplate("templates/bar-chart.html"),
    loadTemplate("templates/bar-segment.html"),
    loadTemplate("templates/legend-item.html"),
  ]);

  switch (usability.state) {
    case UsabilityState.FULLY_USABLE: {
      const costPercent = Math.round((usability.outOfPocketCost / input.donationAmount) * 100);
      const creditPercent = 100 - costPercent;
      const segments = [
        fillTemplate(segmentTemplate, { segmentClass: "cost", width: String(costPercent), segmentLabel: `${formatCurrency(usability.outOfPocketCost)} your cost` }),
        fillTemplate(segmentTemplate, { segmentClass: "usable", width: String(creditPercent), segmentLabel: `${formatCurrency(credit.totalCredit)} credit` }),
      ].join("\n");
      const legend = [
        fillTemplate(legendTemplate, { legendClass: "cost", legendLabel: "Your actual cost" }),
        fillTemplate(legendTemplate, { legendClass: "usable", legendLabel: "Tax credit (savings)" }),
      ].join("\n");
      return fillTemplate(chartTemplate, { barLabel: `How your ${donation} donation breaks down`, segments, legend });
    }
    case UsabilityState.PARTLY_WASTED: {
      const usablePercent = Math.round((usability.creditUsable / credit.totalCredit) * 100);
      const wastedPercent = 100 - usablePercent;
      const segments = [
        fillTemplate(segmentTemplate, { segmentClass: "usable", width: String(usablePercent), segmentLabel: `${formatCurrency(usability.creditUsable)} usable` }),
        fillTemplate(segmentTemplate, { segmentClass: "wasted", width: String(wastedPercent), segmentLabel: `${formatCurrency(usability.creditWasted)} wasted` }),
      ].join("\n");
      const legend = [
        fillTemplate(legendTemplate, { legendClass: "usable", legendLabel: "Credit you can use" }),
        fillTemplate(legendTemplate, { legendClass: "wasted", legendLabel: "Credit that disappears" }),
      ].join("\n");
      return fillTemplate(chartTemplate, { barLabel: `Your ${formatCurrency(credit.totalCredit)} credit vs. your ${formatCurrency(usability.estimatedTax)} tax`, segments, legend });
    }
  }
}

/**
 * Render results into the results container.
 * @param {import('../calculator.js').CalculationResults} results
 */
export async function renderResults(results) {
  const container = document.getElementById("results-container");
  const [bigNumberTemplate, disclaimerHtml] = await Promise.all([
    loadTemplate("templates/big-number.html"),
    loadTemplate("templates/disclaimer.html"),
  ]);

  const headline = buildHeadline(results);
  const bigNumberHtml = fillTemplate(bigNumberTemplate, headline);
  const [summaryHtml, barHtml, narrativeHtml] = await Promise.all([
    buildSummaryGrid(results),
    buildBarChart(results),
    buildNarrative(results),
  ]);

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
