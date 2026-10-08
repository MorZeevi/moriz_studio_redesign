"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProject,
  duplicateProject,
  setPublished,
} from "@/app/admin/actions";
import { CategoryTags } from "@/components/category-tags";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";
import styles from "./admin.module.css";
export function ProjectList({ projects }: { projects: Project[] }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
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
        setMessage(result.warning ?? "הפעולה הושלמה.");
        if (navigate && result.data)
          router.push(`/admin/projects/${result.data.id}`);
        else router.refresh();
      } catch {
        setError("הפעולה נכשלה. נסו שוב.");
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
      <div className={styles.list}>
        {projects.map((project) => (
          <article key={project.id} className={styles.row}>
            <div>
              <h2>{project.title}</h2>
              <p>{project.published ? "פורסם" : "טיוטה"}</p>
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
                onClick={() => run(() => duplicateProject(project.id), true)}
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
        ))}
      </div>
    </main>
  );
}
