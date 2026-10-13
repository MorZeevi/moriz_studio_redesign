"use client";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { removeUnusedUpload, saveProject } from "@/app/admin/actions";
import { ProjectDetail } from "@/components/project-detail";
import { ProjectsSection } from "@/components/projects-section";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { projectCopy } from "@/i18n/project-copy";
import {
  mediaUsage,
  replaceSrc,
  unlinkSrc,
  withGalleryImports,
} from "@/lib/cms/media-refs";
import { projectCard } from "@/lib/cms/project-card";
import {
  mediaReferences,
  projectReadiness,
  type ReadinessTab,
  slugify,
} from "@/lib/cms/validation";
import { CMS_SOURCE } from "@/lib/cms/source";
import type {
  Project,
  ProjectContentBlock,
  ProjectInput,
  ProjectMediaItem,
  Term,
  TermKind,
} from "@/types/project";
import { ContentEditor } from "./content-editor";
import { GalleryManager } from "./gallery-manager";
import { HighlightSelect, HighlightsEditor } from "./highlights-editor";
import { LocalizedField } from "./localized-field";
import { MediaUpload } from "./media-upload";
import { TermPicker, termLabels } from "./term-picker";
import styles from "./admin.module.css";

const TABS: [ReadinessTab, string][] = [
  ["general", "כללי"],
  ["cards", "עמוד הבית וארכיון"],
  ["case", "Case Study"],
  ["gallery", "גלריה"],
  ["seo", "הגדרות ו־SEO"],
];
type PreviewView = "case" | "home" | "archive";
/** Stable ids for legacy blocks, and every referenced file in the gallery. */
function prepare(project: ProjectInput): ProjectInput {
  return withGalleryImports({
    ...project,
    content: project.content.map((block) =>
      block.id ? block : { ...block, id: crypto.randomUUID() },
    ),
  });
}

export function ProjectEditor({
  initial,
  terms: initialTerms,
  content,
  isNew = false,
}: {
  initial: ProjectInput;
  terms: Term[];
  content: SiteContent;
  isNew?: boolean;
}) {
  const [project, setProject] = useState(() => prepare(initial));
  const [terms, setTerms] = useState(initialTerms);
  const [live, setLive] = useState(initial.published);
  const [tab, setTab] = useState<ReadinessTab>("general");
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [preview, setPreview] = useState<{
    view: PreviewView;
    locale: Locale;
  } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploads, setUploads] = useState(0);
  const [pending, start] = useTransition();
  const router = useRouter();
  const latest = useRef(project);
  latest.current = project;
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
  function change(update: (current: ProjectInput) => ProjectInput) {
    setProject(update);
    setDirty(true);
    setMessage("");
  }
  function field<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    change((current) => ({ ...current, [key]: value }));
  }
  /** Text inputs store null for empty values, like the database does. */
  function text(key: keyof ProjectInput) {
    return (value: string) =>
      change((current) => ({ ...current, [key]: value || null }));
  }
  /** Deletes a file from storage once nothing in the editor uses it. */
  function release(src: string) {
    setTimeout(() => {
      if (!mediaReferences(latest.current).includes(src))
        void removeUnusedUpload(src);
    }, 0);
  }
  const addMedia = useCallback((item: ProjectMediaItem) => {
    setProject((current) =>
      current.media.some((m) => m.src === item.src)
        ? current
        : { ...current, media: [...current.media, item] },
    );
    setDirty(true);
  }, []);
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
        setProject((current) => ({
          ...current,
          published,
          slug: current.slug?.trim() || null,
        }));
        setLive(published);
        setDirty(false);
        setSlugTouched(true);
        const saved = published
          ? "השינויים נשמרו והפרויקט מפורסם."
          : "הטיוטה נשמרה.";
        setMessage(
          result.warnings?.length
            ? `${saved} לתשומת לב: ${result.warnings.join(" ")}`
            : saved,
        );
        if (isNew) router.replace(`/admin/projects/${result.data.id}`);
      } catch {
        setError("השמירה נכשלה. הנתונים נשארו בעורך; נסו שוב.");
      }
    });
  }
  const saveRef = useRef(save);
  saveRef.current = () => {
    if (!pending && uploads === 0) save();
  };
  useEffect(() => {
    const shortcut = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const readiness = projectReadiness(project);
  const issuesIn = (id: ReadinessTab) =>
    readiness.errors.filter((e) => e.tab === id).length;
  const byKind = (kind: TermKind) => terms.filter((t) => t.kind === kind);
  const termProps = {
    onCreated: (term: Term) => setTerms((list) => [...list, term]),
  };
  const mediaProps = {
    projectId: project.id,
    onBusy: busy,
    onUploaded: addMedia,
    choices: project.media.filter((m) => m.role !== "logo"),
  };
  const previewProject: Project = {
    ...project,
    source: CMS_SOURCE,
    created_at: "",
    updated_at: "",
    categories: terms.filter((t) => project.category_ids.includes(t.id)),
    services: project.service_ids.flatMap((id) =>
      terms.filter((t) => t.id === id),
    ),
    type: terms.find((t) => t.id === project.type_id) ?? null,
  };
  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = { ArrowLeft: 1, ArrowRight: -1, Home: -index, End: 99 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(TABS.length - 1, index + step));
    setTab(TABS[next][0]);
    document.getElementById(`tab-${TABS[next][0]}`)?.focus();
  }
  const disabled = pending || uploads > 0;
  return (
    <main>
      <h1>{isNew ? "פרויקט חדש" : project.title || "עריכת פרויקט"}</h1>
      <div className={styles.toolbar}>
        <Button disabled={disabled} onClick={() => save()}>
          {pending
            ? "שומר…"
            : project.published
              ? "שמירת שינויים"
              : "שמירת טיוטה"}
        </Button>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() =>
            setPreview((value) =>
              value ? null : { view: "case", locale: "he" },
            )
          }
        >
          {preview ? "חזרה לעריכה" : "תצוגה מקדימה"}
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
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
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <p role="status" className={styles.status}>
          {uploads > 0 ? "מעלה מדיה…" : pending ? "שומר…" : message}
        </p>
      </div>
      <details className={styles.readiness}>
        <summary>
          {readiness.errors.length
            ? live
              ? `${readiness.errors.length} פריטים חסרים לעומת היעד לפרויקט מלא (הפרויקט כבר באוויר, הפרסום לא ייחסם)`
              : `${readiness.errors.length} פריטים חסרים לפני פרסום`
            : "מוכן לפרסום"}
          {readiness.warnings.length
            ? ` · ${readiness.warnings.length} המלצות`
            : ""}
        </summary>
        <ul>
          {readiness.errors.map((issue) => (
            <li key={issue.message} data-severity="error">
              <button type="button" onClick={() => setTab(issue.tab)}>
                {issue.message}
              </button>
            </li>
          ))}
          {readiness.warnings.map((issue) => (
            <li key={issue.message}>
              <button type="button" onClick={() => setTab(issue.tab)}>
                {issue.message}
              </button>
            </li>
          ))}
        </ul>
      </details>
      {preview ? (
        <>
          <div className={styles.inline}>
            <label className={styles.field}>
              <span>מה מציגים</span>
              <select
                value={preview.view}
                onChange={(e) =>
                  setPreview({
                    ...preview,
                    view: e.target.value as PreviewView,
                  })
                }
              >
                <option value="case">עמוד הפרויקט (Case Study)</option>
                <option value="home">כרטיס בעמוד הבית</option>
                <option value="archive">כרטיס בעמוד הפרויקטים</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>שפה</span>
              <select
                value={preview.locale}
                onChange={(e) =>
                  setPreview({ ...preview, locale: e.target.value as Locale })
                }
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          <p>
            תצוגה מקדימה פרטית של השינויים בעורך. התצוגה אינה שומרת או מפרסמת.
          </p>
          <div
            dir={preview.locale === "en" ? "ltr" : "rtl"}
            lang={preview.locale}
          >
            {preview.view === "case" ? (
              <ProjectDetail
                locale={preview.locale}
                content={content}
                preview
                project={previewProject}
              />
            ) : (
              <ProjectsSection
                locale={preview.locale}
                content={projectCopy[preview.locale]}
                plain
                collection={preview.view === "archive"}
                projects={[
                  projectCard(
                    previewProject,
                    preview.view === "home" ? "homepage" : "projects",
                    preview.locale,
                  ),
                ]}
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div role="tablist" aria-label="חלקי העורך" className={styles.tabs}>
            {TABS.map(([id, label], index) => (
              <button
                key={id}
                id={`tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={(e) => onTabKey(e, index)}
              >
                {label}
                {issuesIn(id) > 0 && (
                  <span className={styles.badge}>
                    {issuesIn(id)}
                    <span className="sr-only"> פריטים חסרים</span>
                  </span>
                )}
              </button>
            ))}
          </div>
          <fieldset disabled={disabled} className={styles.editorFields}>
            <div
              role="tabpanel"
              id="panel-general"
              aria-labelledby="tab-general"
              hidden={tab !== "general"}
            >
              <section className={styles.section}>
                <h2>פרטים בסיסיים</h2>
                <LocalizedField
                  label="שם הפרויקט"
                  maxLength={250}
                  required
                  value={project.title}
                  valueEn={project.title_en}
                  onChange={(title) =>
                    change((current) => ({
                      ...current,
                      title,
                      ...(!slugTouched ? { slug: slugify(title) || null } : {}),
                    }))
                  }
                  onChangeEn={text("title_en")}
                />
                <LocalizedField
                  label="לקוח"
                  value={project.client}
                  valueEn={project.client_en}
                  onChange={text("client")}
                  onChangeEn={text("client_en")}
                />
                <div className={styles.grid}>
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
                  <label className={styles.field}>
                    <span>כתובת האתר החי</span>
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://"
                      value={project.website_url ?? ""}
                      onChange={(e) =>
                        text("website_url")(e.target.value.trim())
                      }
                    />
                    <small>לא חובה. כשריק, הקישור לא יוצג.</small>
                  </label>
                </div>
                <LocalizedField
                  label="התפקיד שלי"
                  value={project.role}
                  valueEn={project.role_en}
                  onChange={text("role")}
                  onChangeEn={text("role_en")}
                />
              </section>
              <section className={styles.section}>
                <h2>{termLabels.type.heading}</h2>
                <TermPicker
                  {...termProps}
                  kind="type"
                  terms={byKind("type")}
                  selected={project.type_id ? [project.type_id] : []}
                  onChange={(ids) => field("type_id", ids[0] ?? null)}
                />
              </section>
              <section className={styles.section}>
                <h2>{termLabels.service.heading}</h2>
                <TermPicker
                  {...termProps}
                  kind="service"
                  terms={byKind("service")}
                  selected={project.service_ids}
                  onChange={(ids) => field("service_ids", ids)}
                />
              </section>
              <section className={styles.section}>
                <h2>{termLabels.category.heading}</h2>
                <p className={styles.hint}>
                  קטגוריות משמשות לסינון בעמוד הפרויקטים.
                </p>
                <TermPicker
                  {...termProps}
                  kind="category"
                  terms={byKind("category")}
                  selected={project.category_ids}
                  onChange={(ids) => field("category_ids", ids)}
                />
              </section>
            </div>
            <div
              role="tabpanel"
              id="panel-cards"
              aria-labelledby="tab-cards"
              hidden={tab !== "cards"}
            >
              <section className={styles.section}>
                <h2>מדיה ראשית</h2>
                <p className={styles.hint}>
                  הקאבר משמש גם כ־Hero בעמוד הפרויקט, ככרטיס בעמוד הבית וכברירת
                  מחדל בארכיון. אפשר תמונה או סרטון.
                </p>
                <MediaUpload
                  {...mediaProps}
                  kind="any"
                  label="תמונת קאבר"
                  value={project.cover_image_url}
                  onChange={(url) => field("cover_image_url", url)}
                />
              </section>
              <section className={styles.section}>
                <h2>עמוד הבית — פרויקטים נבחרים</h2>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={project.show_on_homepage}
                    onChange={(e) =>
                      field("show_on_homepage", e.target.checked)
                    }
                  />
                  פרויקט נבחר — הצגה בעמוד הבית
                </label>
                <LocalizedField
                  label="תיאור קצר לכרטיסי פרויקט"
                  hint="משפט אחד. מוצג בעמוד הבית, ובארכיון כשאין תיאור נפרד."
                  multiline
                  value={project.short_description}
                  valueEn={project.short_description_en}
                  onChange={text("short_description")}
                  onChangeEn={text("short_description_en")}
                />
                <HighlightSelect
                  label="היילייט בכרטיס בעמוד הבית"
                  flag="on_homepage"
                  highlights={project.highlights}
                  onChange={(highlights) => field("highlights", highlights)}
                />
                <details>
                  <summary>מדיה אחרת לעמוד הבית ומיקום ידני</summary>
                  <MediaUpload
                    {...mediaProps}
                    kind="any"
                    label="מדיה לעמוד הבית"
                    value={project.homepage_image_url}
                    onChange={(url) => field("homepage_image_url", url)}
                  />
                  <label className={styles.field}>
                    <span>סדר בעמוד הבית</span>
                    <input
                      type="number"
                      step={1}
                      value={project.homepage_order ?? ""}
                      onChange={(e) =>
                        field(
                          "homepage_order",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
                    <small>
                      מספר נמוך מופיע קודם. אפשר גם לגרור בעמוד רשימת הפרויקטים.
                    </small>
                  </label>
                </details>
              </section>
              <section className={styles.section}>
                <h2>עמוד הפרויקטים (ארכיון)</h2>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={project.show_on_projects}
                    onChange={(e) =>
                      field("show_on_projects", e.target.checked)
                    }
                  />
                  הצגה בעמוד הפרויקטים
                </label>
                <LocalizedField
                  label="תיאור לעמוד הפרויקטים"
                  hint="משפט או שניים. כשריק, מוצג התיאור הקצר."
                  multiline
                  value={project.archive_description}
                  valueEn={project.archive_description_en}
                  onChange={text("archive_description")}
                  onChangeEn={text("archive_description_en")}
                />
                <HighlightSelect
                  label="היילייט בכרטיס בעמוד הפרויקטים"
                  flag="on_archive"
                  highlights={project.highlights}
                  onChange={(highlights) => field("highlights", highlights)}
                />
                <details>
                  <summary>מדיה אחרת לארכיון ומיקום ידני</summary>
                  <MediaUpload
                    {...mediaProps}
                    kind="any"
                    label="מדיה לעמוד הפרויקטים"
                    value={project.projects_image_url}
                    onChange={(url) => field("projects_image_url", url)}
                  />
                  <label className={styles.field}>
                    <span>סדר בעמוד הפרויקטים</span>
                    <input
                      type="number"
                      step={1}
                      value={project.projects_order ?? ""}
                      onChange={(e) =>
                        field(
                          "projects_order",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
                  </label>
                </details>
              </section>
            </div>
            <div
              role="tabpanel"
              id="panel-case"
              aria-labelledby="tab-case"
              hidden={tab !== "case"}
            >
              <section className={styles.section}>
                <h2>Hero</h2>
                <LocalizedField
                  label="כותרת משנה"
                  value={project.headline}
                  valueEn={project.headline_en}
                  onChange={text("headline")}
                  onChangeEn={text("headline_en")}
                />
                <LocalizedField
                  label="תיאור הפרויקט"
                  hint="פתיח לעמוד הפרויקט: מה הפרויקט ולמי הוא נבנה."
                  multiline
                  value={project.description}
                  valueEn={project.description_en}
                  onChange={text("description")}
                  onChangeEn={text("description_en")}
                />
                <p className={styles.hint}>
                  מדיית ה־Hero היא הקאבר (לשונית עמוד הבית וארכיון). לקוח, שנה,
                  שירותים, תפקיד וקישור לאתר נערכים בלשונית כללי.
                </p>
              </section>
              <section className={styles.section}>
                <h2>קהל יעד</h2>
                <p className={styles.hint}>מוצג רק בעמוד הפרויקט.</p>
                <LocalizedField
                  label="קהל יעד"
                  value={project.target_audience}
                  valueEn={project.target_audience_en}
                  onChange={text("target_audience")}
                  onChangeEn={text("target_audience_en")}
                />
                <LocalizedField
                  label="תיאור קהל היעד"
                  multiline
                  value={project.audience_description}
                  valueEn={project.audience_description_en}
                  onChange={text("audience_description")}
                  onChangeEn={text("audience_description_en")}
                />
              </section>
              <section className={styles.section}>
                <h2>היילייטס</h2>
                <HighlightsEditor
                  highlights={project.highlights}
                  onChange={(highlights) => field("highlights", highlights)}
                />
              </section>
              <section className={styles.section}>
                <h2>תוכן הפרויקט</h2>
                <p className={styles.hint}>
                  אפשר להוסיף סקשנים מוכנים (אתגר, גישה, פתרון, עיצוב ופיתוח,
                  תוצר סופי) או בלוקים חופשיים, ולסדר, להסתיר ולשכפל אותם.
                  תמונות הגלריה שלא שובצו בבלוקים מוצגות בסוף העמוד.
                </p>
                <ContentEditor
                  projectId={project.id}
                  onBusy={busy}
                  onUploaded={addMedia}
                  media={project.media}
                  blocks={project.content}
                  update={(update) =>
                    change((current) => ({
                      ...current,
                      content: update(current.content) as ProjectContentBlock[],
                    }))
                  }
                />
              </section>
            </div>
            <div
              role="tabpanel"
              id="panel-gallery"
              aria-labelledby="tab-gallery"
              hidden={tab !== "gallery"}
            >
              <GalleryManager
                projectId={project.id}
                media={project.media}
                onBusy={busy}
                update={(update) =>
                  change((current) => ({
                    ...current,
                    media: update(current.media),
                  }))
                }
                usage={(src) => mediaUsage(project, src)}
                onRemove={(src) => {
                  change((current) => unlinkSrc(current, src));
                  release(src);
                }}
                onReplace={(from, to) => {
                  change((current) => {
                    const old = current.media.find((m) => m.src === from);
                    const next = replaceSrc(current, from, to.src);
                    return {
                      ...next,
                      media: next.media.map((m) =>
                        m.src === to.src
                          ? { ...old, ...to, poster: old?.poster }
                          : m,
                      ),
                    };
                  });
                  release(from);
                }}
                cover={project.cover_image_url}
                ogImage={project.og_image_url}
                onUseAsCover={(src) => field("cover_image_url", src)}
                onUseAsOg={(src) => field("og_image_url", src)}
              />
            </div>
            <div
              role="tabpanel"
              id="panel-seo"
              aria-labelledby="tab-seo"
              hidden={tab !== "seo"}
            >
              <section className={styles.section}>
                <h2>כתובת ופרסום</h2>
                <label className={styles.field}>
                  <span>כתובת הפרויקט (Slug)</span>
                  <input
                    value={project.slug ?? ""}
                    dir="ltr"
                    onChange={(e) => {
                      setSlugTouched(true);
                      field("slug", e.target.value || null);
                    }}
                  />
                  <small>
                    השאירו ריק כדי להציג פרויקט בלי עמוד נפרד (כרטיס בלבד).
                    שינוי כתובת של פרויקט שמור משנה את הקישור אליו.
                  </small>
                </label>
                <p>
                  סטטוס: {project.published ? "מפורסם" : "טיוטה — פרטית"}.
                  הפרסום וביטולו נעשים מסרגל הכלים למעלה.
                </p>
              </section>
              <section className={styles.section}>
                <h2>SEO ושיתוף</h2>
                <LocalizedField
                  label="כותרת SEO"
                  hint="כשריק: שם הפרויקט ושם הסטודיו."
                  maxLength={120}
                  value={project.seo_title}
                  valueEn={project.seo_title_en}
                  onChange={text("seo_title")}
                  onChangeEn={text("seo_title_en")}
                />
                <LocalizedField
                  label="תיאור SEO"
                  hint="כשריק: התיאור הקצר."
                  multiline
                  maxLength={300}
                  value={project.seo_description}
                  valueEn={project.seo_description_en}
                  onChange={text("seo_description")}
                  onChangeEn={text("seo_description_en")}
                />
                <MediaUpload
                  {...mediaProps}
                  choices={project.media.filter(
                    (m) =>
                      m.kind === "image" && /\.(jpg|png|webp)$/i.test(m.src),
                  )}
                  label="תמונת שיתוף (OG)"
                  value={project.og_image_url}
                  onChange={(url) => field("og_image_url", url)}
                />
                <p className={styles.hint}>
                  JPEG, PNG או WebP. כשריק, הקאבר משמש לשיתוף אם הוא תמונה.
                </p>
              </section>
            </div>
          </fieldset>
        </>
      )}
    </main>
  );
}
