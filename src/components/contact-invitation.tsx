import { conversionCopyFor } from "@/content/conversion-copy";
import type { EnabledLocale } from "@/i18n/config";
import { whatsappContactUrl } from "@/lib/whatsapp";
import styles from "./contact-invitation.module.css";
import { LiquidLink } from "./ui/liquid-link";

/** An invitation to talk placed along a page, so a visitor who stops before
 * the footer still meets one. `placement` names it in contact analytics. */
export function ContactInvitation({
  locale,
  placement,
  text,
  shell = false,
}: {
  locale: EnabledLocale;
  placement: string;
  text: string;
  /** Adds the page gutters when rendered outside a `Section`. */
  shell?: boolean;
}) {
  const copy = conversionCopyFor(locale);
  const href = whatsappContactUrl(locale);
  if (!href) return null;
  return (
    <div className={shell ? "page-shell" : undefined}>
      <div className={styles.invitation} data-contact-placement={placement}>
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>
          <LiquidLink href={href} target="_blank" rel="noopener noreferrer">
            {copy.action}
          </LiquidLink>
          <a className={styles.form} href="#contact">
            {copy.projectFormLink}
          </a>
        </div>
      </div>
    </div>
  );
}
