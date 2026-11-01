import fs from "node:fs";
import path from "node:path";
import {
  type Article,
  ArticleCollectionError,
  ArticleValidationError,
  validateArticleSource,
} from "./schema.ts";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

let cache: { key: string; articles: Article[] } | null = null;

export function getAllArticles(): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) {
    throw new Error(
      "Missing content/articles. Each article is content/articles/<slug>.mdx.",
    );
  }
  const names = fs.readdirSync(ARTICLES_DIR).sort();
  const key = names
    .map((name) => {
      const stat = fs.statSync(path.join(ARTICLES_DIR, name));
      return `${name}:${stat.mtimeMs}:${stat.size}`;
    })
    .join("|");
  if (cache?.key === key) return cache.articles;

  const errors: ArticleValidationError[] = [];
  const articles: Article[] = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    if (!name.endsWith(".mdx")) {
      errors.push(
        new ArticleValidationError(`content/articles/${name}`, [
          "content/articles may only contain <slug>.mdx files.",
        ]),
      );
      continue;
    }
    const slug = name.slice(0, -".mdx".length);
    const source = fs.readFileSync(path.join(ARTICLES_DIR, name), "utf8");
    try {
      articles.push(
        validateArticleSource(slug, source, { readWebp: readPublicWebp }),
      );
    } catch (error) {
      if (error instanceof ArticleValidationError) errors.push(error);
      else throw error;
    }
  }
  if (errors.length) throw new ArticleCollectionError(errors);
  articles.sort(
    (left, right) =>
      right.date.localeCompare(left.date) ||
      left.slug.localeCompare(right.slug),
  );
  cache = { key, articles };
  return articles;
}

export function getPublishedArticles() {
  return getAllArticles().filter((article) => !article.draft);
}

export function getArticle(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return getAllArticles().find((article) => article.slug === slug) ?? null;
}

function readPublicWebp(sitePath: string) {
  if (!/^\/articles\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(sitePath)) return null;
  const root = path.join(process.cwd(), "public", "articles");
  const resolved = path.resolve(path.join(process.cwd(), "public", sitePath));
  if (!resolved.startsWith(`${root}${path.sep}`)) return null;
  if (!fs.existsSync(resolved)) return null;
  return fs.readFileSync(resolved);
}
