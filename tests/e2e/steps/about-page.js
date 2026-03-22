import { expect, Given, When, Then } from "./fixtures.js";

Then("I should see the credits section", async ({ page }) => {
  const heading = page.locator(".about-page h2", { hasText: "Credits" });
  await expect(heading).toBeVisible();
  const intro = page.locator(".credits-intro");
  await expect(intro).toBeVisible();
});

Then("I should see {int} team member cards", async ({ page }, count) => {
  const cards = page.locator(".credit-card");
  await expect(cards).toHaveCount(count);
});

Then(
  "each card should have a photo, name, role, and bio",
  async ({ page }) => {
    const cards = page.locator(".credit-card");
    for (const card of await cards.all()) {
      await expect(card.locator(".credit-photo img")).toBeVisible();
      await expect(card.locator(".credit-name a")).toBeVisible();
      await expect(card.locator(".credit-role")).toBeVisible();
      await expect(card.locator(".credit-bio")).toBeVisible();
    }
  }
);

Then(
  "the {string} card should link to {string}",
  async ({ page }, name, urlFragment) => {
    const card = page.locator(".credit-card", { hasText: name });
    const nameLink = card.locator(".credit-name a");
    await expect(nameLink).toHaveAttribute("href", new RegExp(urlFragment));
    const photoLink = card.locator("a.credit-photo");
    await expect(photoLink).toHaveAttribute("href", new RegExp(urlFragment));
  }
);
