export const locales = ["he", "en"] as const;
export type Locale = (typeof locales)[number];

// Hebrew lives at /he, English at /en. `/` redirects to Hebrew (src/proxy.ts).
export const enabledLocales = ["he", "en"] as const satisfies readonly Locale[];
export type EnabledLocale = (typeof enabledLocales)[number];
export const defaultLocale = "he" satisfies Locale;

type LocaleSettings = {
  direction: "rtl" | "ltr";
  /** Open Graph locale. */
  ogLocale: string;
  /** BCP 47 tag for `inLanguage` and similar fields. */
  languageTag: string;
  /** Links and the homepage banner for the Hebrew-only /digital-audit. */
  diagnostic: boolean;
  /** The articles section (index, posts, preview, RSS). Hebrew-only content. */
  articles: boolean;
};

// The diagnostic and the articles exist in Hebrew only, so the English site
// hides every route, link and teaser to them (owner decision, 2026-11-18).
export const localeConfig = {
  he: {
    direction: "rtl",
    ogLocale: "he_IL",
    languageTag: "he-IL",
    diagnostic: true,
    articles: true,
  },
  en: {
    direction: "ltr",
    ogLocale: "en_US",
    languageTag: "en",
    diagnostic: false,
    articles: false,
  },
} as const satisfies Record<Locale, LocaleSettings>;

export function isEnabledLocale(value: string): value is EnabledLocale {
  return enabledLocales.some((locale) => locale === value);
}

/** The articles section exists for this locale. */
export function hasArticles(locale: string): locale is EnabledLocale {
  return isEnabledLocale(locale) && localeConfig[locale].articles;
}

/** The diagnostic (banner and links) is offered on this locale's site. */
export function hasDiagnostic(locale: string): locale is EnabledLocale {
  return isEnabledLocale(locale) && localeConfig[locale].diagnostic;
}

function startsWithPath(href: string, path: string) {
  return (
    href === path ||
    href.startsWith(`${path}/`) ||
    href.startsWith(`${path}?`) ||
    href.startsWith(`${path}#`)
  );
}

/**
 * False for a link to a section this locale hides (the diagnostic or the
 * articles). Takes dictionary hrefs (`/articles`, `/digital-audit`) and
 * locale-prefixed paths (`/en/articles/...`).
 */
export function isLinkAvailable(href: string, locale: EnabledLocale) {
  const settings = localeConfig[locale];
  const path = href.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";
  if (!settings.diagnostic && startsWithPath(path, "/digital-audit"))
    return false;
  if (!settings.articles && startsWithPath(path, "/articles")) return false;
  return true;
}

/** Drop links to sections this locale hides. */
export function availableLinks<T extends { href: string }>(
  links: readonly T[],
  locale: EnabledLocale,
): T[] {
  return links.filter((link) => isLinkAvailable(link.href, locale));
}
