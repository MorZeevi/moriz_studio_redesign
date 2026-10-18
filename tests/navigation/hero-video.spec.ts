import { expect, type Page, test } from "@playwright/test";

const target = "[data-hero-video-target]";
const end = "[data-hero-video-end]";

async function logoVideoGap(page: Page) {
  return page.evaluate(() => {
    const video = document.querySelector("[data-hero-video-target]");
    const logos = document.querySelector("[data-logo-carousel]");
    if (!video || !logos) throw new Error("Missing video or logo strip");
    return (
      logos.getBoundingClientRect().top - video.getBoundingClientRect().bottom
    );
  });
}

async function expectLogosBelowVideo(page: Page) {
  await expect(page.locator("[data-logo-carousel]")).toHaveCount(1);
  await expect.poll(() => logoVideoGap(page)).toBeGreaterThanOrEqual(-1);
}

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
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
  { width: 2048, height: 1152 },
]) {
  test(`video grows to the end slot on scroll at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize(viewport);
    await page.goto("/he");
    await expect(page.locator(".pixel-reveal")).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    const start = await page.locator(target).boundingBox();
    if (!start) throw new Error("Missing video");
    const logos = page.locator(".hero > [data-logo-carousel]");
    await expect(logos).toHaveCount(1);
    const initialLogos = await logos.boundingBox();
    if (!initialLogos) throw new Error("Missing logos");
    expect(initialLogos.y + initialLogos.height).toBeLessThanOrEqual(
      viewport.height + 1,
    );
    await page.screenshot({
      path: `test-results/hero-video/initial-${viewport.width}.png`,
    });
    for (const progress of [0, 0.25, 0.5, 0.75, 1, 1.25, 0.75, 0.25, 0]) {
      await scrollToProgress(page, progress);
      await page.waitForTimeout(400);
      await expectLogosBelowVideo(page);
    }
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
    // Position and width can reach the slot on different scrubbed frames.
    await expect
      .poll(async () => (await page.locator(target).boundingBox())?.y)
      .toBeCloseTo(slot.y, 0);
    await expectLogosBelowVideo(page);
    expect(await logoVideoGap(page)).toBeCloseTo(64, 0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
    await logos.scrollIntoViewIfNeeded();
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
    await expectLogosBelowVideo(page);
    await expect
      .poll(async () =>
        Math.abs(((await logos.boundingBox())?.y ?? 0) - initialLogos.y),
      )
      .toBeLessThanOrEqual(1);
  });
}

test("logos stay below the video after resizing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/he");
  await expect(page.locator(".pixel-reveal")).toHaveCount(0);
  await scrollToProgress(page, 0.75);
  for (const width of [1024, 2048, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(500);
    await expectLogosBelowVideo(page);
    if (width >= 1024) {
      await scrollToEndSlot(page);
      const slot = await page.locator(end).boundingBox();
      if (!slot) throw new Error("Missing end slot");
      await expect
        .poll(async () => (await page.locator(target).boundingBox())?.width)
        .toBeCloseTo(slot.width, 0);
      await expectLogosBelowVideo(page);
    }
  }
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 700 },
]) {
  test(`mobile video waits for a tap at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const videoRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/videos/hero-showreel.mp4"))
        videoRequests.push(request.url());
    });
    await page.goto("/he");
    const video = page.locator("[data-hero-video] video");
    await expect(video).not.toHaveAttribute("src");
    expect(videoRequests).toHaveLength(0);
    await expect(page.locator(".hero-video-stage")).toBeHidden();
    await expectLogosBelowVideo(page);
    await expect(page.locator(".hero-projects-link")).toBeHidden();
    const cue = page.locator(".hero-scroll-cue");
    await expect(cue).toBeVisible();
    await expect(cue).toHaveAttribute("href", "#advantages");
    const cueBox = await cue.boundingBox();
    const videoBox = await page.locator(target).boundingBox();
    if (!cueBox || !videoBox) throw new Error("Missing mobile hero geometry");
    expect(cueBox.y).toBeGreaterThanOrEqual(videoBox.y + videoBox.height);
    await page.locator("#hero").screenshot({
      path: `test-results/hero-video/mobile-${viewport.width}.png`,
    });
    await page.getByRole("button", { name: "הפעלת הסרטון" }).click();
    await expect(video).toHaveAttribute("src", "/videos/hero-showreel.mp4");
    await expect.poll(() => videoRequests.length).toBeGreaterThan(0);
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
      .toBe(false);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
  });
}

test("reduced motion keeps the video still and unscaled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const video = page.locator("[data-hero-video] video");
  await expect(
    page.getByRole("button", { name: "הפעלת הסרטון" }),
  ).toBeVisible();
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
  await expectLogosBelowVideo(page);
  expect(await logoVideoGap(page)).toBeLessThanOrEqual(64);
});

test("logos follow the static video without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  try {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/he");
      await expect(page.locator(".hero-video-stage")).toBeHidden();
      await expectLogosBelowVideo(page);
      if (width >= 1024)
        expect(await logoVideoGap(page)).toBeLessThanOrEqual(64);
      else await expect(page.locator(".hero-scroll-cue")).toBeVisible();
    }
  } finally {
    await context.close();
  }
});
