/**
 * Load and cache JSON config files.
 */

const cache = new Map();

/**
 * Fetch a JSON config file, caching for subsequent calls.
 * @param {string} path - Path to JSON file relative to site root
 * @returns {Promise<object>} Parsed JSON
 */
export async function loadConfig(path) {
  if (cache.has(path)) return cache.get(path);

  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load config: ${path}`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

/**
 * Load federal tax config for a given year.
 */
export function loadFederalConfig(year = 2026) {
  return loadConfig(`config/tax-data/${year}/federal.json`);
}

/**
 * Load provincial tax config for a given year and province code.
 */
export function loadProvinceConfig(provinceCode, year = 2026) {
  return loadConfig(`config/tax-data/${year}/provinces/${provinceCode}.json`);
}

/**
 * Load app-level settings (narrative thresholds, etc.).
 */
export function loadAppSettings() {
  return loadConfig("config/app-settings.json");
}
