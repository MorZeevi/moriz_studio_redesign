import { expect, test } from "@playwright/test";

for (const width of [320, 390, 430, 768]) {
  test(`mobile CTA, quote and footer remain readable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/he");
    await page.evaluate(() => document.fonts.ready);
    const action = page.locator(".hero-projects-link");
    const container = await page.locator(".hero-copy").boundingBox();
    const box = await action.boundingBox();
    expect(box?.width).toBeCloseTo(container?.width ?? 0, 0);
    expect(box?.height).toBeGreaterThanOrEqual(48);
    const label = action.locator(".liquid__label");
    expect(
      await label.evaluate((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return range.getClientRects().length;
      }),
    ).toBe(1);

    const quote = page.locator("#design-quote figure");
    await quote.scrollIntoViewIfNeeded();
    await expect(quote).toHaveCSS("opacity", "1");
    await expect(quote).toHaveCSS("transform", "none");
    await expect(quote.locator("blockquote")).toHaveText(
      "Design is the interface between technology and people.",
    );
    await expect(quote.locator("cite")).toContainText("Don Norman");

    await page.evaluate(() =>
      scrollTo(0, document.documentElement.scrollHeight),
    );
    const footer = page.locator("[data-footer-surface]");
    const wordmark = page.locator("[data-footer-wordmark]");
    await expect(footer).toHaveCSS("transform", "none");
    await expect(wordmark).toHaveCSS("transform", "none");
    await page.evaluate(() => scrollBy(0, -120));
    await expect(footer).toHaveCSS("transform", "none");
    await expect(wordmark).toHaveCSS("transform", "none");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });
}

test("mobile project names lead logos and pinned strips cover scrolling content", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he#projects");
  await page.evaluate(() => document.fonts.ready);
  const heads = page.locator("[data-stack-head]");
  expect(await heads.count()).toBeGreaterThan(1);
  for (const head of await heads.all()) {
    const name = await head.locator("h3").boundingBox();
    const logo = await head.locator("span[aria-hidden]").boundingBox();
    expect(name?.x).toBeGreaterThan((logo?.x ?? 0) + (logo?.width ?? 0));
    await head.evaluate((node) =>
      scrollTo(0, scrollY + node.getBoundingClientRect().top),
    );
    // Sample the pinned heading, every row above this one, and the side gutters.
    const covered = await page.locator("#projects").evaluate((section) => {
      const pinned = Array.from(
        section.querySelectorAll<HTMLElement>(
          "[data-stack-intro], [data-stack-head]",
        ),
      ).filter(
        (node) =>
          Math.abs(
            node.getBoundingClientRect().top -
              Number.parseFloat(getComputedStyle(node).top),
          ) < 2,
      );
      return (
        pinned.length > 0 &&
        pinned.every((node) => {
          const rect = node.getBoundingClientRect();
          const backing = getComputedStyle(node, "::before");
          const sample = document.elementFromPoint(
            rect.left + 8,
            rect.top + rect.height / 2,
          );
          return (
            backing.backgroundColor !== "rgba(0, 0, 0, 0)" &&
            rect.left + Number.parseFloat(backing.left) <= 0 &&
            rect.right - Number.parseFloat(backing.right) >= innerWidth &&
            !!sample &&
            node.contains(sample)
          );
        })
      );
    });
    expect(covered).toBe(true);
  }
});

for (const width of [1024, 1440]) {
  test(`desktop entrances settle once and survive responsive changes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/he");
    const quote = page.locator("#design-quote figure");
    await quote.scrollIntoViewIfNeeded();
    await expect(quote).toHaveCSS("opacity", "1");
    await expect(quote).toHaveCSS("transform", "none");
    await page.evaluate(() =>
      scrollTo(0, document.documentElement.scrollHeight),
    );
    const wordmark = page.locator("[data-footer-wordmark]");
    await expect(wordmark).toHaveCSS("transform", "none");
    await expect(wordmark).toHaveCSS("opacity", "1");
    await page.evaluate(() => scrollBy(0, -120));
    await expect(wordmark).toHaveCSS("transform", "none");
    await page.setViewportSize({ width: 390, height: 844 });
    await quote.scrollIntoViewIfNeeded();
    await expect(quote).toHaveCSS("transform", "none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await expect(quote).toHaveCSS("transform", "none");
  });
}

test("desktop footer rises from beneath the contact section and settles at the end", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  const surface = page.locator("[data-footer-surface]");
  const offset = () =>
    surface.evaluate(
      (node) => new DOMMatrix(getComputedStyle(node).transform).m42,
    );
  await page.locator("[data-footer-stage]").evaluate((node) => {
    scrollTo(0, scrollY + node.getBoundingClientRect().top - innerHeight * 0.6);
  });
  await expect.poll(offset).toBeLessThan(-20);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(offset).toBeCloseTo(0, 0);
});

test("desktop wordmark letters scrub up from tipped and settle at the end", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  const letter = page.locator("[data-footer-wordmark] [data-letter]").last();
  const lift = () =>
    letter.evaluate(
      (node) => new DOMMatrix(getComputedStyle(node).transform).m42,
    );
  await page.locator("[data-footer-wordmark]").evaluate((node) => {
    scrollTo(0, scrollY + node.getBoundingClientRect().top - innerHeight * 0.9);
  });
  await expect.poll(lift).toBeGreaterThan(20);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(lift).toBeCloseTo(0, 0);
});
