# Articles authoring spec

This is the contract for adding a מאמרים post to Moriz Studio. An automated writer should change **only** the new article file and its images. Do not edit components, routes, dictionaries, or this spec unless a human asks.

The validator in `src/lib/articles/schema.ts` is what `next build` runs. If it fails, the build fails and the article does not ship. Fix the file it names. A missing optional field does not fail. An unknown field does.

Hebrew, RTL, and the locale prefix are already handled. Write the article in Hebrew. The only live locale is `he`.

## Files

| What | Path |
| --- | --- |
| Article | `content/articles/<slug>.mdx` |
| Cover | `public/articles/<slug>/cover.webp` |
| Other images | `public/articles/<slug>/<name>.webp` |

`<slug>` is the filename without `.mdx`. It is not a frontmatter field. Rules:

- lowercase ASCII letters, digits, and single hyphens: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- 3–80 characters
- reserved, do not use: `admin`, `api`, `feed`, `index`, `preview`, `rss`
- one article per file; the directory may contain only `.mdx` files

Public URL: `https://moriz.studio/he/articles/<slug>`

`content/articles/user-research-before-design.mdx` is a **draft fixture**. Leave `draft: true`. Do not publish it and do not delete it.

## Frontmatter

The file starts with YAML between two lines that are exactly `---`. Quote strings. Dates stay strings (`"2026-11-01"`), not timestamps. `draft` is a real boolean. Do not add a field that is not in this table.

| Field | Required | Rule |
| --- | --- | --- |
| `title` | yes | One line, 8–100 characters. The page's only `<h1>`. Do not include `\|` or `Moriz Studio`; the site sets the document title to `{title} \| Moriz Studio`. |
| `description` | yes | One line, 50–160 characters. This is the meta description. Aim for 110–155. If `focusKeyword` is set, the description must contain it exactly. |
| `date` | yes | `YYYY-MM-DD`, a real calendar date from 2000 through 2100. The publish date. |
| `updated` | no | `YYYY-MM-DD`, on or after `date`. Set it only when the article is revised. |
| `category` | yes | One line, 2–40 characters. One topic label, shown on the card. Prefer a name from the list below. A new label does not need a code change. |
| `tags` | no | List of 1–8 strings, each 2–40 characters, no duplicates. Omit the field when there are none. |
| `cover` | no | When present, the exact string `/articles/<slug>/cover.webp`. The file must exist, be a readable WebP, **1200×630**, and at most 500 KB. When omitted, the site OG image is used. |
| `coverAlt` | with cover | One line, 4–160 characters. Required when `cover` is set, forbidden when it is not. Describe the image. |
| `focusKeyword` | no | One line, 2–50 characters. The phrase the article should rank for. |
| `sources` | no | List of 1–10 `{ title, url }`. `title` is 2–160 characters. `url` is an absolute `https` URL with no username or password. No duplicate URLs. Rendered as a sources section. Omit when unused. |
| `faq` | no | List of 1–8 `{ q, a }`. `q` is one line, 8–160 characters, unique. `a` is 20–600 characters. Rendered on the page and emitted as `FAQPage` JSON-LD. Do not repeat the FAQ in the body. |
| `tldr` | no | List of 1–5 one-line bullets, each 12–180 characters. Rendered as בקצרה after the header and cover, before the body. Omit the field when there is no summary. |
| `cta` | no | `true` or `false`. Omitted means `true`. `cta: false` stops the automatic contact card. A `<CtaCard />` you place yourself still renders. |
| `draft` | no | `true` or `false`. Omitted means published. `draft: true` keeps the file in the repo but out of the index, sitemap, and RSS. |

Character counts are Unicode code points (one Hebrew letter is one character). No leading or trailing whitespace. No line breaks inside `title`, `description`, `category`, `tags`, `coverAlt`, `focusKeyword`, or `q`.

Suggested categories: `עיצוב ממשק`, `חוויית משתמש`, `מחקר משתמשים`, `חשיבת מוצר`, `דפוסי ממשק`, `עיצוב אתרים`, `עיצוב אפליקציות`, `כלים`, `ניסויים`, `ממצאים`.

### Example

```yaml
---
title: "מחקר קצר לפני עיצוב אתר חוסך תיקונים"
description: "מחקר משתמשים קצר לפני עיצוב אתר חושף את המשימות האמיתיות של הלקוחות, מונע מסכים מיותרים ומצמצם תיקונים יקרים אחרי האישור."
date: "2026-11-01"
category: "מחקר משתמשים"
tags:
  - "UX"
  - "אתרים"
cover: "/articles/user-research-before-design/cover.webp"
coverAlt: "רקע כהה עם פס אדום וכותרת מחקר משתמשים של Moriz Studio"
focusKeyword: "מחקר משתמשים"
draft: false
tldr:
  - "מחקר קצר לפני העיצוב מגלה את שלוש המשימות שהלקוח בא לבצע."
  - "חמש שיחות עם אנשים אמיתיים מספיקות כדי לזהות שפה ונקודת נטישה."
sources:
  - title: "When to Use Which User-Experience Research Methods"
    url: "https://www.nngroup.com/articles/which-ux-research-methods/"
faq:
  - q: "כמה ראיונות צריך לפני שמתחילים לעצב אתר?"
    a: "חמישה עד שמונה שיחות עם אנשים שדומים ללקוחות האמיתיים מספיקות כדי לזהות את המשימות שחוזרות. המטרה היא דפוס ברור, לא מדגם סטטיסטי."
---
```

A new post that should go live sets `draft: false` or omits `draft`. The fixture in the repo stays `draft: true`.

## Body

Markdown after the closing `---`. 200–100,000 characters.

- The title is the only `h1`. Do not start a line with `# `.
- Headings are ATX only: `##`, `###`, `####`. Plain text: no links, bold, code, or JSX inside a heading. At most 120 characters. Use at least two `##` headings so the table of contents has something to list.
- A line of `---` after a paragraph, with no blank line, is an underline heading and fails the build. Put a blank line before a horizontal rule.
- Do not `import` or `export` anything. Do not use raw HTML (`<div>`, `<br>`, `<script>`).
- No `javascript:` URLs.

Allowed Markdown:

- paragraphs, **bold**, *emphasis*, ~~strikethrough~~
- lists, including task lists (`- [ ]`)
- links `[label](/he/projects)` and autolinks
- blockquotes
- GFM tables
- fenced code (the fence starts at the beginning of the line). Code is shown left-to-right
- footnotes
- horizontal rules, with a blank line before `---`
- images `![alt text](/articles/<slug>/diagram.webp "optional caption")`. Alt text is required. The file must be WebP, at most 2 MB, and each edge at most 4000 pixels

Allowed components, and nothing else:

```mdx
<Callout type="tip">
One or more paragraphs. type is note, tip, or warning. Omit type for note.
</Callout>

<Figure src="/articles/<slug>/diagram.webp" alt="What the image shows" caption="Optional caption" />

<CtaCard />
<CtaCard title="נדבר על איפיון המערכת?" text="אני מור. אשמח לשמוע מה אתם מנסים לעשות." href="#contact" label="בואו נדבר" />

<ProjectCard slug="guesto" />

<RelatedArticle slug="from-tasks-to-pages" />

<Steps title="איך ממצא מהשיחות הופך למסך">
<Step title="שיחה" text="חמש שיחות קצרות עם אנשים שכבר ניסו לפתור את הבעיה." />
<Step title="מיון" text="שלוש משימות שחוזרות, כתובות במילים שהלקוחות אמרו." />
<Step title="מסך" text="כל משימה מקבלת מקום בעמוד, לפני שנפתח קובץ עיצוב." />
</Steps>

<Compare title="אותו אתר, כשהסדר נקבע מהעסק או מהלקוח" start="מהעסק" end="מהלקוח">
<CompareRow start="סיסמה על איכות ושירות" end="המשימה שהמבקר בא לבצע" />
<CompareRow start="רשימת שירותים ארוכה" end="שלוש משימות, מהחשובה לפחות" />
<CompareRow start="גלריה בלי הסבר" end="הוכחה קצרה ליד ההחלטה" />
</Compare>

<Stat title="דוגמה ממקור פומבי: חמישה משתמשים במבחן שימושיות אחד" value="5" label="משתמשים במבחן שימושיות אחד, לפי נילסן נורמן" source="Why You Only Need to Test with 5 Users" url="https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/" />
```

`Figure`: `src` and `alt` are quoted strings. `caption` is optional.

`CtaCard` is the contact invitation. With no props it uses the site default: a first-person line from Mor inviting the reader to talk about characterizing their system, linking to `#contact` on the same page (the footer form). Override `title`, `text`, `href`, and `label` with quoted strings. `href` is a site path or a hash (`#contact`, `/he`, `/digital-audit`), not an external URL. Place it where the invitation belongs. If the body has no `<CtaCard>`, the build inserts one near the middle, before the closest `##`. Set `cta: false` to stop that insertion.

`ProjectCard` shows one published project: its existing title, its existing image, and a link to `/he/projects/<slug>`. It does not add results, quotes, or metrics. `slug` is the project's real slug. If that project is missing, the card is omitted. If the CMS cannot be read, the reader gets a plain link to the project URL.

`RelatedArticle` is a compact קראו גם card. `slug` is another file in `content/articles/`. The card uses that file's title and description. In production a draft target is omitted, so do not point a published article at a draft. On a draft preview the card can point at another draft, and the link keeps `?preview=1`. The list of related articles at the bottom of the page stays; this card is an extra link inside the body.

`Steps`, `Compare`, and `Stat` are infographics. Every attribute is a quoted string on one line. No JavaScript expressions (`{...}`), no unknown attributes, and no `"` or `>` inside a value. An apostrophe inside double quotes is fine. `title` is required on `Steps`, `Compare`, and `Stat`: it is the visible accessible name (the alt text of the graphic).

`Steps` is an ordered process. `title` is 8–140 characters. Inside it, put 2–6 `<Step />` elements and nothing else (no paragraphs, no extra Markdown). Each `Step` is self-closing: `title` is 2–60 characters and `text` is 12–240 characters. `Step` cannot stand outside `Steps`.

`Compare` is a qualitative side-by-side table, not a chart and not a set of measurements. `title` is 8–140 characters. `start` is the first column heading and `end` is the second; each is 2–40 characters. In Hebrew the first column sits on the right. Inside it, put 2–6 `<CompareRow />` elements and nothing else. Each row is self-closing, with `start` and `end` text of 2–160 characters. `CompareRow` cannot stand outside `Compare`.

`Stat` is one sourced number. It is self-closing. All five attributes are required:

| Attribute | Rule |
| --- | --- |
| `title` | 8–140 characters. The claim, visible above the number. |
| `value` | 1–8 characters. A number such as `5`, `85%`, `1.5`, `1,000`, or a range `1–8`. Digits only, plus a comma, decimal point, `%`, or a single dash range. |
| `label` | 8–80 characters. What the number means, visible under it. |
| `source` | 2–160 characters. The source's title. It is the visible link text. |
| `url` | An absolute `https` URL with no username or password. The build fails without it. The credit renders as a link; the hostname is shown next to the title. |

Do not invent a number, a client metric, or a source. If the number is not the studio's own experience, `url` must be the real public page the number comes from. A `Stat` source does not replace frontmatter `sources`. When the article depends on that fact, add the same source there too.

Reading time is computed from the body at about 200 words per minute. Do not put it in frontmatter.

## Images

Cover: **1200×630 WebP**, at most 500 KB, path `public/articles/<slug>/cover.webp`. It is the Open Graph image. `coverAlt` should say what is in the picture.

Other images live in the same folder and use the same WebP rules. Do not hotlink external images. Do not use PNG, JPG, or SVG in the article.

## Internal links

Each article includes 2–4 contextual internal links. Put them in the sentence where they help, not in a dump at the end. Mix them when it fits:

- another article, with `<RelatedArticle slug="..." />` (preferred) or `[label](/he/articles/<slug>)`
- a real project, with `<ProjectCard slug="..." />` or `[label](/he/projects/<project-slug>)`
- a service or decision page: `/digital-audit`, `/he/projects`, `/he`

Use these paths:

| Destination | Path |
| --- | --- |
| Home | `/he` |
| Projects index | `/he/projects` |
| A project | `/he/projects/<project-slug>` |
| Digital audit | `/digital-audit` |
| Another article | `/he/articles/<other-slug>` |
| Privacy | `/he/privacy-policy` |

Do not prefix `/digital-audit` with `/he`. Do not link to `/he/articles/preview/...`.

## SEO rules for the writer

1. One search intent per article. Put `focusKeyword` in the description, in one `##` heading when it reads naturally, and in the first paragraph. Do not repeat it in every sentence.
2. The first paragraph answers the intent in plain Hebrew. The title is a specific claim, not a label like "טיפים".
3. Two to six `##` headings. They should be phrases a person would search, not "מבוא" or "סיכום" alone.
4. Short paragraphs. A table or a list when comparing items. A `Callout` for the one thing the reader should not skip.
5. Name sources for facts that are not the studio's own experience, and put them in `sources`. Two to four FAQ questions that match real follow-up searches, with direct answers.
6. Include 2–4 internal links, as in Internal links above. Link to `/he/projects` or a relevant project when the article describes work the studio does. Link to `/digital-audit` when the reader is still deciding what to build. Link home when describing the studio's process. Do not invent a project slug.
7. Do not invent client names, metrics, quotes, or prices. Do not publish the fixture article.
8. Set `date` to the publish day. Set `updated` only on a later revision, and refresh `description` if the conclusion changed.
9. The page already emits the canonical URL, Open Graph `article` tags (`publishedTime`, `modifiedTime`, cover), a Twitter large card, `BlogPosting` and `BreadcrumbList` JSON-LD, and `FAQPage` JSON-LD when `faq` is set. Do not add a JSON-LD script or a second title in the body.

## What the site does

- `/he/articles` lists published articles, newest first, or an empty state when every article is a draft.
- `/he/articles/<slug>` is the article. Drafts render in `next dev`. In any other environment they render only at `/he/articles/<slug>?preview=1` (rewritten to `/he/articles/preview/<slug>`), with `noindex`.
- Drafts are omitted from the index, the sitemap, and `/he/articles/rss.xml`.
- Related articles prefer the same category, then shared tags.
- The sitemap entry uses `updated` when set, otherwise `date`.

## Publish checklist

1. Add `content/articles/<slug>.mdx` and, when used, `public/articles/<slug>/*.webp`.
2. Touch no other file.
3. `draft` is `false` or omitted for a post that should go live.
4. `npm run typecheck`, `npm run lint`, and `npm run build` pass. A validation error names the file and the field.
