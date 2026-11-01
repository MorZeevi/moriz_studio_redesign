import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { loadArticleEmbeds } from "@/lib/articles/embeds";
import { importArticle } from "@/lib/articles/modules";
import type { Article } from "@/lib/articles/schema";
import { articleMdxComponents } from "./mdx";

export async function ArticleContent({
  article,
  content,
  locale,
  preview,
}: {
  article: Article;
  content: SiteContent;
  locale: EnabledLocale;
  preview: boolean;
}) {
  const embeds = await loadArticleEmbeds(article, locale, preview);
  const { default: Content } = await importArticle(article.slug);
  return (
    <Content
      components={articleMdxComponents({
        copy: content.articles,
        locale,
        embeds,
      })}
    />
  );
}
