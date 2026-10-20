import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

// The lead admin used a URL secret (?secret= / x-admin-secret, backed by
// ADMIN_ACCESS_SECRET). It was replaced by the owner's Supabase session and must
// not come back. Tests that need the retired header build its name at runtime.

const src = fileURLToPath(new URL("../../", import.meta.url));
const SELF = "no-admin-secret.test.ts";
const FORBIDDEN = [/x-admin-secret/i, /ADMIN_ACCESS_SECRET/];

function files(directory: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) found.push(...files(path));
    else if (/\.(ts|tsx|css|mjs|js|json|md)$/.test(name) && name !== SELF)
      found.push(path);
  }
  return found;
}

test("neither x-admin-secret nor ADMIN_ACCESS_SECRET appears anywhere in src/", () => {
  const offenders: string[] = [];
  for (const file of files(src)) {
    const text = readFileSync(file, "utf8");
    for (const pattern of FORBIDDEN)
      if (pattern.test(text)) offenders.push(`${file}: ${pattern}`);
  }
  assert.deepEqual(offenders, []);
});
