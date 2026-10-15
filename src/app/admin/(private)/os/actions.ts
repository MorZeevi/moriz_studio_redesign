"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/cms/auth";
import { UUID } from "@/lib/cms/validation";

/** The dashboard's only write: status and done_at always move together. */
export async function markItemDone(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const client = await requireAdmin();
  const { error } = await client
    .from("work_items")
    .update({ status: "done", done_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "open");
  if (error) throw error;
  revalidatePath("/admin/os");
}
