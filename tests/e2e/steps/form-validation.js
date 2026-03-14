import { expect, Given, When, Then } from "./fixtures.js";

Given("I visit the calculator page", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#calculator-form");
});

When("I click Calculate", async ({ page }) => {
  await page.click(".btn-calculate");
});

When("I select {string} as my province", async ({ page }, province) => {
  await page.selectOption("#province", { label: province });
});

When("I enter {string} as my income", async ({ page }, income) => {
  await page.fill("#income", income);
});

When("I enter {string} as my donation", async ({ page }, donation) => {
  await page.fill("#donation", donation);
});

Then(
  "I should see a validation message for the province field",
  async ({ page }) => {
    const error = page.locator("#province").locator("..").locator(".validation-error");
    await expect(error).toBeVisible();
  },
);

Then(
  "I should see a validation message for the income field",
  async ({ page }) => {
    const error = page.locator("#income").locator("../..").locator(".validation-error");
    await expect(error).toBeVisible();
  },
);

Then(
  "I should see a validation message for the donation field",
  async ({ page }) => {
    const error = page.locator("#donation").locator("../..").locator(".validation-error");
    await expect(error).toBeVisible();
  },
);

Then("the Calculate button should be enabled", async ({ page }) => {
  const button = page.locator(".btn-calculate");
  await expect(button).toBeEnabled();
});
