"use client";
import { useId, useRef, useState } from "react";
import { isSvgSrc } from "@/lib/cms/validation";
import type { MediaLayout, ProjectMediaItem } from "@/types/project";
import { LocalizedField } from "./localized-field";
import { MediaUpload } from "./media-upload";
import {
  acceptedTypes,
  checkFile,
  type UploadKind,
  uploadFile,
} from "./upload";
import styles from "./admin.module.css";

// Building blocks for the project's files: the logo (side panel), the main
// video (main media), per-file details, and gallery uploads.

type Update = (
  change: (media: ProjectMediaItem[]) => ProjectMediaItem[],
) => void;
function patcher(update: Update) {
  return (src: string, change: Partial<ProjectMediaItem>) =>
    update((list) =>
      list.map((m) => (m.src === src ? { ...m, ...change } : m)),
    );
}

export function LogoField({
  projectId,
  media,
  update,
  onBusy,
  usage,
  onRemove,
}: {
  projectId: string;
  media: ProjectMediaItem[];
  /** Functional update, so several uploads in a row all land. */
  update: Update;
  onBusy: (busy: boolean) => void;
  /** Readable places where a file is used in the unsaved project. */
  usage: (src: string) => string[];
  /** Removes the file from the project everywhere, then from storage. */
  onRemove: (src: string) => void;
}) {
  const logo = media.find((m) => m.role === "logo");
  const patch = patcher(update);
  return (
    <div className={styles.grid}>
      <MediaUpload
        projectId={projectId}
        onBusy={onBusy}
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
          // An SVG can only be a logo; other formats stay in the project
          // when something still uses them.
          if (
            previous &&
            (isSvgSrc(previous.src) || !usage(previous.src).length)
          )
            onRemove(previous.src);
        }}
        onChange={(src) => {
          if (
            !src &&
            logo &&
            window.confirm("להסיר את הלוגו? השינוי יישמר רק בשמירת הפרויקט.")
          )
            onRemove(logo.src);
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
  );
}

export function MainVideoField({
  projectId,
  media,
  update,
  onBusy,
  onSelect,
}: {
  projectId: string;
  media: ProjectMediaItem[];
  update: Update;
  onBusy: (busy: boolean) => void;
  /** Makes a project file the main video, or clears the role (null). */
  onSelect: (src: string | null) => void;
}) {
  const mainVideo = media.find((m) => m.role === "main_video");
  const patch = patcher(update);
  return (
    <div>
      <MediaUpload
        projectId={projectId}
        onBusy={onBusy}
        kind="video"
        label="סרטון ראשי"
        value={mainVideo?.src ?? null}
        choices={media.filter((m) => m.kind === "video")}
        onUploaded={(item) =>
          update((list) =>
            list.some((m) => m.src === item.src) ? list : [...list, item],
          )
        }
        onChange={onSelect}
      />
      {mainVideo && (
        <details className={styles.more}>
          <summary>פוסטר ולולאה</summary>
          <MediaUpload
            projectId={projectId}
            onBusy={onBusy}
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
              onChange={(e) => patch(mainVideo.src, { loop: e.target.checked })}
            />
            לולאה
          </label>
        </details>
      )}
    </div>
  );
}

const LAYOUTS: [MediaLayout, string][] = [
  ["full", "רוחב מלא"],
  ["center", "מרכז — שני שלישים"],
  ["start", "תחילת שורה — חצי רוחב"],
  ["end", "סוף שורה — חצי רוחב"],
];
/** Texts and playback of one project file; `single` adds its row width. */
export function MediaDetails({
  projectId,
  item,
  label,
  single,
  onBusy,
  update,
}: {
  projectId: string;
  item: ProjectMediaItem;
  label: string;
  single: boolean;
  onBusy: (busy: boolean) => void;
  update: Update;
}) {
  const patch = patcher(update);
  return (
    <details className={styles.more}>
      <summary>
        טקסט חלופי, כיתוב והגדרות
        {item.kind === "image" && !item.alt?.trim() && (
          <span className={styles.warning}> · חסר טקסט חלופי</span>
        )}
      </summary>
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
      <LocalizedField
        label="תיאור"
        multiline
        value={item.description}
        valueEn={item.description_en}
        onChange={(description) => patch(item.src, { description })}
        onChangeEn={(description_en) => patch(item.src, { description_en })}
      />
      {single && (
        <label className={styles.field}>
          <span>רוחב בשורה</span>
          <select
            value={item.layout ?? "full"}
            onChange={(e) =>
              patch(item.src, {
                layout:
                  e.target.value === "full"
                    ? undefined
                    : (e.target.value as MediaLayout),
              })
            }
          >
            {LAYOUTS.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
      )}
      {item.kind === "video" && (
        <>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={item.autoplay !== false}
              onChange={(e) =>
                patch(item.src, {
                  autoplay: e.target.checked ? undefined : false,
                })
              }
            />
            ניגון אוטומטי מושתק (כשכבוי: נגן עם כפתורים)
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={item.loop ?? true}
              onChange={(e) => patch(item.src, { loop: e.target.checked })}
            />
            לולאה
          </label>
          <MediaUpload
            projectId={projectId}
            onBusy={onBusy}
            label={`פוסטר ל${label}`}
            value={item.poster ?? null}
            onChange={(poster) =>
              patch(item.src, { poster: poster ?? undefined })
            }
          />
        </>
      )}
    </details>
  );
}

export function BulkUpload({
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

export function ReplaceFile({
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
