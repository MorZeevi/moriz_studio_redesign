"use client";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { inGallery } from "@/lib/cms/gallery-rows";
import { CMS_MEDIA_BUCKET } from "@/lib/cms/source";
import { isSvgSrc, isVideoSrc, MEDIA_FILE, UUID } from "@/lib/cms/validation";
import { browserSupabase } from "@/lib/supabase/browser";
import type { GalleryRow, ProjectMediaItem } from "@/types/project";
import { MediaPreview } from "./media-upload";
import { measureMediaUrl } from "./upload";
import styles from "./admin.module.css";

type StoredFile = { name: string; src: string; kind: ProjectMediaItem["kind"] };

/** Lists only this project's folder, using the signed-in admin's existing RLS. */
export function ExistingMediaPicker({
  projectId,
  media,
  rows,
  onUploaded,
  onBusy,
}: {
  projectId: string;
  media: ProjectMediaItem[];
  rows: GalleryRow[];
  onUploaded: (item: ProjectMediaItem) => void;
  onBusy: (busy: boolean) => void;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const request = useRef(0);
  const working = useRef(false);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const projectFiles = new Map(media.map((item) => [item.src, item]));
  const unavailable = (file: StoredFile) =>
    inGallery(rows, file.src) ||
    !!projectFiles.get(file.src)?.role ||
    isSvgSrc(file.src);

  async function load() {
    const version = ++request.current;
    setLoading(true);
    setError("");
    setFiles([]);
    setSelected(new Set());
    try {
      if (!UUID.test(projectId)) throw new Error("Invalid project folder");
      const storage = browserSupabase().storage.from(CMS_MEDIA_BUCKET);
      const found: StoredFile[] = [];
      const limit = 100;
      for (let offset = 0; ; offset += limit) {
        const { data, error: problem } = await storage.list(projectId, {
          limit,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
        if (version !== request.current) return;
        if (problem || !data) throw problem ?? new Error("No storage response");
        for (const file of data) {
          // Skip folders and names the authenticated /media route cannot serve.
          if (
            !file.id ||
            !MEDIA_FILE.test(file.name) ||
            !UUID.test(file.name.slice(0, 36))
          )
            continue;
          const src = `/media/${projectId}/${file.name}`;
          found.push({
            name: file.name,
            src,
            kind: isVideoSrc(src) ? "video" : "image",
          });
        }
        if (data.length < limit) break;
      }
      setFiles(found);
    } catch {
      if (version === request.current)
        setError(
          "לא ניתן לטעון את הקבצים מהאחסון. בדקו את החיבור וההתחברות ונסו שוב.",
        );
    } finally {
      if (version === request.current) setLoading(false);
    }
  }
  function close() {
    if (working.current) return;
    request.current++;
    setOpen(false);
    trigger.current?.focus();
  }
  async function addSelected() {
    const chosen = files.filter(
      (file) => selected.has(file.src) && !unavailable(file),
    );
    if (working.current || !chosen.length) return;
    working.current = true;
    setAdding(true);
    onBusy(true);
    try {
      const items = await Promise.all(
        chosen.map(async (file): Promise<ProjectMediaItem> => {
          const existing = projectFiles.get(file.src);
          // Keep existing captions, flags and dimensions when the file is already in media.
          if (existing) return existing;
          return {
            src: file.src,
            kind: file.kind,
            ...(await measureMediaUrl(file.src, file.kind)),
          };
        }),
      );
      for (const item of items) onUploaded(item);
      setSelected(new Set());
      setOpen(false);
      trigger.current?.focus();
    } finally {
      working.current = false;
      setAdding(false);
      onBusy(false);
    }
  }
  return (
    <div className={styles.existingMedia}>
      <Button
        ref={trigger}
        variant="secondary"
        aria-expanded={open}
        aria-controls={id}
        disabled={adding}
        onClick={() => {
          if (open) close();
          else {
            setOpen(true);
            void load();
          }
        }}
      >
        בחירה מקבצים קיימים
      </Button>
      {open && (
        <section
          id={id}
          className={styles.existingPanel}
          aria-label="בחירה מקבצים קיימים"
        >
          <div className={styles.row}>
            <h3>קבצים באחסון של הפרויקט</h3>
            <Button variant="ghost" size="sm" disabled={adding} onClick={close}>
              סגירה
            </Button>
          </div>
          <p className={styles.hint}>
            בחרו קבצים להוספה לגלריה. לא מתבצעת העלאה מחדש; השינוי יישמר רק
            בלחיצה על „שמירת שינויים”.
          </p>
          {loading && <p role="status">טוען קבצים מהאחסון…</p>}
          {error && (
            <div role="alert">
              <p className={styles.error}>{error}</p>
              <Button variant="ghost" size="sm" onClick={() => void load()}>
                ניסיון נוסף
              </Button>
            </div>
          )}
          {!loading && !error && !files.length && (
            <p>אין קבצים באחסון של הפרויקט הזה.</p>
          )}
          {!!files.length && (
            <>
              <div className={styles.existingGrid}>
                {files.map((file) => {
                  const existing = projectFiles.get(file.src);
                  const status = inGallery(rows, file.src)
                    ? "בגלריה"
                    : existing
                      ? "בפרויקט ולא בגלריה"
                      : "לא בפרויקט (יתום)";
                  return (
                    <div
                      key={file.src}
                      data-storage-file={file.name}
                      className={styles.existingFile}
                      data-selected={selected.has(file.src) || undefined}
                    >
                      <div className={styles.existingPreview}>
                        <MediaPreview src={file.src} label={file.name} />
                      </div>
                      <label className={styles.existingChoice}>
                        <input
                          type="checkbox"
                          checked={selected.has(file.src)}
                          disabled={adding || unavailable(file)}
                          aria-label={`בחירת ${file.name}`}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setSelected((current) => {
                              const next = new Set(current);
                              if (checked) next.add(file.src);
                              else next.delete(file.src);
                              return next;
                            });
                          }}
                        />
                        <bdi>{file.name}</bdi>
                      </label>
                      <p className={styles.hint}>{status}</p>
                      {(existing?.role || isSvgSrc(file.src)) && (
                        <p className={styles.hint}>
                          לוגו וסרטון ראשי מנוהלים בשדות הייעודיים שלהם.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.existingActions}>
                <span role="status">
                  {adding
                    ? "מוסיף קבצים לגלריה…"
                    : `${selected.size} קבצים נבחרו`}
                </span>
                <Button
                  disabled={adding || !selected.size}
                  onClick={() => void addSelected()}
                >
                  הוספת הקבצים לגלריה
                </Button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
