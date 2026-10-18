import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  addToGallery,
  galleryRows,
  moveToAdjacentRow,
  moveToRow,
  removeFromGallery,
  rowsFrom,
  setRowLayout,
  swapInRow,
  withGalleryRows,
} from "../../src/lib/cms/gallery-rows";
import { replaceSrc, unlinkSrc } from "../../src/lib/cms/media-refs";
import { validateContent, validateProject } from "../../src/lib/cms/validation";
import {
  legacyGalleryRows,
  projectGallery,
  projectHighlights,
  projectUserCount,
} from "../../src/lib/project-presentation";
import type {
  GalleryRow,
  ProjectContentBlock,
  ProjectInput,
  ProjectMediaItem,
} from "../../src/types/project";
import { editorTab } from "./editor";
import { fixture } from "./setup";

const id = "00000000-0000-4000-8000-000000000000";
const file = (n: number, ext = "webp") =>
  `/media/${id}/00000000-0000-4000-8000-${String(n).padStart(12, "0")}.${ext}`;
const image = (n: number, extra: Partial<ProjectMediaItem> = {}) =>
  ({ src: file(n), kind: "image", width: 1536, height: 1024, ...extra }) as const;
const text: ProjectContentBlock = { id: "t", type: "text", text: "Copy" };

/** What a visitor sees of the gallery: row widths, files and viewer order. */
function rendered(project: Parameters<typeof projectGallery>[0]) {
  const gallery = projectGallery(project, "he", "video");
  return {
    rows: gallery.entries.map((entry) =>
      entry.type === "row"
        ? [
            entry.layout,
            entry.spacing,
            entry.items.map((item) =>
              item.kind === "image" ? item.image.src : item.src,
            ),
          ]
        : [entry.type, entry.id],
    ),
    viewer: gallery.images.map((item) => item.src),
  };
}

test("switching a live project to gallery rows keeps its page identical", () => {
  // Shapes of the live projects, plus explicit layouts, hover-only files and
  // files placed by blocks.
  const shapes: Parameters<typeof projectGallery>[0][] = [
    {
      title: "practical",
      title_en: null,
      cover_image_url: file(1),
      content: [text, text, text, text].map((b, i) => ({ ...b, id: `${i}` })),
      highlights: [],
      media: [
        image(1),
        image(2, { role: "logo" }),
        image(3),
        image(4),
        image(5),
        { src: file(6, "mp4"), kind: "video", role: "main_video" },
      ],
    },
    {
      title: "wordal",
      title_en: null,
      cover_image_url: file(1),
      content: [text],
      highlights: [],
      media: [
        image(1),
        {
          src: file(2, "mp4"),
          kind: "video",
          role: "main_video",
          hover_homepage: true,
        },
        image(3, { role: "logo" }),
      ],
    },
    {
      title: "mixed",
      title_en: null,
      cover_image_url: file(1),
      content: [
        { id: "i", type: "image", src: file(4) },
        { id: "h", type: "image", src: file(9), hidden: true },
      ],
      highlights: [],
      media: [
        image(1),
        image(2),
        image(3, { layout: "center" }),
        image(4),
        image(5),
        image(6, { hover_projects: true }),
        image(7),
        image(8),
        image(9),
        { src: file(10, "mp4"), kind: "video" },
      ],
    },
  ];
  for (const project of shapes) {
    const before = rendered(project);
    const content = withGalleryRows(
      project.content,
      rowsFrom(legacyGalleryRows(project)),
    );
    expect(rendered({ ...project, content })).toEqual(before);
  }
  // Practical AI today: one pair, then one full-width image.
  expect(rendered(shapes[0]).rows.slice(-2)).toEqual([
    ["pair", "generous", [file(3), file(4)]],
    ["full", "generous", [file(5)]],
  ]);
});

test("gallery rows validate, render mixed media and follow file edits", () => {
  const rows = (items: string[][]): GalleryRow[] =>
    items.map((list, n) => ({ id: `r${n}`, items: list }));
  const block = (list: string[][]) => ({
    type: "gallery_rows",
    rows: rows(list),
  });
  expect(() => validateContent([block([[file(1), file(2)]])])).not.toThrow();
  expect(() =>
    validateContent([block([[file(1), file(2), file(3)]])]),
  ).toThrow();
  expect(() => validateContent([block([[file(1)], [file(1)]])])).toThrow();
  expect(() => validateContent([block([[]])])).toThrow();
  expect(() => validateContent([block([["javascript:alert(1)"]])])).toThrow();
  const project = {
    id,
    title: "Rows",
    slug: null,
    media: [
      image(1),
      { src: file(2, "mp4"), kind: "video", width: 1920, height: 1080 },
      { src: file(3, "mp4"), kind: "video", role: "main_video" },
    ],
    content: [block([[file(1), file(2, "mp4")]])],
    highlights: [],
    category_ids: [],
    type_id: null,
    published: false,
    featured: false,
    show_on_homepage: true,
    show_on_projects: true,
  } as unknown as ProjectInput;
  for (const key of [
    "client",
    "client_en",
    "title_en",
    "headline",
    "headline_en",
    "short_description",
    "short_description_en",
    "description",
    "description_en",
    "archive_description",
    "archive_description_en",
    "role",
    "role_en",
    "target_audience",
    "target_audience_en",
    "audience_description",
    "audience_description_en",
    "seo_title",
    "seo_title_en",
    "seo_description",
    "seo_description_en",
    "year",
    "website_url",
    "cover_image_url",
    "homepage_image_url",
    "projects_image_url",
    "og_image_url",
    "panel_style",
    "homepage_order",
    "projects_order",
  ])
    (project as Record<string, unknown>)[key] = null;
  expect(() => validateProject(project)).not.toThrow();
  // A row may only use gallery files, never the main video or the logo.
  expect(() =>
    validateProject({
      ...project,
      content: [block([[file(3, "mp4")]])] as ProjectContentBlock[],
    }),
  ).toThrow(/סרטון ראשי/);
  expect(() =>
    validateProject({
      ...project,
      content: [block([[file(7)]])] as ProjectContentBlock[],
    }),
  ).toThrow();
  const gallery = projectGallery({ ...project, cover_image_url: null });
  const row = gallery.entries.find((entry) => entry.type === "row");
  expect(row?.type === "row" && row.layout).toBe("pair");
  expect(row?.type === "row" && row.items.map((item) => item.kind)).toEqual([
    "image",
    "video",
  ]);
  // Videos stay out of the image viewer.
  expect(gallery.images.map((item) => item.src)).toEqual([file(1)]);
  // Replacing or deleting a file updates its row; an emptied row goes away.
  const replaced = replaceSrc(project, file(1), file(8));
  expect(galleryRows(replaced.content)[0].items).toEqual([
    file(8),
    file(2, "mp4"),
  ]);
  const unlinked = unlinkSrc(
    unlinkSrc(project, file(1)),
    file(2, "mp4"),
  );
  expect(galleryRows(unlinked.content)).toEqual([]);
});

test("row edits: layout, moves between rows and removal", () => {
  const [a, b, c, d] = [1, 2, 3, 4].map((n) => file(n));
  let rows = rowsFrom([[a, b], [c], [d]]);
  const ids = rows.map((row) => row.id);
  const items = () => rows.map((row) => row.items);
  rows = setRowLayout(rows, ids[1], "pair");
  expect(items()).toEqual([[a, b], [c, d]]);
  rows = setRowLayout(rows, ids[0], "full");
  expect(items()).toEqual([[a], [b], [c, d]]);
  rows = swapInRow(rows, ids[1]);
  expect(items()).toEqual([[a], [b], [d, c]]);
  // From a pair a file gets its own row on that side.
  rows = moveToAdjacentRow(rows, c, -1);
  expect(items()).toEqual([[a], [b], [c], [d]]);
  // A lone file joins a neighbour with a free slot.
  rows = moveToAdjacentRow(rows, a, 1);
  expect(items()).toEqual([[b, a], [c], [d]]);
  // Next to a full row, the two rows trade places.
  rows = moveToAdjacentRow(rows, c, -1);
  expect(items()).toEqual([[c], [b, a], [d]]);
  rows = moveToRow(rows, d, rows[0].id);
  expect(items()).toEqual([[c, d], [b, a]]);
  rows = moveToRow(rows, c, rows[1].id);
  expect(items()).toEqual([[d], [b, a], [c]]);
  rows = removeFromGallery(rows, d);
  expect(items()).toEqual([[b, a], [c]]);
  rows = addToGallery(addToGallery(rows, d), d);
  expect(items()).toEqual([[b, a], [c], [d]]);
  // Pairing the last row has nothing to pull in.
  expect(setRowLayout(rows, rows[2].id, "pair")).toBe(rows);
  // The block always stays last in the content.
  const content = withGalleryRows([text], rows);
  expect(content.map((block) => block.type)).toEqual(["text", "gallery_rows"]);
  expect(
    withGalleryRows([...content, { ...text, id: "later" }], rows).at(-1)?.type,
  ).toBe("gallery_rows");
});

test("the user count is a project detail, not a highlight", () => {
  const project = {
    highlights: [
      { id: "a", value: "24/7", label: "Support" },
      { id: "user-count", value: "10,000+", label: "משתמשים" },
    ],
  };
  expect(projectUserCount(project)).toBe("10,000+");
  expect(projectHighlights(project).map((h) => h.id)).toEqual(["a"]);
  expect(projectUserCount({ highlights: [] })).toBeNull();
});

test("gallery rows and project details: editor, save, public page and mobile", async ({
  page,
  browser,
}) => {
  const f = fixture();
  const owner = createClient(f.url, f.key, {
    global: { headers: { Authorization: `Bearer ${f.owner.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const projectId = randomUUID();
  const slug = `${f.prefix}-rows`;
  const folders = JSON.parse(
    readFileSync(".cache/cms-qa-folders.json", "utf8"),
  );
  writeFileSync(
    ".cache/cms-qa-folders.json",
    JSON.stringify([...folders, projectId]),
  );
  async function upload(path: string, ext: string, contentType: string) {
    const name = `${projectId}/${randomUUID()}.${ext}`;
    const { error } = await owner.storage
      .from("project-media")
      .upload(name, readFileSync(path), { contentType });
    expect(error).toBeNull();
    return `/media/${name}`;
  }
  const webp = ["public/party-mode/disco-ball.webp", "webp", "image/webp"];
  const cover = await upload(webp[0], webp[1], webp[2]);
  const first = await upload(webp[0], webp[1], webp[2]);
  const second = await upload(
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
    id: projectId,
    slug,
    title: `${f.prefix} rows`,
    published: true,
    year: 2026,
    role: "Design & development",
    website_url: "https://example.com/rows",
    cover_image_url: cover,
    panel_style: { color: "#1f3b5a" },
    highlights: [
      { id: "user-count", value: "10,000+", label: "משתמשים" },
      { id: "fact", value: "24/7", label: "Support" },
    ],
    // A project from before gallery rows: no rows block yet.
    content: [],
    media: [
      { src: cover, kind: "image", alt: "Cover" },
      { src: first, kind: "image", alt: "First", width: 512, height: 512 },
      { src: second, kind: "image", alt: "Second", width: 1600, height: 900 },
      {
        src: video,
        kind: "video",
        alt: "Showreel",
        width: 1920,
        height: 1080,
      },
    ],
  });
  expect(error).toBeNull();
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  const panel = publicPage.locator("aside");
  const gallery = publicPage.getByRole("region", {
    name: "תמונות הפרויקט",
    exact: true,
  });
  await publicPage.goto(`/he/projects/${slug}`);
  // Details follow the editor's order; empty client and type are hidden.
  await expect(panel.locator("dl").first().locator("dt")).toHaveText([
    "שנה",
    "התפקיד שלי",
    "משתמשים",
  ]);
  await expect(panel.getByText("10,000+", { exact: true })).toHaveCount(1);
  await expect(panel.getByText("24/7", { exact: true })).toBeVisible();
  const visit = panel.getByRole("link", { name: "מעבר לאתר" });
  await expect(visit).toHaveAttribute("href", "https://example.com/rows");
  await expect(visit).toHaveAttribute("target", "_blank");
  await expect(visit).toHaveClass(/button--primary/);
  // The button comes right after the details.
  expect(
    await visit.evaluate(
      (element) => element.previousElementSibling?.tagName ?? "",
    ),
  ).toBe("DL");
  // Before the switch: the two unplaced images, paired; the video is not shown.
  await expect(gallery.locator("video")).toHaveCount(0);
  await expect(gallery.locator("img")).toHaveCount(3);

  await page.context().addCookies(f.cookies);
  await page.goto(`/admin/projects/${projectId}`);
  await expect(
    page.getByRole("tab", { name: /^פרטי הפרויקט/ }),
  ).toHaveAttribute("aria-selected", "true");
  // Opening an older project prepares its rows without unsaved changes.
  await editorTab(page, "case");
  await expect(page.getByText("שינויים שלא נשמרו")).toHaveCount(0);
  const row = (n: number) =>
    page.getByRole("region", { name: `שורה ${n}`, exact: true });
  await expect(row(1).locator("img")).toHaveCount(2);
  await expect(row(2)).toHaveCount(0);
  const extras = page.getByRole("region", {
    name: "קבצים בפרויקט שאינם בגלריה",
  });
  await expect(extras.locator("video")).toHaveCount(1);
  await extras
    .getByRole("listitem")
    .filter({ has: page.locator("video") })
    .getByRole("button", { name: "הוספה לגלריה" })
    .click();
  await expect(row(2).locator("video")).toHaveCount(1);
  // [first, second] [video] → [first] [second] [video] → [first] [second, video]
  await page
    .getByRole("button", { name: "העברת פריט 2 לשורה הבאה", exact: true })
    .click();
  await expect(row(3)).toHaveCount(1);
  await row(2)
    .getByRole("button", { name: "שני אלמנטים זה לצד זה", exact: true })
    .click();
  await expect(row(3)).toHaveCount(0);
  await expect(row(2).locator("img, video")).toHaveCount(2);
  await page.getByRole("button", { name: "הזזת שורה 2 למעלה" }).click();
  await expect(row(1).locator("video")).toHaveCount(1);
  // Unsaved edits survive switching tabs.
  await editorTab(page, "details");
  await page.getByLabel("לקוח", { exact: true }).fill("Rows client");
  await editorTab(page, "case");
  await expect(row(1).locator("video")).toHaveCount(1);
  await editorTab(page, "details");
  await expect(page.getByLabel("לקוח", { exact: true })).toHaveValue(
    "Rows client",
  );
  await page
    .getByRole("button", { name: "שמירת שינויים", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("השינויים נשמרו");
  await expect(page.getByText(/נשמר ✓/)).toBeVisible();
  await page.reload();
  await editorTab(page, "case");
  await expect(row(1).locator("img, video")).toHaveCount(2);
  await expect(row(2).locator("img")).toHaveCount(1);

  await publicPage.reload();
  await expect(panel.locator("dl").first().locator("dt")).toHaveText([
    "לקוח",
    "שנה",
    "התפקיד שלי",
    "משתמשים",
  ]);
  const media = gallery.locator("figure img, video");
  // Cover, then the pair (second image + video), then the first image.
  expect(
    await media.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("src")),
    ),
  ).toEqual([cover, second, video, first]);
  const pair = gallery.locator("div:has(> figure):has(> div > video)");
  await expect(pair).toHaveCount(1);
  // Compare the wrappers: the media inside may still be in its reveal motion.
  const [imageBox, videoBox] = await Promise.all([
    pair.locator(":scope > figure").boundingBox(),
    pair.locator(":scope > div").boundingBox(),
  ]);
  expect(imageBox && videoBox && Math.abs(imageBox.y - videoBox.y)).toBe(0);
  // Videos keep their own ratio.
  expect(videoBox && videoBox.width / videoBox.height).toBeCloseTo(16 / 9, 1);
  await publicPage.screenshot({
    path: ".cache/gallery-rows-desktop.png",
    fullPage: true,
  });
  await publicPage.setViewportSize({ width: 390, height: 844 });
  const [mobileImage, mobileVideo] = await Promise.all([
    pair.locator(":scope > figure").boundingBox(),
    pair.locator(":scope > div").boundingBox(),
  ]);
  expect(
    mobileImage &&
      mobileVideo &&
      mobileVideo.y >= mobileImage.y + mobileImage.height,
  ).toBe(true);
  const [visitBox, panelBox] = await Promise.all([
    visit.boundingBox(),
    panel.boundingBox(),
  ]);
  expect(visitBox && panelBox && visitBox.width).toBeGreaterThan(
    (panelBox?.width ?? 0) * 0.8,
  );
  expect(
    await publicPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await publicPage.screenshot({
    path: ".cache/gallery-rows-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".cache/gallery-rows-admin-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });

  // Without a link the button is hidden; removing from the gallery keeps the file.
  await editorTab(page, "details");
  await page.getByLabel("קישור לאתר הפרויקט", { exact: true }).fill("");
  await page.getByLabel("התפקיד שלי", { exact: true }).fill("");
  await editorTab(page, "case");
  await page
    .getByRole("button", { name: "הסרת פריט 3 מהגלריה", exact: true })
    .click();
  await expect(row(2)).toHaveCount(0);
  await expect(extras.locator("img")).toHaveCount(2);
  await page
    .getByRole("button", { name: "שמירת שינויים", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("השינויים נשמרו");
  await publicPage.reload();
  await expect(panel.getByRole("link", { name: "מעבר לאתר" })).toHaveCount(0);
  await expect(panel.getByText("התפקיד שלי")).toHaveCount(0);
  await expect(gallery.locator("figure img, video")).toHaveCount(3);
  const { data: saved } = await owner
    .from("projects")
    .select("media")
    .eq("id", projectId)
    .single();
  expect(
    ((saved?.media ?? []) as { src: string }[]).map((item) => item.src),
  ).toContain(first);
  await visitor.close();
  await owner.from("projects").delete().eq("id", projectId);
});
