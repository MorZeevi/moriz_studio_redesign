import { expect, test } from "@playwright/test";
import { fixture } from "./support";

// (g) logout with a separately minted session, (h) opt-in password login.

test("(g) logout ends only that session on both surfaces; the other owner session survives", async ({
  browser,
}) => {
  const out = await browser.newContext();
  await out.addCookies(fixture().logout.cookies);
  const page = await out.newPage();
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await page.getByRole("button", { name: "יציאה", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/digital-audit/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await out.close();

  // Local scope: the main session is still valid on both surfaces.
  const main = await browser.newContext();
  await main.addCookies(fixture().main.cookies);
  const other = await main.newPage();
  await other.goto("/admin/projects");
  await expect(other).toHaveURL(/\/admin\/projects$/);
  await other.goto("/digital-audit/admin");
  await expect(other).toHaveURL(/\/digital-audit\/admin$/);
  await main.close();
});

test("(h) password login returns to the lead admin through next", async ({
  page,
}) => {
  const password = process.env.CMS_TEST_ADMIN_PASSWORD;
  test.skip(!password, "set CMS_TEST_ADMIN_PASSWORD to exercise the real owner login");
  await page.goto("/admin/login?next=%2Fdigital-audit%2Fadmin");
  await page.getByLabel("סיסמה", { exact: true }).fill(password ?? "");
  await page.getByRole("button", { name: "כניסה לניהול", exact: true }).click();
  await expect(page).toHaveURL(/\/digital-audit\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("לידים");
  // Clean up through the UI; logout is local-scope, so other devices survive.
  await page.goto("/admin/projects");
  await page.getByRole("button", { name: "יציאה", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
