import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database.types";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    let response = NextResponse.next({ request });
    const { url, key } = supabaseConfig();
    const client = createServerClient<Database>(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          for (const { name, value } of values)
            request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values)
            response.cookies.set(name, value, options);
        },
      },
    });
    await client.auth.getClaims();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const destination = request.nextUrl.clone();
  destination.pathname = `/${defaultLocale}`;
  return NextResponse.redirect(destination);
}

// Only the entry URL is redirected. Assets and future routes are unaffected.
export const config = { matcher: ["/", "/admin/:path*", "/media/:path*"] };
