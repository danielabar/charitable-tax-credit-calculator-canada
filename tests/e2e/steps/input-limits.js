import { expect, Then } from "./fixtures.js";

// --- Forward mode validation errors ---

Then(
  "I should see a validation error on the income field",
  async ({ page }) => {
    const error = page.locator("#income").locator("../..").locator(".validation-error");
    await expect(error).toBeVisible();
  },
);

Then(
  "the income error should mention {string}",
  async ({ page }, text) => {
    const error = page.locator("#income").locator("../..").locator(".validation-error");
    await expect(error).toContainText(text);
  },
);

Then(
  "I should see a validation error on the donation field",
  async ({ page }) => {
    const error = page.locator("#donation").locator("../..").locator(".validation-error");
    await expect(error).toBeVisible();
  },
);

Then(
  "the donation error should mention {string}",
  async ({ page }, text) => {
    const error = page.locator("#donation").locator("../..").locator(".validation-error");
    await expect(error).toContainText(text);
  },
);

// --- Reverse mode validation errors ---

Then(
  "I should see a validation error on the reverse income field",
  async ({ page }) => {
    const error = page.locator("#rev-income").locator("../..").locator(".validation-error");
    await expect(error).toBeVisible();
  },
);

Then(
  "the reverse income error should mention {string}",
  async ({ page }, text) => {
    const error = page.locator("#rev-income").locator("../..").locator(".validation-error");
    await expect(error).toContainText(text);
  },
);

Then(
  "there should be no validation error on the reverse income field",
  async ({ page }) => {
    const error = page.locator("#rev-income").locator("../..").locator(".validation-error");
    await expect(error).toHaveCount(0);
  },
);
