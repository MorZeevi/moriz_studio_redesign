# Research & Tools blog planning

## Supplied context

Research & Tools is currently a blog/content platform for publishing ongoing content. Its final UX and visual structure have not been defined.

### Candidate topics supplied by the project owner

These topics do not establish final categories or tags:

- UI design
- UX design
- UX research
- Product thinking
- Interface patterns
- Web design
- App design
- Interesting tools
- Experiments
- Useful findings

### Future publishing possibility

In the future, an automated agent may publish a new research piece approximately every few days. This is a future possibility, not an enabled automation or a finalized publishing schedule.

## Decisions (2026-11-01)

The section shipped as **מאמרים** at `/he/articles` and `/he/articles/[slug]`. The writer contract is [articles-authoring.md](articles-authoring.md). Product behavior below is what the code does.

### Blog goals

- Support promotion of Moriz Studio.
- Build the studio's reputation.
- Give search and social a stable article URL, with the studio's existing Organization and Person ids as publisher and author.

### Target audience

A broad audience. The project owner intends the content for everyone, rather than limiting it to a specific professional group. Articles are written in Hebrew.

### Content categories

One `category` string per article, shown as a label on the card and stored as `articleSection`. Recommended Hebrew labels, mapped from the owner's topic list: עיצוב ממשק, חוויית משתמש, מחקר משתמשים, חשיבת מוצר, דפוסי ממשק, עיצוב אתרים, עיצוב אפליקציות, כלים, ניסויים, ממצאים.

The list is not an enum. A new label does not require a code change. There is no category archive and no search or filter on the index.

### Article structure

One MDX file, `content/articles/<slug>.mdx`, plus optional WebP images in `public/articles/<slug>/`. Frontmatter holds title, description, dates, category, tags, cover, focus keyword, sources, FAQ, an optional `tldr` list, a `cta` flag, and draft. The body starts at `h2`. The page adds the title, byline, reading time, בקצרה, table of contents, a contact card, FAQ, and sources. The body may also include `<CtaCard />`, `<ProjectCard slug="..." />`, `<RelatedArticle slug="..." />`, and the cited infographics (`StatHighlight`, `CompareBars`, `ProcessSteps`, `BeforeAfter`, `Timeline`). See the authoring spec for the exact schema.

### Tags

Optional, up to eight short strings. Used for related articles and article metadata. Not a filter UI.

### Search/filtering possibilities

Not in this version. The index is a date-sorted list of published articles.

### Related articles

Up to three other published articles. Same category ranks first, then shared tags, then newer articles fill the row. Hidden when nothing else is published.

### Author/date metadata

Author is fixed: Mor Zeevi / מור זאבי, the existing Person node. `date` is the publish day. `updated` is optional. Reading time is computed (200 words per minute), not authored.

### SEO requirements

Per article: absolute title `{title} | Moriz Studio`, meta description, canonical `/he/articles/<slug>`, Open Graph `article` with `publishedTime`, `modifiedTime`, and the 1200×630 cover (or the site OG image), Twitter large card, `BlogPosting` plus `BreadcrumbList` JSON-LD. FAQ in frontmatter is also rendered and emitted as `FAQPage`. The index is a `CollectionPage` whose main entity is a `Blog`. Sitemap includes the index and every non-draft article, with `lastModified`. Drafts are `noindex` and absent from the sitemap and the RSS feed at `/he/articles/rss.xml`.

### Future automation considerations

A routine may add a post by committing one `.mdx` file and its images to `main`, with no other code changes. `next build` validates every file, including drafts, and fails on malformed frontmatter, unknown fields, missing images, or disallowed markup. Optional fields may be omitted. Drafts are viewable in development and at `/he/articles/<slug>?preview=1`. The sample article stays `draft: true`.

### Content quality rules

Recorded in [articles-authoring.md](articles-authoring.md): one intent per article, the focus keyword in the description, plain-text `h2`s, sources for external facts, no invented metrics or client names, internal links to `/he/projects`, `/digital-audit`, and `/he` when they fit.

### Open questions

- Whether English articles get their own files when `en` is enabled. Today only `he` is generated.
- Whether category archives are worth adding after there is a published corpus.
- The owner's final label list, if the recommended Hebrew categories should be renamed.
