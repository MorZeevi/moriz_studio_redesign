import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesFrame } from "@/components/articles/articles-frame";
import { ArticlesIndex } from "@/components/articles/articles-index";
import { JsonLd } from "@/components/json-ld";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPublishedArticles } from "@/lib/articles/load";
import { articlesIndexMetadata } from "@/lib/articles/metadata";
import { assertArticlesCompile } from "@/lib/articles/modules";
import { articlesIndexStructuredData } from "@/lib/articles/structured-data";

type PageParams = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  return articlesIndexMetadata(locale, content);
}

export default async function ArticlesPage({ params }: PageParams) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  await assertArticlesCompile();
  const [content, articles] = await Promise.all([
    getDictionary(locale),
    Promise.resolve(getPublishedArticles()),
  ]);
  return (
    <ArticlesFrame content={content} locale={locale}>
      <JsonLd
        data={articlesIndexStructuredData({
          locale,
          heading: content.articles.heading,
          description: content.articles.description,
          studioName: content.studioName,
          articles,
        })}
      />
      <ArticlesIndex locale={locale} content={content} articles={articles} />
    </ArticlesFrame>
  );
}
