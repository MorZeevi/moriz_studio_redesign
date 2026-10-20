// READ-ONLY CMS GATE SETUP. This file may only mint temporary sessions for the
// EXISTING owner identity (see tests/support/session-kit.ts):
//  - the owner is looked up with getUserById and its email must equal
//    SUPABASE_ADMIN_EMAIL BEFORE any generateLink call (generateLink would
//    create a user for an unknown email), and user.id must equal
//    SUPABASE_ADMIN_USER_ID before any cookie is written;
//  - it never calls createUser, never runs SQL, and never inserts, updates or
//    deletes any table or storage object;
//  - each session is tracked as soon as it exists; a setup failure and teardown
//    both revoke only the sessions minted here, with scope "local".
import { mkdirSync, writeFileSync } from "node:fs";
import {
  createSessionKit,
  type MintedSession,
  type SessionCookie,
} from "../support/session-kit";

export const gatePath = ".cache/cms-gate.json";
export type GateCookie = SessionCookie;
export type GateFixture = {
  smoke: MintedSession;
  logout: MintedSession;
  // Fresh sessions whose cookie marks the access token as expired while the
  // refresh token is valid, so the proxy has to refresh them. Each is used by
  // one test, because a refresh rotates the refresh token.
  expiredCms: MintedSession;
  expiredLeads: MintedSession;
};

const CHUNK = 3180;
/**
 * Rewrites the stored session so expires_at is in the past. The access token
 * itself is untouched; the server sees an expired session and must refresh it.
 */
export function expireCookies(cookies: GateCookie[]): GateCookie[] {
  const chunks = [...cookies].sort(
    (a, b) =>
      Number(/\.(\d+)$/.exec(a.name)?.[1] ?? 0) -
      Number(/\.(\d+)$/.exec(b.name)?.[1] ?? 0),
  );
  const base = chunks[0].name.replace(/\.\d+$/, "");
  const joined = chunks.map((cookie) => cookie.value).join("");
  if (!joined.startsWith("base64-"))
    throw new Error("Unexpected auth cookie encoding.");
  const stored = JSON.parse(
    Buffer.from(joined.slice("base64-".length), "base64url").toString("utf8"),
  );
  stored.expires_at = 1;
  const value = `base64-${Buffer.from(JSON.stringify(stored)).toString("base64url")}`;
  const parts = value.match(new RegExp(`.{1,${CHUNK}}`, "g")) ?? [value];
  return parts.map((part, index) => ({
    ...chunks[0],
    name: parts.length === 1 ? base : `${base}.${index}`,
    value: part,
  }));
}

// Read-only gate: it mints sessions for the existing owner account and nothing
// else. No users are created and no tables, storage or SQL are touched.
export default async function setup() {
  const kit = createSessionKit("cms-gate");
  await kit.guarded(async () => {
    await kit.assertOwner();
    const expiredCms = await kit.mint("expiredCms");
    const expiredLeads = await kit.mint("expiredLeads");
    const built: GateFixture = {
      smoke: await kit.mint("smoke"),
      logout: await kit.mint("logout"),
      expiredCms: { ...expiredCms, cookies: expireCookies(expiredCms.cookies) },
      expiredLeads: {
        ...expiredLeads,
        cookies: expireCookies(expiredLeads.cookies),
      },
    };
    mkdirSync(".cache", { recursive: true });
    writeFileSync(gatePath, JSON.stringify(built), { mode: 0o600 });
  });

  return async () => {
    await kit.revokeAll();
    writeFileSync(gatePath, "{}");
  };
}
