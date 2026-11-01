import { ARTICLE_LIMITS } from "./limits.ts";

/** Words per minute used for Hebrew and English mixed prose. */
export const WORDS_PER_MINUTE = ARTICLE_LIMITS.wordsPerMinute;

function readableText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~|-]/g, " ");
}

export function readingMinutes(markdown: string) {
  const words = readableText(markdown)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
