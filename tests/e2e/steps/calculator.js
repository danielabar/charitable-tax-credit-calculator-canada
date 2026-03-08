import { expect, Given, When, Then } from "./fixtures.js";

Then("I should see results", async ({ page }) => {
  const results = page.locator(".results-section");
  await expect(results).toBeVisible();
});

Then("the results should show a credit amount", async ({ page }) => {
  const bigNumber = page.locator(".big-number-card .headline-number");
  await expect(bigNumber).toBeVisible();
  const text = await bigNumber.textContent();
  expect(text).toContain("$");
});

Then("the results should indicate credit is wasted", async ({ page }) => {
  const bigNumber = page.locator(".big-number-card .headline-number");
  await expect(bigNumber).toBeVisible();
  const text = await bigNumber.textContent();
  expect(text.toLowerCase()).toContain("won't reduce");
});

Then("the headline should contain {string}", async ({ page }, expected) => {
  const bigNumber = page.locator(".big-number-card .headline-number");
  await expect(bigNumber).toBeVisible();
  const text = await bigNumber.textContent();
  expect(text.toLowerCase()).toContain(expected.toLowerCase());
});

Then("I should see the disclaimer", async ({ page }) => {
  const disclaimer = page.locator(".disclaimer");
  await expect(disclaimer).toBeVisible();
  const text = await disclaimer.textContent();
  expect(text).toContain("This is an estimate, not tax advice");
});

Then(
  "I should see the {string} narrative section",
  async ({ page }, sectionName) => {
    const section = page.locator(
      `[data-narrative="${sectionName}"]`,
    );
    await expect(section).toBeVisible();
  },
);

Then(
  "I should not see the {string} narrative section",
  async ({ page }, sectionName) => {
    const section = page.locator(
      `[data-narrative="${sectionName}"]`,
    );
    await expect(section).toHaveCount(0);
  },
);
