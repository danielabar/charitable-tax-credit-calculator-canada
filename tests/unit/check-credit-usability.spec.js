import { test, expect } from "@playwright/test";
import { checkCreditUsability, UsabilityState } from "../../js/check-credit-usability.js";

test.describe("checkCreditUsability", () => {
  test("fully usable: credit ≤ tax", () => {
    const result = checkCreditUsability(159, 8000, 500);
    expect(result.state).toBe(UsabilityState.FULLY_USABLE);
    expect(result.creditUsable).toBe(159);
    expect(result.creditWasted).toBe(0);
    expect(result.actualSavings).toBe(159);
    expect(result.outOfPocketCost).toBe(341);
  });

  test("partly wasted: credit > tax, tax > 0", () => {
    const result = checkCreditUsability(159, 80, 500);
    expect(result.state).toBe(UsabilityState.PARTLY_WASTED);
    expect(result.creditUsable).toBe(80);
    expect(result.creditWasted).toBe(79);
    expect(result.actualSavings).toBe(80);
    expect(result.outOfPocketCost).toBe(420);
  });

  test("entirely wasted: tax = $0", () => {
    const result = checkCreditUsability(159, 0, 500);
    expect(result.state).toBe(UsabilityState.ENTIRELY_WASTED);
    expect(result.creditUsable).toBe(0);
    expect(result.creditWasted).toBe(159);
    expect(result.actualSavings).toBe(0);
    expect(result.outOfPocketCost).toBe(500);
  });

  test("zero donation", () => {
    const result = checkCreditUsability(0, 8000, 0);
    expect(result.state).toBe(UsabilityState.FULLY_USABLE);
    expect(result.creditUsable).toBe(0);
    expect(result.creditWasted).toBe(0);
    expect(result.outOfPocketCost).toBe(0);
  });

  test("credit equals tax exactly", () => {
    const result = checkCreditUsability(159, 159, 500);
    expect(result.state).toBe(UsabilityState.FULLY_USABLE);
    expect(result.creditUsable).toBe(159);
    expect(result.creditWasted).toBe(0);
  });
});
