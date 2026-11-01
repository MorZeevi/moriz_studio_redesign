import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { createHeadingIdAllocator } from "@/lib/articles/headings";
import { webpSize } from "@/lib/articles/webp";
import styles from "./article-prose.module.css";

export function articleMdxComponents() {
  const allocate = createHeadingIdAllocator();
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
