import { LiquidLink } from "./ui/liquid-link";
import styles from "./projects-contact-card.module.css";

/** The contact invitation that sits inside the projects grid. */
export function ProjectsContactCard({
  heading,
  body,
  link,
  href,
}: {
  heading: string;
  body: string;
  link: string;
  href: string;
}) {
  // The question mark is set apart so it can tilt on hover.
  const question = heading.endsWith("?");
  const words = question ? heading.slice(0, -1) : heading;
  return (
    <aside className={styles.card} aria-labelledby="projects-contact-heading">
      <h2 id="projects-contact-heading" className={styles.heading}>
        {words}
        {question && <span className={styles.mark}>?</span>}
      </h2>
      <p className={styles.body}>{body}</p>
      <LiquidLink href={href} arrow="down" className={styles.link}>
        {link}
      </LiquidLink>
    </aside>
  );
}
