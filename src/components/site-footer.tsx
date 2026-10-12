import Link from "next/link";
import { FooterWordmark } from "@/components/footer-wordmark";
import { StudioLogo } from "@/components/studio-logo";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./site-footer.module.css";

const wordmarkFill = "/images/footer/wordmark-fill.webp";

type Social = SiteContent["footer"]["socials"][number];

const socialIcons: Record<Social["network"], React.ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 10v8M6 6.5v.01M10 18v-8M10 13.5a3.5 3.5 0 0 1 7 0V18" />
    </svg>
  ),
};

// Section anchors stay on the homepage; site paths gain the locale prefix.
function localeHref(href: string, locale: EnabledLocale) {
  if (href.startsWith("#")) return href;
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

export function SiteFooter({
  content,
  locale,
}: {
  content: SiteContent;
  locale: EnabledLocale;
}) {
  const footer = content.footer;
  return (
    <footer data-wireframe-section="footer" className={styles.footer}>
      <div className={`page-shell ${styles.top}`}>
        <div className={styles.brand}>
          <StudioLogo name={content.studioName} locale={locale} />
        </div>

        <nav aria-label={footer.label} className={styles.columns}>
          {footer.columns.map((column) => (
            <div key={column.heading} className={styles.column}>
              <h2 className={styles.heading}>{column.heading}</h2>
              <ul className={styles.links}>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={localeHref(link.href, locale)}
                      className={styles.link}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className={styles.column}>
            <h2 className={styles.heading}>{footer.socialsHeading}</h2>
            <ul className={styles.socials}>
              {footer.socials.map((social) => (
                <li key={social.network}>
                  {social.href ? (
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      className={styles.social}
                    >
                      {socialIcons[social.network]}
                    </a>
                  ) : (
                    <span
                      role="img"
                      aria-label={social.label}
                      aria-disabled="true"
                      title={social.label}
                      className={styles.social}
                    >
                      {socialIcons[social.network]}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <FooterWordmark lines={footer.wordmark} fillSrc={wordmarkFill} />

      <div className={`page-shell ${styles.bottom}`}>
        <ul className={styles.legal}>
          {footer.legal.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={localeHref(item.href, locale)}
                  className={styles.tag}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-disabled="true" className={styles.tag}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className={styles.copyright} dir="ltr">
          © {new Date().getFullYear()} {footer.copyright}
        </p>
      </div>
    </footer>
  );
}
