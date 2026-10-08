import type { Database } from "./database.types";

export type ProjectImage = { src: string; alt?: string; caption?: string };
export type TextBlock = {
  type: "text";
  title?: string;
  text: string;
  collapsible?: boolean;
};
export type ImageBlock = { type: "image" } & ProjectImage;
export type VideoBlock = {
  type: "video";
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
};
export type TwoImagesBlock = {
  type: "two_images";
  images: [ProjectImage, ProjectImage];
};
export type GalleryBlock = { type: "gallery"; images: ProjectImage[] };
export type ProjectContentBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | TwoImagesBlock
  | GalleryBlock;
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type Project = Omit<ProjectRow, "content"> & {
  content: ProjectContentBlock[];
  categories: Category[];
};
export type ProjectInput = Omit<
  Project,
  "categories" | "created_at" | "updated_at"
> & { category_ids: string[] };
