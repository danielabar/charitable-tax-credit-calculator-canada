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
    expect(calculateOntarioSurtax(5315, surtaxConfig)).toBe(0);
  });

  test("between thresholds", () => {
    // 20% * (6000 - 5315) = 20% * 685 = 137
    const result = calculateOntarioSurtax(6000, surtaxConfig);
    expect(result).toBeCloseTo(137, 2);
  });

  test("at second threshold", () => {
    // 20% * (6802 - 5315) = 20% * 1487 = 297.40
    const result = calculateOntarioSurtax(6802, surtaxConfig);
    expect(result).toBeCloseTo(297.40, 2);
  });

  test("above both thresholds", () => {
    // 20% * (10000 - 5315) + 36% * (10000 - 6802)
    // = 20% * 4685 + 36% * 3198
    // = 937 + 1151.28 = 2088.28
    const result = calculateOntarioSurtax(10000, surtaxConfig);
    expect(result).toBeCloseTo(2088.28, 2);
  });
});
