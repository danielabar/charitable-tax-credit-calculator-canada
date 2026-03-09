import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateMinimumIncome } from "../../js/calculate-minimum-income.js";
import { calculateTotalTax } from "../../js/calculate-total-tax.js";
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

test.describe("calculateMinimumIncome", () => {
  test("zero target returns 0", () => {
    expect(calculateMinimumIncome(0, federalConfig, onConfig)).toBe(0);
  });

  test("small credit ($38 from $200 donation in ON)", () => {
    const credit = calculateDonationCredit(200, 80000, federalConfig, onConfig).totalCredit;
    const minIncome = calculateMinimumIncome(credit, federalConfig, onConfig);
    // Combined BPAs mean tax starts below federal BPA
    expect(minIncome).toBeGreaterThan(12000);
    expect(minIncome).toBeLessThan(16000);
  });

  test("medium credit ($159 from $500 donation in ON)", () => {
    const credit = calculateDonationCredit(500, 80000, federalConfig, onConfig).totalCredit;
    const minIncome = calculateMinimumIncome(credit, federalConfig, onConfig);
    expect(minIncome).toBeGreaterThan(14000);
    expect(minIncome).toBeLessThan(18000);
  });

  test("round-trip: ON $50K", () => {
    const tax = calculateTotalTax(50000, federalConfig, onConfig).totalTax;
    const reversed = calculateMinimumIncome(tax, federalConfig, onConfig);
    expect(reversed).toBeGreaterThan(49500);
    expect(reversed).toBeLessThan(50500);
  });

  test("round-trip: ON $80K", () => {
    const tax = calculateTotalTax(80000, federalConfig, onConfig).totalTax;
    const reversed = calculateMinimumIncome(tax, federalConfig, onConfig);
    expect(reversed).toBeGreaterThan(79500);
    expect(reversed).toBeLessThan(80500);
  });

  test("round-trip: AB $80K", () => {
    const tax = calculateTotalTax(80000, federalConfig, abConfig).totalTax;
    const reversed = calculateMinimumIncome(tax, federalConfig, abConfig);
    expect(reversed).toBeGreaterThan(79500);
    expect(reversed).toBeLessThan(80500);
  });

  test("round-trip: ON $200K (with surtax)", () => {
    const tax = calculateTotalTax(200000, federalConfig, onConfig).totalTax;
    const reversed = calculateMinimumIncome(tax, federalConfig, onConfig);
    expect(reversed).toBeGreaterThan(199500);
    expect(reversed).toBeLessThan(200500);
  });
});
