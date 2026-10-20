import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/login-form";
import { adminDestination, safeAdminNext } from "@/lib/auth/next-path";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next: raw } = await searchParams;
  const next = safeAdminNext(raw);
  const client = await serverSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (user && user.id === process.env.SUPABASE_ADMIN_USER_ID)
    redirect(adminDestination(next));
  return <LoginForm next={next ?? undefined} />;
}
