import { expect, type Page, test } from "@playwright/test";

async function revealFooter(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const surface = page.locator("[data-footer-surface]");
  if (
    await page.evaluate(
      () =>
        matchMedia(
          "(min-width: 64rem) and (prefers-reduced-motion: no-preference)",
        ).matches,
    )
  ) {
    await expect(surface).toHaveAttribute("style", /transform/);
  }
  await expect
    .poll(async () => {
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      return surface.evaluate((element) => {
        const transform = getComputedStyle(element).transform;
        return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
      });
    })
    .toBeCloseTo(0, 0);
}

for (const { width, height } of [
  { width: 1440, height: 900 },
  { width: 390, height: 900 },
  { width: 390, height: 500 },
]) {
  test(`footer section links reach their targets at ${width}×${height}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/he", { waitUntil: "domcontentloaded" });
    const footer = page.locator('[data-wireframe-section="footer"]');
    for (const hash of [
      "#projects",
      "#projects",
      "#about",
      "#getting-started",
      "#faq",
      "#contact",
    ]) {
      await revealFooter(page);
      await footer.locator(`a[href="${hash}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${hash}$`));
      await expect
        .poll(() =>
          page
            .locator(hash)
            .evaluate((element) =>
              Math.round(element.getBoundingClientRect().top),
            ),
        )
        .toBeLessThan(200);
      await expect
        .poll(() =>
          page
            .locator(hash)
            .evaluate((element) =>
              Math.round(element.getBoundingClientRect().top),
            ),
        )
        .toBeGreaterThanOrEqual(0);
    }
    await expect(page.locator(".language-link")).toHaveCount(0);
    if (width < 1024) {
      await page.locator(".mobile-menu-toggle").click();
      await expect(page.locator(".navigation-dialog")).toBeVisible();
      await expect(
        page.locator(".navigation-dialog .language-link"),
      ).toHaveCount(0);
    }
  });
}

test("archive footer keeps contact local and sends other sections home", async ({
  page,
}) => {
  await page.goto("/he/projects", { waitUntil: "domcontentloaded" });
  const footer = page.locator('[data-wireframe-section="footer"]');
  await expect(footer.locator('a[href="#contact"]')).toHaveCount(1);
  for (const hash of ["#projects", "#about", "#getting-started", "#faq"]) {
    await expect(footer.locator(`a[href="/he${hash}"]`)).toHaveCount(1);
  }
  await revealFooter(page);
  await footer.locator('a[href="/he#about"]').click();
  await expect(page).toHaveURL(/\/he#about$/);
  await expect
    .poll(() =>
      page
        .locator("#about")
        .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    )
    .toBeLessThan(200);
});
