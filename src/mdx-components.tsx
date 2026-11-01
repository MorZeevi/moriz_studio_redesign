import type { MDXComponents } from "mdx/types";
import { articleMdxComponents } from "@/components/articles/mdx";
import { he } from "@/i18n/dictionaries/he";

export function useMDXComponents(): MDXComponents {
  return articleMdxComponents({
    copy: he.articles,
    locale: "he",
    embeds: { projects: new Map(), articles: new Map() },
  });
}
