import { parse as parseYaml } from "yaml";
import { inspectHeadings, type Heading } from "./headings.ts";
import {
  ARTICLE_LIMITS,
  CALLOUT_TYPES,
  RESERVED_SLUGS,
  type CalloutType,
} from "./limits.ts";
import { readingMinutes } from "./reading-time.ts";
import { webpSize } from "./webp.ts";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const LETTER = /\p{L}/u;
const IMAGE_FILE = /^[a-z0-9-]+\.webp$/;

export type ArticleSource = { title: string; url: string };
export type ArticleFaq = { q: string; a: string };

export type Article = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  cover?: string;
  coverAlt?: string;
  focusKeyword?: string;
  sources: ArticleSource[];
  faq: ArticleFaq[];
  draft: boolean;
  readingMinutes: number;
  headings: Heading[];
  body: string;
};

export class ArticleValidationError extends Error {
  readonly file: string;
  readonly issues: string[];

  constructor(file: string, issues: string[]) {
    super(
      `Article ${file} failed validation:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
    );
    this.name = "ArticleValidationError";
    this.file = file;
    this.issues = issues;
  }
}

export class ArticleCollectionError extends Error {
  readonly errors: ArticleValidationError[];

  constructor(errors: ArticleValidationError[]) {
    super(
      `${errors.length} article ${errors.length === 1 ? "file" : "files"} failed validation:\n\n${errors
        .map((error) => error.message)
        .join("\n\n")}`,
    );
    this.name = "ArticleCollectionError";
    this.errors = errors;
  }
}

export type ArticleFiles = {
  /** Return the file bytes for a site path such as `/articles/slug/cover.webp`. */
  readWebp: (sitePath: string) => Uint8Array | null;
};

const ARTICLE_KEYS = new Set([
  "title",
  "description",
  "date",
  "updated",
  "category",
  "tags",
  "cover",
  "coverAlt",
  "focusKeyword",
  "sources",
  "faq",
  "draft",
]);

export function validateArticleSource(
  slug: string,
  source: string,
  files: ArticleFiles,
): Article {
  const file = `content/articles/${slug}.mdx`;
  const issues: string[] = [];
  validateSlug(slug, issues);

  const text = source.replace(/^\uFEFF/, "");
  const split = splitFrontmatter(text, issues);
  if (!split) throw new ArticleValidationError(file, issues);

  const data = parseFrontmatter(split.yaml, issues);
  if (!data) throw new ArticleValidationError(file, issues);

  for (const key of Object.keys(data)) {
    if (!ARTICLE_KEYS.has(key)) {
      issues.push(
        `Unknown frontmatter field "${key}". Remove it. The allowed fields are listed in docs/articles-authoring.md.`,
      );
    }
  }

  const title = readLine(data, "title", issues, {
    required: true,
    ...ARTICLE_LIMITS.title,
  });
  if (title?.includes("|") || title?.includes("Moriz Studio")) {
    issues.push(
      'title must not contain "|" or "Moriz Studio". The site appends " | Moriz Studio".',
    );
  }

  const description = readLine(data, "description", issues, {
    required: true,
    ...ARTICLE_LIMITS.description,
  });
  const date = readDate(data, "date", issues, true);
  const updated = readDate(data, "updated", issues, false);
  if (date && updated && updated < date) {
    issues.push(`updated (${updated}) is earlier than date (${date}).`);
  }
  const category = readLine(data, "category", issues, {
    required: true,
    ...ARTICLE_LIMITS.category,
  });
  const tags = readTags(data, issues);
  const cover = readCover(data, slug, issues, files);
  const coverAlt = readLine(data, "coverAlt", issues, {
    required: false,
    ...ARTICLE_LIMITS.coverAlt,
  });
  if (cover && !coverAlt) {
    issues.push("coverAlt is required when cover is set.");
  }
  if (!cover && "coverAlt" in data) {
    issues.push("coverAlt is set without cover. Remove coverAlt, or add a cover.");
  }
  const focusKeyword = readLine(data, "focusKeyword", issues, {
    required: false,
    ...ARTICLE_LIMITS.focusKeyword,
  });
  if (focusKeyword && description && !description.includes(focusKeyword)) {
    issues.push(
      `description must include the focus keyword "${focusKeyword}" exactly.`,
    );
  }
  const sources = readSources(data, issues);
  const faq = readFaq(data, issues);
  const draft = readDraft(data, issues);
  const body = split.body.replace(/^\n/, "");
  validateBody(slug, body, issues, files);
  const inspected = inspectHeadings(body);
  issues.push(...inspected.issues);

  if (
    !title ||
    !description ||
    !date ||
    !category ||
    !tags ||
    !sources ||
    !faq ||
    draft === undefined ||
    issues.length
  ) {
    throw new ArticleValidationError(file, issues);
  }

  return {
    slug,
    title,
    description,
    date,
    ...(updated ? { updated } : {}),
    category,
    tags,
    ...(cover && coverAlt ? { cover, coverAlt } : {}),
    ...(focusKeyword ? { focusKeyword } : {}),
    sources,
    faq,
    draft,
    readingMinutes: readingMinutes(body),
    headings: inspected.headings,
    body,
  };
}

function validateSlug(slug: string, issues: string[]) {
  const { min, max } = ARTICLE_LIMITS.slug;
  if (!SLUG.test(slug) || slug.length < min || slug.length > max) {
    issues.push(
      `Filename slug "${slug}" must be ${min}–${max} characters of lowercase ASCII letters, numbers, and single hyphens.`,
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    issues.push(
      `Slug "${slug}" is reserved. Pick another filename. Reserved: ${[...RESERVED_SLUGS].sort().join(", ")}.`,
    );
  }
}

function splitFrontmatter(
  source: string,
  issues: string[],
): { yaml: string; body: string } | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!match) {
    issues.push(
      "The file must start with YAML frontmatter, opened and closed by a line that is exactly ---.",
    );
    return null;
  }
  return { yaml: match[1], body: source.slice(match[0].length) };
}

function parseFrontmatter(
  yaml: string,
  issues: string[],
): Record<string, unknown> | null {
  try {
    const data = parseYaml(yaml, { schema: "core", strict: true });
    if (!isRecord(data)) {
      issues.push("Frontmatter must be a YAML mapping of fields, not a list or a bare value.");
      return null;
    }
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    issues.push(`Frontmatter YAML could not be parsed: ${message}`);
    return null;
  }
}

function readLine(
  data: Record<string, unknown>,
  key: string,
  issues: string[],
  bounds: { required: boolean; min: number; max: number },
) {
  if (!(key in data) || data[key] === undefined) {
    if (bounds.required) issues.push(`${key} is required.`);
    return undefined;
  }
  const value = data[key];
  if (typeof value !== "string") {
    issues.push(`${key} must be a string.`);
    return undefined;
  }
  if (value !== value.trim()) {
    issues.push(`${key} has leading or trailing whitespace.`);
  }
  if (/[\r\n]/.test(value)) {
    issues.push(`${key} must be a single line.`);
  }
  const length = [...value].length;
  if (length < bounds.min || length > bounds.max) {
    issues.push(
      `${key} must be ${bounds.min}–${bounds.max} characters (got ${length}).`,
    );
  }
  if (bounds.required && !LETTER.test(value)) {
    issues.push(`${key} must contain a letter.`);
  }
  return value;
}

function readDate(
  data: Record<string, unknown>,
  key: string,
  issues: string[],
  required: boolean,
) {
  if (!(key in data) || data[key] === undefined) {
    if (required) issues.push(`${key} is required.`);
    return undefined;
  }
  const value = data[key];
  if (typeof value !== "string" || !isIsoDate(value)) {
    issues.push(
      `${key} must be a real calendar date written YYYY-MM-DD. Quote it so YAML keeps it a string.`,
    );
    return undefined;
  }
  return value;
}

function isIsoDate(value: string) {
  const match = DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2000 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function readTags(data: Record<string, unknown>, issues: string[]) {
  if (!("tags" in data) || data.tags === undefined) return [];
  const value = data.tags;
  if (!Array.isArray(value)) {
    issues.push("tags must be a YAML list of strings. Omit the field when there are none.");
    return null;
  }
  if (value.length > ARTICLE_LIMITS.tags.max) {
    issues.push(`tags can include at most ${ARTICLE_LIMITS.tags.max} items.`);
  }
  const tags: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      issues.push("Every tag must be a string.");
      continue;
    }
    const length = [...item].length;
    if (
      item !== item.trim() ||
      length < ARTICLE_LIMITS.tag.min ||
      length > ARTICLE_LIMITS.tag.max
    ) {
      issues.push(
        `Tag "${item}" must be ${ARTICLE_LIMITS.tag.min}–${ARTICLE_LIMITS.tag.max} characters without surrounding whitespace.`,
      );
      continue;
    }
    if (tags.includes(item)) issues.push(`Tag "${item}" is duplicated.`);
    tags.push(item);
  }
  return tags;
}

function readCover(
  data: Record<string, unknown>,
  slug: string,
  issues: string[],
  files: ArticleFiles,
) {
  if (!("cover" in data) || data.cover === undefined) return undefined;
  const expected = `/articles/${slug}/cover.webp`;
  if (data.cover !== expected) {
    issues.push(
      `cover must be exactly "${expected}". Put the file at public${expected}.`,
    );
    return undefined;
  }
  const bytes = files.readWebp(expected);
  if (!bytes) {
    issues.push(`cover file is missing at public${expected}.`);
    return undefined;
  }
  if (bytes.byteLength > ARTICLE_LIMITS.coverMaxBytes) {
    issues.push(
      `cover.webp is ${bytes.byteLength} bytes. Keep it at or under ${ARTICLE_LIMITS.coverMaxBytes} bytes.`,
    );
  }
  const size = webpSize(bytes);
  if (
    !size ||
    size.width !== ARTICLE_LIMITS.coverWidth ||
    size.height !== ARTICLE_LIMITS.coverHeight
  ) {
    const actual = size ? `${size.width}×${size.height}` : "unreadable";
    issues.push(
      `cover.webp must be a WebP of exactly ${ARTICLE_LIMITS.coverWidth}×${ARTICLE_LIMITS.coverHeight} (got ${actual}).`,
    );
  }
  return expected;
}

function readSources(data: Record<string, unknown>, issues: string[]) {
  if (!("sources" in data) || data.sources === undefined) return [];
  if (!Array.isArray(data.sources)) {
    issues.push("sources must be a YAML list of { title, url }. Omit it when there are none.");
    return null;
  }
  if (data.sources.length > ARTICLE_LIMITS.sources.max) {
    issues.push(`sources can include at most ${ARTICLE_LIMITS.sources.max} items.`);
  }
  const sources: ArticleSource[] = [];
  for (const [index, item] of data.sources.entries()) {
    const label = `sources[${index}]`;
    if (!isRecord(item)) {
      issues.push(`${label} must be a mapping with title and url.`);
      continue;
    }
    for (const key of Object.keys(item)) {
      if (key !== "title" && key !== "url") {
        issues.push(`${label} has unknown field "${key}". Use only title and url.`);
      }
    }
    const title = readLine(item, "title", issues, {
      required: true,
      min: ARTICLE_LIMITS.sourceTitle.min,
      max: ARTICLE_LIMITS.sourceTitle.max,
    });
    const url = item.url;
    if (typeof url !== "string" || !isHttpsUrl(url)) {
      issues.push(`${label}.url must be an absolute https URL without a username or password.`);
    } else if (sources.some((source) => source.url === url)) {
      issues.push(`${label}.url is duplicated (${url}).`);
    }
    if (title && typeof url === "string" && isHttpsUrl(url)) {
      sources.push({ title, url });
    }
  }
  return sources;
}

function readFaq(data: Record<string, unknown>, issues: string[]) {
  if (!("faq" in data) || data.faq === undefined) return [];
  if (!Array.isArray(data.faq)) {
    issues.push("faq must be a YAML list of { q, a }. Omit it when there are none.");
    return null;
  }
  if (data.faq.length > ARTICLE_LIMITS.faq.max) {
    issues.push(`faq can include at most ${ARTICLE_LIMITS.faq.max} items.`);
  }
  const faq: ArticleFaq[] = [];
  for (const [index, item] of data.faq.entries()) {
    const label = `faq[${index}]`;
    if (!isRecord(item)) {
      issues.push(`${label} must be a mapping with q and a.`);
      continue;
    }
    for (const key of Object.keys(item)) {
      if (key !== "q" && key !== "a") {
        issues.push(`${label} has unknown field "${key}". Use q and a.`);
      }
    }
    const question = readLine(item, "q", issues, {
      required: true,
      min: ARTICLE_LIMITS.faqQuestion.min,
      max: ARTICLE_LIMITS.faqQuestion.max,
    });
    const answer = readText(item, "a", issues, {
      min: ARTICLE_LIMITS.faqAnswer.min,
      max: ARTICLE_LIMITS.faqAnswer.max,
    });
    if (question && faq.some((entry) => entry.q === question)) {
      issues.push(`${label}.q repeats an earlier question.`);
    }
    if (question && answer) faq.push({ q: question, a: answer });
  }
  return faq;
}

function readText(
  data: Record<string, unknown>,
  key: string,
  issues: string[],
  bounds: { min: number; max: number },
) {
  if (!(key in data) || data[key] === undefined) {
    issues.push(`${key} is required.`);
    return undefined;
  }
  const value = data[key];
  if (typeof value !== "string") {
    issues.push(`${key} must be a string.`);
    return undefined;
  }
  const trimmed = value.trim();
  const length = [...trimmed].length;
  if (length < bounds.min || length > bounds.max) {
    issues.push(`${key} must be ${bounds.min}–${bounds.max} characters (got ${length}).`);
  }
  if (!LETTER.test(trimmed)) issues.push(`${key} must contain a letter.`);
  return trimmed;
}

function readDraft(data: Record<string, unknown>, issues: string[]) {
  if (!("draft" in data) || data.draft === undefined) return false;
  if (typeof data.draft !== "boolean") {
    issues.push('draft must be a boolean (draft: true or draft: false), not a string.');
    return undefined;
  }
  return data.draft;
}

function validateBody(
  slug: string,
  body: string,
  issues: string[],
  files: ArticleFiles,
) {
  const length = [...body.trim()].length;
  if (length < ARTICLE_LIMITS.body.min || length > ARTICLE_LIMITS.body.max) {
    issues.push(
      `Article body must be ${ARTICLE_LIMITS.body.min}–${ARTICLE_LIMITS.body.max} characters (got ${length}).`,
    );
  }
  const fenceOpens = body.match(/^```/gm)?.length ?? 0;
  if (fenceOpens % 2 !== 0) {
    issues.push("A code fence (```) is missing its closing line.");
  }
  const prose = stripFences(body);
  if (/^[ \t]*import\s/m.test(prose) || /^[ \t]*export\s/m.test(prose)) {
    issues.push(
      "The body cannot import or export JavaScript. Use Markdown plus Callout and Figure only.",
    );
  }
  if (/<\/?[a-z][\w:-]*(\s|\/?>)/.test(prose)) {
    issues.push("Raw HTML is not allowed. Use Markdown, Callout, or Figure.");
  }
  if (/javascript:/i.test(prose)) {
    issues.push("javascript: URLs are not allowed.");
  }
  for (const match of prose.matchAll(/<\/?([A-Z][A-Za-z0-9]*)\b/g)) {
    const name = match[1];
    if (name !== "Callout" && name !== "Figure") {
      issues.push(`Unknown component <${name}>. Allowed components: Callout, Figure.`);
    }
  }
  for (const match of prose.matchAll(/<Callout\b([^>]*)>/g)) {
    const attrs = match[1];
    if (/type\s*=\s*\{/.test(attrs)) {
      issues.push('Callout type must be a quoted string, for example type="tip".');
    }
    const typed = /type\s*=\s*["']([^"']*)["']/.exec(attrs);
    if (typed && !CALLOUT_TYPES.includes(typed[1] as CalloutType)) {
      issues.push(
        `Callout type "${typed[1]}" is not allowed. Use note, tip, or warning.`,
      );
    }
  }
  for (const match of prose.matchAll(/<Figure\b([^>]*)\/?>/g)) {
    validateFigure(slug, match[1], issues, files);
  }
  for (const match of prose.matchAll(/!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const alt = match[1].trim();
    const src = match[2];
    if (!alt) {
      issues.push(`Image ${src} is missing alt text. Write ![description](${src}).`);
    }
    validateImagePath(slug, src, issues, files);
  }
}

function validateFigure(
  slug: string,
  attrs: string,
  issues: string[],
  files: ArticleFiles,
) {
  const src = /src\s*=\s*["']([^"']+)["']/.exec(attrs);
  const alt = /alt\s*=\s*["']([^"']*)["']/.exec(attrs);
  if (!src || /src\s*=\s*\{/.test(attrs)) {
    issues.push('Figure needs a quoted src, for example src="/articles/<slug>/diagram.webp".');
  }
  if (!alt?.[1].trim() || /alt\s*=\s*\{/.test(attrs)) {
    issues.push("Figure needs a non-empty quoted alt.");
  }
  if (src) validateImagePath(slug, src[1], issues, files);
}

function validateImagePath(
  slug: string,
  src: string,
  issues: string[],
  files: ArticleFiles,
) {
  const prefix = `/articles/${slug}/`;
  const name = src.startsWith(prefix) ? src.slice(prefix.length) : "";
  if (!IMAGE_FILE.test(name)) {
    issues.push(
      `Image "${src}" must live at /articles/${slug}/<name>.webp (lowercase ASCII, WebP only).`,
    );
    return;
  }
  const bytes = files.readWebp(src);
  if (!bytes) {
    issues.push(`Image file is missing at public${src}.`);
    return;
  }
  if (bytes.byteLength > ARTICLE_LIMITS.imageMaxBytes) {
    issues.push(
      `${src} is ${bytes.byteLength} bytes. Keep images at or under ${ARTICLE_LIMITS.imageMaxBytes} bytes.`,
    );
  }
  const size = webpSize(bytes);
  if (!size) {
    issues.push(`${src} is not a readable WebP.`);
    return;
  }
  if (
    size.width > ARTICLE_LIMITS.imageMaxEdge ||
    size.height > ARTICLE_LIMITS.imageMaxEdge ||
    size.width < 1 ||
    size.height < 1
  ) {
    issues.push(
      `${src} is ${size.width}×${size.height}. Each edge must be 1–${ARTICLE_LIMITS.imageMaxEdge} pixels.`,
    );
  }
}

function stripFences(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".") && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
