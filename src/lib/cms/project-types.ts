import type { Term } from "@/types/project";

/** The fixed project types, in display order (tools/cms/fixed-project-types.sql). */
export const PROJECT_TYPES = [
  { slug: "משחק", name: "משחק", name_en: "Game" },
  { slug: "אתר-תדמית", name: "אתר תדמית", name_en: "Brand website" },
  { slug: "אפליקציית-web", name: "אפליקציית Web", name_en: "Web app" },
  { slug: "כלי-ai", name: "כלי AI", name_en: "AI tool" },
  { slug: "מחשבון", name: "מחשבון", name_en: "Calculator" },
  { slug: "אחר", name: "אחר", name_en: "Other" },
] as const;

export function isProjectType(slug: string) {
  return PROJECT_TYPES.some((type) => type.slug === slug);
}

/** Each fixed type with its stored term, when the term exists. */
export function projectTypeOptions(terms: Term[]) {
  return PROJECT_TYPES.map((type) => ({
    ...type,
    term: terms.find((t) => t.kind === "type" && t.slug === type.slug) ?? null,
  }));
}
