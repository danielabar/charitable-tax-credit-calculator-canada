/**
 * Unit tests for URL state parsing (parseUrlState).
 * Tests the pure parsing function extracted from readStateFromUrl.
 */
import { test, expect } from "@playwright/test";
import { parseUrlState } from "../../js/ui/url-state.js";

test.describe("parseUrlState — forward mode", () => {
  test("parses forward URL with all params", () => {
    const result = parseUrlState("?province=ON&income=60000&donation=500");
    expect(result).toEqual({
      mode: "forward",
      province: "ON",
      income: 60000,
      donation: 500,
    });
  });

  test("explicit mode=forward works the same", () => {
    const result = parseUrlState("?mode=forward&province=ON&income=60000&donation=500");
    expect(result).toEqual({
      mode: "forward",
      province: "ON",
      income: 60000,
      donation: 500,
    });
  });

  test("backward compat: no mode param defaults to forward", () => {
    const result = parseUrlState("?province=BC&income=45000&donation=200");
    expect(result.mode).toBe("forward");
  });

  test("returns null when donation is missing", () => {
    expect(parseUrlState("?province=ON&income=60000")).toBeNull();
  });

  test("returns null when province is missing", () => {
    expect(parseUrlState("?income=60000&donation=500")).toBeNull();
  });

  test("returns null when income is missing", () => {
    expect(parseUrlState("?province=ON&donation=500")).toBeNull();
  });

  test("returns null for non-numeric income", () => {
    expect(parseUrlState("?province=ON&income=abc&donation=500")).toBeNull();
  });

  test("returns null for zero donation", () => {
    expect(parseUrlState("?province=ON&income=60000&donation=0")).toBeNull();
  });

  test("returns null for negative donation", () => {
    expect(parseUrlState("?province=ON&income=60000&donation=-100")).toBeNull();
  });

  test("allows zero income", () => {
    const result = parseUrlState("?province=ON&income=0&donation=500");
    expect(result).not.toBeNull();
    expect(result.income).toBe(0);
  });

  test("returns null for negative income", () => {
    expect(parseUrlState("?province=ON&income=-1000&donation=500")).toBeNull();
  });
});

test.describe("parseUrlState — reverse mode", () => {
  test("parses reverse URL with all params", () => {
    const result = parseUrlState("?mode=reverse&province=ON&income=60000&refund=100");
    expect(result).toEqual({
      mode: "reverse",
      province: "ON",
      income: 60000,
      refund: 100,
    });
  });

  test("returns null when refund is missing in reverse mode", () => {
    expect(parseUrlState("?mode=reverse&province=ON&income=60000")).toBeNull();
  });

  test("returns null for zero refund", () => {
    expect(parseUrlState("?mode=reverse&province=ON&income=60000&refund=0")).toBeNull();
  });

  test("returns null for negative refund", () => {
    expect(parseUrlState("?mode=reverse&province=ON&income=60000&refund=-50")).toBeNull();
  });

  test("returns null for non-numeric refund", () => {
    expect(parseUrlState("?mode=reverse&province=ON&income=60000&refund=abc")).toBeNull();
  });

  test("allows zero income in reverse mode", () => {
    const result = parseUrlState("?mode=reverse&province=ON&income=0&refund=100");
    expect(result).not.toBeNull();
    expect(result.income).toBe(0);
  });
});

test.describe("parseUrlState — unknown mode", () => {
  test("unknown mode treats as forward", () => {
    const result = parseUrlState("?mode=bogus&province=ON&income=60000&donation=500");
    expect(result).toEqual({
      mode: "forward",
      province: "ON",
      income: 60000,
      donation: 500,
    });
  });
});

test.describe("parseUrlState — empty/no params", () => {
  test("empty string returns null", () => {
    expect(parseUrlState("")).toBeNull();
  });

  test("just a question mark returns null", () => {
    expect(parseUrlState("?")).toBeNull();
  });
});
