import type { Metadata } from "next";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { pageAlternates } from "@/lib/seo";
import { siteOpenGraph } from "@/lib/site";
import { ARTICLE_LIMITS } from "./limits.ts";
import type { Article } from "./schema.ts";

export function articlesIndexMetadata(
  locale: EnabledLocale,
  content: SiteContent,
): Metadata {
  const { heading, description } = content.articles;
  const title = `${heading} | ${content.studioName}`;
  const url = `/${locale}/articles`;
  return {
    title: { absolute: title },
    description,
    alternates: {
      ...pageAlternates(url),
      types: { "application/rss+xml": `${url}/rss.xml` },
    },
    openGraph: { ...siteOpenGraph, title, description, url },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteOpenGraph.images[0].url],
    },
  };
}

export function articleMetadata({
  article,
  locale,
  content,
  preview,
}: {
  article: Article;
  locale: EnabledLocale;
  content: SiteContent;
  preview: boolean;
}): Metadata {
  const title = `${article.title} | ${content.studioName}`;
  const url = `/${locale}/articles/${article.slug}`;
  const image = article.cover
    ? {
        url: article.cover,
        width: ARTICLE_LIMITS.coverWidth,
        height: ARTICLE_LIMITS.coverHeight,
        alt: article.coverAlt ?? content.articles.coverFallbackAlt,
      }
    : siteOpenGraph.images[0];
  const keywords = [article.focusKeyword, ...article.tags].filter(
    (keyword): keyword is string => Boolean(keyword),
  );
  return {
    title: { absolute: title },
    description: article.description,
    ...(keywords.length ? { keywords } : {}),
    authors: [{ name: "Mor Zeevi", url: `/${locale}` }],
    alternates: article.draft ? undefined : pageAlternates(url),
    robots:
      preview || article.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      ...siteOpenGraph,
      type: "article",
      title,
      description: article.description,
      url,
      publishedTime: article.date,
      modifiedTime: article.updated ?? article.date,
      authors: ["Mor Zeevi"],
      section: article.category,
      ...(article.tags.length ? { tags: article.tags } : {}),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: article.description,
      images: [image.url],
    },
  };
}
