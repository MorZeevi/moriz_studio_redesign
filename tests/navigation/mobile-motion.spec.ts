import { expect, type Locator, test } from "@playwright/test";

async function translation(element: Locator, axis: "x" | "y") {
  return element.evaluate((node, axis) => {
    const matrix = new DOMMatrix(getComputedStyle(node).transform);
    return axis === "x" ? matrix.m41 : matrix.m42;
  }, axis);
}

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test("both mobile galleries drift, can be dragged horizontally, and allow vertical page swipes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/he");
  for (const sectionName of ["about-gallery", "about-gallery-reverse"]) {
    const section = page.locator(`[data-wireframe-section='${sectionName}']`);
    await expect(section).toHaveAttribute("data-gallery-enhanced", "");
    await section.scrollIntoViewIfNeeded();
    const track = section.locator("[data-gallery-card]").first().locator("..");
    const initial = await translation(track, "x");
    await expect
      .poll(async () => Math.abs((await translation(track, "x")) - initial))
      .toBeGreaterThan(2);
    const box = await section.boundingBox();
    if (!box) throw new Error("Missing gallery geometry");
    const session = await page.context().newCDPSession(page);
    const y = Math.max(100, Math.min(700, box.y + box.height / 2));
    const beforeDrag = await translation(track, "x");
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 300, y }],
    });
    for (const x of [270, 220, 170, 120]) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y }],
      });
      await page.waitForTimeout(35);
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(async () => Math.abs((await translation(track, "x")) - beforeDrag))
      .toBeGreaterThan(50);
    const beforeScroll = await page.evaluate(() => scrollY);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 200, y }],
    });
    for (const dy of [30, 70, 110]) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 200, y: y - dy }],
      });
      await page.waitForTimeout(35);
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeGreaterThan(beforeScroll + 30);
    await session.detach();
    await section.screenshot({
      path: `test-results/mobile-motion/${sectionName}.png`,
    });
  }
});

test("mobile FAQ actions fill their column and the hero projects action works", async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/he");
    const projects = page.locator(".hero-projects-link");
    await expect(projects).toBeVisible();
    await projects.tap();
    await expect(page).toHaveURL(/#projects$/);
    await page.goto("/he#faq");
    const expected = await page.locator("#faq details").first().boundingBox();
    if (!expected) throw new Error("Missing FAQ column");
    for (const action of [
      page.locator("#faq button"),
      page.locator("#faq a"),
    ]) {
      const box = await action.boundingBox();
      expect(box?.width).toBeCloseTo(expected.width, 0);
      expect(box?.x).toBeCloseTo(expected.x, 0);
    }
    const whatsappShape = await page
      .locator("#faq a .liquid__shapes")
      .boundingBox();
    expect(whatsappShape?.width).toBeCloseTo(expected.width, 0);
    expect(whatsappShape?.x).toBeCloseTo(expected.x, 0);
    const aiIcon = await page
      .locator("#faq button .liquid__icon")
      .boundingBox();
    const whatsappIcon = await page
      .locator("#faq a .liquid__icon")
      .boundingBox();
    if (!aiIcon || !whatsappIcon) throw new Error("Missing action lobes");
    expect(aiIcon.width).toBeCloseTo(whatsappIcon.width, 0);
    expect(aiIcon.height).toBeCloseTo(whatsappIcon.height, 0);
    if (width === 390) {
      await page
        .locator("#hero")
        .screenshot({ path: "test-results/mobile-motion/hero.png" });
      await page
        .locator("#faq")
        .screenshot({ path: "test-results/mobile-motion/faq.png" });
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
});

test("mobile footer stays still and preserves the image-filled wordmark", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  const surface = page.locator("[data-footer-surface]");
  await page.locator("[data-footer-stage]").evaluate((node) => {
    scrollTo(
      0,
      scrollY + node.getBoundingClientRect().top - innerHeight * 0.65,
    );
  });
  await expect(surface).toHaveCSS("transform", "none");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => translation(surface, "y")).toBeCloseTo(0, 0);
  const letters = page.locator("[data-footer-wordmark] [data-letter]");
  await expect(letters.first()).toHaveCSS(
    "background-image",
    /wordmark-fill\.webp/,
  );
  await expect(letters.first()).toHaveCSS("background-clip", "text");
  await expect.poll(() => translation(letters.last(), "y")).toBeCloseTo(0, 0);
  await page.screenshot({ path: "test-results/mobile-motion/footer.png" });
  await page.evaluate(() => scrollBy(0, -150));
  await expect(surface).toHaveCSS("transform", "none");
  await expect(letters.last()).toHaveCSS("transform", "none");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("reduced motion keeps native galleries and static image-filled footer text", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const gallery = page.locator("[data-wireframe-section='about-gallery']");
  await expect(gallery).not.toHaveAttribute("data-gallery-enhanced");
  await expect(gallery.locator("[data-copy]").first()).toBeHidden();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator("[data-footer-surface]")).toHaveCSS(
    "transform",
    "none",
  );
  const letter = page.locator("[data-footer-wordmark] [data-letter]").first();
  await expect(letter).toHaveCSS("background-image", /wordmark-fill\.webp/);
  await expect(letter).toHaveCSS("transform", "none");
});
