import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/supabase/config";
import { handleSessionRequest } from "@/lib/auth/proxy-core";
import type { Database } from "@/types/database.types";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    const { url, key } = supabaseConfig();
    return handleSessionRequest(request, async (cookies) => {
      const client = createServerClient<Database>(url, key, { cookies });
      const { data } = await client.auth.getClaims();
      return Boolean(data?.claims);
    });
  }
  const destination = request.nextUrl.clone();
  destination.pathname = `/${defaultLocale}`;
  return NextResponse.redirect(destination);
}

// Only the entry URL is redirected. Assets and future routes are unaffected.
export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/media/:path*",
    "/digital-audit/admin/:path*",
    "/digital-audit/api/admin/:path*",
  ],
};
