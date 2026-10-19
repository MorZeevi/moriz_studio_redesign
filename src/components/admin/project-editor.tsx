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
import { ProjectArchiveCardPreview } from "@/components/project-archive-card";
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
import { projectArchiveCard, projectCard } from "@/lib/cms/project-card";
import {
  setHoverMedia,
  setUserCount,
  userCountHighlight,
  type HoverSurface,
} from "@/lib/cms/card-options";
import {
  addToGallery,
  galleryRows,
  removeFromGallery,
  rowsFrom,
  withGalleryRows,
} from "@/lib/cms/gallery-rows";
import { projectTypeOptions } from "@/lib/cms/project-types";
import {
  galleryRowsBlock,
  mediaReferences,
  MAX_HIGHLIGHTS,
  projectReadiness,
  type ReadinessTab,
  slugify,
} from "@/lib/cms/validation";
import { legacyGalleryRows } from "@/lib/project-presentation";
import { CMS_SOURCE } from "@/lib/cms/source";
import type {
  GalleryRow,
  ManagedKind,
  Project,
  ProjectContentBlock,
  ProjectInput,
  ProjectMediaItem,
  Term,
} from "@/types/project";
import { ContentEditor } from "./content-editor";
import { LogoField, MainVideoField } from "./gallery-manager";
import { GalleryRowsEditor } from "./gallery-rows-editor";
import { HighlightSelect, HighlightsEditor } from "./highlights-editor";
import { LocalizedField } from "./localized-field";
import { MediaUpload } from "./media-upload";
import { PanelBackgroundEditor } from "./panel-background-editor";
import { TermPicker, termLabels } from "./term-picker";
import styles from "./admin.module.css";

type Tab = "details" | "case";
const TABS: [Tab, string][] = [
  ["details", "פרטי הפרויקט"],
  ["case", "Case Study"],
];
/** Where each readiness issue is fixed: tab, and the section to show. */
const ISSUE_PLACES: Record<ReadinessTab, [Tab, string]> = {
  general: ["details", "section-details"],
  cards: ["details", "section-cards"],
  seo: ["details", "section-seo"],
  case: ["case", "section-case"],
  gallery: ["case", "section-gallery"],
};
const CASE_SECTIONS: [string, string][] = [
  ["section-case", "תוכן הקייס"],
  ["section-gallery", "גלריה"],
  ["section-panel", "פאנל צדדי"],
  ["section-highlights", "היילייטס"],
];
type PreviewView = "case" | "home" | "archive";
/**
 * Stable ids for legacy blocks, every referenced file in the project media,
 * and gallery rows. A project without rows gets the rows its page already
 * shows, so saving it changes nothing on the site.
 */
function prepare(project: ProjectInput): ProjectInput {
  const prepared = withGalleryImports({
    ...project,
    content: project.content.map((block) =>
      block.id ? block : { ...block, id: crypto.randomUUID() },
    ),
  });
  if (galleryRowsBlock(prepared.content)) return prepared;
  return {
    ...prepared,
    content: withGalleryRows(
      prepared.content,
      rowsFrom(legacyGalleryRows(prepared)),
    ),
  };
}
function timeNow() {
  return new Date().toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
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
  const [tab, setTab] = useState<Tab>("details");
  const [savedAt, setSavedAt] = useState("");
  const advanced = useRef<HTMLDetailsElement>(null);
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
        setSavedAt(timeNow());
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
  const issuesIn = (id: Tab) =>
    readiness.errors.filter((e) => ISSUE_PLACES[e.tab][0] === id).length;
  /** Opens the tab (and collapsed section) where an issue is fixed. */
  function showIssue(section: ReadinessTab) {
    const [target, anchor] = ISSUE_PLACES[section];
    setTab(target);
    if ((section === "cards" || section === "seo") && advanced.current)
      advanced.current.open = true;
    requestAnimationFrame(() =>
      document
        .getElementById(anchor)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }
  const rows = galleryRows(project.content);
  function setRows(update: (rows: GalleryRow[]) => GalleryRow[]) {
    change((current) => ({
      ...current,
      content: withGalleryRows(
        current.content,
        update(galleryRows(current.content)),
      ),
    }));
  }
  /** Removes a file from the whole project, then from storage. */
  function deleteFile(src: string) {
    change((current) => unlinkSrc(current, src));
    release(src);
  }
  const typeOptions = projectTypeOptions(terms);
  const legacyType =
    project.type_id &&
    !typeOptions.some((option) => option.term?.id === project.type_id)
      ? terms.find((t) => t.id === project.type_id)
      : undefined;
  // Legacy service rows are categories until the data migration converts them.
  const byKind = (kind: ManagedKind) =>
    terms.filter((t) =>
      kind === "category" ? t.kind !== "type" : t.kind === kind,
    );
  const termProps = {
    onCreated: (term: Term) => setTerms((list) => [...list, term]),
  };
  const mediaProps = {
    projectId: project.id,
    onBusy: busy,
    onUploaded: addMedia,
    choices: project.media.filter((m) => m.role !== "logo"),
  };
  const userCount = userCountHighlight(project.highlights);
  const canAddUserCount =
    Boolean(userCount) || project.highlights.length < MAX_HIGHLIGHTS;
  function hoverField(surface: HoverSurface, label: string) {
    const flag = surface === "homepage" ? "hover_homepage" : "hover_projects";
    return (
      <MediaUpload
        {...mediaProps}
        kind="any"
        label={label}
        value={project.media.find((item) => item[flag])?.src ?? null}
        onChange={(src) =>
          change((current) => ({
            ...current,
            media: setHoverMedia(current.media, surface, src),
          }))
        }
      />
    );
  }
  const previewProject: Project = {
    ...project,
    source: CMS_SOURCE,
    created_at: "",
    updated_at: "",
    categories: terms.filter((t) => project.category_ids.includes(t.id)),
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
        </span>
        {dirty ? (
          <span className={styles.saved}>
            <span className={styles.dirtyDot} aria-hidden="true" />
            שינויים שלא נשמרו
          </span>
        ) : (
          savedAt && <span className={styles.saved}>נשמר ✓ {savedAt}</span>
        )}
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
              <button type="button" onClick={() => showIssue(issue.tab)}>
                {issue.message}
              </button>
            </li>
          ))}
          {readiness.warnings.map((issue) => (
            <li key={issue.message}>
              <button type="button" onClick={() => showIssue(issue.tab)}>
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
            ) : preview.view === "archive" ? (
              <ProjectArchiveCardPreview
                project={projectArchiveCard(previewProject, preview.locale)}
                badgeLabel={projectCopy[preview.locale].viewProject}
              />
            ) : (
              <ProjectsSection
                locale={preview.locale}
                content={projectCopy[preview.locale]}
                plain
                projects={[
                  projectCard(previewProject, "homepage", preview.locale),
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
              id="panel-details"
              aria-labelledby="tab-details"
              hidden={tab !== "details"}
            >
              <section id="section-details" className={styles.section}>
                <h2>פרטי הפרויקט</h2>
                <p className={styles.hint}>
                  מוצגים בפאנל הצדדי של עמוד הפרויקט באותו סדר. שדה ריק לא יוצג.
                </p>
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
                  label="תיאור קצר"
                  hint="שורה אחת. מוצג בעמוד הבית בשורה של שם הפרויקט, ובכרטיס בעמוד הפרויקטים כשאין תיאור נפרד."
                  multiline
                  value={project.short_description}
                  valueEn={project.short_description_en}
                  onChange={text("short_description")}
                  onChangeEn={text("short_description_en")}
                />
                <LocalizedField
                  label="תיאור הפרויקט"
                  hint="תיאור מלא. מוצג בעמוד הבית לצד תמונת הפרויקט, מעל מספר המשתמשים והקטגוריות, וגם בעמוד הפרויקט."
                  multiline
                  value={project.description}
                  valueEn={project.description_en}
                  onChange={text("description")}
                  onChangeEn={text("description_en")}
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
                      dir="ltr"
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
                </div>
                <LocalizedField
                  label="התפקיד שלי"
                  value={project.role}
                  valueEn={project.role_en}
                  onChange={text("role")}
                  onChangeEn={text("role_en")}
                />
                <div className={styles.grid}>
                  <label className={styles.field}>
                    <span>מספר משתמשים</span>
                    <input
                      aria-label="מספר משתמשים"
                      aria-describedby="project-user-count-hint"
                      dir="ltr"
                      maxLength={40}
                      placeholder="10,000+"
                      value={userCount?.value ?? ""}
                      disabled={!canAddUserCount}
                      onChange={(e) =>
                        change((current) => ({
                          ...current,
                          highlights: setUserCount(
                            current.highlights,
                            e.target.value,
                          ),
                        }))
                      }
                    />
                    <small id="project-user-count-hint">
                      {canAddUserCount
                        ? "לא חובה. טקסט חופשי, למשל 10,000+ או 6K+."
                        : "כבר יש שלוש עובדות בפרויקט. הסירו היילייט בלשונית Case Study כדי להוסיף מספר משתמשים."}
                    </small>
                  </label>
                  <label className={styles.field}>
                    <span>סוג הפרויקט</span>
                    <select
                      aria-label="סוג הפרויקט"
                      value={project.type_id ?? ""}
                      onChange={(e) =>
                        field("type_id", e.target.value || null)
                      }
                    >
                      <option value="">לא נבחר</option>
                      {typeOptions.map((option) => (
                        <option
                          key={option.slug}
                          value={option.term?.id ?? `missing:${option.slug}`}
                          disabled={!option.term}
                        >
                          {option.name}
                        </option>
                      ))}
                      {legacyType && (
                        <option value={legacyType.id}>
                          {legacyType.name} (לא ברשימה, יש לבחור סוג אחר)
                        </option>
                      )}
                    </select>
                  </label>
                </div>
                <label className={styles.field}>
                  <span>קישור לאתר הפרויקט</span>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://"
                    aria-label="קישור לאתר הפרויקט"
                    aria-describedby="project-website-hint"
                    value={project.website_url ?? ""}
                    onChange={(e) => text("website_url")(e.target.value.trim())}
                  />
                  <small id="project-website-hint">
                    מוצג ככפתור ״מעבר לאתר״ בפאנל הצדדי. כשריק, הכפתור לא מוצג.
                  </small>
                </label>
              </section>
              <section id="section-media" className={styles.section}>
                <h2>מדיה ראשית</h2>
                <p className={styles.hint}>
                  התמונה הראשית פותחת את עמוד הפרויקט (חתוכה ל־16:9; בהגדלה היא
                  מוצגת במלואה) ומשמשת גם לכרטיסי הפרויקט. הסרטון הראשי מוצג מיד
                  אחריה, מושתק ובלולאה, רק כשהוא על המסך.
                </p>
                <div className={styles.mainMedia}>
                  <MediaUpload
                    {...mediaProps}
                    kind="any"
                    label="תמונה ראשית"
                    value={project.cover_image_url}
                    onChange={(url) => field("cover_image_url", url)}
                  />
                  <MainVideoField
                    projectId={project.id}
                    media={project.media}
                    onBusy={busy}
                    update={(update) =>
                      change((current) => ({
                        ...current,
                        media: update(current.media),
                      }))
                    }
                    onSelect={(src) =>
                      change((current) => ({
                        ...current,
                        // One main video; it leaves the gallery rows.
                        media: current.media.map((m) =>
                          m.src === src
                            ? { ...m, role: "main_video" }
                            : m.role === "main_video"
                              ? { ...m, role: undefined }
                              : m,
                        ),
                        content: src
                          ? withGalleryRows(
                              current.content,
                              removeFromGallery(
                                galleryRows(current.content),
                                src,
                              ),
                            )
                          : current.content,
                      }))
                    }
                  />
                </div>
              </section>
              <details ref={advanced} className={styles.advanced}>
                <summary>הגדרות נוספות: קטגוריות, כרטיסים, כתובת ו־SEO</summary>
                <section className={styles.section}>
                  <h2>{termLabels.category.heading}</h2>
                  <p className={styles.hint}>
                    מוצגות כתגיות בפרויקט ומשמשות לסינון בעמוד הפרויקטים.
                  </p>
                  <TermPicker
                    {...termProps}
                    kind="category"
                    terms={byKind("category")}
                    selected={project.category_ids}
                    onChange={(ids) => field("category_ids", ids)}
                  />
                </section>
                <section id="section-cards" className={styles.section}>
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
                  <HighlightSelect
                    label="היילייט בכרטיס בעמוד הבית"
                    flag="on_homepage"
                    highlights={project.highlights}
                    onChange={(highlights) => field("highlights", highlights)}
                  />
                  {hoverField("homepage", "מדיה במעבר עכבר — עמוד הבית")}
                  <p className={styles.hint}>
                    תמונה או סרטון שיוצגו במעבר עכבר ובמיקוד מקלדת. במסכי מגע
                    נשארת המדיה הראשית. כשריק, הסרטון הראשי מתנגן במעבר עכבר, אם
                    הוגדר. להצגה גם בעמוד הפרויקט, הוסיפו את הקובץ לגלריה.
                  </p>
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
                        dir="ltr"
                        step={1}
                        value={project.homepage_order ?? ""}
                        onChange={(e) =>
                          field(
                            "homepage_order",
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                      />
                      <small>
                        מספר נמוך מופיע קודם. אפשר גם לגרור בעמוד רשימת
                        הפרויקטים.
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
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={project.featured}
                      onChange={(e) => field("featured", e.target.checked)}
                    />
                    מודגש בעמוד הפרויקטים — כרטיס גדול בתצוגת המגזין
                  </label>
                  <LocalizedField
                    label="תיאור לעמוד הפרויקטים"
                    hint="משפט או שניים. כשריק, מוצג התיאור הקצר מפרטי הפרויקט."
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
                  {hoverField("projects", "מדיה במעבר עכבר — עמוד הפרויקטים")}
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
                        dir="ltr"
                        step={1}
                        value={project.projects_order ?? ""}
                        onChange={(e) =>
                          field(
                            "projects_order",
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                      />
                    </label>
                  </details>
                </section>
                <section id="section-seo" className={styles.section}>
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
                    JPEG, PNG או WebP. כשריק, התמונה הראשית משמשת לשיתוף אם היא
                    תמונה.
                  </p>
                </section>
              </details>
            </div>
            <div
              role="tabpanel"
              id="panel-case"
              aria-labelledby="tab-case"
              hidden={tab !== "case"}
            >
              <nav aria-label="חלקי ה־Case Study" className={styles.subnav}>
                {CASE_SECTIONS.map(([id, label]) => (
                  <a key={id} href={`#${id}`}>
                    {label}
                  </a>
                ))}
              </nav>
              <section id="section-case" className={styles.section}>
                <h2>תוכן הקייס</h2>
                <p className={styles.hint}>
                  הפתיח, קהל היעד והטקסטים מוצגים בפאנל הצדדי כאקורדיונים, לפי
                  הסדר כאן. בלוקי מדיה מוצגים בעמודת המדיה, לפני הגלריה.
                </p>
                <h3>פתיח</h3>
                <LocalizedField
                  label="כותרת משנה"
                  value={project.headline}
                  valueEn={project.headline_en}
                  onChange={text("headline")}
                  onChangeEn={text("headline_en")}
                />
                <h3>קהל יעד</h3>
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
                <h3>בלוקי תוכן</h3>
                <p className={styles.hint}>
                  אפשר להוסיף סקשנים מוכנים (אתגר, גישה, פתרון, עיצוב ופיתוח,
                  תוצר סופי) או בלוקים חופשיים, ולסדר, להסתיר ולשכפל אותם.
                </p>
                <ContentEditor
                  projectId={project.id}
                  onBusy={busy}
                  onUploaded={addMedia}
                  media={project.media}
                  blocks={project.content.filter(
                    (block) => block.type !== "gallery_rows",
                  )}
                  update={(update) =>
                    change((current) => ({
                      ...current,
                      content: [
                        ...(update(
                          current.content.filter(
                            (block) => block.type !== "gallery_rows",
                          ),
                        ) as ProjectContentBlock[]),
                        ...current.content.filter(
                          (block) => block.type === "gallery_rows",
                        ),
                      ],
                    }))
                  }
                />
              </section>
              <section id="section-gallery" className={styles.section}>
                <h2>גלריה</h2>
                <GalleryRowsEditor
                  projectId={project.id}
                  media={project.media}
                  rows={rows}
                  setRows={setRows}
                  onBusy={busy}
                  update={(update) =>
                    change((current) => ({
                      ...current,
                      media: update(current.media),
                    }))
                  }
                  onUploaded={(item) =>
                    change((current) => ({
                      ...current,
                      media: current.media.some((m) => m.src === item.src)
                        ? current.media
                        : [...current.media, item],
                      content: withGalleryRows(
                        current.content,
                        addToGallery(galleryRows(current.content), item.src),
                      ),
                    }))
                  }
                  usage={(src) => mediaUsage(project, src)}
                  onDelete={deleteFile}
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
              </section>
              <section id="section-panel" className={styles.section}>
                <h2>פאנל צדדי</h2>
                <p className={styles.hint}>
                  הלוגו מוצג בראש הפאנל, מעל שם הפרויקט. SVG, PNG או WebP;
                  השקיפות נשמרת.
                </p>
                <LogoField
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
                  onRemove={deleteFile}
                />
              </section>
              <PanelBackgroundEditor
                panelStyle={project.panel_style}
                onChange={(panel_style) => field("panel_style", panel_style)}
              />
              <section id="section-highlights" className={styles.section}>
                <h2>היילייטס</h2>
                <HighlightsEditor
                  highlights={project.highlights}
                  onChange={(highlights) => field("highlights", highlights)}
                />
              </section>
            </div>
          </fieldset>
        </>
      )}
    </main>
  );
}
