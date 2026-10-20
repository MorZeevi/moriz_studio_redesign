import { withBasePath } from "@/diagnostic/basePath";
import type { SiteContent } from "@/i18n/dictionaries";
import { LiquidLink } from "./ui/liquid-link";
import styles from "./diagnostic-banner.module.css";

export function DiagnosticBanner({
  content,
}: {
  content: SiteContent["diagnosticBanner"];
}) {
  return (
    <section
      id="diagnostic-banner"
      aria-labelledby="diagnostic-banner-heading"
      className={styles.section}
    >
      <div className="site-container">
        <div className={styles.panel}>
          <h2 id="diagnostic-banner-heading" className={styles.heading}>
            <span>{content.headingStart}</span>{" "}
            <span>{content.headingEnd}</span>
          </h2>
          <div className={styles.copy}>
            <p className={styles.description}>
              <span>{content.introduction}</span>{" "}
              <span>
                <strong>{content.emphasis}</strong> {content.description}
              </span>
            </p>
            <LiquidLink
              href={withBasePath("")}
              variant="primary"
              navigation="native"
              className={styles.action}
            >
              {content.action}
            </LiquidLink>
          </div>

          <div className={styles.scene} dir="ltr">
            <div className={styles.pole} aria-hidden="true" />
            <ul className={styles.signs} aria-label={content.solutionsLabel}>
              {content.solutions.map((solution) => (
                <li className={styles.sign} key={solution}>
                  <bdi>{solution}</bdi>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
