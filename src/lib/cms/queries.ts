import "server-only";
import { connection } from "next/server";
import { publicSupabase } from "@/lib/supabase/server";
import type { Category, Project, ProjectRow } from "@/types/project";
import { requireAdmin } from "./auth";
import { UUID, validateContent } from "./validation";

type JoinedProject = ProjectRow & {
  project_categories: { categories: Category | null }[];
};
const selection = "*, project_categories(categories(*))";
function project(row: JoinedProject): Project {
  const { project_categories, content, ...fields } = row;
  validateContent(content);
  return {
    ...fields,
    content,
    categories: project_categories
      .flatMap((link) => (link.categories ? [link.categories] : []))
      .sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
      ),
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
    .eq("slug", slug)
    .eq("published", true)
    .returns<JoinedProject[]>()
    .maybeSingle();
  if (error) throw new Error("Unable to load this project.");
  return data ? project(data) : null;
}
export async function getAdminProjects() {
  const client = await requireAdmin();
  const { data, error } = await client
    .from("projects")
    .select(selection)
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
    .eq("id", id)
    .returns<JoinedProject[]>()
    .maybeSingle();
  if (error) throw new Error("לא ניתן לטעון את הפרויקט.");
  return data ? project(data) : null;
}
export async function getAdminCategories() {
  const client = await requireAdmin();
  const { data, error } = await client
    .from("categories")
    .select("*, project_categories(project_id)")
    .order("sort_order")
    .order("name");
  if (error) throw new Error("לא ניתן לטעון את הקטגוריות.");
  return (data ?? []).map(({ project_categories, ...category }) => ({
    ...category,
    usage: project_categories.length,
  }));
}
