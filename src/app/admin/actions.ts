"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/cms/auth";
import { getAdminProject } from "@/lib/cms/queries";
import {
  mediaReferences,
  slugify,
  UUID,
  validateProject,
} from "@/lib/cms/validation";
import { serverSupabase } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";
import type { Category, ProjectInput } from "@/types/project";

type Result<T = undefined> =
  | { ok: true; data: T; warning?: string }
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
async function cleanupMedia(candidates: string[]) {
  if (!candidates.length) return;
  const client = await requireAdmin();
  const { data, error } = await client
    .from("projects")
    .select("cover_image_url,homepage_image_url,projects_image_url,content");
  if (error) throw error;
  const used = new Set((data ?? []).flatMap(mediaReferences));
  const paths = candidates
    .filter((url) => !used.has(url))
    .map((url) => url.slice("/media/".length));
  if (paths.length) {
    const { error: storageError } = await client.storage
      .from("project-media")
      .remove(paths);
    if (storageError) throw storageError;
  }
}
export async function saveProject(
  input: ProjectInput,
): Promise<Result<{ id: string }>> {
  const client = await requireAdmin();
  try {
    validateProject(input);
    const existing = await getAdminProject(input.id);
    const { id, category_ids, ...fields } = input;
    const normalized = {
      ...fields,
      title: fields.title.trim(),
      services: [...new Set(fields.services.map((s) => s.trim()))],
    };
    const { error } = await client.rpc("cms_save_project", {
      project_id: id,
      project_data: JSON.parse(JSON.stringify(normalized)) as Json,
      category_ids,
    });
    if (error) throw error;
    refreshPortfolio();
    let warning: string | undefined;
    try {
      await cleanupMedia(
        existing
          ? mediaReferences(existing).filter(
              (url) => !mediaReferences(input).includes(url),
            )
          : [],
      );
    } catch {
      warning =
        "הפרויקט נשמר. חלק מהקבצים הישנים נשארו באחסון וניתן לנקות אותם בהמשך.";
    }
    return { ok: true, data: { id }, warning };
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
  const {
    categories,
    created_at: _created,
    updated_at: _updated,
    ...input
  } = project;
  return saveProject({
    ...input,
    published,
    category_ids: categories.map((c) => c.id),
  });
}
export async function deleteProject(id: string): Promise<Result> {
  const client = await requireAdmin();
  const existing = await getAdminProject(id);
  if (!existing) return { ok: false, error: "הפרויקט לא נמצא." };
  const { error } = await client.from("projects").delete().eq("id", id);
  if (error) return failure(error);
  refreshPortfolio();
  try {
    await cleanupMedia(mediaReferences(existing));
  } catch {
    return {
      ok: true,
      data: undefined,
      warning: "הפרויקט נמחק. חלק מהקבצים נשארו באחסון.",
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
  const {
    categories,
    created_at: _created,
    updated_at: _updated,
    ...input
  } = existing;
  const newId = randomUUID();
  return saveProject({
    ...input,
    id: newId,
    title: `${input.title} — העתק`,
    slug: `${input.slug}-copy-${newId.slice(0, 8)}`,
    published: false,
    category_ids: categories.map((c) => c.id),
  });
}
export async function createCategory(
  rawName: string,
): Promise<Result<Category>> {
  const client = await requireAdmin();
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name || name.length > 100)
    return { ok: false, error: "יש להזין שם קטגוריה באורך עד 100 תווים." };
  let slug = slugify(name) || `category-${randomUUID().slice(0, 8)}`;
  const { data: collision } = await client
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (collision) slug = `${slug}-${randomUUID().slice(0, 8)}`;
  const { data, error } = await client
    .from("categories")
    .insert({ name, slug })
    .select()
    .single();
  if (error) return failure(error);
  refreshPortfolio();
  return { ok: true, data };
}
export async function renameCategory(
  id: string,
  rawName: string,
): Promise<Result> {
  const client = await requireAdmin();
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!UUID.test(id) || !name || name.length > 100)
    return { ok: false, error: "יש להזין שם קטגוריה תקין." };
  const { error } = await client
    .from("categories")
    .update({ name })
    .eq("id", id);
  if (error) return failure(error);
  refreshPortfolio();
  return { ok: true, data: undefined };
}
export async function deleteCategory(id: string): Promise<Result> {
  const client = await requireAdmin();
  if (!UUID.test(id)) return { ok: false, error: "קטגוריה אינה תקינה." };
  const { error } = await client.from("categories").delete().eq("id", id);
  if (error) return failure(error);
  refreshPortfolio();
  return { ok: true, data: undefined };
}
export async function reorderCategories(ids: string[]): Promise<Result> {
  const client = await requireAdmin();
  if (ids.some((id) => !UUID.test(id)) || new Set(ids).size !== ids.length)
    return { ok: false, error: "סדר הקטגוריות אינו תקין." };
  const results = await Promise.all(
    ids.map((id, sort_order) =>
      client.from("categories").update({ sort_order }).eq("id", id),
    ),
  );
  if (results.some((r) => r.error))
    return { ok: false, error: "לא ניתן לשמור את הסדר. נסו שוב." };
  refreshPortfolio();
  return { ok: true, data: undefined };
}
export async function removeUnusedUpload(url: string): Promise<Result> {
  await requireAdmin();
  if (
    !/^\/media\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|avif|gif|mp4|webm)$/i.test(
      url,
    )
  )
    return { ok: false, error: "קובץ אינו תקין." };
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
    origin && /^http:\/\/(127\.0\.0\.1|localhost):(3000|4398)$/.test(origin)
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
