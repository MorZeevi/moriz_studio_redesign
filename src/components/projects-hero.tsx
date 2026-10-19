import styles from "./projects-hero.module.css";

/** Projects page opening: an editorial heading with the live project count. */
export function ProjectsHero({
  heading,
  lede,
  count,
  countLabel,
}: {
  heading: string;
  lede: string;
  count: number;
  countLabel: string;
}) {
  return (
    <header className={`site-container ${styles.hero}`}>
      <h1 className={styles.heading}>
        {heading}
        <sup className={styles.count}>
          <span aria-hidden="true">{String(count).padStart(2, "0")}</span>
          <span className="sr-only">{` (${count} ${countLabel})`}</span>
        </sup>
      </h1>
      <p className={styles.lede}>{lede}</p>
    </header>
  );
}
