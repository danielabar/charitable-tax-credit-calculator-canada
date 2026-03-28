import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateSurtaxSavings } from "../../js/calculate-surtax-savings.js";

const onConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/test/provinces/ON.json"), "utf-8")
);
const surtaxConfig = onConfig.surtax;

// Test config surtax: 20% over $5,000 + 40% over $8,000

test.describe("calculateSurtaxSavings", () => {
  test("below first threshold — no surtax savings", () => {
    const result = calculateSurtaxSavings(4000, 500, surtaxConfig);
    expect(result.surtaxSavings).toBe(0);
  });

  test("between thresholds, credit stays between", () => {
    // provincialTax=7000, credit=500 → after=6500, both between thresholds
    // before: 20% * (7000-5000) = 400
    // after:  20% * (6500-5000) = 300
    // savings: 100
    const result = calculateSurtaxSavings(7000, 500, surtaxConfig);
    expect(result.surtaxSavings).toBe(100);
  });

  test("above both thresholds, credit stays above both", () => {
    // provincialTax=10000, credit=500 → after=9500
    // before: 20%*(10000-5000) + 40%*(10000-8000) = 1000+800 = 1800
    // after:  20%*(9500-5000)  + 40%*(9500-8000)  = 900+600  = 1500
    // savings: 300 = 500 * (0.20 + 0.40)
    const result = calculateSurtaxSavings(10000, 500, surtaxConfig);
    expect(result.surtaxSavings).toBe(300);
  });

  test("credit crosses second threshold down", () => {
    // provincialTax=9000, credit=2000 → after=7000
    // before: 20%*(9000-5000) + 40%*(9000-8000) = 800+400 = 1200
    // after:  20%*(7000-5000) + 40%*0            = 400+0   = 400
    // savings: 800
    const result = calculateSurtaxSavings(9000, 2000, surtaxConfig);
    expect(result.surtaxSavings).toBe(800);
  });

  test("credit crosses first threshold down", () => {
    // provincialTax=6000, credit=3000 → after=3000
    // before: 20%*(6000-5000) = 200
    // after:  0 (3000 < 5000)
    // savings: 200
    const result = calculateSurtaxSavings(6000, 3000, surtaxConfig);
    expect(result.surtaxSavings).toBe(200);
  });

  test("credit crosses both thresholds down", () => {
    // provincialTax=9000, credit=6000 → after=3000
    // before: 20%*(9000-5000) + 40%*(9000-8000) = 800+400 = 1200
    // after:  0 (3000 < 5000)
    // savings: 1200
    const result = calculateSurtaxSavings(9000, 6000, surtaxConfig);
    expect(result.surtaxSavings).toBe(1200);
  });

  test("credit exceeds provincial tax", () => {
    // provincialTax=2000, credit=5000 → after=0 (clamped)
    // before: 0 (2000 < 5000 threshold)
    // after:  0
    // savings: 0
    const result = calculateSurtaxSavings(2000, 5000, surtaxConfig);
    expect(result.surtaxSavings).toBe(0);
  });

  test("zero donation credit", () => {
    const result = calculateSurtaxSavings(10000, 0, surtaxConfig);
    expect(result.surtaxSavings).toBe(0);
  });
});
