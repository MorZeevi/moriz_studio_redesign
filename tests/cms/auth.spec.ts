import { expect, test } from "@playwright/test";

test("private admin routes require a password and reject an incorrect password", async ({
  page,
}) => {
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  const password = page.getByLabel("סיסמה", { exact: true });
  await expect(password).toHaveAttribute("type", "password");
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await password.fill("incorrect-password");
  await page.getByRole("button", { name: "כניסה לניהול", exact: true }).click();
  await expect(page.locator("#login-error")).toContainText("הסיסמה שגויה");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await password.fill("another-incorrect-password");
  await expect(page.locator("#login-error")).toHaveCount(0);
  await page.goto("/admin/projects/new");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("old email callbacks return to the password screen without a session", async ({
  page,
}) => {
  await page.goto("/admin/auth/callback?code=retired-email-code");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByLabel("סיסמה", { exact: true })).toBeVisible();
  await page.goto("/admin/categories");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("owner password creates a persistent admin session and logout removes access", async ({
  page,
}) => {
  const password = process.env.CMS_TEST_ADMIN_PASSWORD;
  test.skip(!password, "Set CMS_TEST_ADMIN_PASSWORD to verify the owner's login.");
  await page.goto("/admin/login");
  await page.getByLabel("סיסמה", { exact: true }).fill(password ?? "");
  await page.getByRole("button", { name: "כניסה לניהול", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await page.reload();
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await page.goto("/admin/login");
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await page.getByRole("button", { name: "יציאה", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
