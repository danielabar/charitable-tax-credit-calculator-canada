/**
 * Analytics — thin wrapper around GoatCounter.
 *
 * Only file that references window.goatcounter. If we ever switch
 * providers, only this file changes. Call sites use trackPageView()
 * and trackPageViewDebounced() without knowing the underlying provider.
 *
 * GoatCounter is loaded conditionally in index.html (production only).
 * When it's not loaded, window.goatcounter.count doesn't exist and
 * the optional chaining here makes every call a silent no-op.
 */

let debounceTimer = null;

/**
 * Track a page view immediately.
 * @param {string} path — clean path, e.g. '/learn' or '/?province=ON&income=60000'
 */
export function trackPageView(path) {
  window.goatcounter?.count?.({ path });
}

/**
 * Track a page view after the user stops interacting for `ms` milliseconds.
 * Repeated calls reset the timer — only the last one fires.
 * @param {string} path
 * @param {number} [ms=2000]
 */
export function trackPageViewDebounced(path, ms = 2000) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => trackPageView(path), ms);
}

/**
 * Cancel any pending debounced tracking. Call from view destroy().
 */
export function cancelPendingTracking() {
  clearTimeout(debounceTimer);
}
