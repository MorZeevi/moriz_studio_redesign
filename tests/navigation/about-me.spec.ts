import { expect, type Page, test } from "@playwright/test";

// The owner's bold phrases, verbatim (see docs/03-content.md#about).
const bold = [
  "חווית המשתמש הנוכחית עושה להם עוול וההשקעה יורדת לטמיון.",
  "תואר אקדמי בטכנולוגיות למידה מ-H.I.T וניסיון של שנים בפיתוח",
  "מבוססת פרקטיקות מחקריות ומתודולוגיות מעולם שימור הקשב.",
  "בסוף התהליך, הלקוחות שלי מצוידים בכלים דיגיטליים שעוזרים לקהל שלהם לעשות יותר עם פחות מאמץ, ומשיגים את המטרות העסקיות שלהם.",
];

const inkLevels = (page: Page) =>
  page
    .locator("[data-about-ink]")
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        Number(getComputedStyle(node).getPropertyValue("--ink")),
      ),
    );

test("the bio keeps the owner's bold phrases and the portrait", async ({
  page,
}) => {
  await page.goto("/he");
  const about = page.locator("[data-about-me]");
  await expect(about.locator("[data-about-paragraph]")).toHaveCount(3);
  await expect(about.locator("strong")).toHaveText(bold);
  await expect(about.getByRole("img", { name: "מור" })).toBeVisible();
});

test("phrases are marked as the visitor reads, and stay marked", async ({
  page,
}) => {
  await page.goto("/he");
  const about = page.locator("[data-about-me]");
  // Above the section nothing is marked yet.
  await expect.poll(async () => Math.max(...(await inkLevels(page)))).toBe(0);

  await about.locator("[data-about-paragraph]").last().scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 400);
  await expect.poll(async () => Math.min(...(await inkLevels(page)))).toBe(1);
  await expect(
    about.locator("[data-about-paragraph][data-active]"),
  ).toHaveCount(1);
  await about.screenshot({ path: test.info().outputPath("about-desktop.png") });

  // Scrolling back up never un-draws a phrase.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  expect(Math.min(...(await inkLevels(page)))).toBe(1);
});

test("reduced motion shows every phrase marked and nothing dimmed", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/he");
  const about = page.locator("[data-about-me]");
  await about.scrollIntoViewIfNeeded();
  expect(await inkLevels(page)).toEqual([1, 1, 1, 1]);
  await expect(about).not.toHaveAttribute("data-reading");
});

test("mobile stacks the portrait above the bio", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/he");
  const about = page.locator("[data-about-me]");
  await about.scrollIntoViewIfNeeded();
  const portrait = await about.locator("figure").boundingBox();
  const text = await about
    .locator("[data-about-paragraph]")
    .first()
    .boundingBox();
  expect(portrait && text && portrait.y < text.y).toBe(true);
  await about.screenshot({
    path: test.info().outputPath("about-mobile-dark.png"),
  });
});
