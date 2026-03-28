import { test } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const label = process.env.LABEL || "default";
const outputDir = join(process.cwd(), "screenshots", label);

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

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
    name: "11b-surtax-relief",
    province: "Ontario",
    income: "300000",
    donation: "5000",
  },
  {
    name: "12-top-bracket-below-200",
    province: "Ontario",
    income: "300000",
    donation: "100",
  },
];

const reverseScenarios = [
  {
    name: "14-reverse-mode-full-benefit",
    province: "Ontario",
    income: "80000",
    refund: 100,
  },
  {
    name: "15-reverse-mode-partial",
    province: "Ontario",
    income: "16000",
    refund: 200,
  },
  {
    name: "16-reverse-mode-not-possible",
    province: "Ontario",
    income: "10000",
    refund: 100,
  },
];

for (const vp of viewports) {
  const vpDir = join(outputDir, vp.name);
  mkdirSync(vpDir, { recursive: true });

  for (const scenario of scenarios) {
    test(`${vp.name}-${scenario.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
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
        path: join(vpDir, `${scenario.name}.png`),
        fullPage: true,
      });
    });
  }

  for (const scenario of reverseScenarios) {
    test(`${vp.name}-${scenario.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForSelector("#calculator-form");

      // Switch to reverse mode
      await page.click('.mode-toggle button[data-mode="reverse"]');
      await page.waitForSelector("#reverse-view:not([hidden])");

      // Fill inputs
      await page.selectOption("#rev-province", { label: scenario.province });
      await page.fill("#rev-income", scenario.income);
      await page.locator("#refund-slider").fill(String(scenario.refund));
      await page.locator("#refund-slider").dispatchEvent("input");

      // Wait for calculation to complete
      await page.waitForFunction(
        () => document.getElementById("donate-display").textContent.includes("$"),
        { timeout: 5000 },
      );

      // Wait for breakdown bar width transitions (0.3s ease) to finish
      await page.waitForTimeout(400);

      await page.screenshot({
        path: join(vpDir, `${scenario.name}.png`),
        fullPage: true,
      });
    });
  }

  // --- Non-calculator pages ---

  test(`${vp.name}-13-learn-page`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/learn");
    await page.waitForSelector(".learn-page");
    await page.screenshot({
      path: join(vpDir, "13-learn-page.png"),
      fullPage: true,
    });
  });

  test(`${vp.name}-17-about-page`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/about");
    await page.waitForSelector(".about-page");
    await page.screenshot({
      path: join(vpDir, "17-about-page.png"),
      fullPage: true,
    });
  });
}
