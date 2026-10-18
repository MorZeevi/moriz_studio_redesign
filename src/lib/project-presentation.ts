import type { Locale } from "@/i18n/config";
import { localized } from "@/lib/cms/localize";
import {
  galleryImages,
  isVideoSrc,
  mediaReferences,
} from "@/lib/cms/validation";
import type {
  MediaSpacing,
  MultiMediaLayout,
  Project,
  ProjectImage,
  ProjectMediaItem,
  SingleMediaLayout,
  VideoBlock,
} from "@/types/project";

/** A resolved (localized) image with its position in the viewer. */
export type GalleryImage = {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
  index: number;
};
export type GalleryHighlight = {
  id: string;
  value: string;
  label: string;
  description: string;
};
export type GalleryEntry =
  | {
      type: "images";
      id: string;
      images: GalleryImage[];
      /** "row": every image in one line, at equal height. */
      layout: SingleMediaLayout | MultiMediaLayout | "row";
      spacing: MediaSpacing;
      cover?: boolean;
    }
  | {
      type: "video";
      id: string;
      block: VideoBlock;
      layout: SingleMediaLayout;
      spacing: MediaSpacing;
      /** Muted, looping, plays only while visible (cover / main video). */
      ambient?: boolean;
      label: string;
    }
  | {
      type: "media_text";
      id: string;
      image: GalleryImage | null;
      video: { src: string; poster?: string; label: string } | null;
      eyebrow: string;
      title: string;
      text: string;
      side: "start" | "end";
      feature: boolean;
      spacing: MediaSpacing;
    }
  | {
      type: "highlights";
      id: string;
      title: string;
      highlights: GalleryHighlight[];
      spacing: MediaSpacing;
    };

export function projectHighlights(
  project: Pick<Project, "highlights">,
  locale: Locale = "he",
): GalleryHighlight[] {
  return project.highlights
    .filter((h) => h.value.trim() && h.label.trim())
    .map((h) => ({
      id: h.id,
      value: h.value,
      label: localized(h, "label", locale),
      description: localized(h, "description", locale),
    }));
}

/**
 * The case-study media column, in CMS order: the cover, the main video, the
 * media blocks, then gallery files no block places. Keeps the original private
 * media URLs and never mutates saved blocks.
 */
export function projectGallery(
  project: Pick<
    Project,
    | "cover_image_url"
    | "title"
    | "title_en"
    | "content"
    | "media"
    | "highlights"
  >,
  locale: Locale = "he",
  videoLabel = "",
) {
  const entries: GalleryEntry[] = [];
  const images: GalleryImage[] = [];
  const meta = new Map(project.media.map((m) => [m.src, m]));
  const title = localized(project, "title", locale);
  const blocks = project.content.filter((block) => !block.hidden);
  /** Block text wins; empty text falls back to the gallery file's metadata. */
  function resolve(image: ProjectImage, fallbackAlt = ""): GalleryImage {
    const item = meta.get(image.src);
    return {
      src: image.src,
      alt:
        localized(image, "alt", locale) ||
        (item ? localized(item, "alt", locale) : "") ||
        fallbackAlt,
      caption:
        localized(image, "caption", locale) ||
        (item ? localized(item, "caption", locale) : ""),
      width: item?.width,
      height: item?.height,
      index: -1,
    };
  }
  function append(items: ProjectImage[]) {
    return items
      .filter((image) => !!image.src && !isVideoSrc(image.src))
      .map((image) => {
        const next = { ...resolve(image), index: images.length };
        images.push(next);
        return next;
      });
  }
  const firstImage = blocks.flatMap((block) =>
    block.type === "image"
      ? [block]
      : block.type === "gallery" ||
          block.type === "two_images" ||
          block.type === "three_images" ||
          block.type === "image_row"
        ? block.images
        : [],
  )[0];
  const cover = project.cover_image_url;
  let duplicate = !!cover && firstImage?.src === cover;
  if (cover && isVideoSrc(cover)) {
    entries.push({
      type: "video",
      id: "cover",
      ambient: true,
      layout: "full",
      spacing: "regular",
      label: title,
      block: { type: "video", src: cover, poster: meta.get(cover)?.poster },
    });
  } else if (cover) {
    entries.push({
      type: "images",
      id: "cover",
      cover: true,
      layout: "full",
      spacing: "regular",
      images: append([
        duplicate && firstImage
          ? firstImage
          : { src: cover, alt: resolve({ src: cover }).alt || title },
      ]),
    });
  }
  const placed = new Set(
    mediaReferences({
      cover_image_url: cover,
      homepage_image_url: null,
      projects_image_url: null,
      content: blocks,
    }),
  );
  const mainVideo = project.media.find((m) => m.role === "main_video");
  if (mainVideo && !placed.has(mainVideo.src))
    entries.push({
      type: "video",
      id: "main-video",
      ambient: mainVideo.autoplay !== false,
      layout: "full",
      spacing: "regular",
      label: localized(mainVideo, "alt", locale) || videoLabel,
      block: {
        type: "video",
        src: mainVideo.src,
        poster: mainVideo.poster,
        loop: mainVideo.loop ?? true,
        controls: true,
      },
    });
  for (const block of blocks) {
    const id = block.id ?? `block-${entries.length}`;
    switch (block.type) {
      case "text":
        continue;
      case "video":
        if (block.src)
          entries.push({
            type: "video",
            id,
            label:
              (meta.get(block.src) &&
                localized(
                  meta.get(block.src) as ProjectMediaItem,
                  "alt",
                  locale,
                )) ||
              videoLabel,
            block: {
              ...block,
              poster: block.poster || meta.get(block.src)?.poster,
            },
            layout: block.layout ?? "full",
            spacing: block.spacing ?? "regular",
          });
        continue;
      case "media_text": {
        const video = isVideoSrc(block.src);
        entries.push({
          type: "media_text",
          id,
          image: block.src && !video ? append([block])[0] : null,
          video:
            block.src && video
              ? {
                  src: block.src,
                  poster: meta.get(block.src)?.poster,
                  label: resolve(block).alt || videoLabel,
                }
              : null,
          eyebrow: localized(block, "eyebrow", locale),
          title: localized(block, "title", locale),
          text: localized(block, "text", locale),
          side: block.side ?? "start",
          feature: !!block.feature,
          spacing: block.spacing ?? "regular",
        });
        continue;
      }
      case "highlights":
        entries.push({
          type: "highlights",
          id,
          title: localized(block, "title", locale),
          highlights: projectHighlights(project, locale),
          spacing: "regular",
        });
        continue;
      default: {
        let items: ProjectImage[] =
          block.type === "image" ? [block] : block.images;
        if (duplicate && items.length) {
          items = items.slice(1);
          duplicate = false;
        }
        const media = append(items);
        if (media.length)
          entries.push({
            type: "images",
            id,
            images: media,
            layout:
              block.type === "image_row" || block.type === "three_images"
                ? "row"
                : (block.layout ?? (block.type === "image" ? "full" : "equal")),
            spacing: block.spacing ?? "regular",
          });
      }
    }
  }
  // Uploaded gallery images that no block places close the case study.
  // An explicit layout places a file alone; the rest pair up.
  let pairs: ProjectMediaItem[] = [];
  const flush = () => {
    if (!pairs.length) return;
    entries.push({
      type: "images",
      id: `gallery-${pairs[0].src}`,
      images: append(pairs),
      layout: "equal",
      spacing: "generous",
    });
    pairs = [];
  };
  for (const item of galleryImages(project.media)) {
    if (placed.has(item.src)) continue;
    // A card preview enters the case study only when explicitly placed.
    if (item.hover_homepage || item.hover_projects) continue;
    if (!item.layout) {
      pairs.push(item);
      continue;
    }
    flush();
    entries.push({
      type: "images",
      id: `gallery-${item.src}`,
      images: append([item]),
      layout: item.layout,
      spacing: "generous",
    });
  }
  flush();
  return { entries, images };
}

export type InformationSection = {
  id: string;
  title: string;
  text: string;
  subsections: { title: string; text: string }[];
};
/** Panel accordions: description, target audience, then text blocks. */
export function projectInformation(
  project: Pick<
    Project,
    | "description"
    | "description_en"
    | "target_audience"
    | "target_audience_en"
    | "audience_description"
    | "audience_description_en"
    | "content"
  >,
  about: string,
  fallback: string,
  locale: Locale = "he",
  audienceLabel = "",
) {
  const sections: InformationSection[] = [];
  const description = localized(project, "description", locale);
  if (description.trim())
    sections.push({
      id: "description",
      title: about,
      text: description,
      subsections: [],
    });
  const audience = localized(project, "target_audience", locale);
  if (audience.trim())
    sections.push({
      id: "audience",
      title: audienceLabel,
      text: [audience, localized(project, "audience_description", locale)]
        .filter((t) => t.trim())
        .join("\n\n"),
      subsections: [],
    });
  for (const [index, block] of project.content.entries()) {
    if (block.type !== "text" || block.hidden) continue;
    const subsections = (block.subsections ?? [])
      .map((sub) => ({
        title: localized(sub, "title", locale),
        text: localized(sub, "text", locale),
      }))
      .filter((sub) => sub.title.trim() || sub.text.trim());
    const text = localized(block, "text", locale);
    if (!text.trim() && !subsections.length) continue;
    sections.push({
      id: block.id ?? `text-${index}`,
      title:
        localized(block, "title", locale).trim() ||
        localized(block, "eyebrow", locale).trim() ||
        fallback,
      text,
      subsections,
    });
  }
  return sections;
}

/** The case study panel's chosen colours, as CSS values. Null keeps the page
 * surface. */
export type PanelSurface = { background: string; foreground: string };
/** Light text on dark colours (WCAG relative luminance below 0.179). */
function toneFor(hex: string): "light" | "dark" {
  const luminance = [1, 3, 5].reduce((sum, start, index) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    const linear =
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  return luminance < 0.179 ? "light" : "dark";
}
export function panelSurface(
  project: Pick<Project, "panel_style">,
): PanelSurface | null {
  const background = project.panel_style?.color;
  if (!background) return null;
  return {
    background,
    foreground:
      project.panel_style?.text ??
      (toneFor(background) === "light"
        ? "var(--color-light)"
        : "var(--color-dark)"),
  };
}
