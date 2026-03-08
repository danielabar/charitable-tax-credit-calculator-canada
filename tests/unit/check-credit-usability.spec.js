import { test, expect } from "@playwright/test";
import { checkCreditUsability } from "../../js/check-credit-usability.js";

test.describe("checkCreditUsability", () => {
  test("O-1: credit fully usable", () => {
    const result = checkCreditUsability(159, 8000, 500);
    expect(result.state).toBe("O-1");
    expect(result.creditUsable).toBe(159);
    expect(result.creditWasted).toBe(0);
    expect(result.actualSavings).toBe(159);
    expect(result.outOfPocketCost).toBe(341);
  });

  test("O-2: credit partly wasted", () => {
    const result = checkCreditUsability(159, 80, 500);
    expect(result.state).toBe("O-2");
    expect(result.creditUsable).toBe(80);
    expect(result.creditWasted).toBe(79);
    expect(result.actualSavings).toBe(80);
    expect(result.outOfPocketCost).toBe(420);
  });

  test("O-3: credit entirely wasted", () => {
    const result = checkCreditUsability(159, 0, 500);
    expect(result.state).toBe("O-3");
    expect(result.creditUsable).toBe(0);
    expect(result.creditWasted).toBe(159);
    expect(result.actualSavings).toBe(0);
    expect(result.outOfPocketCost).toBe(500);
  });

  test("zero donation", () => {
    const result = checkCreditUsability(0, 8000, 0);
    expect(result.state).toBe("O-1");
    expect(result.creditUsable).toBe(0);
    expect(result.creditWasted).toBe(0);
    expect(result.outOfPocketCost).toBe(0);
  });

  test("credit equals tax exactly", () => {
    const result = checkCreditUsability(159, 159, 500);
    expect(result.state).toBe("O-1");
    expect(result.creditUsable).toBe(159);
    expect(result.creditWasted).toBe(0);
  });
});
