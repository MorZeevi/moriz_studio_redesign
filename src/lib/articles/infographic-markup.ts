import { ARTICLE_LIMITS } from "./limits.ts";
import { parseStatValue } from "./infographic-values.ts";

const TAG = /<\/?([A-Z][A-Za-z0-9]*)\b([^>]*)>/g;

const GROUPS = new Set([
  "StatHighlight",
  "CompareBars",
  "ProcessSteps",
  "BeforeAfter",
  "Timeline",
]);

const LEAVES = new Set(["Stat", "Bar"]);

const BLOCKS = new Set(["Step", "Before", "After", "TimelineItem"]);

const CHILD_OF: Record<string, string> = {
  Stat: "StatHighlight",
  Bar: "CompareBars",
  Step: "ProcessSteps",
  Before: "BeforeAfter",
  After: "BeforeAfter",
  TimelineItem: "Timeline",
};

const EXPECTED_CHILDREN: Record<string, Set<string>> = {
  StatHighlight: new Set(["Stat"]),
  CompareBars: new Set(["Bar"]),
  ProcessSteps: new Set(["Step"]),
  BeforeAfter: new Set(["Before", "After"]),
  Timeline: new Set(["TimelineItem"]),
};

const COUNTS: Record<string, { min: number; max: number; child: string }> = {
  StatHighlight: { ...ARTICLE_LIMITS.infographicStats, child: "Stat" },
  CompareBars: { ...ARTICLE_LIMITS.infographicBars, child: "Bar" },
  ProcessSteps: { ...ARTICLE_LIMITS.infographicSteps, child: "Step" },
  Timeline: { ...ARTICLE_LIMITS.infographicEvents, child: "TimelineItem" },
};

type OpenTag = {
  name: string;
  attrs: string;
  childNames: string[];
  contentStart: number;
  /** Scale for a CompareBars frame, when max is a valid positive number. */
  max?: number;
};

export function validateInfographicMarkup(prose: string, issues: string[]) {
  const markup = prose.replace(/`[^`\n]+`/g, "");
  const stack: OpenTag[] = [];

  for (const match of markup.matchAll(TAG)) {
    const name = match[1];
    const attrs = match[2] ?? "";
    const index = match.index ?? 0;
    if (match[0].startsWith("</")) {
      const open = stack.pop();
      if (!open || open.name !== name) {
        issues.push(
          `<${name}> is closed out of order. Close the component that is still open.`,
        );
        continue;
      }
      const parent = stack.at(-1);
      const inner = markup.slice(open.contentStart, index);
      validateCompleted(
        name,
        open.attrs,
        open.childNames,
        inner,
        parent?.name,
        parent?.max,
        issues,
      );
      parent?.childNames.push(name);
      continue;
    }

    const cleanAttrs = attrs.replace(/\/\s*$/, "");
    if (/\/\s*$/.test(attrs)) {
      const parent = stack.at(-1);
      validateCompleted(name, cleanAttrs, [], "", parent?.name, parent?.max, issues);
      parent?.childNames.push(name);
      continue;
    }

    stack.push({
      name,
      attrs,
      childNames: [],
      contentStart: index + match[0].length,
      max: maxFromAttrs(name, attrs),
    });
  }

  for (const open of stack) {
    issues.push(`<${open.name}> is missing its closing tag.`);
  }
}

function validateCompleted(
  name: string,
  attrs: string,
  childNames: string[],
  inner: string,
  parent: string | undefined,
  parentMax: number | undefined,
  issues: string[],
) {
  if (!GROUPS.has(name) && !LEAVES.has(name) && !BLOCKS.has(name)) return;

  const expectedParent = CHILD_OF[name];
  if (expectedParent && parent !== expectedParent) {
    issues.push(`<${name}> must be inside <${expectedParent}>.`);
  }
  if (parent && BLOCKS.has(parent)) {
    issues.push(
      `<${parent}> cannot contain <${name}>. Write the detail as text.`,
    );
  }

  if (LEAVES.has(name) && inner.trim()) {
    issues.push(`<${name}> does not take body text. Close it with />.`);
  }
  if ((BLOCKS.has(name) || GROUPS.has(name)) && !inner && childNames.length === 0) {
    issues.push(`<${name}> needs content before its closing tag.`);
  }

  if (name === "StatHighlight" || name === "CompareBars" || name === "ProcessSteps" || name === "BeforeAfter" || name === "Timeline") {
    validateCitation(name, attrs, issues);
    validateOptional(name, attrs, "title", ARTICLE_LIMITS.infographicTitle, issues);
  }
  if (name === "CompareBars") validateCompareBars(attrs, childNames, issues);
  if (name === "BeforeAfter") validateBeforeAfter(attrs, childNames, issues);
  if (name === "StatHighlight" || name === "ProcessSteps" || name === "Timeline") {
    validateChildCount(name, childNames, issues);
  }

  if (name === "Stat") validateStat(attrs, issues);
  if (name === "Bar") validateBar(attrs, parentMax, issues);
  if (name === "Step") validateStep(attrs, inner, issues);
  if (name === "Before" || name === "After") validatePane(name, attrs, inner, issues);
  if (name === "TimelineItem") validateTimelineItem(attrs, inner, issues);
}

function validateCompareBars(attrs: string, childNames: string[], issues: string[]) {
  validateOptional("CompareBars", attrs, "unit", ARTICLE_LIMITS.infographicUnit, issues);
  const maxRaw = quotedAttr(attrs, "max");
  const max = maxRaw === undefined ? null : parseStatValue(maxRaw);
  if (maxRaw === undefined || !max || max.numeric <= 0) {
    issues.push(
      'CompareBars needs a quoted max, the value that fills the track. For percentages use max="100".',
    );
  }
  validateChildCount("CompareBars", childNames, issues);
}

function validateBeforeAfter(attrs: string, childNames: string[], issues: string[]) {
  validateOptional("BeforeAfter", attrs, "beforeLabel", ARTICLE_LIMITS.infographicLabelShort, issues);
  validateOptional("BeforeAfter", attrs, "afterLabel", ARTICLE_LIMITS.infographicLabelShort, issues);
  const panes = childNames.filter((child) => child === "Before" || child === "After");
  const extra = childNames.filter((child) => child !== "Before" && child !== "After");
  if (panes.join(",") !== "Before,After") {
    issues.push("BeforeAfter needs one <Before> and then one <After>.");
  }
  for (const child of extra) {
    issues.push(`BeforeAfter cannot contain <${child}>. Use <Before> and <After>.`);
  }
}

function validateStat(attrs: string, issues: string[]) {
  validateAttributes(attrs, "Stat", new Set(["value", "label", "prefix", "suffix"]), issues);
  requireNumber("Stat", attrs, issues);
  requireText("Stat", attrs, "label", ARTICLE_LIMITS.infographicLabel, issues);
  validateOptional("Stat", attrs, "prefix", ARTICLE_LIMITS.infographicAffix, issues);
  validateOptional("Stat", attrs, "suffix", ARTICLE_LIMITS.infographicAffix, issues);
}

function validateBar(attrs: string, parentMax: number | undefined, issues: string[]) {
  validateAttributes(attrs, "Bar", new Set(["value", "label"]), issues);
  const parsed = requireNumber("Bar", attrs, issues);
  requireText("Bar", attrs, "label", ARTICLE_LIMITS.infographicLabel, issues);
  if (parsed && parentMax !== undefined && parsed.numeric > parentMax) {
    issues.push(
      `Bar value ${attrsValue(attrs)} is larger than CompareBars max (${parentMax}). Raise max, or use the scale the source published.`,
    );
  }
}

function validateStep(attrs: string, inner: string, issues: string[]) {
  validateAttributes(attrs, "Step", new Set(["title"]), issues);
  requireText("Step", attrs, "title", ARTICLE_LIMITS.infographicLabelShort, issues);
  requireDetail("Step", inner, issues);
}

function validatePane(name: string, attrs: string, inner: string, issues: string[]) {
  validateAttributes(attrs, name, new Set(["title"]), issues);
  validateOptional(name, attrs, "title", ARTICLE_LIMITS.infographicLabel, issues);
  requireDetail(name, inner, issues);
}

function validateTimelineItem(attrs: string, inner: string, issues: string[]) {
  validateAttributes(attrs, "TimelineItem", new Set(["when", "title"]), issues);
  requireText("TimelineItem", attrs, "when", ARTICLE_LIMITS.infographicWhen, issues);
  requireText("TimelineItem", attrs, "title", ARTICLE_LIMITS.infographicLabel, issues);
  requireDetail("TimelineItem", inner, issues);
}

function validateCitation(name: string, attrs: string, issues: string[]) {
  const allowed = new Set(["source", "sourceUrl", "title"]);
  if (name === "CompareBars") allowed.add("unit").add("max");
  if (name === "BeforeAfter") allowed.add("beforeLabel").add("afterLabel");
  validateAttributes(attrs, name, allowed, issues);
  requireText(name, attrs, "source", ARTICLE_LIMITS.infographicSource, issues);
  const url = quotedAttr(attrs, "sourceUrl");
  if (url === undefined) {
    issues.push(
      `${name} needs a quoted sourceUrl, an absolute https link to the source.`,
    );
    return;
  }
  if (!isHttpsUrl(url)) {
    issues.push(
      `${name} sourceUrl must be an absolute https URL with no username or password.`,
    );
  }
}

function validateChildCount(name: string, childNames: string[], issues: string[]) {
  const rule = COUNTS[name];
  const expected = EXPECTED_CHILDREN[name];
  if (!rule || !expected) return;
  const own = childNames.filter((child) => expected.has(child));
  const extra = childNames.filter((child) => !expected.has(child));
  if (own.length < rule.min || own.length > rule.max) {
    issues.push(
      `${name} needs ${rule.min}–${rule.max} <${rule.child}> components (got ${own.length}).`,
    );
  }
  for (const child of extra) {
    issues.push(`${name} cannot contain <${child}>.`);
  }
}

function requireNumber(name: string, attrs: string, issues: string[]) {
  const raw = quotedAttr(attrs, "value");
  if (raw === undefined) {
    issues.push(
      `${name} needs a quoted value, the number exactly as the source published it.`,
    );
    return null;
  }
  const parsed = parseStatValue(raw);
  if (!parsed) {
    issues.push(
      `${name} value "${raw}" must be a plain number such as 85, 0.5, or 1,200. Put the unit in suffix or unit, and do not invent a figure.`,
    );
    return null;
  }
  return parsed;
}

function requireDetail(name: string, inner: string, issues: string[]) {
  const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const length = [...text].length;
  const bounds = ARTICLE_LIMITS.infographicDetail;
  if (length < bounds.min || length > bounds.max) {
    issues.push(
      `${name} detail must be ${bounds.min}–${bounds.max} characters (got ${length}).`,
    );
  }
}

function requireText(
  component: string,
  attrs: string,
  name: string,
  bounds: { min: number; max: number },
  issues: string[],
) {
  const value = quotedAttr(attrs, name);
  if (value === undefined) {
    issues.push(`${component} needs a quoted ${name}.`);
    return;
  }
  checkLength(component, name, value, bounds, issues);
}

function validateOptional(
  component: string,
  attrs: string,
  name: string,
  bounds: { min: number; max: number },
  issues: string[],
) {
  const value = quotedAttr(attrs, name);
  if (value === undefined) return;
  checkLength(component, name, value, bounds, issues);
}

function checkLength(
  component: string,
  name: string,
  value: string,
  bounds: { min: number; max: number },
  issues: string[],
) {
  if (value !== value.trim()) {
    issues.push(`${component} ${name} cannot start or end with a space.`);
  }
  const length = [...value.trim()].length;
  if (length < bounds.min || length > bounds.max) {
    issues.push(
      `${component} ${name} must be ${bounds.min}–${bounds.max} characters (got ${length}).`,
    );
  }
}

function validateAttributes(
  attrs: string,
  name: string,
  allowed: Set<string>,
  issues: string[],
) {
  if (/\w+\s*=\s*\{/.test(attrs)) {
    issues.push(
      `${name} attributes must be quoted strings, not JavaScript expressions.`,
    );
  }
  if (/[A-Za-z][\w-]*\s*=\s*[^"'\s{]/.test(stripQuotes(attrs))) {
    issues.push(`${name} attributes must be quoted strings.`);
  }
  const stripped = stripQuotes(attrs);
  for (const match of stripped.matchAll(/([A-Za-z][\w-]*)\s*=/g)) {
    if (!allowed.has(match[1])) {
      issues.push(
        `${name} does not accept "${match[1]}". Allowed: ${[...allowed].join(", ")}.`,
      );
    }
  }
}

function stripQuotes(attrs: string) {
  return attrs.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

function quotedAttr(attrs: string, name: string) {
  return new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`).exec(attrs)?.[1];
}

function attrsValue(attrs: string) {
  return quotedAttr(attrs, "value") ?? "";
}

function maxFromAttrs(name: string, attrs: string) {
  if (name !== "CompareBars") return undefined;
  const parsed = parseStatValue(quotedAttr(attrs, "max") ?? "");
  return parsed && parsed.numeric > 0 ? parsed.numeric : undefined;
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.includes(".") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
