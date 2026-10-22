"use client";
import { browserSupabase } from "@/lib/supabase/browser";
import {
  LOGO_TYPES,
  MAX_UPLOAD_BYTES,
  MEDIA_TYPES,
} from "@/lib/cms/validation";
import { CMS_MEDIA_BUCKET } from "@/lib/cms/source";
import type { ProjectMediaItem } from "@/types/project";
import { compressImage } from "./compress-image";

export type UploadKind = "image" | "video" | "any" | "logo";
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
};
export function acceptedTypes(kind: UploadKind): readonly string[] {
  if (kind === "logo") return LOGO_TYPES;
  if (kind === "any") return MEDIA_TYPES;
  return MEDIA_TYPES.filter((type) => type.startsWith(`${kind}/`));
}
const typeErrors: Record<UploadKind, string> = {
  image: "יש לבחור JPEG, PNG, WebP, AVIF או GIF.",
  video: "יש לבחור סרטון MP4 או WebM.",
  any: "יש לבחור תמונה (JPEG, PNG, WebP, AVIF, GIF) או סרטון (MP4, WebM).",
  logo: "יש לבחור לוגו בפורמט SVG, PNG או WebP.",
};
/** Returns an error message, or null when the file can be uploaded. */
export function checkFile(file: File, kind: UploadKind): string | null {
  if (!acceptedTypes(kind).includes(file.type)) return typeErrors[kind];
  if (file.size > MAX_UPLOAD_BYTES || file.size === 0)
    return "יש לבחור קובץ עד 50 MiB שאינו ריק.";
  return null;
}
/** Natural size through a local object URL or the authenticated /media route. */
export async function measureMediaUrl(
  url: string,
  kind: ProjectMediaItem["kind"],
): Promise<{ width?: number; height?: number }> {
  const element =
    kind === "video" ? document.createElement("video") : new Image();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error("Media metadata timed out")),
        10000,
      );
      element.onerror = () => reject(new Error("Media could not be loaded"));
      if (element instanceof HTMLVideoElement) {
        element.preload = "metadata";
        element.muted = true;
        element.onloadedmetadata = () => resolve();
      } else element.onload = () => resolve();
      element.src = url;
    });
    const width =
      element instanceof HTMLVideoElement
        ? element.videoWidth
        : element.naturalWidth;
    const height =
      element instanceof HTMLVideoElement
        ? element.videoHeight
        : element.naturalHeight;
    return { width: width || undefined, height: height || undefined };
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
    element.onerror = null;
    element.onload = null;
    if (element instanceof HTMLVideoElement) element.onloadedmetadata = null;
    element.removeAttribute("src");
    if (element instanceof HTMLVideoElement) element.load();
  }
}
/** Natural size of an image or video, read locally before upload. */
async function measure(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await measureMediaUrl(
      url,
      file.type.startsWith("video/") ? "video" : "image",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
/**
 * Uploads one checked file straight to the private bucket (admin RLS).
 * Large images are compressed first; logos upload untouched.
 */
export async function uploadFile(
  projectId: string,
  original: File,
  kind: UploadKind = "any",
): Promise<ProjectMediaItem> {
  const file = kind === "logo" ? original : await compressImage(original);
  const path = `${projectId}/${crypto.randomUUID()}.${extensions[file.type]}`;
  const [size] = await Promise.all([
    measure(file),
    browserSupabase()
      .storage.from(CMS_MEDIA_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: "0",
      })
      .then(({ error }) => {
        if (error) throw error;
      }),
  ]);
  return {
    src: `/media/${path}`,
    kind: file.type.startsWith("video/") ? "video" : "image",
    ...size,
  };
}
