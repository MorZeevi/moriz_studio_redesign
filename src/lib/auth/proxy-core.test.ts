import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server.js";

import {
  ADMIN_PATH_HEADER,
  handleSessionRequest,
  isLeadAdminPage,
  type SessionRefresher,
} from "./proxy-core.ts";

const ORIGIN = "http://127.0.0.1:3000";
const FORWARDED = `x-middleware-request-${ADMIN_PATH_HEADER}`;

function request(path: string, init: { method?: string; headers?: HeadersInit } = {}) {
  // The Host header is what the browser sent; Next normalizes the URL itself.
  const headers = new Headers(init.headers);
  headers.set("host", "127.0.0.1:3000");
  return new NextRequest(`${ORIGIN}${path}`, { ...init, headers });
}

const signedOut: SessionRefresher = async () => false;
const signedIn: SessionRefresher = async () => true;
// An expired access token with a valid refresh token: the refresh rotates the
// auth cookies and the user is signed in.
const refreshing: SessionRefresher = async (cookies) => {
  cookies.getAll();
  cookies.setAll([
    { name: "sb-x-auth-token", value: "rotated", options: { path: "/" } },
  ]);
  return true;
};
// A dead session: the refresh clears the cookie and there are no claims.
const clearing: SessionRefresher = async (cookies) => {
  cookies.setAll([
    { name: "sb-x-auth-token", value: "", options: { path: "/", maxAge: 0 } },
  ]);
  return false;
};

test("isLeadAdminPage matches only the lead-admin page tree", () => {
  assert.equal(isLeadAdminPage("/digital-audit/admin"), true);
  assert.equal(isLeadAdminPage("/digital-audit/admin/leads/abc"), true);
  for (const path of [
    "/digital-audit/adminx",
    "/digital-audit/api/admin/lead-status",
    "/digital-audit",
    "/digital-audit/result",
    "/admin",
    "/admin/projects",
    "/media/p/f.webp",
  ])
    assert.equal(isLeadAdminPage(path), false, path);
});

test("signed-out lead-admin pages redirect to login with next, query preserved", async () => {
  const response = await handleSessionRequest(
    request("/digital-audit/admin?status=new&page=2"),
    signedOut,
  );
  assert.equal(response.status, 307);
  const location = new URL(response.headers.get("location") ?? "", ORIGIN);
  assert.equal(location.pathname, "/admin/login");
  assert.equal(
    location.searchParams.get("next"),
    "/digital-audit/admin?status=new&page=2",
  );
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  // Absolute, on the host the browser used (which holds its cookies).
  assert.match(
    response.headers.get("location") ?? "",
    /^http:\/\/127\.0\.0\.1:3000\/admin\/login\?/,
  );
});

test("lead detail redirects keep the session id and drop the RSC marker", async () => {
  const response = await handleSessionRequest(
    request("/digital-audit/admin/leads/11111111-2222-4333-8444-555555555555?_rsc=abc"),
    signedOut,
  );
  const location = new URL(response.headers.get("location") ?? "", ORIGIN);
  assert.equal(
    location.searchParams.get("next"),
    "/digital-audit/admin/leads/11111111-2222-4333-8444-555555555555",
  );
});

test("a redirect carries the cookies written during the refresh", async () => {
  const response = await handleSessionRequest(
    request("/digital-audit/admin"),
    clearing,
  );
  assert.equal(response.status, 307);
  const cleared = response.cookies.get("sb-x-auth-token");
  assert.ok(cleared, "the cleared auth cookie must reach the redirect");
  assert.equal(cleared.value, "");
});

test("signed-in lead-admin pages continue and carry the refreshed cookies", async () => {
  const response = await handleSessionRequest(
    request("/digital-audit/admin/leads/abc"),
    refreshing,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.cookies.get("sb-x-auth-token")?.value, "rotated");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("the refreshed cookies are forwarded to the render on the request", async () => {
  const req = request("/admin/projects", {
    headers: { cookie: "sb-x-auth-token=stale" },
  });
  const response = await handleSessionRequest(req, refreshing);
  const forwarded = response.headers.get(
    "x-middleware-request-cookie",
  );
  assert.match(forwarded ?? "", /sb-x-auth-token=rotated/);
});

test("x-admin-path is forwarded and overwrites a spoofed client header", async () => {
  const response = await handleSessionRequest(
    request("/admin/projects/abc?tab=case", {
      headers: { [ADMIN_PATH_HEADER]: "/digital-audit/admin?spoof=1" },
    }),
    signedIn,
  );
  assert.equal(
    response.headers.get(FORWARDED),
    "/admin/projects/abc?tab=case",
  );
});

test("x-admin-path survives the response rebuilt after a cookie refresh", async () => {
  const response = await handleSessionRequest(
    request("/digital-audit/admin?x=1", {
      headers: { [ADMIN_PATH_HEADER]: "/spoofed" },
    }),
    refreshing,
  );
  assert.equal(response.headers.get(FORWARDED), "/digital-audit/admin?x=1");
});

test("x-admin-path is overwritten on non-admin matched paths too", async () => {
  const response = await handleSessionRequest(
    request("/media/p/f.webp", { headers: { [ADMIN_PATH_HEADER]: "/spoofed" } }),
    signedOut,
  );
  assert.equal(response.headers.get(FORWARDED), "/media/p/f.webp");
});

test("CMS, media and API paths are never redirected, even when signed out", async () => {
  for (const path of [
    "/admin/projects",
    "/admin/categories",
    "/admin/os",
    "/admin/login",
    "/admin/auth/callback?code=x",
    "/media/p/f.webp",
    "/digital-audit/api/admin/lead-status",
  ]) {
    const response = await handleSessionRequest(request(path), signedOut);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("location"), null, path);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
});

test("lead-admin POSTs (server actions) are not redirected by the proxy", async () => {
  const response = await handleSessionRequest(
    request("/digital-audit/admin", { method: "POST" }),
    signedOut,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
});
