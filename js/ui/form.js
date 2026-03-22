/**
 * Form handling module — reads, validates, and parses calculator inputs.
 * Called by views/calculator/script.js.
 */

/**
 * Parse a currency string to a number.
 * Strips $, commas, and whitespace.
 * Returns NaN for empty or invalid input.
 */
export function parseCurrency(value) {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (cleaned === "") return NaN;
  return Number(cleaned);
}

/**
 * Show an inline validation error on a form group.
 */
function showError(field, message) {
  const group = field.closest(".form-group");
  clearError(field);
  group.classList.add("has-error");
  const el = document.createElement("div");
  el.className = "validation-error";
  el.setAttribute("role", "alert");
  el.textContent = message;
  group.appendChild(el);
}

/**
 * Clear the validation error on a form group.
 */
function clearError(field) {
  const group = field.closest(".form-group");
  group.classList.remove("has-error");
  const existing = group.querySelector(".validation-error");
  if (existing) existing.remove();
}

/**
 * Clear all validation errors in the form.
 */
export function clearAllErrors(form) {
  for (const el of form.querySelectorAll(".validation-error")) {
    el.remove();
  }
  for (const el of form.querySelectorAll(".has-error")) {
    el.classList.remove("has-error");
  }
}

/**
 * Validate and read form values.
 * Returns { valid, data } where data is { province, income, donation }.
 */
function validate(form) {
  const province = form.querySelector("#province");
  const income = form.querySelector("#income");
  const donation = form.querySelector("#donation");

  clearAllErrors(form);
  let valid = true;

  if (!province.value) {
    showError(province, "Please select a province or territory.");
    valid = false;
  }

  const incomeVal = parseCurrency(income.value);
  if (isNaN(incomeVal) || incomeVal < 0) {
    showError(income, "Please enter a valid income amount.");
    valid = false;
  }

  const donationVal = parseCurrency(donation.value);
  if (isNaN(donationVal) || donationVal <= 0) {
    showError(donation, "Please enter a valid donation amount.");
    valid = false;
  }

  return {
    valid,
    data: valid
      ? { province: province.value, income: incomeVal, donation: donationVal }
      : null,
  };
}

/**
 * Set up form handling.
 * @param {HTMLFormElement} form
 * @param {function} onSubmit — called with { province, income, donation } on valid submit
 */
export function setupForm(form, onSubmit) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { valid, data } = validate(form);
    if (valid) {
      onSubmit(data);
    }
  });

  // Clear error on a field when user interacts with it
  for (const field of form.querySelectorAll("select, input")) {
    field.addEventListener("input", () => clearError(field));
    field.addEventListener("change", () => clearError(field));
  }
}
