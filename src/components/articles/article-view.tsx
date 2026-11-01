import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { ARTICLE_LIMITS } from "@/lib/articles/limits";
import { formatArticleDate, readingTimeLabel } from "@/lib/articles/format";
import type { Article } from "@/lib/articles/schema";
import prose from "./article-prose.module.css";
import { ArticleCard } from "./article-card";
import styles from "./articles.module.css";

export function ArticleView({
  article,
  content,
  locale,
  related,
  children,
}: {
  article: Article;
  content: SiteContent;
  locale: EnabledLocale;
  related: Article[];
  children: ReactNode;
}) {
  const copy = content.articles;
  const reading = readingTimeLabel(
    article.readingMinutes,
    copy.readingMinute,
    copy.readingMinutes,
  );
  const toc = [
    ...article.headings
      .filter((heading) => heading.depth === 2)
      .map((heading) => ({ id: heading.id, label: heading.text })),
    ...(article.faq.length ? [{ id: "article-faq", label: copy.faq }] : []),
    ...(article.sources.length
      ? [{ id: "article-sources", label: copy.sources }]
      : []),
  ];

  return (
    <div className="site-container">
      <nav aria-label={copy.breadcrumbs}>
        <ol className={styles.crumbs}>
          <li>
            <Link href={`/${locale}`}>{content.studioName}</Link>
          </li>
          <li>
            <Link href={`/${locale}/articles`}>{copy.heading}</Link>
          </li>
          <li aria-current="page">{article.title}</li>
        </ol>
      </nav>
      <article>
        <header className={styles.hero}>
          {article.draft ? <p className={styles.draft}>{copy.draft}</p> : null}
          <p className={styles.tag}>{article.category}</p>
          <h1 className={styles.articleTitle}>{article.title}</h1>
          <p className={styles.lede}>{article.description}</p>
          <p className={styles.byline}>
            <Link href={`/${locale}`}>{copy.byline}</Link>
            <span>
              {copy.published}{" "}
              <time dateTime={article.date}>
                {formatArticleDate(article.date)}
              </time>
            </span>
            {article.updated ? (
              <span>
                {copy.updated}{" "}
                <time dateTime={article.updated}>
                  {formatArticleDate(article.updated)}
                </time>
              </span>
            ) : null}
            <span>{reading}</span>
          </p>
        </header>
        {article.cover ? (
          <figure className={styles.cover}>
            <Image
              src={article.cover}
              alt={article.coverAlt ?? copy.coverFallbackAlt}
              width={ARTICLE_LIMITS.coverWidth}
              height={ARTICLE_LIMITS.coverHeight}
              priority
              sizes="(min-width: 64rem) 72rem, 100vw"
              className={styles.coverImage}
            />
          </figure>
        ) : null}
        <div className={styles.layout}>
          {toc.length ? (
            <nav className={styles.toc} aria-label={copy.toc}>
              <p className={styles.tocLabel}>{copy.toc}</p>
              <ol className={styles.tocList}>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.label}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <div>
            <div className={prose.prose}>{children}</div>
            {article.faq.length ? (
              <section className={styles.section} aria-labelledby="article-faq">
                <h2 id="article-faq">{copy.faq}</h2>
                {article.faq.map((item) => (
                  <div className={styles.faqItem} key={item.q}>
                    <h3>{item.q}</h3>
                    {item.a.split(/\n{2,}/).map((paragraph) => (
                      <p key={paragraph}>{paragraph.replaceAll("\n", " ")}</p>
                    ))}
                  </div>
                ))}
              </section>
            ) : null}
            {article.sources.length ? (
              <section
                className={styles.section}
                aria-labelledby="article-sources"
              >
                <h2 id="article-sources">{copy.sources}</h2>
                <ol>
                  {article.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
        </div>
      </article>
      {related.length ? (
        <section className={styles.related} aria-labelledby="related-articles">
          <h2 id="related-articles">{copy.related}</h2>
          <ul className={styles.relatedList}>
            {related.map((item) => (
              <li key={item.slug}>
                <ArticleCard
                  locale={locale}
                  slug={item.slug}
                  title={item.title}
                  description={item.description}
                  date={item.date}
                  category={item.category}
                  cover={item.cover}
                  readingMinutes={item.readingMinutes}
                  copy={copy}
                  heading="h3"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
