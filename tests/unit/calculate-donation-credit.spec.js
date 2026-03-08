import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateDonationCredit } from "../../js/calculate-donation-credit.js";

const federalConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/2026/federal.json"), "utf-8")
);

function loadProvince(code) {
  return JSON.parse(
    readFileSync(join(process.cwd(), `config/tax-data/2026/provinces/${code}.json`), "utf-8")
  );
}

const onConfig = loadProvince("ON");
const abConfig = loadProvince("AB");
const bcConfig = loadProvince("BC");

test.describe("calculateDonationCredit", () => {
  test("$0 donation returns all zeros", () => {
    const result = calculateDonationCredit(0, federalConfig, onConfig);
    expect(result.federalCredit).toBe(0);
    expect(result.provincialCredit).toBe(0);
    expect(result.totalCredit).toBe(0);
  });

  test("$100 donation in ON (below threshold, only lowRate)", () => {
    // Federal: 0.14 * 100 = 14
    // Provincial: 0.0505 * 100 = 5.05
    // Total: 19.05
    const result = calculateDonationCredit(100, federalConfig, onConfig);
    expect(result.federalCredit).toBeCloseTo(14, 2);
    expect(result.provincialCredit).toBeCloseTo(5.05, 2);
    expect(result.totalCredit).toBeCloseTo(19.05, 2);
  });

  test("$200 donation in ON (at threshold)", () => {
    // Federal: 0.14 * 200 = 28
    // Provincial: 0.0505 * 200 = 10.10
    // Total: 38.10
    const result = calculateDonationCredit(200, federalConfig, onConfig);
    expect(result.federalCredit).toBeCloseTo(28, 2);
    expect(result.provincialCredit).toBeCloseTo(10.10, 2);
    expect(result.totalCredit).toBeCloseTo(38.10, 2);
  });

  test("$500 donation in ON (over threshold, both tiers)", () => {
    // Federal: 0.14 * 200 + 0.29 * 300 = 28 + 87 = 115
    // Provincial: 0.0505 * 200 + 0.1116 * 300 = 10.10 + 33.48 = 43.58
    // Total: 158.58
    const result = calculateDonationCredit(500, federalConfig, onConfig);
    expect(result.federalCredit).toBeCloseTo(115, 2);
    expect(result.provincialCredit).toBeCloseTo(43.58, 2);
    expect(result.totalCredit).toBeCloseTo(158.58, 2);
  });

  test("$200 donation in AB (high lowRate of 60%)", () => {
    // Federal: 0.14 * 200 = 28
    // Provincial: 0.60 * 200 = 120
    // Total: 148
    const result = calculateDonationCredit(200, federalConfig, abConfig);
    expect(result.federalCredit).toBeCloseTo(28, 2);
    expect(result.provincialCredit).toBeCloseTo(120, 2);
    expect(result.totalCredit).toBeCloseTo(148, 2);
  });

  test("$5000 donation in BC (large donation)", () => {
    // Federal: 0.14 * 200 + 0.29 * 4800 = 28 + 1392 = 1420
    // Provincial: 0.0506 * 200 + 0.168 * 4800 = 10.12 + 806.40 = 816.52
    // Total: 2236.52
    const result = calculateDonationCredit(5000, federalConfig, bcConfig);
    expect(result.federalCredit).toBeCloseTo(1420, 2);
    expect(result.provincialCredit).toBeCloseTo(816.52, 2);
    expect(result.totalCredit).toBeCloseTo(2236.52, 2);
  });
});
