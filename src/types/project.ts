import type { Database } from "./database.types";

// Hebrew is the primary language: each user-facing text has an optional
// `<key>_en` sibling, and missing English falls back to Hebrew.

export type ProjectImage = {
  src: string;
  alt?: string;
  alt_en?: string;
  caption?: string;
  caption_en?: string;
};
/** Every block can be hidden without deleting it. */
type BlockBase = { id?: string; hidden?: boolean };
// Case-study placement: where media sits in the gallery column, and how much
// space precedes it. Older blocks default to full width / equal pairs.
export type MediaSpacing = "regular" | "generous" | "extra";
export type SingleMediaLayout = "full" | "center" | "start" | "end";
export type MultiMediaLayout = "equal" | "staggered";
type SinglePresentation = {
  layout?: SingleMediaLayout;
  spacing?: MediaSpacing;
};
type MultiPresentation = { layout?: MultiMediaLayout; spacing?: MediaSpacing };
export type TextSubsection = {
  title?: string;
  title_en?: string;
  text: string;
  text_en?: string;
};
export type TextBlock = BlockBase & {
  type: "text";
  eyebrow?: string;
  eyebrow_en?: string;
  title?: string;
  title_en?: string;
  text: string;
  text_en?: string;
  collapsible?: boolean;
  subsections?: TextSubsection[];
};
export type ImageBlock = BlockBase & {
  type: "image";
} & ProjectImage &
  SinglePresentation;
export type VideoBlock = BlockBase & {
  type: "video";
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
} & SinglePresentation;
export type TwoImagesBlock = BlockBase & {
  type: "two_images";
  images: [ProjectImage, ProjectImage];
} & MultiPresentation;
export type ThreeImagesBlock = BlockBase & {
  type: "three_images";
  images: [ProjectImage, ProjectImage, ProjectImage];
} & MultiPresentation;
/** One case-study row of 1–3 images, side by side at equal height on desktop. */
export type ImageRowBlock = BlockBase & {
  type: "image_row";
  images: ProjectImage[];
  spacing?: MediaSpacing;
};
export type GalleryBlock = BlockBase & {
  type: "gallery";
  images: ProjectImage[];
} & MultiPresentation;
/** Image or video beside text. `feature` styles it as a product feature. */
export type MediaTextBlock = BlockBase &
  ProjectImage & {
    type: "media_text";
    eyebrow?: string;
    eyebrow_en?: string;
    title?: string;
    title_en?: string;
    text: string;
    text_en?: string;
    side?: "start" | "end";
    feature?: boolean;
    spacing?: MediaSpacing;
  };
/** Renders the project's highlights at this position. */
export type HighlightsBlock = BlockBase & {
  type: "highlights";
  title?: string;
  title_en?: string;
};
export type ProjectContentBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | TwoImagesBlock
  | ThreeImagesBlock
  | ImageRowBlock
  | GalleryBlock
  | MediaTextBlock
  | HighlightsBlock;
export type BlockType = ProjectContentBlock["type"];

/** Placement of a gallery file that no block places explicitly. */
export type MediaLayout = SingleMediaLayout;
/** One uploaded gallery file. `src` doubles as its id everywhere. */
export type ProjectMediaItem = {
  src: string;
  kind: "image" | "video";
  /** Optional card previews; at most one file is selected per surface. */
  hover_homepage?: boolean;
  hover_projects?: boolean;
  role?: "logo" | "main_video";
  poster?: string;
  width?: number;
  height?: number;
  alt?: string;
  alt_en?: string;
  caption?: string;
  caption_en?: string;
  description?: string;
  description_en?: string;
  layout?: MediaLayout;
  autoplay?: boolean;
  loop?: boolean;
};
/** A project fact, not necessarily a result ("6K+ — community members"). */
export type Highlight = {
  id: string;
  value: string;
  label: string;
  label_en?: string;
  description?: string;
  description_en?: string;
  on_homepage?: boolean;
  on_archive?: boolean;
};

/** Stored kinds. "service" rows are legacy: they were merged into categories,
 * and the shared table still allows them for the other product. */
export type TermKind = "category" | "service" | "type";
/** The lists this site manages. */
export type ManagedKind = Exclude<TermKind, "service">;
/** The case study panel's own colours (#rrggbb). Without `text`, the text is
 * light or dark by the background's luminance. */
export type PanelStyle = {
  color?: string;
  text?: string;
};
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Term = Category & { kind: TermKind };
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type Project = Omit<
  ProjectRow,
  "content" | "media" | "highlights" | "services" | "panel_style"
> & {
  content: ProjectContentBlock[];
  media: ProjectMediaItem[];
  highlights: Highlight[];
  panel_style: PanelStyle | null;
  categories: Term[];
  type: Term | null;
};
export type ProjectInput = Omit<
  Project,
  "categories" | "type" | "created_at" | "updated_at" | "source"
> & { category_ids: string[]; type_id: string | null };
