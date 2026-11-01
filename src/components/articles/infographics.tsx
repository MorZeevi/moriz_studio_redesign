import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import { StatCount } from "./stat-count";
import styles from "./infographics.module.css";

type StepProps = { title?: string; text?: string; index?: number };
type RowProps = { start?: string; end?: string };

export function Steps({
  title,
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  const label = title?.trim();
  const titleId = useId();
  return (
    <section className={styles.steps} data-infographic="steps">
      {label ? (
        <h3 id={titleId} className={styles.infographicTitle}>
          {label}
        </h3>
      ) : null}
      <ol className={styles.stepList}>{numberedSteps(children)}</ol>
    </section>
  );
}

export function Step({ title, text, index = 0 }: StepProps) {
  const label = title?.trim();
  const body = text?.trim();
  return (
    <li className={styles.step}>
      <span className={styles.marker} aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <div className={styles.stepBody}>
        {label ? <p className={styles.stepTitle}>{label}</p> : null}
        {body ? <p className={styles.stepText}>{body}</p> : null}
      </div>
    </li>
  );
}

export function Compare({
  title,
  start,
  end,
  children,
}: {
  title?: string;
  start?: string;
  end?: string;
  children?: ReactNode;
}) {
  const label = title?.trim();
  return (
    <table
      className={`${styles.compare} ${styles.table}`}
      data-infographic="compare"
    >
      {label ? <caption className={styles.infographicTitle}>{label}</caption> : null}
      <thead>
        <tr>
          <th className={styles.startHead} scope="col" dir="auto">
            {start?.trim()}
          </th>
          <th className={styles.endHead} scope="col" dir="auto">
            {end?.trim()}
          </th>
        </tr>
      </thead>
      <tbody>{compareRows(children)}</tbody>
    </table>
  );
}

export function CompareRow({ start, end }: RowProps) {
  return (
    <tr>
      <td className={styles.startCell} dir="auto">
        {start?.trim()}
      </td>
      <td className={styles.endCell} dir="auto">
        {end?.trim()}
      </td>
    </tr>
  );
}

export function Stat({
  title,
  value,
  label,
  source,
  url,
}: {
  title?: string;
  value?: string;
  label?: string;
  source?: string;
  url?: string;
}) {
  const summary = title?.trim();
  const number = value?.trim();
  const caption = label?.trim();
  const credit = source?.trim();
  const href = httpsSource(url);
  return (
    <figure className={styles.stat} data-infographic="stat">
      {summary ? <figcaption className={styles.statTitle}>{summary}</figcaption> : null}
      {number ? <StatCount value={number} /> : null}
      <span className={styles.rule} aria-hidden="true" />
      {caption ? <p className={styles.statLabel}>{caption}</p> : null}
      {credit ? (
        <p className={styles.source}>
          <span className={styles.sourceLabel}>מקור</span>
          {href ? (
            <a
              className={styles.sourceLink}
              href={href.href}
              rel="noopener noreferrer"
              target="_blank"
              dir="auto"
              lang={latinLang(credit)}
            >
              {credit}
              <span className={styles.srOnly}> נפתח בחלון חדש</span>
            </a>
          ) : (
            <span dir="auto">{credit}</span>
          )}
          {href ? (
            <span className={styles.sourceHost} dir="ltr">
              {href.hostname.replace(/^www\./, "")}
            </span>
          ) : null}
        </p>
      ) : null}
    </figure>
  );
}

function numberedSteps(children: ReactNode) {
  const seen = new Map<string, number>();
  return collect(children, (props) => {
    return typeof props.title === "string" && typeof props.text === "string";
  }).map((child, index) => {
    const props = child.props as StepProps;
    const base = `${props.title ?? ""}\u0000${props.text ?? ""}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const key = count === 0 ? base : `${base}\u0000${count}`;
    return cloneElement(child as ReactElement<StepProps>, {
      index: index + 1,
      key,
    });
  });
}

function compareRows(children: ReactNode) {
  const seen = new Map<string, number>();
  return collect(children, (props) => {
    return typeof props.start === "string" && typeof props.end === "string";
  }).map((child) => {
    const props = child.props as RowProps;
    const base = `${props.start ?? ""}\u0000${props.end ?? ""}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const key = count === 0 ? base : `${base}\u0000${count}`;
    return cloneElement(child as ReactElement<RowProps>, { key });
  });
}

function collect(
  children: ReactNode,
  match: (props: Record<string, unknown>) => boolean,
) {
  const found: ReactElement[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = (child.props ?? {}) as Record<string, unknown>;
    if (match(props)) {
      found.push(child);
      continue;
    }
    if (props.children) found.push(...collect(props.children as ReactNode, match));
  }
  return found;
}

function httpsSource(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

function latinLang(value: string) {
  const hebrew = value.match(/[\u0590-\u05FF]/g)?.length ?? 0;
  const latin = value.match(/[A-Za-z]/g)?.length ?? 0;
  return latin > hebrew ? "en" : undefined;
}
