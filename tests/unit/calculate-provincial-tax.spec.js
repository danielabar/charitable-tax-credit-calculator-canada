import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateProvincialTax } from "../../js/calculate-provincial-tax.js";

function loadProvince(code) {
  return JSON.parse(
    readFileSync(join(process.cwd(), `config/tax-data/test/provinces/${code}.json`), "utf-8")
  );
}

const onConfig = loadProvince("ON");
const abConfig = loadProvince("AB");
const skConfig = loadProvince("SK");
const nlConfig = loadProvince("NL");

test.describe("Ontario (3 brackets, 5%/10%/15%)", () => {
  test("zero income returns 0", () => {
    expect(calculateProvincialTax(0, onConfig)).toBe(0);
  });

  test("income at BPA returns 0", () => {
    // BPA = 10000, credit = 10000 * 0.05 = 500, gross = 500, net = 0
    expect(calculateProvincialTax(10000, onConfig)).toBe(0);
  });

  test("$80K income", () => {
    // gross = 50000*0.05 + 30000*0.10 = 2500 + 3000 = 5500
    // BPA credit = 500, net = 5000
    expect(calculateProvincialTax(80000, onConfig)).toBe(5000);
  });

  test("$200K income exercises all 3 brackets", () => {
    // gross = 50000*0.05 + 50000*0.10 + 100000*0.15 = 2500 + 5000 + 15000 = 22500
    // BPA credit = 500, net = 22000
    expect(calculateProvincialTax(200000, onConfig)).toBe(22000);
  });
});

test.describe("Alberta (2 brackets, high BPA 20000)", () => {
  test("income at BPA returns 0", () => {
    // BPA = 20000, credit = 20000 * 0.10 = 2000, gross = 2000, net = 0
    expect(calculateProvincialTax(20000, abConfig)).toBe(0);
  });

  test("$80K income", () => {
    // gross = 50000*0.10 + 30000*0.15 = 5000 + 4500 = 9500
    // BPA credit = 2000, net = 7500
    expect(calculateProvincialTax(80000, abConfig)).toBe(7500);
  });
});

test.describe("Saskatchewan (3 brackets, 10%/12%/15%)", () => {
  test("$50K income (within first bracket)", () => {
    // gross = 50000*0.10 = 5000, BPA credit = 18000*0.10 = 1800, net = 3200
    expect(calculateProvincialTax(50000, skConfig)).toBe(3200);
  });

  test("$80K income", () => {
    // gross = 50000*0.10 + 30000*0.12 = 5000 + 3600 = 8600
    // BPA credit = 1800, net = 6800
    expect(calculateProvincialTax(80000, skConfig)).toBe(6800);
  });
});

test.describe("Newfoundland (5 brackets)", () => {
  test("$500K income exercises all 5 brackets", () => {
    // B1: 40000*0.08 = 3200, B2: 40000*0.12 = 4800, B3: 70000*0.15 = 10500
    // B4: 100000*0.18 = 18000, B5: 250000*0.20 = 50000
    // gross = 86500, BPA credit = 10000*0.08 = 800, net = 85700
    expect(calculateProvincialTax(500000, nlConfig)).toBe(85700);
  });
});
