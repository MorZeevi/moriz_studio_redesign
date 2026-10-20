import { expect, type Page, test } from "@playwright/test";

const track = "[data-testimonial-scroll-track]";
const root = "[data-testimonials]";

async function scrollToReview(page: Page, index: number) {
  await page.evaluate(
    ({ track, root, index }) => {
      const container = document.querySelector<HTMLElement>(track);
      const content = document.querySelector<HTMLElement>(root);
      if (!container || !content) throw new Error("Missing reviews");
      const top = Number.parseFloat(getComputedStyle(content).top);
      const distance = container.offsetHeight - content.offsetHeight;
      const count = content.querySelectorAll("[role='tab']").length;
      scrollTo({
        top:
          scrollY +
          container.getBoundingClientRect().top -
          top +
          ((index + 0.5) / count) * distance,
        behavior: "instant",
      });
    },
    { track, root, index },
  );
}

test("scrolling holds the reviews in view and advances through all six, then releases", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(track)).toHaveAttribute("data-scroll-enabled", "");
  const tabs = page.locator(`${root} [role='tab']`);
  await expect(tabs).toHaveCount(6);
  let pinnedTop: number | undefined;
  for (const index of [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0]) {
    await scrollToReview(page, index);
    await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
    const box = await page.locator(root).boundingBox();
    if (!box) throw new Error("Missing review geometry");
    pinnedTop ??= box.y;
    expect(box.y).toBeCloseTo(pinnedTop, 0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(900);
    if (index === 2) {
      await page.screenshot({
        path: "test-results/refinements/reviews-third.png",
      });
    }
  }
  await scrollToReview(page, 5);
  await page.evaluate(() =>
    scrollBy({ top: innerHeight, behavior: "instant" }),
  );
  await expect(tabs.nth(5)).toHaveAttribute("aria-selected", "true");
  await expect
    .poll(async () => (await page.locator(root).boundingBox())?.y ?? 0)
    .toBeLessThan(pinnedTop ?? 0);
});

test("manual review selection stays synchronized with subsequent scrolling and keyboard navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/he");
  await expect(page.locator(track)).toHaveAttribute("data-scroll-enabled", "");
  const tabs = page.locator(`${root} [role='tab']`);
  await scrollToReview(page, 0);
  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  await page.evaluate(() => scrollBy({ top: 10, behavior: "instant" }));
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  await tabs.nth(2).focus();
  await page.keyboard.press("ArrowDown");
  await expect(tabs.nth(3)).toBeFocused();
  await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
  await page.evaluate(() => scrollBy({ top: 10, behavior: "instant" }));
  await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
});

test("mobile, reduced motion and short viewports keep manual reviews without a scroll track", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
    { width: 1440, height: 400 },
  ]) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({
      reducedMotion: viewport.height === 900 ? "reduce" : "no-preference",
    });
    await page.goto("/he#testimonials");
    await expect(page.locator(root)).toHaveAttribute("data-enhanced", "true");
    await expect(page.locator(track)).not.toHaveAttribute(
      "data-scroll-enabled",
    );
    const tabs = page.locator(`${root} [role='tab']`);
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.evaluate(() => scrollBy({ top: 100, behavior: "instant" }));
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
    if (viewport.width === 390) {
      await page
        .locator("#testimonials")
        .screenshot({ path: "test-results/refinements/reviews-mobile.png" });
    }
  }
});

test("without JavaScript every review remains readable without reserved scroll space", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto("/he#testimonials");
    await expect(page.locator(track)).not.toHaveAttribute(
      "data-scroll-enabled",
    );
    await expect(page.locator(`${root} [role='tabpanel']`)).toHaveCount(6);
    for (const panel of await page.locator(`${root} [role='tabpanel']`).all()) {
      await expect(panel).toBeVisible();
    }
  } finally {
    await context.close();
  }
});
