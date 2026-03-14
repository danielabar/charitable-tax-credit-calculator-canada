import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateFederalTax } from "../../js/calculate-federal-tax.js";

const federalConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/test/federal.json"), "utf-8")
);

test.describe("calculateFederalTax", () => {
  test("zero income returns 0", () => {
    expect(calculateFederalTax(0, federalConfig)).toBe(0);
  });

  test("income at BPA returns 0", () => {
    // $15,000 = max BPA, credit = 15000 * 0.10 = 1500, gross = 1500, net = 0
    expect(calculateFederalTax(15000, federalConfig)).toBe(0);
  });

  test("income just above BPA", () => {
    // $20,000: gross = 20000 * 0.10 = 2000, BPA credit = 1500, net = 500
    expect(calculateFederalTax(20000, federalConfig)).toBe(500);
  });

  test("mid first bracket", () => {
    // $40,000: gross = 4000, BPA credit = 1500, net = 2500
    expect(calculateFederalTax(40000, federalConfig)).toBe(2500);
  });

  test("at first bracket boundary", () => {
    // $50,000: gross = 5000, BPA credit = 1500, net = 3500
    expect(calculateFederalTax(50000, federalConfig)).toBe(3500);
  });

  test("second bracket", () => {
    // $80,000: 50000*0.10 + 30000*0.20 = 11000, BPA credit = 1500, net = 9500
    expect(calculateFederalTax(80000, federalConfig)).toBe(9500);
  });

  test("income at phaseout start uses maximum BPA", () => {
    // $150,000: gross = 50000*0.10 + 50000*0.20 + 50000*0.30 = 30000
    // BPA = max (15000), credit = 1500, net = 28500
    expect(calculateFederalTax(150000, federalConfig)).toBe(28500);
  });

  test("income mid-phaseout gets reduced BPA", () => {
    // $200,000: additional = 15000-12000 = 3000
    // reduction = 3000 * (200000-150000)/(250000-150000) = 1500
    // effective BPA = 13500, credit = 1350
    // gross = 50000*0.10 + 50000*0.20 + 100000*0.30 = 45000
    // net = 45000 - 1350 = 43650
    expect(calculateFederalTax(200000, federalConfig)).toBe(43650);
  });

  test("income at phaseout end uses minimum BPA", () => {
    // $250,000: BPA = min (12000), credit = 1200
    // gross = 50000*0.10 + 50000*0.20 + 150000*0.30 = 60000
    // net = 60000 - 1200 = 58800
    expect(calculateFederalTax(250000, federalConfig)).toBe(58800);
  });

  test("high income above phaseout uses minimum BPA", () => {
    // $300,000: BPA = min (12000), credit = 1200
    // gross = 50000*0.10 + 50000*0.20 + 200000*0.30 = 75000
    // net = 75000 - 1200 = 73800
    expect(calculateFederalTax(300000, federalConfig)).toBe(73800);
  });
});
