import { expect, When, Then } from "./fixtures.js";

When(
  "I visit the calculator with {string}",
  async ({ page }, queryString) => {
    await page.goto(`/${queryString}`);
    await page.waitForSelector("#calculator-form");
  },
);

When("I click {string}", async ({ page }, buttonText) => {
  await page.click(`button:has-text("${buttonText}")`);
});

Then("the URL should contain {string}", async ({ page }, expected) => {
  const url = page.url();
  expect(url).toContain(expected);
});

Then("the URL should not contain query parameters", async ({ page }) => {
  const url = new URL(page.url());
  expect(url.search).toBe("");
});

Then(
  "the province dropdown should show {string}",
  async ({ page }, expected) => {
    const select = page.locator("#province");
    const selectedText = await select.evaluate(
      (el) => el.options[el.selectedIndex].text,
    );
    expect(selectedText).toBe(expected);
  },
);

Then(
  "the income field should contain {string}",
  async ({ page }, expected) => {
    await expect(page.locator("#income")).toHaveValue(expected);
  },
);

Then(
  "the donation field should contain {string}",
  async ({ page }, expected) => {
    await expect(page.locator("#donation")).toHaveValue(expected);
  },
);

Then("the income field should be empty", async ({ page }) => {
  await expect(page.locator("#income")).toHaveValue("");
});

Then("the donation field should be empty", async ({ page }) => {
  await expect(page.locator("#donation")).toHaveValue("");
});

Then("the results should be hidden", async ({ page }) => {
  const results = page.locator(".results-section");
  await expect(results).toHaveCount(0);
});

Then(
  "the {string} button should be visible",
  async ({ page }, buttonText) => {
    const btn = page.locator(`button:has-text("${buttonText}")`);
    await expect(btn).toBeVisible();
  },
);

Then(
  "the {string} button should be hidden",
  async ({ page }, buttonText) => {
    const btn = page.locator(`button:has-text("${buttonText}")`);
    await expect(btn).toBeHidden();
  },
);
