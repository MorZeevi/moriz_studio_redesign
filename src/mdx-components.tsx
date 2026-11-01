import type { MDXComponents } from "mdx/types";
import { articleMdxComponents } from "@/components/articles/mdx";

export function useMDXComponents(): MDXComponents {
  return articleMdxComponents();
}
