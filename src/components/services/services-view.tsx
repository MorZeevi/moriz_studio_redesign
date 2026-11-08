import Link from "next/link";
import { LiquidLink } from "@/components/ui/liquid-link";
import {
  type Paragraph,
  paragraphText,
  type ServiceDocument,
  type ServiceSection,
  servicesChrome,
} from "@/content/services";
import type { EnabledLocale } from "@/i18n/config";
import styles from "./services.module.css";

type ServiceLink = {
  href: string;
  title: string;
  description?: string;
};

function hrefFor(href: string, locale: EnabledLocale) {
  if (
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("/digital-audit")
  ) {
    return href;
  }
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

function RichText({
  paragraph,
  locale,
}: {
  paragraph: Paragraph;
  locale: EnabledLocale;
}) {
  return paragraph.map((part) => {
    if (typeof part === "string") return part;
    const href = hrefFor(part.href, locale);
    const LinkTag = href.startsWith("#") ? "a" : Link;
    return (
      <LinkTag key={`${part.href}-${part.text}`} href={href}>
        {part.text}
      </LinkTag>
    );
  });
}

function Prose({
  paragraphs,
  locale,
}: {
  paragraphs: Paragraph[];
  locale: EnabledLocale;
}) {
  return paragraphs.map((paragraph) => (
    <p key={paragraphText(paragraph)}>
      <RichText paragraph={paragraph} locale={locale} />
    </p>
  ));
}

function ItemList({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Tag>
  );
}

function SectionBlock({
  section,
  locale,
}: {
  section: ServiceSection;
  locale: EnabledLocale;
}) {
  if (section.type === "split") {
    return (
      <section className={styles.section} aria-labelledby={section.id}>
        <h2 id={section.id}>{section.heading}</h2>
        <div className={styles.split}>
          {section.columns.map((column) => (
            <div key={column.heading} className={styles.column}>
              <h3>{column.heading}</h3>
              {column.paragraphs ? (
                <Prose paragraphs={column.paragraphs} locale={locale} />
              ) : null}
              <ItemList items={column.items} />
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (section.type === "steps") {
    return (
      <section className={styles.section} aria-labelledby={section.id}>
        <h2 id={section.id}>{section.heading}</h2>
        {section.paragraphs ? (
          <Prose paragraphs={section.paragraphs} locale={locale} />
        ) : null}
        <ol className={styles.steps}>
          {section.steps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }
  return (
    <section className={styles.section} aria-labelledby={section.id}>
      <h2 id={section.id}>{section.heading}</h2>
      <Prose paragraphs={section.paragraphs} locale={locale} />
      {section.items?.length ? (
        <ItemList items={section.items} ordered={section.ordered} />
      ) : null}
    </section>
  );
}

function LinkList({ links }: { links: ServiceLink[] }) {
  return (
    <ul className={styles.links}>
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href}>{link.title}</Link>
          {link.description ? <p>{link.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function ServicesView({
  locale,
  studioName,
  contactLabel,
  page,
  catalog,
  articles,
  projects,
  related,
}: {
  locale: EnabledLocale;
  studioName: string;
  contactLabel: string;
  page: ServiceDocument;
  catalog: ServiceLink[];
  articles: ServiceLink[];
  projects: ServiceLink[];
  related: ServiceLink[];
}) {
  const hubHref = `/${locale}/services`;
  const toc = [
    ...(page.showCatalog
      ? [{ id: "services", label: servicesChrome.catalog }]
      : []),
    ...page.sections.map((section) => ({
      id: section.id,
      label: section.heading,
    })),
    ...(projects.length
      ? [{ id: "work", label: servicesChrome.projects }]
      : []),
    ...(articles.length
      ? [{ id: "reading", label: servicesChrome.articles }]
      : []),
    ...(related.length
      ? [{ id: "related", label: servicesChrome.related }]
      : []),
    { id: "faq", label: servicesChrome.faq },
  ];

  return (
    <div className="site-container">
      <nav aria-label={servicesChrome.breadcrumbs}>
        <ol className={styles.crumbs}>
          <li>
            <Link href={`/${locale}`}>{studioName}</Link>
          </li>
          {page.slug ? (
            <li>
              <Link href={hubHref}>{servicesChrome.label}</Link>
            </li>
          ) : null}
          <li aria-current="page">{page.heading}</li>
        </ol>
      </nav>
      <header className={styles.hero}>
        <h1 className={styles.heading}>{page.heading}</h1>
        <div className={styles.answer}>
          <Prose paragraphs={page.answer} locale={locale} />
        </div>
      </header>
      <div className={styles.layout}>
        <nav className={styles.toc} aria-label={servicesChrome.toc}>
          <p className={styles.tocLabel}>{servicesChrome.toc}</p>
          <ol className={styles.tocList}>
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div>
          {page.showCatalog ? (
            <section className={styles.section} aria-labelledby="services">
              <h2 id="services">{servicesChrome.catalog}</h2>
              <ul className={styles.cards}>
                {catalog.map((service) => (
                  <li key={service.href}>
                    <h3>
                      <Link href={service.href}>{service.title}</Link>
                    </h3>
                    {service.description ? <p>{service.description}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {page.sections.map((section) => (
            <SectionBlock key={section.id} section={section} locale={locale} />
          ))}
          {projects.length ? (
            <section className={styles.section} aria-labelledby="work">
              <h2 id="work">{servicesChrome.projects}</h2>
              <LinkList links={projects} />
              <p>
                <Link href={`/${locale}/projects`}>
                  {servicesChrome.projectsAll}
                </Link>
              </p>
            </section>
          ) : null}
          {articles.length ? (
            <section className={styles.section} aria-labelledby="reading">
              <h2 id="reading">{servicesChrome.articles}</h2>
              <LinkList links={articles} />
            </section>
          ) : null}
          {related.length ? (
            <section className={styles.section} aria-labelledby="related">
              <h2 id="related">{servicesChrome.related}</h2>
              <LinkList links={related} />
            </section>
          ) : null}
          <section className={styles.section} aria-labelledby="faq">
            <h2 id="faq">{servicesChrome.faq}</h2>
            {page.faq.map((item) => (
              <div key={item.question} className={styles.faqItem}>
                <h3>{item.question}</h3>
                {item.answer.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ))}
          </section>
          <aside className={styles.cta} aria-labelledby="service-cta">
            <p id="service-cta" className={styles.ctaTitle}>
              {page.cta}
            </p>
            <LiquidLink href="#contact" arrow="down" className={styles.ctaLink}>
              {contactLabel}
            </LiquidLink>
          </aside>
        </div>
      </div>
    </div>
  );
}
