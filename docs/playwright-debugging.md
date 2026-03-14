# Debugging Playwright Tests

Quick-reference for debugging the unit and e2e tests in this project.

## PWDEBUG=1 (recommended dev workflow)

The best way to debug a failing test or develop a new one:

```bash
PWDEBUG=1 npx playwright test tests/e2e/ --project=e2e-chromium --grep "Full benefit"
```

This automatically:
- Opens the browser (headed)
- Opens Playwright Inspector
- Disables timeouts
- Highlights locators as they're evaluated

You don't need `--headed` or `--debug` — `PWDEBUG=1` enables both.

## Headed + debug mode

If you want Inspector without the other PWDEBUG behaviors:

```bash
npx playwright test tests/e2e/ --project=e2e-chromium --grep "Full benefit" --headed --debug
```

The Inspector lets you step through each action, inspect locators, and see the browser state at each step.

## Slow motion

Watch actions play out in real time without the Inspector:

```bash
npx playwright test tests/e2e/ --project=e2e-chromium --headed --workers=1 --timeout=0 --slow-mo=500
```

Adjust the speed: `--slow-mo=250` (fast), `--slow-mo=500` (normal), `--slow-mo=1000` (slow).

## UI mode

Visual test runner with built-in trace viewer:

```bash
npx playwright test --ui
```

You can click tests to run them, view traces, watch browser actions, filter scenarios, and re-run failures. Works well with BDD tests.

## Trace viewer

Record every DOM snapshot, network request, and console log for time-travel debugging:

```bash
npx playwright test --project=e2e-chromium --grep "Full benefit" --trace on
```

Then view the trace:

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

The trace viewer lets you replay the test, inspect DOM snapshots at each step, and view network/console activity.

**Note**: The project is already configured with `trace: "retain-on-failure"` for e2e tests, so traces are automatically saved when tests fail. Check `test-results/` after a failure.

## page.pause()

Insert a breakpoint directly in test code:

```js
await page.goto("/");
await page.pause();  // Inspector opens here
```

Run the test normally — the Inspector opens at the pause point. Remove the `page.pause()` before committing.

## Verbose API logs

See every Playwright API call:

```bash
DEBUG=pw:api npx playwright test tests/e2e/ --project=e2e-chromium --grep "Full benefit"
```

Output looks like:

```
pw:api => page.goto("/")
pw:api <= page.goto succeeded
```

Useful for diagnosing timeout or waiting issues.

## Console log forwarding

Forward browser console output to your terminal by adding this in a test:

```js
page.on("console", msg => console.log(msg.text()));
```

Helpful when debugging frontend JavaScript issues from the test runner.

## Screenshot and video

Capture visual evidence of failures:

```bash
npx playwright test --screenshot=only-on-failure --video=retain-on-failure
```

Screenshots and videos are saved to `test-results/`.

## Single worker

Prevent parallel test interference during debugging:

```bash
npx playwright test --workers=1
```

Always use this when debugging — parallel workers can make output confusing and cause timing-dependent behavior.

## SPA-specific tips

### Waiting for navigation

This app uses a `data-view` attribute on `#content` to signal when a route change is complete. In step definitions, wait for it:

```js
await expect(page.locator('#content[data-view="about"]')).toBeVisible();
```

### Back button testing

For `history.back()` in tests, the popstate event is async. Wait for the view to change:

```js
await page.goBack();
await expect(page.locator('#content[data-view="calculator"]')).toBeVisible();
```

### Running a single feature scenario

By scenario name:

```bash
npx playwright-bdd && npx playwright test tests/e2e/ --project=e2e-chromium -g "Full benefit — donation above"
```

All e2e tests (with BDD compilation):

```bash
npm run test:e2e
```

### Running a single unit test file

```bash
npx playwright test tests/unit/calculate-federal-tax.spec.js
```

## Recommended workflows

| Situation | Command |
|---|---|
| Developing a new test | `PWDEBUG=1 npx playwright test tests/e2e/ --project=e2e-chromium --grep "scenario name"` |
| Diagnosing a flaky test | `npx playwright test --trace on --video retain-on-failure --workers=1` |
| Exploring all tests visually | `npx playwright test --ui` |
| Quick check that everything passes | `npm test` |
| Running just unit tests | `npm run test:unit` |
| Checking coverage | `npm run test:coverage` then `open coverage/coverage/index.html` |
