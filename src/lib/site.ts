import {
  defaultLocale,
  type EnabledLocale,
  enabledLocales,
  localeConfig,
} from "@/i18n/config";

/** Canonical origin of the public site. Absolute SEO URLs are built from it. */
export const SITE_URL = "https://moriz.studio";

/** Only the production deployment may be indexed; previews stay hidden. */
export const isIndexable = process.env.VERCEL_ENV === "production";

/**
 * Social share image per locale. The Hebrew file carries Hebrew text; English
 * uses it until the owner supplies an English version. To switch, point `en`
 * at the new file (for example `/og-image-en.png`).
 */
export const ogImagePath: Record<EnabledLocale, string> = {
  he: "/og-image.png",
  en: "/og-image.png",
};

function ogImage(locale: EnabledLocale) {
  return {
    url: ogImagePath[locale],
    width: 1200,
    height: 630,
    alt: "Moriz Studio",
  };
}

/**
 * Open Graph fields every public page shares, for one locale. Metadata merges
 * shallowly, so a page that sets `openGraph` spreads this to keep them.
 */
export function openGraphFor(locale: EnabledLocale) {
  return {
    siteName: "Moriz Studio",
    locale: localeConfig[locale].ogLocale,
    alternateLocale: enabledLocales
      .filter((other) => other !== locale)
      .map((other) => localeConfig[other].ogLocale),
    type: "website" as const,
    images: [ogImage(locale)],
  };
}

/**
 * The Hebrew Open Graph fields. Kept for Hebrew-only pages (the articles);
 * pages that exist in both languages use `openGraphFor(locale)`.
 */
export const siteOpenGraph = {
  siteName: "Moriz Studio",
  locale: localeConfig[defaultLocale].ogLocale,
  type: "website" as const,
  images: [ogImage(defaultLocale)],
};
