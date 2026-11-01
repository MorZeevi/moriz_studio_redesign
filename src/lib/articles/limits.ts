/** Hard limits enforced by the article validator. The authoring spec repeats them. */
export const ARTICLE_LIMITS = {
  slug: { min: 3, max: 80 },
  title: { min: 8, max: 100 },
  description: { min: 50, max: 160 },
  category: { min: 2, max: 40 },
  tag: { min: 2, max: 40 },
  tags: { max: 8 },
  coverAlt: { min: 4, max: 160 },
  focusKeyword: { min: 2, max: 50 },
  sourceTitle: { min: 2, max: 160 },
  sources: { max: 10 },
  faqQuestion: { min: 8, max: 160 },
  faqAnswer: { min: 20, max: 600 },
  faq: { max: 8 },
  tldrItem: { min: 12, max: 180 },
  tldr: { max: 5 },
  ctaTitle: { min: 4, max: 80 },
  ctaText: { min: 20, max: 280 },
  ctaLabel: { min: 2, max: 40 },
  heading: { max: 120 },
  body: { min: 200, max: 100_000 },
  wordsPerMinute: 200,
  coverWidth: 1200,
  coverHeight: 630,
  coverMaxBytes: 500_000,
  imageMaxBytes: 2_000_000,
  imageMaxEdge: 4000,
} as const;

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "feed",
  "index",
  "preview",
  "rss",
]);

export const CALLOUT_TYPES = ["note", "tip", "warning"] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];
