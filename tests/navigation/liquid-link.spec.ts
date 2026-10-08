import { expect, test, type Page } from "@playwright/test";

const selector = ".hero-projects-link";

async function gap(page: Page) {
  return page
    .locator(selector)
    .evaluate((link) => parseFloat(getComputedStyle(link).columnGap));
}

async function moveToLink(page: Page) {
  const bounds = await page.locator(selector).boundingBox();
  if (!bounds) throw new Error("Missing hero link");
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
}

async function capture(page: Page, name: string) {
  if (!process.env.LIQUID_REVIEW_CAPTURE) return;
  await page.screenshot({
    path: `.impeccable/review/liquid-button/${name}.png`,
  });
  const bounds = await page.locator(selector).boundingBox();
  if (
    bounds &&
    bounds.y >= 0 &&
    bounds.y + bounds.height + 16 <= (page.viewportSize()?.height ?? 0)
  ) {
    await page.screenshot({
      path: `.impeccable/review/liquid-button/${name}-button.png`,
      clip: {
        x: Math.max(0, bounds.x - 16),
        y: bounds.y - 16,
        width: Math.min(
          bounds.width + 32,
          (page.viewportSize()?.width ?? 0) - Math.max(0, bounds.x - 16),
        ),
        height: bounds.height + 32,
      },
    });
  }
}

test("hero link has regular text, RTL arrow, independent liquid motion and press feedback", async ({
  page,
}) => {
  await page.goto("/he");
  await page.evaluate(() => document.fonts.ready);
  const link = page.locator(selector);
  await expect(link).toHaveAccessibleName("לצפיה בפרויקטים");
  await expect(link).toHaveAttribute("href", "#projects");
  await expect(link).toHaveAttribute("data-party-react", "cta");
  const initial = await link.evaluate((element) => {
    const cs = getComputedStyle(element);
    const icon = element.querySelector("span");
    const label = element.lastElementChild;
    return {
      weight: cs.fontWeight,
      height: element.getBoundingClientRect().height,
      arrow: getComputedStyle(element.querySelector("svg") as Element).scale,
      iconX: icon?.getBoundingClientRect().x,
      labelX: label?.getBoundingClientRect().x,
      filter: cs.filter,
      navFilter: getComputedStyle(
        document.querySelector(".desktop-navigation-links") as Element,
      ).filter,
    };
  });
  expect(initial.weight).toBe("400");
  expect(initial.height).toBe(48);
  expect(initial.arrow).toBe("-1 1");
  expect(initial.iconX).toBeGreaterThan(initial.labelX ?? 0);
  expect(initial.filter).not.toBe(initial.navFilter);
  expect(await gap(page)).toBe(2);
  await capture(page, "desktop-rest");
  await moveToLink(page);
  await expect.poll(() => gap(page)).toBeGreaterThan(18);
  const appearance = await link.evaluate((element) => {
    const shape = element.querySelector("[data-liquid-shape]") as Element;
    const sample = document.createElement("span");
    sample.style.backgroundColor = "var(--color-action-primary)";
    element.appendChild(sample);
    const expectedFill = getComputedStyle(sample).backgroundColor;
    sample.remove();
    return {
      fill: getComputedStyle(shape).backgroundColor,
      expectedFill,
      gradient: getComputedStyle(shape).backgroundImage,
      shadow: getComputedStyle(element).boxShadow,
    };
  });
  expect(appearance.fill).toBe(appearance.expectedFill);
  expect(appearance.gradient).toBe("none");
  expect(appearance.shadow).toBe("none");
  const filterId = await link.evaluate(
    (element) =>
      (element as HTMLElement).style
        .getPropertyValue("--lb-filter")
        .match(/#([^"]+)/)?.[1],
  );
  const blur = page.locator(`filter[id="${filterId}"] feGaussianBlur`);
  await expect
    .poll(async () =>
      parseFloat((await blur.getAttribute("stdDeviation")) ?? "0"),
    )
    .toBeGreaterThan(6.8);
  await page.waitForTimeout(600);
  await capture(page, "desktop-hover");
  await page.mouse.down();
  await expect.poll(() => gap(page)).toBeLessThan(3);
  await capture(page, "desktop-pressed");
  await page.mouse.move(0, 200);
  await page.mouse.up();
  await expect.poll(() => gap(page)).toBe(2);
  await page.waitForTimeout(1000);
  const stopped = await blur.getAttribute("stdDeviation");
  expect(stopped).toBe("3.50");
  await page.waitForTimeout(100);
  expect(await blur.getAttribute("stdDeviation")).toBe(stopped);
  await link.click();
  await expect(page).toHaveURL(/#projects$/);
});

test("keyboard focus is visible and reduced motion stays static", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const link = page.locator(selector);
  await link.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect(
    await link.evaluate((element) => element.matches(":focus-visible")),
  ).toBe(true);
  expect(
    await link
      .locator("span")
      .last()
      .evaluate((label) => getComputedStyle(label).textDecorationLine),
  ).toContain("underline");
  await moveToLink(page);
  expect(await gap(page)).toBe(2);
  expect(
    await link.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    ),
  ).toBe("0s");
  expect(
    await link
      .locator("[data-liquid-shape]")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundImage),
  ).toBe("none");
  await capture(page, "keyboard-reduced");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#projects$/);
});

test("mobile sizes and enlarged text keep the hero link in its available space", async ({
  page,
}) => {
  for (const width of [320, 390, 1024]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto("/he");
    await page.evaluate(() => document.fonts.ready);
    const link = page.locator(selector);
    await moveToLink(page);
    await page.waitForTimeout(650);
    for (const enlarged of [false, true]) {
      if (enlarged)
        await page.addStyleTag({ content: "html { font-size: 200%; }" });
      const bounds = await link.boundingBox();
      expect(bounds?.x).toBeGreaterThanOrEqual(0);
      expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
        width,
      );
      const fits = await link.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      );
      expect(fits).toBe(true);
      if (!enlarged) await capture(page, `width-${width}`);
    }
  }
});

test("touch press has feedback and activates the native destination", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/he`);
  await page.evaluate(() => document.fonts.ready);
  const link = page.locator(selector);
  const session = await context.newCDPSession(page);
  const box = await link.boundingBox();
  if (!box) throw new Error("Missing touch link");
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
  });
  await expect(link).toHaveAttribute("data-liquid-pressed", "");
  expect(
    await link
      .locator("[data-liquid-shape]")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe("rgba(0, 0, 0, 0)");
  await capture(page, "touch-pressed");
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page).toHaveURL(/#projects$/);
  await context.close();
});

test("the liquid hero remains a usable link without JavaScript and mirrors in LTR", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/he`);
  const link = page.locator(selector);
  await expect(link).toHaveAccessibleName("לצפיה בפרויקטים");
  await capture(page, "no-js");
  await link.click();
  await expect(page).toHaveURL(/#projects$/);
  await context.close();
  const ltrContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const ltrPage = await ltrContext.newPage();
  await ltrPage.goto(`${baseURL}/he`);
  await ltrPage.evaluate(() => {
    document.documentElement.dir = "ltr";
  });
  expect(
    await ltrPage
      .locator(`${selector} svg`)
      .evaluate((element) => getComputedStyle(element).scale),
  ).toBe("none");
  await capture(ltrPage, "ltr");
  await ltrContext.close();
});

test("secondary liquid link opens the projects collection with independent styling", async ({
  page,
}) => {
  await page.goto("/he");
  const hero = page.locator(selector);
  const collection = page.getByRole("link", {
    name: "לצפייה בכל הפרויקטים",
    exact: true,
  });
  await collection.scrollIntoViewIfNeeded();
  await expect(collection).toHaveAttribute("href", "/he/projects");
  const appearance = await collection.evaluate((element) => {
    const shape = element.querySelector("[data-liquid-shape]");
    const sample = document.createElement("span");
    sample.style.backgroundColor = "var(--color-secondary)";
    element.appendChild(sample);
    const expected = getComputedStyle(sample).backgroundColor;
    sample.remove();
    return {
      fill: getComputedStyle(shape as Element).backgroundColor,
      expected,
      border: getComputedStyle(element).borderWidth,
    };
  });
  expect(appearance.fill).toBe(appearance.expected);
  expect(appearance.border).toBe("0px");
  expect(
    await collection.evaluate((element) => getComputedStyle(element).filter),
  ).not.toBe(
    await hero.evaluate((element) => getComputedStyle(element).filter),
  );
  await collection.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/he\/projects$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "כל הפרויקטים" }),
  ).toBeVisible();
});
