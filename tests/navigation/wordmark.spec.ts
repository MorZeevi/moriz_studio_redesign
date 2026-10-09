import { expect, type Page, test } from "@playwright/test";

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

test("wordmark uses the site font, keeps the weight split and centered menu", async ({
  page,
}) => {
  await page.goto("/he#top");
  await page.evaluate(() => document.fonts.ready);
  const logo = page.locator(selector);
  await expect(logo).toHaveAccessibleName("moriz.studio");
  await expect(logo).toHaveAttribute("href", "/he#top");
  await expect(logo).toHaveText("moriz.studio");
  await expect(logo).toHaveCSS(
    "font-family",
    await page.evaluate(() => getComputedStyle(document.body).fontFamily),
  );
  await expect(logo.locator("span").first()).toHaveCSS("font-weight", "900");
  await expect(logo.locator("span").last()).toHaveCSS("font-weight", "400");
  await expect(page.locator("h1")).toHaveCount(1);
  const center = await page.locator(".site-header-inner").evaluate((header) => {
    const parent = header.getBoundingClientRect();
    const menu = header
      .querySelector(".desktop-navigation-links")
      ?.getBoundingClientRect();
    if (!menu) throw new Error("Missing menu");
    return Math.abs((menu.left + menu.right - parent.left - parent.right) / 2);
  });
  expect(center).toBeLessThan(1);
  await capture(page, "desktop-rest");
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
  await logo.hover();
  await expect(logo).toHaveCSS(
    "font-family",
    await page.evaluate(() => getComputedStyle(document.body).fontFamily),
  );
  await expect(logo.locator("span").first()).toHaveCSS("font-weight", "900");
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
