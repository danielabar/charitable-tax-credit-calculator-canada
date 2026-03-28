import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateNudge } from "../../js/calculate-nudge.js";
import { UsabilityState } from "../../js/check-credit-usability.js";

const federalConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/test/federal.json"), "utf-8")
);

const onConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/test/provinces/ON.json"), "utf-8")
);

const appSettings = JSON.parse(
  readFileSync(join(process.cwd(), "config/app-settings.json"), "utf-8")
);

// Income $80,000 — total tax = 14,500 (well above any credit, so fully usable)
// Provincial tax at $80K: 50K*0.05 + 30K*0.10 - 10K*0.05 = 5,000
const HIGH_INCOME = 80000;
const HIGH_INCOME_TAX = 14500;
const HIGH_INCOME_PROV_TAX = 5000;

// Income $10,000 — total tax = 0 (entirely wasted)
const ZERO_TAX_INCOME = 10000;
const ZERO_TAX = 0;
const ZERO_PROV_TAX = 0;

// Nudge hypothetical: $250 donation
// Federal: 0.10×200 + 0.20×50 = 30, Provincial: 0.05×200 + 0.10×50 = 15, Total: 45
const NUDGE_AMOUNT = 250;
const NUDGE_CREDIT = 45;

test.describe("calculateNudge", () => {
  test("$200 exact — nudge present", () => {
    // Total credit at $200: 0.10×200 + 0.05×200 = 30
    const result = calculateNudge(
      200, HIGH_INCOME, federalConfig, onConfig, appSettings,
      HIGH_INCOME_TAX, HIGH_INCOME_PROV_TAX, UsabilityState.FULLY_USABLE, 30
    );
    expect(result).not.toBeNull();
    expect(result.hypotheticalAmount).toBe(NUDGE_AMOUNT);
    expect(result.hypotheticalCredit).toBe(NUDGE_CREDIT);
    expect(result.currentCredit).toBe(30);
  });

  test("$190 — nudge present", () => {
    // Total credit at $190: 0.10×190 + 0.05×190 = 28.50
    const result = calculateNudge(
      190, HIGH_INCOME, federalConfig, onConfig, appSettings,
      HIGH_INCOME_TAX, HIGH_INCOME_PROV_TAX, UsabilityState.FULLY_USABLE, 28.50
    );
    expect(result).not.toBeNull();
    expect(result.hypotheticalAmount).toBe(NUDGE_AMOUNT);
    expect(result.hypotheticalCredit).toBe(NUDGE_CREDIT);
    expect(result.currentCredit).toBe(28.50);
  });

  test("$180 — nudge present (within proximity)", () => {
    const result = calculateNudge(
      180, HIGH_INCOME, federalConfig, onConfig, appSettings,
      HIGH_INCOME_TAX, HIGH_INCOME_PROV_TAX, UsabilityState.FULLY_USABLE, 27
    );
    expect(result).not.toBeNull();
    expect(result.hypotheticalAmount).toBe(NUDGE_AMOUNT);
  });

  test("$150 — nudge present (boundary of proximity: 200 * 0.75 = 150)", () => {
    const result = calculateNudge(
      150, HIGH_INCOME, federalConfig, onConfig, appSettings,
      HIGH_INCOME_TAX, HIGH_INCOME_PROV_TAX, UsabilityState.FULLY_USABLE, 22.50
    );
    expect(result).not.toBeNull();
    expect(result.hypotheticalAmount).toBe(NUDGE_AMOUNT);
  });

  test("$149 — nudge null (below proximity threshold)", () => {
    const result = calculateNudge(
      149, HIGH_INCOME, federalConfig, onConfig, appSettings,
      HIGH_INCOME_TAX, HIGH_INCOME_PROV_TAX, UsabilityState.FULLY_USABLE, 22.35
    );
    expect(result).toBeNull();
  });

  test("$201 — nudge null (above threshold)", () => {
    const result = calculateNudge(
      201, HIGH_INCOME, federalConfig, onConfig, appSettings,
      HIGH_INCOME_TAX, HIGH_INCOME_PROV_TAX, UsabilityState.FULLY_USABLE, 30.15
    );
    expect(result).toBeNull();
  });

  test("$500 — nudge null (well above threshold)", () => {
    const result = calculateNudge(
      500, HIGH_INCOME, federalConfig, onConfig, appSettings,
      HIGH_INCOME_TAX, HIGH_INCOME_PROV_TAX, UsabilityState.FULLY_USABLE, 120
    );
    expect(result).toBeNull();
  });

  test("low income, credit entirely wasted — nudge suppressed", () => {
    const result = calculateNudge(
      180, ZERO_TAX_INCOME, federalConfig, onConfig, appSettings,
      ZERO_TAX, ZERO_PROV_TAX, UsabilityState.ENTIRELY_WASTED, 27
    );
    expect(result).toBeNull();
  });
});
