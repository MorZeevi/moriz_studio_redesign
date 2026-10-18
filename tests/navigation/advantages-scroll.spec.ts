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

  test(`advantages use appropriate scroll motion at ${width}px`, async ({
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
      const pills = page.locator(".falling-text-pill");
      const container = page.locator(".falling-text-container");
      await container.scrollIntoViewIfNeeded();
      await expect(container).toHaveAttribute(
        "data-falling-state",
        /falling|settled/,
      );
      await expect(pills.nth(1)).toHaveCSS(
        "background-color",
        "rgb(221, 220, 140)",
      );
      await page
        .locator(".advantages-card")
        .first()
        .screenshot({
          path: "test-results/refinements/restored-mobile-research.png",
        });
      for (const fraction of [0.96, 0.68, 0.4, 0.96]) {
        await position(page, ".advantages-card:nth-child(2)", fraction);
        expect((await offsets(page)).every((y) => y === 0)).toBe(true);
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(async () => (await offsets(page)).every((y) => y === 0))
      .toBe(true);
    await expect(page.getByRole("switch", { name: "מצב מסיבה" })).toBeEnabled();
  });
}
