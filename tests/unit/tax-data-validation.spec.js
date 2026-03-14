import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const configDir = join(process.cwd(), "config/tax-data/2026");
const provincesDir = join(configDir, "provinces");

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

const provinceFiles = readdirSync(provincesDir).filter((f) => f.endsWith(".json"));
test.describe("Tax data config files", () => {
  test("federal.json parses as valid JSON", () => {
    const data = loadJson(join(configDir, "federal.json"));
    expect(data).toBeTruthy();
  });

  for (const file of provinceFiles) {
    test(`${file} parses as valid JSON`, () => {
      const data = loadJson(join(provincesDir, file));
      expect(data).toBeTruthy();
    });
  }

  test("12 province/territory files exist (no Quebec)", () => {
    expect(provinceFiles.length).toBe(12);
    const codes = provinceFiles.map((f) => f.replace(".json", ""));
    expect(codes).not.toContain("QC");
    for (const expected of ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "SK", "YT"]) {
      expect(codes).toContain(expected);
    }
  });
});

test.describe("Required fields", () => {
  function getAllConfigs() {
    const configs = [
      { file: "federal.json", data: loadJson(join(configDir, "federal.json")) },
    ];
    for (const file of provinceFiles) {
      configs.push({ file, data: loadJson(join(provincesDir, file)) });
    }
    return configs;
  }

  const configs = getAllConfigs();

  for (const { file, data } of configs) {
    test(`${file} has required fields`, () => {
      expect(data.jurisdiction).toBeTruthy();
      expect(data.incomeTax).toBeTruthy();
      expect(data.incomeTax.brackets).toBeTruthy();
      expect(Array.isArray(data.incomeTax.brackets)).toBe(true);
      const bpa = data.incomeTax.basicPersonalAmount;
      if (typeof bpa === "number") {
        expect(bpa).toBeGreaterThan(0);
      } else {
        expect(bpa.maximum).toBeGreaterThan(0);
        expect(bpa.minimum).toBeGreaterThan(0);
        expect(bpa.maximum).toBeGreaterThan(bpa.minimum);
        expect(bpa.phaseoutStart).toBeGreaterThan(0);
        expect(bpa.phaseoutEnd).toBeGreaterThan(bpa.phaseoutStart);
      }
      expect(data.donationCredit).toBeTruthy();
      expect(data.donationCredit.lowRate).toBeGreaterThan(0);
      expect(data.donationCredit.highRate).toBeGreaterThan(0);
      expect(data.donationCredit.lowRateThreshold).toBe(200);
    });

    test(`${file} brackets are in ascending order with last being null`, () => {
      const brackets = data.incomeTax.brackets;
      expect(brackets.length).toBeGreaterThanOrEqual(3);

      // Last bracket must have null upTo
      expect(brackets[brackets.length - 1].upTo).toBeNull();

      // All other brackets must have ascending upTo values
      for (let i = 0; i < brackets.length - 1; i++) {
        expect(brackets[i].upTo).not.toBeNull();
        if (i > 0) {
          expect(brackets[i].upTo).toBeGreaterThan(brackets[i - 1].upTo);
        }
      }
    });

    test(`${file} rates are between 0 and 1`, () => {
      for (const bracket of data.incomeTax.brackets) {
        expect(bracket.rate).toBeGreaterThan(0);
        expect(bracket.rate).toBeLessThan(1);
      }
      expect(data.donationCredit.lowRate).toBeGreaterThan(0);
      expect(data.donationCredit.lowRate).toBeLessThan(1);
      expect(data.donationCredit.highRate).toBeGreaterThan(0);
      expect(data.donationCredit.highRate).toBeLessThan(1);
    });
  }
});

test.describe("Spot-check specific values", () => {
  test("federal BPA maximum is 16,452 with phaseout to 14,829", () => {
    const data = loadJson(join(configDir, "federal.json"));
    const bpa = data.incomeTax.basicPersonalAmount;
    expect(bpa.maximum).toBe(16452);
    expect(bpa.minimum).toBe(14829);
    expect(bpa.phaseoutStart).toBe(181440);
    expect(bpa.phaseoutEnd).toBe(258482);
  });

  test("federal lowest rate is 14%", () => {
    const data = loadJson(join(configDir, "federal.json"));
    expect(data.incomeTax.brackets[0].rate).toBe(0.14);
  });

  test("federal donation credit rates are 14% and 29%", () => {
    const data = loadJson(join(configDir, "federal.json"));
    expect(data.donationCredit.lowRate).toBe(0.14);
    expect(data.donationCredit.highRate).toBe(0.29);
  });

  test("Alberta BPA is 22,769", () => {
    const data = loadJson(join(provincesDir, "AB.json"));
    expect(data.incomeTax.basicPersonalAmount).toBe(22769);
  });

  test("Alberta donation credit lowRate is 60%", () => {
    const data = loadJson(join(provincesDir, "AB.json"));
    expect(data.donationCredit.lowRate).toBe(0.60);
  });

  test("Newfoundland has 8 brackets", () => {
    const data = loadJson(join(provincesDir, "NL.json"));
    expect(data.incomeTax.brackets.length).toBe(8);
  });

  test("Saskatchewan has 3 brackets", () => {
    const data = loadJson(join(provincesDir, "SK.json"));
    expect(data.incomeTax.brackets.length).toBe(3);
  });

  test("Ontario has a surtax object", () => {
    const data = loadJson(join(provincesDir, "ON.json"));
    expect(data.surtax).toBeTruthy();
    expect(data.surtax.thresholds).toBeTruthy();
    expect(data.surtax.thresholds.length).toBe(2);
    expect(data.surtax.thresholds[0].over).toBe(5818);
    expect(data.surtax.thresholds[0].rate).toBe(0.20);
    expect(data.surtax.thresholds[1].over).toBe(7446);
    expect(data.surtax.thresholds[1].rate).toBe(0.36);
  });

  test("no other province has a surtax", () => {
    for (const file of provinceFiles) {
      if (file === "ON.json") continue;
      const data = loadJson(join(provincesDir, file));
      expect(data.surtax).toBeFalsy();
    }
  });

  test("BC donation credit lowRate is 5.06% (not 5.60%)", () => {
    const data = loadJson(join(provincesDir, "BC.json"));
    expect(data.donationCredit.lowRate).toBe(0.0506);
  });

  test("Ontario donation credit highRate is 11.16% (not 13.16%)", () => {
    const data = loadJson(join(provincesDir, "ON.json"));
    expect(data.donationCredit.highRate).toBe(0.1116);
  });
});
