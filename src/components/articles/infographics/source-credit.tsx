import styles from "./infographics.module.css";

export type Citation = {
  /** Name of the real source. Required, and shown as a credit. */
  source: string;
  /** Absolute https URL for that source. Required. */
  sourceUrl: string;
};

function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return value;
  } catch {
    return null;
  }
}

export function SourceCredit({ source, sourceUrl }: Citation) {
  const href = httpsUrl(sourceUrl);
  return (
    <p className={styles.source}>
      מקור:{" "}
      {href ? (
        <a href={href} dir="auto" rel="noopener noreferrer" target="_blank">
          {source}
        </a>
      ) : (
        <span dir="auto">{source}</span>
      )}
    </p>
  );
}
