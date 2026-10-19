import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/login-form";
export default async function Login() {
  const client = await serverSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (user && user.id === process.env.SUPABASE_ADMIN_USER_ID)
    redirect("/admin/projects");
  return <LoginForm />;
}
