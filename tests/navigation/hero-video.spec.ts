import { expect, test } from "@playwright/test";

// Desktop: the message on one side, the portrait on
// the other. At every width the showreel sits under the client logos and
// plays where it is, with no scroll expansion.

test("desktop sets the message beside the portrait", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".hero-portrait-image")).toBeVisible();
  // The showreel sits under the client logos, across the hero.
  const reel = await page.locator(".hero-video").boundingBox();
  const strip = await page.locator(".hero .logo-carousel").boundingBox();
  if (!reel || !strip) throw new Error("showreel not measured");
  expect(reel.y).toBeGreaterThanOrEqual(strip.y + strip.height - 1);
  // A framed video with air around it: narrower than the page, centred, and
  // never taller than the screen.
  expect(reel.width).toBeLessThan(strip.width * 0.8);
  expect(
    Math.abs(reel.x + reel.width / 2 - (strip.x + strip.width / 2)),
  ).toBeLessThan(2);
  expect(reel.height).toBeLessThan(1000);
  await expect(page.locator("[data-hero-video-end]")).toHaveCount(0);
  const message = await page.locator(".hero-message").boundingBox();
  const portrait = await page.locator(".hero-portrait").boundingBox();
  if (!message || !portrait) throw new Error("hero not measured");
  // RTL: the message is on the right, the portrait on the left.
  expect(portrait.x + portrait.width).toBeLessThanOrEqual(message.x + 1);
  // The headline reads in two lines, outline then filled.
  const halves = page.locator(".hero-heading-split > span:not([aria-hidden])");
  await expect(halves).toHaveCount(2);
  const first = await halves.nth(0).boundingBox();
  const second = await halves.nth(1).boundingBox();
  // The lines' boxes overlap slightly (room kept for descenders), so compare
  // against most of the first line's height.
  expect(second?.y).toBeGreaterThanOrEqual(
    (first?.y ?? 0) + (first?.height ?? 0) * 0.7,
  );
});

for (const width of [320, 390, 430, 768]) {
  test(`phones show the headline, the portrait, the action and the showreel at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/he");
    await page.evaluate(() => document.fonts.ready);
    // Phones read: short proof line, headline, portrait, then the action and
    // link, all centred and inside the first screen. No description.
    await expect(page.locator(".hero-description")).toBeHidden();
    await expect(page.locator(".hero-proof-detail")).toBeHidden();
    await expect(page.locator(".hero-portrait")).toBeVisible();
    await expect(page.locator(".hero-actions a")).toHaveCount(2);
    const action = await page.locator(".hero-contact-link").boundingBox();
    const link = await page.locator(".hero-projects-link").boundingBox();
    const portrait = await page.locator(".hero-portrait").boundingBox();
    const figures = await page.locator(".hero-proof").boundingBox();
    if (!action || !link || !portrait || !figures)
      throw new Error("hero not measured");
    expect(link.y + link.height).toBeLessThanOrEqual(844);
    expect(action.y).toBeGreaterThanOrEqual(portrait.y + portrait.height - 1);
    expect(
      await page
        .locator(".hero-proof")
        .evaluate((element) => getComputedStyle(element).textAlign),
    ).toBe("center");
    const heading = await page.locator("#hero-heading").boundingBox();
    expect(figures.y + figures.height).toBeLessThanOrEqual(
      (heading?.y ?? 0) + 1,
    );
    await expect(page.locator(".hero-proof")).toContainText("400k");
    // The showreel follows the client logos and spans the column.
    const strip = await page
      .locator(".hero > [data-logo-carousel]")
      .boundingBox();
    const card = await page.locator(".hero-video").boundingBox();
    if (!strip || !card) throw new Error("hero not measured");
    expect(card.y).toBeGreaterThanOrEqual(strip.y + strip.height);
    expect(card.width).toBeLessThan(strip.width);
    expect(
      Math.abs(card.x + card.width / 2 - (strip.x + strip.width / 2)),
    ).toBeLessThan(2);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
  });
}

test("the showreel can be paused and resumed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  const control = page.locator("[data-hero-video-target] button");
  // The showreel is under the logos, so it plays once it scrolls into view.
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeVisible();
  await expect(control).toHaveAttribute("aria-label", "עצירת הסרטון");
  await control.click();
  await expect(control).toHaveAttribute("aria-label", "הפעלת הסרטון");
});

test("reduced motion keeps the showreel still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  const control = page.locator("[data-hero-video-target] button");
  await expect(control).toHaveAttribute("aria-label", "הפעלת הסרטון");
  expect(
    await page
      .locator("[data-hero-video-target] video")
      .evaluate((video: HTMLVideoElement) => video.paused),
  ).toBe(true);
});
