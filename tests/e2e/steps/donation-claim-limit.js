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
