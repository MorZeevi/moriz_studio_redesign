import { expect, test } from "@playwright/test";

for (const width of [393, 1440]) {
  test(`first content is uncovered on fresh and returning visits at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/he", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".pixel-reveal")).toHaveCount(0);
    await expect(page.locator("#hero-heading")).toBeVisible();
    await page.reload();
    await expect(page.locator(".pixel-reveal")).toHaveCount(0);
    await expect(page.locator(".hero-actions a").first()).toBeVisible();
  });
}
