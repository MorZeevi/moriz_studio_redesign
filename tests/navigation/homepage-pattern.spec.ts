import { expect, type Page, test } from "@playwright/test";

const scope = (page: Page) => page.locator("[data-homepage-pattern-scope]");
const pattern = (page: Page) => page.locator("[data-homepage-pattern]");
const ink = (page: Page) => pattern(page).locator("div");
const shift = (page: Page) =>
  ink(page).evaluate(
    (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42,
  );

async function capture(page: Page, name: string) {
  await page.screenshot({ path: test.info().outputPath(`${name}.png`) });
}

async function expectBoundary(page: Page) {
  const background = await pattern(page).boundingBox();
  const projects = await page.locator("#projects").boundingBox();
  if (!background || !projects) throw new Error("Missing opening boundary");
  expect(background.y + background.height).toBeCloseTo(projects.y, 1);
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`wordmark pattern covers the opening and ends before Projects at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({
      colorScheme: "light",
      reducedMotion: "no-preference",
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/he");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".pixel-reveal")).toHaveCount(0);
    await expect(pattern(page)).toHaveCount(1);
    await expect(pattern(page)).toHaveAttribute("aria-hidden", "true");
    await expect(pattern(page)).toHaveCSS("pointer-events", "none");
    await expect(scope(page)).not.toHaveAttribute("aria-hidden", "true");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(ink(page)).toHaveCSS("background-color", "rgb(38, 38, 38)");
    await expect(ink(page)).toHaveCSS("opacity", "0.04");
    await expect(ink(page)).toHaveCSS("mask-repeat", "no-repeat");
    await expect(ink(page)).toHaveCSS("mask-position", "0px 0px");
    await expect(ink(page)).toHaveCSS(
      "mask-image",
      /moriz-wordmark-pattern\.svg/,
    );
    await expectBoundary(page);
    await capture(page, "hero-light");

    // Real scroll movement, including reversing to the initial composition.
    await scope(page).evaluate((element) => {
      scrollTo(0, scrollY + element.getBoundingClientRect().top + 400);
    });
    await expect
      .poll(() => shift(page))
      .toBeCloseTo(viewport.width >= 1024 ? 24 : 12, 1);
    await page.evaluate(() => scrollTo(0, 0));
    await expect.poll(() => shift(page)).toBe(0);

    await page.locator("[data-theme-toggle]:visible").click();
    await expect(ink(page)).toHaveCSS("background-color", "rgb(251, 251, 255)");
    await expect(ink(page)).toHaveCSS("opacity", "0.03");
    await capture(page, "hero-dark");
    await page.locator("[data-theme-toggle]:visible").click();

    await page.locator("#advantages").scrollIntoViewIfNeeded();
    await expect(pattern(page)).toBeInViewport();
    await capture(page, "services-light");
    await page.locator("#projects").evaluate((element) => {
      scrollTo(
        0,
        scrollY + element.getBoundingClientRect().top - innerHeight * 0.4,
      );
    });
    await expect(page.locator("#projects")).toHaveAttribute(
      "data-project-theme",
      "dark",
    );
    await expectBoundary(page);
    await capture(page, "projects-boundary");
    await page.locator("#projects").evaluate((element) => {
      scrollTo(0, scrollY + element.getBoundingClientRect().top + 1);
    });
    await expect(pattern(page)).not.toBeInViewport();

    // The lower yellow canvas must have no pattern at all.
    await page.locator("#getting-started").evaluate((element) => {
      scrollTo(
        0,
        scrollY + element.getBoundingClientRect().top - innerHeight * 0.25,
      );
    });
    await expect(page.locator("body")).toHaveAttribute(
      "data-secondary-ink",
      "dark",
    );
    await expect(pattern(page)).not.toBeInViewport();
    await capture(page, "lower-canvas-no-pattern");
    const stopped = await shift(page);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    expect(await shift(page)).toBe(stopped);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);

    await page.locator("#projects a[href='/he/projects']").click();
    await expect(page).toHaveURL(/\/he\/projects$/);
    await expect(pattern(page)).toHaveCount(0);
    await page.goBack();
    await expect(pattern(page)).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test("reduced motion stays static and direct section links have no background leakage", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/he#advantages");
  await expect(pattern(page)).toBeInViewport();
  await expect(ink(page)).toHaveCSS("transform", "none");
  await expectBoundary(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => shift(page)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(ink(page)).toHaveCSS("transform", "none");
  await page.goto("/he#projects");
  await expectBoundary(page);
  // Native anchors retain the site's header clearance, so a strip of the
  // preceding section can remain visible. The mask must still stop at Projects.
  await expect(page.locator("#projects")).toBeInViewport();
  await expect(ink(page)).toHaveCSS("transform", "none");
  await page.goto("/he#about");
  await expect(pattern(page)).not.toBeInViewport();
});

test("without JavaScript both themes keep the pattern confined to the opening", async ({
  browser,
  baseURL,
}) => {
  for (const colorScheme of ["light", "dark"] as const) {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      colorScheme,
    });
    const page = await context.newPage();
    await page.goto(`${baseURL}/he`);
    await expect(pattern(page)).toBeInViewport();
    await expect(ink(page)).toHaveCSS("mask-repeat", "no-repeat");
    await expect(ink(page)).toHaveCSS(
      "background-color",
      colorScheme === "light" ? "rgb(38, 38, 38)" : "rgb(251, 251, 255)",
    );
    await expectBoundary(page);
    await page.locator("#projects").evaluate((element) => {
      scrollTo(0, scrollY + element.getBoundingClientRect().top + 1);
    });
    await expect(pattern(page)).not.toBeInViewport();
    expect(await shift(page)).toBe(0);
    await context.close();
  }
});
