# Architecture

How the app works — project structure, views, components, calculation pipeline, testing, and CSS.

## Project structure

The project follows this top-level layout:

- `index.html` — app shell (nav, footer, empty `<main>`)
- `js/` — calculation modules (pure functions) and `ui/` subdir (form, results, narrative, template-loader, URL state)
- `views/` — one directory per page (`calculator/`, `learn/`, `about/`), each with `template.html` + `script.js`
- `templates/` — reusable HTML sub-templates for results rendering
- `config/` — JSON configs: `app-settings.json`, `learn.json`, `tax-data/{year}/` (federal + provinces), `tax-data/test/` (fixtures)
- `css/` — layered CSS files (see "CSS architecture" below)
- `tests/` — `unit/` (pure calculation logic) and `e2e/` (Gherkin features + step definitions)

## How views work

A **view** is a page in the SPA. Each view lives in `views/<name>/` and has two files:

| File | Purpose |
|---|---|
| `template.html` | The HTML content for the page |
| `script.js` | A JS module with `init()` and `destroy()` lifecycle functions |

### Routing

The router (`js/router.js`) maps URL paths to view directories:

```js
const routes = {
  "/": "calculator",
  "/learn": "learn",
  "/about": "about",
};
```

When the user navigates:

1. The router calls `destroy()` on the current view (if any)
2. Clears `<main id="content">`
3. Fetches the new view's `template.html` (cached after first load)
4. Dynamically imports the view's `script.js` and calls `init(contentEl, html)`
5. The view inserts its content into the DOM (immediately for static views, after async data loading for dynamic views like `/learn`)
6. Sets `data-view` attribute on `#content` (used by e2e tests to detect navigation)

The view controls when its content enters the DOM. This prevents flash of placeholder text — views that need async data (like `/learn` which loads tax configs) can fill `{{placeholder}}` templates before insertion.

Navigation is triggered by clicking any element with a `data-route` attribute (e.g., `<a data-route="/about">`). The router intercepts clicks and uses `pushState` instead of full page loads.

### Base path

`js/base-path.js` auto-detects whether the app is served from the root (`/`) or a subdirectory (`/repo-name/`). This makes the same code work on localhost, GitHub Pages, and custom domains without configuration.

### How to add a new view

1. Create `views/<name>/template.html` with the page HTML
2. Create `views/<name>/script.js` exporting `init(contentEl, html)` and `destroy()`
   - `init()` receives the content element and raw template HTML — it must insert the HTML into `contentEl` itself
   - For static views: `contentEl.innerHTML = html` at the top
   - For views with async data: load data, fill the template with `fillTemplate(html, data)`, then set `contentEl.innerHTML`
3. Add the route to the `routes` object in `js/router.js`
4. Add a nav link with `data-route="/<name>"` in `index.html`

## How UI components work

The app uses a **sub-template pattern** instead of a component framework. HTML templates in `templates/` are fetched, cached, and filled with data at render time.

### Template loading

`js/ui/template-loader.js` provides two functions:

- **`loadTemplate(path)`** — fetches an HTML file and caches it in a `Map` for subsequent calls
- **`fillTemplate(html, data)`** — replaces `{{key}}` placeholders with values from a data object

### How results rendering works

`js/ui/results.js` composes the results page from multiple sub-templates:

1. `buildHeadline()` — selects headline text based on usability state
2. `buildSummaryGrid()` — builds the credit summary stats grid
3. `buildBarChart()` — builds the visual cost-vs-credit breakdown
4. `buildNarrative()` (in `narrative.js`) — builds conditional narrative sections

Each function loads its templates via `loadTemplate()`, fills them with `fillTemplate()`, and returns an HTML string. The `renderResults()` function assembles them all into the `#results-container`.

### Conditional sections

The narrative (`js/ui/narrative.js`) conditionally includes sections based on the `UsabilityState`:

| Section | `fully-usable` | `partly-wasted` | `entirely-wasted` |
|---|---|---|---|
| Basic math (credit breakdown) | Yes | Yes | Yes |
| Threshold nudge ($200) | If near threshold | No | No |
| Tax situation | Yes | Yes | Yes |
| Non-refundable explanation | No | Yes | Yes |
| Carry-forward / spouse options | No | Yes | Yes |
| Minimum income needed | No | Yes | Yes |
| Closing encouragement | No | No | Yes |
| Learn link (non-refundable) | No | Yes | Yes |
| Learn link (closing) | No | No | Yes |

### How to add a new component (template + rendering)

1. Create `templates/<name>.html` with `{{placeholder}}` markers
2. In the rendering module (e.g., `results.js` or `narrative.js`):
   - `loadTemplate("templates/<name>.html")`
   - `fillTemplate(html, { key: value })`
3. Insert the resulting HTML string into the page

## How the calculation pipeline works

Data flows through the app in a clear pipeline:

```
User input (province, income, donation)
    ↓
calculator.js (orchestrator)
    ├── loadConfig() → federal.json, province.json, app-settings.json
    ├── calculateTotalTax(income, federal, province)
    │     ├── calculateFederalTax() → federal tax (brackets - BPA credit)
    │     ├── calculateProvincialTax() → provincial tax (brackets - BPA credit)
    │     └── calculateOntarioSurtax() → surtax (ON only)
    ├── calculateDonationCredit(donation, income, federal, province)
    │     └── tiered federal (14%/29%/33%) + provincial credit
    ├── checkCreditUsability(credit, tax, donation)
    │     └── determines fully-usable / partly-wasted / entirely-wasted
    ├── calculateMinimumIncome() (if credit partly/entirely wasted)
    └── nudge calculation (if near $200 threshold)

calculateDonationForRefund(refund, federal, province)
    └── inverse of donation credit — donation needed for target refund
        (used by Learn page reverse lookup cards, not by the main calculator)
    ↓
CalculationResults object
    ↓
UI rendering (results.js + narrative.js)
    ↓
DOM
```

### The results object

`calculator.js` returns a single `CalculationResults` object — the central contract between calculation and display. It contains:

- `input` — province, income, donation (echo back)
- `tax` — federal, provincial, surtax, total
- `credit` — federal credit, provincial credit, total, topBracketPortion
- `usability` — credit calculated/usable/wasted, state, actual savings, out-of-pocket cost
- `minimumIncome` — income needed to use full credit (null if fully usable)
- `nudge` — hypothetical amount/credit for threshold hint (null if not applicable)
- `donationRates` — rate config used (for narrative text)
- `appSettings` — app-level settings

The full typedef is documented in `js/calculator.js`.

### Calculation modules are pure functions

Every module in `js/calculate-*.js` and `js/check-*.js` is a pure function:

- Takes numbers and config objects as input
- Returns numbers or plain objects
- No DOM access, no side effects, no async

This separation enables fast unit testing without a browser.

## How testing works

### Design philosophy

Calculation logic is strictly separated from DOM rendering. Calculation modules are pure functions tested in Node.js. DOM rendering is tested through full-browser e2e tests.

Unit tests are designed to be **stable across tax year changes**. Logic tests load fixture configs with round numbers (`config/tax-data/test/`), so they never break when real rates are updated. A separate validation layer and smoke tests cover the real config.

### Test layers

The unit tests are organized into three layers with different purposes:

| Layer | Config source | Assertion style | Changes when rates update? |
|---|---|---|---|
| **Logic tests** (6 files) | `config/tax-data/test/` (fixtures) | Exact values (`toBe`) | No |
| **Config validation** (`tax-data-validation.spec.js`) | `config/tax-data/2026/` (real) | Structure + spot-checks | Yes (spot-check values) |
| **Smoke tests** (`smoke-current-year.spec.js`) | `config/tax-data/2026/` (real) | Ranges (`toBeGreaterThan`) | Rarely |

**Logic tests** verify that calculation functions produce correct results given known inputs. The fixture configs use round numbers (10%, 20%, 30% brackets; BPA of 15000) so expected values are easy to hand-verify and never change.

**Config validation** verifies that real tax data files have the right structure, reasonable values, and match official published rates. This is the only layer that needs updating when a new tax year is added.

**Smoke tests** run the full pipeline against the real current-year config at a few representative incomes. They use range-based assertions (e.g., "credit is between 100 and 250") to catch integration issues without being fragile.

### Fixture configs

`config/tax-data/test/` contains simplified tax configs with intentionally round numbers:

- **Federal**: 3 brackets (10%/20%/30%), BPA 15000 with phaseout to 12000
- **ON**: 3 brackets (5%/10%/15%), BPA 10000, surtax at 5000/8000
- **AB**: 2 brackets (10%/15%), BPA 20000
- **SK**: 3 brackets (10%/12%/15%), BPA 18000
- **NL**: 5 brackets (8%/12%/15%/18%/20%), BPA 10000
- **BC**: 3 brackets (5%/8%/12%), BPA 12000

These are **not real tax rates** — they exist solely to make test math transparent. A test asserting `expect(federalTax).toBe(9500)` is verifiable by mental arithmetic: `50000*0.10 + 30000*0.20 - 15000*0.10 = 9500`.

### Unit tests

- Location: `tests/unit/`
- Runner: Playwright's test runner (`@playwright/test`) in Node.js mode
- Pattern: Each calculation module has its own spec file
- Config is loaded from JSON files directly (no browser, no fetch)

Example (using fixture config):

```js
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { calculateFederalTax } from "../../js/calculate-federal-tax.js";

const federalConfig = JSON.parse(
  readFileSync("config/tax-data/test/federal.json", "utf-8")
);

test("income at BPA returns 0", () => {
  expect(calculateFederalTax(15000, federalConfig)).toBe(0);
});
```

Run: `npm run test:unit` or `npx playwright test tests/unit/calculate-federal-tax.spec.js`

### E2E tests

- Location: `tests/e2e/`
- Framework: Playwright + playwright-bdd (Gherkin/Cucumber)
- Features: `tests/e2e/features/*.feature` (human-readable scenarios)
- Steps: `tests/e2e/steps/*.js` (step definitions)

The BDD layer compiles `.feature` files into Playwright tests via `npx playwright-bdd`. This must run before e2e tests execute. E2E tests are behavior-based (e.g., "the credit should be fully usable") and don't assert exact dollar amounts, so they're stable across year changes.

Run: `npm run test:e2e` (compiles features + runs tests)

### Coverage

`npm run test:coverage` runs all tests in Chromium and collects V8 coverage from e2e tests using `monocart-reporter`. Uses a separate config (`playwright.coverage.config.js`) and a coverage fixture (`tests/e2e/coverage-fixture.js`).

View reports:
```bash
open coverage/coverage/index.html                  # Coverage report
npx monocart show-report coverage/report.html      # Full test + coverage
```

### How to add a new unit test

1. Create `tests/unit/<module-name>.spec.js`
2. Import the module and **fixture** config files from `config/tax-data/test/`
3. Use `test()` and `expect()` from `@playwright/test`
4. Use exact assertions (`toBe`) — the round fixture numbers make this easy
5. Run: `npx playwright test tests/unit/<module-name>.spec.js`

### How to add a new e2e scenario

1. Add a `Scenario:` block to the appropriate `.feature` file in `tests/e2e/features/`
2. If the scenario uses new step phrasing, add step definitions in `tests/e2e/steps/`
3. Compile: `npx playwright-bdd`
4. Run: `npx playwright test tests/e2e/ -g "scenario name"`

## CSS architecture

The CSS is based on [csscaffold](https://github.com/robzolkos/csscaffold) and uses CSS `@layer` for specificity management.

### Layer order

Defined in `css/global.css`:

```css
@layer reset, base, components, utilities;
```

Layers are processed in order — later layers override earlier ones regardless of selector specificity. This means utility classes always win over component styles, and component styles always win over base styles.

### File organization

| File | Layer | Purpose |
|---|---|---|
| `global.css` | (unlayered) | Layer declaration, design tokens (spacing, font, radius) |
| `reset.css` | `reset` | Browser reset/normalize |
| `colors.css` | (unlayered) | Color system: LCH primitives + semantic color tokens |
| `base.css` | `base` | Default element styles (body, headings, links, lists) |
| `layout.css` | `components` | Page layout (max-width container, page spacing) |
| `buttons.css` | `components` | Button component styles |
| `inputs.css` | `components` | Form input and select styles |
| `nav.css` | `components` | Top navigation bar |
| `results.css` | `components` | Results section (summary grid, bar chart, big number) |
| `narrative.css` | `components` | Narrative sections and callout boxes |
| `learn.css` | `components` | Learn page (scenario cards, result flow, CTA) and narrative learn links |
| `utilities.css` | `utilities` | Utility/helper classes |
| `index.css` | — | Imports all CSS files in order |

### Design tokens

Colors use the OKLCH color space with LCH primitives mapped to semantic names:

- `--color-primary` / `--color-primary-dark` / `--color-primary-light` — teal (brand)
- `--color-accent` / `--color-accent-light` — amber (nudge/warm callouts)
- `--color-wasted` / `--color-wasted-bg` — red (warning/wasted credit)
- `--color-text` / `--color-text-secondary` — ink dark/medium
- `--color-bg` / `--color-bg-alt` / `--color-border` — surfaces

Spacing: `--space-xs` (4px) through `--space-2xl` (48px)

### Where to add new styles

- New component → create `css/<component>.css`, add to `@layer components`, import in `css/index.css`
- New utility class → add to `css/utilities.css`
- New color → add LCH primitive + semantic mapping in `css/colors.css`
- New design token → add to `:root` in `css/global.css`

## Common tasks quick reference

### "I want to add a new province"

1. Create `config/tax-data/2026/provinces/<CODE>.json` (copy an existing one as template)
2. Add the province to the `<select>` in `views/calculator/template.html`
3. If the province has a surtax (like Ontario), add handling in `calculate-total-tax.js`
4. Add unit tests in `tests/unit/`
5. See [docs/configuration.md](configuration.md) for the config file format

### "I want to add a new narrative section"

1. Write the section builder function in `js/ui/narrative.js` (following the existing pattern)
2. Add conditional logic in `buildAllSections()` to include it
3. If it needs a new template, create it in `templates/` and use `loadTemplate()`/`fillTemplate()`
4. Add e2e test steps to verify it appears/doesn't appear in the right scenarios

### "I want to update tax rates for next year"

1. Create `config/tax-data/<year>/` and copy the previous year's files
2. Update all values from official CRA and provincial sources
3. Update the default year parameter in `js/load-config.js`
4. Update spot-check values in `tax-data-validation.spec.js`
5. Run `npm test` — logic tests and smoke tests should pass without changes
6. See [docs/configuration.md](configuration.md) for detailed steps and source URLs

### "I want to add a new input field"

1. Add the HTML input to `views/calculator/template.html`
2. Add validation in `js/ui/form.js` (`validate()` function)
3. Pass the new value through `views/calculator/script.js` → `runCalculation()`
4. Update `calculator.js` to use it in the pipeline
5. Update `js/ui/url-state.js` if the value should be shareable via URL
6. Add e2e tests for validation and calculation with the new field
