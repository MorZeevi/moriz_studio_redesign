import Link from "next/link";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./privacy-policy.module.css";

type LegalDocumentContent = {
  title: string;
  intro: string;
  updatedOn: string;
  lastUpdated: string;
  contactLabel: string;
  contactName: string;
  sections: {
    title: string;
    paragraphs: string[];
    bullets?: string[];
    links?: { label: string; href: string }[];
  }[];
};

/** Readable, server-rendered legal documents in the existing privacy-page style. */
export function LegalDocument({
  document,
  contact,
  locale,
}: {
  document: LegalDocumentContent;
  contact: SiteContent["contact"]["details"];
  locale: EnabledLocale;
}) {
  return (
    <div className="site-container">
      <header className={styles.hero}>
        <h1 className={styles.heading}>{document.title}</h1>
        <p className={styles.lede}>{document.intro}</p>
        <p className={styles.updated}>
          <time dateTime={document.updatedOn}>{document.lastUpdated}</time>
        </p>
      </header>
      <article className={styles.body} aria-label={document.title}>
        {document.sections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets && (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.links?.map((link) => (
              <p key={link.href}>
                <Link href={`/${locale}${link.href}`}>{link.label}</Link>
              </p>
            ))}
          </section>
        ))}
        <section className={styles.section}>
          <h2>{document.contactLabel}</h2>
          <p>{document.contactName}</p>
          <p>
            <a href={`mailto:${contact.email}`} dir="ltr">
              {contact.email}
            </a>
          </p>
          <p>
            <a href={contact.phoneHref} dir="ltr">
              {contact.phone}
            </a>
          </p>
        </section>
      </article>
    </div>
  );
}
