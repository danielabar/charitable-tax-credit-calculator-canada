# Analytics

Privacy-friendly usage analytics via [GoatCounter](https://www.goatcounter.com/) — no cookies, no personal data, no consent banner needed.

**Dashboard:** https://charitable-tax-credit-calculator-canada.goatcounter.com/

## How it works

### Production only

The GoatCounter script is loaded conditionally in `index.html` — it only runs on `danielabar.github.io`. On localhost, Netlify PR previews, and test runs, the script never loads and all tracking calls are silent no-ops.

### Analytics module (`js/analytics.js`)

All GoatCounter interaction is centralized in a single module. No other file references `window.goatcounter` directly. This keeps analytics as a cross-cutting concern, separate from business logic.

The module exports three functions:

| Function | Purpose |
|----------|---------|
| `trackPageView(path)` | Track a page view immediately |
| `trackPageViewDebounced(path, ms)` | Track after user stops interacting (default 2s) |
| `cancelPendingTracking()` | Cancel pending debounced tracking (call from view `destroy()`) |

### What gets tracked

**Route navigation** — tracked in `js/router.js` via `trackPageView()`. Fires on every route change (initial load, link clicks, back/forward). Sends clean paths without the GitHub Pages base path prefix:

```
/            → calculator page
/learn       → learn page
/about       → about page
```

**Forward calculations** — tracked in `views/calculator/script.js` via `trackPageView()`. Fires when the user clicks Calculate or follows the surtax forward-link. Sends the path with query params:

```
/?province=ON&income=60000&donation=500
```

**Reverse calculations** — tracked via `trackPageViewDebounced()`. The slider fires continuously during drag, so tracking is debounced — only fires once the user stops interacting for 2 seconds:

```
/?mode=reverse&province=ON&income=60000&refund=200
```

### What is NOT tracked

- Mode switches without a calculation (clicking the toggle)
- "Start Over" button clicks
- URL hydration from deep links (the router already tracked the initial page view)
- Browser back/forward to previously visited states
- Optimistic reverse mode (province selected but no income entered)

## Switching providers

If GoatCounter is ever replaced, only two files need to change:

1. `index.html` — swap the script tag
2. `js/analytics.js` — update the three functions to call the new provider's API

No changes needed in the router or any view code.
