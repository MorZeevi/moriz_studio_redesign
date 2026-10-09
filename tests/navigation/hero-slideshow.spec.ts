import { expect, test } from "@playwright/test";

test("autoplay starts after the homepage opening", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/he");
  await expect(page.locator(".pixel-reveal")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "עצירת מצגת העבודות" }),
  ).toBeVisible();
  await expect(page.locator("[data-hero-slideshow]")).not.toHaveAttribute(
    "data-slide",
    "1",
    { timeout: 6000 },
  );
});

test("nine loaded images rotate every two seconds, loop, and can pause", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const frame = page.locator("[data-hero-slideshow]");
  await expect(frame.locator("img")).toHaveCount(9);
  await expect
    .poll(() =>
      frame
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.clock.pauseAt(new Date());
  await page.clock.runFor(6000);
  await expect(frame).toHaveAttribute("data-slide", "1");
  await page.getByRole("button", { name: "הפעלת מצגת העבודות" }).click();
  const initial = await frame.boundingBox();
  await page.clock.runFor(1999);
  await expect(frame).toHaveAttribute("data-slide", "1");
  await page.clock.runFor(1);
  await expect(frame).toHaveAttribute("data-slide", "2");
  for (const slide of [3, 4, 5, 6, 7, 8, 9, 1]) {
    await page.clock.runFor(2000);
    await expect(frame).toHaveAttribute("data-slide", String(slide));
    expect(await frame.boundingBox()).toEqual(initial);
    await expect(frame.locator('[data-active="true"] img')).toBeVisible();
  }
  await page.getByRole("button", { name: "עצירת מצגת העבודות" }).click();
  await page.clock.runFor(6000);
  await expect(frame).toHaveAttribute("data-slide", "1");
  await page.getByRole("button", { name: "הפעלת מצגת העבודות" }).click();
  await page.clock.runFor(2000);
  await expect(frame).toHaveAttribute("data-slide", "2");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.clock.runFor(6000);
  await expect(frame).toHaveAttribute("data-slide", "2");
});

test("desktop and mobile retain an uncropped 3:2 frame in both themes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  const frame = page.locator("[data-hero-slideshow]");
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    for (const width of [375, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width < 768 ? 812 : 1000 });
      const box = await frame.boundingBox();
      if (!box) throw new Error("Missing slideshow");
      expect(box.width / box.height).toBeCloseTo(1.5, 2);
      const images = await frame.locator("img").evaluateAll((elements) =>
        elements.map((element) => {
          const { width, height } = element.getBoundingClientRect();
          return { width, height, fit: getComputedStyle(element).objectFit };
        }),
      );
      for (const image of images) {
        expect(image.width).toBeCloseTo(box.width, 1);
        expect(image.height).toBeCloseTo(box.height, 1);
        expect(image.fit).toBe("contain");
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      if (width === 375 || width === 1440) {
        await expect
          .poll(() =>
            frame
              .locator("img")
              .first()
              .evaluate(
                (element) =>
                  (element as HTMLImageElement).complete &&
                  (element as HTMLImageElement).naturalWidth > 0,
              ),
          )
          .toBe(true);
        await page.screenshot({
          path: `test-results/hero-slideshow/${colorScheme}-${width}.png`,
        });
      }
    }
  }
});

test("without JavaScript the first project image remains visible", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/he`);
  await expect(
    page.locator('[data-hero-slideshow] [data-active="true"] img'),
  ).toHaveAttribute(
    "alt",
    "פרקטיקל AI — אירוע קרוב ועוזר אישי בוואטסאפ במובייל",
  );
  await expect(
    page.locator('[data-hero-slideshow] [data-active="true"]'),
  ).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-hero-slideshow] button")).toHaveCount(0);
  await context.close();
});
