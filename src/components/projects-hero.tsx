import styles from "./projects-hero.module.css";

/** Projects page opening: an editorial heading. */
export function ProjectsHero({ heading }: { heading: string }) {
  return (
    <header className={`site-container ${styles.hero}`}>
      <h1 className={styles.heading}>{heading}</h1>
    </header>
  );
}
