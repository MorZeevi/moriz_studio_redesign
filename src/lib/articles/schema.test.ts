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

test("the sample article is a draft and nothing is published", () => {
  const articles = getAllArticles();
  assert.equal(articles.length, 1);
  assert.equal(articles[0]?.slug, "user-research-before-design");
  assert.equal(articles[0]?.draft, true);
  assert.equal(getPublishedArticles().length, 0);
  assert.ok((articles[0]?.headings.length ?? 0) >= 2);
});
