import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateOntarioSurtax } from "../../js/calculate-ontario-surtax.js";

const onConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/test/provinces/ON.json"), "utf-8")
);
const surtaxConfig = onConfig.surtax;

test.describe("calculateOntarioSurtax", () => {
  test("below first threshold returns 0", () => {
    expect(calculateOntarioSurtax(4000, surtaxConfig)).toBe(0);
  });

  test("at first threshold returns 0", () => {
    expect(calculateOntarioSurtax(5000, surtaxConfig)).toBe(0);
  });

  test("between thresholds", () => {
    // 20% * (6000 - 5000) = 200
    expect(calculateOntarioSurtax(6000, surtaxConfig)).toBe(200);
  });

  test("at second threshold", () => {
    // 20% * (8000 - 5000) = 600
    expect(calculateOntarioSurtax(8000, surtaxConfig)).toBe(600);
  });

  test("above both thresholds", () => {
    // 20% * (10000 - 5000) + 40% * (10000 - 8000)
    // = 1000 + 800 = 1800
    expect(calculateOntarioSurtax(10000, surtaxConfig)).toBe(1800);
  });
});
