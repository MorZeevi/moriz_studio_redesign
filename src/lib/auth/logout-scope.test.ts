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

/**
 * The source with `//` and block comments blanked out. String and template
 * literals are skipped so a `//` inside "https://..." is not a comment.
 */
function stripComments(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (char === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
    } else if (char === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? source.length : end + 2;
    } else if (char === '"' || char === "'" || char === "`") {
      let j = i + 1;
      while (j < source.length && source[j] !== char) {
        if (source[j] === "\\") j += 1;
        j += 1;
      }
      out += source.slice(i, j + 1);
      i = j + 1;
    } else {
      out += char;
      i += 1;
    }
  }
  return out;
}

/** The argument text of every `signOut(` call in the code (comments ignored). */
function signOutCalls(rawSource: string): string[] {
  const source = stripComments(rawSource);
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

/** Client form: signOut({ scope: "local" }). */
const isLocalOptions = (args: string) =>
  /^\{\s*scope:\s*["']local["']\s*,?\s*\}$/.test(args.trim());
/** Auth admin API form: signOut(jwt, "local"), the scope as a string literal. */
const isLocalPositional = (args: string) =>
  /^[^,]+,\s*["']local["']\s*,?\s*$/.test(args.trim());
const isLocal = (args: string) =>
  isLocalOptions(args) || isLocalPositional(args);

test("scanner: comments are ignored, strings containing // are not comments", () => {
  assert.deepEqual(signOutCalls("// await client.auth.signOut();"), []);
  assert.deepEqual(signOutCalls("/* signOut() */ x();"), []);
  assert.deepEqual(signOutCalls("/** a\n * global signOut()\n */"), []);
  assert.deepEqual(signOutCalls("const a = 1; // signOut()\nconst b = 2;"), []);
  assert.deepEqual(signOutCalls('const u = "https://x.test"; c.signOut()'), [
    "",
  ]);
});

test("scanner: accepts the client and admin local forms", () => {
  for (const code of [
    'client.auth.signOut({ scope: "local" })',
    "client.auth.signOut({ scope: 'local' })",
    'client.auth.signOut({\n  scope: "local",\n})',
    'admin.auth.admin.signOut(session.access_token, "local")',
    "admin.auth.admin.signOut(token, 'local')",
    'admin.auth.admin.signOut(\n  session.access_token,\n  "local",\n)',
  ]) {
    const calls = signOutCalls(code);
    assert.equal(calls.length, 1, code);
    assert.ok(isLocal(calls[0]), code);
  }
});

test("scanner: rejects bare, empty, global and other scopes", () => {
  for (const code of [
    "client.auth.signOut()",
    "client.auth.signOut({})",
    'client.auth.signOut({ scope: "global" })',
    'client.auth.signOut({ scope: "others" })',
    'admin.auth.admin.signOut(token, "global")',
    'admin.auth.admin.signOut(token, "others")',
    "admin.auth.admin.signOut(token)",
    'client.auth.signOut({ scope: "global", note: "local" })',
    'client.auth.signOut({ a: 1, b: "local" })',
  ]) {
    const calls = signOutCalls(code);
    assert.equal(calls.length, 1, code);
    assert.equal(isLocal(calls[0]), false, code);
  }
});

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
      for (const args of signOutCalls(readFileSync(file, "utf8")))
        if (!isLocal(args)) offenders.push(`${file}: signOut(${args})`);
  }
  assert.deepEqual(offenders, []);
});
