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

// --- Proxy (M-A3): lead-admin coverage without any CMS redirect change ---

function storedExpiry(cookies: { name: string; value: string }[]) {
  const auth = cookies
    .filter((cookie) => /^sb-.+-auth-token(\.\d+)?$/.test(cookie.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((cookie) => cookie.value)
    .join("");
  if (!auth.startsWith("base64-")) return 0;
  return JSON.parse(
    Buffer.from(auth.slice("base64-".length), "base64url").toString("utf8"),
  ).expires_at as number;
}

test("signed-out lead admin redirects to login with next, on the same host", async ({
  page,
}) => {
  await page.goto("/digital-audit/admin?status=new");
  const url = new URL(page.url());
  expect(url.origin).toBe("http://127.0.0.1:4398");
  expect(url.pathname).toBe("/admin/login");
  expect(url.searchParams.get("next")).toBe("/digital-audit/admin?status=new");
  await page.goto("/digital-audit/admin/leads/11111111-2222-4333-8444-555555555555");
  expect(new URL(page.url()).searchParams.get("next")).toBe(
    "/digital-audit/admin/leads/11111111-2222-4333-8444-555555555555",
  );
});

test("lead admin APIs and the public diagnostic are never redirected", async ({
  request,
}) => {
  const status = await request.post("/digital-audit/api/admin/lead-status", {
    data: "{}",
    maxRedirects: 0,
  });
  expect(status.status()).toBe(404);
  // A plain GET: no browser, so the public funnel's scripts never run.
  const landing = await request.get("/digital-audit", { maxRedirects: 0 });
  expect(landing.status()).toBe(200);
});

test("CMS with an expired access token and a valid refresh token still loads", async ({
  browser,
}) => {
  const { cookies } = fixture().expiredCms;
  const context = await browser.newContext();
  await context.addCookies(cookies);
  expect(storedExpiry(cookies)).toBe(1);
  const page = await context.newPage();
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "פרויקטים" }),
  ).toBeVisible();
  // The proxy refreshed the session and the browser received the new cookies.
  expect(storedExpiry(await context.cookies())).toBeGreaterThan(
    Date.now() / 1000,
  );
  await context.close();
});

test("lead admin with an expired access token and a valid refresh token is not sent to login", async ({
  browser,
}) => {
  const { cookies } = fixture().expiredLeads;
  const context = await browser.newContext();
  await context.addCookies(cookies);
  const page = await context.newPage();
  await page.goto("/digital-audit/admin");
  expect(new URL(page.url()).pathname).toBe("/digital-audit/admin");
  expect(storedExpiry(await context.cookies())).toBeGreaterThan(
    Date.now() / 1000,
  );
  await context.close();
});

// --- Login `next` (M-A4) ---

test("signed-out login keeps the password screen and ignores hostile next values", async ({
  page,
}) => {
  for (const next of ["%2Fadmin%2Fos", "%2F%2Fevil.example", "https%3A%2F%2Fevil.example"]) {
    await page.goto(`/admin/login?next=${next}`);
    await expect(page).toHaveURL(/\/admin\/login\?next=/);
    await expect(page.getByLabel("סיסמה", { exact: true })).toBeVisible();
  }
});

test("signed-in owner is forwarded to a safe next and to projects otherwise", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addCookies(fixture().smoke.cookies);
  const page = await context.newPage();
  await page.goto("/admin/login?next=%2Fadmin%2Fos");
  await expect(page).toHaveURL(/\/admin\/os$/);
  await page.goto("/admin/login?next=%2Fadmin%2Fcategories%3Fkind%3Dtype");
  await expect(page).toHaveURL(/\/admin\/categories\?kind=type$/);
  for (const next of [
    "%2F%2Fevil.example",
    "https%3A%2F%2Fevil.example",
    "%2Fadminx",
    "%2Fadmin%2Flogin",
  ]) {
    await page.goto(`/admin/login?next=${next}`);
    await expect(page).toHaveURL(/\/admin\/projects$/);
  }
  await context.close();
});

// --- Lead admin on the CMS session (M-A5 to M-A7): reads and no-write probes only ---

const ORIGIN = "http://127.0.0.1:4398";
const API = ["lead-status", "lead-brief", "session-classification"] as const;

test("owner session opens the lead queue and lead pages without a second login", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addCookies(fixture().smoke.cookies);
  const page = await context.newPage();
  await page.goto("/digital-audit/admin");
  await expect(page).toHaveURL(/\/digital-audit\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("לידים");
  await page.reload();
  await expect(page).toHaveURL(/\/digital-audit\/admin$/);
  await page.goto("/digital-audit/admin?view=test");
  await expect(page).toHaveURL(/view=test/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("בדיקה");
  // A retired ?secret= link is ignored; a session is all that matters.
  await page.goto("/digital-audit/admin?secret=anything");
  await expect(page).toHaveURL(/\/digital-audit\/admin/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("לידים");
  // An unknown lead is a 404, not a login redirect.
  const missing = await page.goto(
    "/digital-audit/admin/leads/99999999-9999-4999-8999-999999999999",
  );
  expect(missing?.status()).toBe(404);
  // The CMS session still works afterwards.
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await context.close();
});

test("lead admin APIs accept the owner only on a same-origin JSON request", async ({
  browser,
  playwright,
}) => {
  const owner = await browser.newContext();
  await owner.addCookies(fixture().smoke.cookies);
  const anonymous = await playwright.request.newContext({ baseURL: ORIGIN });
  const json = { origin: ORIGIN, "content-type": "application/json" };

  for (const name of API) {
    const url = `/digital-audit/api/admin/${name}`;
    // Authorized, but the empty body is rejected by validation: no write.
    const ok = await owner.request.post(url, { headers: json, data: "{}" });
    expect(ok.status(), `${name} owner`).toBe(400);
    for (const [label, headers] of [
      ["no Origin", { "content-type": "application/json" }],
      ["cross-origin", { ...json, origin: "https://evil.example" }],
      ["null Origin", { ...json, origin: "null" }],
      ["text/plain", { origin: ORIGIN, "content-type": "text/plain" }],
    ] as const) {
      const response = await owner.request.post(url, { headers, data: "{}" });
      expect(response.status(), `${name} ${label}`).toBe(404);
    }
    const signedOut = await anonymous.post(url, { headers: json, data: "{}" });
    expect(signedOut.status(), `${name} anonymous`).toBe(404);
    const legacy = await anonymous.post(url, {
      headers: { ...json, "x-admin-secret": "anything" },
      data: "{}",
    });
    expect(legacy.status(), `${name} retired secret header`).toBe(404);
  }
  await anonymous.dispose();
  await owner.close();
});
