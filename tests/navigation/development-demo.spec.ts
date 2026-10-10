import { expect, test } from "@playwright/test";

test("development sketch becomes a working interface and resets by keyboard", async ({
  page,
}) => {
  await page.goto("/he");
  const demo = page.locator("[data-development-demo]");
  const tasks = demo.getByRole("checkbox");
  const action = demo.getByRole("button");
  await expect(demo).toHaveAttribute("data-stage", "wireframe");
  await expect(tasks.first()).toBeDisabled();
  await demo.screenshot({ path: test.info().outputPath("development-wireframe.png") });
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(demo).toHaveAttribute("data-stage", "live");
  await expect(tasks.first()).toBeFocused();
  await expect(demo.getByRole("status")).toHaveText("0/2 הושלמו");
  await page.keyboard.press("Space");
  await expect(demo.getByRole("status")).toHaveText("1/2 הושלמו");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(demo.getByRole("status")).toHaveText("2/2 הושלמו");
  await page.keyboard.press("Tab");
  await expect(action).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(demo).toHaveAttribute("data-stage", "wireframe");
  await expect(tasks.first()).not.toBeChecked();
  await expect(tasks.last()).not.toBeChecked();
  await expect(tasks.first()).toBeDisabled();
  await expect(action).toBeFocused();
});

test("live interface keeps its theme colors during the project canvas transition", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/he");
  const demo = page.locator("[data-development-demo]");
  await demo.getByRole("button", { name: "להפוך למוצר" }).click();
  const app = demo.locator("fieldset");
  const colors = () => app.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.color, style.backgroundColor];
  });
  const before = await colors();
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator("body").evaluate((body) =>
    getComputedStyle(body).getPropertyValue("--home-project-foreground").trim(),
  )).not.toBe("");
  expect(await colors()).toEqual(before);
});

test("development demonstration fits responsive themes and reduced motion", async ({
  page,
}) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/he");
    const demo = page.locator("[data-development-demo]");
    await demo.getByRole("button", { name: "להפוך למוצר" }).click();
    await demo.getByRole("checkbox").first().check();
    await expect(demo.getByRole("status")).toHaveText("1/2 הושלמו");
    await expect(demo.locator("fieldset")).toHaveCSS("transition-duration", "0s");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await demo.scrollIntoViewIfNeeded();
      expect(
        await demo.evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).toBe(true);
      if (width === 390 || width === 1440) {
        await page.locator("#advantages").screenshot({
          path: test.info().outputPath(`services-${colorScheme}-${width}.png`),
        });
      }
    }
  }
});

test("without JavaScript the sketch remains visible with inactive controls", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/he`);
  const demo = page.locator("[data-development-demo]");
  await expect(demo).toBeVisible();
  await expect(demo.getByText("ממשק לדוגמה")).toBeVisible();
  await expect(demo.getByRole("button")).toBeDisabled();
  await expect(demo.getByRole("checkbox").first()).toBeDisabled();
  await context.close();
});
