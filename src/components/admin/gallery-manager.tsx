"use client";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  galleryImages,
  isSvgSrc,
  MIN_GALLERY_IMAGES,
} from "@/lib/cms/validation";
import type { MediaLayout, ProjectMediaItem } from "@/types/project";
import { LocalizedField } from "./localized-field";
import { MediaPreview, MediaUpload } from "./media-upload";
import { moveItem, SortableList } from "./sortable-list";
import {
  acceptedTypes,
  checkFile,
  type UploadKind,
  uploadFile,
} from "./upload";
import styles from "./admin.module.css";

// Used when no block places the file: explicit layouts stand alone, the rest
// pair up at the end of the case study.
const LAYOUTS: [MediaLayout | "", string][] = [
  ["", "אוטומטית — בזוגות"],
  ["full", "רוחב מלא"],
  ["center", "מרכז — שני שלישים"],
  ["start", "תחילת שורה — חצי רוחב"],
  ["end", "סוף שורה — חצי רוחב"],
];
function fileName(src: string) {
  return src.split("/").pop() ?? src;
}

export function GalleryManager({
  projectId,
  media,
  update,
  onBusy,
  usage,
  onRemove,
  onReplace,
  cover,
  ogImage,
  onUseAsCover,
  onUseAsOg,
}: {
  projectId: string;
  media: ProjectMediaItem[];
  /** Functional update, so several uploads in a row all land. */
  update: (change: (media: ProjectMediaItem[]) => ProjectMediaItem[]) => void;
  onBusy: (busy: boolean) => void;
  /** Readable places where a file is used in the unsaved project. */
  usage: (src: string) => string[];
  /** Removes the file from the project everywhere, then from storage. */
  onRemove: (src: string) => void;
  /** Swaps a file for a newly uploaded one everywhere it is used. */
  onReplace: (from: string, to: ProjectMediaItem) => void;
  cover: string | null;
  ogImage: string | null;
  onUseAsCover: (src: string) => void;
  onUseAsOg: (src: string) => void;
}) {
  const logo = media.find((m) => m.role === "logo");
  const mainVideo = media.find((m) => m.role === "main_video");
  const items = media.filter((m) => m.role !== "logo");
  const images = galleryImages(media).length;
  const busy = (value: boolean) => onBusy(value);
  function patch(src: string, change: Partial<ProjectMediaItem>) {
    update((list) =>
      list.map((m) => (m.src === src ? { ...m, ...change } : m)),
    );
  }
  function add(item: ProjectMediaItem) {
    update((list) =>
      list.some((m) => m.src === item.src) ? list : [...list, item],
    );
  }
  function remove(item: ProjectMediaItem) {
    const places = usage(item.src);
    const message = places.length
      ? `הקובץ בשימוש ב: ${places.join(", ")}. מחיקתו תסיר אותו מכל המקומות. למחוק?`
      : "למחוק את הקובץ מהגלריה? השינוי יישמר רק בשמירת הפרויקט.";
    if (window.confirm(message)) onRemove(item.src);
  }
  /** Gives a file a role (at most one file per role), or clears it. */
  function setRole(src: string, role: ProjectMediaItem["role"]) {
    update((list) =>
      list.map((m) =>
        m.src === src
          ? { ...m, role }
          : role && m.role === role
            ? { ...m, role: undefined }
            : m,
      ),
    );
  }
  return (
    <div>
      <section className={styles.section}>
        <h2>לוגו הפרויקט</h2>
        <p className={styles.hint}>
          SVG, PNG או WebP. השקיפות נשמרת, וכל יחס גובה־רוחב נתמך.
        </p>
        <div className={styles.grid}>
          <MediaUpload
            projectId={projectId}
            onBusy={busy}
            kind="logo"
            label="לוגו"
            value={logo?.src ?? null}
            onUploaded={(item) => {
              const previous = logo;
              update((list) => [
                ...list.map((m) =>
                  m.role === "logo" ? { ...m, role: undefined } : m,
                ),
                {
                  ...item,
                  role: "logo",
                  alt: previous?.alt ?? "",
                  alt_en: previous?.alt_en,
                },
              ]);
              // An SVG can only be a logo; other formats stay in the gallery
              // when something still uses them.
              if (
                previous &&
                (isSvgSrc(previous.src) || !usage(previous.src).length)
              )
                onRemove(previous.src);
            }}
            onChange={(src) => {
              if (!src && logo) remove(logo);
            }}
          />
          {logo && (
            <LocalizedField
              label="טקסט חלופי ללוגו"
              value={logo.alt}
              valueEn={logo.alt_en}
              onChange={(alt) => patch(logo.src, { alt })}
              onChangeEn={(alt_en) => patch(logo.src, { alt_en })}
            />
          )}
        </div>
      </section>
      <section className={styles.section}>
        <h2>סרטון ראשי</h2>
        <p className={styles.hint}>
          אפשר לבחור סרטון מהגלריה או להעלות חדש. הסרטון יוצג בעמוד הפרויקט.
        </p>
        <div className={styles.grid}>
          <MediaUpload
            projectId={projectId}
            onBusy={busy}
            kind="video"
            label="סרטון ראשי"
            value={mainVideo?.src ?? null}
            choices={media.filter((m) => m.kind === "video")}
            onUploaded={add}
            onChange={(src) => {
              if (src) setRole(src, "main_video");
              else if (mainVideo) setRole(mainVideo.src, undefined);
            }}
          />
          {mainVideo && (
            <div>
              <MediaUpload
                projectId={projectId}
                onBusy={busy}
                label="תמונת פוסטר לסרטון הראשי"
                value={mainVideo.poster ?? null}
                onChange={(poster) =>
                  patch(mainVideo.src, { poster: poster ?? undefined })
                }
              />
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={mainVideo.loop ?? true}
                  onChange={(e) =>
                    patch(mainVideo.src, { loop: e.target.checked })
                  }
                />
                לולאה
              </label>
              <p className={styles.hint}>
                הסרטון מתנגן מושתק ובלולאה רק כשהוא על המסך, ונעצר לגולשים
                שביקשו פחות תנועה.
              </p>
            </div>
          )}
        </div>
      </section>
      <section className={styles.section}>
        <h2>גלריית הפרויקט</h2>
        <p className={styles.hint} data-gallery-count={images}>
          {images} תמונות בגלריה. היעד לפרסום פרויקט חדש: לפחות{" "}
          {MIN_GALLERY_IMAGES} תמונות, לוגו וסרטון ראשי. כל הקבצים כאן זמינים
          לקאבר, לבלוקים ולתמונת השיתוף בלי העלאה נוספת.
        </p>
        <BulkUpload projectId={projectId} onBusy={busy} onUploaded={add} />
        <SortableList
          className={styles.galleryGrid}
          items={items}
          type="media"
          itemKey={(item) => item.src}
          label={(_, index) => `קובץ ${index + 1}`}
          onMove={(from, to) => {
            const ordered = moveItem(items, from, to);
            update((list) => [
              ...list.filter((m) => m.role === "logo"),
              ...ordered,
            ]);
          }}
          render={(item, index, handle) => (
            <fieldset
              className={styles.galleryItem}
              aria-label={`קובץ ${index + 1}`}
            >
              <div className={styles.galleryPreview}>
                <MediaPreview
                  src={item.src}
                  label={item.alt || fileName(item.src)}
                />
              </div>
              <p className={styles.hint}>
                {item.kind === "video" ? "סרטון" : "תמונה"}
                {item.width && item.height
                  ? ` · ${item.width}×${item.height}`
                  : ""}
                {item.role === "main_video" ? " · סרטון ראשי" : ""}
                {item.src === cover ? " · קאבר" : ""}
                {item.src === ogImage ? " · תמונת שיתוף" : ""}
              </p>
              {handle}
              <LocalizedField
                label="טקסט חלופי"
                value={item.alt}
                valueEn={item.alt_en}
                onChange={(alt) => patch(item.src, { alt })}
                onChangeEn={(alt_en) => patch(item.src, { alt_en })}
              />
              <LocalizedField
                label="כיתוב"
                value={item.caption}
                valueEn={item.caption_en}
                onChange={(caption) => patch(item.src, { caption })}
                onChangeEn={(caption_en) => patch(item.src, { caption_en })}
              />
              <details>
                <summary>תיאור ופריסה</summary>
                <LocalizedField
                  label="תיאור"
                  multiline
                  value={item.description}
                  valueEn={item.description_en}
                  onChange={(description) => patch(item.src, { description })}
                  onChangeEn={(description_en) =>
                    patch(item.src, { description_en })
                  }
                />
                <label className={styles.field}>
                  <span>פריסה בגלריה</span>
                  <select
                    value={item.layout ?? ""}
                    onChange={(e) =>
                      patch(item.src, {
                        layout: (e.target.value || undefined) as
                          | MediaLayout
                          | undefined,
                      })
                    }
                  >
                    {LAYOUTS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {item.kind === "video" && (
                  <MediaUpload
                    projectId={projectId}
                    onBusy={busy}
                    label={`פוסטר לקובץ ${index + 1}`}
                    value={item.poster ?? null}
                    onChange={(poster) =>
                      patch(item.src, { poster: poster ?? undefined })
                    }
                  />
                )}
              </details>
              <div className={styles.actions}>
                {item.src !== cover && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUseAsCover(item.src)}
                  >
                    שימוש כקאבר
                  </Button>
                )}
                {item.kind === "image" &&
                  /\.(jpg|png|webp)$/i.test(item.src) &&
                  item.src !== ogImage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUseAsOg(item.src)}
                    >
                      תמונת שיתוף
                    </Button>
                  )}
                {item.kind === "video" && item.role !== "main_video" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRole(item.src, "main_video")}
                  >
                    קביעה כסרטון ראשי
                  </Button>
                )}
                <ReplaceFile
                  projectId={projectId}
                  item={item}
                  onBusy={busy}
                  onReplace={onReplace}
                />
                <Button size="sm" variant="ghost" onClick={() => remove(item)}>
                  מחיקה מהגלריה
                </Button>
              </div>
            </fieldset>
          )}
        />
      </section>
    </div>
  );
}

function BulkUpload({
  projectId,
  onBusy,
  onUploaded,
}: {
  projectId: string;
  onBusy: (busy: boolean) => void;
  onUploaded: (item: ProjectMediaItem) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  async function upload(files: File[]) {
    if (!files.length || progress) return;
    const kind: UploadKind = "any";
    const problems = files
      .map((file) => [file.name, checkFile(file, kind)] as const)
      .filter(([, problem]) => problem);
    const valid = files.filter((file) => !checkFile(file, kind));
    setError(
      problems.length
        ? `לא הועלו: ${problems.map(([name]) => name).join(", ")}. ${problems[0][1]}`
        : "",
    );
    onBusy(true);
    let failed = 0;
    try {
      for (const [index, file] of valid.entries()) {
        setProgress(`מעלה ${index + 1} מתוך ${valid.length}…`);
        try {
          onUploaded(await uploadFile(projectId, file));
        } catch {
          failed++;
        }
      }
    } finally {
      setProgress("");
      onBusy(false);
      if (input.current) input.current.value = "";
      if (failed)
        setError(`${failed} קבצים לא הועלו. בדקו את החיבור ונסו שוב.`);
    }
  }
  return (
    <fieldset
      aria-label="העלאת קבצים לגלריה"
      className={styles.upload}
      data-drag={drag}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDrag(true);
        }
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDrag(false);
        void upload([...e.dataTransfer.files]);
      }}
    >
      <label htmlFor={id}>העלאת תמונות וסרטונים לגלריה</label>
      <input
        id={id}
        ref={input}
        type="file"
        multiple
        disabled={!!progress}
        accept={acceptedTypes("any").join(",")}
        onChange={(e) => void upload([...(e.target.files ?? [])])}
      />
      <p className={styles.hint}>
        אפשר לבחור או לגרור כמה קבצים יחד. עד 50 MiB לקובץ. התמונות נשמרות ביחס
        המקורי שלהן, בלי חיתוך.
      </p>
      {progress && <p role="status">{progress}</p>}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

function ReplaceFile({
  projectId,
  item,
  onBusy,
  onReplace,
}: {
  projectId: string;
  item: ProjectMediaItem;
  onBusy: (busy: boolean) => void;
  onReplace: (from: string, to: ProjectMediaItem) => void;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const kind: UploadKind = item.kind;
  return (
    <>
      <label htmlFor={id} className="button button--ghost button--sm">
        החלפת קובץ
      </label>
      <input
        id={id}
        type="file"
        className="sr-only"
        accept={acceptedTypes(kind).join(",")}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const problem = checkFile(file, kind);
          if (problem) {
            setError(problem);
            return;
          }
          setError("");
          onBusy(true);
          try {
            onReplace(item.src, await uploadFile(projectId, file));
          } catch {
            setError("ההחלפה נכשלה. הקובץ הקודם נשמר.");
          } finally {
            onBusy(false);
          }
        }}
      />
      {error && (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </>
  );
}
