import assert from "node:assert/strict";
import { test } from "node:test";
import { headingSlug } from "./headings.ts";
import { getAllArticles, getPublishedArticles } from "./load.ts";
import { readingMinutes } from "./reading-time.ts";
import {
  ArticleValidationError,
  validateArticleSource,
  type ArticleFiles,
} from "./schema.ts";
import { webpSize } from "./webp.ts";

const description =
  "מחקר משתמשים קצר לפני עיצוב אתר חושף את המשימות האמיתיות של הלקוחות, מונע מסכים מיותרים ומצמצם תיקונים יקרים אחרי האישור.";

function cover(width = 1200, height = 630) {
  const bytes = new Uint8Array(30);
  bytes.set([82, 73, 70, 70], 0);
  bytes.set([87, 69, 66, 80], 8);
  bytes.set([86, 80, 56, 88], 12);
  bytes[24] = (width - 1) & 0xff;
  bytes[25] = ((width - 1) >> 8) & 0xff;
  bytes[26] = ((width - 1) >> 16) & 0xff;
  bytes[27] = (height - 1) & 0xff;
  bytes[28] = ((height - 1) >> 8) & 0xff;
  bytes[29] = ((height - 1) >> 16) & 0xff;
  return bytes;
}

function files(map: Record<string, Uint8Array>): ArticleFiles {
  return { readWebp: (sitePath) => map[sitePath] ?? null };
}

const body = `${"פסקה על מחקר משתמשים לפני עיצוב אתר, כדי שהטקסט יעבור את אורך המינימום בלי להיות כותרת. ".repeat(4)}

## למה זה חשוב

הכותרת הזו חלקה, והפסקה שאחריה מסבירה את הטענה בלי רכיב זר.
`;

function source(extra = "") {
  return `---
title: "מחקר קצר לפני עיצוב אתר"
description: "${description}"
date: "2026-11-01"
category: "מחקר משתמשים"
focusKeyword: "מחקר משתמשים"
${extra}
---
${body}`;
}

const slug = "user-research-note";
const coverPath = `/articles/${slug}/cover.webp`;

test("a complete article passes, and missing optional fields pass", () => {
  const article = validateArticleSource(
    slug,
    source(),
    files({}),
  );
  assert.equal(article.draft, false);
  assert.equal(article.cta, true);
  assert.deepEqual(article.tldr, []);
  assert.deepEqual(article.tags, []);
  assert.equal(article.cover, undefined);
  assert.deepEqual(article.sources, []);
  assert.deepEqual(article.faq, []);
  assert.equal(article.updated, undefined);
  assert.equal(article.headings[0]?.text, "למה זה חשוב");
  assert.equal(article.headings[0]?.id, headingSlug("למה זה חשוב"));
});

test("unknown fields, bad dates, and a string draft fail the build", () => {
  assert.throws(
    () =>
      validateArticleSource(
        slug,
        `---
title: "מחקר קצר לפני עיצוב אתר"
description: "${description}"
date: "yesterday"
category: "מחקר משתמשים"
draft: "true"
slug: "nope"
---
${body}`,
        files({}),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ArticleValidationError);
      assert.match(error.message, /Unknown frontmatter field "slug"/);
      assert.match(error.message, /draft must be a boolean/);
      assert.match(error.message, /date must be a real calendar date/);
      return true;
    },
  );
});

test("an h1, an import, and a missing cover fail", () => {
  const broken = `---
title: "מחקר קצר לפני עיצוב אתר"
description: "${description}"
date: "2026-11-01"
category: "מחקר משתמשים"
cover: "${coverPath}"
---
${body}
# כותרת אסורה

import Widget from "./widget"
`;
  assert.throws(
    () => validateArticleSource(slug, broken, files({})),
    (error: unknown) => {
      assert.ok(error instanceof ArticleValidationError);
      assert.match(error.message, /cannot contain an h1/);
      assert.match(error.message, /cannot import or export/);
      assert.match(error.message, /cover file is missing/);
      return true;
    },
  );
});

test("duplicate Hebrew headings get stable suffixes", () => {
  const article = validateArticleSource(
    slug,
    source().replace(
      "## למה זה חשוב",
      "## למה זה חשוב\n\nפסקה.\n\n## למה זה חשוב",
    ),
    files({}),
  );
  assert.deepEqual(
    article.headings.map((heading) => heading.id),
    [headingSlug("למה זה חשוב"), `${headingSlug("למה זה חשוב")}-2`],
  );
});

test("reading time counts words and stays at least one minute", () => {
  assert.equal(readingMinutes("מילה"), 1);
  assert.equal(readingMinutes(Array.from({ length: 400 }, () => "מילה").join(" ")), 2);
});

test("webp dimensions are read from a VP8X header", () => {
  assert.deepEqual(webpSize(cover()), { width: 1200, height: 630 });
  assert.equal(webpSize(new Uint8Array(8)), null);
});

test("fixture articles stay drafts and the three posts are published", () => {
  const articles = getAllArticles();
  assert.deepEqual(
    getPublishedArticles()
      .map((article) => article.slug)
      .sort(),
    [
      "ai-agents-spec-bottleneck",
      "complex-system-ux-design",
      "ux-specification-process",
    ],
  );
  assert.deepEqual(
    articles
      .filter((article) => article.draft)
      .map((article) => article.slug)
      .sort(),
    ["from-tasks-to-pages", "user-research-before-design"],
  );
  const sample = articles.find(
    (article) => article.slug === "user-research-before-design",
  );
  assert.ok(sample);
  assert.ok(sample.tldr.length >= 2);
  assert.equal(sample.cta, true);
  assert.ok(sample.headings.length >= 2);
  assert.match(sample.body, /<CtaCard \/>/);
  assert.match(sample.body, /<ProjectCard slug="guesto" \/>/);
  assert.match(sample.body, /<RelatedArticle slug="from-tasks-to-pages" \/>/);
});

test("tldr, cta, and the inline cards are validated", () => {
  const ok = validateArticleSource(
    slug,
    source(`tldr:
  - "משפט קצר שמסכם את הטענה המרכזית של המאמר."
cta: false
`),
    files({}),
  );
  assert.equal(ok.cta, false);
  assert.equal(ok.tldr.length, 1);

  assert.throws(
    () =>
      validateArticleSource(
        slug,
        `${source()}
<Widget />
<CtaCard href="javascript:alert(1)" />
<ProjectCard />
`,
        files({}),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ArticleValidationError);
      assert.match(error.message, /Unknown component <Widget>/);
      assert.match(error.message, /CtaCard href/);
      assert.match(error.message, /ProjectCard needs a quoted project slug/);
      return true;
    },
  );
});
