import { expect, test, type Page } from "@playwright/test";

async function position(page: Page, edge: "top" | "bottom", fraction: number) {
  await page.locator("#projects").evaluate(
    (section, target) => {
      const rect = section.getBoundingClientRect();
      scrollTo(0, scrollY + rect[target.edge] - innerHeight * target.fraction);
    },
    { edge, fraction },
  );
}

async function capture(page: Page, name: string) {
  if (process.env.LIQUID_REVIEW_CAPTURE)
    await page.screenshot({
      path: `.impeccable/review/project-backdrop/${name}.png`,
    });
}

for (const width of [1440, 390]) {
  test(`whole canvas changes smoothly with Projects at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/he");
    await page.evaluate(() => document.fonts.ready);
    const reveal = () =>
      page
        .locator("#projects")
        .evaluate((section) =>
          Number(
            (section as HTMLElement).style.getPropertyValue("--project-reveal"),
          ),
        );
    await expect.poll(reveal).toBe(0);
    await position(page, "top", 0.625);
    await expect.poll(reveal).toBeGreaterThan(0.1);
    await expect.poll(reveal).toBeCloseTo(0.5, 2);
    await capture(page, `${width}-entry`);
    const frames = await page.evaluate(async () => {
      const projects = document.querySelector<HTMLElement>("#projects");
      if (!projects) throw new Error("Missing Projects");
      scrollTo(
        0,
        scrollY + projects.getBoundingClientRect().top - innerHeight * 0.4,
      );
      const samples: {
        reveal: number;
        contrast: number;
        sameCanvas: boolean;
      }[] = [];
      const luminance = (color: string) => {
        const channels =
          color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number) ?? [];
        return channels.reduce((sum, channel, index) => {
          const c = channel / 255;
          return (
            sum +
            (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) *
              [0.2126, 0.7152, 0.0722][index]
          );
        }, 0);
      };
      for (let i = 0; i < 45; i++) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        const body = getComputedStyle(document.body);
        const text = getComputedStyle(projects);
        const [light, dark] = [
          luminance(text.color),
          luminance(body.backgroundColor),
        ].sort((a, b) => b - a);
        const header = document.querySelector(".site-header");
        samples.push({
          reveal: Number(projects.style.getPropertyValue("--project-reveal")),
          contrast: (light + 0.05) / (dark + 0.05),
          sameCanvas:
            !!header &&
            getComputedStyle(header).backgroundColor === body.backgroundColor &&
            text.backgroundColor === "rgba(0, 0, 0, 0)",
        });
      }
      return samples;
    });
    expect(
      frames.filter((frame) => frame.reveal > 0.51 && frame.reveal < 0.99)
        .length,
    ).toBeGreaterThan(5);
    expect(
      frames.every((frame) => frame.sameCanvas && frame.contrast >= 4.5),
    ).toBe(true);
    await expect.poll(reveal).toBe(1);
    await capture(page, `${width}-dark`);
    expect(
      await page
        .locator("body")
        .evaluate((body) => getComputedStyle(body).backgroundColor),
    ).toBe("rgb(38, 38, 38)");
    await position(page, "bottom", 0.375);
    await expect.poll(reveal).toBeCloseTo(0.5, 2);
    await capture(page, `${width}-exit`);
    await position(page, "bottom", 0.15);
    await expect.poll(reveal).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await position(page, "top", 0.4);
    await expect.poll(reveal).toBe(1);
    await page.locator("#projects a[href='/he/projects']").click();
    await expect(page).toHaveURL(/\/he\/projects$/);
    await expect(page.locator("body")).not.toHaveAttribute(
      "data-project-backdrop",
    );
    expect(
      await page
        .locator("body")
        .evaluate((body) =>
          body.style.getPropertyValue("--home-project-surface"),
        ),
    ).toBe("");
    expect(errors).toEqual([]);
  });
}

test("reduced motion and no JavaScript retain readable project navigation", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  await position(page, "top", 0.4);
  await expect
    .poll(() =>
      page
        .locator("body")
        .evaluate((body) => getComputedStyle(body).backgroundColor),
    )
    .toBe("rgb(38, 38, 38)");
  await capture(page, "reduced-dark");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("http://127.0.0.1:3000/he");
  expect(
    await staticPage
      .locator("body")
      .evaluate((body) => getComputedStyle(body).backgroundColor),
  ).toBe("rgb(251, 251, 255)");
  await staticPage.locator("#projects a[href='/he/projects']").click();
  await expect(staticPage).toHaveURL(/\/he\/projects$/);
  await context.close();
});
