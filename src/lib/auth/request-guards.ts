// Pure (Request/Headers are globals) so plain node can test it.
// CSRF controls for cookie-authenticated JSON endpoints.

/**
 * The browser-supplied Origin must be present, not "null", and exactly equal
 * to this request's own origin. Forwarded host headers are deliberately not
 * trusted.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/** The parsed media type (parameters dropped) is exactly application/json. */
export function hasJsonContentType(request: Request): boolean {
  const header = request.headers.get("content-type");
  if (!header) return false;
  return header.split(";", 1)[0].trim().toLowerCase() === "application/json";
}
