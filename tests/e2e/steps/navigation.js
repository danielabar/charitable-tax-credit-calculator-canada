import { expect, Given, When, Then } from "./fixtures.js";

Given("I am on the About page", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-route="/about"]');
  await page.waitForSelector(".about-page");
});

When(
  "I click the {string} navigation link",
  async ({ page }, linkText) => {
    const prevView = await page.getAttribute("#content", "data-view");
    await page.click(`nav a:has-text("${linkText}")`);
    // Wait for the async SPA navigation to complete
    await page.waitForFunction(
      (prev) => {
        const el = document.getElementById("content");
        return el && el.getAttribute("data-view") !== prev && el.children.length > 0;
      },
      prevView,
      { timeout: 5000 },
    );
  },
);

When("I go back in the browser", async ({ page }) => {
  const prevView = await page.getAttribute("#content", "data-view");
  await page.evaluate(() => {
    return new Promise((resolve) => {
      window.addEventListener("popstate", () => resolve(), { once: true });
      history.back();
    });
  });
  await page.waitForFunction(
    (prev) => {
      const el = document.getElementById("content");
      return el && el.getAttribute("data-view") !== prev && el.children.length > 0;
    },
    prevView,
    { timeout: 5000 },
  );
});

When("I go forward in the browser", async ({ page }) => {
  const prevView = await page.getAttribute("#content", "data-view");
  await page.evaluate(() => {
    return new Promise((resolve) => {
      window.addEventListener("popstate", () => resolve(), { once: true });
      history.forward();
    });
  });
  await page.waitForFunction(
    (prev) => {
      const el = document.getElementById("content");
      return el && el.getAttribute("data-view") !== prev && el.children.length > 0;
    },
    prevView,
    { timeout: 5000 },
  );
});

When("I click the logo", async ({ page }) => {
  await page.click("a.logo");
  await page.waitForSelector("#calculator-form");
});

When("I visit {string} directly", async ({ page }, path) => {
  await page.goto(path);
  // Wait for the 404.html redirect to complete and the SPA to load
  await page.waitForFunction(() => !sessionStorage.getItem("redirect"), {
    timeout: 5000,
  });
});

Then("I should see the About page content", async ({ page }) => {
  const heading = page.locator(".about-page h1");
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText("About this calculator");
});

Then("I should see the calculator form", async ({ page }) => {
  await expect(page.locator("#calculator-form")).toBeVisible();
});

Then("I should see results", async ({ page }) => {
  await expect(page.locator(".results-section")).toBeVisible();
});

Then("I should not see results", async ({ page }) => {
  await expect(page.locator(".results-section")).toHaveCount(0);
});

Then("the URL should not contain {string}", async ({ page }, text) => {
  expect(page.url()).not.toContain(text);
});
