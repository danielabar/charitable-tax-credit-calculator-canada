import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateOntarioSurtax } from "../../js/calculate-ontario-surtax.js";

const onConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/2026/provinces/ON.json"), "utf-8")
);
const surtaxConfig = onConfig.surtax;

test.describe("calculateOntarioSurtax", () => {
  test("below first threshold returns 0", () => {
    expect(calculateOntarioSurtax(4000, surtaxConfig)).toBe(0);
  });

  test("at first threshold returns 0", () => {
    expect(calculateOntarioSurtax(5818, surtaxConfig)).toBe(0);
  });

  test("between thresholds", () => {
    // 20% * (6500 - 5818) = 20% * 682 = 136.40
    const result = calculateOntarioSurtax(6500, surtaxConfig);
    expect(result).toBeCloseTo(136.40, 2);
  });

  test("at second threshold", () => {
    // 20% * (7446 - 5818) = 20% * 1628 = 325.60
    const result = calculateOntarioSurtax(7446, surtaxConfig);
    expect(result).toBeCloseTo(325.60, 2);
  });

  test("above both thresholds", () => {
    // 20% * (10000 - 5818) + 36% * (10000 - 7446)
    // = 20% * 4182 + 36% * 2554
    // = 836.40 + 919.44 = 1755.84
    const result = calculateOntarioSurtax(10000, surtaxConfig);
    expect(result).toBeCloseTo(1755.84, 2);
  });
});
