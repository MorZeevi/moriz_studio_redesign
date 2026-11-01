import { getAllArticles } from "./load.ts";

/**
 * The import path up to the slug must stay a static string so the bundler
 * compiles every article, including drafts, during `next build`.
 */
export async function importArticle(slug: string) {
  return import(`../../../content/articles/${slug}.mdx`);
}

export async function assertArticlesCompile() {
  const articles = getAllArticles();
  await Promise.all(articles.map((article) => importArticle(article.slug)));
}
