import Link from "next/link";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import type { Article } from "@/lib/articles/schema";
import { ArticleCard } from "./article-card";
import styles from "./articles.module.css";

export function ArticlesIndex({
  locale,
  content,
  articles,
}: {
  locale: EnabledLocale;
  content: SiteContent;
  articles: Article[];
}) {
  const copy = content.articles;
  return (
    <div className="site-container">
      <header className={styles.hero}>
        <h1 className={styles.heading}>{copy.heading}</h1>
        <p className={styles.lede}>{copy.description}</p>
        <a className={styles.rss} href={`/${locale}/articles/rss.xml`}>
          {copy.rss}
        </a>
      </header>
      {articles.length ? (
        <ul className={styles.list} aria-label={copy.listLabel}>
          {articles.map((article, index) => (
            <li key={article.slug}>
              <ArticleCard
                locale={locale}
                slug={article.slug}
                title={article.title}
                description={article.description}
                date={article.date}
                category={article.category}
                cover={article.cover}
                readingMinutes={article.readingMinutes}
                copy={copy}
                eager={index === 0}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p>{copy.empty}</p>
          <p className={styles.emptyLinks}>
            <Link href={`/${locale}/projects`}>{copy.emptyProjects}</Link>
            <Link href={`/${locale}`}>{copy.emptyHome}</Link>
          </p>
        </div>
      )}
    </div>
  );
}
