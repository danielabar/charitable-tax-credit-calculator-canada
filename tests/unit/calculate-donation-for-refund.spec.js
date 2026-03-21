import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateDonationForRefund } from "../../js/calculate-donation-for-refund.js";

const federalConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/test/federal.json"), "utf-8")
);

function loadProvince(code) {
  return JSON.parse(
    readFileSync(join(process.cwd(), `config/tax-data/test/provinces/${code}.json`), "utf-8")
  );
}

const onConfig = loadProvince("ON");
const abConfig = loadProvince("AB");

// Test fixture rates (federal: 10%/20%, Ontario: 5%/10%):
// Combined low rate = 15% (0.10 + 0.05)
// Combined high rate = 30% (0.20 + 0.10)
// Max credit from first $200 = $200 × 0.15 = $30

test.describe("calculateDonationForRefund — Ontario fixture", () => {
  test("$0 refund requires $0 donation", () => {
    expect(calculateDonationForRefund(0, federalConfig, onConfig)).toBe(0);
  });

  test("$15 refund requires $100 donation (within low tier)", () => {
    // $15 / 0.15 = $100
    expect(calculateDonationForRefund(15, federalConfig, onConfig)).toBe(100);
  });

  test("$30 refund requires $200 donation (exactly at threshold)", () => {
    // $30 / 0.15 = $200
    expect(calculateDonationForRefund(30, federalConfig, onConfig)).toBe(200);
  });

  test("$45 refund requires $250 donation (above threshold)", () => {
    // $30 from first $200 + $15 / 0.30 = $50 above
    expect(calculateDonationForRefund(45, federalConfig, onConfig)).toBe(250);
  });

  test("$60 refund requires $300 donation (above threshold)", () => {
    // $30 from first $200 + $30 / 0.30 = $100 above
    expect(calculateDonationForRefund(60, federalConfig, onConfig)).toBe(300);
  });

  test("$1 refund requires $7 donation (rounds up)", () => {
    // $1 / 0.15 = 6.67, ceil to $7
    expect(calculateDonationForRefund(1, federalConfig, onConfig)).toBe(7);
  });

  test("$31 refund requires $204 donation (just over threshold, rounds up)", () => {
    // $200 + $1 / 0.30 = $203.33, ceil to $204
    expect(calculateDonationForRefund(31, federalConfig, onConfig)).toBe(204);
  });
});

test.describe("calculateDonationForRefund — Alberta fixture", () => {
  // Alberta test rates: federal 10%/20% + AB 10%/15%
  // Combined low rate = 20% (0.10 + 0.10)
  // Combined high rate = 35% (0.20 + 0.15)
  // Max credit from first $200 = $200 × 0.20 = $40

  test("$20 refund requires $100 donation (within low tier)", () => {
    // $20 / 0.20 = $100
    expect(calculateDonationForRefund(20, federalConfig, abConfig)).toBe(100);
  });

  test("$40 refund requires $200 donation (exactly at threshold)", () => {
    // $40 / 0.20 = $200
    expect(calculateDonationForRefund(40, federalConfig, abConfig)).toBe(200);
  });

  test("$75 refund requires $300 donation (above threshold)", () => {
    // $40 from first $200 + $35 / 0.35 = $100 above
    expect(calculateDonationForRefund(75, federalConfig, abConfig)).toBe(300);
  });
});
