import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateTotalTax } from "../../js/calculate-total-tax.js";

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

test.describe("calculateTotalTax", () => {
  test("ON $0 income returns all zeros", () => {
    const result = calculateTotalTax(0, federalConfig, onConfig);
    expect(result.federalTax).toBe(0);
    expect(result.provincialTax).toBe(0);
    expect(result.surtax).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  test("ON $80K income, no surtax", () => {
    // federal 9500 + provincial 5000 + surtax 0 = 14500
    const result = calculateTotalTax(80000, federalConfig, onConfig);
    expect(result.federalTax).toBe(9500);
    expect(result.provincialTax).toBe(5000);
    expect(result.surtax).toBe(0);
    expect(result.totalTax).toBe(14500);
  });

  test("AB $80K income, no surtax", () => {
    // federal 9500 + provincial 7500 = 17000
    const result = calculateTotalTax(80000, federalConfig, abConfig);
    expect(result.federalTax).toBe(9500);
    expect(result.provincialTax).toBe(7500);
    expect(result.surtax).toBe(0);
    expect(result.totalTax).toBe(17000);
  });

  test("ON $130K income, surtax kicks in", () => {
    // federal: 50000*0.10 + 50000*0.20 + 30000*0.30 - 1500 = 22500
    // provincial: 50000*0.05 + 50000*0.10 + 30000*0.15 - 500 = 11500
    // surtax: 20%*(11500-5000) + 40%*(11500-8000) = 1300 + 1400 = 2700
    // total = 36700
    const result = calculateTotalTax(130000, federalConfig, onConfig);
    expect(result.federalTax).toBe(22500);
    expect(result.provincialTax).toBe(11500);
    expect(result.surtax).toBe(2700);
    expect(result.totalTax).toBe(36700);
  });
});
