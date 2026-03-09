import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateFederalTax } from "../../js/calculate-federal-tax.js";

const federalConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/2026/federal.json"), "utf-8")
);

test.describe("calculateFederalTax", () => {
  test("zero income returns 0", () => {
    expect(calculateFederalTax(0, federalConfig)).toBe(0);
  });

  test("income below BPA returns 0", () => {
    // $15,000: gross = 15000 * 0.14 = 2100, BPA = max (16452), credit = 2303.28
    // net = max(0, 2100 - 2303.28) = 0
    expect(calculateFederalTax(15000, federalConfig)).toBe(0);
  });

  test("income at BPA returns 0", () => {
    // $16,452: gross = 16452 * 0.14 = 2303.28, BPA credit = 2303.28, net = 0
    expect(calculateFederalTax(16452, federalConfig)).toBe(0);
  });

  test("income just above BPA", () => {
    // $20,000: gross = 20000 * 0.14 = 2800, BPA = max, credit = 2303.28
    // net = 2800 - 2303.28 = 496.72
    const result = calculateFederalTax(20000, federalConfig);
    expect(result).toBeCloseTo(496.72, 2);
  });

  test("mid first bracket", () => {
    // $40,000: gross = 40000 * 0.14 = 5600, BPA = max, credit = 2303.28
    // net = 5600 - 2303.28 = 3296.72
    const result = calculateFederalTax(40000, federalConfig);
    expect(result).toBeCloseTo(3296.72, 2);
  });

  test("at first bracket boundary", () => {
    // $58,523: gross = 58523 * 0.14 = 8193.22, BPA = max, credit = 2303.28
    // net = 8193.22 - 2303.28 = 5889.94
    const result = calculateFederalTax(58523, federalConfig);
    expect(result).toBeCloseTo(5889.94, 2);
  });

  test("second bracket", () => {
    // $80,000: 58523*0.14 + (80000-58523)*0.205 = 8193.22 + 4402.785 = 12596.005
    // BPA = max (income below phaseout), credit = 2303.28
    // net = 12596.005 - 2303.28 = 10292.725
    const result = calculateFederalTax(80000, federalConfig);
    expect(result).toBeCloseTo(10292.73, 1);
  });

  // --- BPA phaseout tests ---

  test("income at phaseout start uses maximum BPA", () => {
    // $181,440: BPA = max (16452), credit = 16452 * 0.14 = 2303.28
    const atStart = calculateFederalTax(181440, federalConfig);
    // Same as if we used flat BPA
    const justBelow = calculateFederalTax(181439, federalConfig);
    // Both should use maximum BPA — tax difference is just the $1 of income
    expect(atStart - justBelow).toBeCloseTo(0.26, 2); // marginal rate in 3rd bracket
  });

  test("income mid-phaseout gets reduced BPA", () => {
    // $200,000: BPA phases down
    // additional = 16452 - 14829 = 1623
    // reduction = 1623 * (200000 - 181440) / (258482 - 181440) = 1623 * 18560 / 77042 ≈ 390.88
    // effective BPA = 16452 - 390.88 = 16061.12
    // credit = 16061.12 * 0.14 = 2248.56
    // gross tax = 58523*0.14 + 58522*0.205 + 64395*0.26 + 18560*0.29 = 42315.33
    // net = 42315.33 - 2248.56 = 40066.77
    const result = calculateFederalTax(200000, federalConfig);
    expect(result).toBeCloseTo(40066.77, 0);
  });

  test("income at phaseout end uses minimum BPA", () => {
    // $258,482: BPA = min (14829), credit = 14829 * 0.14 = 2076.06
    const result = calculateFederalTax(258482, federalConfig);
    const grossTax = 58523*0.14 + 58522*0.205 + 64395*0.26 + 77042*0.29;
    expect(result).toBeCloseTo(grossTax - 2076.06, 0);
  });

  test("high income above phaseout uses minimum BPA", () => {
    // $300,000: BPA = min (14829), credit = 14829 * 0.14 = 2076.06
    // B1: 58523 * 0.14 = 8193.22
    // B2: 58522 * 0.205 = 11997.01
    // B3: 64395 * 0.26 = 16742.70
    // B4: 77042 * 0.29 = 22342.18
    // B5: 41518 * 0.33 = 13700.94
    // Gross = 72976.05, net = 72976.05 - 2076.06 = 70899.99
    const result = calculateFederalTax(300000, federalConfig);
    expect(result).toBeCloseTo(70899.99, 0);
  });

  test("very high income exercises top bracket deeply", () => {
    // $1,000,000: BPA = min (14829), credit = 14829 * 0.14 = 2076.06
    // B1-B4 = 59275.11
    // B5: 741518 * 0.33 = 244700.94
    // Gross = 303976.05, net = 303976.05 - 2076.06 = 301899.99
    const result = calculateFederalTax(1000000, federalConfig);
    expect(result).toBeCloseTo(301899.99, 0);
  });
});
