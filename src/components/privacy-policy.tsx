import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./privacy-policy.module.css";

/** Privacy policy page body: an editorial heading, then the policy sections. */
export function PrivacyPolicy({
  policy,
  email,
}: {
  policy: SiteContent["privacyPolicy"];
  email: string;
}) {
  return (
    <div className="site-container">
      <header className={styles.hero}>
        <h1 className={styles.heading}>{policy.title}</h1>
        <p className={styles.lede}>{policy.intro}</p>
        <p className={styles.updated}>{policy.lastUpdated}</p>
      </header>
      <article className={styles.body}>
        {policy.sections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {"bullets" in section && section.bullets ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
        <section className={styles.section}>
          <h2>{policy.contactLabel}</h2>
          <p>
            <a href={`mailto:${email}`} dir="ltr">
              {email}
            </a>
          </p>
        </section>
      </article>
    </div>
  );
}
