import { test, expect } from "@playwright/test";
import { checkDonationClaimLimit } from "../../js/check-donation-claim-limit.js";

test.describe("checkDonationClaimLimit", () => {
  test("under limit — returns false", () => {
    const result = checkDonationClaimLimit(50000, 100000, 0.75);
    expect(result.exceedsLimit).toBe(false);
  });

  test("exactly at limit — returns false", () => {
    const result = checkDonationClaimLimit(75000, 100000, 0.75);
    expect(result.exceedsLimit).toBe(false);
  });

  test("over limit — returns true", () => {
    const result = checkDonationClaimLimit(75001, 100000, 0.75);
    expect(result.exceedsLimit).toBe(true);
  });

  test("way over limit — returns true", () => {
    const result = checkDonationClaimLimit(100000, 100000, 0.75);
    expect(result.exceedsLimit).toBe(true);
  });

  test("zero income, positive donation — returns false", () => {
    const result = checkDonationClaimLimit(500, 0, 0.75);
    expect(result.exceedsLimit).toBe(false);
  });

  test("zero donation — returns false", () => {
    const result = checkDonationClaimLimit(0, 100000, 0.75);
    expect(result.exceedsLimit).toBe(false);
  });

  test("small donation, small income — over limit returns true", () => {
    const result = checkDonationClaimLimit(800, 1000, 0.75);
    expect(result.exceedsLimit).toBe(true);
  });
});
