"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/cms/auth";
import { CMS_MEDIA_BUCKET, CMS_SOURCE } from "@/lib/cms/source";
import { getAdminProject } from "@/lib/cms/queries";
import {
  MEDIA_PATH,
  mediaReferences,
  projectReadiness,
  slugify,
  UUID,
  validateProject,
} from "@/lib/cms/validation";
import { serverSupabase } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";
import type { ManagedKind, Project, ProjectInput, Term } from "@/types/project";

type Result<T = undefined> =
  | { ok: true; data: T; warnings?: string[] }
  | { ok: false; error: string };
function failure(error: unknown): Result<never> {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "23505")
      return {
        ok: false,
        error: "השם או הכתובת כבר קיימים. יש לבחור ערך אחר.",
      };
    if (error.code === "23503")
      return {
        ok: false,
        error: "קטגוריה שנבחרה כבר אינה קיימת. רעננו את הבחירה ונסו שוב.",
      };
    return { ok: false, error: "הפעולה נכשלה. הנתונים לא נשמרו; נסו שוב." };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "הפעולה נכשלה. נסו שוב.",
  };
}
function refreshPortfolio() {
  revalidatePath("/he");
  revalidatePath("/he/projects");
  revalidatePath("/he/projects/[slug]", "page");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/categories");
}
/** Every column that can point at a stored file. */
const MEDIA_COLUMNS =
  "cover_image_url,homepage_image_url,projects_image_url,og_image_url,content,media";
async function cleanupMedia(candidates: string[]) {
  if (!candidates.length) return;
  const client = await requireAdmin();
  const { data, error } = await client
    .from("projects")
    .select(MEDIA_COLUMNS)
    .eq("source", CMS_SOURCE);
  if (error) throw error;
  const used = new Set((data ?? []).flatMap(mediaReferences));
  const paths = candidates
    .filter((url) => !used.has(url))
    .map((url) => url.slice("/media/".length));
  if (paths.length) {
    const { error: storageError } = await client.storage
      .from(CMS_MEDIA_BUCKET)
      .remove(paths);
    if (storageError) throw storageError;
  }
}
/** The editable shape of a stored project, with its term links as ids. */
function toInput(project: Project): ProjectInput {
  const {
    categories,
    type,
    created_at: _created,
    updated_at: _updated,
    source: _source,
    ...input
  } = project;
  return {
    ...input,
    category_ids: categories.map((t) => t.id),
    type_id: type?.id ?? null,
  };
}
const CLEAR_ERRORS = "כדי לפרסם יש להשלים: ";
export async function saveProject(
  input: ProjectInput,
): Promise<Result<{ id: string }>> {
  const client = await requireAdmin();
  try {
    input = {
      ...input,
      slug:
        typeof input.slug === "string" ? input.slug.trim() || null : input.slug,
      title: input.title.trim(),
    };
    validateProject(input);
    const existing = await getAdminProject(input.id);
    const warnings: string[] = [];
    if (input.published) {
      // Only the first publish is gated; live projects are never blocked.
      const { errors } = projectReadiness(input);
      if (errors.length && !existing?.published)
        return {
          ok: false,
          error: CLEAR_ERRORS + errors.map((e) => e.message).join(" "),
        };
      warnings.push(...errors.map((e) => e.message));
    }
    const {
      id,
      category_ids,
      type_id,
      // The owner comes from the database, never from the request.
      source: _source,
      ...fields
    } = input as ProjectInput & { source?: unknown };
    const termIds = [...category_ids, ...(type_id ? [type_id] : [])];
    const { data: terms, error: termsError } = termIds.length
      ? await client
          .from("categories")
          .select("id,kind")
          .eq("source", CMS_SOURCE)
          .in("id", termIds)
      : { data: [], error: null };
    if (termsError) throw termsError;
    const kindOf = new Map((terms ?? []).map((t) => [t.id, t.kind]));
    // A legacy service row is a category until the data migration converts it.
    if (
      category_ids.some((t) => !kindOf.has(t) || kindOf.get(t) === "type") ||
      (type_id && kindOf.get(type_id) !== "type")
    )
      return {
        ok: false,
        error: "קטגוריה או סוג שנבחרו כבר אינם קיימים. רעננו ונסו שוב.",
      };
    const { error } = await client.rpc("cms_save_project", {
      project_id: id,
      project_data: JSON.parse(
        JSON.stringify({
          ...fields,
          // The legacy services mirror; services are categories now.
          services: [],
        }),
      ) as Json,
      category_ids: termIds,
    });
    if (error) throw error;
    refreshPortfolio();
    try {
      await cleanupMedia(
        existing
          ? mediaReferences(existing).filter(
              (url) => !mediaReferences(input).includes(url),
            )
          : [],
      );
    } catch {
      warnings.push(
        "הפרויקט נשמר. חלק מהקבצים הישנים נשארו באחסון וניתן לנקות אותם בהמשך.",
      );
    }
    return { ok: true, data: { id }, warnings };
  } catch (error) {
    return failure(error);
  }
}
export async function setPublished(
  id: string,
  published: boolean,
): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const project = await getAdminProject(id);
  if (!project) return { ok: false, error: "הפרויקט לא נמצא." };
  return saveProject({ ...toInput(project), published });
}
export async function deleteProject(id: string): Promise<Result> {
  const client = await requireAdmin();
  const existing = await getAdminProject(id);
  if (!existing) return { ok: false, error: "הפרויקט לא נמצא." };
  const { error } = await client
    .from("projects")
    .delete()
    .eq("source", CMS_SOURCE)
    .eq("id", id);
  if (error) return failure(error);
  refreshPortfolio();
  try {
    await cleanupMedia(mediaReferences(existing));
  } catch {
    return {
      ok: true,
      data: undefined,
      warnings: ["הפרויקט נמחק. חלק מהקבצים נשארו באחסון."],
    };
  }
  return { ok: true, data: undefined };
}
export async function duplicateProject(
  id: string,
): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const existing = await getAdminProject(id);
  if (!existing) return { ok: false, error: "הפרויקט לא נמצא." };
  const input = toInput(existing);
  const newId = randomUUID();
  return saveProject({
    ...input,
    id: newId,
    title: `${input.title} — העתק`,
    slug: input.slug ? `${input.slug}-copy-${newId.slice(0, 8)}` : null,
    published: false,
  });
}
export async function reorderProjects(
  surface: "homepage" | "projects",
  ids: string[],
): Promise<Result> {
  const client = await requireAdmin();
  if (ids.some((id) => !UUID.test(id)) || new Set(ids).size !== ids.length)
    return { ok: false, error: "סדר הפרויקטים אינו תקין." };
  const { error } = await client.rpc("cms_reorder_projects", { surface, ids });
  if (error) return failure(error);
  refreshPortfolio();
  return { ok: true, data: undefined };
}
const TERM_KINDS: ManagedKind[] = ["category", "type"];
const TERM_LABEL: Record<ManagedKind, string> = {
  category: "קטגוריה",
  type: "סוג פרויקט",
};
function cleanName(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}
export async function createTerm(
  kind: ManagedKind,
  rawName: string,
  rawNameEn = "",
): Promise<Result<Term>> {
  const client = await requireAdmin();
  const name = cleanName(rawName);
  const name_en = cleanName(rawNameEn) || null;
  if (!TERM_KINDS.includes(kind))
    return { ok: false, error: "סוג הרשימה אינו תקין." };
  if (!name || name.length > 100 || (name_en?.length ?? 0) > 100)
    return {
      ok: false,
      error: `יש להזין שם ${TERM_LABEL[kind]} באורך עד 100 תווים.`,
    };
  let slug =
    slugify(name_en ?? "") ||
    slugify(name) ||
    `${kind}-${randomUUID().slice(0, 8)}`;
  const { data: collision } = await client
    .from("categories")
    .select("id")
    .eq("source", CMS_SOURCE)
    .eq("kind", kind)
    .eq("slug", slug)
    .maybeSingle();
  if (collision) slug = `${slug}-${randomUUID().slice(0, 8)}`;
  const { data, error } = await client
    .from("categories")
    .insert({ name, name_en, slug, kind })
    .select()
    .single();
  if (error) return failure(error);
  refreshPortfolio();
  return { ok: true, data: data as Term };
}
export async function updateTerm(
  id: string,
  rawName: string,
  rawNameEn = "",
): Promise<Result> {
  const client = await requireAdmin();
  const name = cleanName(rawName);
  const name_en = cleanName(rawNameEn) || null;
  if (
    !UUID.test(id) ||
    !name ||
    name.length > 100 ||
    (name_en?.length ?? 0) > 100
  )
    return { ok: false, error: "יש להזין שם תקין." };
  const { error } = await client
    .from("categories")
    .update({ name, name_en })
    .eq("source", CMS_SOURCE)
    .eq("id", id);
  if (error) return failure(error);
  refreshPortfolio();
  return { ok: true, data: undefined };
}
export async function deleteTerm(id: string): Promise<Result> {
  const client = await requireAdmin();
  if (!UUID.test(id)) return { ok: false, error: "הפריט אינו תקין." };
  const { error } = await client
    .from("categories")
    .delete()
    .eq("source", CMS_SOURCE)
    .eq("id", id);
  if (error) return failure(error);
  refreshPortfolio();
  return { ok: true, data: undefined };
}
export async function reorderTerms(ids: string[]): Promise<Result> {
  const client = await requireAdmin();
  if (ids.some((id) => !UUID.test(id)) || new Set(ids).size !== ids.length)
    return { ok: false, error: "הסדר אינו תקין." };
  const results = await Promise.all(
    ids.map((id, sort_order) =>
      client
        .from("categories")
        .update({ sort_order })
        .eq("source", CMS_SOURCE)
        .eq("id", id),
    ),
  );
  if (results.some((r) => r.error))
    return { ok: false, error: "לא ניתן לשמור את הסדר. נסו שוב." };
  refreshPortfolio();
  return { ok: true, data: undefined };
}
export async function removeUnusedUpload(url: string): Promise<Result> {
  await requireAdmin();
  if (!MEDIA_PATH.test(url)) return { ok: false, error: "קובץ אינו תקין." };
  try {
    await cleanupMedia([url]);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}
export async function requestLoginLink(email: string): Promise<Result> {
  const expected = process.env.SUPABASE_ADMIN_EMAIL;
  if (!expected || email.trim().toLowerCase() !== expected.toLowerCase())
    return { ok: false, error: "הכניסה מותרת רק לחשבון הבעלים." };
  const client = await serverSupabase();
  const origin = (await headers()).get("origin");
  const localOrigin =
    origin && /^http:\/\/(127\.0\.0\.1|localhost):(3000|3002|4398)$/.test(origin)
      ? origin
      : null;
  const redirectTo =
    process.env.SUPABASE_AUTH_REDIRECT_URL ??
    (localOrigin ? `${localOrigin}/admin/auth/callback` : null);
  if (!redirectTo)
    return {
      ok: false,
      error:
        "יש להגדיר SUPABASE_AUTH_REDIRECT_URL ולרשום אותה בכתובות המותרות ב־Supabase.",
    };
  const { error } = await client.auth.signInWithOtp({
    email: expected,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  });
  if (error)
    return {
      ok: false,
      error: "לא ניתן לשלוח קישור כרגע. המתינו דקה ונסו שוב.",
    };
  return { ok: true, data: undefined };
}
export async function logout() {
  const client = await serverSupabase();
  await client.auth.signOut();
  redirect("/admin/login");
}
