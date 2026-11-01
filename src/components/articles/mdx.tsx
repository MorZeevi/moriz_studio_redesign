import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { After, Before, BeforeAfter } from "@/components/articles/infographics/before-after";
import { Bar, CompareBars } from "@/components/articles/infographics/compare-bars";
import { ProcessSteps, Step } from "@/components/articles/infographics/process-steps";
import { Stat, StatHighlight } from "@/components/articles/infographics/stat-highlight";
import { Timeline, TimelineItem } from "@/components/articles/infographics/timeline";
import { LiquidLink } from "@/components/ui/liquid-link";
import type { ArticleEmbeds } from "@/lib/articles/embeds";
import { createHeadingIdAllocator } from "@/lib/articles/headings";
import { webpSize } from "@/lib/articles/webp";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./article-prose.module.css";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function articleMdxComponents({
  copy,
  locale,
  embeds,
}: {
  copy: SiteContent["articles"];
  locale: EnabledLocale;
  embeds: ArticleEmbeds;
}) {
  const allocate = createHeadingIdAllocator();
  let ctaCount = 0;
  function Heading(Tag: "h2" | "h3" | "h4") {
    return function ArticleHeading({
      children,
      ...rest
    }: ComponentPropsWithoutRef<typeof Tag>) {
      return (
        <Tag {...rest} id={allocate(textFrom(children))}>
          {children}
        </Tag>
      );
    };
  }

  return {
    h2: Heading("h2"),
    h3: Heading("h3"),
    h4: Heading("h4"),
    a: ArticleLink,
    img: ArticleImage,
    pre: ArticlePre,
    table: ArticleTable,
    Callout,
    Figure,
    CtaCard(props: {
      title?: string;
      text?: string;
      href?: string;
      label?: string;
    }) {
      const title = props.title?.trim() || copy.ctaTitle;
      const text = props.text?.trim() || copy.ctaText;
      const href = props.href?.trim() || "#contact";
      const label = props.label?.trim() || copy.ctaLabel;
      ctaCount += 1;
      const titleId = `article-cta-${ctaCount}`;
      return (
        <aside className={styles.cta} aria-labelledby={titleId}>
          <div>
            <p id={titleId} className={styles.ctaTitle}>
              {title}
            </p>
            <p className={styles.ctaText}>{text}</p>
          </div>
          <LiquidLink
            href={href}
            arrow={href.startsWith("#") ? "down" : "forward"}
            className={styles.ctaLink}
          >
            {label}
          </LiquidLink>
        </aside>
      );
    },
    ProjectCard({ slug }: { slug?: string }) {
      if (!slug || !SLUG.test(slug)) return null;
      const teaser = embeds.projects.get(slug);
      if (teaser === "unavailable") {
        return (
          <p>
            <Link href={`/${locale}/projects/${slug}`}>{copy.projectFallback}</Link>
          </p>
        );
      }
      if (!teaser) return null;
      return (
        <Link href={teaser.href} className={styles.projectCard}>
          {teaser.image ? (
            <span className={styles.projectMedia}>
              <Image
                src={teaser.image.src}
                alt={teaser.image.alt}
                fill
                sizes="(min-width: 64rem) 18rem, 100vw"
                unoptimized={teaser.image.src.includes("/media/")}
              />
            </span>
          ) : null}
          <span className={styles.projectCopy}>
            <span className={styles.kicker}>{copy.projectKicker}</span>
            <span className={styles.projectTitle}>{teaser.title}</span>
          </span>
        </Link>
      );
    },
    StatHighlight,
    Stat,
    CompareBars,
    Bar,
    ProcessSteps,
    Step,
    BeforeAfter,
    Before,
    After,
    Timeline,
    TimelineItem,
    RelatedArticle({ slug }: { slug?: string }) {
      if (!slug) return null;
      const teaser = embeds.articles.get(slug);
      if (!teaser) return null;
      return (
        <Link href={teaser.href} className={styles.also}>
          <span className={styles.kicker}>{copy.alsoRead}</span>
          <span className={styles.alsoTitle}>{teaser.title}</span>
          <span className={styles.alsoText}>{teaser.description}</span>
        </Link>
      );
    },
  };
}

export function Callout({
  type = "note",
  children,
}: {
  type?: "note" | "tip" | "warning";
  children?: ReactNode;
}) {
  const kind = type === "tip" || type === "warning" ? type : "note";
  const label = { note: "הערה", tip: "טיפ", warning: "שימו לב" }[kind];
  return (
    <aside className={`${styles.callout} ${styles[kind]}`} aria-label={label}>
      <p className={styles.calloutLabel}>{label}</p>
      <div className={styles.calloutBody}>{children}</div>
    </aside>
  );
}

export function Figure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className={styles.figure}>
      <ArticlePicture src={src} alt={alt} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function ArticleLink({
  href,
  children,
}: ComponentPropsWithoutRef<"a">) {
  if (!href) return <span>{children}</span>;
  if (href.startsWith("/") || href.startsWith("#")) {
    return href.startsWith("/") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href}>{children}</a>
    );
  }
  return (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

function ArticleImage({
  src,
  alt,
  title,
}: ComponentPropsWithoutRef<"img">) {
  if (!src || typeof src !== "string") return null;
  return (
    <figure className={styles.figure}>
      <ArticlePicture src={src} alt={alt ?? ""} />
      {title ? <figcaption>{title}</figcaption> : null}
    </figure>
  );
}

function ArticlePicture({ src, alt }: { src: string; alt: string }) {
  const size = articleImageSize(src);
  if (!size) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={size.width}
      height={size.height}
      sizes="(min-width: 64rem) 42rem, 100vw"
      style={{ width: "100%", height: "auto" }}
    />
  );
}

function articleImageSize(src: string) {
  if (!/^\/articles\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(src)) return null;
  const root = path.join(process.cwd(), "public", "articles");
  const resolved = path.resolve(path.join(process.cwd(), "public", src.slice(1)));
  if (!resolved.startsWith(`${root}${path.sep}`)) return null;
  try {
    return webpSize(fs.readFileSync(resolved));
  } catch {
    return null;
  }
}

function ArticlePre(props: ComponentPropsWithoutRef<"pre">) {
  return <pre {...props} dir="ltr" />;
}

function ArticleTable(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className={styles.tableScroll}>
      <table {...props} />
    </div>
  );
}

function textFrom(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((item) => textFrom(item)).join("");
  if (node && typeof node === "object" && "props" in node) {
    const element = node as { props?: { children?: ReactNode } };
    return textFrom(element.props?.children);
  }
  return "";
}
