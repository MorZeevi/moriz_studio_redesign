/** Routes that live outside `app/[locale]` and must not gain a locale prefix. */
const UNPREFIXED_PATHS = ["/digital-audit", "/admin", "/api", "/media"];

/**
 * Navigation links are homepage section anchors (#about, #faq…). On another
 * page, anchors that exist there stay in-page; the rest lead to the homepage.
 * `pageAnchors` undefined means "this is the homepage".
 * Locale pages such as `/articles` gain the locale prefix. `/digital-audit`
 * stays at the site root.
 */
export function anchorHref(
  href: string,
  locale: string,
  pageAnchors?: readonly string[],
) {
  if (href.startsWith("#")) {
    if (!pageAnchors || pageAnchors.includes(href)) return href;
    return `/${locale}${href}`;
  }
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (
    UNPREFIXED_PATHS.some(
      (path) => href === path || href.startsWith(`${path}/`),
    )
  ) {
    return href;
  }
  if (href === `/${locale}` || href.startsWith(`/${locale}/`)) return href;
  return `/${locale}${href}`;
}
