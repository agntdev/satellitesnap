import { test, expect } from "@playwright/test";

test.describe("satellitesnap", () => {
  test("loads the recon console", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /satellitesnap/i }),
    ).toBeVisible();
    await expect(page.getByRole("searchbox").or(page.getByRole("textbox"))).toBeVisible();
  });

  test("snaps imagery for coordinates and records history", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("textbox").fill("48.8584,2.2945");
    await page.getByRole("button", { name: /snap/i }).click();

    // The Leaflet map mounts...
    await expect(page.locator(".leaflet-container")).toBeVisible();
    // ...and the search shows up in the history sidebar.
    const history = page.getByRole("complementary", { name: /search history/i });
    await expect(history.getByText(/48\.85840/)).toBeVisible();
  });

  test("restores a shared permalink", async ({ page }) => {
    await page.goto("/?ll=51.5007,-0.1246&q=Big%20Ben");
    await expect(page.getByDisplayValue("Big Ben")).toBeVisible();
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("steps through the time-travel timeline", async ({ page }) => {
    await page.goto("/?ll=40.6892,-74.0445&q=Statue%20of%20Liberty");
    const slider = page.getByRole("slider", { name: /imagery release/i });
    await expect(slider).toBeVisible();
    await page.getByRole("button", { name: /older imagery/i }).click();
  });
});
