/**
 * URL state management — sync calculator inputs to/from query params
 * so results are shareable via URL.
 */

/**
 * Update the URL with calculator inputs (without page reload).
 * @param {string} province
 * @param {number} income
 * @param {number} amount - donation (forward) or refund (reverse)
 * @param {'forward'|'reverse'} [mode='forward']
 */
export function pushStateToUrl(province, income, amount, mode = 'forward') {
  const params = new URLSearchParams({ province, income });
  if (mode === 'reverse') {
    params.set('mode', 'reverse');
    params.set('refund', amount);
  } else {
    // Forward mode: no 'mode' param in URL — preserves existing URL format
    // for backward compatibility with shared links and bookmarks.
    params.set('donation', amount);
  }
  history.pushState(null, "", `?${params}`);
}

/**
 * Parse URL state from a query string. Pure function, testable without a browser.
 * @param {string} search - query string including leading "?"
 * @returns {object|null} Parsed state or null if params missing/invalid
 */
export function parseUrlState(search) {
  const params = new URLSearchParams(search);
  const province = params.get("province");
  const income = params.get("income");

  // Default to "forward" when mode param is absent — existing forward-mode URLs
  // (shared links, bookmarks) don't have a mode param and must keep working.
  const mode = params.get("mode") || "forward";

  if (!province || !income) return null;

  const incomeNum = Number(income);
  if (isNaN(incomeNum) || incomeNum < 0) return null;

  if (mode === "reverse") {
    const refund = params.get("refund");
    if (!refund) return null;
    const refundNum = Number(refund);
    if (isNaN(refundNum) || refundNum <= 0) return null;
    return { mode: "reverse", province, income: incomeNum, refund: refundNum };
  }

  // Forward mode (explicit "forward" or any unknown value — treat as forward)
  const donation = params.get("donation");
  if (!donation) return null;
  const donationNum = Number(donation);
  if (isNaN(donationNum) || donationNum <= 0) return null;
  return { mode: "forward", province, income: incomeNum, donation: donationNum };
}

/**
 * Read calculator inputs from the current URL.
 * @returns {object|null} Parsed state or null if params missing/invalid
 */
export function readStateFromUrl() {
  return parseUrlState(window.location.search);
}

/**
 * Push a mode-only URL with no calculator inputs.
 *
 * Used when the user switches to reverse mode via the segmented control
 * before filling in any form fields. Creates a history entry so the
 * browser Back button can undo the mode switch.
 *
 * Forward mode uses clearUrl() instead (a clean "/" is the app's default
 * state — no need for an explicit mode param).
 *
 * @param {'reverse'} mode
 */
export function pushModeToUrl(mode) {
  const params = new URLSearchParams({ mode });
  history.pushState(null, "", `?${params}`);
}

/**
 * Remove all query params from the URL (without page reload).
 */
export function clearUrl() {
  history.pushState(null, "", window.location.pathname);
}
