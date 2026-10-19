import { expect, type Page, test } from "@playwright/test";

const toggle = (page: Page) => page.locator("[data-theme-toggle]:visible");
const canvas = (page: Page) =>
  page
    .locator("body")
    .evaluate((body) => getComputedStyle(body).backgroundColor);
const expectTheme = (page: Page, theme: "light" | "dark") =>
  expect(page.locator("html")).toHaveAttribute("data-theme", theme);

for (const colorScheme of ["light", "dark"] as const) {
  test(`system ${colorScheme} applies before hydration and keeps the grain`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ colorScheme });
    const page = await context.newPage();
    await page.route("**/_next/static/**/*.js*", (route) => route.abort());
    await page.goto(`${baseURL}/he#about`, { waitUntil: "domcontentloaded" });
    await expectTheme(page, colorScheme);
    expect(await canvas(page)).toBe(
      colorScheme === "dark" ? "rgb(38, 38, 38)" : "rgb(251, 251, 255)",
    );
    await expect(page.locator(".site-header .react-bits-noise")).toHaveCount(0);
    // One site-wide grain; sections add none, so no band reads darker.
    await expect(page.locator(".page-grain .react-bits-noise")).toHaveCount(1);
    await expect(
      page.locator(
        ":is(#hero, #advantages, #testimonials, #contact) .react-bits-noise",
      ),
    ).toHaveCount(0);
    await expect(page.locator(".header-contact-link img")).toBeVisible();
    await context.close();
  });
}

test("site grain sits behind the header and hero without a sticky overlay", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const header = page.locator(".site-header");
  const grain = page.locator(".page-grain > .react-bits-noise");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(header.locator("canvas")).toHaveCount(0);
    await expect(page.locator("#hero")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator("#hero .react-bits-noise")).toHaveCount(0);
    // The grain is fixed, so it covers the viewport at any scroll position.
    for (const scroll of [0, 240]) {
      await page.evaluate((top) => window.scrollTo(0, top), scroll);
      await expect
        .poll(async () => Math.abs((await grain.boundingBox())?.y ?? Infinity))
        .toBeLessThan(1);
    }
    if (width === 1440) {
      expect((await header.boundingBox())?.y).toBe(0);
    }
    await page.screenshot({
      path: test.info().outputPath(`header-grain-scrolled-${width}.png`),
    });
  }
});

test("system follows live OS changes until a manual choice survives reload and routes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration/i.test(message.text()))
      errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/he");
  await expectTheme(page, "dark");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ colorScheme: "light" });
  await expectTheme(page, "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expectTheme(page, "dark");
  await toggle(page).click();
  await expectTheme(page, "light");
  expect(await page.evaluate(() => localStorage.getItem("moriz:theme"))).toBe(
    "light",
  );
  await page.reload();
  await expectTheme(page, "light");
  await page.locator("#projects a[href='/he/projects']").click();
  await expect(page).toHaveURL(/\/he\/projects$/);
  await expectTheme(page, "light");
  expect(await canvas(page)).toBe("rgb(251, 251, 255)");
  await expect(page.locator("#projects")).toHaveCSS("color", "rgb(38, 38, 38)");
  // The projects page lets the themed canvas and its grain show through.
  await expect(page.locator("#projects")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".page-grain canvas")).toBeAttached();
  await toggle(page).click();
  await expectTheme(page, "dark");
  await expect(page.locator("#projects")).toHaveCSS(
    "color",
    "rgb(251, 251, 255)",
  );
  await page.locator("a[href^='/he/projects/']").first().click();
  await expect(page).toHaveURL(/\/he\/projects\/[^/]+$/);
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ colorScheme: "light" });
  await expectTheme(page, "dark");
  expect(await page.evaluate(() => localStorage.getItem("moriz:theme"))).toBe(
    "dark",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await expectTheme(page, "dark");
  expect(errors).toEqual([]);
});

test("manual choices synchronize across tabs and ignore subsequent OS changes", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/he");
  const other = await context.newPage();
  await other.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await other.goto("/he/projects");
  await toggle(page).click();
  await expectTheme(other, "dark");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expectTheme(page, "dark");
  await toggle(other).click();
  await expectTheme(page, "light");
});

test("a dark first visit shows the header through the opening", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/he", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-pixel-reveal",
    "active",
  );
  await expect(page.locator(".site-header")).toBeVisible();
  await expectTheme(page, "dark");
  await expect(page.locator(".pixel-reveal")).toHaveCount(0);
  await expect(page.locator(".site-header")).toBeVisible();
  expect(await canvas(page)).toBe("rgb(38, 38, 38)");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
});

test("switching while inside Projects is immediate and restores the light fade", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/he#about");
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator("#projects")
    .evaluate((section) =>
      scrollTo(
        0,
        scrollY + section.getBoundingClientRect().top - innerHeight * 0.625,
      ),
    );
  await expect
    .poll(() =>
      page
        .locator("#projects")
        .evaluate((section) =>
          Number(
            (section as HTMLElement).style.getPropertyValue("--project-reveal"),
          ),
        ),
    )
    .toBeCloseTo(0.5, 2);
  const y = await page.evaluate(() => scrollY);
  const control = await toggle(page).boundingBox();
  if (!control) throw new Error("Missing sticky theme control");
  await page.mouse.click(
    control.x + control.width / 2,
    control.y + control.height / 2,
  );
  await expectTheme(page, "dark");
  expect(await canvas(page)).toBe("rgb(38, 38, 38)");
  expect(await page.evaluate(() => scrollY)).toBe(y);
  await page.locator("#contact").scrollIntoViewIfNeeded();
  expect(await canvas(page)).toBe("rgb(38, 38, 38)");
  await page.evaluate((offset) => scrollTo(0, offset), y);
  await page.mouse.click(
    control.x + control.width / 2,
    control.y + control.height / 2,
  );
  await expectTheme(page, "light");
  await expect
    .poll(() =>
      page
        .locator("#projects")
        .evaluate((section) =>
          Number(
            (section as HTMLElement).style.getPropertyValue("--project-reveal"),
          ),
        ),
    )
    .toBeCloseTo(0.5, 2);
  await page.locator("#projects a[href='/he/projects']").click();
  await expect(page.locator("body")).not.toHaveAttribute(
    "data-project-backdrop",
  );
});

test("single keyboard toggle, compact headers and dark mobile drawer remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [375, 390, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(toggle(page)).toBeVisible();
    const parts = await page.locator(".site-header-inner").evaluate((header) =>
      Array.from(
        header.querySelectorAll(
          ".studio-wordmark, .desktop-navigation-links, .header-actions, .header-theme-mobile, .mobile-menu-toggle",
        ),
      )
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => {
          const { left, right } = element.getBoundingClientRect();
          return { left, right };
        })
        .sort((a, b) => a.left - b.left),
    );
    for (let i = 1; i < parts.length; i++)
      expect(parts[i].left).toBeGreaterThanOrEqual(parts[i - 1].right);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
  await expect(
    page.locator("[data-theme-controls]:visible button"),
  ).toHaveCount(1);
  await toggle(page).focus();
  await page.keyboard.press("Space");
  await expectTheme(page, "light");
  await expect(toggle(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expectTheme(page, "dark");
  await expect(
    page.getByRole("button", { name: "בחירת מראה", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "פתיחת תפריט" }).click();
  await expect(page.locator(".navigation-dialog")).toHaveAttribute(
    "data-state",
    "open",
  );
  await expect(page.locator(".navigation-dialog")).toHaveCSS(
    "background-color",
    "rgb(221, 220, 140)",
  );
  await expect(page.locator(".navigation-dialog")).toHaveCSS(
    "color",
    "rgb(38, 38, 38)",
  );
});

test("blocked storage and no JavaScript still honor the OS", async ({
  browser,
  baseURL,
}) => {
  const blocked = await browser.newContext({
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  await blocked.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    }),
  );
  const page = await blocked.newPage();
  await page.goto(`${baseURL}/he`);
  await expectTheme(page, "dark");
  await toggle(page).click();
  await expectTheme(page, "light");
  await page.locator("#projects a[href='/he/projects']").click();
  await expectTheme(page, "light");
  await blocked.close();
  const staticContext = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: "dark",
  });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(`${baseURL}/he`);
  expect(await canvas(staticPage)).toBe("rgb(38, 38, 38)");
  await expect(staticPage.locator("#projects")).toHaveCSS(
    "color",
    "rgb(251, 251, 255)",
  );
  await staticPage.locator("#projects a[href='/he/projects']").click();
  expect(await canvas(staticPage)).toBe("rgb(38, 38, 38)");
  await staticContext.close();
});

test("changing theme preserves an active Party and restores dark tag colors", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/he");
  const party = page.getByRole("switch", { name: "מצב מסיבה" });
  await party.click();
  await expect(page.locator("[data-party-state]")).toHaveAttribute(
    "data-party-state",
    "active",
  );
  await page.evaluate(() => scrollTo(0, 0));
  await toggle(page).click();
  await expectTheme(page, "dark");
  await expect(page.locator("[data-party-state]")).toHaveAttribute(
    "data-party-state",
    "active",
  );
  await expect(page.locator("[data-party-effects]")).toHaveCount(1);
  const headingContrast = await page
    .locator("#hero-heading [data-party-heading-light]")
    .evaluateAll((elements) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Missing color context");
      const luminance = (color: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data)
          .slice(0, 3)
          .reduce((total, channel, index) => {
            const value = channel / 255;
            return (
              total +
              (value <= 0.04045
                ? value / 12.92
                : ((value + 0.055) / 1.055) ** 2.4) *
                [0.2126, 0.7152, 0.0722][index]
            );
          }, 0);
      };
      const background = luminance(
        getComputedStyle(document.body).backgroundColor,
      );
      return elements.map(
        (element) =>
          (luminance(getComputedStyle(element).color) + 0.05) /
          (background + 0.05),
      );
    });
  expect(headingContrast.length).toBe(3);
  for (const contrast of headingContrast)
    expect(contrast).toBeGreaterThanOrEqual(3);
  await party.click();
  await expect(page.locator("[data-party-state]")).toHaveAttribute(
    "data-party-state",
    "idle",
  );
  await expect(page.locator("[data-party-effects]")).toHaveCount(0);
  await expect(page.locator("[data-party-tag]").nth(2)).toHaveCSS(
    "color",
    "rgb(251, 251, 255)",
  );
  expect(await canvas(page)).toBe("rgb(38, 38, 38)");
});

test("dark mode tints the rotating phrase and turns both CTAs white", async ({
  page,
}) => {
  const read = () =>
    page.evaluate(() => {
      const style = (selector: string) =>
        getComputedStyle(document.querySelector(selector) as Element);
      const fill = (selector: string) =>
        style(`${selector} [class*="label"]`).backgroundColor;
      return {
        rotating: style(".hero-heading-rotating").color,
        heroFill: fill(".hero-projects-link"),
        heroInk: style(".hero-projects-link").color,
        contactFill: fill(".header-contact-link"),
        contactInk: style(".header-contact-link").color,
      };
    });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/he");
  await expectTheme(page, "dark");
  expect(await read()).toEqual({
    rotating: "rgb(221, 220, 140)",
    heroFill: "rgb(251, 251, 255)",
    heroInk: "rgb(38, 38, 38)",
    contactFill: "rgb(251, 251, 255)",
    contactInk: "rgb(38, 38, 38)",
  });
  await page.emulateMedia({ colorScheme: "light" });
  await expectTheme(page, "light");
  const light = await read();
  expect(light.rotating).not.toBe("rgb(221, 220, 140)");
  expect(light.contactFill).toBe("rgb(38, 38, 38)");
  expect(light.heroInk).toBe("rgb(251, 251, 255)");
});
