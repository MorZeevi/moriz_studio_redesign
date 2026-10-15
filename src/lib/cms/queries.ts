import "server-only";
import { connection } from "next/server";
import { publicSupabase } from "@/lib/supabase/server";
import type {
  Category,
  Project,
  ProjectRow,
  Term,
  TermKind,
} from "@/types/project";
import { requireAdmin } from "./auth";
import { CMS_SOURCE } from "./source";
import {
  parseContent,
  parseHighlights,
  parseMedia,
  parsePanelStyle,
  UUID,
} from "./validation";

type JoinedProject = ProjectRow & {
  project_categories: { categories: Category | null }[];
};
const selection = "*, project_categories(categories(*))";
function byOrder(a: Term, b: Term) {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
}
function project(row: JoinedProject): Project {
  const {
    project_categories,
    content,
    media,
    highlights,
    services: _services,
    panel_style,
    ...rest
  } = row;
  const terms = project_categories
    .flatMap((link) => (link.categories ? [link.categories as Term] : []))
    .sort(byOrder);
  // Services were merged into categories; a legacy service row still counts
  // as one, once per name.
  const categories = terms
    .filter((t) => t.kind !== "type")
    .filter(
      (t, index, list) => list.findIndex((o) => o.name === t.name) === index,
    );
  return {
    ...rest,
    content: parseContent(content),
    media: parseMedia(media),
    highlights: parseHighlights(highlights),
    panel_style: parsePanelStyle(panel_style),
    categories,
    type: terms.find((t) => t.kind === "type") ?? null,
  };
}
export async function getPublicProjects(
  surface: "homepage" | "projects",
  category?: string,
) {
  await connection();
  const client = publicSupabase();
  const { data, error } = await client
    .from("projects")
    .select(selection)
    .eq("source", CMS_SOURCE)
    .eq("published", true)
    .eq(surface === "homepage" ? "show_on_homepage" : "show_on_projects", true)
    .order(surface === "homepage" ? "homepage_order" : "projects_order", {
      nullsFirst: false,
    })
    .order("created_at")
    .order("id")
    .returns<JoinedProject[]>();
  if (error) throw new Error("Unable to load portfolio projects.");
  const items = (data ?? []).map(project);
  return category
    ? items.filter((p) => p.categories.some((c) => c.slug === category))
    : items;
}
export async function getPublicProject(slug: string) {
  await connection();
  const { data, error } = await publicSupabase()
    .from("projects")
    .select(selection)
    .eq("source", CMS_SOURCE)
    .eq("slug", slug)
    .eq("published", true)
    .returns<JoinedProject[]>()
    .maybeSingle();
  if (error) throw new Error("Unable to load this project.");
  return data ? project(data) : null;
}
/** The next project with a case study, in archive order, wrapping around. */
export async function getNextProject(current: Project) {
  const projects = (await getPublicProjects("projects")).filter((p) => p.slug);
  if (projects.length < 2) return null;
  const index = projects.findIndex((p) => p.id === current.id);
  return projects[(index + 1) % projects.length] ?? null;
}
export async function getAdminProjects() {
  const client = await requireAdmin();
  const { data, error } = await client
    .from("projects")
    .select(selection)
    .eq("source", CMS_SOURCE)
    .order("updated_at", { ascending: false })
    .returns<JoinedProject[]>();
  if (error) throw new Error("לא ניתן לטעון את הפרויקטים.");
  return (data ?? []).map(project);
}
export async function getAdminProject(id: string) {
  const client = await requireAdmin();
  if (!UUID.test(id)) return null;
  const { data, error } = await client
    .from("projects")
    .select(selection)
    .eq("source", CMS_SOURCE)
    .eq("id", id)
    .returns<JoinedProject[]>()
    .maybeSingle();
  if (error) throw new Error("לא ניתן לטעון את הפרויקט.");
  return data ? project(data) : null;
}
export type AdminTerm = Term & { usage: number };
export async function getAdminTerms(kind?: TermKind): Promise<AdminTerm[]> {
  const client = await requireAdmin();
  let query = client
    .from("categories")
    .select("*, project_categories(project_id)")
    .eq("source", CMS_SOURCE);
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query.order("sort_order").order("name");
  if (error) throw new Error("לא ניתן לטעון את הקטגוריות.");
  return (data ?? []).map(({ project_categories, ...term }) => ({
    ...(term as Term),
    usage: project_categories.length,
  }));
}
