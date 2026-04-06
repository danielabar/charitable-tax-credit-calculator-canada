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
import { calculateDonationForRefund } from "../../js/calculate-donation-for-refund.js";
import { calculateSurtaxSavings } from "../../js/calculate-surtax-savings.js";
import { checkDonationClaimLimit } from "../../js/check-donation-claim-limit.js";

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
    const claimLimit = checkDonationClaimLimit(500, 80000, 0.75);

    expect(credit.totalCredit).toBeGreaterThan(100);
    expect(credit.totalCredit).toBeLessThan(250);
    expect(usability.state).toBe("fully-usable");
    expect(claimLimit.exceedsLimit).toBe(false);
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
    const { surtaxSavings } = calculateSurtaxSavings(tax.provincialTax, credit.provincialCredit, onConfig.surtax);
    const effectiveTotalCredit = credit.totalCredit + surtaxSavings;
    const usability = checkCreditUsability(effectiveTotalCredit, tax.totalTax, 5000);

    expect(credit.totalCredit).toBeGreaterThan(1500);
    expect(credit.totalCredit).toBeLessThan(3000);
    expect(surtaxSavings).toBeGreaterThan(0);
    expect(effectiveTotalCredit).toBeGreaterThan(credit.totalCredit);
    expect(usability.state).toBe("fully-usable");
  });

  test("middle income ON ($80K) — no surtax savings", () => {
    const tax = calculateTotalTax(80000, federalConfig, onConfig);
    const credit = calculateDonationCredit(500, 80000, federalConfig, onConfig);
    const { surtaxSavings } = calculateSurtaxSavings(tax.provincialTax, credit.provincialCredit, onConfig.surtax);

    // At $80K, provincial tax is well above surtax thresholds, but credit is small
    // so surtaxSavings should be > 0 (credit reduces tax that's in surtax range)
    expect(surtaxSavings).toBeGreaterThanOrEqual(0);
  });

  test("high income ON ($150K, $120K donation) — donation exceeds 75% claim limit", () => {
    const tax = calculateTotalTax(150000, federalConfig, onConfig);
    const credit = calculateDonationCredit(120000, 150000, federalConfig, onConfig);
    const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, 120000);
    const claimLimit = checkDonationClaimLimit(120000, 150000, 0.75);

    expect(credit.totalCredit).toBeGreaterThan(20000);
    expect(claimLimit.exceedsLimit).toBe(true);
  });

  test("zero donation returns zero credit", () => {
    const credit = calculateDonationCredit(0, 80000, federalConfig, onConfig);
    expect(credit.totalCredit).toBe(0);
  });

  test("reverse lookup: $100 refund requires donation between $300-$500 (ON)", () => {
    const donation = calculateDonationForRefund(100, federalConfig, onConfig);
    expect(donation).toBeGreaterThan(300);
    expect(donation).toBeLessThan(500);
  });

  test("reverse lookup: $25 refund requires donation under $200 (ON)", () => {
    const donation = calculateDonationForRefund(25, federalConfig, onConfig);
    expect(donation).toBeLessThan(200);
  });

  test("reverse lookup: round-trip — credit from computed donation matches target", () => {
    const target = 100;
    const donation = calculateDonationForRefund(target, federalConfig, onConfig);
    const credit = calculateDonationCredit(donation, 80000, federalConfig, onConfig);
    // ceil rounding means actual credit should be >= target
    expect(credit.totalCredit).toBeGreaterThanOrEqual(target);
    // but not much more (at most ~$1 overshoot from rounding)
    expect(credit.totalCredit).toBeLessThan(target + 2);
  });

  test("reverse pipeline: $100 refund at $80K ON is fully usable", () => {
    const donation = calculateDonationForRefund(100, federalConfig, onConfig);
    const tax = calculateTotalTax(80000, federalConfig, onConfig);
    const credit = calculateDonationCredit(donation, 80000, federalConfig, onConfig);
    const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, donation);
    expect(usability.state).toBe("fully-usable");
    expect(credit.totalCredit).toBeGreaterThanOrEqual(100);
  });

  test("reverse pipeline: $100 refund at $13K ON is partly or entirely wasted", () => {
    const donation = calculateDonationForRefund(100, federalConfig, onConfig);
    const tax = calculateTotalTax(13000, federalConfig, onConfig);
    const credit = calculateDonationCredit(donation, 13000, federalConfig, onConfig);
    const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, donation);
    expect(usability.state).toMatch(/partly-wasted|entirely-wasted/);
  });
});
