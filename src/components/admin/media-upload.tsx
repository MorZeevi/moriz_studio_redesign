"use client";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { isVideoSrc } from "@/lib/cms/validation";
import type { ProjectMediaItem } from "@/types/project";
import {
  acceptedTypes,
  checkFile,
  type UploadKind,
  uploadFile,
} from "./upload";
import styles from "./admin.module.css";

export function MediaPreview({ src, label }: { src: string; label: string }) {
  return isVideoSrc(src) ? (
    <video
      src={src}
      controls
      muted
      playsInline
      preload="metadata"
      aria-label={label}
    />
  ) : (
    // biome-ignore lint/performance/noImgElement: Authenticated previews must bypass image optimization and shared caching.
    <img src={src} alt={label} />
  );
}
/**
 * One media slot: upload a file or pick one already in the project gallery.
 * Uploads are added to the gallery (onUploaded); removing only unlinks the
 * slot. Files are deleted from the gallery tab only.
 */
export function MediaUpload({
  projectId,
  value,
  onChange,
  onUploaded,
  kind = "image",
  label,
  onBusy,
  choices = [],
}: {
  projectId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onUploaded?: (item: ProjectMediaItem) => void;
  kind?: UploadKind;
  label: string;
  onBusy: (busy: boolean) => void;
  /** Gallery files that may fill this slot. */
  choices?: ProjectMediaItem[];
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const working = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const options = choices.filter((item) =>
    kind === "any" || kind === "logo" ? true : item.kind === kind,
  );
  async function upload(file: File) {
    if (working.current) return;
    const problem = checkFile(file, kind);
    if (problem) {
      setError(problem);
      return;
    }
    working.current = true;
    setPending(true);
    onBusy(true);
    setError("");
    try {
      const item = await uploadFile(projectId, file);
      onUploaded?.(item);
      onChange(item.src);
    } catch {
      setError(
        "ההעלאה נכשלה. בדקו את החיבור או התחברו שוב ונסו שנית. הקובץ הקודם נשמר.",
      );
    } finally {
      working.current = false;
      setPending(false);
      onBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <fieldset
      aria-label={label}
      className={styles.upload}
      data-drag={drag}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          e.stopPropagation();
          setDrag(true);
        }
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        e.stopPropagation();
        setDrag(false);
        const file = e.dataTransfer.files[0];
        if (file) void upload(file);
      }}
    >
      <label htmlFor={id}>{label}</label>
      {value && <MediaPreview src={value} label={label} />}
      <input
        id={id}
        ref={input}
        type="file"
        disabled={pending}
        accept={acceptedTypes(kind).join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <p className={styles.hint}>אפשר לגרור קובץ לכאן. עד 50 MiB.</p>
      {!!options.length && (
        <details className={styles.picker}>
          <summary>בחירה מהגלריה</summary>
          <div className={styles.pickerGrid}>
            {options.map((item) => (
              <button
                key={item.src}
                type="button"
                className={styles.pickerItem}
                aria-pressed={item.src === value}
                aria-label={`בחירת ${item.alt || item.src.split("/").pop()}`}
                onClick={() => onChange(item.src)}
              >
                {item.kind === "video" ? (
                  item.poster ? (
                    // biome-ignore lint/performance/noImgElement: Authenticated previews must bypass image optimization.
                    <img src={item.poster} alt="" />
                  ) : (
                    <span>וידאו</span>
                  )
                ) : (
                  // biome-ignore lint/performance/noImgElement: Authenticated previews must bypass image optimization.
                  <img src={item.src} alt="" loading="lazy" />
                )}
              </button>
            ))}
          </div>
        </details>
      )}
      {value && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => onChange(null)}
        >
          הסרת קובץ
        </Button>
      )}
      {pending && <p role="status">מעלה קובץ…</p>}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
