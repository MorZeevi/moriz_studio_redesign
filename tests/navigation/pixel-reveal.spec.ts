import { expect, test } from "@playwright/test";

const storageKey = "moriz:pixel-reveal";
const cover = ".pixel-reveal";
const playing = ".pixel-reveal:has(.pixel-reveal__windows.is-playing)";

test("first homepage visit opens liquid windows and skips refresh and client return", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|didn't match|server rendered/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.goto("/he", { waitUntil: "domcontentloaded" });
  await expect(page.locator(playing)).toBeVisible();
  const appearance = await page.locator(cover).evaluate((element) => {
    const svg = element.querySelector(".pixel-reveal__svg") as SVGSVGElement;
    const windows = svg.querySelector(".pixel-reveal__windows") as SVGGElement;
    const first = windows.firstElementChild as SVGRectElement;
    const box = svg.getBoundingClientRect();
    const header = document.querySelector(".site-header") as HTMLElement;
    return {
      decorative: element.getAttribute("aria-hidden"),
      pointerEvents: getComputedStyle(element).pointerEvents,
      color: getComputedStyle(svg.lastElementChild as SVGRectElement).fill,
      width: first.width.baseVal.value,
      height: first.height.baseVal.value,
      radius: first.rx.baseVal.value,
      duration: getComputedStyle(first).animationDuration,
      headerVisibility: getComputedStyle(header).visibility,
      headerAnimation: getComputedStyle(header).animationName,
      coverAboveHeader:
        Number(getComputedStyle(element).zIndex) >
        (Number.parseInt(getComputedStyle(header).zIndex, 10) || 0),
      covers:
        box.left <= 0 &&
        box.top <= 0 &&
        box.right >= innerWidth &&
        box.bottom >= innerHeight,
      filter: getComputedStyle(windows).filter,
    };
  });
  expect(appearance).toMatchObject({
    decorative: "true",
    pointerEvents: "none",
    color: "rgb(221, 220, 140)",
    width: 258,
    height: 143,
    radius: 35.75,
    duration: "0.46s",
    headerVisibility: "visible",
    headerAnimation: "none",
    coverAboveHeader: true,
    covers: true,
  });
  expect(appearance.filter).toContain("pixel-reveal-");
  await page.locator(".pixel-reveal__window").evaluateAll((windows) => {
    for (const window of windows) {
      for (const animation of window.getAnimations()) {
        animation.pause();
        animation.currentTime = 550;
      }
    }
  });
  await page.screenshot({
    path: test.info().outputPath("liquid-windows-desktop.png"),
  });
  await expect(page.locator(cover)).toHaveCount(0);
  await expect(page.locator(".site-header")).toBeVisible();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), storageKey),
  ).toBe("1");
  await page.reload();
  await expect(page.locator(cover)).toBeHidden();
  await page
    .getByRole("link", { name: "לצפייה בכל הפרויקטים", exact: true })
    .click();
  await expect(page).toHaveURL(/\/he\/projects$/);
  await page.locator('a[href="/he#top"]').first().click();
  await expect(page.locator(cover)).toBeHidden();
  await expect(page.locator("#hero-heading")).toHaveAccessibleName(
    "יוצרת אתרים מורכבים, אפליקציות Web, איפיון ועיצוב וכלי AI מבוססי מחקר",
  );
  expect(errors).toEqual([]);
});

test("a fresh mobile session shows the homepage without the opening cover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he", { waitUntil: "domcontentloaded" });
  await expect(page.locator(cover)).toBeHidden();
  await expect(page.locator("#hero-heading")).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "פעולות מהירות" })
      .getByRole("link", { name: "שנדבר בוואטסאפ?" }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("homepage-mobile-without-cover.png"),
  });
  await expect(page.locator(".site-header")).toBeVisible();
  expect(await page.locator("html").getAttribute("data-pixel-reveal")).not.toBe(
    "active",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("reduced motion, section links and other public pages open directly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  await expect(page.locator(cover)).toBeHidden();
  await expect(page.locator(".site-header")).toBeVisible();
  // Finish the reduced-motion hydration path before changing that preference.
  await expect(page.locator("html")).toHaveAttribute(
    "data-pixel-reveal",
    "done",
  );
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), storageKey),
  ).toBeNull();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/he#projects");
  await expect(page.locator(cover)).toBeHidden();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), storageKey),
  ).toBeNull();
  for (const path of [
    "/he/projects",
    "/he/projects/practice-ai",
    "/he/fonts",
  ]) {
    await page.goto(path);
    await expect(page.locator(cover)).toHaveCount(0);
    expect(
      await page.locator("html").getAttribute("data-pixel-reveal"),
    ).toBeNull();
  }
  // A project-first visit must not consume the homepage opening.
  await page.goto("/he/projects");
  await page.locator('a[href="/he#top"]').first().click();
  await expect(page.locator(playing)).toBeVisible();
  await expect(page.locator(cover)).toHaveCount(0);
});

test("without JavaScript the cover never obscures the homepage", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/he`);
  await expect(page.locator(cover)).toBeHidden();
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator("#hero-heading")).toBeVisible();
  await page.locator(".header-contact-link").click();
  await expect(page).toHaveURL(/#contact$/);
  await context.close();
});

test("blocked storage still completes and skips client return", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
  });
  await page.goto("/he", { waitUntil: "domcontentloaded" });
  await expect(page.locator(playing)).toBeVisible();
  await expect(page.locator(cover)).toHaveCount(0);
  await page
    .getByRole("link", { name: "לצפייה בכל הפרויקטים", exact: true })
    .click();
  await page.locator('a[href="/he#top"]').first().click();
  await expect(page.locator(cover)).toBeHidden();
});

test("slow fonts are bounded and input dismisses without swallowing navigation", async ({
  page,
}) => {
  let releaseFonts: () => void = () => {};
  const pendingFonts = new Promise<void>((resolve) => {
    releaseFonts = resolve;
  });
  await page.route("**/*.woff2", async (route) => {
    await pendingFonts;
    await route.continue().catch(() => {});
  });
  await page.goto("/he", { waitUntil: "domcontentloaded" });
  await expect(page.locator(playing)).toBeVisible();
  expect(await page.evaluate(() => document.fonts.status)).toBe("loading");
  await page.locator(".hero-projects-link").click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.locator(cover)).toHaveCount(0);
  releaseFonts();
});

test("keyboard and resize dismiss the cover", async ({ page }) => {
  await page.goto("/he", { waitUntil: "domcontentloaded" });
  await expect(page.locator(playing)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(cover)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "דלג לתוכן" })).toBeFocused();
  await page.evaluate((key) => sessionStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(playing)).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator(cover)).toHaveCount(0);
});

test("CSS removes the entire cover when JavaScript animation startup fails", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.requestAnimationFrame = () => 0;
    const originalTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) =>
      timeout && timeout > 800
        ? 0
        : originalTimeout(
            handler,
            timeout,
            ...args,
          )) as typeof window.setTimeout;
  });
  await page.goto("/he", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".pixel-reveal__svg")).toHaveCount(1);
  await expect(page.locator(cover)).toBeHidden({ timeout: 4500 });
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator("#hero-heading")).toBeVisible();
});

test("pre-paint initialization covers a fresh visit and skips a returning visit before hydration", async ({
  page,
}) => {
  await page.route("**/_next/static/**/*.js*", (route) => route.abort());
  await page.goto("/he", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-pixel-reveal",
    "active",
  );
  await expect(page.locator(".pixel-reveal__solid")).toBeVisible();
  await expect(page.locator(".site-header")).toBeVisible();
  expect(
    await page
      .locator(".pixel-reveal__solid")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe("rgb(221, 220, 140)");
  await page.evaluate((key) => sessionStorage.setItem(key, "1"), storageKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-pixel-reveal",
    "skip",
  );
  await expect(page.locator(cover)).toBeHidden();
});

test("scrolling, reduced-motion changes and a hidden tab end playback", async ({
  page,
}) => {
  for (const action of ["scroll", "motion", "hidden"]) {
    await page.goto("/he", { waitUntil: "domcontentloaded" });
    await expect(page.locator(playing)).toBeVisible();
    if (action === "scroll") await page.mouse.wheel(0, 300);
    if (action === "motion")
      await page.emulateMedia({ reducedMotion: "reduce" });
    if (action === "hidden")
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
    await expect(page.locator(cover)).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate((key) => sessionStorage.removeItem(key), storageKey);
  }
});
