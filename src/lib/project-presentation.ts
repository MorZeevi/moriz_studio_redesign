import type {
  Project,
  ProjectImage,
  MediaSpacing,
  SingleMediaLayout,
  MultiMediaLayout,
  VideoBlock,
} from "@/types/project";

export type GalleryImage = ProjectImage & { index: number };
export type GalleryEntry =
  | {
      type: "images";
      id: string;
      images: GalleryImage[];
      layout: SingleMediaLayout | MultiMediaLayout;
      spacing: MediaSpacing;
      cover?: boolean;
    }
  | {
      type: "video";
      id: string;
      block: VideoBlock;
      layout: SingleMediaLayout;
      spacing: MediaSpacing;
    };

/** Keeps CMS ordering and original private media URLs; never mutates saved blocks. */
export function projectGallery(
  project: Pick<Project, "cover_image_url" | "title" | "content">,
) {
  const entries: GalleryEntry[] = [];
  const images: GalleryImage[] = [];
  const firstImage = project.content.flatMap((block) =>
    block.type === "image"
      ? [block]
      : block.type === "gallery" || block.type === "two_images"
        ? block.images
        : [],
  )[0];
  let duplicate =
    !!project.cover_image_url && firstImage?.src === project.cover_image_url;
  function append(items: ProjectImage[]) {
    return items
      .filter((image) => !!image.src)
      .map((image) => {
        const next = { ...image, index: images.length };
        images.push(next);
        return next;
      });
  }
  if (project.cover_image_url) {
    entries.push({
      type: "images",
      id: "cover",
      cover: true,
      layout: "full",
      spacing: "regular",
      images: append([
        {
          ...(duplicate ? firstImage : {}),
          src: project.cover_image_url,
          alt:
            firstImage?.src === project.cover_image_url
              ? firstImage.alt
              : project.title,
        },
      ]),
    });
  }
  for (const [index, block] of project.content.entries()) {
    if (block.type === "text") continue;
    if (block.type === "video") {
      if (block.src)
        entries.push({
          type: "video",
          id: `block-${index}`,
          block,
          layout: block.layout ?? "full",
          spacing: block.spacing ?? "regular",
        });
      continue;
    }
    let items: ProjectImage[] = block.type === "image" ? [block] : block.images;
    if (duplicate && items.length) {
      items = items.slice(1);
      duplicate = false;
    }
    const media = append(items);
    if (media.length)
      entries.push({
        type: "images",
        id: `block-${index}`,
        images: media,
        layout: block.layout ?? (block.type === "image" ? "full" : "equal"),
        spacing: block.spacing ?? "regular",
      });
  }
  return { entries, images };
}

export function projectInformation(
  project: Pick<Project, "description" | "content">,
  about: string,
  fallback: string,
) {
  const sections: { id: string; title: string; text: string }[] = [];
  if (project.description?.trim())
    sections.push({
      id: "description",
      title: about,
      text: project.description,
    });
  for (const [index, block] of project.content.entries()) {
    if (block.type === "text" && block.text.trim())
      sections.push({
        id: `text-${index}`,
        title: block.title?.trim() || fallback,
        text: block.text,
      });
  }
  return sections;
}
