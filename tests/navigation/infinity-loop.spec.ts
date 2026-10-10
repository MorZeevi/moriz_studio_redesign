import { expect, type Page, test } from "@playwright/test";

const position = (page: Page) =>
  page
    .locator("[data-infinity-loop] [role='slider']")
    .getAttribute("transform");

test("the red dot slides along the infinity sign and answers the keyboard", async ({
  page,
}) => {
  await page.goto("/he");
  const loop = page.locator("[data-infinity-loop]");
  const dot = loop.getByRole("slider", { name: "הזזת הנקודה על סמל האינסוף" });
  await loop.scrollIntoViewIfNeeded();
  await expect(loop.locator("path")).toHaveCount(1);
  const start = await position(page);
  await expect.poll(() => position(page)).not.toBe(start);
  await loop.screenshot({ path: test.info().outputPath("infinity-loop.png") });

  await dot.focus();
  const before = Number(await dot.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowRight");
  const nudged = Number(await dot.getAttribute("aria-valuenow"));
  // Two percent per press; the readout rounds, so allow one either side.
  const moved = (nudged - before + 100) % 100;
  expect(moved).toBeGreaterThanOrEqual(1);
  expect(moved).toBeLessThanOrEqual(3);
  // Held while focused: the loop waits for the visitor.
  await page.waitForTimeout(400);
  expect(Number(await dot.getAttribute("aria-valuenow"))).toBe(nudged);
});

test("reduced motion keeps the dot still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const loop = page.locator("[data-infinity-loop]");
  await loop.scrollIntoViewIfNeeded();
  await expect(loop.getByRole("slider")).toHaveAttribute("aria-valuenow", "13");
  const resting = await position(page);
  await page.waitForTimeout(600);
  expect(await position(page)).toBe(resting);
});

test("dragging follows the path, through the crossing, without jumping lobes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const loop = page.locator("[data-infinity-loop]");
  const dot = loop.getByRole("slider");
  await loop.scrollIntoViewIfNeeded();
  // Path coordinates (viewBox 0 0 200 100) to page pixels.
  const toPage = (x: number, y: number) =>
    loop.locator("svg").evaluate(
      (svg, [px, py]) => {
        const matrix = (svg as SVGSVGElement).getScreenCTM();
        const point = new DOMPoint(px, py).matrixTransform(matrix ?? undefined);
        return { x: point.x, y: point.y };
      },
      [x, y],
    );
  const box = await dot.locator("circle").last().boundingBox();
  if (!box) throw new Error("dot not rendered");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Around the right lobe to its far edge (a quarter lap)...
  for (const [x, y] of [
    [150, 26],
    [175, 32],
    [185, 50],
  ]) {
    const target = await toPage(x, y);
    await page.mouse.move(target.x, target.y, { steps: 4 });
  }
  const quarter = Number(await dot.getAttribute("aria-valuenow"));
  expect(Math.abs(quarter - 25)).toBeLessThanOrEqual(3);
  // ...then back down and through the centre into the left lobe's top.
  for (const [x, y] of [
    [160, 74],
    [125, 70],
    [100, 50],
    [75, 30],
    [45, 26],
  ]) {
    const target = await toPage(x, y);
    await page.mouse.move(target.x, target.y, { steps: 4 });
  }
  await page.mouse.up();
  const left = Number(await dot.getAttribute("aria-valuenow"));
  expect(left).toBeGreaterThan(50);
  expect(left).toBeLessThan(75);
});

test("on touch, the bead drags while a swipe over the sign still scrolls", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const loop = page.locator("[data-infinity-loop]");
  const dot = loop.getByRole("slider");
  await loop.scrollIntoViewIfNeeded();
  const client = await context.newCDPSession(page);
  const swipe = async (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...from, id: 1 }],
    });
    for (let step = 1; step <= 8; step++)
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: from.x + ((to.x - from.x) * step) / 8,
            y: from.y + ((to.y - from.y) * step) / 8,
            id: 1,
          },
        ],
      });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  };
  const toPage = (x: number, y: number) =>
    loop.locator("svg").evaluate(
      (svg, [px, py]) => {
        const matrix = (svg as SVGSVGElement).getScreenCTM();
        const point = new DOMPoint(px, py).matrixTransform(matrix ?? undefined);
        return { x: point.x, y: point.y };
      },
      [x, y],
    );

  const box = await dot.locator("circle").last().boundingBox();
  if (!box) throw new Error("dot not rendered");
  const scrolled = await page.evaluate(() => scrollY);
  await swipe(
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    await toPage(185, 50),
  );
  await expect
    .poll(async () => Number(await dot.getAttribute("aria-valuenow")))
    .toBeGreaterThan(21);
  expect(await page.evaluate(() => scrollY)).toBe(scrolled);

  const leftEdge = await toPage(15, 50);
  await swipe(leftEdge, { x: leftEdge.x, y: leftEdge.y - 200 });
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(scrolled + 50);
  await context.close();
});
