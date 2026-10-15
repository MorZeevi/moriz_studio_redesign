// Update only CMS Auth settings, retaining existing redirect URLs and unrelated settings.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
nextEnv.loadEnvConfig(root);
const workdir = mkdtempSync(join(tmpdir(), "moriz-cms-auth-"));
mkdirSync(join(workdir, "supabase"), { recursive: true });
const cli = join(root, "node_modules/.bin/supabase");
const common = ["--project-ref", "eqyjdwloiffotezhedxh", "--workdir", workdir];
function config(redirects) {
  writeFileSync(
    join(workdir, "supabase/config.toml"),
    `project_id = "moriz-cms-auth"
[auth]
enable_signup = false
additional_redirect_urls = ${JSON.stringify(redirects)}
`,
  );
}
function diff() {
  const output = execFileSync(
    cli,
    ["config", "diff", ...common, "--output-format", "json"],
    { cwd: root, encoding: "utf8" },
  );
  return JSON.parse(output.slice(output.indexOf("{")));
}
// An empty declared list lets config diff report the current remote allowlist.
config([]);
const current =
  diff().changes.find(
    (change) => change.path.join(".") === "auth.additional_redirect_urls",
  )?.remote ?? [];
if (!Array.isArray(current))
  throw new Error("Unexpected redirect configuration");
const redirects = [
  ...new Set([
    ...current,
    "http://127.0.0.1:3000/admin/auth/callback",
    "http://localhost:3000/admin/auth/callback",
    "http://127.0.0.1:3002/admin/auth/callback",
    "http://localhost:3002/admin/auth/callback",
    "http://127.0.0.1:4398/admin/auth/callback",
    ...(process.env.SUPABASE_AUTH_REDIRECT_URL
      ? [process.env.SUPABASE_AUTH_REDIRECT_URL]
      : []),
  ]),
];
for (const value of redirects) {
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol))
    throw new Error("Invalid redirect URL");
}
config(redirects);
const declared = diff().changes.filter((change) => change.declared);
if (
  declared.some(
    (change) =>
      !["auth.enable_signup", "auth.additional_redirect_urls"].includes(
        change.path.join("."),
      ),
  )
)
  throw new Error("Unexpected configuration change");
console.log(JSON.stringify({ reviewed_changes: declared }, null, 2));
if (process.argv.includes("--apply")) {
  execFileSync(
    cli,
    ["config", "push", ...common, "--yes", "--output-format", "text"],
    { cwd: root, stdio: "inherit" },
  );
} else console.log("Review only. Pass --apply to configure Auth.");
