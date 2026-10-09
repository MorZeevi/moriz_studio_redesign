import { expect, type Page, test } from "@playwright/test";

const target = "[data-hero-video-target]";
const end = "[data-hero-video-end]";

async function scrollToEndSlot(page: Page) {
  await page.evaluate((selector) => {
    const slot = document.querySelector<HTMLElement>(selector);
    if (!slot) throw new Error("Missing end slot");
    const { top } = slot.getBoundingClientRect();
    scrollTo(0, scrollY + top + slot.offsetHeight / 2 - innerHeight / 2);
  }, end);
}

// Scroll position between the trigger start (the hero slot's top meeting the
// viewport bottom, clamped to 0) and the end slot's center at the viewport center.
async function scrollToProgress(page: Page, progress: number) {
  await page.evaluate(
    ({ end, progress }) => {
      const box = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        return element.getBoundingClientRect();
      };
      const slot = box("[data-hero-video]");
      const stage = box(end);
      const from = Math.max(0, scrollY + slot.top - innerHeight);
      const to = scrollY + stage.top + stage.height / 2 - innerHeight / 2;
      scrollTo(0, from + (to - from) * progress);
    },
    { end, progress },
  );
}

test("video plays after the homepage opening and can pause", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/he");
  await expect(page.locator(".pixel-reveal")).toHaveCount(0);
  const video = page.locator("[data-hero-video] video");
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(false);
  await page.getByRole("button", { name: "עצירת הסרטון" }).click();
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true);
  await page.getByRole("button", { name: "הפעלת הסרטון" }).click();
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(false);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`video grows to the end slot on scroll at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize(viewport);
    await page.goto("/he");
    await page.evaluate(() => document.fonts.ready);
    const start = await page.locator(target).boundingBox();
    if (!start) throw new Error("Missing video");
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await scrollToProgress(page, 0.5);
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `test-results/hero-video/mid-${colorScheme}-${viewport.width}.png`,
      });
    }
    await page.emulateMedia({ colorScheme: "light" });
    await scrollToEndSlot(page);
    const slot = await page.locator(end).boundingBox();
    if (!slot) throw new Error("Missing end slot");
    expect(slot.width).toBeGreaterThan(start.width);
    await expect
      .poll(async () => (await page.locator(target).boundingBox())?.width)
      .toBeCloseTo(slot.width, 0);
    const grown = await page.locator(target).boundingBox();
    expect(grown?.y).toBeCloseTo(slot.y, 0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
    await page.screenshot({
      path: `test-results/hero-video/grown-${viewport.width}.png`,
    });

    await page.evaluate(() => scrollTo(0, 0));
    // Within a pixel: Flip writes whole-pixel widths, the slot can be fractional.
    await expect
      .poll(async () =>
        Math.abs(
          ((await page.locator(target).boundingBox())?.width ?? 0) -
            start.width,
        ),
      )
      .toBeLessThanOrEqual(1);
  });
}

test("reduced motion keeps the video still and unscaled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const video = page.locator("[data-hero-video] video");
  await expect(page.getByRole("button", { name: "הפעלת הסרטון" })).toBeVisible();
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
  const start = await page.locator(target).boundingBox();
  await scrollToEndSlot(page);
  await page.waitForTimeout(500);
  const after = await page.locator(target).boundingBox();
  expect(after?.width).toBeCloseTo(start?.width ?? 0, 0);
  // No empty end slot is left behind when nothing grows into it.
  await expect(page.locator(".hero-video-stage")).toBeHidden();
});
