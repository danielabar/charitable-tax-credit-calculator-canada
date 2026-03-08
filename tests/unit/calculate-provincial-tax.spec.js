import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateProvincialTax } from "../../js/calculate-provincial-tax.js";

function loadProvince(code) {
  return JSON.parse(
    readFileSync(join(process.cwd(), `config/tax-data/2026/provinces/${code}.json`), "utf-8")
  );
}

const onConfig = loadProvince("ON");
const abConfig = loadProvince("AB");
const skConfig = loadProvince("SK");
const nlConfig = loadProvince("NL");

test.describe("Ontario (5 brackets, lowest 5.05%)", () => {
  test("zero income returns 0", () => {
    expect(calculateProvincialTax(0, onConfig)).toBe(0);
  });

  test("income below BPA returns 0", () => {
    // BPA = 12989, BPA credit = 12989 * 0.0505 = 655.9445
    // $12,000: gross = 12000 * 0.0505 = 606, net = 0
    expect(calculateProvincialTax(12000, onConfig)).toBe(0);
  });

  test("$80K income", () => {
    // B1: 53891 * 0.0505 = 2721.4955
    // B2: (80000 - 53891) * 0.0915 = 26109 * 0.0915 = 2388.9735
    // gross = 5110.469, net = 5110.469 - 655.9445 = 4454.52
    const result = calculateProvincialTax(80000, onConfig);
    expect(result).toBeCloseTo(4454.52, 0);
  });

  test("$200K income exercises 4 brackets", () => {
    // B1: 53891 * 0.0505 = 2721.4955
    // B2: 53894 * 0.0915 = 4931.301
    // B3: 42215 * 0.1116 = 4711.194
    // B4: 50000 * 0.1216 = 6080
    // gross = 18443.99, net = 18443.99 - 655.94 = 17788.05
    const result = calculateProvincialTax(200000, onConfig);
    expect(result).toBeCloseTo(17788.05, 0);
  });
});

test.describe("Alberta (6 brackets, high BPA 22769)", () => {
  test("income below AB BPA returns 0", () => {
    // BPA = 22769, BPA credit = 22769 * 0.08 = 1821.52
    // $20,000: gross = 20000 * 0.08 = 1600, net = 0
    expect(calculateProvincialTax(20000, abConfig)).toBe(0);
  });

  test("$80K income", () => {
    // B1: 61200 * 0.08 = 4896
    // B2: 18800 * 0.10 = 1880
    // gross = 6776, net = 6776 - 1821.52 = 4954.48
    const result = calculateProvincialTax(80000, abConfig);
    expect(result).toBeCloseTo(4954.48, 2);
  });
});

test.describe("Saskatchewan (3 brackets, simplest)", () => {
  test("$50K income (within first bracket)", () => {
    // BPA credit = 20381 * 0.105 = 2140.005
    // gross = 50000 * 0.105 = 5250
    // net = 5250 - 2140.005 = 3109.995
    const result = calculateProvincialTax(50000, skConfig);
    expect(result).toBeCloseTo(3110.00, 0);
  });

  test("$80K income", () => {
    // B1: 54532 * 0.105 = 5725.86
    // B2: 25468 * 0.125 = 3183.50
    // gross = 8909.36, net = 8909.36 - 2140.005 = 6769.355
    const result = calculateProvincialTax(80000, skConfig);
    expect(result).toBeCloseTo(6769.36, 0);
  });
});

test.describe("Newfoundland (8 brackets, most complex)", () => {
  test("$1.2M income exercises all 8 brackets", () => {
    // BPA credit = 11188 * 0.087 = 973.356
    // All 8 brackets exercised at $1,200,000
    const result = calculateProvincialTax(1200000, nlConfig);
    expect(result).toBeCloseTo(237803.6, 0);
  });
});
