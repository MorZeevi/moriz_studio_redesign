// READ-ONLY CMS GATE SETUP. This file may only mint temporary sessions for the
// EXISTING owner identity:
//  - it asserts user.id === SUPABASE_ADMIN_USER_ID before any cookie is written
//    and aborts otherwise;
//  - it never calls admin.createUser (or any other user management call), never
//    runs SQL, and never inserts, updates or deletes any table or storage object;
//  - teardown revokes only the sessions minted here, with scope "local".
import { mkdirSync, writeFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { createServerClient } from "@supabase/ssr";
import { createClient, type Session } from "@supabase/supabase-js";

export const gatePath = ".cache/cms-gate.json";
export type GateCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax";
};
export type GateFixture = {
  smoke: { session: Session; cookies: GateCookie[] };
  logout: { session: Session; cookies: GateCookie[] };
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the CMS gate.`);
  return value;
}

// Read-only gate: it mints sessions for the existing owner account and nothing
// else. No users are created and no tables, storage or SQL are touched.
export default async function setup() {
  loadEnvConfig(process.cwd());
  const publicUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceUrl = required("SUPABASE_URL");
  if (new URL(serviceUrl).host !== new URL(publicUrl).host)
    throw new Error("SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL differ.");
  const key = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const ownerEmail = required("SUPABASE_ADMIN_EMAIL");
  const ownerId = required("SUPABASE_ADMIN_USER_ID");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(
    serviceUrl,
    required("SUPABASE_SERVICE_ROLE_KEY"),
    options,
  );

  async function mint() {
    // generateLink does not send an email.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: ownerEmail,
    });
    if (error) throw error;
    const publicClient = createClient(publicUrl, key, options);
    const { data: verified, error: verifyError } =
      await publicClient.auth.verifyOtp({
        type: "email",
        token_hash: data.properties.hashed_token,
      });
    if (verifyError || !verified.session || !verified.user)
      throw new Error("Unable to establish the owner test session.");
    if (verified.user.id !== ownerId)
      throw new Error("Minted session does not belong to the owner.");
    const cookieValues = new Map<string, string>();
    const ssr = createServerClient(publicUrl, key, {
      cookies: {
        getAll: () =>
          [...cookieValues].map(([name, value]) => ({ name, value })),
        setAll(values) {
          for (const { name, value } of values) cookieValues.set(name, value);
        },
      },
    });
    await ssr.auth.setSession(verified.session);
    const cookies: GateCookie[] = [...cookieValues].map(([name, value]) => ({
      name,
      value,
      domain: "127.0.0.1",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    }));
    return { session: verified.session, cookies };
  }

  const fixture: GateFixture = { smoke: await mint(), logout: await mint() };
  mkdirSync(".cache", { recursive: true });
  writeFileSync(gatePath, JSON.stringify(fixture), { mode: 0o600 });

  return async () => {
    // Only the two sessions minted above are revoked, never the owner's other
    // sessions. An already-revoked session (for example after a UI logout)
    // errors harmlessly.
    for (const { session } of [fixture.smoke, fixture.logout]) {
      try {
        await admin.auth.admin.signOut(session.access_token, "local");
      } catch {
        /* already revoked */
      }
    }
    writeFileSync(gatePath, "{}");
  };
}
