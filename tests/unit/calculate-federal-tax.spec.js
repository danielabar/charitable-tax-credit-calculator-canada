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
    // $15,000: gross = 15000 * 0.14 = 2100, net = max(0, 2100 - 2303.28) = 0
    expect(calculateFederalTax(15000, federalConfig)).toBe(0);
  });

  test("income at BPA returns 0", () => {
    // $16,452: gross = 16452 * 0.14 = 2303.28, net = 0
    expect(calculateFederalTax(16452, federalConfig)).toBe(0);
  });

  test("income just above BPA", () => {
    // $20,000: gross = 20000 * 0.14 = 2800, net = 2800 - 2303.28 = 496.72
    const result = calculateFederalTax(20000, federalConfig);
    expect(result).toBeCloseTo(496.72, 2);
  });

  test("mid first bracket", () => {
    // $40,000: gross = 40000 * 0.14 = 5600, net = 5600 - 2303.28 = 3296.72
    const result = calculateFederalTax(40000, federalConfig);
    expect(result).toBeCloseTo(3296.72, 2);
  });

  test("at first bracket boundary", () => {
    // $58,523: gross = 58523 * 0.14 = 8193.22, net = 8193.22 - 2303.28 = 5889.94
    const result = calculateFederalTax(58523, federalConfig);
    expect(result).toBeCloseTo(5889.94, 2);
  });

  test("second bracket", () => {
    // $80,000: 58523*0.14 + (80000-58523)*0.205 = 8193.22 + 4402.785 = 12596.005
    // net = 12596.005 - 2303.28 = 10292.725
    const result = calculateFederalTax(80000, federalConfig);
    expect(result).toBeCloseTo(10292.73, 1);
  });

  test("high income exercises all brackets", () => {
    // $300,000:
    // B1: 58523 * 0.14 = 8193.22
    // B2: (117045-58523) * 0.205 = 58522 * 0.205 = 11997.01
    // B3: (181440-117045) * 0.26 = 64395 * 0.26 = 16742.70
    // B4: (258482-181440) * 0.29 = 77042 * 0.29 = 22342.18
    // B5: (300000-258482) * 0.33 = 41518 * 0.33 = 13700.94
    // Gross = 72976.05, net = 72976.05 - 2303.28 = 70672.77
    const result = calculateFederalTax(300000, federalConfig);
    expect(result).toBeCloseTo(70672.77, 0);
  });

  test("very high income exercises top bracket deeply", () => {
    // $1,000,000:
    // B1-B4 same as above = 59275.11
    // B5: (1000000-258482) * 0.33 = 741518 * 0.33 = 244700.94
    // Gross = 59275.11 + 244700.94 = 303976.05
    // net = 303976.05 - 2303.28 = 301672.77
    const result = calculateFederalTax(1000000, federalConfig);
    expect(result).toBeCloseTo(301672.77, 0);
  });
});
