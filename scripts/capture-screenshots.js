import { test } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const label = process.env.LABEL || "default";
const outputDir = join(process.cwd(), "screenshots", label);

mkdirSync(outputDir, { recursive: true });

const scenarios = [
  {
    name: "00-blank-form",
    // No inputs — just capture the landing page
  },
  {
    name: "01-full-benefit-above-200",
    province: "Ontario",
    income: "80000",
    donation: "500",
  },
  {
    name: "02-full-benefit-near-200",
    province: "Ontario",
    income: "80000",
    donation: "180",
  },
  {
    name: "03-full-benefit-exactly-200",
    province: "Ontario",
    income: "80000",
    donation: "200",
  },
  {
    name: "04-full-benefit-below-200",
    province: "Ontario",
    income: "80000",
    donation: "100",
  },
  {
    name: "05-partly-wasted-above-200",
    province: "Ontario",
    income: "13000",
    donation: "500",
  },
  {
    name: "06-partly-wasted-near-200",
    province: "Ontario",
    income: "13000",
    donation: "180",
  },
  {
    name: "07-partly-wasted-below-200",
    province: "Ontario",
    income: "13000",
    donation: "100",
  },
  {
    name: "08-entirely-wasted-above-200",
    province: "Ontario",
    income: "10000",
    donation: "500",
  },
  {
    name: "09-entirely-wasted-near-200",
    province: "Ontario",
    income: "10000",
    donation: "180",
  },
  {
    name: "10-entirely-wasted-below-200",
    province: "Ontario",
    income: "10000",
    donation: "100",
  },
  {
    name: "11-top-bracket-above-200",
    province: "Ontario",
    income: "300000",
    donation: "500",
  },
  {
    name: "12-top-bracket-below-200",
    province: "Ontario",
    income: "300000",
    donation: "100",
  },
];

for (const scenario of scenarios) {
  test(scenario.name, async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#calculator-form");

    if (scenario.province) {
      await page.selectOption("#province", { label: scenario.province });
      await page.fill("#income", scenario.income);
      await page.fill("#donation", scenario.donation);
      await page.click(".btn-calculate");
      await page.waitForSelector(".results-section");
    }

    await page.screenshot({
      path: join(outputDir, `${scenario.name}.png`),
      fullPage: true,
    });
  });
}

// --- Non-calculator pages ---

test("13-learn-page", async ({ page }) => {
  await page.goto("/learn");
  await page.waitForSelector(".learn-page");
  await page.screenshot({
    path: join(outputDir, "13-learn-page.png"),
    fullPage: true,
  });
});
