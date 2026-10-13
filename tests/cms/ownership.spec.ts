import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import type { Database } from "../../src/types/database.types";
import { fixture } from "./setup";

// Ownership boundary: every project, term, link and file belongs to one product
// ('moriz' or 'eyal'), enforced by the database from the signed-in user.

const MOR_BUCKET = "project-media";
const EYAL_BUCKET = "project-media-eyal";

async function clients() {
  const f = fixture();
  const make = () =>
    createClient<Database>(f.url, f.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  const mor = make();
  await mor.auth.setSession(f.owner);
  const eyal = make();
  await eyal.auth.setSession(f.eyal);
  const outsider = make();
  await outsider.auth.setSession(f.outsider);
  return { f, mor, eyal, outsider, anon: make() };
}
/** Teardown deletes recorded folders in both buckets and their projects. */
function track(...ids: string[]) {
  const folders = JSON.parse(
    readFileSync(".cache/cms-qa-folders.json", "utf8"),
  );
  writeFileSync(
    ".cache/cms-qa-folders.json",
    JSON.stringify([...folders, ...ids]),
  );
}

test("projects, terms and links are isolated by source", async ({
  request,
}) => {
  const { f, mor, eyal, outsider, anon } = await clients();
  const morId = randomUUID();
  const eyalId = randomUUID();
  const spoofId = randomUUID();
  track(morId, eyalId, spoofId);
  const morSlug = `${f.prefix}-own-mor`;
  const eyalSlug = `${f.prefix}-own-eyal`;
  const eyalTitle = `${f.prefix} EYAL ONLY`;

  // Existing live content is explicitly Mor's, and Eyal sees none of it.
  expect(
    (await mor.from("projects").select("id").neq("source", "moriz")).data,
  ).toEqual([]);
  expect(
    (await mor.from("categories").select("id").neq("source", "moriz")).data,
  ).toEqual([]);
  expect(
    (await mor.from("projects").select("id")).data?.length,
  ).toBeGreaterThan(0);
  for (const table of ["projects", "categories", "project_categories"] as const)
    expect(
      (await eyal.from(table).select("source").eq("source", "moriz")).data,
    ).toEqual([]);

  // The source default comes from the signed-in user.
  expect(
    (
      await mor.rpc("cms_save_project", {
        project_id: morId,
        project_data: {
          title: "Mor project",
          slug: morSlug,
          homepage_order: 777,
        },
        category_ids: [],
      })
    ).error,
  ).toBeNull();
  expect(
    (await mor.from("projects").select("source").eq("id", morId).single()).data,
  ).toEqual({ source: "moriz" });

  // A source in the payload is ignored, never trusted.
  expect(
    (
      await eyal.rpc("cms_save_project", {
        project_id: eyalId,
        project_data: {
          title: eyalTitle,
          slug: eyalSlug,
          source: "moriz",
          published: true,
          short_description: "Never on Mor's site",
        },
        category_ids: [],
      })
    ).error,
  ).toBeNull();
  expect(
    (await eyal.from("projects").select("source").eq("id", eyalId).single())
      .data,
  ).toEqual({ source: "eyal" });
  expect(
    (
      await mor.rpc("cms_save_project", {
        project_id: spoofId,
        project_data: { title: "Spoof", source: "eyal" },
        category_ids: [],
      })
    ).error,
  ).toBeNull();
  expect(
    (await mor.from("projects").select("source").eq("id", spoofId).single())
      .data,
  ).toEqual({ source: "moriz" });

  // Direct inserts cannot claim another source, and nobody else can write.
  expect(
    (
      await mor
        .from("projects")
        .insert({ title: "Claim", slug: `${f.prefix}-claim`, source: "eyal" })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await mor
        .from("categories")
        .insert({ name: "Claim", slug: `${f.prefix}-claim`, source: "eyal" })
    ).error,
  ).not.toBeNull();
  for (const client of [anon, outsider])
    expect(
      (
        await client.from("categories").insert({
          name: "Denied",
          slug: `${f.prefix}-denied`,
          source: "moriz",
        })
      ).error,
    ).not.toBeNull();

  // Source can never change afterwards.
  const morCategory = randomUUID();
  const eyalCategory = randomUUID();
  expect(
    (
      await mor.from("categories").insert({
        id: morCategory,
        name: `${f.prefix} Shared name`,
        slug: `${f.prefix}-shared`,
      })
    ).error,
  ).toBeNull();
  // The same name and slug are free in the other source.
  expect(
    (
      await eyal.from("categories").insert({
        id: eyalCategory,
        name: `${f.prefix} Shared name`,
        slug: `${f.prefix}-shared`,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await mor.from("categories").insert({
        name: `${f.prefix} shared name`,
        slug: `${f.prefix}-shared-2`,
      })
    ).error,
  ).not.toBeNull();
  expect(
    (await mor.from("projects").update({ source: "eyal" }).eq("id", morId))
      .error,
  ).not.toBeNull();
  expect(
    (
      await mor
        .from("categories")
        .update({ source: "eyal" })
        .eq("id", morCategory)
    ).error,
  ).not.toBeNull();
  expect(
    (await eyal.from("projects").update({ source: "moriz" }).eq("id", eyalId))
      .error,
  ).not.toBeNull();
  expect(
    (await mor.from("projects").select("source").eq("id", morId).single()).data,
  ).toEqual({ source: "moriz" });

  // Neither side sees or changes the other's rows.
  expect(
    (await mor.from("projects").select("id").eq("id", eyalId)).data,
  ).toEqual([]);
  expect(
    (await mor.from("categories").select("id").eq("id", eyalCategory)).data,
  ).toEqual([]);
  expect(
    (await eyal.from("projects").select("id").eq("id", morId)).data,
  ).toEqual([]);
  await eyal.from("projects").update({ title: "Hijack" }).eq("id", morId);
  await eyal.from("projects").delete().eq("id", morId);
  await eyal
    .from("categories")
    .update({ name: "Hijack" })
    .eq("id", morCategory);
  await eyal.from("categories").delete().eq("id", morCategory);
  expect(
    (await mor.from("projects").select("title").eq("id", morId).single()).data,
  ).toEqual({ title: "Mor project" });
  expect(
    (await mor.from("categories").select("id").eq("id", morCategory)).data,
  ).toHaveLength(1);

  // Saving another source's project is rejected and leaves it untouched.
  expect(
    (
      await eyal.rpc("cms_save_project", {
        project_id: morId,
        project_data: { title: "Hijacked", published: true },
        category_ids: [],
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await mor.rpc("cms_save_project", {
        project_id: eyalId,
        project_data: { title: "Hijacked" },
        category_ids: [],
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await eyal.rpc("cms_reorder_projects", {
        surface: "homepage",
        ids: [morId],
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await mor
        .from("projects")
        .select("title,homepage_order")
        .eq("id", morId)
        .single()
    ).data,
  ).toEqual({ title: "Mor project", homepage_order: 777 });
  for (const client of [anon, outsider]) {
    expect(
      (
        await client.rpc("cms_save_project", {
          project_id: randomUUID(),
          project_data: { title: "Denied" },
          category_ids: [],
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await client.rpc("cms_reorder_projects", {
          surface: "homepage",
          ids: [morId],
        })
      ).error,
    ).not.toBeNull();
  }

  // Cross-source links are rejected on every path.
  expect(
    (
      await eyal.rpc("cms_save_project", {
        project_id: eyalId,
        project_data: {},
        category_ids: [morCategory],
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await mor.rpc("cms_save_project", {
        project_id: morId,
        project_data: {},
        category_ids: [eyalCategory],
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await mor
        .from("project_categories")
        .insert({ project_id: morId, category_id: eyalCategory })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await eyal
        .from("project_categories")
        .insert({ project_id: eyalId, category_id: morCategory })
    ).error,
  ).not.toBeNull();
  // The other source's project with an own-source term is rejected as well.
  expect(
    (
      await mor
        .from("project_categories")
        .insert({ project_id: eyalId, category_id: morCategory })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await eyal
        .from("project_categories")
        .insert({ project_id: morId, category_id: eyalCategory })
    ).error,
  ).not.toBeNull();
  expect(
    (await mor.from("project_categories").select("*").eq("project_id", morId))
      .data,
  ).toEqual([]);
  expect(
    (
      await mor
        .from("project_categories")
        .select("*")
        .eq("category_id", morCategory)
    ).data,
  ).toEqual([]);
  expect(
    (
      await eyal
        .from("project_categories")
        .select("*")
        .eq("category_id", eyalCategory)
    ).data,
  ).toEqual([]);
  // Same-source links work, and an eyal link is invisible to Mor.
  expect(
    (
      await eyal.rpc("cms_save_project", {
        project_id: eyalId,
        project_data: {},
        category_ids: [eyalCategory],
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await eyal
        .from("project_categories")
        .select("source")
        .eq("project_id", eyalId)
    ).data,
  ).toEqual([{ source: "eyal" }]);
  expect(
    (
      await mor
        .from("project_categories")
        .select("*")
        .eq("category_id", eyalCategory)
    ).data,
  ).toEqual([]);
  expect(
    (
      await mor.rpc("cms_save_project", {
        project_id: morId,
        project_data: {},
        category_ids: [morCategory],
      })
    ).error,
  ).toBeNull();

  // An anonymous visitor still sees a published eyal project through the API,
  // but Mor's site never lists or serves it.
  expect(
    (await anon.from("projects").select("source").eq("id", eyalId)).data,
  ).toEqual([{ source: "eyal" }]);
  for (const path of ["/he/projects", "/he"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toContain(eyalTitle);
  }
  expect((await request.get(`/he/projects/${eyalSlug}`)).status()).toBe(404);

  // Cleanup of this test's own rows through their owners.
  await eyal.from("projects").delete().eq("id", eyalId);
  await eyal.from("categories").delete().eq("id", eyalCategory);
  await mor.from("projects").delete().in("id", [morId, spoofId]);
  await mor.from("categories").delete().eq("id", morCategory);
});

test("media follows the same product boundary", async ({ request }) => {
  const { mor, eyal, anon } = await clients();
  const morId = randomUUID();
  const eyalId = randomUUID();
  track(morId, eyalId);
  const bytes = readFileSync("public/party-mode/disco-ball.webp");
  const upload = (client: typeof mor, bucket: string, path: string) =>
    client.storage
      .from(bucket)
      .upload(path, bytes, { contentType: "image/webp" });
  const morDraft = `${morId}/${randomUUID()}.webp`;
  const eyalDraft = `${eyalId}/${randomUUID()}.webp`;
  const eyalPublic = `${eyalId}/${randomUUID()}.webp`;

  // Each admin writes only to their own bucket.
  expect((await upload(mor, MOR_BUCKET, morDraft)).error).toBeNull();
  expect((await upload(eyal, EYAL_BUCKET, eyalDraft)).error).toBeNull();
  expect((await upload(eyal, EYAL_BUCKET, eyalPublic)).error).toBeNull();
  expect(
    (await upload(eyal, MOR_BUCKET, `${morId}/${randomUUID()}.webp`)).error,
  ).not.toBeNull();
  expect(
    (await upload(mor, EYAL_BUCKET, `${eyalId}/${randomUUID()}.webp`)).error,
  ).not.toBeNull();
  expect(
    (await upload(anon, EYAL_BUCKET, `${eyalId}/${randomUUID()}.webp`)).error,
  ).not.toBeNull();

  // Drafts stay private to their own admin.
  expect(
    (await mor.storage.from(MOR_BUCKET).download(morDraft)).error,
  ).toBeNull();
  expect(
    (await eyal.storage.from(EYAL_BUCKET).download(eyalDraft)).error,
  ).toBeNull();
  for (const [client, bucket, path] of [
    [eyal, MOR_BUCKET, morDraft],
    [anon, MOR_BUCKET, morDraft],
    [mor, EYAL_BUCKET, eyalDraft],
    [anon, EYAL_BUCKET, eyalDraft],
  ] as const)
    expect(
      (await client.storage.from(bucket).download(path)).error,
    ).not.toBeNull();

  // A published eyal project that references Mor's draft path does not expose it.
  expect(
    (
      await eyal.rpc("cms_save_project", {
        project_id: eyalId,
        project_data: {
          title: "Eyal media",
          published: true,
          cover_image_url: `/media/${morDraft}`,
          media: [{ src: `/media/${eyalPublic}`, kind: "image" }],
        },
        category_ids: [],
      })
    ).error,
  ).toBeNull();
  expect(
    (await anon.storage.from(MOR_BUCKET).download(morDraft)).error,
  ).not.toBeNull();
  expect((await request.get(`/media/${morDraft}`)).status()).toBe(404);
  // Eyal's published file is public from Eyal's bucket only; Mor's route and
  // bucket never serve it.
  expect(
    (await anon.storage.from(EYAL_BUCKET).download(eyalPublic)).error,
  ).toBeNull();
  expect(
    (await anon.storage.from(MOR_BUCKET).download(eyalPublic)).error,
  ).not.toBeNull();
  expect((await request.get(`/media/${eyalPublic}`)).status()).toBe(404);
  // Unreferenced files in the same bucket stay private.
  expect(
    (await anon.storage.from(EYAL_BUCKET).download(eyalDraft)).error,
  ).not.toBeNull();

  // Neither admin can delete the other's files.
  await eyal.storage.from(MOR_BUCKET).remove([morDraft]);
  await mor.storage.from(EYAL_BUCKET).remove([eyalPublic]);
  expect(
    (await mor.storage.from(MOR_BUCKET).download(morDraft)).error,
  ).toBeNull();
  expect(
    (await eyal.storage.from(EYAL_BUCKET).download(eyalPublic)).error,
  ).toBeNull();

  await eyal.from("projects").delete().eq("id", eyalId);
});
