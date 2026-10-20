// Pure (no framework imports) so plain node can test it.
//
// `next` is an untrusted, user-controlled destination for the admin login. It
// may only ever name a page of the two admin surfaces on this same origin.

const MAX_LENGTH = 2048;
const ADMIN_ROOTS = ["/admin", "/digital-audit/admin"] as const;
// Never a destination: they would loop back into the login flow.
const EXCLUDED = ["/admin/login", "/admin/auth"] as const;
// Encoded "%", ".", "/", "\\" and control characters in the path part. A
// normalizer must not be able to turn these into something else.
const ENCODED_TRICKS = /%(?:25|2e|2f|5c|[01][0-9a-f]|7f)/i;

function within(path: string, root: string) {
  return path === root || path.startsWith(`${root}/`);
}

function hasControlCharacter(value: string) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

/**
 * Returns a same-origin admin path (pathname plus query string, no fragment)
 * or null. `/admin` and `/admin/...` (never `/adminx`), and `/digital-audit/admin`
 * and `/digital-audit/admin/...` are the only allowed destinations.
 */
export function safeAdminNext(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_LENGTH)
    return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.includes("\\") || hasControlCharacter(raw)) return null;
  const rawPath = raw.split(/[?#]/, 1)[0];
  if (ENCODED_TRICKS.test(rawPath)) return null;

  let url: URL;
  try {
    url = new URL(raw, "http://x");
  } catch {
    return null;
  }
  if (url.origin !== "http://x") return null;

  const path = url.pathname;
  if (!ADMIN_ROOTS.some((root) => within(path, root))) return null;
  if (EXCLUDED.some((root) => within(path, root))) return null;
  return `${path}${url.search}`;
}

/** The admin login URL, carrying `next` only when it is a safe destination. */
export function adminLoginPath(next?: unknown): string {
  const safe = safeAdminNext(next);
  return safe
    ? `/admin/login?next=${encodeURIComponent(safe)}`
    : "/admin/login";
}

export const DEFAULT_ADMIN_DESTINATION = "/admin/projects";

/** Where a successful login goes: a safe `next`, else the CMS project list. */
export function adminDestination(next?: unknown): string {
  return safeAdminNext(next) ?? DEFAULT_ADMIN_DESTINATION;
}
