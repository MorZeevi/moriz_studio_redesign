import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { isOwnerId } from "./owner.ts";

const OWNER = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const OTHER = "123e4567-e89b-12d3-a456-426614174000";

test("owner identity: only the configured owner passes", () => {
  assert.equal(isOwnerId(OWNER, OWNER), true);
  assert.equal(isOwnerId(OTHER, OWNER), false);
});

test("owner identity fails closed with no user or no configured owner", () => {
  assert.equal(isOwnerId(null, OWNER), false);
  assert.equal(isOwnerId(undefined, OWNER), false);
  assert.equal(isOwnerId("", OWNER), false);
  assert.equal(isOwnerId(OWNER, undefined), false);
  assert.equal(isOwnerId(OWNER, null), false);
  assert.equal(isOwnerId(OWNER, ""), false);
  assert.equal(isOwnerId("", ""), false);
  assert.equal(isOwnerId(undefined, undefined), false);
});

// The two guards cannot be imported under plain node (server-only, "@/"), so
// their shared identity rule is asserted on the source.
const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), "utf8");

test("the new admin guard and the CMS requireAdmin() encode the same identity rule", () => {
  const cms = read("../cms/auth.ts");
  const guard = read("./admin.ts");
  for (const [name, source] of [
    ["cms/auth.ts", cms],
    ["auth/admin.ts", guard],
  ] as const) {
    assert.match(source, /auth\.getUser\(\)/, `${name} verifies with getUser()`);
    assert.doesNotMatch(source, /getClaims|getSession\(/, `${name} must not trust unverified claims`);
    assert.match(source, /process\.env\.SUPABASE_ADMIN_USER_ID/, `${name} reads the owner id`);
  }
  // CMS: redirects unless the env id is set and equals the user id.
  assert.match(cms, /!process\.env\.SUPABASE_ADMIN_USER_ID/);
  assert.match(cms, /user\.id !== process\.env\.SUPABASE_ADMIN_USER_ID/);
  // New guard: the same rule through isOwnerId(user.id, env id), and no user
  // or error yields null.
  assert.match(guard, /isOwnerId\(user\.id, process\.env\.SUPABASE_ADMIN_USER_ID\)/);
  assert.match(guard, /if \(error \|\| !user\) return null/);
});
