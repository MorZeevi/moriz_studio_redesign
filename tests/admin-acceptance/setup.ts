// ADMIN ACCEPTANCE SETUP. Mints sessions for EXISTING Auth users only (see
// tests/support/session-kit.ts): the owner (validated with getUserById and
// SUPABASE_ADMIN_EMAIL before any generateLink) as "main" and "logout", and
// optionally an outsider given by ADMIN_ACCEPTANCE_OUTSIDER_USER_ID (must exist
// and differ from the owner; its email comes from its own record). It never
// creates a user, runs SQL or writes a table. Teardown revokes everything it
// minted, with scope "local".
import { mkdirSync, writeFileSync } from "node:fs";
import { createSessionKit, type MintedSession } from "../support/session-kit";
import { FORCED_SERVER_ENV } from "./server-env";

export const acceptancePath = ".cache/admin-acceptance.json";
export type AcceptanceFixture = {
  main: MintedSession;
  logout: MintedSession;
  outsider: MintedSession | null;
};

export default async function setup() {
  // D4: refuse to run unless notifications and AI are forced off.
  for (const [name, value] of Object.entries(FORCED_SERVER_ENV))
    if (process.env[name] !== value)
      throw new Error(`admin-acceptance: ${name} must be forced to "${value}".`);

  const kit = createSessionKit("admin-acceptance");
  await kit.guarded(async () => {
    await kit.assertOwner();
    const outsiderId = process.env.ADMIN_ACCEPTANCE_OUTSIDER_USER_ID;
    if (outsiderId) await kit.assertOutsider(outsiderId);
    const fixture: AcceptanceFixture = {
      main: await kit.mint("main"),
      logout: await kit.mint("logout"),
      outsider: outsiderId ? await kit.mint("outsider", outsiderId) : null,
    };
    mkdirSync(".cache", { recursive: true });
    writeFileSync(acceptancePath, JSON.stringify(fixture), { mode: 0o600 });
  });

  return async () => {
    await kit.revokeAll();
    writeFileSync(acceptancePath, "{}");
  };
}
