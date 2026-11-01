import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/articles/article-content";
import { ArticleView } from "@/components/articles/article-view";
import { ArticlesFrame } from "@/components/articles/articles-frame";
import { JsonLd } from "@/components/json-ld";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllArticles, getArticle } from "@/lib/articles/load";
import { articleMetadata } from "@/lib/articles/metadata";
import { relatedArticles } from "@/lib/articles/related";
import { articleStructuredData } from "@/lib/articles/structured-data";

type PageParams = { params: Promise<{ locale: string; slug: string }> };

async function loadPreview(params: PageParams["params"]) {
  const { locale, slug } = await params;
  if (!isEnabledLocale(locale)) notFound();
  let articleSlug: string;
  try {
    articleSlug = decodeURIComponent(slug);
  } catch {
    notFound();
  }
  const [content, article] = await Promise.all([
    getDictionary(locale),
    Promise.resolve(getArticle(articleSlug)),
  ]);
  if (!article) notFound();
  return { locale, content, article };
}

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale, content, article } = await loadPreview(params);
  return articleMetadata({ article, locale, content, preview: true });
}

export default async function ArticlePreviewPage({ params }: PageParams) {
  const { locale, content, article } = await loadPreview(params);
  return (
    <ArticlesFrame content={content} locale={locale}>
      <JsonLd
        data={articleStructuredData({
          locale,
          studioName: content.studioName,
          articlesLabel: content.articles.heading,
          article,
        })}
      />
      <ArticleView
        article={article}
        content={content}
        locale={locale}
        related={relatedArticles(article, getAllArticles())}
      >
        <ArticleContent
          article={article}
          content={content}
          locale={locale}
          preview
        />
      </ArticleView>
    </ArticlesFrame>
  );
}
