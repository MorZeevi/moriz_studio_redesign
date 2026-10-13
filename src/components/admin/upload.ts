"use client";
import { browserSupabase } from "@/lib/supabase/browser";
import {
  LOGO_TYPES,
  MAX_UPLOAD_BYTES,
  MEDIA_TYPES,
} from "@/lib/cms/validation";
import { CMS_MEDIA_BUCKET } from "@/lib/cms/source";
import type { ProjectMediaItem } from "@/types/project";

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
/** Natural size of an image or video, read locally before upload. */
async function measure(
  file: File,
): Promise<{ width?: number; height?: number }> {
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject();
        video.src = url;
      });
      return {
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      };
    }
    const image = new Image();
    image.src = url;
    await image.decode();
    return {
      width: image.naturalWidth || undefined,
      height: image.naturalHeight || undefined,
    };
  } catch {
    return {};
  } finally {
    URL.revokeObjectURL(url);
  }
}
/** Uploads one checked file straight to the private bucket (admin RLS). */
export async function uploadFile(
  projectId: string,
  file: File,
): Promise<ProjectMediaItem> {
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
