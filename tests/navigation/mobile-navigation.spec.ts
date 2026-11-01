import { expect, test } from "@playwright/test";

const labels = [
  "פרויקטים",
  "קצת עלי",
  "איך מתחילים",
  "מאמרים",
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

test("menu opens and closes instantly and keeps modal state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  await page.locator(".mobile-menu-toggle").click();
  const dialog = page.locator(".navigation-dialog");
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  expect(
    await dialog.evaluate(
      (element) =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => !(animation instanceof CSSTransition)).length,
    ),
  ).toBe(0);
  await expect(dialog.locator(".menu-close svg")).toHaveCSS("rotate", "-45deg");
  await dialog.locator(".navigation-links a").last().focus();
  await page.keyboard.press("Tab");
  await expect(dialog.locator("a[href]").first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.locator(".navigation-links a").last()).toBeFocused();
  await dialog.locator(".menu-close").click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  await page.locator(".mobile-menu-toggle").click();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(dialog).toBeHidden();
  await expect(
    page.locator('.desktop-navigation a[href="#projects"]'),
  ).toBeFocused();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
});

test("links close the menu and keep page-aware native destinations", async ({
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

test("yellow menu keeps dark controls in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/he");
  await page.locator(".mobile-menu-toggle").click();
  const dialog = page.locator(".navigation-dialog");
  await expect(dialog).toHaveAttribute("data-state", "open");
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
