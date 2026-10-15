/**
 * Navigation links are homepage section anchors (#about, #faq…). On another
 * page, anchors that exist there stay in-page; the rest lead to the homepage.
 * `pageAnchors` undefined means "this is the homepage".
 */
export function anchorHref(
  href: string,
  locale: string,
  pageAnchors?: readonly string[],
) {
  if (!href.startsWith("#") || !pageAnchors || pageAnchors.includes(href)) {
    return href;
  }
  return `/${locale}${href}`;
}
