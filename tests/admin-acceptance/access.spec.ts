import { expect, test } from "@playwright/test";
import { ADMIN_API, ORIGIN, fixture, postJson } from "./support";

// (a) signed out, (b) owner, (f) outsider.

test("(a) signed out: lead admin redirects with next, CMS to login, API POST is 404", async ({
  playwright,
}) => {
  const anonymous = await playwright.request.newContext({ baseURL: ORIGIN });

  const leads = await anonymous.get("/digital-audit/admin", { maxRedirects: 0 });
  expect(leads.status()).toBe(307);
  expect(leads.headers().location ?? "").toContain(
    "/admin/login?next=%2Fdigital-audit%2Fadmin",
  );

  const cms = await anonymous.get("/admin/projects", { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(cms.status());
  expect(cms.headers().location ?? "").toContain("/admin/login");

  const api = await postJson(anonymous, `${ADMIN_API}/lead-status`, {});
  expect(api.status()).toBe(404);
  await anonymous.dispose();
});

test("(b) owner: one session opens the CMS and the lead admin, with no Eyal/All source links", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addCookies(fixture().main.cookies);
  const page = await context.newPage();

  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "פרויקטים" }),
  ).toBeVisible();

  await page.goto("/digital-audit/admin");
  await expect(page).toHaveURL(/\/digital-audit\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("לידים");

  // The rendered links, not the HTML: the RSC payload echoes the request URL.
  const hrefs = await page
    .locator("a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  for (const href of hrefs) {
    expect(href, href).not.toMatch(/source=(eyal|all)/);
    expect(href, href).not.toMatch(/secret=/);
  }

  // A retired ?secret= and an Eyal source request change nothing.
  await page.goto("/digital-audit/admin?secret=x&source=eyal");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("לידים");
  const afterHrefs = await page
    .locator("a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  for (const href of afterHrefs) expect(href, href).not.toMatch(/source=(eyal|all)|secret=/);
  await context.close();
});

test("(f) outsider: both surfaces land on login and the admin API is 404", async ({
  browser,
}) => {
  const { outsider } = fixture();
  test.skip(
    !outsider,
    "set ADMIN_ACCEPTANCE_OUTSIDER_USER_ID to an existing non-owner Auth user to run this",
  );
  const context = await browser.newContext();
  await context.addCookies(outsider?.cookies ?? []);
  const page = await context.newPage();

  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/digital-audit/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  for (const name of ["lead-status", "lead-brief", "session-classification"]) {
    const response = await postJson(context.request, `${ADMIN_API}/${name}`, {});
    expect(response.status(), name).toBe(404);
  }
  const testSession = await postJson(context.request, `${ADMIN_API}/test-session`, {});
  expect(testSession.status()).toBe(404);
  await context.close();
});
