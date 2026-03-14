/**
 * Smoke tests against the real current-year config.
 * Uses range-based assertions — not exact pennies — so these survive
 * yearly rate changes without modification (unless rates change drastically).
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateTotalTax } from "../../js/calculate-total-tax.js";
import { calculateDonationCredit } from "../../js/calculate-donation-credit.js";
import { checkCreditUsability } from "../../js/check-credit-usability.js";

const federalConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/2026/federal.json"), "utf-8")
);
const onConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/2026/provinces/ON.json"), "utf-8")
);

test.describe("smoke — current year (2026)", () => {
  test("middle income ON ($80K, $500 donation)", () => {
    const tax = calculateTotalTax(80000, federalConfig, onConfig);
    const credit = calculateDonationCredit(500, 80000, federalConfig, onConfig);
    const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, 500);

    expect(credit.totalCredit).toBeGreaterThan(100);
    expect(credit.totalCredit).toBeLessThan(250);
    expect(usability.state).toBe("fully-usable");
  });

  test("low income ON ($13K, $500 donation)", () => {
    const tax = calculateTotalTax(13000, federalConfig, onConfig);
    const credit = calculateDonationCredit(500, 13000, federalConfig, onConfig);
    const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, 500);

    expect(usability.state).toMatch(/partly-wasted|entirely-wasted/);
  });

  test("high income ON ($300K, $5000 donation)", () => {
    const tax = calculateTotalTax(300000, federalConfig, onConfig);
    const credit = calculateDonationCredit(5000, 300000, federalConfig, onConfig);
    const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, 5000);

    expect(credit.totalCredit).toBeGreaterThan(1500);
    expect(credit.totalCredit).toBeLessThan(3000);
    expect(usability.state).toBe("fully-usable");
  });

  test("zero donation returns zero credit", () => {
    const credit = calculateDonationCredit(0, 80000, federalConfig, onConfig);
    expect(credit.totalCredit).toBe(0);
  });
});
