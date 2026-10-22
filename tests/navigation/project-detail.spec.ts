import { test, expect } from "@playwright/test";

test("Hebrew project URLs load directly and from the project archive", async ({
  page,
}) => {
  const slug = encodeURIComponent("וורדעל");
  const path = `/he/projects/${slug}`;
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/וורדעל/);
  await expect(page.locator("[data-project-detail] h1")).toHaveText("וורדעל");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: ".cache/footer-project-fixes/project-desktop.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".cache/footer-project-fixes/project-mobile.png",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.goto("/he/projects");
  await page
    .locator(`a[href="/he/projects/וורדעל"], a[href="${path}"]`)
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`${slug}$`));
  await expect(page.locator("[data-project-detail] h1")).toHaveText("וורדעל");
});

test("case-study panel stays pinned while short and long galleries scroll", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he/projects/practicalai");
  const panel = page.locator("[data-project-detail] aside");
  await expect(panel).toBeVisible();
  await expect(panel.locator("details, summary, h2")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  expect(
    await panel
      .locator("h1")
      .evaluate((element) => element.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(32);
  for (const height of [1000, 500]) {
    await page.setViewportSize({ width: 1440, height });
    await expect(panel).toHaveCSS("height", `${height - 64}px`);
    await expect(panel).toHaveCSS("max-height", `${height - 64}px`);
    for (const direction of ["rtl", "ltr"]) {
      await page
        .locator("[data-project-detail]")
        .evaluate(
          (element, value) => element.setAttribute("dir", value),
          direction,
        );
      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
          window.scrollTo(0, 0);
        }, theme);
        // Reproduce the owner's one-image case, including a viewport-height panel.
        const start = await panel.evaluate(
          (element) => element.getBoundingClientRect().top + window.scrollY,
        );
        const max = await page.evaluate(
          () => document.documentElement.scrollHeight - innerHeight,
        );
        expect(max).toBeGreaterThan(start);
        const titleTop = await panel
          .locator("h1")
          .evaluate((element) =>
            Math.round(element.getBoundingClientRect().top),
          );
        for (const scroll of [start + 32, max]) {
          await page.evaluate((value) => window.scrollTo(0, value), scroll);
          await expect
            .poll(() =>
              panel.evaluate((element) =>
                Math.round(element.getBoundingClientRect().top),
              ),
            )
            .toBe(32);
          await expect
            .poll(() =>
              panel
                .locator("h1")
                .evaluate((element) =>
                  Math.round(element.getBoundingClientRect().top),
                ),
            )
            .toBe(titleTop);
          await expect
            .poll(() =>
              panel.evaluate((element) =>
                Math.round(
                  innerHeight - element.getBoundingClientRect().bottom,
                ),
              ),
            )
            .toBe(32);
        }
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("[data-project-detail]").evaluate((element) => {
    element.setAttribute("dir", "rtl");
    document.documentElement.dataset.theme = "light";
  });
  await page
    .getByRole("region", { name: "תמונות הפרויקט", exact: true })
    .evaluate((element) => {
      element.style.minHeight = "3000px";
    });
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.screenshot({
    path: ".cache/footer-project-fixes/practicalai-scrolled.png",
  });
  await expect
    .poll(() =>
      panel.evaluate((element) =>
        Math.round(element.getBoundingClientRect().top),
      ),
    )
    .toBe(32);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect
    .poll(() =>
      panel.evaluate((element) =>
        Math.round(element.getBoundingClientRect().top),
      ),
    )
    .toBe(32);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(panel).not.toHaveCSS("position", "sticky");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("gallery reveals on scroll with shared corners and accessible theme controls", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/he/projects/practicalai?gallery=demo6");
    const panel = page.locator("[data-project-detail] aside");
    const toggle = panel.locator("[data-theme-toggle]");
    await expect(toggle).toBeVisible();
    const row = await panel.evaluate((element) => {
      const link = element.querySelector("a")?.getBoundingClientRect();
      const button = element.querySelector("button")?.getBoundingClientRect();
      if (!link || !button)
        throw new Error("Missing panel navigation controls");
      return Math.abs(link.y + link.height / 2 - button.y - button.height / 2);
    });
    expect(row).toBeLessThan(1);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    const gallery = page.getByRole("region", {
      name: "תמונות הפרויקט",
      exact: true,
    });
    await expect(gallery.locator("img")).toHaveCount(6);
    const radius = await gallery
      .locator("img")
      .first()
      .evaluate((image) => ({
        actual: getComputedStyle(image).borderTopLeftRadius,
        expected: getComputedStyle(document.documentElement)
          .getPropertyValue("--radius-md")
          .trim(),
      }));
    expect(radius.actual).toBe("6px");
    expect(Number.parseFloat(radius.expected)).toBe(0.375);
    const last = gallery.locator("[data-gallery-reveal]").last();
    await expect(last).toHaveAttribute("data-reveal", "pending");
    await last.evaluate((element) =>
      window.scrollTo(
        0,
        element.getBoundingClientRect().top + scrollY - innerHeight * 0.65,
      ),
    );
    await expect
      .poll(() =>
        last.evaluate(
          (element) => element.getAnimations({ subtree: true }).length,
        ),
      )
      .toBe(1);
    const motion = await last.evaluate((element) => {
      const effect = element.getAnimations({ subtree: true })[0]
        .effect as KeyframeEffect;
      return {
        duration: effect.getTiming().duration,
        frames: effect.getKeyframes(),
      };
    });
    expect(motion.duration).toBe(900);
    expect(motion.frames[0].clipPath).toContain("100%");
    await expect(last.locator("a")).not.toHaveCSS("clip-path", "none");
    await expect(last).toHaveCSS("opacity", "1");
    await expect
      .poll(() =>
        last.evaluate(
          (element) => element.getAnimations({ subtree: true }).length,
        ),
      )
      .toBe(0);
    await expect(last.locator("a")).toHaveCSS("clip-path", "none");
    await last.locator("a").click();
    const viewer = page.getByRole("dialog", { name: "צפייה בתמונות הפרויקט" });
    await expect(viewer).toBeVisible();
    await expect(viewer).toContainText("6 / 6");
    await page.keyboard.press("Escape");
    await expect(last.locator("a")).toBeFocused();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he/projects/practicalai?gallery=demo6");
  await expect(page.locator("[data-reveal=pending]")).toHaveCount(0);
  await expect(
    page.locator("[data-gallery-reveal]").last().locator("a"),
  ).toHaveCSS("clip-path", "none");
});
