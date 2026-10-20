// Pure (Request/Headers are globals) so plain node can test it.
// CSRF controls for cookie-authenticated JSON endpoints.

/**
 * The browser-supplied Origin must be present, not "null", and exactly equal
 * to this request's own origin: the scheme of request.url plus the Host the
 * browser actually addressed. A browser always sends the real Host, so a
 * cross-site page cannot make the two agree. Forwarded host headers
 * (X-Forwarded-*, Forwarded) are deliberately not trusted.
 *
 * request.url is not used for the host part because Next normalizes it (for
 * example 127.0.0.1 becomes localhost), which would reject every same-origin
 * request made at the repo's own dev host.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    const own = new URL(request.url);
    const host = request.headers.get("host");
    return origin === (host ? `${own.protocol}//${host}` : own.origin);
  } catch {
    return false;
  }
}

/**
 * The full request-level admin check, with the owner lookup injected so plain
 * node can test the ordering: the cheap CSRF checks run first, and the owner
 * lookup is never reached for a cross-origin or wrongly typed request.
 */
export async function checkAdminRequest(
  request: Request,
  { requireJson = false }: { requireJson?: boolean },
  isOwner: () => Promise<boolean>,
): Promise<boolean> {
  if (!isSameOriginRequest(request)) return false;
  if (requireJson && !hasJsonContentType(request)) return false;
  return isOwner();
}

/** The parsed media type (parameters dropped) is exactly application/json. */
export function hasJsonContentType(request: Request): boolean {
  const header = request.headers.get("content-type");
  if (!header) return false;
  return header.split(";", 1)[0].trim().toLowerCase() === "application/json";
}
