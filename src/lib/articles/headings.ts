import { ARTICLE_LIMITS } from "./limits.ts";

export type Heading = {
  depth: 2 | 3 | 4;
  text: string;
  id: string;
};

const HEADING = /^(#{1,6})[ \t]+(.+?)\s*#*\s*$/;
const FENCE = /^(```|~~~)/;

/** Stable id for a heading, including Hebrew letters. */
export function headingSlug(text: string): string {
  const slug = text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "section";
}

export function assignHeadingIds(
  items: { depth: 2 | 3 | 4; text: string }[],
): Heading[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const base = headingSlug(item.text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return {
      ...item,
      id: count === 0 ? base : `${base}-${count + 1}`,
    };
  });
}

export function createHeadingIdAllocator() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = headingSlug(normalizeHeading(text));
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

export function normalizeHeading(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * ATX headings outside fenced code. Underline headings and markdown inside a
 * heading are reported so the table of contents stays in lockstep with the
 * rendered ids.
 */
export function inspectHeadings(markdown: string): {
  headings: Heading[];
  issues: string[];
} {
  const issues: string[] = [];
  const found: { depth: 2 | 3 | 4; text: string }[] = [];
  let inFence = false;
  let previous = "";

  for (const line of markdown.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      previous = "";
      continue;
    }
    if (inFence) continue;

    if (/^ {0,3}=+\s*$/.test(line)) {
      issues.push(
        "Underline headings are not allowed. Start headings with ##, ###, or ####.",
      );
    } else if (
      /^ {0,3}-+\s*$/.test(line) &&
      previous.trim() &&
      !previous.startsWith("#")
    ) {
      issues.push(
        `"${previous.trim()}" is an underline heading. Use ## instead, and leave a blank line before a --- rule.`,
      );
    }

    const match = HEADING.exec(line);
    if (match) {
      const depth = match[1].length;
      const text = normalizeHeading(match[2]);
      if (depth === 1) {
        issues.push(
          "The article body cannot contain an h1. The title field is the only h1.",
        );
      } else if (depth > 4) {
        issues.push(
          `Heading "${text}" is too deep. Use ##, ###, or #### only.`,
        );
      } else if (!text) {
        issues.push("A heading is empty.");
      } else if (/[*_`[\]<>{}|]/.test(match[2])) {
        issues.push(
          `Heading "${text}" must be plain text: no links, emphasis, or code.`,
        );
      } else if ([...text].length > ARTICLE_LIMITS.heading.max) {
        issues.push(
          `Heading "${text.slice(0, 40)}…" is ${[...text].length} characters. Keep headings to ${ARTICLE_LIMITS.heading.max}.`,
        );
      } else {
        found.push({ depth: depth as 2 | 3 | 4, text });
      }
    }
    previous = line;
  }

  return { headings: assignHeadingIds(found), issues };
}
