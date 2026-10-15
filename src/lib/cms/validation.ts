import type {
  Highlight,
  PanelStyle,
  ProjectContentBlock,
  ProjectInput,
  ProjectMediaItem,
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
/** Logos may also be SVG; nothing else accepts it. */
export const LOGO_TYPES = ["image/svg+xml", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
/** Publishing target for a new case study. */
export const MIN_GALLERY_IMAGES = 1;
export const MAX_HIGHLIGHTS = 3;
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
function optionalString(value: unknown, max = 10000) {
  return (
    value === undefined || (typeof value === "string" && value.length <= max)
  );
}
function optionalBoolean(value: unknown) {
  return value === undefined || typeof value === "boolean";
}
export const MEDIA_FILE =
  /^([0-9a-f-]{36})\.(jpg|png|webp|avif|gif|mp4|webm|svg)$/i;
export const MEDIA_PATH =
  /^\/media\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|avif|gif|mp4|webm|svg)$/i;
export function isVideoSrc(src: string | null | undefined) {
  return !!src && /\.(mp4|webm)$/i.test(src);
}
export function isSvgSrc(src: string | null | undefined) {
  return !!src && /\.svg$/i.test(src);
}
/** A stored media path (or "" for an empty draft slot). SVG is logo-only. */
export function safeMediaUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ((MEDIA_PATH.test(value) && !isSvgSrc(value)) || value === "")
  );
}
const LOCALIZED = ["alt", "alt_en", "caption", "caption_en"] as const;
function image(value: unknown, published: boolean): boolean {
  return (
    record(value) &&
    safeMediaUrl(value.src) &&
    (!published || value.src !== "") &&
    LOCALIZED.every((key) => optionalString(value[key], 2000))
  );
}
function images(value: unknown, published: boolean, length?: number) {
  return (
    Array.isArray(value) &&
    (length === undefined || value.length === length) &&
    value.length <= 100 &&
    value.every((v) => image(v, published))
  );
}
function strings(block: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => optionalString(block[key]));
}
const SINGLE_LAYOUTS = ["full", "center", "start", "end"];
const MULTI_LAYOUTS = ["equal", "staggered"];
const SPACINGS = ["regular", "generous", "extra"];
function oneOf(value: unknown, options: string[]) {
  return (
    value === undefined ||
    (typeof value === "string" && options.includes(value))
  );
}
/** Optional case-study placement of media blocks (layout + spacing). */
function validPresentation(block: Record<string, unknown>) {
  switch (block.type) {
    case "image":
    case "video":
      return (
        oneOf(block.layout, SINGLE_LAYOUTS) && oneOf(block.spacing, SPACINGS)
      );
    case "two_images":
    case "three_images":
    case "gallery":
      return (
        oneOf(block.layout, MULTI_LAYOUTS) && oneOf(block.spacing, SPACINGS)
      );
    case "media_text":
    case "image_row":
      return oneOf(block.spacing, SPACINGS);
    default:
      return true;
  }
}
function validBlock(
  block: unknown,
  published: boolean,
): block is ProjectContentBlock {
  if (!record(block)) return false;
  if (
    !optionalString(block.id, 100) ||
    !optionalBoolean(block.hidden) ||
    !validPresentation(block)
  )
    return false;
  // Hidden blocks may stay incomplete; they never render publicly.
  const complete = published && !block.hidden;
  switch (block.type) {
    case "text":
      return (
        typeof block.text === "string" &&
        strings(block, [
          "text_en",
          "title",
          "title_en",
          "eyebrow",
          "eyebrow_en",
        ]) &&
        optionalBoolean(block.collapsible) &&
        (block.subsections === undefined ||
          (Array.isArray(block.subsections) &&
            block.subsections.length <= 20 &&
            block.subsections.every(
              (item) =>
                record(item) &&
                typeof item.text === "string" &&
                strings(item, ["text_en", "title", "title_en"]),
            ))) &&
        (!complete || block.text.trim().length > 0)
      );
    case "image":
      return image(block, complete);
    case "video":
      return (
        safeMediaUrl(block.src) &&
        (!complete || block.src !== "") &&
        (block.poster === undefined || safeMediaUrl(block.poster)) &&
        ["autoplay", "loop", "muted", "controls"].every((key) =>
          optionalBoolean(block[key]),
        )
      );
    case "two_images":
      return images(block.images, complete, 2);
    case "three_images":
      return images(block.images, complete, 3);
    case "image_row":
      return (
        images(block.images, complete) &&
        (block.images as unknown[]).length >= 1 &&
        (block.images as unknown[]).length <= 3
      );
    case "gallery":
      return (
        images(block.images, complete) &&
        (!complete || (block.images as unknown[]).length > 0)
      );
    case "media_text":
      return (
        image(block, complete) &&
        typeof block.text === "string" &&
        strings(block, [
          "text_en",
          "title",
          "title_en",
          "eyebrow",
          "eyebrow_en",
        ]) &&
        (block.side === undefined ||
          block.side === "start" ||
          block.side === "end") &&
        optionalBoolean(block.feature)
      );
    case "highlights":
      return strings(block, ["title", "title_en"]);
  }
  return false;
}
export function validateContent(
  value: unknown,
  published = false,
): asserts value is ProjectContentBlock[] {
  if (!Array.isArray(value) || value.length > 100)
    throw new Error("תוכן הפרויקט אינו תקין. ניתן להוסיף עד 100 בלוקים.");
  for (const block of value)
    if (!validBlock(block, published))
      throw new Error(
        "יש בלוק לא תקין או חסר. לפני פרסום יש למלא טקסט ולהעלות את המדיה בכל בלוק גלוי.",
      );
}
/** Lenient reader: a block written by newer code never breaks a page. */
export function parseContent(value: unknown): ProjectContentBlock[] {
  return Array.isArray(value)
    ? value.filter((block) => validBlock(block, false))
    : [];
}

const MEDIA_TEXT = [
  "alt",
  "alt_en",
  "caption",
  "caption_en",
  "description",
  "description_en",
] as const;
function validMediaItem(value: unknown): value is ProjectMediaItem {
  if (!record(value) || typeof value.src !== "string") return false;
  return (
    MEDIA_PATH.test(value.src) &&
    (!isSvgSrc(value.src) || value.role === "logo") &&
    value.kind === (isVideoSrc(value.src) ? "video" : "image") &&
    (value.role === undefined ||
      value.role === "logo" ||
      value.role === "main_video") &&
    (value.role !== "main_video" || value.kind === "video") &&
    (value.role !== "logo" || value.kind === "image") &&
    (value.poster === undefined ||
      (safeMediaUrl(value.poster) && !isVideoSrc(value.poster))) &&
    ["width", "height"].every(
      (key) =>
        value[key] === undefined ||
        (Number.isInteger(value[key]) &&
          (value[key] as number) > 0 &&
          (value[key] as number) < 100000),
    ) &&
    MEDIA_TEXT.every((key) => optionalString(value[key], 2000)) &&
    oneOf(value.layout, SINGLE_LAYOUTS) &&
    optionalBoolean(value.autoplay) &&
    optionalBoolean(value.loop)
  );
}
/** Lenient readers for the JSON columns, mirroring parseContent. */
export function parseMedia(value: unknown): ProjectMediaItem[] {
  return Array.isArray(value) ? value.filter(validMediaItem) : [];
}
function validHighlight(value: unknown): value is Highlight {
  return (
    record(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.id.length <= 100 &&
    typeof value.value === "string" &&
    value.value.length <= 40 &&
    typeof value.label === "string" &&
    value.label.length <= 200 &&
    optionalString(value.label_en, 200) &&
    optionalString(value.description, 1000) &&
    optionalString(value.description_en, 1000) &&
    optionalBoolean(value.on_homepage) &&
    optionalBoolean(value.on_archive)
  );
}
export function parseHighlights(value: unknown): Highlight[] {
  return Array.isArray(value)
    ? value.filter(validHighlight).slice(0, MAX_HIGHLIGHTS)
    : [];
}
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
function validPanelStyle(value: unknown): value is PanelStyle {
  return (
    record(value) &&
    Object.entries(value).every(
      ([key, color]) =>
        (key === "color" || key === "text") &&
        typeof color === "string" &&
        HEX_COLOR.test(color),
    )
  );
}
export function parsePanelStyle(value: unknown): PanelStyle | null {
  return validPanelStyle(value) ? value : null;
}

const TEXT_FIELDS = [
  "client",
  "client_en",
  "title_en",
  "headline",
  "headline_en",
  "short_description",
  "short_description_en",
  "description",
  "description_en",
  "archive_description",
  "archive_description_en",
  "role",
  "role_en",
  "target_audience",
  "target_audience_en",
  "audience_description",
  "audience_description_en",
  "seo_title",
  "seo_title_en",
  "seo_description",
  "seo_description_en",
] as const;
function idList(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === "string" && UUID.test(v)) &&
    new Set(value).size === value.length
  );
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
  for (const field of TEXT_FIELDS)
    if (
      value[field] !== null &&
      (typeof value[field] !== "string" || value[field].length > 10000)
    )
      throw new Error("פרטי הפרויקט אינם תקינים.");
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
    value.og_image_url !== null &&
    (!safeMediaUrl(value.og_image_url) ||
      !/\.(jpg|png|webp)$/i.test(value.og_image_url))
  )
    throw new Error("תמונת השיתוף חייבת להיות JPEG, PNG או WebP.");
  if (value.website_url !== null) {
    let url: URL | null = null;
    try {
      url = new URL(value.website_url);
    } catch {}
    if (
      !url ||
      !["http:", "https:"].includes(url.protocol) ||
      value.website_url.length > 2000
    )
      throw new Error("כתובת האתר חייבת להתחיל ב־https:// או http://.");
  }
  if (
    !idList(value.category_ids) ||
    (value.type_id !== null && !UUID.test(value.type_id))
  )
    throw new Error("בחירת הקטגוריות או סוג הפרויקט אינה תקינה.");
  if (value.panel_style !== null && !validPanelStyle(value.panel_style))
    throw new Error("רקע הפאנל אינו תקין. בחרו צבע בפורמט ‎#RRGGBB.");
  if (
    !Array.isArray(value.media) ||
    value.media.length > 100 ||
    !value.media.every(validMediaItem) ||
    new Set(value.media.map((m) => m.src)).size !== value.media.length
  )
    throw new Error("הגלריה אינה תקינה. בדקו את הקבצים והפרטים שלהם.");
  for (const role of ["logo", "main_video"] as const)
    if (value.media.filter((m) => m.role === role).length > 1)
      throw new Error(
        role === "logo"
          ? "ניתן לבחור לוגו אחד בלבד."
          : "ניתן לבחור סרטון ראשי אחד בלבד.",
      );
  if (
    !Array.isArray(value.highlights) ||
    value.highlights.length > MAX_HIGHLIGHTS ||
    !value.highlights.every(validHighlight) ||
    new Set(value.highlights.map((h) => h.id)).size !==
      value.highlights.length ||
    value.highlights.filter((h) => h.on_homepage).length > 1 ||
    value.highlights.filter((h) => h.on_archive).length > 1
  )
    throw new Error(
      "ההיילייטס אינם תקינים. עד שלושה פריטים, ואחד לכל היותר לכל כרטיס.",
    );
  validateContent(value.content, value.published);
}

export type ReadinessTab = "general" | "cards" | "case" | "gallery" | "seo";
export type ReadinessIssue = { tab: ReadinessTab; message: string };
export function galleryImages(media: ProjectMediaItem[]) {
  return media.filter((m) => m.kind === "image" && m.role !== "logo");
}
/**
 * What a project still needs before it can be published, and what is merely
 * recommended. Used by the editor checklist, the list badges and the server
 * gate. Blocking rules apply only when a draft is published for the first
 * time; projects that are already live get the same list as warnings.
 */
export function projectReadiness(project: ProjectInput): {
  errors: ReadinessIssue[];
  warnings: ReadinessIssue[];
} {
  const errors: ReadinessIssue[] = [];
  const warnings: ReadinessIssue[] = [];
  const blank = (v: string | null | undefined) => !v?.trim();
  if (blank(project.title))
    errors.push({ tab: "general", message: "חסר שם פרויקט." });
  if (blank(project.short_description))
    errors.push({ tab: "cards", message: "חסר תיאור קצר לכרטיס הפרויקט." });
  if (!project.cover_image_url)
    errors.push({ tab: "cards", message: "חסרה מדיה ראשית (קאבר)." });
  // Projects without a slug are card-only and have no case study page.
  if (project.slug) {
    if (!project.media.some((m) => m.role === "logo"))
      errors.push({ tab: "gallery", message: "חסר לוגו לפרויקט." });
    if (!project.media.some((m) => m.role === "main_video"))
      errors.push({ tab: "gallery", message: "חסר סרטון ראשי." });
    const count = galleryImages(project.media).length;
    if (count < MIN_GALLERY_IMAGES)
      errors.push({
        tab: "gallery",
        message: `בגלריה ${count} תמונות. נדרשת לפחות תמונה אחת.`,
      });
  }
  if (blank(project.title_en) || blank(project.short_description_en))
    warnings.push({
      tab: "general",
      message: "חסר תרגום לאנגלית לשם או לתיאור הקצר.",
    });
  if (!project.category_ids.length)
    warnings.push({ tab: "general", message: "לא נבחרה קטגוריה." });
  if (!project.type_id)
    warnings.push({ tab: "general", message: "לא נבחר סוג פרויקט." });
  if (galleryImages(project.media).some((m) => blank(m.alt)))
    warnings.push({
      tab: "gallery",
      message: "לחלק מהתמונות בגלריה חסר טקסט חלופי.",
    });
  if (project.highlights.some((h) => blank(h.value) || blank(h.label)))
    warnings.push({ tab: "case", message: "יש היילייט בלי ערך או תווית." });
  if (blank(project.seo_title) || blank(project.seo_description))
    warnings.push({ tab: "seo", message: "חסרים כותרת ותיאור SEO." });
  return { errors, warnings };
}

export function mediaReferences(project: {
  cover_image_url: string | null;
  homepage_image_url: string | null;
  projects_image_url: string | null;
  og_image_url?: string | null;
  content: unknown;
  media?: unknown;
}): string[] {
  const values = [
    project.cover_image_url,
    project.homepage_image_url,
    project.projects_image_url,
    project.og_image_url,
  ];
  for (const list of [project.content, project.media])
    if (Array.isArray(list))
      for (const block of list) {
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
