import { expect, type Page, test } from "@playwright/test";

const labels = [
  "פרויקטים",
  "קצת עליי",
  "איך מתחילים",
  "מאמרים",
  "שאלות תשובות",
  "אבחון דיגיטלי",
];
const destinations = [
  "#projects",
  "#about",
  "#getting-started",
  "/he/articles",
  "#faq",
  "/digital-audit",
];
const navSelector = ".desktop-navigation";

function link(page: Page, href: string) {
  return page.locator(`${navSelector} a[href="${href}"]`);
}

async function hoverLink(page: Page, href: string) {
  const bounds = await link(page, href).boundingBox();
  if (!bounds) throw new Error(`Missing navigation link ${href}`);
  // Move the real pointer without auto-scrolling a sticky descendant.
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
}

async function expectHeaderFits(page: Page) {
  const alignment = await page
    .locator(".site-header-inner")
    .evaluate((header) => {
      const parent = header.getBoundingClientRect();
      const menu = header
        .querySelector(".desktop-navigation-links")
        ?.getBoundingClientRect();
      if (!menu) throw new Error("Missing desktop menu");
      return Math.abs(
        (menu.left + menu.right) / 2 - (parent.left + parent.right) / 2,
      );
    });
  expect(alignment).toBeLessThanOrEqual(1);
  const boxes = await page.locator(".site-header-inner").evaluate((header) => {
    const parts = Array.from(
      header.querySelectorAll(
        ".studio-wordmark, .desktop-navigation-links, .header-actions",
      ),
    );
    return parts
      .map((part) => {
        const { left, right, top, bottom } = part.getBoundingClientRect();
        return { left, right, top, bottom };
      })
      .sort((a, b) => a.left - b.left);
  });
  for (let index = 0; index < boxes.length; index++) {
    expect(boxes[index].left).toBeGreaterThanOrEqual(0);
    expect(boxes[index].right).toBeLessThanOrEqual(
      page.viewportSize()?.width ?? 0,
    );
    if (index)
      expect(boxes[index].left).toBeGreaterThan(boxes[index - 1].right);
    expect(boxes[index].top).toBeLessThan(boxes[0].bottom);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    page.viewportSize()?.width,
  );
}

test("desktop copy, RTL order and the full expanded menu fit every target width", async ({
  page,
}) => {
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(`${navSelector} a`)).toHaveText(labels);
  expect(
    await link(page, "#about").evaluate(
      (element) => getComputedStyle(element).fontWeight,
    ),
  ).toBe("400");
  await expect(page.locator(".header-contact-link")).toHaveText("בואו נדבר");
  await expect(page.locator(".header-contact-link")).toHaveAttribute(
    "href",
    "#contact",
  );
  await expect(page.locator(`${navSelector} [aria-current]`)).toHaveCount(0);
  for (let index = 0; index < destinations.length; index++) {
    await expect(page.locator(`${navSelector} a`).nth(index)).toHaveAttribute(
      "href",
      destinations[index],
    );
  }
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.mouse.move(0, 200);
    await expectHeaderFits(page);
    const first = await link(page, "#projects").boundingBox();
    const last = await link(page, "#faq").boundingBox();
    expect(first?.x).toBeGreaterThan(last?.x ?? 0);
    await link(page, "#projects").click();
    await expect(link(page, "#projects")).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(
      await link(page, "#projects").evaluate(
        (element) => getComputedStyle(element, "::after").backgroundColor,
      ),
    ).toBe("rgb(251, 44, 54)");
    await hoverLink(page, "#faq");
    await expect
      .poll(() =>
        page
          .locator(`${navSelector} li`)
          .nth(2)
          .evaluate((element) =>
            parseFloat(getComputedStyle(element).paddingInlineEnd),
          ),
      )
      .toBeGreaterThan(17);
    await expectHeaderFits(page);
    await expect(link(page, "#projects")).toHaveAttribute(
      "aria-current",
      "location",
    );
  }
});

test("native anchors stay clear of the sticky header and scroll-spy follows page order", async ({
  page,
}) => {
  await page.goto("/he");
  for (const href of ["#about", "#projects", "#getting-started", "#faq"]) {
    await link(page, href).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(link(page, href)).toHaveAttribute("aria-current", "location");
    await expect(page.locator(`${navSelector} [aria-current]`)).toHaveCount(1);
    const header = await page.locator(".site-header").boundingBox();
    const section = await page.locator(href).boundingBox();
    expect(header?.y).toBe(0);
    expect(section?.y).toBeGreaterThanOrEqual((header?.height ?? 0) + 15);
  }
  await page.evaluate(() =>
    document.getElementById("projects")?.scrollIntoView(),
  );
  await expect(link(page, "#projects")).toHaveAttribute(
    "aria-current",
    "location",
  );
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(link(page, "#faq")).toHaveAttribute("aria-current", "location");
  await page.locator(".header-contact-link").click();
  await expect(page).toHaveURL(/#contact$/);
  const header = await page.locator(".site-header").boundingBox();
  const contact = await page.locator("#contact").boundingBox();
  expect(contact?.y).toBeGreaterThanOrEqual((header?.height ?? 0) + 15);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator(`${navSelector} [aria-current]`)).toHaveCount(0);
});

test("deep links, keyboard focus and reduced motion remain functional", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he#faq");
  await expect(link(page, "#faq")).toHaveAttribute("aria-current", "location");
  await link(page, "#getting-started").focus();
  await expect(link(page, "#getting-started")).toBeFocused();
  const focused = await link(page, "#getting-started").evaluate((element) => ({
    focusVisible: element.matches(":focus-visible"),
    decoration: getComputedStyle(element.querySelector("span") as Element)
      .textDecorationLine,
    transition: getComputedStyle(element.parentElement as Element)
      .transitionDuration,
    background: getComputedStyle(element).backgroundImage,
  }));
  expect(focused.focusVisible).toBe(true);
  expect(focused.decoration).toContain("underline");
  expect(focused.transition).toBe("0s");
  expect(focused.background).toBe("none");
  await link(page, "#getting-started").hover();
  expect(
    await link(page, "#getting-started").evaluate((element) =>
      (element as HTMLElement).style.getPropertyValue("--liquid-gx"),
    ),
  ).toBe("");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#getting-started$/);
  await expect(link(page, "#getting-started")).toHaveAttribute(
    "aria-current",
    "location",
  );
});

test("glow tracks fine pointers and stops updating after exit", async ({
  page,
}) => {
  await page.goto("/he");
  await expect
    .poll(() =>
      page
        .locator("html")
        .evaluate((element) =>
          element.style.getPropertyValue("--site-header-height"),
        ),
    )
    .not.toBe("");
  const pill = link(page, "#projects");
  await pill.hover();
  await expect
    .poll(() =>
      pill.evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("--liquid-gx"),
      ),
    )
    .not.toBe("");
  await page.mouse.move(0, 200);
  await expect
    .poll(() =>
      page
        .locator(".desktop-navigation-links")
        .evaluate((element) =>
          parseFloat(
            getComputedStyle(element).getPropertyValue("--liquid-glow-mix"),
          ),
        ),
    )
    .toBe(0);
  // Fade lasts 500ms; allow the animation loop's 700ms tail to finish.
  await page.waitForTimeout(250);
  const finalGlow = await pill.getAttribute("style");
  await page.waitForTimeout(100);
  expect(await pill.getAttribute("style")).toBe(finalGlow);
});

test("mobile matches desktop links and closes it when entering desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  await expect(page.locator(navSelector)).toBeHidden();
  await expect(page.locator(".mobile-menu-toggle")).toBeVisible();
  await expect(page.locator(".pixel-reveal")).toBeHidden();
  expect(
    await page
      .locator(".site-header")
      .evaluate((element) => getComputedStyle(element).position),
  ).toBe("sticky");
  await page.locator(".mobile-menu-toggle").click();
  await expect(page.locator(".navigation-dialog")).toBeVisible();
  await expect(page.locator(".navigation-links a")).toHaveText([
    "פרויקטים",
    "קצת עליי",
    "איך מתחילים",
    "מאמרים",
    "שאלות תשובות",
    "אבחון דיגיטלי",
    "בואו נדבר",
  ]);
  await page.keyboard.press("Escape");
  await expect(page.locator(".navigation-dialog")).toBeHidden();
  await expect(page.locator(".mobile-menu-toggle")).toBeFocused();
  await page.locator(".mobile-menu-toggle").click();
  await page.setViewportSize({ width: 1024, height: 1000 });
  await expect(page.locator(".navigation-dialog")).toBeHidden();
  await expect(link(page, "#projects")).toBeFocused();
});
