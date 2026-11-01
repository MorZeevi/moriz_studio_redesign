import { articleInstant } from "./format.ts";
import type { Article } from "./schema.ts";

export function articlesRss({
  locale,
  title,
  description,
  articles,
  siteUrl,
}: {
  locale: string;
  title: string;
  description: string;
  articles: Article[];
  siteUrl: string;
}) {
  const index = `${siteUrl}/${locale}/articles`;
  const self = `${index}/rss.xml`;
  const newest = articles[0];
  const items = articles.map((article) => {
    const url = `${index}/${article.slug}`;
    const when = articleInstant(article.updated ?? article.date).toUTCString();
    return `    <item>
      <title>${xml(article.title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <pubDate>${when}</pubDate>
      <description>${xml(article.description)}</description>
      <category>${xml(article.category)}</category>
    </item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(title)}</title>
    <link>${xml(index)}</link>
    <description>${xml(description)}</description>
    <language>he-IL</language>
    <atom:link href="${xml(self)}" rel="self" type="application/rss+xml"/>
    ${newest ? `<lastBuildDate>${articleInstant(newest.updated ?? newest.date).toUTCString()}</lastBuildDate>` : ""}
${items.join("\n")}
  </channel>
</rss>
`;
}

function xml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
