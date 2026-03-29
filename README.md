# Canadian Charitable Donation Tax Credit Calculator

A free, open-source tool that honestly tells Canadians what they get back from charitable donations — including the truth about the non-refundable credit limitation that many other calculators ignore.

**[Try it live](https://danielabar.github.io/charitable-tax-credit-calculator-canada/)**

## Features

**Tax calculation**
- Federal + Ontario income tax with progressive brackets
- Ontario surtax
- Federal basic personal amount (BPA) with phaseout for high earners

**Donation credit**
- Tiered federal + provincial donation credit rates (first $200 / over $200)
- 33% top-bracket federal credit rate for high-income donors

**Reverse calculator mode**
- "How much should I donate to get $Y back?" — interactive slider to explore refund targets
- Shows the donation needed, with a breakdown of low-rate vs high-rate portions
- Warns when income is too low to use the full credit (partial or entirely wasted)

**Honesty about limitations**
- Shows when the non-refundable credit exceeds your tax payable (partially or fully wasted)
- Calculates the minimum income needed to use the full credit
- Suggests carry-forward and spouse options when the credit can't be fully used

**Educational content**
- Learn page showing how the same donation produces different results for different taxpayer types
- Reverse lookup cards showing how much to donate for specific refund amounts

**Plain-language results**
- Narrative explanations in real dollar amounts
- Visual cost-vs-credit breakdown
- Nudge hint when donating near the $200 threshold

**Privacy and sharing**
- All calculations happen client-side — no data leaves the browser
- Shareable URLs encode inputs so results can be linked
- Anonymous usage analytics via [GoatCounter](https://www.goatcounter.com/) — no cookies, no personal data

**Configurable**
- All tax rates, brackets, and thresholds loaded from JSON config files — no hardcoded values

## Current scope

- **Province**: Ontario (12 other provinces/territories have config files but are not yet validated)
- **Filing status**: Single filer
- **Tax year**: 2026
- **Credits modeled**: Basic personal amount only (no CPP/EI, employment amount, age amount, etc.)

## Tech stack

Vanilla HTML, CSS (with `@layer` cascade), and JavaScript (ES modules). No build step — files are served directly. Playwright for testing (unit tests + BDD/Gherkin e2e tests). Deployed to GitHub Pages.

## Getting started

```bash
npm install
npx playwright install
npm run dev              # Local server on port 3000
npm test                 # All tests (unit + e2e)
```

## Documentation

- [Architecture](docs/architecture.md) — how the app works, project structure, how to add features
- [Configuration](docs/configuration.md) — config file format, how to update tax data, how to add a province
- [Analytics](docs/analytics.md) — GoatCounter setup, what gets tracked, how to switch providers
- [Playwright debugging](docs/playwright-debugging.md) — how to debug e2e tests

## License

MIT
