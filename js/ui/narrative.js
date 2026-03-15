/**
 * Build the "Your story in numbers" narrative HTML.
 * Sections are conditionally included based on usability state.
 * Uses HTML sub-templates from templates/ directory.
 */

import { formatCurrency } from "../format.js";
import { UsabilityState } from "../check-credit-usability.js";
import { loadTemplate, fillTemplate } from "./template-loader.js";

/**
 * Format a rate as a percentage string (e.g. 0.14 → "14%", 0.0505 → "5.05%").
 */
function fmtRate(rate) {
  const pct = rate * 100;
  return pct % 1 === 0 ? `${pct}%` : `${parseFloat(pct.toFixed(2))}%`;
}

/**
 * Shorthand for formatCurrency in narrative text.
 */
const $ = formatCurrency;

/**
 * Load and fill a narrative section template.
 */
async function section(narrativeId, content) {
  const template = await loadTemplate("templates/narrative-section.html");
  return fillTemplate(template, { narrativeId, content });
}

/**
 * Load and fill a callout template.
 */
async function callout(variant, content, dataNarrative) {
  const template = await loadTemplate("templates/callout.html");
  const attributes = dataNarrative ? ` data-narrative="${dataNarrative}"` : "";
  return fillTemplate(template, { variant, content, attributes });
}

/**
 * Build the complete narrative section HTML.
 * @param {import('../calculator.js').CalculationResults} results
 * @returns {Promise<string>} HTML string
 */
export async function buildNarrative(results) {
  const [narrativeTemplate, sectionResults] = await Promise.all([
    loadTemplate("templates/narrative.html"),
    buildAllSections(results),
  ]);
  return fillTemplate(narrativeTemplate, { sections: sectionResults });
}

async function buildAllSections(results) {
  const sections = [];

  sections.push(await buildTaxSituationSection(results));
  sections.push(await buildBasicMathSection(results));

  if (results.nudge) {
    sections.push(await buildThresholdNudgeSection(results));
  }

  if (results.usability.state === UsabilityState.PARTLY_WASTED || results.usability.state === UsabilityState.ENTIRELY_WASTED) {
    sections.push(await buildNonRefundableSection(results));
    sections.push(await buildCarryForwardSection(results));
    sections.push(await buildMinimumIncomeSection(results));
  }

  if (results.usability.state === UsabilityState.ENTIRELY_WASTED) {
    sections.push(await buildClosingSection());
  }

  return sections.join("\n");
}

async function buildBasicMathSection(results) {
  const { input, credit, donationRates } = results;
  const { donationAmount } = input;
  const { threshold, federal } = donationRates;
  const provRate = donationRates.provincial;

  if (donationAmount <= threshold) {
    const body = `<p>You donated <span class="hl">${$(donationAmount)}</span>. The federal credit is ${fmtRate(federal.lowRate)}, which equals <span class="hl">${$(credit.federalCredit)}</span>. The ${input.provinceName} credit is ${fmtRate(provRate.lowRate)}, which equals <span class="hl">${$(credit.provincialCredit)}</span>. Your combined credit is <span class="hl-teal">${$(credit.totalCredit)}</span>.</p>`;
    return section("basic-math", `<h3>How your credit is calculated</h3>\n${body}`);
  }

  const lowPortion = threshold;
  const highPortion = donationAmount - threshold;

  let federalBreakdown;
  if (credit.topBracketPortion > 0) {
    const fedLowCredit = lowPortion * federal.lowRate;
    const fedTopCredit = credit.topBracketPortion * federal.topRate;
    const remainingHighPortion = highPortion - credit.topBracketPortion;
    const fedHighCredit = remainingHighPortion * federal.highRate;

    if (remainingHighPortion > 0) {
      // Split: some at 33%, some at 29%
      federalBreakdown = `<p>You donated <span class="hl">${$(donationAmount)}</span>. The federal credit rate on the first $${threshold} is ${fmtRate(federal.lowRate)}, which equals <span class="hl">${$(fedLowCredit)}</span>. Because your income is above <span class="hl">${$(federal.topRateThreshold)}</span>, <span class="hl">${$(credit.topBracketPortion)}</span> of the remainder qualifies for the higher ${fmtRate(federal.topRate)} rate (<span class="hl">${$(fedTopCredit)}</span>). The remaining <span class="hl">${$(remainingHighPortion)}</span> is at ${fmtRate(federal.highRate)} (<span class="hl">${$(fedHighCredit)}</span>). Your total federal credit is <span class="hl">${$(credit.federalCredit)}</span>.</p>`;
    } else {
      // All of the high portion at 33%
      federalBreakdown = `<p>You donated <span class="hl">${$(donationAmount)}</span>. The federal credit rate on the first $${threshold} is ${fmtRate(federal.lowRate)}, which equals <span class="hl">${$(fedLowCredit)}</span>. Because your income is above <span class="hl">${$(federal.topRateThreshold)}</span>, the remaining <span class="hl">${$(highPortion)}</span> qualifies for the higher ${fmtRate(federal.topRate)} rate instead of ${fmtRate(federal.highRate)}, which equals <span class="hl">${$(fedTopCredit)}</span>. Your total federal credit is <span class="hl">${$(credit.federalCredit)}</span>.</p>`;
    }
  } else {
    const fedLowCredit = lowPortion * federal.lowRate;
    const fedHighCredit = highPortion * federal.highRate;
    federalBreakdown = `<p>You donated <span class="hl">${$(donationAmount)}</span>. The federal credit rate on the first $${threshold} is ${fmtRate(federal.lowRate)}, which equals <span class="hl">${$(fedLowCredit)}</span>. On the remaining <span class="hl">${$(highPortion)}</span>, the rate is ${fmtRate(federal.highRate)}, which equals <span class="hl">${$(fedHighCredit)}</span>. Your total federal credit is <span class="hl">${$(credit.federalCredit)}</span>.</p>`;
  }

  const body = `${federalBreakdown}
<p>In ${input.provinceName}, the provincial credit adds <span class="hl">${$(credit.provincialCredit)}</span> — that's ${fmtRate(provRate.lowRate)} on the first $${threshold} plus ${fmtRate(provRate.highRate)} on the rest. Your combined credit is <span class="hl-teal">${$(credit.totalCredit)}</span>.</p>`;
  return section("basic-math", `<h3>How your credit is calculated</h3>\n${body}`);
}

async function buildThresholdNudgeSection(results) {
  const { nudge, donationRates } = results;
  const { threshold, federal } = donationRates;

  const calloutHtml = await callout("warm",
    `<strong>You're close to a better rate.</strong> Every dollar you donate above $${threshold} earns a federal credit of ${fmtRate(federal.highRate)} instead of ${fmtRate(federal.lowRate)} — more than double. If you donated <span class="hl">${$(nudge.hypotheticalAmount)}</span> this year, your total credit would be <span class="hl-teal">${$(nudge.hypotheticalCredit)}</span> instead of ${$(nudge.currentCredit)}.`
  );

  const content = `<h3>The $${threshold} threshold</h3>
${calloutHtml}
<p>This doesn't mean you should donate more than you want to. But if you're planning to give more later this year, it's worth knowing that each dollar above $${threshold} works harder for you.</p>`;

  return section("threshold-nudge", content);
}

async function buildTaxSituationSection(results) {
  const { input, tax, credit, usability } = results;

  if (usability.state === UsabilityState.ENTIRELY_WASTED) {
    return section("tax-situation",
      `<h3>Your tax situation</h3>
<p>Based on your income of <span class="hl">${$(input.income)}</span> in ${input.provinceName}, your estimated income tax is <span class="hl">$0</span>. Your income is below the basic personal amount in both the federal and ${input.provinceName} systems, so no tax is owed.</p>`
    );
  }

  if (usability.state === UsabilityState.PARTLY_WASTED) {
    return section("tax-situation",
      `<h3>Your tax situation</h3>
<p>Based on your income of <span class="hl">${$(input.income)}</span> in ${input.provinceName}, we estimate your total income tax is approximately <span class="hl">${$(tax.totalTax)}</span>. Most of your income is sheltered by the basic personal amount, which means you owe very little tax.</p>`
    );
  }

  return section("tax-situation",
    `<h3>Your tax situation</h3>
<p>Based on your income of <span class="hl">${$(input.income)}</span> in ${input.provinceName}, we estimate your total income tax (before this credit) is approximately <span class="hl">${$(tax.totalTax)}</span>. Your donation credit of <span class="hl-teal">${$(credit.totalCredit)}</span> is well within your tax payable, so you can use the full credit.</p>
<p style="font-size:13px; color:var(--color-text-secondary); margin-top: 8px;">This estimate uses only the basic personal amount. Your actual tax may be lower if you have other credits.</p>`
  );
}

async function buildNonRefundableSection(results) {
  const { credit, tax, usability } = results;

  if (usability.state === UsabilityState.ENTIRELY_WASTED) {
    const calloutHtml = await callout("warning",
      `The charitable tax credit is <strong>non-refundable</strong>. It can reduce the tax you owe, but it can't go below zero. Since your estimated tax is already $0, the entire <span class="hl-red">${$(credit.totalCredit)}</span> credit has nothing to reduce. It disappears.`
    );
    return section("non-refundable",
      `<h3>Why the credit doesn't help this year</h3>
${calloutHtml}
<p>This is a limitation of how the system is designed, not a reflection of your generosity. Many people are in this situation and most existing calculators don't mention it.</p>
<a href="learn" data-route="/learn" class="learn-link">See how this affects different types of taxpayers <span class="arrow">&rarr;</span></a>`
    );
  }

  const calloutHtml = await callout("warning",
    `Your donation credit of <span class="hl-red">${$(credit.totalCredit)}</span> is larger than your estimated tax of <span class="hl">${$(tax.totalTax)}</span>. The credit can reduce your tax to $0, saving you ${$(usability.creditUsable)}. But the remaining <span class="hl-red">${$(usability.creditWasted)}</span> of credit disappears — it can't be refunded to you. This is what "non-refundable" means.`
  );
  return section("non-refundable",
    `<h3>Why part of your credit is lost</h3>
${calloutHtml}
<p>This isn't about you — it's how the system works. The charitable tax credit can only reduce tax you already owe. It can never create a refund on its own.</p>
<a href="learn" data-route="/learn" class="learn-link">See how this affects different types of taxpayers <span class="arrow">&rarr;</span></a>`
  );
}

async function buildCarryForwardSection(results) {
  if (results.usability.state === UsabilityState.ENTIRELY_WASTED) {
    const [carryCallout, spouseCallout] = await Promise.all([
      callout("info",
        `<strong>Carry it forward.</strong> You don't have to claim this donation this year. You have up to 5 years to claim it. If your income increases in a future year, you'll owe tax — and then you can use the credit to reduce it.`
      ),
      callout("info",
        `<strong>Let your spouse claim it.</strong> If you have a spouse or common-law partner who owes tax, they can claim your donation instead. Either spouse can claim any donation, regardless of who made it.`,
        "spouse-option"
      ),
    ]);
    return section("carry-forward",
      `<h3>What you can do</h3>\n${carryCallout}\n${spouseCallout}`
    );
  }

  const [carryCallout, spouseCallout] = await Promise.all([
    callout("info",
      `<strong>Carry it forward.</strong> You don't have to claim this donation this year. You can carry it forward for up to 5 years. If you expect to earn more in a future year, you could use more of the credit then.`
    ),
    callout("info",
      `<strong>Let your spouse claim it.</strong> If your spouse or common-law partner has a higher income, they may be able to use the full credit. Either spouse can claim any donation, regardless of who made it.`,
      "spouse-option"
    ),
  ]);
  return section("carry-forward",
    `<h3>What you can do about it</h3>\n${carryCallout}\n${spouseCallout}`
  );
}

async function buildMinimumIncomeSection(results) {
  const { credit, minimumIncome, input } = results;
  return section("minimum-income",
    `<h3>Income needed to use the full credit</h3>
<p>To fully use a credit of <span class="hl-teal">${$(credit.totalCredit)}</span>, you'd need to earn approximately <span class="hl">${$(minimumIncome)}</span> per year in ${input.provinceName}. At that income, your estimated tax would be roughly ${$(credit.totalCredit)} — just enough to absorb the entire credit.</p>`
  );
}

async function buildClosingSection() {
  return section("closing",
    `<p style="color: var(--color-text-secondary); font-style: italic;">If you're donating because it matters to you — that's the most important reason of all. The tax credit is just one part of the picture.</p>
<a href="learn" data-route="/learn" class="learn-link">Learn more about how tax credits work <span class="arrow">&rarr;</span></a>`
  );
}
