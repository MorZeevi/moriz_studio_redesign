import { NextResponse } from "next/server.js";
import type { NextRequest } from "next/server.js";
import { adminLoginPath } from "./next-path.ts";

// The proxy's testable core. src/proxy.ts supplies the Supabase-backed session
// refresher; tests supply a fake one. Imports are relative with extensions so
// plain node can load this file.

export const ADMIN_PATH_HEADER = "x-admin-path";
const CACHE_CONTROL = "private, no-store";

export type ProxyCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};
export type ProxyCookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (values: ProxyCookie[]) => void;
};
/**
 * Refreshes the Supabase session (reporting any rotated cookies through
 * `setAll`) and resolves to whether claims are present.
 */
export type SessionRefresher = (cookies: ProxyCookieAdapter) => Promise<boolean>;

/** Lead-admin pages. Phase A's optimistic-redirect list; the CMS is excluded. */
export function isLeadAdminPage(pathname: string): boolean {
  return (
    pathname === "/digital-audit/admin" ||
    pathname.startsWith("/digital-audit/admin/")
  );
}

function pathWithSearch(request: NextRequest): string {
  const params = new URLSearchParams(request.nextUrl.search);
  params.delete("_rsc");
  const query = params.toString();
  return `${request.nextUrl.pathname}${query ? `?${query}` : ""}`;
}

/**
 * Refresh the auth session for a matched, non-root request.
 *
 * - `x-admin-path` is always overwritten on the forwarded request, so a client
 *   cannot spoof it. Every rebuilt NextResponse.next({ request }) forwards it.
 * - Only lead-admin pages (GET/HEAD) are optimistically redirected when there
 *   are no claims. `getClaims()` is an optimistic check; the pages and routes
 *   still verify with getUser(). The CMS, /media and every /api path are never
 *   redirected here.
 * - A redirect carries the cookies refreshed on the working response.
 */
export async function handleSessionRequest(
  request: NextRequest,
  refresh: SessionRefresher,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  request.headers.set(ADMIN_PATH_HEADER, pathWithSearch(request));

  let response = NextResponse.next({ request });
  const hasClaims = await refresh({
    getAll: () => request.cookies.getAll(),
    setAll(values) {
      for (const { name, value } of values) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of values)
        response.cookies.set(name, value, options);
    },
  });

  const isRead = request.method === "GET" || request.method === "HEAD";
  if (!hasClaims && isRead && isLeadAdminPage(pathname)) {
    // Built from the Host the browser used: Next normalizes request.url (for
    // example 127.0.0.1 becomes localhost), which would move the redirect to a
    // host that does not hold the session cookie. Next requires an absolute
    // Location, so a relative one is not an option.
    const host = request.headers.get("host") || request.nextUrl.host;
    const login = new URL(
      adminLoginPath(pathWithSearch(request)),
      `${request.nextUrl.protocol}//${host}`,
    );
    const redirect = NextResponse.redirect(login);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("Cache-Control", CACHE_CONTROL);
    return redirect;
  }

  response.headers.set("Cache-Control", CACHE_CONTROL);
  return response;
}
