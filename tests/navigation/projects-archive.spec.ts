import { expect, test } from "@playwright/test";

// The dev-only fixture (?demo=1) adds cards with known types, a featured
// card and a card without a case study page.
const archive = "/he/projects?demo=1";
const cards = "#projects li[data-kind]";

test("filters change the grid in place and keep the URL shareable", async ({
  page,
}) => {
  await page.goto(archive);
  const filters = page.getByRole("group", {
    name: "סינון פרויקטים לפי סוג",
  });
  const all = filters.getByRole("button", { name: /^הכל/ });
  await expect(all).toHaveAttribute("aria-pressed", "true");
  const total = await page.locator(`${cards}[data-kind="project"]`).count();

  const automations = filters.getByRole("button", { name: /^אוטומציות/ });
  // A full page load would drop this marker.
  await page.evaluate(() => {
    (window as unknown as { stayed: boolean }).stayed = true;
  });
  await automations.click();

  await expect(automations).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/type=demo-automations/);
  expect(
    await page.evaluate(
      () => (window as unknown as { stayed?: boolean }).stayed,
    ),
  ).toBe(true);
  const filtered = page.locator(`${cards}[data-kind="project"]`);
  await expect(filtered).toHaveCount(2);
  expect(await filtered.count()).toBeLessThan(total);
  await expect(page.getByText("מוצגים 2 פרויקטים")).toBeAttached();

  // A deep link restores the same filter.
  await page.goto("/he/projects?demo=1&type=demo-automations");
  await expect(automations).toHaveAttribute("aria-pressed", "true");
  await expect(filtered).toHaveCount(2);
});

test("the contact card stays in the grid for every filter", async ({
  page,
}) => {
  await page.goto(archive);
  const filters = page.getByRole("group", {
    name: "סינון פרויקטים לפי סוג",
  });
  for (const button of await filters.getByRole("button").all()) {
    await button.click();
    const cta = page.locator(`${cards}[data-kind="cta"]`);
    await expect(cta).toHaveCount(1);
    await expect(cta.getByRole("link", { name: /בואו נדבר/ })).toHaveAttribute(
      "href",
      "#contact",
    );
  }
  await expect(page.locator("#contact")).toBeAttached();
  await expect(page.locator("footer #contact")).toHaveCount(0);
});

test("the chosen layout persists without changing after hydration", async ({
  page,
}) => {
  await page.goto(archive);
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-projects-layout", "editorial");

  await page.getByRole("radio", { name: "צפוף" }).check({ force: true });
  await expect(html).toHaveAttribute("data-projects-layout", "compact");

  // Record every attribute value from first parse onwards.
  await page.addInitScript(() => {
    const seen: (string | null)[] = [];
    (window as unknown as { layoutSeen: typeof seen }).layoutSeen = seen;
    // <html> doesn't exist yet when this runs, so watch the whole document.
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.target === document.documentElement) {
          seen.push(
            document.documentElement.getAttribute("data-projects-layout"),
          );
        }
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-projects-layout"],
    });
  });
  await page.reload();
  await expect(page.getByRole("radio", { name: "צפוף" })).toBeChecked();
  const seen = await page.evaluate(
    () => (window as unknown as { layoutSeen: string[] }).layoutSeen,
  );
  expect(new Set(seen)).toEqual(new Set(["compact"]));
});

test("keyboard focus reveals the same information as hover", async ({
  page,
}) => {
  await page.goto(archive);
  await page.getByRole("radio", { name: "רשת" }).check({ force: true });
  await page.getByRole("radio", { name: "רשת" }).focus();
  await page.keyboard.press("Tab");

  const card = page.locator(":focus");
  await expect(card).toHaveAttribute("href", /\/he\/projects\//);
  const reveal = card.locator("[id$='-info']");
  await expect
    .poll(() => reveal.evaluate((el) => getComputedStyle(el).clipPath))
    .toMatch(/^inset\(0(px)? /);
  const describedBy = await card.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
});

test("cards without a case study are not links", async ({ page }) => {
  await page.goto(archive);
  const unlinked = page.locator(`${cards} article`);
  await expect(unlinked.first()).toBeVisible();
  await expect(unlinked.locator("a")).toHaveCount(0);
});

test("touch screens show card information without hover", async ({
  browser,
  baseURL,
}) => {
  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await touch.newPage();
  await page.goto(`${baseURL}${archive}`);
  expect(
    await page.evaluate(
      () => matchMedia("(hover: hover) and (pointer: fine)").matches,
    ),
  ).toBe(false);
  const card = page.locator(`${cards}[data-kind="project"]`).first();
  const reveal = card.locator("[id$='-info']");
  await expect(reveal).toBeVisible();
  const layout = await card.evaluate((element) => {
    const info = element.querySelector("[id$='-info']") as HTMLElement;
    const caption = element.querySelector("h3")?.parentElement as HTMLElement;
    return {
      clip: getComputedStyle(info).clipPath,
      position: getComputedStyle(info).position,
      below:
        info.getBoundingClientRect().top >=
        caption.getBoundingClientRect().bottom - 1,
    };
  });
  expect(layout.clip).toBe("none");
  expect(layout.position).toBe("static");
  expect(layout.below).toBe(true);
  // One column, and no horizontal scrolling.
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await touch.close();
});

test("the homepage header, outline pills and media badge carry over", async ({
  page,
}) => {
  await page.goto(archive);
  // Section links that live on the homepage lead back to it; #projects and
  // #contact exist on this page.
  const nav = page.locator(".desktop-navigation");
  await expect(nav.getByRole("link", { name: "קצת עליי" })).toHaveAttribute(
    "href",
    "/he#about",
  );
  await expect(nav.getByRole("link", { name: "פרויקטים" })).toHaveAttribute(
    "href",
    "#projects",
  );

  // Pills are the design-system outline button, borderless and unfilled.
  const all = page
    .getByRole("group", { name: "סינון פרויקטים לפי סוג" })
    .getByRole("button", { name: /^הכל/ });
  await page.mouse.move(0, 0);
  await expect(all).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(all).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
  await expect(all).toHaveClass(/button--outline/);

  // The pointer badge from the homepage follows the mouse over card media.
  const card = page.locator(`${cards}[data-kind="project"] a`).first();
  const box = await card.locator("img, video").first().boundingBox();
  if (!box) throw new Error("Missing card media");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 3, box.y + box.height / 3);
  await expect(card).toHaveAttribute("data-pointer-inside", "");
  await expect(card.getByText("לצפיה בפרויקט")).toBeVisible();
});
