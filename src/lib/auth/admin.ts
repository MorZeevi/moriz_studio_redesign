import "server-only";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { adminLoginPath } from "./next-path.ts";
import { isOwnerId } from "./owner.ts";
import { hasJsonContentType, isSameOriginRequest } from "./request-guards.ts";

// Route-agnostic admin guard shared by the CMS surface and the lead admin.
// Same rule as src/lib/cms/auth.ts requireAdmin(): getUser() (a verified
// server round-trip, so logout takes effect immediately) and the owner id from
// SUPABASE_ADMIN_USER_ID, failing closed when it is unset.
export async function getAdminUser(): Promise<User | null> {
  try {
    const client = await serverSupabase();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) return null;
    return isOwnerId(user.id, process.env.SUPABASE_ADMIN_USER_ID) ? user : null;
  } catch {
    return null;
  }
}

/** For pages: redirect to the admin login, remembering where to come back. */
export async function requireAdminPage(next: string): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect(adminLoginPath(next));
  return user;
}

/**
 * For cookie-authenticated API routes. True only for the owner, on a
 * same-origin request, and (for body routes) with an application/json body.
 * Callers keep answering their existing 404 JSON on false.
 */
export async function isAdminRequest(
  request: Request,
  { requireJson = false }: { requireJson?: boolean } = {},
): Promise<boolean> {
  if (!isSameOriginRequest(request)) return false;
  if (requireJson && !hasJsonContentType(request)) return false;
  return (await getAdminUser()) !== null;
}
