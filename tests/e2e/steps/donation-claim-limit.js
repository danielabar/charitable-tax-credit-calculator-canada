import { expect, Then } from "./fixtures.js";

Then("the results should appear", async ({ page }) => {
  await expect(page.locator(".results-section")).toBeVisible();
});

Then("I should see the CRA claiming limit warning", async ({ page }) => {
  await expect(page.locator('[data-narrative="claim-limit"]')).toBeVisible();
});

Then("I should not see the CRA claiming limit warning", async ({ page }) => {
  await expect(page.locator('[data-narrative="claim-limit"]')).toHaveCount(0);
});

Then("the warning should mention {string}", async ({ page }, text) => {
  const section = page.locator('[data-narrative="claim-limit"]');
  await expect(section).toContainText(text);
});

Then("the non-refundable section should mention {string}", async ({ page }, text) => {
  const section = page.locator('[data-narrative="non-refundable"]');
  await expect(section).toContainText(text);
});

Then("the carry-forward section should not mention {string}", async ({ page }, text) => {
  const section = page.locator('[data-narrative="carry-forward"]');
  await expect(section).not.toContainText(text);
});

Then("the carry-forward section should mention {string}", async ({ page }, text) => {
  const section = page.locator('[data-narrative="carry-forward"]');
  await expect(section).toContainText(text);
});

Then("I should not see the minimum income section", async ({ page }) => {
  await expect(page.locator('[data-narrative="minimum-income"]')).toHaveCount(0);
});
