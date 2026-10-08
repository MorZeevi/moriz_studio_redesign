import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import type { Database } from "../../src/types/database.types";
import { fixture } from "./setup";
import {
  validateContent,
  validateProject,
  slugify,
} from "../../src/lib/cms/validation";

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
      await owner
        .from("categories")
        .insert({
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
  await page.goto("/admin/projects/new");
  await expect(page).toHaveURL(/admin\/login/);
  await page.getByLabel("כתובת מייל").fill("not-the-owner@example.invalid");
  await page
    .getByRole("button", { name: "שליחת קישור כניסה", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "חשבון הבעלים" }),
  ).toContainText("חשבון הבעלים");
  await page.context().addCookies(f.cookies);
  await page.goto("/admin/projects/new");
  await page.getByLabel("שם הפרויקט", { exact: true }).fill("CMS browser test");
  const slug = `${f.prefix}-browser`;
  await page.getByLabel("כתובת הפרויקט (Slug)").fill(slug);
  await page.getByLabel("לקוח", { exact: true }).fill("QA client");
  await page.getByLabel("שנה", { exact: true }).fill("2026");
  await page
    .getByLabel("כותרת משנה", { exact: true })
    .fill("Portfolio interactions");
  await page.getByLabel("תיאור קצר לכרטיסי פרויקט").fill("A test project");
  await page
    .getByLabel("תיאור הפרויקט", { exact: true })
    .fill("Full project description");
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
  await page
    .getByLabel("יצירת קטגוריה משותפת חדשה")
    .fill(`${f.prefix} Category`);
  await page
    .getByRole("button", { name: "יצירת קטגוריה", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `הסרת קטגוריה ${f.prefix} Category` }),
  ).toBeVisible();
  await page.getByLabel("הוספת קטגוריה לפרויקט").selectOption({ label: "AI" });
  await page.getByLabel("שירות נוסף").fill("UX/UI Design");
  await page.getByRole("button", { name: "הוספת שירות", exact: true }).click();
  await page.getByLabel("שירות נוסף").fill("Motion");
  await page.getByRole("button", { name: "הוספת שירות", exact: true }).click();
  await page.getByRole("button", { name: "הסרת שירות Motion" }).click();
  await page.getByLabel("שירות נוסף").fill("Frontend Development");
  await page.getByRole("button", { name: "הוספת שירות", exact: true }).click();
  const coverInput = page.locator(
    'fieldset[aria-label="תמונת קאבר"] input[type=file]',
  );
  await coverInput.setInputFiles({
    name: "invalid.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "JPEG" }),
  ).toBeVisible();
  await coverInput.setInputFiles("public/party-mode/disco-ball.webp");
  await expect(page.getByText("מעלה מדיה…", { exact: true })).not.toBeVisible();
  await expect(
    page.locator('fieldset[aria-label="תמונת קאבר"] img'),
  ).toBeVisible();
  async function add(type: string) {
    await page.getByLabel("סוג בלוק", { exact: true }).selectOption(type);
    await page.getByRole("button", { name: "הוספת בלוק", exact: true }).click();
  }
  await add("text");
  await page.getByLabel("כותרת בלוק").fill("The challenge");
  await page.getByLabel("טקסט", { exact: true }).fill("A useful case study.");
  await add("image");
  let block = page.getByRole("region", { name: "תמונה 2", exact: true });
  await block
    .locator('input[type=file][accept^="image/"]')
    .first()
    .setInputFiles("public/party-mode/disco-ball.webp");
  await expect(block.locator("img")).toBeVisible();
  await block.getByLabel("טקסט חלופי לתמונה").fill("Project screen");
  await block.getByLabel("כיתוב תמונה").fill("Screen caption");
  await add("video");
  block = page.getByRole("region", { name: "סרטון 3", exact: true });
  await block
    .locator('input[type=file][accept^="video/"]')
    .setInputFiles("public/party-mode/disco-ball-mobile.webm");
  await expect(block.locator("video")).toBeVisible();
  await block
    .locator('input[type=file][accept^="image/"]')
    .setInputFiles("public/party-mode/disco-ball.webp");
  await expect(block.locator("img")).toBeVisible();
  await block.getByLabel("הפעלה אוטומטית").check();
  await block.getByLabel("לולאה", { exact: true }).check();
  await add("two_images");
  block = page.getByRole("region", { name: "שתי תמונות 4", exact: true });
  for (const input of await block.locator("input[type=file]").all()) {
    await input.setInputFiles("public/party-mode/disco-ball.webp");
    await expect(
      page.getByText("מעלה מדיה…", { exact: true }),
    ).not.toBeVisible();
  }
  await add("gallery");
  block = page.getByRole("region", { name: "גלריה 5", exact: true });
  await block.getByRole("button", { name: "הוספת תמונה לגלריה" }).click();
  await block
    .locator("input[type=file]")
    .setInputFiles("public/party-mode/disco-ball.webp");
  await expect(block.locator("img")).toBeVisible();
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
  await page.getByRole("button", { name: "שמירת טיוטה", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("הטיוטה נשמרה");
  await page.getByRole("button", { name: "תצוגה מקדימה", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The challenge", exact: true }),
  ).toBeVisible();
  await expect(page.locator("video")).toHaveJSProperty("muted", true);
  await page.getByRole("button", { name: "חזרה לעריכה", exact: true }).click();
  await page.getByRole("button", { name: "פרסום", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("מפורסם");
  await publicPage.goto(`/he/projects/${slug}`);
  await expect(
    publicPage.getByRole("heading", { name: "CMS browser test", exact: true }),
  ).toBeVisible();
  await expect(
    publicPage.getByText("Full project description", { exact: true }),
  ).toBeVisible();
  await expect(publicPage.locator("video")).toBeVisible();
  await expect(publicPage.getByAltText("Project screen")).toBeVisible();
  await publicPage.goto("/he/projects");
  await expect(
    publicPage.getByRole("heading", { name: "CMS browser test", exact: true }),
  ).toBeVisible();
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
  const oldCover = await page
    .locator('fieldset[aria-label="תמונת קאבר"] img')
    .getAttribute("src");
  await coverInput.setInputFiles("public/party-mode/disco-ball.webp");
  await expect(
    page.locator('fieldset[aria-label="תמונת קאבר"] img'),
  ).not.toHaveAttribute("src", oldCover ?? "");
  await page
    .getByLabel("שם הפרויקט", { exact: true })
    .fill("CMS updated title");
  await expect(page.getByLabel("כתובת הפרויקט (Slug)")).toHaveValue(slug);
  await page
    .getByRole("button", { name: "שמירת שינויים", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("מפורסם");
  await publicPage.reload();
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
  await row.getByRole("textbox").fill(renamed);
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
  row = page
    .locator("main > div")
    .filter({
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
