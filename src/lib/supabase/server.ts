import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { supabaseConfig } from "./config";

export async function serverSupabase() {
  // Read cookies before the env check. cookies() marks the route dynamic, so a
  // preview build with no CMS keys is not killed while prerendering /admin.
  // With the keys present, the client is unchanged.
  const store = await cookies();
  const { url, key } = supabaseConfig();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          for (const { name, value, options } of values)
            store.set(name, value, options);
        } catch {
          /* Rendering cannot set cookies; the proxy handles token refresh. */
        }
      },
    },
  });
}

const statelessOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, cache: "no-store" }),
  },
};

// Public reads never inherit an owner's cookies, even when browsing while logged in.
export function publicSupabase() {
  const { url, key } = supabaseConfig();
  return createClient<Database>(url, key, statelessOptions);
}

// Bypasses RLS. Only for server code reading tables browsers cannot see.
export function secretSupabase() {
  const { url } = supabaseConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not configured.");
  return createClient<Database>(url, key, statelessOptions);
}
