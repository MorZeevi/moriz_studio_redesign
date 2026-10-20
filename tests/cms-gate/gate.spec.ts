import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { type GateFixture, gatePath } from "./setup";

function fixture(): GateFixture {
  return JSON.parse(readFileSync(gatePath, "utf8"));
}

// Everything here is read-only: nothing is saved, published, deleted,
// duplicated or dragged, and no editor field is filled.
test("private admin surfaces redirect anonymous visitors to login", async ({
  page,
}) => {
  for (const path of ["/admin/projects", "/admin/categories", "/admin/os"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
});

test("owner session reaches every CMS surface and the project editor", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addCookies(fixture().smoke.cookies);
  const page = await context.newPage();
  const nav = page.getByRole("navigation", { name: "ניהול" });
  const projectsHeading = page.getByRole("heading", {
    level: 1,
    name: "פרויקטים",
  });
  const osHeading = page.getByRole("heading", { level: 1, name: "Mor OS" });
  const anyHeading = page.getByRole("heading", { level: 1 }).first();

  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await expect(projectsHeading).toBeVisible();

  await page.goto("/admin/categories");
  await expect(page).toHaveURL(/\/admin\/categories/);
  await expect(anyHeading).toBeVisible();

  await page.goto("/admin/os");
  await expect(page).toHaveURL(/\/admin\/os$/);
  await expect(osHeading).toBeVisible();

  // Header navigation between surfaces.
  await nav.getByRole("link", { name: "פרויקטים", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await expect(projectsHeading).toBeVisible();
  await nav.getByRole("link", { name: "קטגוריות", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/categories/);
  await expect(anyHeading).toBeVisible();
  await nav.getByRole("link", { name: "Mor OS", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/os$/);
  await expect(osHeading).toBeVisible();

  // Open the first project's editor without editing anything.
  await page.goto("/admin/projects");
  const edit = page.getByRole("link", { name: "עריכה", exact: true }).first();
  await expect(
    edit,
    "the CMS needs at least one project for the editor check",
  ).toBeVisible();
  await edit.click();
  await expect(page).toHaveURL(/\/admin\/projects\/[^/]+$/);
  await expect(anyHeading).toBeVisible();
  const name = page.getByLabel("שם הפרויקט", { exact: true });
  await expect(name).toBeVisible();

  // The session survives a reload, and the login page forwards the owner.
  await page.reload();
  await expect(page).toHaveURL(/\/admin\/projects\/[^/]+$/);
  await expect(name).toBeVisible();
  await page.goto("/admin/login");
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await context.close();
});

// Uses the separately minted "logout" session, never the owner's real login.
// logout() signs out with scope "local" (asserted statically in
// src/lib/auth/logout-scope.test.ts, which must pass before this runs).
test("logout with a minted session lands on login and revokes that session", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addCookies(fixture().logout.cookies);
  const page = await context.newPage();
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await page.getByRole("button", { name: "יציאה", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await context.close();
});

test("the owner's other (smoke) session survives the logout above", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addCookies(fixture().smoke.cookies);
  const page = await context.newPage();
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "פרויקטים" }),
  ).toBeVisible();
  await context.close();
});
