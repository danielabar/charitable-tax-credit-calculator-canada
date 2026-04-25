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

Then("I should see the taxpayer categories section", async ({ page }) => {
  const heading = page.locator("#taxpayer-categories h2");
  await expect(heading).toBeVisible();
  await expect(heading).toContainText("What happens when you donate");
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

Then("I should see the reverse lookup section", async ({ page }) => {
  const heading = page.locator("#reverse-lookup h2");
  await expect(heading).toBeVisible();
  await expect(heading).toContainText("How much do I donate");
});

Then("I should see {int} refund cards", async ({ page }, count) => {
  const cards = page.locator(".refund-card");
  await expect(cards).toHaveCount(count);
});

Then("all refund cards should show dollar amounts", async ({ page }) => {
  const amounts = page.locator(".refund-card .target-amount, .refund-card .donate-amount");
  for (const el of await amounts.all()) {
    await expect(el).toContainText("$");
  }
});

Then("no refund card should contain placeholder text", async ({ page }) => {
  const section = page.locator("#reverse-lookup");
  const html = await section.innerHTML();
  expect(html).not.toContain("{{");
});

Then("I should see the rate callout explaining the threshold", async ({ page }) => {
  const callout = page.locator(".rate-callout");
  await expect(callout).toBeVisible();
  await expect(callout).toContainText("$200");
});

Then('I should see the "What income should I enter?" section', async ({ page }) => {
  const section = page.locator("#what-income-to-enter");
  await expect(section).toBeVisible();
  await expect(section.locator("h2")).toHaveText("What income should I enter?");
});

Then(
  "the income section should list working, retired, self-employed, mixed, and investments",
  async ({ page }) => {
    const section = page.locator("#what-income-to-enter");
    const text = (await section.textContent()).toLowerCase();
    for (const keyword of ["working", "retired", "self-employed", "mixed", "investments"]) {
      expect(text).toContain(keyword);
    }
  }
);

Then(
  "the income section should mention the line 26000 taxable income reference",
  async ({ page }) => {
    const section = page.locator("#what-income-to-enter");
    await expect(section).toContainText("line 26000");
    await expect(section).toContainText("taxable income");
  }
);

Then(
  "the income section should appear before the taxpayer categories section",
  async ({ page }) => {
    const result = await page.evaluate(() => {
      const incomeSection = document.querySelector("#what-income-to-enter");
      const taxpayerSection = document.querySelector("#taxpayer-categories");
      if (!incomeSection || !taxpayerSection) return null;
      // DOCUMENT_POSITION_FOLLOWING (4) means taxpayer comes after income.
      return incomeSection.compareDocumentPosition(taxpayerSection) & 4;
    });
    expect(result).toBeTruthy();
  }
);
