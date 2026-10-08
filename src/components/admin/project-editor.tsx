"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, saveProject } from "@/app/admin/actions";
import { ProjectDetail } from "@/components/project-detail";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/cms/validation";
import type { SiteContent } from "@/i18n/dictionaries";
import type { Category, ProjectInput } from "@/types/project";
import { ContentEditor } from "./content-editor";
import { MediaUpload } from "./media-upload";
import { ServiceTags } from "./service-tags";
import styles from "./admin.module.css";

export function ProjectEditor({
  initial,
  categories: initialCategories,
  services,
  content,
  isNew = false,
}: {
  initial: ProjectInput;
  categories: Category[];
  services: string[];
  content: SiteContent;
  isNew?: boolean;
}) {
  const [project, setProject] = useState(initial);
  const [categories, setCategories] = useState(initialCategories);
  const [categoryName, setCategoryName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploads, setUploads] = useState(0);
  const [pending, start] = useTransition();
  const router = useRouter();
  const busy = useCallback(
    (value: boolean) =>
      setUploads((count) => Math.max(0, count + (value ? 1 : -1))),
    [],
  );
  useEffect(() => {
    if (!dirty) return;
    const leave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (
        !link ||
        link.target === "_blank" ||
        link.getAttribute("href")?.startsWith("#")
      )
        return;
      if (!window.confirm("יש שינויים שלא נשמרו. לעזוב את העמוד?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", leave);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", leave);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  function field<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setProject((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setMessage("");
  }
  function save(published = project.published) {
    setError("");
    setMessage("");
    start(async () => {
      try {
        const result = await saveProject({ ...project, published });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setProject((current) => ({ ...current, published }));
        setDirty(false);
        setSlugTouched(true);
        setMessage(
          result.warning ??
            (published ? "השינויים נשמרו והפרויקט מפורסם." : "הטיוטה נשמרה."),
        );
        if (isNew) router.replace(`/admin/projects/${result.data.id}`);
      } catch {
        setError("השמירה נכשלה. הנתונים נשארו בעורך; נסו שוב.");
      }
    });
  }
  const selected = categories.filter((c) =>
    project.category_ids.includes(c.id),
  );
  const mediaProps = { projectId: project.id, onBusy: busy };
  const textFields: [
    keyof Pick<
      ProjectInput,
      "client" | "headline" | "short_description" | "description"
    >,
    string,
  ][] = [
    ["client", "לקוח"],
    ["headline", "כותרת משנה"],
    ["short_description", "תיאור קצר לכרטיסי פרויקט"],
    ["description", "תיאור הפרויקט"],
  ];
  return (
    <main>
      <h1>{isNew ? "פרויקט חדש" : project.title || "עריכת פרויקט"}</h1>
      <div className={styles.toolbar}>
        <Button disabled={pending || uploads > 0} onClick={() => save()}>
          {pending
            ? "שומר…"
            : project.published
              ? "שמירת שינויים"
              : "שמירת טיוטה"}
        </Button>
        <Button
          variant="outline"
          disabled={pending || uploads > 0}
          onClick={() => setPreview((value) => !value)}
        >
          {preview ? "חזרה לעריכה" : "תצוגה מקדימה"}
        </Button>
        <Button
          variant="secondary"
          disabled={pending || uploads > 0}
          onClick={() => {
            if (project.published) {
              if (window.confirm("לבטל את הפרסום? הפרויקט יוסר מהאתר הציבורי."))
                save(false);
            } else save(true);
          }}
        >
          {project.published ? "ביטול פרסום" : "פרסום"}
        </Button>
        <span>
          {project.published
            ? "פורסם — שמירת שינויים מעדכנת את האתר"
            : "טיוטה — פרטית"}
          {dirty ? " · שינויים שלא נשמרו" : ""}
        </span>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <p role="status" className={styles.status}>
        {uploads > 0 ? "מעלה מדיה…" : pending ? "שומר…" : message}
      </p>
      {preview ? (
        <>
          <p>
            תצוגה מקדימה פרטית של השינויים בעורך. התצוגה אינה שומרת או מפרסמת.
          </p>
          <ProjectDetail
            locale="he"
            content={content}
            preview
            project={{
              ...project,
              created_at: "",
              updated_at: "",
              categories: selected,
            }}
          />
        </>
      ) : (
        <fieldset
          disabled={pending || uploads > 0}
          className={styles.editorFields}
        >
          <section className={styles.section}>
            <h2>פרטים בסיסיים</h2>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>שם הפרויקט</span>
                <input
                  value={project.title}
                  dir="auto"
                  maxLength={250}
                  required
                  onChange={(e) => {
                    const title = e.target.value;
                    setProject((current) => ({
                      ...current,
                      title,
                      ...(!slugTouched ? { slug: slugify(title) } : {}),
                    }));
                    setDirty(true);
                  }}
                />
              </label>
              <label className={styles.field}>
                <span>כתובת הפרויקט (Slug)</span>
                <input
                  value={project.slug}
                  dir="ltr"
                  required
                  onChange={(e) => {
                    setSlugTouched(true);
                    field("slug", e.target.value);
                  }}
                />
                <small>שינוי כתובת של פרויקט שמור משנה את הקישור אליו.</small>
              </label>
              <label className={styles.field}>
                <span>שנה</span>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={project.year ?? ""}
                  onChange={(e) =>
                    field(
                      "year",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </label>
              {textFields.map(([key, label]) => (
                <label
                  key={key}
                  htmlFor={`project-${key}`}
                  className={styles.field}
                >
                  <span>{label}</span>
                  {key === "description" || key === "short_description" ? (
                    <textarea
                      id={`project-${key}`}
                      dir="auto"
                      value={project[key] ?? ""}
                      onChange={(e) => field(key, e.target.value || null)}
                    />
                  ) : (
                    <input
                      id={`project-${key}`}
                      dir="auto"
                      value={project[key] ?? ""}
                      onChange={(e) => field(key, e.target.value || null)}
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <h2>קטגוריות</h2>
            <div className={styles.tags}>
              {selected.map((category) => (
                <span key={category.id} className={styles.tag}>
                  {category.name}
                  <button
                    type="button"
                    aria-label={`הסרת קטגוריה ${category.name}`}
                    onClick={() =>
                      field(
                        "category_ids",
                        project.category_ids.filter((id) => id !== category.id),
                      )
                    }
                  >
                    הסרה
                  </button>
                </span>
              ))}
            </div>
            <label className={styles.field}>
              <span>הוספת קטגוריה לפרויקט</span>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    field("category_ids", [
                      ...project.category_ids,
                      e.target.value,
                    ]);
                }}
              >
                <option value="">בחרו קטגוריה</option>
                {categories
                  .filter((c) => !project.category_ids.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className={styles.inline}>
              <label className={styles.field}>
                <span>יצירת קטגוריה משותפת חדשה</span>
                <input
                  dir="auto"
                  maxLength={100}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </label>
              <Button
                variant="outline"
                disabled={!categoryName.trim()}
                onClick={() => {
                  setError("");
                  start(async () => {
                    try {
                      const result = await createCategory(categoryName);
                      if (result.ok) {
                        setCategories((items) => [...items, result.data]);
                        field("category_ids", [
                          ...project.category_ids,
                          result.data.id,
                        ]);
                        setCategoryName("");
                      } else setError(result.error);
                    } catch {
                      setError("לא ניתן ליצור קטגוריה כרגע.");
                    }
                  });
                }}
              >
                יצירת קטגוריה
              </Button>
            </div>
          </section>
          <section className={styles.section}>
            <h2>שירותים</h2>
            <ServiceTags
              values={project.services}
              suggestions={services}
              onChange={(values) => field("services", values)}
            />
          </section>
          <section className={styles.section}>
            <h2>תמונות הפרויקט</h2>
            <p className={styles.hint}>
              בדרך כלל מספיקה תמונת קאבר. התמונות הנוספות אופציונליות.
            </p>
            <MediaUpload
              {...mediaProps}
              label="תמונת קאבר"
              value={project.cover_image_url}
              onChange={(url) => field("cover_image_url", url)}
            />
            <details>
              <summary>גרסאות תמונה מיוחדות לעמוד הבית ולפרויקטים</summary>
              <div className={styles.grid}>
                <MediaUpload
                  {...mediaProps}
                  label="תמונה לעמוד הבית"
                  value={project.homepage_image_url}
                  onChange={(url) => field("homepage_image_url", url)}
                />
                <MediaUpload
                  {...mediaProps}
                  label="תמונה לעמוד הפרויקטים"
                  value={project.projects_image_url}
                  onChange={(url) => field("projects_image_url", url)}
                />
              </div>
            </details>
          </section>
          <section className={styles.section}>
            <h2>תוכן הפרויקט</h2>
            <ContentEditor
              {...mediaProps}
              blocks={project.content}
              onChange={(blocks) => field("content", blocks)}
            />
          </section>
          <section className={styles.section}>
            <h2>הגדרות פרסום</h2>
            {(
              ["show_on_homepage", "show_on_projects", "featured"] as const
            ).map((key) => (
              <label key={key} className={styles.check}>
                <input
                  type="checkbox"
                  checked={project[key]}
                  onChange={(e) => field(key, e.target.checked)}
                />
                {
                  {
                    show_on_homepage: "הצגה בעמוד הבית",
                    show_on_projects: "הצגה בעמוד הפרויקטים",
                    featured: "פרויקט נבחר",
                  }[key]
                }
              </label>
            ))}
            <div className={styles.grid}>
              {(["homepage_order", "projects_order"] as const).map((key) => (
                <label key={key} className={styles.field}>
                  <span>
                    {key === "homepage_order"
                      ? "סדר בעמוד הבית"
                      : "סדר בעמוד הפרויקטים"}
                  </span>
                  <input
                    type="number"
                    step={1}
                    value={project[key] ?? ""}
                    onChange={(e) =>
                      field(
                        key,
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                  <small>מספר נמוך מופיע קודם. ללא מספר — בסוף הרשימה.</small>
                </label>
              ))}
            </div>
          </section>
        </fieldset>
      )}
    </main>
  );
}
