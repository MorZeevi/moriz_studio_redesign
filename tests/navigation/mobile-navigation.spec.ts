import { expect, test } from "@playwright/test";

const labels = [
  "פרויקטים",
  "קצת עלי",
  "איך מתחילים",
  "שאלות תשובות",
  "אבחון דיגיטלי",
  "בואו נדבר",
];

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
]) {
  test(`full-screen mobile menu fits ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/he");
    const trigger = page.locator(".mobile-menu-toggle");
    await expect(trigger).toHaveCSS("border-top-width", "0px");
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox?.width).toBe(48);
    expect(triggerBox?.height).toBe(48);
    await trigger.click();
    const dialog = page.locator(".navigation-dialog");
    await expect(dialog).toHaveAttribute("data-state", "open");
    await expect(dialog.locator(".navigation-links a")).toHaveText(labels);
    await expect(dialog).toHaveCSS("background-color", "rgb(221, 220, 140)");
    await expect(dialog).toHaveCSS("color", "rgb(38, 38, 38)");
    expect(await dialog.boundingBox()).toEqual({ x: 0, y: 0, ...viewport });
    expect(
      await dialog.evaluate((element) => element.scrollWidth <= innerWidth),
    ).toBe(true);
    await dialog
      .getByRole("link", { name: "בואו נדבר", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      dialog.getByRole("link", { name: "בואו נדבר", exact: true }),
    ).toBeInViewport();
    await expect(dialog.locator(".menu-close")).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  });
}

test("window reveal reverses during opening and closing without losing modal state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  await page.locator(".mobile-menu-toggle").click();
  const dialog = page.locator(".navigation-dialog");
  await expect(dialog).toHaveAttribute("data-state", "opening");
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  await page.waitForTimeout(180);
  await dialog.locator(".menu-close").click();
  await expect(dialog).toHaveAttribute("data-state", "closing");
  await dialog.locator(".menu-close").click();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog.locator(".menu-close svg")).toHaveCSS("rotate", "-45deg");
  await dialog.locator(".navigation-links a").last().focus();
  await page.keyboard.press("Tab");
  await expect(dialog.locator("a[href]").first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.locator(".navigation-links a").last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.locator(".mobile-menu-toggle").click();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(dialog).toBeHidden();
  await expect(
    page.locator('.desktop-navigation a[href="#projects"]'),
  ).toBeFocused();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
});

test("links wait for the exit and keep page-aware native destinations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  await page.locator(".mobile-menu-toggle").click();
  const dialog = page.locator(".navigation-dialog");
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(
    dialog.locator('.navigation-links a[href="/digital-audit"]'),
  ).toHaveText("אבחון דיגיטלי");
  await dialog.locator('.navigation-links a[href="#about"]').click();
  await expect(dialog).toHaveAttribute("data-state", "closing");
  expect(new URL(page.url()).hash).toBe("");
  await expect(page).toHaveURL(/\/he#about$/);
  await expect(dialog).toBeHidden();
  await page.goto("/he/projects");
  await page.locator(".mobile-menu-toggle").click();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(
    dialog.locator('.navigation-links a[href="/he#about"]'),
  ).toHaveText("קצת עלי");
  await expect(
    dialog.locator('.navigation-links a[href="#projects"]'),
  ).toHaveText("פרויקטים");
  await dialog.locator('.navigation-links a[href="/he#about"]').click();
  await expect(page).toHaveURL(/\/he#about$/);
});

test("closing retains staggered windows until the modal exit completes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  await page.locator(".mobile-menu-toggle").click();
  const dialog = page.locator(".navigation-dialog");
  await expect(dialog).toHaveAttribute("data-state", "open");
  const samples = await dialog.evaluate(async (element) => {
    const frames: { spread: number; locked: boolean }[] = [];
    (element.querySelector(".menu-close") as HTMLButtonElement).click();
    const start = performance.now();
    while (element.hasAttribute("open") && performance.now() - start < 600) {
      const opacity = Array.from(
        element.querySelectorAll(".pixel-reveal__window"),
      ).map((cell) => Number(getComputedStyle(cell).opacity));
      frames.push({
        spread: Math.max(...opacity) - Math.min(...opacity),
        locked:
          getComputedStyle(document.documentElement).overflow === "hidden",
      });
      await new Promise(requestAnimationFrame);
    }
    return frames;
  });
  expect(samples.some((frame) => frame.spread > 0.3)).toBe(true);
  expect(samples.every((frame) => frame.locked)).toBe(true);
  await expect(dialog).toBeHidden();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
});

test("yellow menu keeps dark controls in both themes and reduced motion skips the reveal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/he");
  await page.locator(".mobile-menu-toggle").click();
  const dialog = page.locator(".navigation-dialog");
  await expect(dialog).toHaveAttribute("data-state", "open");
  expect(
    await dialog
      .locator(".pixel-reveal__window")
      .evaluateAll(
        (elements) =>
          elements.flatMap((element) => element.getAnimations()).length,
      ),
  ).toBe(0);
  await expect(dialog).toHaveCSS("background-color", "rgb(221, 220, 140)");
  await expect(dialog.locator("[data-theme-toggle]")).toHaveCSS(
    "color",
    "rgb(38, 38, 38)",
  );
  await dialog.locator("[data-theme-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(dialog).toHaveCSS("background-color", "rgb(221, 220, 140)");
  await dialog.locator(".menu-close").click();
  await expect(dialog).toBeHidden();
  await page.locator(".mobile-menu-toggle").click();
  await dialog.locator('.navigation-links a[href="#faq"]').click();
  await expect(page).toHaveURL(/\/he#faq$/);
});

test("animation failure still opens and dismisses the menu", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      if (this.matches(".pixel-reveal__window"))
        throw new Error("Simulated animation failure");
      return animate.apply(this, args);
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  await page.locator(".mobile-menu-toggle").click();
  const dialog = page.locator(".navigation-dialog");
  await expect(dialog).toHaveAttribute("data-state", "open");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
});
