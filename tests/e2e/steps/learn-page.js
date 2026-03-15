import { expect, Given, When, Then } from "./fixtures.js";

Given("I am on the Learn page", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-route="/learn"]');
  await page.waitForSelector(".learn-page");
});

Then("I should see the Learn page content", async ({ page }) => {
  const heading = page.locator(".learn-page h1");
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText("How the charitable tax credit works");
});

Then("I should see {int} scenario cards", async ({ page }, count) => {
  const cards = page.locator(".scenario-card");
  await expect(cards).toHaveCount(count);
});

Then("the non-taxpayer card should show $0 gets back", async ({ page }) => {
  const getsBack = page.locator(
    ".card-wasted .result-side:last-child .result-amount"
  );
  await expect(getsBack).toBeVisible();
  await expect(getsBack).toContainText("$0");
});

Then(
  "the partial taxpayer card should show a partial amount back",
  async ({ page }) => {
    const getsBack = page.locator(
      ".card-partial .result-side:last-child .result-amount"
    );
    await expect(getsBack).toBeVisible();
    const text = await getsBack.textContent();
    expect(text).toContain("$");
    expect(text).not.toBe("$0");
  }
);

Then(
  "the full taxpayer cards should show the full credit back",
  async ({ page }) => {
    const positiveAmounts = page.locator(".result-amount.positive");
    await expect(positiveAmounts).toHaveCount(2);
    for (const el of await positiveAmounts.all()) {
      const text = await el.textContent();
      expect(text).toContain("$");
      expect(text).not.toBe("$0");
    }
  }
);

Then("all scenario cards should show dollar amounts", async ({ page }) => {
  const values = page.locator(".scenario-card .detail-value");
  for (const el of await values.all()) {
    await expect(el).toContainText("$");
  }
});

Then("no card should contain placeholder text", async ({ page }) => {
  const cards = page.locator(".scenario-cards");
  const html = await cards.innerHTML();
  expect(html).not.toContain("{{");
});

When("I click the calculator CTA", async ({ page }) => {
  await page.click('.try-calculator [data-route="/"]');
  await page.waitForSelector("#calculator-form");
});
