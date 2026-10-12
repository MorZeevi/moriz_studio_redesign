import { expect, type Page, test } from "@playwright/test";

async function position(page: Page, selector: string, fraction: number) {
  await page.locator(selector).evaluate((element, viewportFraction) => {
    const transform = new DOMMatrix(getComputedStyle(element).transform);
    scrollTo(
      0,
      scrollY +
        element.getBoundingClientRect().top -
        transform.m42 -
        innerHeight * viewportFraction,
    );
  }, fraction);
}

const offsets = (page: Page) =>
  page
    .locator(".advantages-card")
    .evaluateAll((cards) =>
      cards.map((card) => new DOMMatrix(getComputedStyle(card).transform).m42),
    );

const palette = (page: Page) =>
  page.locator(".advantages-card").evaluateAll((cards) =>
    cards.map((card) =>
      [
        card,
        ...card.querySelectorAll(
          "h3, p, [data-infinity-loop], [data-party-state]",
        ),
      ].map((element) => {
        const style = getComputedStyle(element);
        return {
          color: style.color,
          background: style.backgroundColor,
          border: style.borderColor,
          opacity: style.opacity,
        };
      }),
    ),
  );

for (const width of [1440, 390]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`advantages retain their ${colorScheme} palette through Projects at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme });
      await page.goto("/he#advantages");
      await page.evaluate(() => document.fonts.ready);
      await position(page, "#projects", 0.9);
      const before = await palette(page);
      for (const fraction of [0.625, 0.4, 0.9]) {
        await position(page, "#projects", fraction);
        await expect
          .poll(() =>
            page
              .locator("#projects")
              .evaluate((section) =>
                Number(
                  (section as HTMLElement).style.getPropertyValue(
                    "--project-reveal",
                  ),
                ),
              ),
          )
          .toBeCloseTo(
            colorScheme === "dark"
              ? 1
              : fraction === 0.625
                ? 0.5
                : fraction === 0.4
                  ? 1
                  : 0,
            2,
          );
        expect(await palette(page)).toEqual(before);
      }
      await expect(page.locator(".advantages-card")).toHaveCount(3);
      for (const card of await page.locator(".advantages-card").all())
        await expect(card).toHaveCSS("opacity", "1");
    });
  }

  test(`advantages rise with scrolling and reverse at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/he#advantages");
    await page.evaluate(() => document.fonts.ready);
    if (width >= 1024) {
      await position(page, ".advantages-grid", 0.95);
      await expect
        .poll(async () => (await offsets(page)).every((y) => y > 39))
        .toBe(true);
      await position(page, ".advantages-grid", 0.675);
      await expect
        .poll(async () => {
          const [first, second, third] = await offsets(page);
          return first > 0 && first < second && second < third && third < 40;
        })
        .toBe(true);
      await position(page, ".advantages-grid", 0.4);
      await expect
        .poll(async () => (await offsets(page)).every((y) => Math.abs(y) < 0.1))
        .toBe(true);
      await position(page, ".advantages-grid", 0.95);
      await expect
        .poll(async () => (await offsets(page)).every((y) => y > 39))
        .toBe(true);
    } else {
      await position(page, ".advantages-card:nth-child(2)", 0.96);
      await expect
        .poll(async () => (await offsets(page))[1])
        .toBeGreaterThan(23);
      await position(page, ".advantages-card:nth-child(2)", 0.68);
      await expect
        .poll(async () => Math.abs((await offsets(page))[1]))
        .toBeLessThan(0.1);
      await position(page, ".advantages-card:nth-child(2)", 0.96);
      await expect
        .poll(async () => (await offsets(page))[1])
        .toBeGreaterThan(23);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(async () => (await offsets(page)).every((y) => y === 0))
      .toBe(true);
    await expect(page.getByRole("switch", { name: "מצב מסיבה" })).toBeEnabled();
  });
}
