"use client";
import { useId, useRef, useState } from "react";
import { browserSupabase } from "@/lib/supabase/browser";
import { MAX_UPLOAD_BYTES, MEDIA_TYPES } from "@/lib/cms/validation";
import { removeUnusedUpload } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import styles from "./admin.module.css";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};
export function MediaUpload({
  projectId,
  value,
  onChange,
  kind = "image",
  label,
  onBusy,
}: {
  projectId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  kind?: "image" | "video";
  label: string;
  onBusy: (busy: boolean) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const working = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  async function upload(file: File) {
    if (working.current) return;
    if (
      !(MEDIA_TYPES as readonly string[]).includes(file.type) ||
      !file.type.startsWith(`${kind}/`)
    ) {
      setError(
        kind === "image"
          ? "יש לבחור JPEG, PNG, WebP, AVIF או GIF."
          : "יש לבחור סרטון MP4 או WebM.",
      );
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES || file.size === 0) {
      setError("יש לבחור קובץ עד 50 MiB שאינו ריק.");
      return;
    }
    working.current = true;
    setPending(true);
    onBusy(true);
    setError("");
    const path = `${projectId}/${crypto.randomUUID()}.${extensions[file.type]}`;
    try {
      const client = browserSupabase();
      const { error: uploadError } = await client.storage
        .from("project-media")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: "0",
        });
      if (uploadError) throw uploadError;
      if (value) {
        const cleanup = await removeUnusedUpload(value);
        if (!cleanup.ok) setError("הקובץ הועלה. הקובץ הקודם נשאר באחסון.");
      }
      onChange(`/media/${path}`);
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
      {value &&
        (kind === "video" ? (
          <video
            src={value}
            controls
            muted
            playsInline
            preload="metadata"
            aria-label={label}
          />
        ) : (
          // biome-ignore lint/performance/noImgElement: Authenticated previews must bypass image optimization and shared caching.
          <img src={value} alt={label} />
        ))}
      <input
        id={id}
        ref={input}
        type="file"
        disabled={pending}
        accept={MEDIA_TYPES.filter((type) => type.startsWith(`${kind}/`)).join(
          ",",
        )}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <p className={styles.hint}>אפשר לגרור קובץ לכאן. עד 50 MiB.</p>
      {value && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            onChange(null);
            void removeUnusedUpload(value);
          }}
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
