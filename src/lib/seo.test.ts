import assert from "node:assert/strict";
import { test } from "node:test";
import { he } from "../i18n/dictionaries/he.ts";
import {
  META_DESCRIPTION_MAX,
  clipMetaDescription,
  pageAlternates,
  projectSearchDescription,
  publicSitemapEntries,
} from "./seo.ts";

test("hreflang lists Hebrew and x-default only", () => {
  const alternates = pageAlternates("/he/projects/chabad-club");
  assert.deepEqual(alternates, {
    canonical: "/he/projects/chabad-club",
    languages: {
      he: "/he/projects/chabad-club",
      "x-default": "/he/projects/chabad-club",
    },
  });
  assert.equal(Object.hasOwn(alternates.languages, "en"), false);
  assert.equal(Object.hasOwn(alternates.languages, "en-US"), false);
  assert.equal(Object.hasOwn(alternates.languages, "he-IL"), false);
});

test("a saved SEO description wins over the short label and the body", () => {
  assert.equal(
    projectSearchDescription({
      seo: "מקרה בוחן קצר ומדויק.",
      short: "One Pager",
      body: "פסקה ארוכה שלא אמורה להחליף תיאור שנכתב לשדה ה-SEO.",
    }),
    "מקרה בוחן קצר ומדויק.",
  );
});

test("a short label falls back to the stored project description", () => {
  const text = projectSearchDescription({
    short: "אפליקציית Web",
    body: "פלטפורמה המחברת בין קהילת חב״ד לבעלי העסקים שבה. כל בעל עסק יכול ליצור פרופיל.",
  });
  assert.match(text ?? "", /קהילת חב״ד/);
  assert.equal((text ?? "").includes("אפליקציית Web"), false);
});

test("a longer stored description replaces a sentence it already contains", () => {
  const sentence = "פלטפורמה מקוונת ללימוד מתמטיקה באמצעות בינה מלאכותית.";
  const body = `${sentence} מיתוג מסכי הלמידה.`;
  assert.equal(projectSearchDescription({ short: sentence, body }), body);
});

test("short stored prose is filled from other stored sentences and facts", () => {
  const text = projectSearchDescription({
    short: "פלטפורמה מקוונת ללימוד מתמטיקה באמצעות בינה מלאכותית.",
    passages: [
      "מיתוג ואיפיון מסכי למידה למערכת למידה ללימוד של מתמטיקה לינארית",
    ],
    facts: ["אפיון ועיצוב", "אפליקציית Web", "2025"],
  });
  assert.ok(text);
  assert.ok(text.length >= 140, text);
  assert.ok(text.length <= META_DESCRIPTION_MAX, text);
  assert.equal(text.includes("בינה מלאכותית"), true);
  assert.equal(text.includes("מתמטיקה לינארית"), true);
});

test("a saved SEO description is not clipped or extended", () => {
  const seo = "מ".repeat(180);
  assert.equal(
    projectSearchDescription({
      seo,
      body: "פסקה אחרת לגמרי שאסור שתיכנס לתיאור.",
      facts: ["עיצוב ופיתוח"],
    }),
    seo,
  );
});

test("facts are not added once the stored prose is already long enough", () => {
  const body = `${"מילה ".repeat(30).trim()}.`;
  const text = projectSearchDescription({
    body,
    facts: ["אין להוסיף את העובדה הזו"],
  });
  assert.ok(text);
  assert.equal(text.includes("אין להוסיף"), false);
  assert.ok(text.length <= META_DESCRIPTION_MAX);
});

test("long fallback text is clipped on a space", () => {
  const body = "מילה ".repeat(80).trim();
  const text = projectSearchDescription({ short: "קצר", body });
  assert.ok(text);
  assert.ok(text.length <= META_DESCRIPTION_MAX);
  assert.equal(text.endsWith("…"), true);
  assert.equal(clipMetaDescription("קצר"), "קצר");
});

test("sitemap encodes a Hebrew slug once and lists published articles", () => {
  const entries = publicSitemapEntries({
    siteUrl: "https://moriz.studio",
    locale: "he",
    projects: [
      { slug: "וורדעל", updatedAt: "2026-10-22T08:14:16.386Z" },
      { slug: "chabad-club", updatedAt: "2026-10-23T11:50:20.692Z" },
    ],
    articles: [
      {
        slug: "user-research-before-design",
        updatedAt: new Date("2026-11-01T12:00:00.000Z"),
      },
    ],
    privacyUpdatedOn: "2026-07-18",
  });
  const urls = entries.map((entry) => entry.url);
  assert.deepEqual(urls, [
    "https://moriz.studio/he",
    "https://moriz.studio/he/projects",
    "https://moriz.studio/he/articles",
    "https://moriz.studio/he/privacy-policy",
    "https://moriz.studio/he/projects/%D7%95%D7%95%D7%A8%D7%93%D7%A2%D7%9C",
    "https://moriz.studio/he/projects/chabad-club",
    "https://moriz.studio/he/articles/user-research-before-design",
  ]);
  assert.equal(
    urls.some((url) => url.includes("%25") || url.includes("/digital-audit")),
    false,
  );
  assert.equal(
    entries[0]?.lastModified?.toISOString(),
    "2026-10-23T11:50:20.692Z",
  );
  assert.equal(
    entries[2]?.lastModified?.toISOString(),
    "2026-11-01T12:00:00.000Z",
  );
  assert.equal(
    entries[3]?.lastModified?.toISOString(),
    "2026-07-18T12:00:00.000Z",
  );
});

test("an empty article list omits the articles lastmod and still lists the index", () => {
  const entries = publicSitemapEntries({
    siteUrl: "https://moriz.studio",
    locale: "he",
    projects: [],
    articles: [],
  });
  const articles = entries.find((entry) => entry.url.endsWith("/articles"));
  assert.ok(articles);
  assert.equal(articles.lastModified, undefined);
  assert.equal(entries[0]?.lastModified, undefined);
});

test("homepage and projects descriptions are distinct and within a snippet", () => {
  assert.equal(he.metadata.title.includes("בניית אתרים"), false);
  assert.notEqual(he.metadata.description, he.projects.archive.description);
  assert.ok(he.metadata.description.length <= META_DESCRIPTION_MAX);
  assert.ok(he.projects.archive.description.length <= META_DESCRIPTION_MAX);
  assert.equal(he.metadata.description.includes("מערכות Web"), true);
  assert.equal(he.privacyPolicy.updatedOn, "2026-07-18");
});
