const SHORT_LABEL = 40;
export const META_DESCRIPTION_MAX = 160;

/**
 * Canonical URL plus a Hebrew alternate. English is configured in the locale
 * list but not enabled, so it is not advertised.
 */
export function pageAlternates(path: string) {
  return {
    canonical: path,
    languages: { "he-IL": path },
  };
}

/** Collapse whitespace and cut on a word boundary once the snippet is too long. */
export function clipMetaDescription(
  text: string,
  max = META_DESCRIPTION_MAX,
) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const cut = slice.lastIndexOf(" ");
  const trimmed = (cut >= 80 ? slice.slice(0, cut) : slice)
    .replace(/[.,;:–—-]+$/u, "")
    .trim();
  return `${trimmed}…`;
}

function clean(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

/**
 * Search snippet for a project. The CMS `seo` field wins untouched. A short
 * label such as "One Pager" is a weak snippet when a longer description is
 * already stored, so that description is used. No text is invented.
 */
export function projectSearchDescription(fields: {
  seo?: string | null;
  short?: string | null;
  body?: string | null;
}): string | undefined {
  const seo = clean(fields.seo);
  if (seo) return seo;
  const short = clean(fields.short);
  const body = clean(fields.body);
  const chosen =
    body && short.length < SHORT_LABEL && body.length > short.length
      ? body
      : short || body;
  return chosen ? clipMetaDescription(chosen) : undefined;
}

export type SitemapProject = { slug: string; updatedAt: string };
export type SitemapArticle = { slug: string; updatedAt: Date };

export type PublicSitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
};

function latest(dates: Array<string | Date | undefined>) {
  let max = Number.NEGATIVE_INFINITY;
  for (const value of dates) {
    if (!value) continue;
    const time = value instanceof Date ? value.getTime() : Date.parse(value);
    if (Number.isFinite(time) && time > max) max = time;
  }
  return Number.isFinite(max) ? new Date(max) : undefined;
}

/**
 * Indexable public URLs. Callers pass published articles only. Hebrew slugs
 * are encoded once, for the path segment.
 */
export function publicSitemapEntries({
  siteUrl,
  locale,
  projects,
  articles,
  privacyUpdatedOn,
}: {
  siteUrl: string;
  locale: string;
  projects: SitemapProject[];
  articles: SitemapArticle[];
  privacyUpdatedOn?: string;
}): PublicSitemapEntry[] {
  const base = `${siteUrl}/${locale}`;
  const listingUpdated = latest(projects.map((project) => project.updatedAt));
  const newestArticle = latest(articles.map((article) => article.updatedAt));
  const privacyUpdated = privacyUpdatedOn
    ? latest([`${privacyUpdatedOn}T12:00:00.000Z`])
    : undefined;
  const entries: PublicSitemapEntry[] = [
    {
      url: base,
      ...(listingUpdated ? { lastModified: listingUpdated } : {}),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/projects`,
      ...(listingUpdated ? { lastModified: listingUpdated } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/articles`,
      ...(newestArticle ? { lastModified: newestArticle } : {}),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/privacy-policy`,
      ...(privacyUpdated ? { lastModified: privacyUpdated } : {}),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
  for (const project of projects) {
    const updated = latest([project.updatedAt]);
    entries.push({
      url: `${base}/projects/${encodeURIComponent(project.slug)}`,
      ...(updated ? { lastModified: updated } : {}),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  for (const article of articles) {
    entries.push({
      url: `${base}/articles/${encodeURIComponent(article.slug)}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  return entries;
}
