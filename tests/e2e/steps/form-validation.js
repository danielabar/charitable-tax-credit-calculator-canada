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

const explainerSelector = "#forward-view details.income-explainer";

Then(
  'I should see the "What should I enter?" income explainer',
  async ({ page }) => {
    const summary = page.locator(`${explainerSelector} summary`);
    await expect(summary).toBeVisible();
    await expect(summary).toHaveText("What should I enter?");
  }
);

Then("the income explainer should be collapsed", async ({ page }) => {
  const isOpen = await page
    .locator(explainerSelector)
    .evaluate((el) => el.hasAttribute("open"));
  expect(isOpen).toBe(false);
});

When(
  'I click the "What should I enter?" income explainer',
  async ({ page }) => {
    await page.locator(`${explainerSelector} summary`).click();
  }
);

Then("the income explainer should be expanded", async ({ page }) => {
  const isOpen = await page
    .locator(explainerSelector)
    .evaluate((el) => el.hasAttribute("open"));
  expect(isOpen).toBe(true);
  await expect(page.locator(`${explainerSelector} .income-explainer-body`)).toBeVisible();
});

Then(
  "the income explainer should mention working, retired, self-employed, and investments",
  async ({ page }) => {
    const body = page.locator(`${explainerSelector} .income-explainer-body`);
    const text = (await body.textContent()).toLowerCase();
    for (const keyword of ["working", "retired", "self-employed", "investments"]) {
      expect(text).toContain(keyword);
    }
  }
);

Then(
  'the income explainer should include a "Learn more" link',
  async ({ page }) => {
    const link = page.locator(`${explainerSelector} .income-explainer-body a.learn-more`);
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toContain("#what-income-to-enter");
  }
);
