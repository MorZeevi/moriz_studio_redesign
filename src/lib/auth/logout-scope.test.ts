import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

// A global signOut() revokes the owner's sessions on every device. Every call
// in the repository must therefore be local-scope.

const root = new URL("../../../", import.meta.url);
const rootPath = fileURLToPath(root);
// This file and the freeze spec quote the old global call as a string literal.
const SKIP = new Set(["logout-scope.test.ts", "freeze.spec.ts"]);

function files(directory: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(directory)) {
    if (name === "node_modules" || name === ".next" || name.startsWith("."))
      continue;
    const path = join(directory, name);
    if (statSync(path).isDirectory()) found.push(...files(path));
    else if (/\.(ts|tsx|mjs|cjs|js)$/.test(name) && !SKIP.has(name))
      found.push(path);
  }
  return found;
}

/** The argument text of every `signOut(` call in the source. */
function signOutCalls(source: string): string[] {
  const calls: string[] = [];
  let from = 0;
  for (;;) {
    const at = source.indexOf("signOut(", from);
    if (at === -1) return calls;
    let depth = 1;
    let end = at + "signOut(".length;
    while (end < source.length && depth > 0) {
      if (source[end] === "(") depth += 1;
      else if (source[end] === ")") depth -= 1;
      end += 1;
    }
    calls.push(source.slice(at + "signOut(".length, end - 1));
    from = end;
  }
}

const isLocal = (args: string) => /scope:\s*["']local["']/.test(args);

test("logout() in the CMS actions signs out with local scope", () => {
  const source = readFileSync(
    join(rootPath, "src/app/admin/actions.ts"),
    "utf8",
  );
  const calls = signOutCalls(source);
  assert.ok(calls.length >= 2, "expected the logout and wrong-user sign-outs");
  for (const args of calls)
    assert.ok(isLocal(args), `signOut(${args}) must pass scope: "local"`);
  const logout = source.slice(source.indexOf("export async function logout"));
  assert.match(logout, /signOut\(\{ scope: "local" \}\)/);
});

test("no source, test or script calls signOut() without local scope", () => {
  const offenders: string[] = [];
  for (const dir of ["src", "tests", "tools", "scripts"]) {
    let list: string[];
    try {
      list = files(join(rootPath, dir));
    } catch {
      continue;
    }
    for (const file of list)
      for (const args of signOutCalls(readFileSync(file, "utf8"))) {
        // supabase-js admin API: signOut(jwt, "local")
        const adminLocal = /,\s*["']local["']\s*$/.test(args.trim());
        if (!isLocal(args) && !adminLocal)
          offenders.push(`${file}: signOut(${args})`);
      }
  }
  assert.deepEqual(offenders, []);
});
