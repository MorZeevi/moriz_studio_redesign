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
const ALLOWED_COMPONENTS = new Set([
  "Callout",
  "Figure",
  "CtaCard",
  "ProjectCard",
  "RelatedArticle",
  "Steps",
  "Step",
  "Compare",
  "CompareRow",
  "Stat",
]);
const CTA_ATTRS = new Set(["title", "text", "href", "label"]);
const STEPS_ATTRS = new Set(["title"]);
const STEP_ATTRS = new Set(["title", "text"]);
const COMPARE_ATTRS = new Set(["title", "start", "end"]);
const COMPARE_ROW_ATTRS = new Set(["start", "end"]);
const STAT_ATTRS = new Set(["title", "value", "label", "source", "url"]);
/** A poster number: 5, 85%, 1.5, 1,000, or a range such as 1–8. */
const STAT_VALUE = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?$|^\d+[–—-]\d+%?$/;
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
  /** Short bullets shown above the body. Empty when the field is omitted. */
  tldr: string[];
  /** When false, the page does not insert a contact card on its own. */
  cta: boolean;
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
  "tldr",
  "cta",
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
  const tldr = readTldr(data, issues);
  const cta = readCta(data, issues);
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
    !tldr ||
    cta === undefined ||
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
    tldr,
    cta,
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

function readTldr(data: Record<string, unknown>, issues: string[]) {
  if (!("tldr" in data) || data.tldr === undefined) return [];
  if (!Array.isArray(data.tldr) || data.tldr.length === 0) {
    issues.push(
      `tldr must be a YAML list of ${ARTICLE_LIMITS.tldr.max} bullets or fewer. Omit the field when there is no summary.`,
    );
    return null;
  }
  if (data.tldr.length > ARTICLE_LIMITS.tldr.max) {
    issues.push(`tldr can include at most ${ARTICLE_LIMITS.tldr.max} bullets.`);
  }
  const bullets: string[] = [];
  for (const item of data.tldr) {
    const bullet = readLine({ tldr: item }, "tldr", issues, {
      required: true,
      ...ARTICLE_LIMITS.tldrItem,
    });
    if (bullet) bullets.push(bullet);
  }
  return bullets;
}

function readCta(data: Record<string, unknown>, issues: string[]) {
  if (!("cta" in data) || data.cta === undefined) return true;
  if (typeof data.cta !== "boolean") {
    issues.push(
      "cta must be a boolean. Omit it, or set cta: false to skip the automatic contact card.",
    );
    return undefined;
  }
  return data.cta;
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
      "The body cannot import or export JavaScript. Use Markdown and the components listed in docs/articles-authoring.md.",
    );
  }
  if (/<\/?[a-z][\w:-]*(\s|\/?>)/.test(prose)) {
    issues.push(
      "Raw HTML is not allowed. Use Markdown, Callout, Figure, CtaCard, ProjectCard, RelatedArticle, Steps, Compare, or Stat.",
    );
  }
  if (/javascript:/i.test(prose)) {
    issues.push("javascript: URLs are not allowed.");
  }
  for (const match of prose.matchAll(/<\/?([A-Z][A-Za-z0-9]*)\b/g)) {
    const name = match[1];
    if (!ALLOWED_COMPONENTS.has(name)) {
      issues.push(
        `Unknown component <${name}>. Allowed components: ${[...ALLOWED_COMPONENTS].join(", ")}.`,
      );
    }
  }
  for (const match of prose.matchAll(/<CtaCard\b([^>]*?)\/?>/g)) {
    validateAttributes(match[1], "CtaCard", CTA_ATTRS, issues);
    const href = quotedAttr(match[1], "href");
    if (
      href &&
      (href.startsWith("//") ||
        !/^(\/|#)/.test(href) ||
        /javascript:/i.test(href) ||
        /\s/.test(href))
    ) {
      issues.push(
        'CtaCard href must be a site path or a hash, for example href="#contact" or href="/digital-audit".',
      );
    }
    checkQuotedLength(match[1], "title", ARTICLE_LIMITS.ctaTitle, issues);
    checkQuotedLength(match[1], "text", ARTICLE_LIMITS.ctaText, issues);
    checkQuotedLength(match[1], "label", ARTICLE_LIMITS.ctaLabel, issues);
  }
  for (const match of prose.matchAll(/<ProjectCard\b([^>]*?)\/?>/g)) {
    validateAttributes(match[1], "ProjectCard", new Set(["slug"]), issues);
    const projectSlug = quotedAttr(match[1], "slug");
    if (!projectSlug || !SLUG.test(projectSlug)) {
      issues.push(
        'ProjectCard needs a quoted project slug, for example slug="guesto".',
      );
    }
  }
  for (const match of prose.matchAll(/<RelatedArticle\b([^>]*?)\/?>/g)) {
    validateAttributes(match[1], "RelatedArticle", new Set(["slug"]), issues);
    const articleSlug = quotedAttr(match[1], "slug");
    if (
      !articleSlug ||
      !SLUG.test(articleSlug) ||
      RESERVED_SLUGS.has(articleSlug)
    ) {
      issues.push(
        'RelatedArticle needs the other article\'s filename slug, for example slug="from-tasks-to-pages".',
      );
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
  validateInfographics(prose, issues);
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

function validateAttributes(
  attrs: string,
  name: string,
  allowed: Set<string>,
  issues: string[],
) {
  const outsideQuotes = attrs.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, "");
  if (/\w+\s*=\s*\{/.test(outsideQuotes)) {
    issues.push(
      `${name} attributes must be quoted strings, not JavaScript expressions.`,
    );
  }
  for (const match of outsideQuotes.matchAll(/([A-Za-z][\w-]*)\s*=/g)) {
    if (!allowed.has(match[1])) {
      issues.push(
        `${name} does not accept "${match[1]}". Allowed: ${[...allowed].join(", ") || "slug"}.`,
      );
    }
  }
}

type TagBlock = { attrs: string; inner: string | null };

function tagBlocks(prose: string, name: string): TagBlock[] {
  const re = new RegExp(
    `<${name}\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/${name}>)`,
    "g",
  );
  return [...prose.matchAll(re)].map((match) => ({
    attrs: match[1] ?? "",
    inner: match[0].endsWith("/>") ? null : (match[2] ?? ""),
  }));
}

function isBalanced(prose: string, name: string, issues: string[]) {
  const opens = prose.match(new RegExp(`<${name}\\b`, "g"))?.length ?? 0;
  const closes = prose.match(new RegExp(`</${name}>`, "g"))?.length ?? 0;
  const selfClosing = prose.match(new RegExp(`<${name}\\b[^>]*/>`, "g"))?.length ?? 0;
  if (opens === closes + selfClosing) return true;
  issues.push(`${name} tag is not closed. Use <${name} ... /> or </${name}>.`);
  return false;
}

function requireText(
  attrs: string,
  component: string,
  name: string,
  bounds: { min: number; max: number },
  issues: string[],
  example: string,
) {
  const value = quotedAttr(attrs, name);
  if (value === undefined || value.trim() === "") {
    issues.push(`${component} needs a quoted ${name}, for example ${example}.`);
    return;
  }
  if (value !== value.trim()) {
    issues.push(`${component} ${name} has leading or trailing whitespace.`);
  }
  const length = [...value].length;
  if (length < bounds.min || length > bounds.max) {
    issues.push(
      `${component} ${name} must be ${bounds.min}–${bounds.max} characters (got ${length}).`,
    );
  }
  if (!LETTER.test(value)) {
    issues.push(`${component} ${name} must contain a letter.`);
  }
}

function validateInfographics(prose: string, issues: string[]) {
  validateSteps(prose, issues);
  validateCompare(prose, issues);
  validateStats(prose, issues);
}

function validateSteps(prose: string, issues: string[]) {
  const stepsBalanced = isBalanced(prose, "Steps", issues);
  const stepBalanced = isBalanced(prose, "Step", issues);
  for (const block of tagBlocks(prose, "Steps")) {
    validateAttributes(block.attrs, "Steps", STEPS_ATTRS, issues);
    requireText(
      block.attrs,
      "Steps",
      "title",
      ARTICLE_LIMITS.infographicTitle,
      issues,
      'title="איך ממצא הופך למסך"',
    );
    if (block.inner === null) {
      issues.push(
        `Steps needs ${ARTICLE_LIMITS.steps.min}–${ARTICLE_LIMITS.steps.max} Step components. It cannot be self-closing.`,
      );
      continue;
    }
    const steps = tagBlocks(block.inner, "Step");
    const leftover = block.inner
      .replace(/<Step\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Step>)/g, "")
      .trim();
    if (leftover) {
      issues.push(
        "Steps can only contain Step components. Remove extra Markdown inside it.",
      );
    }
    if (
      steps.length < ARTICLE_LIMITS.steps.min ||
      steps.length > ARTICLE_LIMITS.steps.max
    ) {
      issues.push(
        `Steps needs ${ARTICLE_LIMITS.steps.min}–${ARTICLE_LIMITS.steps.max} Step components (got ${steps.length}).`,
      );
    }
    for (const step of steps) {
      validateAttributes(step.attrs, "Step", STEP_ATTRS, issues);
      requireText(
        step.attrs,
        "Step",
        "title",
        ARTICLE_LIMITS.stepTitle,
        issues,
        'title="שיחה"',
      );
      requireText(
        step.attrs,
        "Step",
        "text",
        ARTICLE_LIMITS.stepText,
        issues,
        'text="חמש שיחות קצרות עם אנשים אמיתיים."',
      );
      if (step.inner?.trim()) {
        issues.push("Step takes title and text attributes, not nested content.");
      }
    }
  }
  if (stepsBalanced && stepBalanced) {
    const outside = prose.replace(
      /<Steps\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Steps>)/g,
      "",
    );
    if (/<Step\b/.test(outside)) {
      issues.push("Step must be inside <Steps>. It cannot stand on its own.");
    }
  }
}

function validateCompare(prose: string, issues: string[]) {
  const compareBalanced = isBalanced(prose, "Compare", issues);
  const rowBalanced = isBalanced(prose, "CompareRow", issues);
  for (const block of tagBlocks(prose, "Compare")) {
    validateAttributes(block.attrs, "Compare", COMPARE_ATTRS, issues);
    requireText(
      block.attrs,
      "Compare",
      "title",
      ARTICLE_LIMITS.infographicTitle,
      issues,
      'title="אותו אתר, שני סדרי עדיפויות"',
    );
    requireText(
      block.attrs,
      "Compare",
      "start",
      ARTICLE_LIMITS.compareHeading,
      issues,
      'start="מהעסק"',
    );
    requireText(
      block.attrs,
      "Compare",
      "end",
      ARTICLE_LIMITS.compareHeading,
      issues,
      'end="מהלקוח"',
    );
    if (block.inner === null) {
      issues.push(
        `Compare needs ${ARTICLE_LIMITS.compareRows.min}–${ARTICLE_LIMITS.compareRows.max} CompareRow components. It cannot be self-closing.`,
      );
      continue;
    }
    const rows = tagBlocks(block.inner, "CompareRow");
    const leftover = block.inner
      .replace(/<CompareRow\b([^>]*?)(?:\/>|>([\s\S]*?)<\/CompareRow>)/g, "")
      .trim();
    if (leftover) {
      issues.push(
        "Compare can only contain CompareRow components. Remove extra Markdown inside it.",
      );
    }
    if (
      rows.length < ARTICLE_LIMITS.compareRows.min ||
      rows.length > ARTICLE_LIMITS.compareRows.max
    ) {
      issues.push(
        `Compare needs ${ARTICLE_LIMITS.compareRows.min}–${ARTICLE_LIMITS.compareRows.max} CompareRow components (got ${rows.length}).`,
      );
    }
    for (const row of rows) {
      validateAttributes(row.attrs, "CompareRow", COMPARE_ROW_ATTRS, issues);
      requireText(
        row.attrs,
        "CompareRow",
        "start",
        ARTICLE_LIMITS.compareCell,
        issues,
        'start="סיסמה על איכות"',
      );
      requireText(
        row.attrs,
        "CompareRow",
        "end",
        ARTICLE_LIMITS.compareCell,
        issues,
        'end="המשימה שהמבקר בא לבצע"',
      );
      if (row.inner?.trim()) {
        issues.push(
          "CompareRow takes start and end attributes, not nested content.",
        );
      }
    }
  }
  if (compareBalanced && rowBalanced) {
    const outside = prose.replace(
      /<Compare\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Compare>)/g,
      "",
    );
    if (/<CompareRow\b/.test(outside)) {
      issues.push(
        "CompareRow must be inside <Compare>. It cannot stand on its own.",
      );
    }
  }
}

function validateStats(prose: string, issues: string[]) {
  isBalanced(prose, "Stat", issues);
  for (const block of tagBlocks(prose, "Stat")) {
    validateAttributes(block.attrs, "Stat", STAT_ATTRS, issues);
    requireText(
      block.attrs,
      "Stat",
      "title",
      ARTICLE_LIMITS.infographicTitle,
      issues,
      'title="חמישה משתמשים במבחן שימושיות אחד"',
    );
    requireText(
      block.attrs,
      "Stat",
      "label",
      ARTICLE_LIMITS.statLabel,
      issues,
      'label="משתמשים במבחן שימושיות אחד"',
    );
    requireText(
      block.attrs,
      "Stat",
      "source",
      ARTICLE_LIMITS.sourceTitle,
      issues,
      'source="Why You Only Need to Test with 5 Users"',
    );
    const value = quotedAttr(block.attrs, "value");
    if (value === undefined || value.trim() === "" || !STAT_VALUE.test(value)) {
      issues.push(
        'Stat value must be a quoted number, for example value="5", value="85%", or value="1–8".',
      );
    } else if (value !== value.trim()) {
      issues.push("Stat value has leading or trailing whitespace.");
    } else {
      const length = [...value].length;
      if (
        length < ARTICLE_LIMITS.statValue.min ||
        length > ARTICLE_LIMITS.statValue.max
      ) {
        issues.push(
          `Stat value must be ${ARTICLE_LIMITS.statValue.min}–${ARTICLE_LIMITS.statValue.max} characters (got ${length}).`,
        );
      }
    }
    const url = quotedAttr(block.attrs, "url");
    if (url === undefined || url.trim() === "") {
      issues.push(
        'Stat needs a quoted https url, for example url="https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/".',
      );
    } else if (!isHttpsUrl(url)) {
      issues.push(
        "Stat url must be an absolute https URL without a username or password.",
      );
    }
    if (block.inner?.trim()) {
      issues.push("Stat is self-closing. Put the number in value, not inside the tag.");
    }
  }
}

function quotedAttr(attrs: string, name: string) {
  return new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`).exec(attrs)?.[2];
}

function checkQuotedLength(
  attrs: string,
  name: string,
  bounds: { min: number; max: number },
  issues: string[],
) {
  const value = quotedAttr(attrs, name);
  if (value === undefined) return;
  const length = [...value].length;
  if (length < bounds.min || length > bounds.max) {
    issues.push(
      `CtaCard ${name} must be ${bounds.min}–${bounds.max} characters (got ${length}).`,
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
