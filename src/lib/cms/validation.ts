import type {
  ProjectContentBlock,
  ProjectImage,
  ProjectInput,
} from "@/types/project";

export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SLUG = /^[a-z0-9א-ת]+(?:-[a-z0-9א-ת]+)*$/;
export const MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
] as const;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/['"׳״]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9א-ת]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}
export function safeMediaUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (/^\/media\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|avif|gif|mp4|webm)$/i.test(
      value,
    ) ||
      value === "")
  );
}
function image(value: unknown, published: boolean): value is ProjectImage {
  return (
    record(value) &&
    safeMediaUrl(value.src) &&
    (!published || value.src !== "") &&
    optionalString(value.alt) &&
    optionalString(value.caption)
  );
}
export function validateContent(
  value: unknown,
  published = false,
): asserts value is ProjectContentBlock[] {
  if (!Array.isArray(value) || value.length > 100)
    throw new Error("תוכן הפרויקט אינו תקין. ניתן להוסיף עד 100 בלוקים.");
  for (const block of value) {
    if (!record(block)) throw new Error("בלוק תוכן אינו תקין.");
    const boolean = (key: string) =>
      block[key] === undefined || typeof block[key] === "boolean";
    let valid = false;
    switch (block.type) {
      case "text":
        valid =
          typeof block.text === "string" &&
          optionalString(block.title) &&
          boolean("collapsible") &&
          (!published || block.text.trim().length > 0);
        break;
      case "image":
        valid = image(block, published);
        break;
      case "video":
        valid =
          safeMediaUrl(block.src) &&
          (!published || block.src !== "") &&
          (block.poster === undefined || safeMediaUrl(block.poster)) &&
          ["autoplay", "loop", "muted", "controls"].every(boolean);
        break;
      case "two_images":
        valid =
          Array.isArray(block.images) &&
          block.images.length === 2 &&
          block.images.every((v) => image(v, published));
        break;
      case "gallery":
        valid =
          Array.isArray(block.images) &&
          (!published || block.images.length > 0) &&
          block.images.every((v) => image(v, published));
        break;
    }
    if (block.type !== "text") {
      const layouts =
        block.type === "image" || block.type === "video"
          ? ["full", "center", "start", "end"]
          : ["equal", "staggered"];
      valid =
        valid &&
        (block.layout === undefined ||
          (typeof block.layout === "string" &&
            layouts.includes(block.layout))) &&
        (block.spacing === undefined ||
          (typeof block.spacing === "string" &&
            ["regular", "generous", "extra"].includes(block.spacing)));
    }
    if (!valid)
      throw new Error(
        "יש בלוק לא תקין או חסר. לפני פרסום יש למלא טקסט ולהעלות את המדיה בכל בלוק.",
      );
  }
}
export function validateProject(value: ProjectInput) {
  if (!UUID.test(value.id) || !value.title.trim())
    throw new Error("שם הפרויקט נדרש.");
  if (value.title.length > 250)
    throw new Error("שם הפרויקט ארוך מדי. ניתן להזין עד 250 תווים.");
  if (
    value.slug !== null &&
    (typeof value.slug !== "string" || !SLUG.test(value.slug))
  )
    throw new Error("יש להזין כתובת תקינה: אותיות, מספרים ומקפים.");
  if (
    value.year !== null &&
    (!Number.isInteger(value.year) || value.year < 1900 || value.year > 2100)
  )
    throw new Error("יש להזין שנה בין 1900 ל־2100.");
  for (const field of [
    "client",
    "headline",
    "short_description",
    "description",
  ] as const) {
    if (value[field] !== null && typeof value[field] !== "string")
      throw new Error("פרטי הפרויקט אינם תקינים.");
  }
  for (const field of [
    "featured",
    "published",
    "show_on_homepage",
    "show_on_projects",
  ] as const)
    if (typeof value[field] !== "boolean")
      throw new Error("הגדרות הפרסום אינן תקינות.");
  for (const field of ["homepage_order", "projects_order"] as const)
    if (
      value[field] !== null &&
      (!Number.isSafeInteger(value[field]) ||
        Math.abs(value[field]) > 2147483647)
    )
      throw new Error("סדר התצוגה חייב להיות מספר שלם.");
  for (const field of [
    "cover_image_url",
    "homepage_image_url",
    "projects_image_url",
  ] as const)
    if (
      value[field] !== null &&
      (!safeMediaUrl(value[field]) || value[field] === "")
    )
      throw new Error("כתובת מדיה אינה תקינה.");
  if (
    !Array.isArray(value.services) ||
    value.services.some(
      (v) => typeof v !== "string" || !v.trim() || v.length > 100,
    )
  )
    throw new Error("רשימת השירותים אינה תקינה.");
  if (
    !Array.isArray(value.category_ids) ||
    value.category_ids.some((v) => !UUID.test(v)) ||
    new Set(value.category_ids).size !== value.category_ids.length
  )
    throw new Error("בחירת הקטגוריות אינה תקינה.");
  validateContent(value.content, value.published);
}
export function mediaReferences(project: {
  cover_image_url: string | null;
  homepage_image_url: string | null;
  projects_image_url: string | null;
  content: unknown;
}): string[] {
  const values = [
    project.cover_image_url,
    project.homepage_image_url,
    project.projects_image_url,
  ];
  if (Array.isArray(project.content))
    for (const block of project.content) {
      if (!record(block)) continue;
      if (typeof block.src === "string") values.push(block.src);
      if (typeof block.poster === "string") values.push(block.poster);
      if (Array.isArray(block.images))
        for (const item of block.images)
          if (record(item) && typeof item.src === "string")
            values.push(item.src);
    }
  return [
    ...new Set(
      values.filter(
        (v): v is string => typeof v === "string" && v.startsWith("/media/"),
      ),
    ),
  ];
}
