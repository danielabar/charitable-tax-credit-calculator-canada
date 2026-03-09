import { expect, Then } from "./fixtures.js";

// ---------------------------------------------------------------------------
// Bottom line (big-number headline)
// ---------------------------------------------------------------------------

Then("the bottom line should say {string}", async ({ page }, expected) => {
  const headline = page.locator(".big-number-card .headline-number");
  await expect(headline).toBeVisible();
  await expect(headline).toContainText(expected, { ignoreCase: true });
});

Then("the bottom line should not show a warning", async ({ page }) => {
  const card = page.locator(".big-number-card");
  await expect(card).toBeVisible();
  await expect(card).not.toHaveClass(/big-number-card--warning/);
});

Then("the bottom line should show a warning", async ({ page }) => {
  const card = page.locator(".big-number-card");
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/big-number-card--warning/);
});

// ---------------------------------------------------------------------------
// Credit summary grid
// ---------------------------------------------------------------------------

Then(
  "the credit summary should show federal credit, provincial credit, and total credit",
  async ({ page }) => {
    const grid = page.locator(".summary-grid");
    await expect(grid).toBeVisible();
    await expect(grid).toHaveClass(/three-col/);
    const items = grid.locator(".summary-item");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0).locator(".label")).toContainText("Federal credit");
    await expect(items.nth(1).locator(".label")).toContainText("credit");
    await expect(items.nth(2).locator(".label")).toContainText("Total credit");
  },
);

Then(
  "the credit summary should show credit calculated, estimated tax, credit usable, and credit wasted",
  async ({ page }) => {
    const grid = page.locator(".summary-grid");
    await expect(grid).toBeVisible();
    await expect(grid).not.toHaveClass(/three-col/);
    const items = grid.locator(".summary-item");
    await expect(items).toHaveCount(4);
    await expect(items.nth(0).locator(".label")).toContainText("Credit calculated");
    await expect(items.nth(1).locator(".label")).toContainText("estimated tax");
    await expect(items.nth(2).locator(".label")).toContainText("Credit you can use");
    await expect(items.nth(3).locator(".label")).toContainText("Credit wasted");
    // Credit wasted should be highlighted
    await expect(items.nth(3)).toHaveClass(/highlight-bad/);
  },
);

// ---------------------------------------------------------------------------
// Visual breakdown (bar chart)
// ---------------------------------------------------------------------------

Then(
  "the visual breakdown should show cost versus credit",
  async ({ page }) => {
    const chart = page.locator(".bar-chart");
    await expect(chart).toBeVisible();
    await expect(chart.locator(".legend-cost")).toBeVisible();
    await expect(chart.locator(".legend-usable")).toBeVisible();
  },
);

Then(
  "the visual breakdown should show usable versus wasted credit",
  async ({ page }) => {
    const chart = page.locator(".bar-chart");
    await expect(chart).toBeVisible();
    await expect(chart.locator(".legend-usable")).toBeVisible();
    await expect(chart.locator(".legend-wasted")).toBeVisible();
  },
);

Then("there should be no visual breakdown", async ({ page }) => {
  await expect(page.locator(".bar-chart")).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Narrative content checks
// ---------------------------------------------------------------------------

Then(
  "the explanation should show tiered rates for donations above $200",
  async ({ page }) => {
    const section = page.locator('[data-narrative="basic-math"]');
    await expect(section).toBeVisible();
    await expect(section).toContainText("first $200");
  },
);

Then(
  "the explanation should show a single rate for donations under $200",
  async ({ page }) => {
    const section = page.locator('[data-narrative="basic-math"]');
    await expect(section).toBeVisible();
    const text = await section.textContent();
    expect(text).not.toContain("first $200");
  },
);

Then(
  "the tax situation should confirm the full credit is usable",
  async ({ page }) => {
    const section = page.locator('[data-narrative="tax-situation"]');
    await expect(section).toBeVisible();
    await expect(section).toContainText("use the full credit");
  },
);

Then(
  "the tax situation should say income is mostly sheltered by the basic personal amount",
  async ({ page }) => {
    const section = page.locator('[data-narrative="tax-situation"]');
    await expect(section).toBeVisible();
    await expect(section).toContainText("sheltered by the basic personal amount");
  },
);

Then("the tax situation should say no tax is owed", async ({ page }) => {
  const section = page.locator('[data-narrative="tax-situation"]');
  await expect(section).toBeVisible();
  await expect(section).toContainText("no tax is owed");
});

// ---------------------------------------------------------------------------
// Narrative section presence / absence
// ---------------------------------------------------------------------------

Then(
  "the results should include the $200 threshold nudge",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="threshold-nudge"]'),
    ).toBeVisible();
  },
);

Then(
  "the results should not include the $200 threshold nudge",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="threshold-nudge"]'),
    ).toHaveCount(0);
  },
);

Then(
  "the results should include the non-refundable credit explanation",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="non-refundable"]'),
    ).toBeVisible();
  },
);

Then(
  "the results should not include the non-refundable credit explanation",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="non-refundable"]'),
    ).toHaveCount(0);
  },
);

Then(
  "the results should include carry-forward and spouse options",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="carry-forward"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-narrative="spouse-option"]'),
    ).toBeVisible();
  },
);

Then(
  "the results should not include carry-forward or spouse options",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="carry-forward"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-narrative="spouse-option"]'),
    ).toHaveCount(0);
  },
);

Then(
  "the results should include the minimum income section",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="minimum-income"]'),
    ).toBeVisible();
  },
);

Then(
  "the results should not include the minimum income section",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="minimum-income"]'),
    ).toHaveCount(0);
  },
);

Then(
  "the results should include the closing encouragement",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="closing"]'),
    ).toBeVisible();
  },
);

Then(
  "the results should not include the closing encouragement",
  async ({ page }) => {
    await expect(
      page.locator('[data-narrative="closing"]'),
    ).toHaveCount(0);
  },
);

// ---------------------------------------------------------------------------
// Disclaimer
// ---------------------------------------------------------------------------

Then("the disclaimer should be shown", async ({ page }) => {
  const disclaimer = page.locator(".disclaimer");
  await expect(disclaimer).toBeVisible();
  await expect(disclaimer).toContainText("This is an estimate, not tax advice");
});
