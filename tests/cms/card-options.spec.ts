import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  setHoverMedia,
  setUserCount,
  userCountHighlight,
} from "../../src/lib/cms/card-options";
import {
  mediaUsage,
  replaceSrc,
  unlinkSrc,
} from "../../src/lib/cms/media-refs";
import { projectCard } from "../../src/lib/cms/project-card";
import {
  parseHighlights,
  parseMedia,
  validateProject,
} from "../../src/lib/cms/validation";
import { projectGallery } from "../../src/lib/project-presentation";
import type { Project, ProjectInput } from "../../src/types/project";
import { openMoreSettings } from "./editor";
import { fixture } from "./setup";

test("card hover selections survive parsing, replacement and removal", () => {
  const id = randomUUID();
  const src = (ext: string) => `/media/${id}/${randomUUID()}.${ext}`;
  const cover = src("webp");
  const alternate = src("mp4");
  const replacement = src("mp4");
  const media = setHoverMedia(
    setHoverMedia(
      [
        { src: cover, kind: "image" },
        { src: alternate, kind: "video" },
      ],
      "homepage",
      cover,
    ),
    "projects",
    alternate,
  );
  const project = {
    id,
    title: "Hover",
    cover_image_url: cover,
    media: parseMedia(media),
    content: [],
    highlights: [],
    categories: [],
  } as unknown as Project;
  expect(projectCard(project, "projects").hoverMedia?.src).toBe(alternate);
  expect(projectCard(project, "homepage").hoverMedia).toBeNull();
  expect(projectCard(project, "cover").hoverMedia).toBeNull();
  expect(parseMedia([{ ...media[1], hover_projects: "yes" }])).toEqual([]);
  const input = { ...project, category_ids: [] } as unknown as ProjectInput;
  expect(mediaUsage(input, alternate)).toContain("מעבר עכבר בעמוד הפרויקטים");
  expect(
    projectCard(
      replaceSrc(input, alternate, replacement) as unknown as Project,
      "projects",
    ).hoverMedia?.src,
  ).toBe(replacement);
  expect(
    projectCard(unlinkSrc(input, alternate) as unknown as Project, "projects")
      .hoverMedia,
  ).toBeNull();
});

test("user count reuses project facts without overwriting selected highlights", () => {
  const existing = [
    { id: "scale", value: "12", label: "צוותים", on_archive: true },
  ];
  const highlights = parseHighlights(setUserCount(existing, "10,000+"));
  expect(userCountHighlight(highlights)?.value).toBe("10,000+");
  expect(highlights.find((h) => h.on_archive)?.id).toBe("scale");
  expect(highlights.find((h) => h.on_homepage)?.id).toBe("user-count");
  expect(setUserCount(highlights, "0")).toHaveLength(2);
  expect(userCountHighlight(setUserCount(highlights, "0"))?.value).toBe("0");
  expect(setUserCount(highlights, "")).toEqual(existing);
  expect(
    setUserCount([{ id: "legacy", value: "6K+", label: "משתמשים" }], "8K+"),
  ).toEqual([{ id: "legacy", value: "8K+", label: "משתמשים" }]);
});

test("main project video is the default hover on both card surfaces", () => {
  const project = {
    title: "Video project",
    cover_image_url: "/cover.webp",
    media: [{ src: "/main.mp4", kind: "video", role: "main_video" }],
    content: [],
    highlights: [],
    categories: [],
  } as unknown as Project;
  for (const surface of ["homepage", "projects"] as const) {
    expect(projectCard(project, surface).hoverMedia).toMatchObject({
      src: "/main.mp4",
      kind: "video",
      poster: "/cover.webp",
    });
    expect(
      projectCard({ ...project, cover_image_url: "/main.mp4" }, surface)
        .hoverMedia?.src,
    ).toBe("/main.mp4");
  }
  expect(projectCard(project, "cover").hoverMedia).toBeNull();
});

test("card hover media and user count save, reload and respect input and motion", async ({
  page,
  browser,
}) => {
  const f = fixture();
  const owner = createClient(f.url, f.key, {
    global: { headers: { Authorization: `Bearer ${f.owner.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const id = randomUUID();
  const slug = `${f.prefix}-hover`;
  const title = `${f.prefix} hover preview`;
  const folders = JSON.parse(
    readFileSync(".cache/cms-qa-folders.json", "utf8"),
  );
  writeFileSync(".cache/cms-qa-folders.json", JSON.stringify([...folders, id]));
  async function upload(file: string, ext: string, contentType: string) {
    const path = `${id}/${randomUUID()}.${ext}`;
    const { error } = await owner.storage
      .from("project-media")
      .upload(path, readFileSync(file), { contentType });
    expect(error).toBeNull();
    return `/media/${path}`;
  }
  const cover = await upload(
    "public/party-mode/disco-ball.webp",
    "webp",
    "image/webp",
  );
  const image = await upload(
    "public/images/advantages-garden.webp",
    "webp",
    "image/webp",
  );
  const video = await upload(
    "public/videos/hero-showreel.mp4",
    "mp4",
    "video/mp4",
  );
  const { error } = await owner.from("projects").insert({
    id,
    slug,
    title,
    published: true,
    cover_image_url: cover,
    website_url:
      "https://example.com/a-long-project-url/with/a/path?project=preview",
    panel_style: { color: "#519346", text: "#ffffff" },
    show_on_homepage: true,
    show_on_projects: true,
    homepage_order: -10000,
    projects_order: -10000,
    media: [
      { src: cover, kind: "image", alt: "Cover" },
      { src: image, kind: "image", alt: "Hover image" },
      {
        src: video,
        kind: "video",
        role: "main_video",
        alt: "Hover video",
        poster: cover,
      },
    ],
  });
  expect(error).toBeNull();
  await page.context().addCookies(f.cookies);
  await page.goto(`/admin/projects/${id}`);
  await page.getByLabel("מספר משתמשים", { exact: true }).fill("10,000+");
  await openMoreSettings(page);
  for (const [label, alt] of [
    ["מדיה במעבר עכבר — עמוד הבית", "Hover image"],
    ["מדיה במעבר עכבר — עמוד הפרויקטים", "Hover video"],
  ]) {
    const slot = page.getByRole("group", { name: label, exact: true });
    await slot.getByText("בחירה מהגלריה", { exact: true }).click();
    await slot
      .getByRole("button", { name: `בחירת ${alt}`, exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "שמירת שינויים", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("השינויים נשמרו");
  await page.reload();
  await expect(page.getByLabel("מספר משתמשים", { exact: true })).toHaveValue(
    "10,000+",
  );
  await page
    .getByLabel("מספר משתמשים", { exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: ".cache/project-user-count-desktop.png" });
  const { data: saved } = await owner
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  expect(saved).not.toBeNull();
  const input = {
    ...saved,
    media: parseMedia(saved?.media),
    highlights: parseHighlights(saved?.highlights),
    content: [],
    category_ids: [],
    type_id: null,
  } as unknown as ProjectInput;
  expect(() => validateProject(input)).not.toThrow();
  expect(() =>
    validateProject({
      ...input,
      media: input.media.map((m) => ({ ...m, hover_projects: true })),
    }),
  ).toThrow(/קובץ אחד/);
  const asProject = {
    ...input,
    categories: [],
    type: null,
  } as unknown as Project;
  // Hover-only gallery images do not silently enter the case-study gallery.
  expect(
    projectGallery(asProject, "he", "video").images.some(
      (item) => item.src === image,
    ),
  ).toBe(false);

  await openMoreSettings(page);
  await page.screenshot({
    path: ".cache/project-hover-admin-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileSlot = page.getByRole("group", {
    name: "מדיה במעבר עכבר — עמוד הבית",
    exact: true,
  });
  await mobileSlot.scrollIntoViewIfNeeded();
  await expect(mobileSlot).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".cache/project-hover-admin-mobile.png",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });

  const publicContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const publicPage = await publicContext.newPage();
  await publicPage.goto("/he/projects");
  const card = publicPage.getByRole("link", { name: title, exact: true });
  await card.scrollIntoViewIfNeeded();
  expect(await card.locator("video").count()).toBe(0);
  await card.hover();
  const hoverVideo = card.locator("video");
  await expect
    .poll(() => hoverVideo.evaluate((v) => !(v as HTMLVideoElement).paused))
    .toBe(true);
  await expect(card.locator("[data-active]")).toHaveCSS("opacity", "1");
  await publicPage.screenshot({
    path: ".cache/project-hover-archive-desktop.png",
  });
  await publicPage.mouse.move(0, 0);
  await expect
    .poll(() => hoverVideo.evaluate((v) => (v as HTMLVideoElement).paused))
    .toBe(true);
  await publicPage.keyboard.press("Tab");
  await card.focus();
  await expect(card.locator("[data-active]")).toHaveCSS("opacity", "1");
  await publicPage.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => hoverVideo.evaluate((v) => (v as HTMLVideoElement).paused))
    .toBe(true);

  await publicPage.goto(`/he/projects/${slug}`);
  await expect(publicPage.getByText("10,000+", { exact: true })).toBeVisible();
  const website = publicPage.getByRole("link", {
    name: "מעבר לאתר",
    exact: true,
  });
  await expect(website).toHaveAttribute("target", "_blank");
  await expect(website).toHaveAttribute("rel", "noopener noreferrer");
  // The primary button in the panel's colours: text colour as the fill.
  await expect(website).toHaveClass(/button--primary/);
  await expect(website).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(website).toHaveCSS("color", "rgb(81, 147, 70)");
  await website.scrollIntoViewIfNeeded();
  await publicPage.screenshot({
    path: ".cache/project-website-button-desktop.png",
  });
  await publicContext.route("https://example.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>Test project website</title>",
    }),
  );
  const [websiteTab] = await Promise.all([
    publicPage.waitForEvent("popup"),
    website.click(),
  ]);
  await expect(websiteTab).toHaveURL(
    "https://example.com/a-long-project-url/with/a/path?project=preview",
  );
  await websiteTab.close();
  await publicPage.setViewportSize({ width: 390, height: 844 });
  await website.scrollIntoViewIfNeeded();
  await publicPage.screenshot({
    path: ".cache/project-website-button-mobile.png",
  });
  await publicPage.setViewportSize({ width: 1440, height: 1000 });
  await publicPage.goto("/he");
  const homeMedia = publicPage
    .locator(`a[href="/he/projects/${slug}"]`)
    .filter({ has: publicPage.locator("[class*=media]") })
    .first();
  await homeMedia.scrollIntoViewIfNeeded();
  await homeMedia.hover();
  await expect(homeMedia.locator("[data-active]")).toHaveCSS("opacity", "1");
  await publicPage.screenshot({
    path: ".cache/project-hover-home-desktop.png",
  });

  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const phone = await touch.newPage();
  await phone.goto("/he/projects");
  const phoneCard = phone.getByRole("link", { name: title, exact: true });
  await phoneCard.scrollIntoViewIfNeeded();
  await phoneCard.dispatchEvent("pointerenter", { pointerType: "touch" });
  expect(await phoneCard.locator("video").count()).toBe(0);
  await expect(phoneCard.locator("[data-active]")).toHaveCount(0);
  await phone.screenshot({ path: ".cache/project-hover-archive-mobile.png" });

  // Clear manual alternates: both cards now use the main video automatically.
  await openMoreSettings(page);
  for (const label of [
    "מדיה במעבר עכבר — עמוד הבית",
    "מדיה במעבר עכבר — עמוד הפרויקטים",
  ]) {
    await page
      .getByRole("group", { name: label, exact: true })
      .getByRole("button", { name: "הסרת קובץ", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "שמירת שינויים", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("השינויים נשמרו");
  await publicPage.emulateMedia({ reducedMotion: "no-preference" });
  for (const path of ["/he/projects", "/he"]) {
    await publicPage.goto(path);
    const link = publicPage.locator(`a[href="/he/projects/${slug}"]`).first();
    await link.scrollIntoViewIfNeeded();
    expect(await link.locator("video").count()).toBe(0);
    await link.hover();
    await expect
      .poll(() =>
        link
          .locator("video")
          .evaluate((element) => !(element as HTMLVideoElement).paused),
      )
      .toBe(true);
    await publicPage.mouse.move(0, 0);
    await expect
      .poll(() =>
        link
          .locator("video")
          .evaluate((element) => (element as HTMLVideoElement).paused),
      )
      .toBe(true);
  }
  await touch.close();
  await publicContext.close();
});
