import { expect, When, Then } from "./fixtures.js";

// --- Reverse form inputs ---

When(
  "I select {string} as my reverse province",
  async ({ page }, province) => {
    await page.selectOption("#rev-province", { label: province });
  },
);

When("I enter {string} as my reverse income", async ({ page }, income) => {
  await page.fill("#rev-income", income);
});

When("I set the refund slider to {int}", async ({ page }, value) => {
  await page.locator("#refund-slider").fill(String(value));
  await page.locator("#refund-slider").dispatchEvent("input");
  // Wait for the async calculation to complete and update the display
  await page.waitForFunction(
    () => {
      const el = document.getElementById("donate-display");
      return el && el.textContent.includes("$");
    },
    { timeout: 5000 },
  );
});

// --- Slider result assertions ---

Then("the donate display should show a dollar amount", async ({ page }) => {
  const display = page.locator("#donate-display");
  await expect(display).toContainText("$");
});

Then("the refund display should show {string}", async ({ page }, text) => {
  await expect(page.locator("#refund-display")).toContainText(text);
});

Then("there should be no slider warning", async ({ page }) => {
  const warning = page.locator("#slider-warning");
  await expect(warning).toBeEmpty();
});

Then("a not-possible warning should be visible", async ({ page }) => {
  const warning = page.locator("#slider-warning .slider-warning");
  await expect(warning).toBeVisible();
});

Then("a partial credit warning should be visible", async ({ page }) => {
  const warning = page.locator("#slider-warning .slider-partial-warning");
  await expect(warning).toBeVisible();
});

Then("the warning should mention the income needed", async ({ page }) => {
  const warning = page.locator("#slider-warning");
  await expect(warning).toContainText("need to earn");
});

Then("the donation breakdown should be visible", async ({ page }) => {
  await expect(page.locator("#slider-breakdown")).toBeVisible();
});

Then("the refund slider should be at {int}", async ({ page }, value) => {
  await expect(page.locator("#refund-slider")).toHaveValue(String(value));
});

// --- Reverse form hydration assertions ---

Then(
  "the reverse province should show {string}",
  async ({ page }, expected) => {
    const select = page.locator("#rev-province");
    const selectedText = await select.evaluate(
      (el) => el.options[el.selectedIndex].text,
    );
    expect(selectedText).toBe(expected);
  },
);

Then(
  "the reverse income should contain {string}",
  async ({ page }, expected) => {
    await expect(page.locator("#rev-income")).toHaveValue(expected);
  },
);
