// Shared session minting for the Playwright suites that need an admin session
// (tests/cms-gate and tests/admin-acceptance). The rules, in code:
//
//  - Identities are only ever EXISTING Auth users. generateLink({ type:
//    "magiclink" }) creates a user when the email is unknown, so every identity
//    is looked up with getUserById and validated BEFORE any generateLink call:
//      * the owner must exist and its email must equal SUPABASE_ADMIN_EMAIL
//        (case-insensitive);
//      * an outsider must exist, differ from the owner, and supplies its own
//        email from that record.
//  - No createUser, no SQL, no table or storage writes.
//  - Cleanup is progressive: each session is tracked the moment it exists, and
//    revokeAll() (local scope, only the sessions minted here) runs on any setup
//    failure before the error is rethrown, and again in teardown.
import { loadEnvConfig } from "@next/env";
import { createServerClient } from "@supabase/ssr";
import { createClient, type Session } from "@supabase/supabase-js";

export type SessionCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax";
};
export type MintedSession = { session: Session; cookies: SessionCookie[] };

export function requiredEnv(name: string, suite: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for ${suite}.`);
  return value;
}

export function createSessionKit(suite: string) {
  loadEnvConfig(process.cwd());
  const publicUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL", suite);
  const serviceUrl = requiredEnv("SUPABASE_URL", suite);
  if (new URL(serviceUrl).host !== new URL(publicUrl).host)
    throw new Error("SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL differ.");
  const key = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", suite);
  const ownerEmail = requiredEnv("SUPABASE_ADMIN_EMAIL", suite);
  const ownerId = requiredEnv("SUPABASE_ADMIN_USER_ID", suite);
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(
    serviceUrl,
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY", suite),
    options,
  );
  const tracked: { name: string; session: Session }[] = [];
  const emails = new Map<string, string>();

  async function lookup(userId: string) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user?.email)
      throw new Error(`${suite}: auth user ${userId} does not exist.`);
    return data.user.email;
  }

  /** Aborts unless the owner exists and its email is SUPABASE_ADMIN_EMAIL. */
  async function assertOwner() {
    const email = await lookup(ownerId);
    if (email.toLowerCase() !== ownerEmail.toLowerCase())
      throw new Error(
        `${suite}: SUPABASE_ADMIN_USER_ID does not belong to SUPABASE_ADMIN_EMAIL.`,
      );
    emails.set(ownerId, email);
  }

  /** Aborts unless the user exists and is not the owner; never creates one. */
  async function assertOutsider(userId: string) {
    if (userId === ownerId)
      throw new Error(`${suite}: the outsider must differ from the owner.`);
    emails.set(userId, await lookup(userId));
  }

  async function mint(name: string, userId = ownerId): Promise<MintedSession> {
    const email = emails.get(userId);
    // Never reach generateLink for an identity that was not validated first.
    if (!email) throw new Error(`${suite}: identity ${userId} was not validated.`);
    // generateLink does not send an email.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error) throw error;
    const publicClient = createClient(publicUrl, key, options);
    const { data: verified, error: verifyError } =
      await publicClient.auth.verifyOtp({
        type: "email",
        token_hash: data.properties.hashed_token,
      });
    if (verifyError || !verified.session || !verified.user)
      throw new Error(`${suite}: unable to establish the "${name}" session.`);
    // Tracked as soon as it exists, so a failure below still revokes it.
    tracked.push({ name, session: verified.session });
    if (verified.user.id !== userId)
      throw new Error(`${suite}: the "${name}" session is for the wrong user.`);
    const cookieValues = new Map<string, string>();
    const ssr = createServerClient(publicUrl, key, {
      cookies: {
        getAll: () =>
          [...cookieValues].map(([cookieName, value]) => ({
            name: cookieName,
            value,
          })),
        setAll(values) {
          for (const { name: cookieName, value } of values)
            cookieValues.set(cookieName, value);
        },
      },
    });
    await ssr.auth.setSession(verified.session);
    const cookies: SessionCookie[] = [...cookieValues].map(
      ([cookieName, value]) => ({
        name: cookieName,
        value,
        domain: "127.0.0.1",
        path: "/",
        expires: -1,
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      }),
    );
    return { session: verified.session, cookies };
  }

  /**
   * Revokes every session minted here (local scope). signOut() reports failures
   * through `error` instead of throwing; a session the UI already logged out may
   * report one.
   */
  async function revokeAll() {
    while (tracked.length) {
      const entry = tracked.shift();
      if (!entry) break;
      try {
        const { error } = await admin.auth.admin.signOut(
          entry.session.access_token,
          "local",
        );
        if (error)
          console.warn(`${suite}: revoking "${entry.name}" failed: ${error.message}`);
      } catch (error) {
        console.warn(`${suite}: revoking "${entry.name}" threw: ${String(error)}`);
      }
    }
  }

  /** Runs setup work; on any failure revokes what was already minted first. */
  async function guarded<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      await revokeAll();
      throw error;
    }
  }

  return { admin, ownerId, assertOwner, assertOutsider, mint, revokeAll, guarded };
}
