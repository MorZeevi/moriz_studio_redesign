import { defaultLocale, isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPublishedArticles } from "@/lib/articles/load";
import { articlesRss } from "@/lib/articles/rss";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return [{ locale: defaultLocale }];
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale } = await context.params;
  if (!isEnabledLocale(locale) || locale !== defaultLocale) {
    return new Response("Not found", { status: 404 });
  }
  const content = await getDictionary(locale);
  const xml = articlesRss({
    locale,
    title: `${content.articles.heading} | ${content.studioName}`,
    description: content.articles.description,
    articles: getPublishedArticles(),
    siteUrl: SITE_URL,
  });
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
