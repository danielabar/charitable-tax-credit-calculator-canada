# Configuration

All tax rates, brackets, thresholds, and behavior settings are loaded from JSON config files at runtime. Nothing is hardcoded in JavaScript.

## Overview of config files

| File | Purpose |
|---|---|
| `config/app-settings.json` | UI/behavior settings (narrative thresholds, nudge percentages) |
| `config/tax-data/{year}/federal.json` | Federal tax brackets, BPA, donation credit rates |
| `config/tax-data/{year}/provinces/{CODE}.json` | Provincial tax brackets, BPA, donation credit rates, surtax |
| `config/learn.json` | Learn page scenario inputs (income and donation per taxpayer category) |

Config files are fetched via `js/load-config.js`, which caches them after the first load.

## App settings reference

`config/app-settings.json`:

```json
{
  "narrative": {
    "thresholdProximityPercent": 0.75,
    "nudgeAboveThresholdPercent": 0.25
  },
  "reverseSlider": {
    "min": 10,
    "max": 500,
    "defaultValue": 100,
    "step": 1
  },
  "inputLimits": {
    "income": { "min": 0, "max": 500000 },
    "donation": { "min": 1, "max": 250000 }
  },
  "donationClaimLimitPercent": 0.75
}
```

| Key | Type | Default | Purpose |
|---|---|---|---|
| `narrative.thresholdProximityPercent` | number (0–1) | `0.75` | How close a donation must be to the $200 threshold to trigger the nudge hint. At `0.75`, donations of $150+ show the nudge. |
| `narrative.nudgeAboveThresholdPercent` | number (0–1) | `0.25` | How far above the threshold the hypothetical nudge amount is. At `0.25`, the nudge suggests $250 (200 * 1.25). |
| `reverseSlider.min` | number | `10` | Minimum refund amount on the reverse mode slider. |
| `reverseSlider.max` | number | `500` | Maximum refund amount on the reverse mode slider. |
| `reverseSlider.defaultValue` | number | `100` | Default slider position when reverse mode is first opened. |
| `reverseSlider.step` | number | `1` | Step increment for the slider (1 = dollar-by-dollar). |
| `inputLimits.income.min` | number | `0` | Minimum allowed income value |
| `inputLimits.income.max` | number | `500000` | Maximum allowed income value |
| `inputLimits.donation.min` | number | `1` | Minimum allowed donation value |
| `inputLimits.donation.max` | number | `250000` | Maximum allowed donation value |
| `donationClaimLimitPercent` | number (0–1) | `0.75` | CRA annual claiming limit as percentage of net income. Triggers an informational warning when the donation exceeds this percentage of the user's entered income. Based on ITA Section 118.1. |

## Learn config reference

`config/learn.json`:

| Key | Type | Description |
|---|---|---|
| `creditOutcomeScenarios` | object | Defines the four taxpayer scenarios shown on the Learn page |
| `creditOutcomeScenarios.<key>.income` | number | Representative income for this scenario |
| `creditOutcomeScenarios.<key>.donation` | number | Representative donation amount for this scenario |
| `reverseLookupTargets` | array of numbers | Refund target amounts for the reverse lookup cards |

The four scenario keys are:
- `nonTaxpayer` — income below both federal and provincial BPA (tax = $0)
- `partialTaxpayer` — income just above the lowest BPA (tax < credit)
- `fullTaxpayerLow` — moderate income, donation ≤ $200 (full credit usable)
- `fullTaxpayerHigh` — moderate income, donation > $200 (shows higher rate tier)

These values are editorial choices — they should be round, relatable numbers
that clearly illustrate each category. The Learn page computes tax, credit,
and "gets back" amounts dynamically from these inputs using the Ontario config.

`reverseLookupTargets` defines the "get back" amounts shown in the reverse lookup section. Each target triggers a reverse calculation to determine the donation needed. Values should be round, relatable numbers in ascending order. The first target should be achievable with a donation under $200 (to illustrate the low-rate tier).

## Tax data file format

### Federal config

`config/tax-data/{year}/federal.json`:

```json
{
  "jurisdiction": "federal",
  "name": "Federal",
  "year": 2026,
  "incomeTax": {
    "brackets": [
      { "upTo": 58523, "rate": 0.14 },
      { "upTo": 117045, "rate": 0.205 },
      { "upTo": 181440, "rate": 0.26 },
      { "upTo": 258482, "rate": 0.29 },
      { "upTo": null, "rate": 0.33 }
    ],
    "basicPersonalAmount": {
      "maximum": 16452,
      "minimum": 14829,
      "phaseoutStart": 181440,
      "phaseoutEnd": 258482
    }
  },
  "donationCredit": {
    "lowRate": 0.14,
    "highRate": 0.29,
    "topRate": 0.33,
    "topRateThreshold": 258482,
    "lowRateThreshold": 200
  }
}
```

| Field | Required | Description |
|---|---|---|
| `jurisdiction` | Yes | `"federal"` |
| `name` | Yes | Display name |
| `year` | Yes | Tax year |
| `incomeTax.brackets` | Yes | Progressive tax brackets. Each has `upTo` (income ceiling, `null` for top bracket) and `rate` (decimal). Must be sorted by `upTo` ascending. |
| `incomeTax.basicPersonalAmount.maximum` | Yes | Full BPA for lower incomes |
| `incomeTax.basicPersonalAmount.minimum` | Yes | Reduced BPA for top-bracket earners |
| `incomeTax.basicPersonalAmount.phaseoutStart` | Yes | Income where BPA starts reducing |
| `incomeTax.basicPersonalAmount.phaseoutEnd` | Yes | Income where BPA reaches minimum |
| `donationCredit.lowRate` | Yes | Credit rate on first $200 of donations |
| `donationCredit.highRate` | Yes | Credit rate on amounts over $200 (standard) |
| `donationCredit.topRate` | Yes | Credit rate for top-bracket earners on amounts over $200 |
| `donationCredit.topRateThreshold` | Yes | Income above which `topRate` applies |
| `donationCredit.lowRateThreshold` | Yes | Donation amount where rate switches (currently $200) |

### Provincial config

`config/tax-data/{year}/provinces/{CODE}.json`:

```json
{
  "jurisdiction": "ON",
  "name": "Ontario",
  "year": 2026,
  "incomeTax": {
    "brackets": [
      { "upTo": 53891, "rate": 0.0505 },
      { "upTo": 107785, "rate": 0.0915 },
      { "upTo": 150000, "rate": 0.1116 },
      { "upTo": 220000, "rate": 0.1216 },
      { "upTo": null, "rate": 0.1316 }
    ],
    "basicPersonalAmount": 12989
  },
  "donationCredit": {
    "lowRate": 0.0505,
    "highRate": 0.1116,
    "lowRateThreshold": 200
  },
  "surtax": {
    "thresholds": [
      { "over": 5818, "rate": 0.20 },
      { "over": 7446, "rate": 0.36 }
    ]
  }
}
```

| Field | Required | Description |
|---|---|---|
| `jurisdiction` | Yes | Province code (e.g., `"ON"`, `"AB"`) |
| `name` | Yes | Display name (e.g., `"Ontario"`) |
| `year` | Yes | Tax year |
| `incomeTax.brackets` | Yes | Same format as federal brackets |
| `incomeTax.basicPersonalAmount` | Yes | BPA as a flat number (provinces don't have phaseout) |
| `donationCredit.lowRate` | Yes | Provincial credit rate on first $200 |
| `donationCredit.highRate` | Yes | Provincial credit rate on amounts over $200 |
| `donationCredit.lowRateThreshold` | Yes | Same $200 threshold |
| `surtax` | No | Only Ontario has a surtax. Contains `thresholds` array with `over` (provincial tax amount) and `rate` (additional tax rate). |

**Note**: The federal BPA uses a phaseout object (reduces for high earners). Provincial BPAs are flat numbers — no phaseout.

## How to update for a new tax year

1. **Create the year folder**:
   ```bash
   mkdir -p config/tax-data/<year>/provinces
   ```

2. **Copy previous year's files**:
   ```bash
   cp config/tax-data/2026/federal.json config/tax-data/<year>/federal.json
   cp config/tax-data/2026/provinces/*.json config/tax-data/<year>/provinces/
   ```

3. **Update values from official sources**:
   - **Federal**: [CRA income tax rates](https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html)
   - **Provincial**: Each province's revenue agency or [TaxTips.ca](https://www.taxtips.ca/taxrates.htm) as a cross-reference
   - **BPA**: CRA publishes the federal BPA annually; check provincial BPA from provincial sources
   - **Ontario surtax**: Ontario Ministry of Finance

4. **Update the year in each JSON file** (`"year": <year>`)

5. **Update the default year in `js/load-config.js`**:
   ```js
   export function loadFederalConfig(year = <year>) {
   ```
   (Same for `loadProvinceConfig`)

6. **Run tests**: `npm test`
   - Update spot-check values in `tax-data-validation.spec.js` for the new year's rates
   - Logic tests use fixture config (`config/tax-data/test/`) and don't need changes
   - Smoke tests (`smoke-current-year.spec.js`) use range-based assertions and rarely need changes
   - E2E tests are behavior-based and rarely need changes

7. **Cross-validate**: Compare results against [TaxTips.ca](https://www.taxtips.ca/calculators.htm) or another trusted calculator for several income/donation combinations

## How to add a new province

1. **Create the config file**: `config/tax-data/{year}/provinces/{CODE}.json`
   - Use an existing province file as a template
   - Look up the province's income tax brackets, BPA, and donation credit rates

2. **Add to the province dropdown**: In `views/calculator/template.html`, add an `<option>` to the province `<select>`

3. **Handle province-specific rules**: If the province has a surtax or other special rules:
   - Add the data to the config file (like Ontario's `surtax` field)
   - Update `calculate-total-tax.js` to handle it (currently only checks `provinceConfig.surtax`)

4. **Add unit tests**: Create test cases in the relevant spec files (at minimum, `calculate-provincial-tax.spec.js` and `calculate-total-tax.spec.js`)

5. **Verify**: Run `npm test` and spot-check results against an external calculator

**Note**: Quebec is not supported because it has a separate tax system administered by Revenu Quebec with fundamentally different rules.
