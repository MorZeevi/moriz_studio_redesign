import type { EnabledLocale } from "@/i18n/config";
import {
  organizationId,
  personId,
  websiteId,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";
import type { Article } from "./schema.ts";

export function articlesIndexStructuredData({
  locale,
  heading,
  description,
  studioName,
  articles,
}: {
  locale: EnabledLocale;
  heading: string;
  description: string;
  studioName: string;
  articles: Article[];
}): Record<string, unknown> {
  const home = `${SITE_URL}/${locale}`;
  const url = `${home}/articles`;
  const blog: Record<string, unknown> = {
    "@type": "Blog",
    "@id": `${url}#blog`,
    name: heading,
    description,
    url,
    inLanguage: "he-IL",
    publisher: { "@id": organizationId },
  };
  if (articles.length) {
    blog.blogPost = articles.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.description,
      datePublished: article.date,
      url: `${url}/${article.slug}`,
    }));
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: heading,
        description,
        inLanguage: "he-IL",
        isPartOf: { "@id": websiteId },
        publisher: { "@id": organizationId },
        mainEntity: { "@id": `${url}#blog` },
      },
      blog,
      breadcrumb([
        { name: studioName, item: home },
        { name: heading, item: url },
      ]),
    ],
  };
}

export function articleStructuredData({
  locale,
  studioName,
  articlesLabel,
  article,
}: {
  locale: EnabledLocale;
  studioName: string;
  articlesLabel: string;
  article: Article;
}): Record<string, unknown> {
  const home = `${SITE_URL}/${locale}`;
  const index = `${home}/articles`;
  const url = `${index}/${article.slug}`;
  const keywords = [article.focusKeyword, ...article.tags].filter(
    (keyword): keyword is string => Boolean(keyword),
  );
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      mainEntityOfPage: url,
      url,
      headline: article.title,
      description: article.description,
      datePublished: article.date,
      dateModified: article.updated ?? article.date,
      inLanguage: "he-IL",
      image: new URL(article.cover ?? "/og-image.png", SITE_URL).href,
      articleSection: article.category,
      ...(keywords.length ? { keywords: keywords.join(", ") } : {}),
      timeRequired: `PT${article.readingMinutes}M`,
      author: { "@id": personId },
      publisher: { "@id": organizationId },
      isPartOf: { "@id": `${index}#blog` },
    },
    breadcrumb([
      { name: studioName, item: home },
      { name: articlesLabel, item: index },
      { name: article.title, item: url },
    ]),
  ];
  if (article.faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: article.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function breadcrumb(items: { name: string; item: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}
