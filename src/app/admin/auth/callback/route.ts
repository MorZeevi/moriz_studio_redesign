import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const client = await serverSupabase();
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (!error && data.user?.id === process.env.SUPABASE_ADMIN_USER_ID) {
      return NextResponse.redirect(new URL("/admin/projects", url), {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    await client.auth.signOut();
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", url), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
