import type { Page } from "@playwright/test";

/** The editor's two tabs. */
export async function editorTab(page: Page, name: "details" | "case") {
  await page
    .getByRole("tab", {
      name: name === "details" ? /^פרטי הפרויקט/ : /^Case Study/,
    })
    .click();
}
/** Card settings, categories, slug and SEO live in a collapsed section. */
export async function openMoreSettings(page: Page) {
  await editorTab(page, "details");
  const more = page.locator("details", {
    has: page.locator("summary", { hasText: "הגדרות נוספות" }),
  });
  if (!(await more.evaluate((element) => (element as HTMLDetailsElement).open)))
    await more.locator("summary").first().click();
}
