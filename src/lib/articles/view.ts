import type { Article } from "./schema.ts";

/** Drafts render in development, and on the preview route in every environment. */
export function canViewArticle(article: Article, preview: boolean) {
  if (preview || !article.draft) return true;
  return process.env.NODE_ENV === "development";
}
