# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Canadian charitable donation tax credit calculator — a client-side-only SPA built with vanilla HTML/CSS/JS (ES modules, no build step). Deployed to GitHub Pages.

## Commands

```bash
npm run dev              # Local dev server on port 3000
npm run test:unit        # Unit tests only (Playwright)
npm run test:e2e         # Compile BDD features + run E2E tests
npm run test:e2e:headed  # E2E with browser visible
npm run test             # All tests (unit + e2e)
npm run test:coverage    # All tests (Chromium) + V8 coverage report
npm run deploy           # Deploy to GitHub Pages via gh-pages
LABEL=foo npm run screenshots  # Full-page screenshots of every app state → screenshots/foo/
```

Run a single unit test file:
```bash
npx playwright test tests/unit/calculate-federal-tax.spec.js
```

Run a single E2E feature:
```bash
npx playwright-bdd && npx playwright test tests/e2e/ -g "feature name"
```

## Architecture

**No build step** — files are served directly. ES module imports in the browser.

**SPA Router** (`js/router.js`): Custom pushState router with three routes (`/` calculator, `/learn`, `/about`). Views live in `views/<name>/` with `template.html` + `script.js` (init/destroy lifecycle). Templates are lazy-loaded and cached by `js/ui/template-loader.js`. Base path auto-detected for GitHub Pages in `js/base-path.js`.

**Calculation Pipeline** (`js/calculator.js`): Orchestrates the full computation — loads configs, calculates total tax (brackets + Ontario surtax), donation credit (tiered rates), credit usability (non-refundable credit limitations), minimum income needed, and nudge hints. Returns a single result object consumed by the UI.

**Tax Data** (`config/tax-data/2026/`): Federal and provincial rates/brackets in JSON. Rates are never hardcoded in JS — always loaded from config. `config/app-settings.json` holds narrative thresholds and nudge percentages.

**UI Layer** (`js/ui/`): Form handling, results rendering, narrative builder, and URL state sync (query params for shareable links).

## Key Conventions

- Tax rates and thresholds must come from `config/` JSON files, never hardcoded
- Never call donations "tax deductible" — it's a non-refundable credit, not a deduction
- The `scratch/` directory is gitignored — never commit files from it
- CSS uses `@layer` cascade with design tokens in `css/global.css`
- 2-space indentation (see `.editorconfig`)
- Internal links must be real `<a href="..." data-route="...">` — never `data-route` alone. The router intercepts clicks via `preventDefault()`, but `href` ensures right-click/new tab, status bar preview, and accessibility all work.

## Testing

Unit tests use **three layers** designed to be stable across tax year changes:

- **Logic tests** (6 files like `calculate-federal-tax.spec.js`): Load fixture configs from `config/tax-data/test/` with round-number rates. Use exact assertions. Never need updating when real rates change.
- **Config validation** (`tax-data-validation.spec.js`): Validates real config structure and spot-checks specific rates. This is the only unit test file that needs updating for a new tax year.
- **Smoke tests** (`smoke-current-year.spec.js`): Runs full pipeline against real config with range-based assertions. Catches integration issues without being fragile.

E2E tests (`tests/e2e/`): Gherkin `.feature` files in `tests/e2e/features/` with step definitions in `tests/e2e/steps/`. Uses `playwright-bdd` to compile features before running. The `npx playwright-bdd` step must run before E2E tests execute. Behavior-based — stable across year changes.

Playwright config auto-starts a local server on port 3000 for E2E tests (or if local server already running, re-uses that).

**Known flaky tests**: Some E2E scenarios involving the browser Back button fail intermittently. This is a known issue to be addressed in the future. If a Back button test fails and it's clearly unrelated to your current work, move on — don't loop trying to fix it.

**Coverage**: `npm run test:coverage` runs all tests in Chromium and collects V8 coverage from E2E tests via `monocart-reporter`. Uses a separate config (`playwright.coverage.config.js`) and a coverage fixture (`tests/e2e/coverage-fixture.js`) that auto-starts/stops `page.coverage` per test. View reports:
```bash
open coverage/coverage/index.html                  # Coverage report only
npx monocart show-report coverage/report.html      # Full test + coverage report
```
