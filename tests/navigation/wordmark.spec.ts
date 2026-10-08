import { expect, test, type Page } from "@playwright/test";

const selector = ".site-header .studio-wordmark";

async function capture(page: Page, name: string) {
  if (!process.env.LIQUID_REVIEW_CAPTURE) return;
  const viewport = page.viewportSize();
  if (!viewport) return;
  await page.screenshot({
    path: `.impeccable/review/wordmark/${name}.png`,
    ...(viewport.width >= 1024
      ? { clip: { x: 0, y: 0, width: viewport.width, height: 112 } }
      : {}),
  });
}

test("bold pressure wordmark uses a local variable font without moving the centered menu", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  const logo = page.locator(selector);
  await expect(logo).toHaveAccessibleName("moriz.studio");
  await expect(logo).toHaveAttribute("href", "/he#top");
  await expect(page.locator("h1")).toHaveCount(1);
  const glyph = logo.locator("[data-pressure-char]").first();
  expect(
    await glyph.evaluate(
      (element) => getComputedStyle(element).fontVariationSettings,
    ),
  ).toContain('"wght" 700');
  expect(
    await page.evaluate(() =>
      Array.from(document.fonts).some(
        (font) =>
          font.family.includes("Roboto Flex Pressure") &&
          font.status === "loaded",
      ),
    ),
  ).toBe(true);
  await capture(page, "desktop-rest");
  const before = await logo.boundingBox();
  if (!before) throw new Error("Missing wordmark");
  const glyphs = logo.locator("[data-pressure-char]");
  const restingRects = await glyphs.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
      };
    }),
  );
  const lastRestingRect = restingRects.at(-1);
  if (!lastRestingRect) throw new Error("Missing wordmark glyphs");
  const widthAxes = () =>
    glyphs.evaluateAll((elements) =>
      elements.map((element) =>
        parseFloat(
          getComputedStyle(element).fontVariationSettings.match(
            /wdth["']?\s+([\d.]+)/,
          )?.[1] ?? "100",
        ),
      ),
    );
  await page.mouse.move(restingRects[0].x, restingRects[0].y);
  await expect
    .poll(() =>
      glyph.evaluate((element) =>
        parseFloat(
          (element as HTMLElement).style.fontVariationSettings.match(
            /wght["']?\s+([\d.]+)/,
          )?.[1] ?? "0",
        ),
      ),
    )
    .toBeGreaterThan(710);
  await page.waitForTimeout(500);
  const after = await logo.boundingBox();
  expect(after?.width).toBe(before.width);
  const center = await page.locator(".site-header-inner").evaluate((header) => {
    const parent = header.getBoundingClientRect();
    const menu = header
      .querySelector(".desktop-navigation-links")
      ?.getBoundingClientRect();
    if (!menu) throw new Error("Missing menu");
    return Math.abs((menu.left + menu.right - parent.left - parent.right) / 2);
  });
  expect(center).toBeLessThan(1);
  expect(
    await logo
      .locator("[data-pressure-char]")
      .nth(6)
      .evaluate((element) => getComputedStyle(element).fontVariationSettings),
  ).toContain('"wght" 400');
  await capture(page, "desktop-pressure");
  const leftAxes = await widthAxes();
  expect(leftAxes[0]).toBeGreaterThan(140);
  expect(leftAxes.at(-1)).toBeLessThan(40);
  const leftWidths = await glyphs.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().width),
  );
  expect(leftWidths[0]).toBeGreaterThan(restingRects[0].width);
  expect(leftWidths.at(-1)).toBeLessThan(lastRestingRect.width);
  await page.mouse.move(lastRestingRect.x, lastRestingRect.y);
  await expect
    .poll(async () => (await widthAxes()).at(-1))
    .toBeGreaterThan(140);
  await page.waitForTimeout(500);
  const rightAxes = await widthAxes();
  expect(rightAxes[0]).toBeLessThan(40);
  await capture(page, "desktop-pressure-right");
  // Pressure remains a nearby cursor field even outside the anchor itself.
  await page.mouse.move(restingRects[0].x, before.y - 10);
  expect(await logo.evaluate((element) => element.matches(":hover"))).toBe(
    false,
  );
  await expect
    .poll(async () => Math.min(...(await widthAxes())))
    .toBeLessThan(80);
  await page.waitForTimeout(500);
  await capture(page, "desktop-proximity");
  await page.mouse.move(0, 200);
  await expect
    .poll(() =>
      glyph.evaluate((element) =>
        parseFloat(
          (element as HTMLElement).style.fontVariationSettings.match(
            /wght["']?\s+([\d.]+)/,
          )?.[1] ?? "0",
        ),
      ),
    )
    .toBe(700);
  expect(errors).toEqual([]);
});

test("wordmark click and Enter return to the exact top of the homepage", async ({
  page,
}) => {
  await page.goto("/he#faq");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(100);
  await page.locator(selector).click();
  await expect(page).toHaveURL(/\/he#top$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.goto("/he/projects");
  const projectLogo = page
    .locator("header")
    .getByRole("link", { name: "moriz.studio", exact: true });
  await expect(projectLogo).toHaveAttribute("href", "/he#top");
  await projectLogo.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/he#top$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("reduced motion has a static bold wordmark and visible keyboard focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  const logo = page.locator(selector);
  await logo.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect(
    await logo.evaluate((element) => element.matches(":focus-visible")),
  ).toBe(true);
  const glyph = logo.locator("[data-pressure-char]").first();
  const initial = await glyph.getAttribute("style");
  await logo.hover();
  await page.waitForTimeout(250);
  expect(await glyph.getAttribute("style")).toBe(initial);
  await capture(page, "keyboard-reduced");
});

test("touch and no-JavaScript wordmarks remain native homepage links", async ({
  browser,
  baseURL,
}) => {
  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await touch.newPage();
  await page.goto(`${baseURL}/he`);
  await page.evaluate(() => document.fonts.ready);
  await capture(page, "mobile");
  await page.locator(selector).tap();
  await expect(page).toHaveURL(/\/he#top$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await touch.close();
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJS.newPage();
  await staticPage.goto(`${baseURL}/he/projects`);
  await staticPage
    .getByRole("link", { name: "moriz.studio", exact: true })
    .click();
  await expect(staticPage).toHaveURL(/\/he#top$/);
  await expect(staticPage.locator(selector)).toHaveAccessibleName(
    "moriz.studio",
  );
  await noJS.close();
});
