import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// CMS auth freeze (admin-auth-unification plan, section 4a). In Phase A the
// only intended change to CMS auth behavior is logout() signing out with
// scope "local". Everything else must stay byte-identical to the branch point
// from origin/main. Revisit when Phase B starts changing the CMS on purpose.

function git(args: string[]) {
  return execFileSync("git", args, { encoding: "utf8" });
}

const base = git(["merge-base", "HEAD", "origin/main"]).trim();

function unchanged(path: string) {
  try {
    execFileSync("git", ["diff", "--quiet", base, "--", path]);
    return true;
  } catch {
    return false;
  }
}

test("CMS auth files are byte-identical to the origin/main branch point", () => {
  for (const path of [
    "src/lib/cms/auth.ts",
    "src/app/admin/auth/callback/route.ts",
    "src/app/admin/(private)/layout.tsx",
  ])
    expect(unchanged(path), `${path} changed`).toBe(true);
});

test("actions.ts differs from the branch point only by the logout scope", () => {
  const diff = git([
    "diff",
    "-U0",
    "--no-color",
    base,
    "--",
    "src/app/admin/actions.ts",
  ]);
  const changed = diff
    .split("\n")
    .filter(
      (line) =>
        (line.startsWith("+") || line.startsWith("-")) &&
        !line.startsWith("+++") &&
        !line.startsWith("---"),
    )
    .map((line) => line.trimEnd());
  if (changed.length === 0) return; // already merged into the base
  expect(changed).toEqual([
    "-  await client.auth.signOut();",
    "+  // Local scope: signing out here must not revoke the owner's other devices.",
    '+  await client.auth.signOut({ scope: "local" });',
  ]);
  // loginWithPassword itself is untouched.
  const hunkHeaders = diff.split("\n").filter((line) => line.startsWith("@@"));
  expect(hunkHeaders).toHaveLength(1);
  const source = readFileSync("src/app/admin/actions.ts", "utf8");
  const hunkLine = Number(/\+(\d+)/.exec(hunkHeaders[0])?.[1]);
  const logoutLine =
    source.slice(0, source.indexOf("export async function logout")).split("\n")
      .length;
  expect(hunkLine).toBeGreaterThanOrEqual(logoutLine);
});
