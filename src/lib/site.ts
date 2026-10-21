/** Canonical origin of the public site. Absolute SEO URLs are built from it. */
export const SITE_URL = "https://moriz.studio";

/** Only the production deployment may be indexed; previews stay hidden. */
export const isIndexable = process.env.VERCEL_ENV === "production";

/**
 * Open Graph fields every public page shares. Metadata merges shallowly, so a
 * page that sets `openGraph` spreads this to keep them.
 */
export const siteOpenGraph = {
  siteName: "Moriz Studio",
  locale: "he_IL",
  type: "website" as const,
  images: [
    { url: "/og-image.png", width: 1200, height: 630, alt: "Moriz Studio" },
  ],
};
