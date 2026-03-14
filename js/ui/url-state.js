/**
 * URL state management — sync calculator inputs to/from query params
 * so results are shareable via URL.
 */

/**
 * Update the URL with calculator inputs (without page reload).
 */
export function pushStateToUrl(province, income, donation) {
  const params = new URLSearchParams({ province, income, donation });
  history.pushState(null, "", `?${params}`);
}

/**
 * Read calculator inputs from the current URL.
 * @returns {object|null} { province, income, donation } or null if params missing/invalid
 */
export function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const province = params.get("province");
  const income = params.get("income");
  const donation = params.get("donation");

  if (!province || !income || !donation) return null;

  const incomeNum = Number(income);
  const donationNum = Number(donation);
  if (isNaN(incomeNum) || isNaN(donationNum) || incomeNum < 0 || donationNum <= 0) {
    return null;
  }

  return { province, income: incomeNum, donation: donationNum };
}

/**
 * Remove all query params from the URL (without page reload).
 */
export function clearUrl() {
  history.pushState(null, "", window.location.pathname);
}
