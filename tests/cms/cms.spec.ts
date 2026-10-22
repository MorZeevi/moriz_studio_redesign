import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import type { Database } from "../../src/types/database.types";
import { editorTab, openMoreSettings } from "./editor";
import { fixture } from "./setup";
import {
  projectGallery,
  projectInformation,
} from "../../src/lib/project-presentation";
import {
  parseContent,
  parseMedia,
  projectReadiness,
  validateContent,
  validateProject,
  slugify,
} from "../../src/lib/cms/validation";
import type { ProjectInput, ProjectMediaItem } from "../../src/types/project";

test("existing storage files restore removed media to gallery without uploading or saving early", async ({
  page,
}) => {
  const f = fixture();
  const owner = createClient<Database>(f.url, f.key, {
    global: { headers: { Authorization: `Bearer ${f.owner.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const id = randomUUID();
  const otherId = randomUUID();
  const folders = JSON.parse(
    readFileSync(".cache/cms-qa-folders.json", "utf8"),
  );
  writeFileSync(
    ".cache/cms-qa-folders.json",
    JSON.stringify([...folders, id, otherId]),
  );
  const storage = owner.storage.from("project-media");
  async function upload(folder: string, video = false) {
    const name = `${randomUUID()}.${video ? "mp4" : "webp"}`;
    const { error } = await storage.upload(
      `${folder}/${name}`,
      readFileSync(
        video
          ? "public/videos/hero-showreel.mp4"
          : "public/party-mode/disco-ball.webp",
      ),
      { contentType: video ? "video/mp4" : "image/webp" },
    );
    expect(error).toBeNull();
    return {
      name,
      src: `/media/${folder}/${name}`,
      kind: video ? ("video" as const) : ("image" as const),
    };
  }
  const first = await upload(id);
  const removed = await upload(id);
  const extra = await upload(id);
  const video = await upload(id, true);
  const other = await upload(otherId);
  const original: ProjectMediaItem[] = [
    first,
    removed,
    { ...extra, caption: "Keep this caption" },
    video,
  ].map(({ src, kind, ...rest }) => ({ ...rest, src, kind }));
  expect(
    (
      await owner.from("projects").insert({
        id,
        slug: `${f.prefix}-existing-media`,
        title: `${f.prefix} existing media`,
        published: false,
        cover_image_url: first.src,
        media: original,
      })
    ).error,
  ).toBeNull();
  const remaining = original.filter(
    (item) => item.src !== removed.src && item.src !== video.src,
  );
  const content = [
    {
      type: "gallery_rows",
      id: randomUUID(),
      rows: [{ id: randomUUID(), items: [first.src] }],
    },
  ];
  // Reproduce a saved record losing media while the original objects remain in Storage.
  expect(
    (
      await owner
        .from("projects")
        .update({ media: remaining, content })
        .eq("id", id)
    ).error,
  ).toBeNull();
  const before = await storage.list(id, {
    sortBy: { column: "name", order: "asc" },
  });
  expect(before.error).toBeNull();
  expect(before.data).toHaveLength(4);
  const uploads: string[] = [];
  const prefixes: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/storage/v1/object/list/")
    )
      prefixes.push(request.postDataJSON().prefix);
    if (
      ["POST", "PUT", "PATCH"].includes(request.method()) &&
      /\/storage\/v1\/object\/(?!list\/)/.test(request.url())
    )
      uploads.push(request.url());
  });
  await page.context().addCookies(f.cookies);
  await page.goto(`/admin/projects/${id}`);
  await editorTab(page, "case");
  const trigger = page.getByRole("button", {
    name: "בחירה מקבצים קיימים",
    exact: true,
  });
  await trigger.click();
  const picker = page.getByRole("region", {
    name: "בחירה מקבצים קיימים",
    exact: true,
  });
  const file = (name: string) =>
    picker.locator(`[data-storage-file="${name}"]`);
  await expect(file(removed.name)).toContainText("לא בפרויקט (יתום)");
  await expect(file(video.name)).toContainText("לא בפרויקט (יתום)");
  await expect(file(extra.name)).toContainText("בפרויקט ולא בגלריה");
  await expect(file(first.name)).toContainText("בגלריה");
  await expect(file(first.name).getByRole("checkbox")).toBeDisabled();
  await expect(file(other.name)).toHaveCount(0);
  const recoveredImage = file(removed.name).locator("img");
  await expect
    .poll(() =>
      recoveredImage.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const dimensions = await recoveredImage.evaluate(
    (image: HTMLImageElement) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    }),
  );
  await expect(file(video.name).locator("video")).toHaveAttribute(
    "src",
    video.src,
  );
  await file(removed.name).getByRole("checkbox").check();
  await picker.getByRole("button", { name: "סגירה", exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(file(removed.name).getByRole("checkbox")).not.toBeChecked();
  for (const item of [removed, video, extra])
    await file(item.name).getByRole("checkbox").check();
  await expect(picker.getByRole("status")).toHaveText("3 קבצים נבחרו");
  async function expectContainedPreviews() {
    for (const item of [first, removed, extra, video]) {
      expect(
        await file(item.name).evaluate((card) => {
          const preview = card.querySelector("img, video");
          const choice = card.querySelector("label");
          return (
            !!preview &&
            !!choice &&
            preview.getBoundingClientRect().bottom <=
              choice.getBoundingClientRect().top
          );
        }),
      ).toBe(true);
    }
  }
  await expectContainedPreviews();
  await picker.screenshot({ path: ".cache/existing-media-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expectContainedPreviews();
  await picker.screenshot({ path: ".cache/existing-media-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await picker
    .getByRole("button", { name: "הוספת הקבצים לגלריה", exact: true })
    .click();
  await expect(picker).toHaveCount(0);
  const gallery = page.locator("#section-gallery");
  await expect(gallery.getByRole("region", { name: /^שורה \d+$/ })).toHaveCount(
    4,
  );
  const unchanged = await owner
    .from("projects")
    .select("media,content")
    .eq("id", id)
    .single();
  expect(unchanged.data).toEqual({ media: remaining, content });
  await trigger.click();
  for (const item of [removed, video, extra])
    await expect(file(item.name)).toContainText("בגלריה");
  await picker.getByRole("button", { name: "סגירה", exact: true }).click();
  await page.getByRole("button", { name: "שמירת טיוטה", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("הטיוטה נשמרה");
  const saved = await owner
    .from("projects")
    .select("media,content")
    .eq("id", id)
    .single();
  const media = parseMedia(saved.data?.media);
  expect(media).toHaveLength(4);
  expect(media.find((item) => item.src === removed.src)).toMatchObject({
    kind: "image",
    ...dimensions,
  });
  expect(media.find((item) => item.src === video.src)).toMatchObject({
    kind: "video",
    width: expect.any(Number),
    height: expect.any(Number),
  });
  expect(media.find((item) => item.src === extra.src)?.caption).toBe(
    "Keep this caption",
  );
  const rows = parseContent(saved.data?.content).find(
    (block) => block.type === "gallery_rows",
  )?.rows;
  expect(rows).toHaveLength(4);
  expect(new Set(rows?.flatMap((row) => row.items))).toEqual(
    new Set([first.src, removed.src, video.src, extra.src]),
  );
  expect(uploads).toEqual([]);
  expect(prefixes.length).toBeGreaterThan(0);
  expect(new Set(prefixes)).toEqual(new Set([id]));
  expect(
    (await storage.list(id, { sortBy: { column: "name", order: "asc" } })).data,
  ).toEqual(before.data);
  await page.reload();
  await editorTab(page, "case");
  await expect(gallery.getByRole("region", { name: /^שורה \d+$/ })).toHaveCount(
    4,
  );
});

test("validation rejects malformed blocks and preserves Hebrew slugs", () => {
  expect(slugify("חב״ד קלאב")).toBe("חבד-קלאב");
  expect(() =>
    validateContent([{ type: "video", src: "javascript:alert(1)" }]),
  ).toThrow();
  expect(() =>
    validateContent([{ type: "two_images", images: [{ src: "" }] }]),
  ).toThrow();
  expect(() => validateContent([{ type: "text", text: "" }], true)).toThrow();
  expect(() =>
    validateContent([{ type: "text", text: "draft" }]),
  ).not.toThrow();
  expect(() => validateProject({} as never)).toThrow();
  // Reads stay lenient so one unknown block never breaks a public page.
  expect(
    parseContent([
      { type: "text", text: "kept" },
      { type: "from_the_future", text: "dropped" },
      "not a block",
    ]),
  ).toEqual([{ type: "text", text: "kept" }]);
  expect(parseContent(null)).toEqual([]);
});

test("publishing rules, gallery and highlight validation", () => {
  const id = "00000000-0000-4000-8000-000000000000";
  const file = (n: number, ext = "webp") =>
    `/media/${id}/00000000-0000-4000-8000-${String(n).padStart(12, "0")}.${ext}`;
  const base = {
    id,
    title: "Project",
    slug: "project",
    short_description: "One line",
    cover_image_url: file(1),
    media: [],
    highlights: [],
    content: [],
    category_ids: [],
    type_id: null,
    title_en: null,
    short_description_en: null,
    seo_title: null,
    seo_description: null,
  } as unknown as ProjectInput;
  const messages = (p: ProjectInput) =>
    projectReadiness(p)
      .errors.map((e) => e.message)
      .join(" ");
  // A case study needs a logo, a main video and one gallery image.
  expect(messages(base)).toContain("לוגו");
  expect(messages(base)).toContain("סרטון ראשי");
  const complete = {
    ...base,
    media: [
      { src: file(2, "svg"), kind: "image", role: "logo" },
      { src: file(3, "mp4"), kind: "video", role: "main_video" },
      { src: file(4), kind: "image" },
    ],
  } as ProjectInput;
  expect(projectReadiness(complete).errors).toEqual([]);
  // Neither the logo nor the main video counts towards the required image.
  const noGalleryImages = {
    ...complete,
    media: complete.media.slice(0, -1),
  } as ProjectInput;
  expect(messages(noGalleryImages)).toContain("נדרשת לפחות תמונה אחת");
  // Card-only projects (no slug) skip the case-study requirements.
  expect(projectReadiness({ ...base, slug: null }).errors).toEqual([]);
  // SVG is accepted only as the logo; kind must match the file.
  expect(parseMedia([{ src: file(2, "svg"), kind: "image" }])).toEqual([]);
  expect(
    parseMedia([{ src: file(2, "svg"), kind: "image", role: "logo" }]),
  ).toHaveLength(1);
  expect(parseMedia([{ src: file(3, "mp4"), kind: "image" }])).toEqual([]);
  expect(() =>
    validateContent([{ type: "image", src: file(2, "svg") }]),
  ).toThrow();
  // New block types parse; hidden blocks may stay incomplete when published.
  expect(() =>
    validateContent(
      [
        { type: "media_text", src: "", text: "", hidden: true },
        {
          type: "three_images",
          images: [{ src: file(4) }, { src: file(5) }, { src: file(6) }],
        },
        { type: "highlights", title: "Facts" },
      ],
      true,
    ),
  ).not.toThrow();
});

test("media presentation is optional, type-specific and preserves gallery order", () => {
  for (const layout of ["full", "center", "start", "end"]) {
    for (const spacing of ["regular", "generous", "extra"]) {
      expect(() =>
        validateContent([{ type: "image", src: "", layout, spacing }]),
      ).not.toThrow();
      expect(() =>
        validateContent([{ type: "video", src: "", layout, spacing }]),
      ).not.toThrow();
    }
  }
  for (const layout of ["equal", "staggered"])
    expect(() =>
      validateContent([{ type: "gallery", images: [], layout }]),
    ).not.toThrow();
  for (const properties of [
    { layout: "staggered" },
    { layout: ["full"] },
    { spacing: "300px" },
    { spacing: ["regular"] },
  ]) {
    expect(() =>
      validateContent([{ type: "image", src: "", ...properties }]),
    ).toThrow();
  }
  expect(() =>
    validateContent([{ type: "gallery", images: [], layout: "center" }]),
  ).toThrow();
  expect(() => validateContent([{ type: "image", src: "" }])).not.toThrow();
  const project = {
    title: "Gallery",
    title_en: null,
    cover_image_url: "/cover",
    description: "Original description",
    description_en: null,
    target_audience: null,
    target_audience_en: null,
    audience_description: null,
    audience_description_en: null,
    media: [],
    highlights: [],
    content: [
      { type: "text" as const, title: " ", text: "Untitled information" },
      {
        type: "gallery" as const,
        layout: "staggered" as const,
        images: [
          { src: "/cover", caption: "Cover caption" },
          { src: "/second" },
          { src: "/third" },
        ],
      },
      { type: "video" as const, src: "/video" },
      {
        type: "image" as const,
        src: "/last",
        layout: "end" as const,
        spacing: "extra" as const,
      },
      { type: "text" as const, title: "Empty", text: " " },
    ],
  };
  const saved = JSON.stringify(project);
  const gallery = projectGallery(project);
  expect(gallery.images.map((image) => image.src)).toEqual([
    "/cover",
    "/second",
    "/third",
    "/last",
  ]);
  expect(gallery.images[0].caption).toBe("Cover caption");
  expect(
    gallery.entries.map((entry) => ("layout" in entry ? entry.layout : null)),
  ).toEqual(["full", "staggered", "full", "end"]);
  expect(
    projectInformation(project, "About", "More").map((item) => [
      item.title,
      item.text,
    ]),
  ).toEqual([
    ["About", "Original description"],
    ["More", "Untitled information"],
  ]);
  expect(JSON.stringify(project)).toBe(saved);
});

test("RLS, category cascades, atomic saving and media privacy", async ({
  request,
}) => {
  const f = fixture();
  const make = () =>
    createClient<Database>(f.url, f.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  const owner = make();
  await owner.auth.setSession(f.owner);
  const outsider = make();
  await outsider.auth.setSession(f.outsider);
  const anon = make();
  const id = f.folder;
  const categoryId = randomUUID();
  const slug = `${f.prefix}-api`;
  expect(
    (
      await owner.from("categories").insert({
        id: categoryId,
        name: `${f.prefix} API`,
        slug: `${f.prefix}-api-category`,
      })
    ).error,
  ).toBeNull();
  const fields = {
    title: "CMS API test",
    slug,
    published: false,
    services: ["UX/UI Design"],
    content: [],
  };
  expect(
    (
      await owner.rpc("cms_save_project", {
        project_id: id,
        project_data: fields,
        category_ids: [categoryId],
      })
    ).error,
  ).toBeNull();
  expect((await anon.from("projects").select("id").eq("id", id)).data).toEqual(
    [],
  );
  expect(
    (await outsider.from("projects").select("id").eq("id", id)).data,
  ).toEqual([]);
  expect(
    (await anon.from("categories").select("id").eq("id", categoryId)).data,
  ).toEqual([]);
  expect(
    (
      await outsider
        .from("projects")
        .insert({ title: "Denied", slug: `${f.prefix}-denied` })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await anon
        .from("projects")
        .insert({ title: "Denied", slug: `${f.prefix}-denied` })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await outsider
        .from("categories")
        .insert({ name: "Denied", slug: `${f.prefix}-denied` })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await outsider.rpc("cms_save_project", {
        project_id: id,
        project_data: { ...fields, title: "Denied" },
        category_ids: [],
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await owner.rpc("cms_save_project", {
        project_id: id,
        project_data: { ...fields, title: "Must rollback" },
        category_ids: [randomUUID()],
      })
    ).error,
  ).not.toBeNull();
  expect(
    (await owner.from("projects").select("title").eq("id", id).single()).data
      ?.title,
  ).toBe("CMS API test");
  expect(
    (await owner.from("project_categories").select("*").eq("project_id", id))
      .data,
  ).toHaveLength(1);
  const file = `${id}/${randomUUID()}.webp`;
  const bytes = readFileSync("public/party-mode/disco-ball.webp");
  expect(
    (
      await owner.storage
        .from("project-media")
        .upload(file, bytes, { contentType: "image/webp" })
    ).error,
  ).toBeNull();
  expect(
    (await anon.storage.from("project-media").download(file)).error,
  ).not.toBeNull();
  expect(
    (
      await outsider.storage
        .from("project-media")
        .upload(`${id}/${randomUUID()}.webp`, bytes, {
          contentType: "image/webp",
        })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await anon.storage
        .from("project-media")
        .upload(`${id}/${randomUUID()}.webp`, bytes, {
          contentType: "image/webp",
        })
    ).error,
  ).not.toBeNull();
  expect((await request.get(`/media/${file}`)).status()).toBe(404);
  const publicFields = {
    ...fields,
    published: true,
    cover_image_url: `/media/${file}`,
  };
  expect(
    (
      await owner.rpc("cms_save_project", {
        project_id: id,
        project_data: publicFields,
        category_ids: [categoryId],
      })
    ).error,
  ).toBeNull();
  expect(
    (await anon.from("projects").select("id").eq("id", id)).data,
  ).toHaveLength(1);
  expect(
    (await anon.from("categories").select("id").eq("id", categoryId)).data,
  ).toHaveLength(1);
  const response = await request.get(`/media/${file}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(
    (
      await request.get(`/media/${file}`, { headers: { Range: "bytes=0-15" } })
    ).status(),
  ).toBe(206);
  // Gallery files become public with their project, like covers.
  const galleryFile = `${id}/${randomUUID()}.webp`;
  expect(
    (
      await owner.storage
        .from("project-media")
        .upload(galleryFile, bytes, { contentType: "image/webp" })
    ).error,
  ).toBeNull();
  expect((await request.get(`/media/${galleryFile}`)).status()).toBe(404);
  // A partial payload (no title, no links) keeps every other stored value.
  expect(
    (
      await owner.rpc("cms_save_project", {
        project_id: id,
        project_data: {
          title_en: "CMS API test EN",
          media: [{ src: `/media/${galleryFile}`, kind: "image" }],
        },
        category_ids: null as unknown as string[],
      })
    ).error,
  ).toBeNull();
  const partial = await owner
    .from("projects")
    .select("title,title_en,published,cover_image_url")
    .eq("id", id)
    .single();
  expect(partial.data).toEqual({
    title: "CMS API test",
    title_en: "CMS API test EN",
    published: true,
    cover_image_url: `/media/${file}`,
  });
  expect(
    (await owner.from("project_categories").select("*").eq("project_id", id))
      .data,
  ).toHaveLength(1);
  expect((await request.get(`/media/${galleryFile}`)).status()).toBe(200);
  // Names are unique per kind: a service may share a category's name.
  const serviceId = randomUUID();
  expect(
    (
      await owner.from("categories").insert({
        id: serviceId,
        kind: "service",
        name: `${f.prefix} API`,
        slug: `${f.prefix}-api-category`,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.from("categories").insert({
        kind: "service",
        name: `${f.prefix} api`,
        slug: `${f.prefix}-api-service-2`,
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await owner.rpc("cms_save_project", {
        project_id: id,
        project_data: {},
        category_ids: [categoryId, serviceId],
      })
    ).error,
  ).toBeNull();
  expect(
    (await anon.from("categories").select("kind").eq("id", serviceId)).data,
  ).toEqual([{ kind: "service" }]);
  expect(
    (
      await owner.rpc("cms_save_project", {
        project_id: id,
        project_data: {},
        category_ids: [categoryId],
      })
    ).error,
  ).toBeNull();
  const unpublishedUpload = `${id}/${randomUUID()}.webp`;
  expect(
    (
      await owner.storage
        .from("project-media")
        .upload(unpublishedUpload, bytes, { contentType: "image/webp" })
    ).error,
  ).toBeNull();
  expect((await request.get(`/media/${unpublishedUpload}`)).status()).toBe(404);
  await outsider.from("projects").update({ title: "Denied" }).eq("id", id);
  await outsider.from("projects").delete().eq("id", id);
  await anon.from("projects").delete().eq("id", id);
  await outsider.from("categories").delete().eq("id", categoryId);
  await outsider.storage.from("project-media").remove([file]);
  await anon.storage.from("project-media").remove([file]);
  expect(
    (await owner.from("projects").select("title").eq("id", id).single()).data
      ?.title,
  ).toBe("CMS API test");
  expect(
    (await owner.storage.from("project-media").download(file)).error,
  ).toBeNull();
  await owner
    .from("categories")
    .update({ name: `${f.prefix} Renamed` })
    .eq("id", categoryId);
  expect(
    (await owner.from("project_categories").select("*").eq("project_id", id))
      .data,
  ).toHaveLength(1);
  await owner.from("categories").delete().eq("id", categoryId);
  expect(
    (await owner.from("project_categories").select("*").eq("project_id", id))
      .data,
  ).toEqual([]);
  expect(
    (await owner.from("projects").select("id").eq("id", id)).data,
  ).toHaveLength(1);
  await owner.from("projects").update({ published: false }).eq("id", id);
  expect((await request.get(`/media/${file}`)).status()).toBe(404);
  expect((await request.get(`/he/projects/${slug}`)).status()).toBe(404);
});

test("private routes and a complete editor publishing flow", async ({
  page,
  browser,
}) => {
  const f = fixture();
  const tab = (name: "details" | "case" | "more") =>
    name === "more" ? openMoreSettings(page) : editorTab(page, name);
  const uploading = page.getByText("מעלה מדיה…", { exact: true });
  const webp = readFileSync("public/party-mode/disco-ball.webp");
  await page.goto("/admin/projects/new");
  await expect(page).toHaveURL(/admin\/login/);
  await page.getByLabel("סיסמה", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "כניסה לניהול", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "הסיסמה שגויה" }),
  ).toContainText("הסיסמה שגויה");
  await page.context().addCookies(f.cookies);
  await page.goto("/admin/projects/new");
  await page.getByLabel("שם הפרויקט", { exact: true }).fill("CMS browser test");
  await page
    .getByLabel("שם הפרויקט (English)", { exact: true })
    .fill("CMS browser test EN");
  await page.getByLabel("לקוח", { exact: true }).fill("QA client");
  await page.getByLabel("שנה", { exact: true }).fill("2026");
  await tab("more");
  const slug = `${f.prefix}-browser`;
  await page.getByLabel("כתובת הפרויקט (Slug)").fill(slug);
  await page
    .locator("#panel-details")
    .getByLabel("תיאור קצר", { exact: true })
    .fill("A test project");
  await page
    .locator("#panel-details")
    .getByLabel("תיאור הפרויקט", { exact: true })
    .fill("Full project description");
  await tab("case");
  await page
    .getByLabel("כותרת משנה", { exact: true })
    .fill("Portfolio interactions");
  await page
    .getByLabel("קהל יעד", { exact: true })
    .fill("Business owners and professionals");
  await page.getByRole("button", { name: "שמירת טיוטה", exact: true }).click();
  await expect(page).toHaveURL(/admin\/projects\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop() ?? "";
  const folders = JSON.parse(
    readFileSync(".cache/cms-qa-folders.json", "utf8"),
  );
  folders.push(id);
  writeFileSync(".cache/cms-qa-folders.json", JSON.stringify(folders));
  const anon = await browser.newContext();
  const publicPage = await anon.newPage();
  await publicPage.goto(`/he/projects/${slug}`);
  await expect(publicPage.getByText("404", { exact: true })).toBeVisible();
  await tab("more");
  await page
    .getByLabel("יצירת קטגוריה משותפת חדשה", { exact: true })
    .fill(`${f.prefix} Category`);
  await page
    .getByRole("button", { name: "יצירת קטגוריה", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `הסרת קטגוריה ${f.prefix} Category` }),
  ).toBeVisible();
  // Options read "name / English name".
  const addCategory = page.getByLabel("הוספת קטגוריה לפרויקט");
  const ai = await addCategory
    .locator("option", { hasText: /^AI( \/|$)/ })
    .getAttribute("value");
  await addCategory.selectOption(ai ?? "");
  // Project types are a fixed list.
  const typeSelect = page.getByLabel("סוג הפרויקט", { exact: true });
  await expect
    .poll(() =>
      typeSelect.evaluate((select) =>
        [...(select as HTMLSelectElement).options].map((o) => o.text),
      ),
    )
    .toEqual([
      "לא נבחר",
      "משחק",
      "אתר תדמית",
      "אפליקציית Web",
      "כלי AI",
      "מחשבון",
      "אחר",
    ]);
  await typeSelect.selectOption({ label: "כלי AI" });
  await tab("details");
  const cover = page.locator('fieldset[aria-label="תמונה ראשית"]');
  const coverInput = cover.locator("input[type=file]");
  await coverInput.setInputFiles({
    name: "invalid.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "JPEG" }),
  ).toBeVisible();
  await coverInput.setInputFiles("public/party-mode/disco-ball.webp");
  await expect(uploading).not.toBeVisible();
  await expect(cover.locator("img").first()).toBeVisible();
  await tab("case");
  async function add(type: string) {
    await page.getByLabel("סוג בלוק", { exact: true }).selectOption(type);
    await page.getByRole("button", { name: "הוספת בלוק", exact: true }).click();
  }
  await add("text");
  await page.getByLabel("כותרת בלוק", { exact: true }).fill("The challenge");
  await page.getByLabel("כותרת בלוק (English)").fill("The challenge EN");
  await page.getByLabel("טקסט", { exact: true }).fill("A useful case study.");
  await add("image");
  let block = page.getByRole("region", { name: "תמונה 2", exact: true });
  await block
    .locator('input[type=file][accept^="image/"]')
    .first()
    .setInputFiles("public/party-mode/disco-ball.webp");
  await expect(block.locator("img").first()).toBeVisible();
  await block
    .getByLabel("טקסט חלופי לתמונה", { exact: true })
    .fill("Project screen");
  await block.getByLabel("כיתוב תמונה", { exact: true }).fill("Screen caption");
  await block.getByLabel(/^פריסת מדיה בעמוד הפרויקט/).selectOption("end");
  await block.getByLabel(/^רווח לפני המדיה/).selectOption("extra");
  await add("video");
  block = page.getByRole("region", { name: "סרטון 3", exact: true });
  await block
    .locator('input[type=file][accept^="video/"]')
    .setInputFiles("public/party-mode/disco-ball-mobile.webm");
  await expect(block.locator("video").first()).toBeVisible();
  await block
    .locator('input[type=file][accept^="image/"]')
    .setInputFiles("public/party-mode/disco-ball.webp");
  await expect(uploading).not.toBeVisible();
  await block.getByLabel("הפעלה אוטומטית").check();
  await block.getByLabel("לולאה", { exact: true }).check();
  await add("two_images");
  block = page.getByRole("region", { name: "שתי תמונות 4", exact: true });
  await block.getByLabel("פריסת מדיה בעמוד הפרויקט").selectOption("staggered");
  await block.getByLabel("רווח לפני המדיה").selectOption("generous");
  for (const input of await block.locator("input[type=file]").all()) {
    await input.setInputFiles("public/party-mode/disco-ball.webp");
    await expect(uploading).not.toBeVisible();
  }
  await add("gallery");
  block = page.getByRole("region", { name: "גלריה 5", exact: true });
  await block.getByLabel("פריסת מדיה בעמוד הפרויקט").selectOption("staggered");
  await block.getByRole("button", { name: "הוספת תמונה לגלריה" }).click();
  await block
    .locator("input[type=file]")
    .setInputFiles("public/party-mode/disco-ball.webp");
  await expect(block.locator("img").first()).toBeVisible();
  await add("text");
  const temporary = page.getByRole("region", { name: "טקסט 6", exact: true });
  await temporary.getByLabel("טקסט", { exact: true }).fill("Temporary block");
  page.once("dialog", (dialog) => dialog.accept());
  await temporary
    .getByRole("button", { name: "הסרת בלוק", exact: true })
    .click();
  await expect(temporary).toHaveCount(0);
  await page.getByRole("button", { name: "הזזת בלוק 5 למעלה" }).click();
  await expect(
    page.getByRole("region", { name: "גלריה 4", exact: true }),
  ).toBeVisible();
  // A hidden block is kept in the editor but never rendered publicly.
  await add("preset:challenge");
  block = page.getByRole("region", { name: /^טקסט 6/ });
  await block.getByLabel("טקסט", { exact: true }).fill("Hidden draft section");
  await block.getByRole("button", { name: "הסתרה", exact: true }).click();
  await page.getByRole("button", { name: "הוספת היילייט (0/3)" }).click();
  await page.getByLabel("ערך", { exact: true }).fill("6K+");
  await page.getByLabel("תווית", { exact: true }).fill("Community members");
  await tab("more");
  await page
    .getByLabel(/^היילייט בכרטיס בעמוד הבית/)
    .selectOption({ label: "6K+ · Community members" });
  await page.getByRole("button", { name: "שמירת טיוטה", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("הטיוטה נשמרה");
  await page.reload();
  await tab("case");
  await expect(
    page
      .getByRole("region", { name: "תמונה 2", exact: true })
      .getByLabel("פריסת מדיה בעמוד הפרויקט"),
  ).toHaveValue("end");
  await expect(
    page
      .getByRole("region", { name: "תמונה 2", exact: true })
      .getByLabel("רווח לפני המדיה"),
  ).toHaveValue("extra");
  await expect(
    page
      .getByRole("region", { name: "גלריה 4", exact: true })
      .getByLabel("פריסת מדיה בעמוד הפרויקט"),
  ).toHaveValue("staggered");
  await page.getByRole("button", { name: "תצוגה מקדימה", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The challenge", exact: true }),
  ).toBeVisible();
  await expect(page.locator("video").first()).toHaveJSProperty("muted", true);
  await page.getByLabel(/^שפה/).selectOption("en");
  await expect(
    page.getByRole("heading", { name: "CMS browser test EN", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The challenge EN", exact: true }),
  ).toBeVisible();
  await page.getByLabel(/^מה מציגים/).selectOption("home");
  await expect(page.getByText("6K+", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "חזרה לעריכה", exact: true }).click();
  // The first publish is gated on a complete case study.
  await page.getByRole("button", { name: "פרסום", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "כדי לפרסם" }),
  ).toContainText("לוגו");
  await tab("case");
  await page
    .locator('fieldset[aria-label="לוגו"] input[type=file]')
    .setInputFiles({
      name: "logo.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20"/></svg>',
      ),
    });
  await expect(uploading).not.toBeVisible();
  await expect(
    page.locator('fieldset[aria-label="לוגו"] img').first(),
  ).toBeVisible();
  await tab("details");
  await page
    .locator('fieldset[aria-label="סרטון ראשי"] input[type=file]')
    .setInputFiles("public/party-mode/disco-ball-mobile.webm");
  await expect(uploading).not.toBeVisible();
  await tab("case");
  await page
    .locator('fieldset[aria-label="העלאת קבצים לגלריה"] input[type=file]')
    .setInputFiles(
      [1, 2, 3, 4, 5, 6].map((n) => ({
        name: `screen-${n}.webp`,
        mimeType: "image/webp",
        buffer: webp,
      })),
    );
  await expect(uploading).not.toBeVisible();
  await expect(page.locator("[data-gallery-count]")).not.toHaveAttribute(
    "data-gallery-count",
    /^[0-5]$/,
  );
  await page.getByRole("button", { name: "הזזת שורה 2 למעלה" }).click();
  await page.getByRole("button", { name: "פרסום", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("מפורסם");
  await publicPage.goto(`/he/projects/${slug}`);
  await expect(
    publicPage.getByRole("heading", { name: "CMS browser test", exact: true }),
  ).toBeVisible();
  await expect(
    publicPage.getByText("Full project description", { exact: true }),
  ).toBeVisible();
  // Target audience is its own panel accordion (closed by default).
  await expect(
    publicPage.getByText("Business owners and professionals"),
  ).toBeAttached();
  await expect(publicPage.getByText("Hidden draft section")).toHaveCount(0);
  await expect(publicPage.locator("video").first()).toBeVisible();
  await expect(publicPage.getByAltText("Project screen")).toBeVisible();
  const gallery = publicPage.getByRole("region", {
    name: "תמונות הפרויקט",
    exact: true,
  });
  // Five placed images, then the six bulk uploads no block places.
  await expect(gallery.locator("img")).toHaveCount(11);
  await expect(gallery.locator('[data-layout="end"]')).toHaveCSS(
    "width",
    /px$/,
  );
  const imageLink = gallery.getByRole("link", {
    name: "הגדלת תמונה 2 — Project screen",
    exact: true,
  });
  await imageLink.click();
  const viewer = publicPage.getByRole("dialog", {
    name: "צפייה בתמונות הפרויקט",
    exact: true,
  });
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText("2 / 11");
  await expect(viewer).toContainText("Screen caption");
  await viewer
    .getByRole("button", { name: "התמונה הקודמת", exact: true })
    .click();
  await expect(viewer).toContainText("1 / 11");
  await expect(
    viewer.getByRole("button", { name: "התמונה הקודמת", exact: true }),
  ).toBeDisabled();
  await publicPage.keyboard.press("ArrowRight");
  await expect(viewer).toContainText("1 / 11");
  await publicPage.keyboard.press("ArrowLeft");
  await publicPage.keyboard.press("ArrowLeft");
  await expect(viewer).toContainText("3 / 11");
  await publicPage.keyboard.press("Escape");
  await expect(viewer).not.toBeVisible();
  await expect(imageLink).toBeFocused();
  const about = publicPage.locator("aside details").first();
  await expect(about).toHaveAttribute("open", "");
  await publicPage.getByText("The challenge", { exact: true }).click();
  await expect(about).not.toHaveAttribute("open", "");
  await expect(
    publicPage.getByText("A useful case study.", { exact: true }),
  ).toBeVisible();
  const offset = gallery.locator('[data-layout="end"]');
  const galleryWidth = await gallery.evaluate(
    (element) => element.getBoundingClientRect().width,
  );
  expect(
    await offset.evaluate((element) => element.getBoundingClientRect().width),
  ).toBeCloseTo(galleryWidth / 2, 0);
  await expect(offset).toHaveCSS("margin-top", "128px");
  const staggered = gallery.locator('[data-layout="staggered"]').last();
  const pairWidths = await staggered
    .locator("figure")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().width),
    );
  expect(pairWidths[0] / pairWidths[1]).toBeCloseTo(1.5, 1);
  await publicPage.evaluate(() => window.scrollTo(0, 500));
  expect(
    await publicPage
      .locator("aside")
      .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
  ).toBe(32);
  await publicPage.setViewportSize({ width: 390, height: 844 });
  await expect(publicPage.locator("aside")).toHaveCSS("position", "static");
  const mobileActions = publicPage.getByRole("navigation", {
    name: "פעולות מהירות",
    exact: true,
  });
  expect(
    await mobileActions
      .getByRole("button")
      .evaluate((element) => element.getBoundingClientRect().width),
  ).toBeCloseTo(44, 0);
  const actionEdge = await mobileActions.evaluate(
    (element) => element.getBoundingClientRect().right,
  );
  const answerEdge = await publicPage
    .getByText("A useful case study.", { exact: true })
    .evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getBoundingClientRect().left;
    });
  expect(answerEdge).toBeGreaterThan(actionEdge);
  expect(
    await offset.evaluate((element) => element.getBoundingClientRect().width),
  ).toBeCloseTo(
    await gallery.evaluate((element) => element.getBoundingClientRect().width),
    0,
  );
  await expect(offset).toHaveCSS("margin-top", "64px");
  expect(
    await staggered
      .locator("figure")
      .evaluateAll(
        (elements) =>
          elements[1].getBoundingClientRect().top >
          elements[0].getBoundingClientRect().bottom,
      ),
  ).toBe(true);
  expect(
    await publicPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await publicPage.setViewportSize({ width: 1440, height: 1000 });
  await publicPage.evaluate(() => {
    document.documentElement.dataset.theme = "light";
    window.scrollTo(0, 0);
  });
  await gallery.locator("img").evaluateAll((elements) =>
    elements.forEach((element) => {
      if (element instanceof HTMLImageElement) element.loading = "eager";
    }),
  );
  await expect
    .poll(() =>
      gallery
        .locator("img")
        .evaluateAll((elements) =>
          elements.every(
            (element) =>
              element instanceof HTMLImageElement &&
              element.complete &&
              element.naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await publicPage
    .getByRole("button", { name: "Hide developer tools", exact: true })
    .click();
  await publicPage.screenshot({
    path: ".cache/project-gallery-layouts-desktop.png",
    fullPage: true,
  });
  await publicPage.setViewportSize({ width: 390, height: 844 });
  await publicPage.screenshot({
    path: ".cache/project-gallery-layouts-mobile.png",
    fullPage: true,
  });
  await publicPage.setViewportSize({ width: 1440, height: 1000 });
  const coverUrl = await gallery.locator("a").first().getAttribute("href");
  if (!coverUrl) throw new Error("Missing cover link");
  await publicPage.route(`**${coverUrl}`, (route) => route.abort());
  await publicPage.reload();
  await expect(
    gallery.getByText("לא ניתן לטעון את התמונה.", { exact: true }),
  ).toBeVisible();
  await gallery.locator("a").first().click();
  await expect(
    viewer.getByText("לא ניתן לטעון את התמונה.", { exact: true }),
  ).toBeVisible();
  await expect(
    viewer.getByRole("link", { name: "פתיחת התמונה המקורית", exact: true }),
  ).toHaveAttribute("href", coverUrl);
  await publicPage.keyboard.press("Escape");
  await publicPage.unroute(`**${coverUrl}`);
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(`/he/projects/${slug}`);
  await noJsPage.getByText("The challenge", { exact: true }).click();
  await expect(
    noJsPage.getByText("A useful case study.", { exact: true }),
  ).toBeVisible();
  await expect(
    noJsPage.getByRole("link", {
      name: "הגדלת תמונה 2 — Project screen",
      exact: true,
    }),
  ).toHaveAttribute("href", /\/media\//);
  await noJs.close();
  await publicPage.goto("/he/projects");
  await expect(
    publicPage.getByRole("heading", { name: "CMS browser test", exact: true }),
  ).toBeVisible();
  // Target audience is only on the case study.
  await expect(
    publicPage.getByText("Business owners and professionals"),
  ).toHaveCount(0);
  await publicPage
    .getByRole("link")
    .filter({ hasText: `${f.prefix} Category` })
    .click();
  await expect(
    publicPage.getByRole("heading", { name: "CMS browser test", exact: true }),
  ).toBeVisible();
  await publicPage.goto("/he");
  await expect(
    publicPage.getByRole("heading", { name: "CMS browser test", exact: true }),
  ).toBeVisible();
  await page.goto(`/admin/projects/${id}`);
  await page.screenshot({
    path: ".cache/cms-editor-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".cache/cms-editor-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await tab("details");
  const oldCover = await cover.locator("img").first().getAttribute("src");
  await coverInput.setInputFiles("public/party-mode/disco-ball.webp");
  await expect(cover.locator("img").first()).not.toHaveAttribute(
    "src",
    oldCover ?? "",
  );
  await page
    .getByLabel("שם הפרויקט", { exact: true })
    .fill("CMS updated title");
  await tab("more");
  await expect(page.getByLabel("כתובת הפרויקט (Slug)")).toHaveValue(slug);
  await page
    .getByRole("button", { name: "שמירת שינויים", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("מפורסם");
  await publicPage.goto(`/he/projects/${slug}`);
  await expect(
    publicPage.getByRole("heading", { name: "CMS updated title", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `הסרת קטגוריה ${f.prefix} Category` })
    .click();
  await page
    .getByRole("button", { name: "שמירת שינויים", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("מפורסם");
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "ביטול פרסום", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("הטיוטה נשמרה");
  await publicPage.goto(`/he/projects/${slug}`);
  await expect(publicPage.getByText("404", { exact: true })).toBeVisible();
  await page.goto("/admin/projects");
  const row = page.locator("article").filter({ hasText: "CMS updated title" });
  await row.getByRole("button", { name: "שכפול", exact: true }).click();
  await expect(page).toHaveURL(/admin\/projects\/[0-9a-f-]{36}$/);
  await expect(page.getByLabel("שם הפרויקט", { exact: true })).toHaveValue(
    "CMS updated title — העתק",
  );
  // Duplicates keep the type link.
  await expect(page.getByLabel("סוג הפרויקט", { exact: true })).not.toHaveValue(
    "",
  );
  await page.goto("/admin/projects");
  await page
    .locator("article")
    .filter({ hasText: "CMS updated title — העתק" })
    .getByRole("button", { name: "מחיקה", exact: true })
    .click();
  await expect(
    page.locator("article").filter({ hasText: "CMS updated title — העתק" }),
  ).toHaveCount(0);
  await page
    .locator("article")
    .filter({ hasText: "CMS updated title" })
    .getByRole("button", { name: "מחיקה", exact: true })
    .click();
  await expect(
    page.locator("article").filter({ hasText: "CMS updated title" }),
  ).toHaveCount(0);
  await anon.close();
});

test("global categories can be created, renamed and deleted without deleting projects", async ({
  page,
}) => {
  const f = fixture();
  const owner = createClient<Database>(f.url, f.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await owner.auth.setSession(f.owner);
  await page.context().addCookies(f.cookies);
  await page.goto("/admin/categories");
  const name = `${f.prefix} Shared`;
  await page.getByLabel("קטגוריה חדשה", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "הוספת קטגוריה", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("נוספה");
  const { data: category } = await owner
    .from("categories")
    .select("*")
    .eq("name", name)
    .single();
  expect(category).not.toBeNull();
  if (!category) throw new Error("Category was not created");
  const ids = [randomUUID(), randomUUID()];
  for (const [index, id] of ids.entries())
    expect(
      (
        await owner.rpc("cms_save_project", {
          project_id: id,
          project_data: {
            title: `Category usage ${index}`,
            slug: `${f.prefix}-category-${index}`,
            published: false,
          },
          category_ids: [category.id],
        })
      ).error,
    ).toBeNull();
  await page.reload();
  let row = page
    .locator("main > div")
    .filter({ has: page.getByLabel(`שם קטגוריה: ${name}`, { exact: true }) });
  await expect(row).toContainText("2 פרויקטים");
  const renamed = `${f.prefix} Renamed`;
  await row.getByLabel(`שם קטגוריה: ${name}`, { exact: true }).fill(renamed);
  await row.getByRole("button", { name: "שמירת שם", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("השם נשמר");
  expect(
    (
      await owner
        .from("categories")
        .select("slug")
        .eq("id", category.id)
        .single()
    ).data?.slug,
  ).toBe(category.slug);
  expect(
    (
      await owner
        .from("project_categories")
        .select("*")
        .eq("category_id", category.id)
    ).data,
  ).toHaveLength(2);
  await page
    .getByLabel("קטגוריה חדשה", { exact: true })
    .fill(renamed.toLowerCase());
  await page
    .getByRole("button", { name: "הוספת קטגוריה", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "כבר קיימים" }),
  ).toBeVisible();
  row = page.locator("main > div").filter({
    has: page.getByLabel(`שם קטגוריה: ${renamed}`, { exact: true }),
  });
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("2 פרויקטים");
    await dialog.dismiss();
  });
  await row.getByRole("button", { name: "מחיקה", exact: true }).click();
  await expect(row).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "מחיקה", exact: true }).click();
  await expect(row).toHaveCount(0);
  expect(
    (await owner.from("projects").select("id").in("id", ids)).data,
  ).toHaveLength(2);
  expect(
    (
      await owner
        .from("project_categories")
        .select("*")
        .eq("category_id", category.id)
    ).data,
  ).toEqual([]);
});

test("projects without URLs save, publish and duplicate without public detail links", async ({
  page,
  browser,
}) => {
  const f = fixture();
  const owner = createClient<Database>(f.url, f.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await owner.auth.setSession(f.owner);
  function record(id: string) {
    const folders: string[] = JSON.parse(
      readFileSync(".cache/cms-qa-folders.json", "utf8"),
    );
    writeFileSync(
      ".cache/cms-qa-folders.json",
      JSON.stringify([...folders, id]),
    );
  }
  await page.context().addCookies(f.cookies);
  await page.goto("/admin/projects/new");
  const title = `${f.prefix} No URL`;
  await page.getByLabel("שם הפרויקט", { exact: true }).fill(title);
  const slugInput = page.getByLabel("כתובת הפרויקט (Slug)");
  await openMoreSettings(page);
  await expect(slugInput).not.toHaveValue("");
  await slugInput.fill("");
  await expect(slugInput).not.toHaveAttribute("required", "");
  await page.getByRole("button", { name: "שמירת טיוטה", exact: true }).click();
  await expect(page).toHaveURL(/admin\/projects\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop() ?? "";
  record(id);
  expect(
    (await owner.from("projects").select("slug").eq("id", id).single()).data
      ?.slug,
  ).toBeNull();
  await page.reload();
  await expect(slugInput).toHaveValue("");
  await page.getByLabel("שם הפרויקט", { exact: true }).fill(`${title} edited`);
  await expect(slugInput).toHaveValue("");
  await page.getByRole("button", { name: "תצוגה מקדימה", exact: true }).click();
  await expect(
    page
      .locator("#project-content")
      .getByRole("heading", { name: `${title} edited`, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "חזרה לעריכה", exact: true }).click();
  // Card-only projects publish without a gallery, but need card essentials.
  await openMoreSettings(page);
  await page
    .locator("#panel-details")
    .getByLabel("תיאור קצר", { exact: true })
    .fill("Card only");
  await page
    .locator('fieldset[aria-label="תמונה ראשית"] input[type=file]')
    .setInputFiles("public/party-mode/disco-ball.webp");
  await expect(page.getByText("מעלה מדיה…", { exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "פרסום", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("מפורסם");
  const secondId = randomUUID();
  record(secondId);
  expect(
    (
      await owner.rpc("cms_save_project", {
        project_id: secondId,
        project_data: {
          title: `${f.prefix} Another no URL`,
          slug: null,
          published: true,
        },
        category_ids: [],
      })
    ).error,
  ).toBeNull();
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  for (const path of ["/he", "/he/projects"]) {
    await publicPage.goto(path);
    for (const projectId of [id, secondId]) {
      // The homepage renders each project as sibling strip + body elements.
      const card = publicPage.locator(`[data-project-card="${projectId}"]`);
      await expect(card.first()).toBeVisible();
      await expect(card.getByRole("link")).toHaveCount(0);
    }
  }
  const addedSlug = `${f.prefix}-added-url`;
  await openMoreSettings(page);
  await slugInput.fill(addedSlug);
  await page
    .getByRole("button", { name: "שמירת שינויים", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("מפורסם");
  await publicPage.goto("/he/projects");
  await expect(
    publicPage.locator(`article a[href="/he/projects/${addedSlug}"]`),
  ).toBeVisible();
  await publicPage.goto(`/he/projects/${addedSlug}`);
  await expect(
    publicPage.getByRole("heading", { name: `${title} edited`, exact: true }),
  ).toBeVisible();
  await slugInput.fill("");
  await page
    .getByRole("button", { name: "שמירת שינויים", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("מפורסם");
  await publicPage.reload();
  await expect(publicPage.getByText("404", { exact: true })).toBeVisible();
  await page.goto("/admin/projects");
  await page
    .locator("article")
    .filter({ hasText: `${title} edited` })
    .getByRole("button", { name: "שכפול", exact: true })
    .click();
  await expect(page).toHaveURL(/admin\/projects\/[0-9a-f-]{36}$/);
  const duplicateId = page.url().split("/").pop() ?? "";
  record(duplicateId);
  await expect(slugInput).toHaveValue("");
  const duplicate = await owner
    .from("projects")
    .select("slug,published")
    .eq("id", duplicateId)
    .single();
  expect(duplicate.data).toEqual({ slug: null, published: false });
  await publicContext.close();
});
