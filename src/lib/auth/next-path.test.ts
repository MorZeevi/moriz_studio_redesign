import assert from "node:assert/strict";
import { test } from "node:test";

import { adminDestination, adminLoginPath, safeAdminNext } from "./next-path.ts";

test("allows the CMS and lead admin pages and preserves the query string", () => {
  assert.equal(safeAdminNext("/admin"), "/admin");
  assert.equal(safeAdminNext("/admin/projects"), "/admin/projects");
  assert.equal(
    safeAdminNext("/admin/projects/abc-123?tab=case"),
    "/admin/projects/abc-123?tab=case",
  );
  assert.equal(safeAdminNext("/digital-audit/admin"), "/digital-audit/admin");
  assert.equal(
    safeAdminNext("/digital-audit/admin?status=new&page=2"),
    "/digital-audit/admin?status=new&page=2",
  );
  assert.equal(
    safeAdminNext(
      "/digital-audit/admin/leads/11111111-2222-4333-8444-555555555555",
    ),
    "/digital-audit/admin/leads/11111111-2222-4333-8444-555555555555",
  );
});

test("drops the fragment and keeps an encoded slash inside the query", () => {
  assert.equal(safeAdminNext("/admin/os#top"), "/admin/os");
  assert.equal(safeAdminNext("/admin/categories?q=a%2Fb"), "/admin/categories?q=a%2Fb");
});

test("enforces exact path boundaries", () => {
  for (const hostile of [
    "/adminx",
    "/admin-old",
    "/administrator",
    "/digital-audit/adminx",
    "/digital-audit/admin-old",
    "/digital-audit",
    "/digital-audit/result",
    "/digital-audit/api/admin/lead-status",
    "/",
    "/he",
    "/Admin/projects",
  ]) {
    assert.equal(safeAdminNext(hostile), null, hostile);
  }
});

test("rejects protocol-relative, backslash, scheme and absolute URLs", () => {
  for (const hostile of [
    "//evil.example/admin",
    "///evil.example/admin",
    "/\\evil.example/admin",
    "\\\\evil.example",
    "https://evil.example/admin",
    "http://localhost/admin",
    "javascript:alert(1)",
    "data:text/html,x",
    "admin/projects",
    "",
    "   ",
  ]) {
    assert.equal(safeAdminNext(hostile), null, hostile);
  }
});

test("rejects control characters, including ones URL parsing would strip", () => {
  for (const hostile of [
    "/admin\n/projects",
    "/admin/\tprojects",
    "/\t/evil.example",
    "/\r/evil.example",
    "/admin/projects\0",
    "/admin/projects\u007f",
    "/admin/%0d%0aSet-Cookie:x=1",
    "/admin/%09/evil",
    "/admin/%00",
  ]) {
    assert.equal(safeAdminNext(hostile), null, JSON.stringify(hostile));
  }
});

test("rejects encoded slash, dot and backslash tricks in the path", () => {
  for (const hostile of [
    "/admin/%2fevil",
    "/admin%2f..%2f..%2fevil",
    "/admin/%5cevil",
    "/admin/%2e%2e/%2e%2e/evil",
    "/admin/%2E%2E/x",
    "/admin/%252f",
    "/%2fevil.example",
  ]) {
    assert.equal(safeAdminNext(hostile), null, hostile);
  }
});

test("validates after normalization, so dot segments cannot escape the roots", () => {
  assert.equal(safeAdminNext("/admin/../etc/passwd"), null);
  assert.equal(safeAdminNext("/admin/../digital-audit/result"), null);
  assert.equal(safeAdminNext("/digital-audit/admin/../../etc"), null);
  assert.equal(safeAdminNext("/admin/./projects"), "/admin/projects");
  assert.equal(safeAdminNext("/admin/x/../projects"), "/admin/projects");
  assert.equal(
    safeAdminNext("/admin/../digital-audit/admin"),
    "/digital-audit/admin",
  );
});

test("never returns the login or auth callback as a destination", () => {
  for (const hostile of [
    "/admin/login",
    "/admin/login/",
    "/admin/login?next=/admin/projects",
    "/admin/auth",
    "/admin/auth/callback",
    "/admin/auth/callback?code=x",
    "/admin/x/../login",
  ]) {
    assert.equal(safeAdminNext(hostile), null, hostile);
  }
  // Only the exact segments are excluded.
  assert.equal(safeAdminNext("/admin/loginx"), "/admin/loginx");
  assert.equal(safeAdminNext("/admin/authors"), "/admin/authors");
});

test("rejects non-string and oversized values", () => {
  for (const hostile of [undefined, null, 5, {}, ["/admin"], true]) {
    assert.equal(safeAdminNext(hostile), null);
  }
  assert.equal(safeAdminNext(`/admin/${"a".repeat(3000)}`), null);
});

test("adminLoginPath carries only a safe next", () => {
  assert.equal(adminLoginPath(), "/admin/login");
  assert.equal(adminLoginPath("//evil.example"), "/admin/login");
  assert.equal(adminLoginPath("/admin/login"), "/admin/login");
  assert.equal(
    adminLoginPath("/digital-audit/admin?status=new"),
    "/admin/login?next=%2Fdigital-audit%2Fadmin%3Fstatus%3Dnew",
  );
  assert.equal(
    adminLoginPath("/admin/projects"),
    "/admin/login?next=%2Fadmin%2Fprojects",
  );
});

test("a hostile or missing next falls back to the CMS project list", () => {
  assert.equal(adminDestination(), "/admin/projects");
  assert.equal(adminDestination(undefined), "/admin/projects");
  assert.equal(adminDestination(["/admin/os"]), "/admin/projects");
  for (const hostile of [
    "//evil.example",
    "https://evil.example/admin",
    "/\\evil.example",
    "javascript:alert(1)",
    "/adminx",
    "/admin/login",
    "/admin/auth/callback",
    "/admin/%2e%2e/evil",
    "/digital-audit/result",
    "/admin%0a/x",
    "/admin\u000a/x",
  ])
    assert.equal(adminDestination(hostile), "/admin/projects", hostile);
  assert.equal(adminDestination("/admin/os"), "/admin/os");
  assert.equal(
    adminDestination("/digital-audit/admin?status=new"),
    "/digital-audit/admin?status=new",
  );
});
