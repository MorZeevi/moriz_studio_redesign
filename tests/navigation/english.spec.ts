import { expect, test } from "@playwright/test";

// English site (/en): LTR, no Hebrew-only sections, and a language toggle
// that keeps the current page.

test("/ still redirects to Hebrew and /en is served in English", async ({
  page,
  request,
}) => {
  const root = await request.get("/", { maxRedirects: 0 });
  expect(root.status()).toBe(308);
  expect(root.headers().location).toMatch(/\/he$/);

  const english = await request.get("/en", { maxRedirects: 0 });
  expect(english.status()).toBe(200);

  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.locator('link[rel="alternate"][hreflang="he"]'),
  ).toHaveAttribute("href", /\/he$/);
  await expect(
    page.locator('link[rel="alternate"][hreflang="x-default"]'),
  ).toHaveAttribute("href", /\/he$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "en_US",
  );
});

test("English hides the diagnostic and the articles", async ({
  page,
  request,
}) => {
  await page.goto("/en");
  await expect(page.locator("#diagnostic-banner")).toHaveCount(0);
  await expect(page.locator('a[href*="digital-audit"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/articles"]')).toHaveCount(0);
  for (const path of [
    "/en/articles",
    "/en/articles/rss.xml",
    "/en/articles/ux-specification-process",
    "/en/articles/ux-specification-process?preview=1",
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  // Hebrew keeps both.
  await page.goto("/he");
  await expect(page.locator("#diagnostic-banner")).toHaveCount(1);
  await expect(
    page.locator('.desktop-navigation a[href="/he/articles"]'),
  ).toHaveCount(1);
});

test("the header toggle keeps the page and the query string", async ({
  page,
}) => {
  await page.goto("/he/projects?type=demo");
  const toggle = page.locator(".header-controls .language-link");
  await expect(toggle).toHaveAttribute("href", "/en/projects?type=demo");
  await toggle.click();
  await expect(page).toHaveURL(/\/en\/projects\?type=demo$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.locator(".header-controls .language-link").click();
  await expect(page).toHaveURL(/\/he\/projects\?type=demo$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("the mobile menu toggle keeps the page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/privacy-policy");
  await page.locator(".mobile-menu-toggle").click();
  const dialog = page.locator(".navigation-dialog");
  await expect(dialog).toHaveAttribute("data-state", "open");
  await dialog.locator(".language-link").click();
  await expect(page).toHaveURL(/\/he\/privacy-policy$/);
});

test("on a Hebrew-only article the toggle leads to the English homepage", async ({
  page,
}) => {
  await page.goto("/he/articles");
  await expect(page.locator(".header-controls .language-link")).toHaveAttribute(
    "href",
    "/en",
  );
});
