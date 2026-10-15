import "server-only";
import { requireAdmin } from "@/lib/cms/auth";
import type { Database } from "@/types/database.types";

export type WorkProject = Database["public"]["Tables"]["work_projects"]["Row"];
export type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];

/** Mor OS dashboard data. RLS scopes every query to the signed-in owner. */
export async function getWorkOverview() {
  const client = await requireAdmin();
  const [projects, open, today, radar] = await Promise.all([
    client
      .from("work_projects")
      .select("*")
      .neq("status", "done")
      .order("title"),
    client
      .from("work_items")
      .select("*")
      .eq("status", "open")
      .order("due_on", { ascending: true, nullsFirst: false })
      .order("created_at"),
    client
      .from("work_items_today")
      .select("*")
      .order("due_on", { ascending: true }),
    client.from("work_radar").select("*").order("title"),
  ]);
  for (const r of [projects, open, today, radar]) if (r.error) throw r.error;
  return {
    projects: projects.data ?? [],
    open: open.data ?? [],
    today: (today.data ?? []) as WorkItem[],
    radar: radar.data ?? [],
  };
}
