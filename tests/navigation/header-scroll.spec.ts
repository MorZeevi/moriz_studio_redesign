import { expect, type Page, test } from "@playwright/test";

type Box = { left: number; right: number; top: number; bottom: number };

const parts = (page: Page) =>
  page.evaluate(() => {
    const box = (element: Element | null): Box => {
      if (!element) throw new Error("Missing header part");
      const { left, right, top, bottom } = element.getBoundingClientRect();
      return { left, right, top, bottom };
    };
    const header = document.querySelector(".site-header");
    return {
      width: window.innerWidth,
      hidden: header?.hasAttribute("data-header-hidden") ?? false,
      brand: box(document.querySelector(".header-brand")),
      controls: box(document.querySelector(".header-controls")),
      contact: box(document.querySelector(".header-contact-link")),
      pills: Array.from(
        document.querySelectorAll(".desktop-navigation-links > li"),
        box,
      ),
      opacity: getComputedStyle(
        document.querySelector(".header-brand") as Element,
      ).opacity,
    };
  });

async function scrollPastFirstScreen(page: Page) {
  const start = await page.evaluate(() => window.innerHeight);
  // Land past the first screen going up, so the header is still in place.
  await page.evaluate((y) => window.scrollTo(0, y + 600), start);
  // Separate frames, so the header sees the upward step on its own.
  await page.waitForTimeout(300);
  await page.evaluate((y) => window.scrollTo(0, y + 300), start);
  await page.waitForTimeout(700);
}

async function scrollDown(page: Page) {
  await page.mouse.move(720, 500);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(900);
}

async function scrollUp(page: Page) {
  await page.mouse.move(720, 500);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(900);
}

test("the header slides off after the first screen and back on any upward scroll", async ({
  page,
}) => {
  await page.goto("/he");
  const rest = await parts(page);
  expect(rest.hidden).toBe(false);
  // RTL: brand on the right, then the pill, then the CTA at the far left.
  expect(rest.brand.left).toBeGreaterThan(rest.controls.right);
  expect(rest.controls.left).toBeGreaterThan(rest.contact.right);

  // Within the first 70vh, scrolling down keeps the header in place.
  await scrollDown(page);
  expect((await parts(page)).hidden).toBe(false);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.7 - 20));
  await page.waitForTimeout(300);
  expect((await parts(page)).hidden).toBe(false);
  // Crossing 70vh downward sends it away, while the hero video still grows.
  await scrollDown(page);
  expect((await parts(page)).hidden).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  expect((await parts(page)).hidden).toBe(false);

  await scrollPastFirstScreen(page);
  const settled = await parts(page);
  expect(settled.hidden).toBe(false);
  expect(settled.brand.left).toBeCloseTo(rest.brand.left, 0);

  await scrollDown(page);
  const away = await parts(page);
  expect(away.hidden).toBe(true);
  expect(away.brand.left).toBeGreaterThanOrEqual(away.width);
  expect(away.contact.right).toBeLessThanOrEqual(0);
  expect(away.controls.right).toBeLessThanOrEqual(0);
  for (const pill of away.pills) expect(pill.bottom).toBeLessThanOrEqual(0);

  await scrollUp(page);
  const back = await parts(page);
  expect(back.hidden).toBe(false);
  expect(back.brand.left).toBeCloseTo(rest.brand.left, 0);
  expect(back.contact.left).toBeCloseTo(rest.contact.left, 0);
  expect(back.controls.left).toBeCloseTo(rest.controls.left, 0);
  back.pills.forEach((pill, index) => {
    expect(pill.top).toBeCloseTo(rest.pills[index].top, 0);
  });
});

test("keyboard focus brings a hidden header back", async ({ page }) => {
  await page.goto("/he");
  const rest = await parts(page);
  await scrollPastFirstScreen(page);
  await scrollDown(page);
  expect((await parts(page)).hidden).toBe(true);
  await page.locator(".desktop-navigation a").first().focus();
  await page.waitForTimeout(900);
  const back = await parts(page);
  expect(back.hidden).toBe(false);
  expect(back.pills[0].top).toBeCloseTo(rest.pills[0].top, 0);
});

test("jumping from a header link keeps the header in place", async ({
  page,
}) => {
  await page.goto("/he");
  await page.locator(".desktop-navigation a[href='#about']").click();
  await page.waitForTimeout(700);
  expect((await parts(page)).hidden).toBe(false);
  // The reader's own next scroll down still sends it away.
  await scrollDown(page);
  expect((await parts(page)).hidden).toBe(true);
});

test("hidden header parts do not catch the pointer", async ({ page }) => {
  await page.goto("/he");
  await scrollPastFirstScreen(page);
  await scrollDown(page);
  const pointerEvents = await page
    .locator(".site-header-inner > .desktop-navigation")
    .evaluate((nav) => getComputedStyle(nav).pointerEvents);
  expect(pointerEvents).toBe("none");
  // Content under the empty header strip is reachable.
  expect(
    await page.evaluate(
      () => !document.elementFromPoint(720, 40)?.closest(".site-header"),
    ),
  ).toBe(true);
});

test("reduced motion fades the header instead of sliding it", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/he`);
  const rest = await parts(page);
  await scrollPastFirstScreen(page);
  await scrollDown(page);
  const away = await parts(page);
  expect(away.hidden).toBe(true);
  expect(away.opacity).toBe("0");
  expect(away.brand.left).toBeCloseTo(rest.brand.left, 0);
  await context.close();
});

test("mobile leaves the header alone", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/he`);
  await scrollPastFirstScreen(page);
  await scrollDown(page);
  expect(
    await page.locator(".site-header").getAttribute("data-header-hidden"),
  ).toBeNull();
  expect(
    await page
      .locator(".header-brand")
      .evaluate((brand) => getComputedStyle(brand).transform),
  ).toBe("none");
  await context.close();
});
