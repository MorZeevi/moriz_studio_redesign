import type {
  ProjectContentBlock,
  ProjectImage,
  ProjectInput,
  ProjectMediaItem,
} from "@/types/project";
import { isVideoSrc, mediaReferences } from "./validation";

const SLOTS = [
  ["cover_image_url", "קאבר / Hero"],
  ["homepage_image_url", "מדיה לעמוד הבית"],
  ["projects_image_url", "מדיה לעמוד הפרויקטים"],
  ["og_image_url", "תמונת שיתוף"],
] as const;

function blockSources(block: ProjectContentBlock): string[] {
  const values: string[] = [];
  if ("src" in block && block.src) values.push(block.src);
  if ("poster" in block && block.poster) values.push(block.poster);
  if ("images" in block)
    for (const image of block.images) if (image.src) values.push(image.src);
  return values;
}
/** Where a file is used in the (unsaved) editor state, as readable labels. */
export function mediaUsage(project: ProjectInput, src: string): string[] {
  const places: string[] = SLOTS.filter(([key]) => project[key] === src).map(
    ([, label]) => label,
  );
  project.content.forEach((block, index) => {
    if (blockSources(block).includes(src)) places.push(`בלוק ${index + 1}`);
  });
  for (const item of project.media)
    if (item.poster === src) places.push("פוסטר של סרטון בגלריה");
  return places;
}
function mapImage(image: ProjectImage, map: (src: string) => string) {
  return { ...image, src: map(image.src) };
}
function mapBlocks(
  blocks: ProjectContentBlock[],
  map: (src: string) => string,
): ProjectContentBlock[] {
  return blocks.map((block) => {
    switch (block.type) {
      case "image":
      case "media_text":
        return { ...block, src: map(block.src) };
      case "video":
        return {
          ...block,
          src: map(block.src),
          ...(block.poster ? { poster: map(block.poster) } : {}),
        };
      case "two_images":
        return {
          ...block,
          images: block.images.map((i) =>
            mapImage(i, map),
          ) as typeof block.images,
        };
      case "three_images":
        return {
          ...block,
          images: block.images.map((i) =>
            mapImage(i, map),
          ) as typeof block.images,
        };
      case "image_row":
        return { ...block, images: block.images.map((i) => mapImage(i, map)) };
      case "gallery":
        return {
          ...block,
          images: block.images
            .map((i) => mapImage(i, map))
            .filter((i) => i.src),
        };
      default:
        return block;
    }
  });
}
function mapProject(
  project: ProjectInput,
  map: (src: string) => string,
): ProjectInput {
  const slot = (value: string | null) => (value ? map(value) || null : value);
  return {
    ...project,
    cover_image_url: slot(project.cover_image_url),
    homepage_image_url: slot(project.homepage_image_url),
    projects_image_url: slot(project.projects_image_url),
    og_image_url: slot(project.og_image_url),
    content: mapBlocks(project.content, map),
    media: project.media.flatMap((item) => {
      const src = map(item.src);
      if (!src) return [];
      const poster = item.poster ? map(item.poster) : undefined;
      return [{ ...item, src, poster: poster || undefined }];
    }),
  };
}
/** Points every use of one file at another (gallery "replace file"). */
export function replaceSrc(project: ProjectInput, from: string, to: string) {
  return mapProject(project, (src) => (src === from ? to : src));
}
/** Removes a file from the gallery and clears every slot that used it. */
export function unlinkSrc(project: ProjectInput, src: string) {
  return mapProject(project, (value) => (value === src ? "" : value));
}
/**
 * Older projects referenced files only from covers and blocks. Bring those
 * into the gallery so every file is one reusable media record.
 */
export function withGalleryImports(project: ProjectInput): ProjectInput {
  const known = new Set(project.media.flatMap((m) => [m.src, m.poster ?? ""]));
  const missing = mediaReferences({ ...project, media: [] }).filter(
    (src) => !known.has(src),
  );
  if (!missing.length) return project;
  const imported: ProjectMediaItem[] = missing.map((src) => ({
    src,
    kind: isVideoSrc(src) ? "video" : "image",
  }));
  return { ...project, media: [...project.media, ...imported] };
}
