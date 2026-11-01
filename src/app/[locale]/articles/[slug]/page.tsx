import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleMdxComponents } from "@/components/articles/mdx";
import { ArticleView } from "@/components/articles/article-view";
import { ArticlesFrame } from "@/components/articles/articles-frame";
import { JsonLd } from "@/components/json-ld";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllArticles, getArticle } from "@/lib/articles/load";
import { articleMetadata } from "@/lib/articles/metadata";
import { importArticle } from "@/lib/articles/modules";
import { relatedArticles } from "@/lib/articles/related";
import { articleStructuredData } from "@/lib/articles/structured-data";
import { canViewArticle } from "@/lib/articles/view";

type PageParams = { params: Promise<{ locale: string; slug: string }> };

async function loadArticle(params: PageParams["params"]) {
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
  if (!article || !canViewArticle(article, false)) notFound();
  return { locale, content, article };
}

export function generateStaticParams() {
  return getAllArticles()
    .filter((article) => !article.draft)
    .map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale, content, article } = await loadArticle(params);
  return articleMetadata({ article, locale, content, preview: false });
}

export default async function ArticlePage({ params }: PageParams) {
  const { locale, content, article } = await loadArticle(params);
  const { default: Content } = await importArticle(article.slug);
  const related = relatedArticles(article, getAllArticles());
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
        related={related}
      >
        <Content components={articleMdxComponents()} />
      </ArticleView>
    </ArticlesFrame>
  );
}
