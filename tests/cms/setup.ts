import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { createServerClient } from "@supabase/ssr";
import { createClient, type Session } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database.types";

export const fixturePath = ".cache/cms-qa.json";
export type Fixture = {
  url: string;
  key: string;
  owner: Session;
  outsider: Session;
  cookies: {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Lax";
  }[];
  prefix: string;
  folder: string;
  outsiderId: string;
};
export function fixture(): Fixture {
  return JSON.parse(readFileSync(fixturePath, "utf8"));
}
function privilegedClient() {
  loadEnvConfig(process.cwd());
  const { keys } = JSON.parse(
    execFileSync(
      "node_modules/.bin/supabase",
      [
        "projects",
        "api-keys",
        "--project-ref",
        "eqyjdwloiffotezhedxh",
        "--output-format",
        "json",
      ],
      { encoding: "utf8" },
    ),
  ) as { keys: { name: string; api_key: string }[] };
  const secret = keys.find((key) => key.name === "service_role")?.api_key;
  if (!secret)
    throw new Error(
      "CLI must be logged in to run the isolated remote CMS tests.",
    );
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    secret,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export default async function setup() {
  const admin = privilegedClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const prefix = `cms-qa-${randomUUID().slice(0, 8)}`;
  const outsiderEmail = `${prefix}@example.invalid`;
  const { data: newUser, error: createError } =
    await admin.auth.admin.createUser({
      email: outsiderEmail,
      email_confirm: true,
    });
  if (createError || !newUser.user)
    throw new Error("Unable to provision isolated non-owner test account.");
  async function session(email: string) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error) throw error;
    const auth = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: verified, error: verifyError } = await auth.auth.verifyOtp({
      type: "email",
      token_hash: data.properties.hashed_token,
    });
    if (verifyError || !verified.session)
      throw new Error("Unable to establish test session.");
    return verified.session;
  }
  const owner = await session(process.env.SUPABASE_ADMIN_EMAIL ?? "");
  const outsider = await session(outsiderEmail);
  const cookieValues = new Map<string, string>();
  const ssr = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => [...cookieValues].map(([name, value]) => ({ name, value })),
      setAll(values) {
        for (const { name, value } of values) cookieValues.set(name, value);
      },
    },
  });
  await ssr.auth.setSession(owner);
  const cookies = [...cookieValues].map(([name, value]) => ({
    name,
    value,
    domain: "127.0.0.1",
    path: "/",
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const,
  }));
  mkdirSync(".cache", { recursive: true });
  const data: Fixture = {
    url,
    key,
    owner,
    outsider,
    cookies,
    prefix,
    folder: randomUUID(),
    outsiderId: newUser.user.id,
  };
  writeFileSync(fixturePath, JSON.stringify(data), { mode: 0o600 });
  writeFileSync(".cache/cms-qa-folders.json", JSON.stringify([data.folder]), {
    mode: 0o600,
  });
  return async () => {
    // Only this run's namespace and recorded upload folders are touched.
    const { data: projects } = await admin
      .from("projects")
      .select("id")
      .like("slug", `${prefix}%`);
    const folders = new Set<string>([
      ...(projects ?? []).map((p) => p.id),
      ...JSON.parse(readFileSync(".cache/cms-qa-folders.json", "utf8")),
    ]);
    for (const folder of folders) {
      const { data: files } = await admin.storage
        .from("project-media")
        .list(folder, { limit: 1000 });
      if (files?.length)
        await admin.storage
          .from("project-media")
          .remove(files.map((file) => `${folder}/${file.name}`));
    }
    await admin.from("projects").delete().like("slug", `${prefix}%`);
    await admin.from("categories").delete().like("slug", `${prefix}%`);
    await admin.auth.admin.deleteUser(newUser.user.id);
    writeFileSync(fixturePath, "{}");
    writeFileSync(".cache/cms-qa-folders.json", "[]");
  };
}
