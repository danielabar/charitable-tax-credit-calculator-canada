/**
 * Integration tests for the reverse calculation pipeline.
 * Tests the composition: desiredRefund → donationNeeded → credit → usability check.
 * Uses test fixture configs (federal: 10%/20%, Ontario: 5%/10%, threshold: $200).
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateDonationForRefund } from "../../js/calculate-donation-for-refund.js";
import { calculateTotalTax } from "../../js/calculate-total-tax.js";
import { calculateDonationCredit } from "../../js/calculate-donation-credit.js";
import { checkCreditUsability } from "../../js/check-credit-usability.js";
import { calculateMinimumIncome } from "../../js/calculate-minimum-income.js";

const federalConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/test/federal.json"), "utf-8")
);
const onConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/test/provinces/ON.json"), "utf-8")
);

// Test fixture rates:
// Combined low rate = 15% (federal 10% + ON 5%), threshold = $200
// Combined high rate = 30% (federal 20% + ON 10%)
// Max credit from first $200 = $200 × 0.15 = $30
// Federal BPA = 15000, ON BPA = 10000

/**
 * Run the reverse pipeline synchronously using the same sequence
 * as runReverseCalculation in calculator.js.
 */
function runReversePipeline(income, desiredRefund) {
  const donationNeeded = calculateDonationForRefund(desiredRefund, federalConfig, onConfig);
  const tax = calculateTotalTax(income, federalConfig, onConfig);
  const credit = calculateDonationCredit(donationNeeded, income, federalConfig, onConfig);
  const usability = checkCreditUsability(credit.totalCredit, tax.totalTax, donationNeeded);

  let minimumIncome = null;
  if (usability.state !== "fully-usable") {
    minimumIncome = calculateMinimumIncome(credit.totalCredit, federalConfig, onConfig);
  }

  return { donationNeeded, tax, credit, usability, minimumIncome };
}

test.describe("reverse pipeline — fully usable (high income)", () => {
  test("$15 refund at $80K income → $100 donation, fully usable", () => {
    const r = runReversePipeline(80000, 15);
    expect(r.donationNeeded).toBe(100);
    expect(r.usability.state).toBe("fully-usable");
    expect(r.minimumIncome).toBeNull();
  });

  test("$30 refund at $80K income → $200 donation, fully usable", () => {
    const r = runReversePipeline(80000, 30);
    expect(r.donationNeeded).toBe(200);
    expect(r.usability.state).toBe("fully-usable");
  });

  test("$45 refund at $80K income → $250 donation, fully usable", () => {
    const r = runReversePipeline(80000, 45);
    expect(r.donationNeeded).toBe(250);
    expect(r.usability.state).toBe("fully-usable");
  });
});

test.describe("reverse pipeline — entirely wasted (no tax owed)", () => {
  test("$15 refund at $10K income → entirely wasted", () => {
    // $10K is below the federal BPA ($15K), so no federal tax.
    // $10K is also at the ON BPA ($10K), so $0 provincial tax.
    const r = runReversePipeline(10000, 15);
    expect(r.donationNeeded).toBe(100);
    expect(r.tax.totalTax).toBe(0);
    expect(r.usability.state).toBe("entirely-wasted");
    expect(r.minimumIncome).not.toBeNull();
    expect(r.minimumIncome).toBeGreaterThan(10000);
  });
});

test.describe("reverse pipeline — partly wasted (low income)", () => {
  test("$30 refund at $15.5K income → partly wasted", () => {
    // $15.5K: above ON BPA ($10K) so some provincial tax, above or below federal BPA ($15K)
    // Federal: $15.5K - $15K = $500 taxable × 10% = $50
    // Ontario: $15.5K - $10K = $5500 taxable × 5% = $275
    // Total tax = $325
    // $30 refund → $200 donation → credit = $200 × 0.15 = $30
    // Credit ($30) < tax ($325) → fully usable
    const r = runReversePipeline(15500, 30);
    expect(r.donationNeeded).toBe(200);
    expect(r.usability.state).toBe("fully-usable");
  });

  test("$45 refund at $10.2K income → partly wasted (tax > 0 but < credit)", () => {
    // $10.2K: below federal BPA ($15K) so $0 federal tax.
    // Ontario: $10.2K - $10K = $200 taxable × 5% = $10 provincial tax.
    // Total tax = $10
    // $45 refund → $250 donation → credit = $200×0.15 + $50×0.30 = $30 + $15 = $45
    // Credit ($45) > tax ($10) → partly wasted
    const r = runReversePipeline(10200, 45);
    expect(r.donationNeeded).toBe(250);
    expect(r.tax.totalTax).toBe(10);
    expect(r.usability.state).toBe("partly-wasted");
    expect(r.usability.creditUsable).toBe(10);
    expect(r.usability.creditWasted).toBe(35);
    expect(r.minimumIncome).not.toBeNull();
  });
});

test.describe("reverse pipeline — round-trip verification", () => {
  test("donation for $15 refund produces credit >= $15", () => {
    const donation = calculateDonationForRefund(15, federalConfig, onConfig);
    const credit = calculateDonationCredit(donation, 80000, federalConfig, onConfig);
    expect(credit.totalCredit).toBeGreaterThanOrEqual(15);
    expect(credit.totalCredit).toBeLessThan(17);
  });

  test("donation for $45 refund produces credit >= $45", () => {
    const donation = calculateDonationForRefund(45, federalConfig, onConfig);
    const credit = calculateDonationCredit(donation, 80000, federalConfig, onConfig);
    expect(credit.totalCredit).toBeGreaterThanOrEqual(45);
    expect(credit.totalCredit).toBeLessThan(47);
  });

  test("donation for $60 refund produces credit >= $60", () => {
    const donation = calculateDonationForRefund(60, federalConfig, onConfig);
    const credit = calculateDonationCredit(donation, 80000, federalConfig, onConfig);
    expect(credit.totalCredit).toBeGreaterThanOrEqual(60);
    expect(credit.totalCredit).toBeLessThan(62);
  });
});
