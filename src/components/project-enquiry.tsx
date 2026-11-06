import { conversionCopy as copy } from "@/content/conversion-copy";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import { LiquidLink } from "./ui/liquid-link";
import styles from "./project-detail.module.css";
export function ProjectEnquiry({ compact = false }: { compact?: boolean }) {
  if (!WHATSAPP_URL) return null;
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
      <LiquidLink href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
        {copy.action}
      </LiquidLink>
    </section>
  );
}
