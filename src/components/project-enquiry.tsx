import { conversionCopy as copy } from "@/content/conversion-copy";
import { whatsappUrl } from "@/lib/whatsapp";
import { LiquidLink } from "./ui/liquid-link";
import styles from "./project-detail.module.css";
export function ProjectEnquiry({
  compact = false,
  title,
  formHref,
}: {
  compact?: boolean;
  /** Named in the WhatsApp opening message. */
  title: string;
  /** The contact form, for visitors who prefer not to use WhatsApp. */
  formHref: string;
}) {
  const href = whatsappUrl(copy.projectWhatsappMessage(title));
  if (!href) return null;
  return (
    <section
      className={styles.enquiry}
      data-contact-placement={compact ? "project-intro" : "project-end"}
    >
      {!compact && (
        <>
          <h2>{copy.projectHeading}</h2>
          <p>{copy.projectBody}</p>
        </>
      )}
      <div className={styles.enquiryActions}>
        <LiquidLink href={href} target="_blank" rel="noopener noreferrer">
          {copy.action}
        </LiquidLink>
        {!compact && (
          <a className={styles.enquiryForm} href={formHref}>
            {copy.projectFormLink}
          </a>
        )}
      </div>
    </section>
  );
}
