import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateTotalTax } from "../../js/calculate-total-tax.js";

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

test.describe("calculateTotalTax", () => {
  test("ON $0 income returns all zeros", () => {
    const result = calculateTotalTax(0, federalConfig, onConfig);
    expect(result.federalTax).toBe(0);
    expect(result.provincialTax).toBe(0);
    expect(result.surtax).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  test("ON $80K income, no surtax", () => {
    const result = calculateTotalTax(80000, federalConfig, onConfig);
    expect(result.federalTax).toBeCloseTo(10292.73, 0);
    expect(result.provincialTax).toBeCloseTo(4454.52, 0);
    expect(result.surtax).toBe(0);
    expect(result.totalTax).toBeCloseTo(14747.25, 0);
  });

  test("AB $80K income, surtax is 0", () => {
    const result = calculateTotalTax(80000, federalConfig, abConfig);
    expect(result.federalTax).toBeCloseTo(10292.73, 0);
    expect(result.provincialTax).toBeCloseTo(4954.48, 0);
    expect(result.surtax).toBe(0);
    expect(result.totalTax).toBeCloseTo(15247.21, 0);
  });

  test("ON $130K income, surtax kicks in", () => {
    // Provincial tax ~9505.84, above both surtax thresholds
    const result = calculateTotalTax(130000, federalConfig, onConfig);
    expect(result.surtax).toBeGreaterThan(0);
    expect(result.totalTax).toBe(
      result.federalTax + result.provincialTax + result.surtax
    );
  });
});
