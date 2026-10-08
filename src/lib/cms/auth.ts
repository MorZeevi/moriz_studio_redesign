import "server-only";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";

export async function requireAdmin() {
  const client = await serverSupabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (
    error ||
    !user ||
    !process.env.SUPABASE_ADMIN_USER_ID ||
    user.id !== process.env.SUPABASE_ADMIN_USER_ID
  ) {
    redirect("/admin/login");
  }
  return client;
}
