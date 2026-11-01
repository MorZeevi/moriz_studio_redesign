const SHORT_LABEL = 40;
export const META_DESCRIPTION_MAX = 160;

/**
 * Canonical URL plus Hebrew and x-default alternates. English is configured
 * in the locale list but not enabled, so it is not advertised. x-default
 * points at the Hebrew URL: it is the only version of the page.
 */
export function pageAlternates(path: string) {
  return {
    canonical: path,
    languages: { he: path, "x-default": path },
  };
}

/** Collapse whitespace and cut on a word boundary once the snippet is too long. */
export function clipMetaDescription(text: string, max = META_DESCRIPTION_MAX) {
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

/** Aim for a snippet in this range when stored prose is long enough. */
const SNIPPET_MIN = 140;

export type ProjectSnippetFields = {
  /** CMS SEO description. Returned untouched, even when short or long. */
  seo?: string | null;
  headline?: string | null;
  short?: string | null;
  body?: string | null;
  archive?: string | null;
  audience?: string | null;
  /** Further stored prose: text blocks, subsections, highlight notes. */
  passages?: Array<string | null | undefined>;
  /**
   * Facts already shown on the page (role, project type, categories, client,
   * year, user count). Used only to fill a snippet that is still under
   * 140 characters. Nothing is written that was not passed in.
   */
  facts?: Array<string | null | undefined>;
};

function covers(text: string, part: string) {
  return clean(text).includes(clean(part));
}

function appendPiece(text: string, part: string) {
  if (!text) return part;
  return /[.!?…]$/.test(text) ? `${text} ${part}` : `${text}. ${part}`;
}

/**
 * Add stored pieces until the snippet sits in the 140–160 window. A piece
 * that does not fit whole is skipped, unless `clip` is set and the snippet
 * is still short: then the combination is cut on a word boundary.
 */
function fold(text: string, parts: string[], clip: boolean) {
  let current = text;
  for (const part of parts) {
    if (current.length >= SNIPPET_MIN) return current;
    if (!part || (current && covers(current, part))) continue;
    if (current && covers(part, current)) {
      current =
        part.length <= META_DESCRIPTION_MAX ? part : clipMetaDescription(part);
      continue;
    }
    const next = appendPiece(current, part);
    if (next.length <= META_DESCRIPTION_MAX) {
      current = next;
      continue;
    }
    if (!clip) continue;
    return clipMetaDescription(next);
  }
  return current;
}

/**
 * Search snippet for a project. The CMS `seo` field wins untouched. Otherwise
 * the snippet is assembled from prose already stored on the project, then
 * from on-page facts if that prose is still under 140 characters. No sentence
 * is invented. The result is at most 160 characters unless the CMS field
 * itself is longer.
 */
export function projectSearchDescription(
  fields: ProjectSnippetFields,
): string | undefined {
  const seo = clean(fields.seo);
  if (seo) return seo;
  const prose = [
    fields.headline,
    fields.short,
    fields.body,
    fields.archive,
    fields.audience,
    ...(fields.passages ?? []),
  ]
    .map((value) => clean(value))
    .filter(Boolean);
  const substantial = prose.filter((part) => part.length >= SHORT_LABEL);
  const briefs = prose.filter((part) => part.length < SHORT_LABEL);
  const facts = (fields.facts ?? [])
    .map((value) => clean(value))
    .filter((part) => part.length >= 2);
  let text = substantial.length
    ? fold("", substantial, true)
    : fold("", briefs, true);
  // A one- or two-word label ("אפליקציית Web", "One Pager") is not appended
  // once a real description is already in the snippet. A longer stored line
  // still is.
  if (substantial.length && text.length < SNIPPET_MIN)
    text = fold(
      text,
      briefs.filter((part) => part.length >= 20),
      false,
    );
  if (text.length < SNIPPET_MIN) text = fold(text, facts, false);
  return text || undefined;
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
