import type { WorkItem, WorkProject } from "@/lib/cms/work-os";
import { markItemDone } from "./actions";
import styles from "./os.module.css";

const DAY = 86_400_000;

/** YYYY-MM-DD for "now" in Israel, never the server's UTC date. */
function israelToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
  }).format(new Date());
}

function dayNumber(iso: string) {
  return Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : `${n} ${many}`;
}

function dueLabel(iso: string, today: string) {
  const diff = dayNumber(iso) - dayNumber(today);
  if (diff < 0) {
    return {
      tone: "overdue",
      text: `באיחור ${plural(-diff, "יום", "ימים")}`,
    };
  }
  if (diff === 0) return { tone: "today", text: "היום" };
  if (diff === 1) return { tone: "soon", text: "מחר" };
  if (diff < 7) return { tone: "soon", text: `בעוד ${diff} ימים` };
  return { tone: "soon", text: formatDate(iso) };
}

function Due({ iso, today }: { iso: string | null; today: string }) {
  if (!iso) return null;
  const { tone, text } = dueLabel(iso, today);
  return (
    <span className={styles.due} data-tone={tone}>
      {text}
    </span>
  );
}

function DoneButton({ id, title }: { id: string; title: string }) {
  return (
    <form action={markItemDone}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={styles.done}
        aria-label={`סמן כבוצע: ${title}`}
        title="סמן כבוצע"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 8.5l3.2 3L13 4.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}

function targetLine(p: WorkProject, today: string) {
  if (!p.target_date) return null;
  const diff = dayNumber(p.target_date) - dayNumber(today);
  const rel =
    diff < 0
      ? `באיחור ${plural(-diff, "יום", "ימים")}`
      : diff === 0
        ? "היום"
        : `בעוד ${plural(diff, "יום", "ימים")}`;
  return `יעד: ${formatDate(p.target_date)} · ${rel}`;
}

function ProjectCard({
  project,
  items,
  isRadar,
  today,
}: {
  project: WorkProject;
  items: WorkItem[];
  isRadar: boolean;
  today: string;
}) {
  const [next, ...rest] = items;
  const paused = project.status === "paused";
  const target = targetLine(project, today);
  return (
    <article
      className={styles.card}
      data-state={paused ? "paused" : isRadar ? "radar" : "ok"}
    >
      <header className={styles.cardHead}>
        <h3>{project.title}</h3>
        <div className={styles.meta}>
          {project.client_name ? <span>{project.client_name}</span> : null}
          {paused ? <span>מושהה</span> : null}
          {target ? <span>{target}</span> : null}
        </div>
      </header>
      {next ? (
        <div className={styles.next}>
          <div className={styles.nextLabelRow}>
            <span className={styles.nextLabel}>הצעד הבא</span>
            <Due iso={next.due_on} today={today} />
          </div>
          <div className={styles.nextRow}>
            <DoneButton id={next.id} title={next.title} />
            <span className={styles.nextTitle}>{next.title}</span>
          </div>
          {next.body ? <p className={styles.nextBody}>{next.body}</p> : null}
        </div>
      ) : (
        <div className={styles.noNext}>
          <strong>{paused ? "אין משימות פתוחות" : "אין צעד הבא"}</strong>
          {paused ? null : <span>בקש מהדוט להוסיף צעד</span>}
        </div>
      )}
      {rest.length ? (
        <details className={styles.more}>
          <summary>
            עוד {plural(rest.length, "משימה אחת", "משימות")}
          </summary>
          <ul>
            {rest.map((i) => (
              <li key={i.id} className={styles.moreItem}>
                <DoneButton id={i.id} title={i.title} />
                <div className={styles.moreText}>
                  <span>{i.title}</span>
                  {i.body ? <p>{i.body}</p> : null}
                </div>
                <Due iso={i.due_on} today={today} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}

export type OsData = {
  projects: WorkProject[];
  open: WorkItem[];
  today: WorkItem[];
  radar: { id: string | null }[];
};

export function OsView({
  data: { projects, open, today: todayItems, radar },
  now,
}: {
  data: OsData;
  now?: string;
}) {
  const today = now ?? israelToday();
  const titleOf = new Map(projects.map((p) => [p.id, p.title]));
  const radarIds = new Set(radar.map((p) => p.id));
  const general = open.filter((i) => !i.project_id);

  const cards = projects
    .map((project) => ({
      project,
      items: open.filter((i) => i.project_id === project.id),
      isRadar: radarIds.has(project.id),
    }))
    .sort((a, b) => {
      const rank = (c: typeof a) =>
        c.project.status === "paused" ? 2 : c.isRadar ? 0 : 1;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return (a.items[0]?.due_on ?? "9999").localeCompare(
        b.items[0]?.due_on ?? "9999",
      );
    });

  const longDate = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <h1>Mor OS</h1>
        <span className={styles.date}>{longDate}</span>
      </div>

      <section className={styles.today} aria-labelledby="os-today">
        <h2 id="os-today" className={styles.sectionTitle}>
          להיום
          {todayItems.length ? (
            <span className={styles.count}>{todayItems.length}</span>
          ) : null}
        </h2>
        {todayItems.length ? (
          <ul className={styles.todayList}>
            {todayItems.map((i) => (
              <li key={i.id} className={styles.todayItem}>
                <DoneButton id={i.id} title={i.title} />
                <Due iso={i.due_on} today={today} />
                <span className={styles.todayTitle}>{i.title}</span>
                {i.project_id && titleOf.get(i.project_id) ? (
                  <span className={styles.projectTag}>
                    {titleOf.get(i.project_id)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>אין משימות להיום ✓</p>
        )}
      </section>

      <section aria-labelledby="os-projects">
        <h2 id="os-projects" className={styles.sectionTitle}>
          פרויקטים
        </h2>
        <div className={styles.cards}>
          {cards.map((c) => (
            <ProjectCard key={c.project.id} {...c} today={today} />
          ))}
        </div>
      </section>

      {general.length ? (
        <section className={styles.general} aria-labelledby="os-general">
          <h2 id="os-general" className={styles.sectionTitle}>
            כללי
          </h2>
          <ul className={styles.plain}>
            {general.map((i) => (
              <li key={i.id}>
                <DoneButton id={i.id} title={i.title} />
                <span>{i.title}</span>
                <Due iso={i.due_on} today={today} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
