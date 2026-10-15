"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProject,
  duplicateProject,
  reorderProjects,
  setPublished,
} from "@/app/admin/actions";
import { CategoryTags } from "@/components/category-tags";
import { Button } from "@/components/ui/button";
import { projectReadiness } from "@/lib/cms/validation";
import type { Project, ProjectInput } from "@/types/project";
import { moveItem, SortableList } from "./sortable-list";
import styles from "./admin.module.css";

type Mode = "all" | "homepage" | "projects";
function asInput(project: Project): ProjectInput {
  return {
    ...project,
    category_ids: project.categories.map((t) => t.id),
    type_id: project.type?.id ?? null,
  };
}
/** Projects in the order a public surface shows them. */
function surfaceOrder(projects: Project[], surface: "homepage" | "projects") {
  const key = surface === "homepage" ? "homepage_order" : "projects_order";
  const visible =
    surface === "homepage" ? "show_on_homepage" : "show_on_projects";
  return projects
    .filter((p) => p[visible])
    .sort(
      (a, b) =>
        (a[key] ?? Number.MAX_SAFE_INTEGER) -
          (b[key] ?? Number.MAX_SAFE_INTEGER) ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id),
    );
}
export function ProjectList({ projects }: { projects: Project[] }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("all");
  const [order, setOrder] = useState<Project[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();
  function run(
    action: () =>
      | ReturnType<typeof duplicateProject>
      | ReturnType<typeof deleteProject>,
    navigate = false,
  ) {
    setError("");
    setMessage("");
    start(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage(result.warnings?.join(" ") || "הפעולה הושלמה.");
        if (navigate && result.data)
          router.push(`/admin/projects/${result.data.id}`);
        else router.refresh();
      } catch {
        setError("הפעולה נכשלה. נסו שוב.");
      }
    });
  }
  function choose(next: Mode) {
    setMode(next);
    setMessage("");
    if (next !== "all") setOrder(surfaceOrder(projects, next));
  }
  function move(from: number, to: number) {
    if (mode === "all") return;
    const next = moveItem(order, from, to);
    setOrder(next);
    setError("");
    start(async () => {
      try {
        const result = await reorderProjects(
          mode,
          next.map((p) => p.id),
        );
        if (result.ok) {
          setMessage("הסדר נשמר.");
          router.refresh();
        } else setError(result.error);
      } catch {
        setError("לא ניתן לשמור את הסדר. נסו שוב.");
      }
    });
  }
  return (
    <main>
      <div className={styles.row}>
        <h1>פרויקטים</h1>
        <Link
          className="button button--primary button--md"
          href="/admin/projects/new"
        >
          פרויקט חדש
        </Link>
      </div>
      <fieldset className={styles.subnav}>
        <legend className="sr-only">תצוגת רשימה</legend>
        {(
          [
            ["all", "כל הפרויקטים"],
            ["homepage", "סדר בעמוד הבית"],
            ["projects", "סדר בעמוד הפרויקטים"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={mode === value ? "primary" : "ghost"}
            aria-pressed={mode === value}
            onClick={() => choose(value)}
          >
            {label}
          </Button>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <p role="status" className={styles.status}>
        {pending ? "שומר…" : message}
      </p>
      {!projects.length && (
        <p className={styles.empty}>
          עדיין אין פרויקטים. התחילו עם פרויקט חדש.
        </p>
      )}
      {mode !== "all" ? (
        <>
          <p className={styles.hint}>
            גררו או השתמשו בכפתורים כדי לקבוע את הסדר. רק פרויקטים מפורסמים
            מוצגים באתר. הסדר נשמר מיד.
          </p>
          <SortableList
            className={styles.list}
            items={order}
            type="project"
            disabled={pending}
            itemKey={(p) => p.id}
            label={(p) => p.title}
            onMove={move}
            render={(project, index, handle) => (
              <article className={styles.row}>
                <div>
                  <h2>
                    {index + 1}. {project.title}
                  </h2>
                  <p>{project.published ? "פורסם" : "טיוטה — לא מוצג באתר"}</p>
                </div>
                {handle}
              </article>
            )}
          />
        </>
      ) : (
        <div className={styles.list}>
          {projects.map((project) => {
            const { errors } = projectReadiness(asInput(project));
            return (
              <article key={project.id} className={styles.row}>
                <div>
                  <h2>{project.title}</h2>
                  <p>
                    {project.published ? "פורסם" : "טיוטה"}
                    {project.show_on_homepage ? " · בעמוד הבית" : ""}
                    {errors.length ? (
                      <span className={styles.badge}>
                        {errors.length} חסרים לפרויקט מלא
                      </span>
                    ) : (
                      <span className={styles.badgeOk}>מלא</span>
                    )}
                  </p>
                  <CategoryTags categories={project.categories} />
                </div>
                <div className={styles.actions}>
                  <Link
                    className="button button--outline button--sm"
                    href={`/admin/projects/${project.id}`}
                  >
                    עריכה
                  </Link>
                  <Link href={`/admin/projects/${project.id}/preview`}>
                    תצוגה מקדימה
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      run(() => setPublished(project.id, !project.published))
                    }
                  >
                    {project.published ? "ביטול פרסום" : "פרסום"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      run(() => duplicateProject(project.id), true)
                    }
                  >
                    שכפול
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `למחוק את "${project.title}"? הפעולה אינה ניתנת לביטול.`,
                        )
                      )
                        run(() => deleteProject(project.id));
                    }}
                  >
                    מחיקה
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
