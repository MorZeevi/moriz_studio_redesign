import Image from "next/image";
import Link from "next/link";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { formatArticleDate, readingTimeLabel } from "@/lib/articles/format";
import styles from "./articles.module.css";

export function ArticleCard({
  locale,
  slug,
  title,
  description,
  date,
  category,
  cover,
  readingMinutes,
  copy,
  eager = false,
  heading = "h2",
}: {
  locale: EnabledLocale;
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  cover?: string;
  readingMinutes: number;
  copy: SiteContent["articles"];
  eager?: boolean;
  heading?: "h2" | "h3";
}) {
  const reading = readingTimeLabel(
    readingMinutes,
    copy.readingMinute,
    copy.readingMinutes,
  );
  const Title = heading;
  return (
    <article className={styles.cardWrap}>
      <Link href={`/${locale}/articles/${slug}`} className={styles.card}>
        <div className={styles.media}>
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              sizes="(min-width: 48rem) 40rem, 100vw"
              priority={eager}
            />
          ) : (
            <div className={styles.mediaFallback} aria-hidden="true" />
          )}
        </div>
        <div className={styles.cardBody}>
          <p className={styles.tag}>{category}</p>
          <Title className={styles.cardTitle}>{title}</Title>
          <p className={styles.cardDescription}>{description}</p>
          <p className={styles.meta}>
            <time dateTime={date}>{formatArticleDate(date)}</time>
            <span aria-hidden="true"> · </span>
            <span>{reading}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
