import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateDonationCredit } from "../../js/calculate-donation-credit.js";

const federalConfig = JSON.parse(
  readFileSync(join(process.cwd(), "config/tax-data/test/federal.json"), "utf-8")
);

function loadProvince(code) {
  return JSON.parse(
    readFileSync(join(process.cwd(), `config/tax-data/test/provinces/${code}.json`), "utf-8")
  );
}

const onConfig = loadProvince("ON");
const abConfig = loadProvince("AB");
const bcConfig = loadProvince("BC");

// Mid-range income (below top bracket) — used for standard tests
const MID_INCOME = 80000;

test.describe("calculateDonationCredit", () => {
  test("$0 donation returns all zeros", () => {
    const result = calculateDonationCredit(0, MID_INCOME, federalConfig, onConfig);
    expect(result.federalCredit).toBe(0);
    expect(result.provincialCredit).toBe(0);
    expect(result.totalCredit).toBe(0);
    expect(result.topBracketPortion).toBe(0);
  });

  test("$100 donation in ON (below threshold, only lowRate)", () => {
    // Federal: 0.10 * 100 = 10, Provincial: 0.05 * 100 = 5, Total: 15
    const result = calculateDonationCredit(100, MID_INCOME, federalConfig, onConfig);
    expect(result.federalCredit).toBe(10);
    expect(result.provincialCredit).toBe(5);
    expect(result.totalCredit).toBe(15);
    expect(result.topBracketPortion).toBe(0);
  });

  test("$200 donation in ON (at threshold)", () => {
    // Federal: 0.10 * 200 = 20, Provincial: 0.05 * 200 = 10, Total: 30
    const result = calculateDonationCredit(200, MID_INCOME, federalConfig, onConfig);
    expect(result.federalCredit).toBe(20);
    expect(result.provincialCredit).toBe(10);
    expect(result.totalCredit).toBe(30);
    expect(result.topBracketPortion).toBe(0);
  });

  test("$500 donation in ON (over threshold, both tiers)", () => {
    // Federal: 0.10*200 + 0.20*300 = 80, Provincial: 0.05*200 + 0.10*300 = 40, Total: 120
    const result = calculateDonationCredit(500, MID_INCOME, federalConfig, onConfig);
    expect(result.federalCredit).toBe(80);
    expect(result.provincialCredit).toBe(40);
    expect(result.totalCredit).toBe(120);
    expect(result.topBracketPortion).toBe(0);
  });

  test("$200 donation in AB", () => {
    // Federal: 0.10 * 200 = 20, Provincial: 0.10 * 200 = 20, Total: 40
    const result = calculateDonationCredit(200, MID_INCOME, federalConfig, abConfig);
    expect(result.federalCredit).toBe(20);
    expect(result.provincialCredit).toBe(20);
    expect(result.totalCredit).toBe(40);
  });

  test("$5000 donation in BC (large donation)", () => {
    // Federal: 0.10*200 + 0.20*4800 = 20 + 960 = 980
    // Provincial: 0.05*200 + 0.12*4800 = 10 + 576 = 586
    // Total: 1566
    const result = calculateDonationCredit(5000, MID_INCOME, federalConfig, bcConfig);
    expect(result.federalCredit).toBe(980);
    expect(result.provincialCredit).toBe(586);
    expect(result.totalCredit).toBe(1566);
    expect(result.topBracketPortion).toBe(0);
  });
});

test.describe("calculateDonationCredit — top bracket rule", () => {
  test("income below top bracket — no topRate applied", () => {
    // $200,000 income, $500 donation — standard 2-tier
    // Federal: 0.10*200 + 0.20*300 = 80
    const result = calculateDonationCredit(500, 200000, federalConfig, onConfig);
    expect(result.federalCredit).toBe(80);
    expect(result.topBracketPortion).toBe(0);
  });

  test("income at exactly top bracket threshold — no topRate applied", () => {
    // $250,000 income, $500 donation — $0 in top bracket
    const result = calculateDonationCredit(500, 250000, federalConfig, onConfig);
    expect(result.federalCredit).toBe(80);
    expect(result.topBracketPortion).toBe(0);
  });

  test("income just above threshold — all high portion at topRate", () => {
    // $260,000 income, $5,000 donation
    // Top bracket income: 260000 - 250000 = 10000
    // High portion = 4800, topBracketPortion = min(4800, 10000) = 4800
    // Federal: 0.10*200 + 0.30*4800 = 20 + 1440 = 1460
    const result = calculateDonationCredit(5000, 260000, federalConfig, onConfig);
    expect(result.federalCredit).toBe(1460);
    expect(result.topBracketPortion).toBe(4800);
  });

  test("income well above threshold — all high portion at topRate", () => {
    // $300,000 income, $500 donation
    // Top bracket income: 50000, high portion = 300
    // topBracketPortion = min(300, 50000) = 300
    // Federal: 0.10*200 + 0.30*300 = 20 + 90 = 110
    const result = calculateDonationCredit(500, 300000, federalConfig, onConfig);
    expect(result.federalCredit).toBe(110);
    expect(result.topBracketPortion).toBe(300);
  });

  test("income well above threshold — donation at or below $200 (topRate irrelevant)", () => {
    // $300,000 income, $150 donation — only lowRate applies
    // Federal: 0.10 * 150 = 15
    const result = calculateDonationCredit(150, 300000, federalConfig, onConfig);
    expect(result.federalCredit).toBe(15);
    expect(result.topBracketPortion).toBe(0);
  });

  test("large donation exceeding top-bracket income — split topRate/highRate", () => {
    // $260,000 income, $25,000 donation
    // Top bracket income: 10000, high portion = 24800
    // topBracketPortion = min(24800, 10000) = 10000
    // Federal: 0.10*200 + 0.30*10000 + 0.20*(24800-10000) = 20 + 3000 + 2960 = 5980
    const result = calculateDonationCredit(25000, 260000, federalConfig, onConfig);
    expect(result.federalCredit).toBe(5980);
    expect(result.topBracketPortion).toBe(10000);
  });
});
