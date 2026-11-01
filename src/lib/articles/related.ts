import type { Article } from "./schema.ts";

/** Same category first, then shared tags, then newer articles to fill the row. */
export function relatedArticles(current: Article, all: Article[], limit = 3) {
  const tags = new Set(current.tags);
  const ranked = all
    .filter((article) => !article.draft && article.slug !== current.slug)
    .map((article) => {
      const shared = article.tags.filter((tag) => tags.has(tag)).length;
      const score = (article.category === current.category ? 3 : 0) + shared;
      return { article, score };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.article.date.localeCompare(left.article.date) ||
        left.article.slug.localeCompare(right.article.slug),
    );
  const matched = ranked
    .filter((item) => item.score > 0)
    .map((item) => item.article);
  const rest = ranked
    .filter((item) => item.score === 0)
    .map((item) => item.article);
  return [...matched, ...rest].slice(0, limit);
}
