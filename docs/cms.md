# Private portfolio CMS

The existing Next.js portfolio now reads projects from the linked Supabase project
`eqyjdwloiffotezhedxh`. The Hebrew public routes and existing cards are preserved.
Content changes appear on the next public request; no deployment is needed.

## Use

Open `/admin` and enter the owner's password. No email entry or inbox access is
needed. The server signs in the existing owner account through Supabase Auth's
password API; Supabase stores the password hash, and the password is never stored
in this repository or a public environment variable.
Only Auth user `300a2870-9861-4a41-9272-1d783b2636df` can use this site's CMS
(it is mapped to `source = 'moriz'`, see [Ownership](#ownership-of-projects)).
Public signup is disabled. There is no registration screen. To change the password,
update this existing user in Supabase Authentication; keep its UUID and
`private.cms_admins` mapping. Existing magic-link callback URLs return to the
password screen without exchanging a code for a session.

Choose **New project**. The editor has two tabs; switching between them keeps
unsaved changes:

- **פרטי הפרויקט** (project details), in the order the case-study panel shows
  them: name, short description, full description, client, year, my role, number of users (free
  text such as `10,000+`), project type and the project's website link (the
  **מעבר לאתר** button). The short description (`short_description`) is the line
  beside the project name on the homepage; the project description
  (`description`) is edited alongside it and shown beside the main image, above
  the highlights and categories. It also appears in the case-study panel.
  Then **מדיה ראשית**: the main image (the cover) and the main video, each with a
  preview, replace and remove. A collapsed **הגדרות נוספות** section holds
  categories, the homepage and archive card settings (featured toggles, archive
  description, card highlights, hover media, media overrides, manual
  order), the slug, and SEO with the social (OG) image.
- **Case Study**: the case-study content (headline, target audience
  and the content blocks), the **gallery** (rows, below), the **side panel** (logo
  and the panel's background and text colours) and the **highlights**.
  The logo also replaces the project number in the homepage's sticky project header.

Every user-facing text has a Hebrew field and an English field side by side
(`<key>` and `<key>_en`). English is optional; missing English falls back to
Hebrew field by field. The public `/en` routes stay disabled until the rest of the
site has English copy (`src/i18n/config.ts`). Project labels for both languages
live in `src/i18n/project-copy.ts`.

Preview in the editor includes unsaved changes, is private, and shows the case
study, the homepage card or the archive card in Hebrew or English. The project list
also links to a private preview of the last saved version
(`/admin/projects/<id>/preview?view=case|home|archive&locale=he|en`).
Cmd/Ctrl+S saves. Leaving with unsaved changes asks for confirmation.

### Publishing rules

New projects start as drafts, and drafts may be incomplete. The **first** publish
requires a name, short description and main image; a project with a slug (a case study)
also requires a logo, a main video and at least one gallery image (the logo does
not count). The editor shows a checklist and per-tab badges. Projects that are
already published are never blocked or unpublished automatically: the same checks
come back as warnings when saving. A project without a slug is card-only and skips
the case-study requirements.

Saving edits to a published project updates its public content immediately.
Unpublish explicitly to hide it. Slugs stay fixed when an existing title changes.
The slug is optional: clear it to show a project in public lists without a separate
project page or a detail-page link. Multiple projects can have no slug; provided
slugs must remain valid and unique.

### Ordering

**Projects → Homepage order / Projects page order** lists the visible projects in
their public order; drag or use Up/Down and the order saves immediately
(`cms_reorder_projects`). Order numbers can also be set per project.

### Categories and project types

`/admin/categories` manages categories and lists the project types. Categories have
a Hebrew and an English name, an order, and a usage count; renaming keeps
assignments and the slug; deleting asks for confirmation and removes assignments
only. A project has any number of categories and at most one type. Categories are
shown as tags on the homepage card and the case study, listed in the archive card's
hover layer, and used as the archive filters. Both are rows in `categories` (`kind`
= `category` or `type`) linked through `project_categories`; names and slugs are
unique per kind.

Project types are a **fixed list** of five, in this order: משחק, אתר תדמית,
אפליקציית Web, כלי AI, אחר (`src/lib/cms/project-types.ts`, matched by slug).
The admin cannot create, rename or delete types, and saving rejects any other
type. The Moriz rows were set once with `tools/cms/fixed-project-types.sql`
(2026-10-18, a data change run with `npx supabase db query --linked -f`, not a
migration and with no ledger entry): it upserted the five types, moved Awescience
from "איפיון ועיצוב" to "אחר", and deleted the unused old types. Eyal rows were
not touched.

Services were a third list (`kind = 'service'`, shown as a "·" line). They were
merged into categories (`20261016120100`): this site reads any remaining service row
as a category and no longer creates them. The shared table still allows
`kind = 'service'` for the Eyal site. `projects.services`, the old text mirror, is
written empty.

### Case study panel colours

The case study's information panel can have its own background and text colours,
set in the Case Study tab and stored in `projects.panel_style`
(`{ "color": "#rrggbb", "text": "#rrggbb" }`). Without a text colour the text is
light or dark by the background's luminance. Rules, tags and accordions in the
panel follow the text colour. The site grain is drawn over the background, which
stays fixed while the panel content scrolls. Without a background colour the panel
keeps the page surface.

### Content blocks

Blocks: text (with optional eyebrow and subsections), image, image row (1, 2 or 3
images side by side at equal height on desktop, stacked on mobile), image + text
(media on either side, optionally styled as a feature), video, two images, three
images (shown as one row), gallery, and highlights. The **Add block** menu also offers ready sections built
from those blocks: Challenge, Approach, Solution, Design & Development and Final
Experience. Blocks can be reordered, hidden, duplicated and deleted; hidden blocks
may stay incomplete and never render publicly. Every upload lands in the project
gallery and can be picked again from any slot, so files are uploaded once. Gallery
files not placed in a block are shown at the end of the case study.

### Gallery rows

The case-study gallery is edited in **Case Study → גלריה** as rows: each row is
one file at full width or two side by side, and images and videos can share a row.
Files can be uploaded together (each becomes a new full-width row), added from the
files already in the project, reordered by row (drag or Up/Down), moved to the
previous or next row, swapped within a pair, dragged onto another row, replaced,
removed from the gallery (the file stays in the project), or deleted from the
project. Single rows keep the optional width (full, two-thirds, half at either
edge). The order in the editor is the order on the page.

The rows are a `gallery_rows` block in the existing `content` JSON
(`{ type: "gallery_rows", rows: [{ id, items: [src, src?] }] }`), kept last and
hidden from the block list; alt text, captions, posters and sizes stay on the
`media` record. It needs no schema, RLS, RPC or bucket change. A row may reference
only project files that are not the logo or the main video. A project saved before
rows existed has no such block and keeps its old rendering (images no block
places, paired in order). The editor builds the same rows when it opens such a
project (`legacyGalleryRows`), without marking it changed, so the first save keeps
the page identical.

On the page a pair uses the existing equal two-column layout, each file at its own
height and ratio (videos use their recorded size; nothing is cropped). Videos play
muted and looping while visible unless autoplay is turned off for the file, in
which case they show controls. Below 640px the files stack in one column in admin
order.

### Case study presentation

Project pages place the information panel at the logical start of the page
(right in Hebrew, left in English). It fills the available viewport height on
desktop with 32px clearance above and below, scrolling its content internally;
the outlined, notched website button stays at the bottom when a URL is supplied.
Below 1024px the panel appears in normal flow above the gallery, with the website
button after its content. The full description and nonempty text blocks
become exclusive native accordions, with the first open. Text block order and
copy are retained, without section numbers; the list-page collapsible setting
does not affect this panel.
Below 1024px, public case-study pages use 44px icon-only floating actions in the
logical-end gutter. Accordion summaries and answers reserve an additional 24px
plus the device safe area at that edge, keeping copy and expand/collapse controls clear.

Each media block has **פריסת מדיה בעמוד הפרויקט** and **רווח לפני המדיה** controls.
Images and videos support full width, centered two-thirds width, or half width
at either logical edge. Two-image and gallery blocks support equal pairs or
staggered 60/40 pairs; successive gallery pairs alternate. An odd final image
fills the row. Below 640px images fill the width and pairs stack.
Spacing before a block is 32/80/128px on desktop and 24/40/64px below 1024px.
The first media block starts without a preceding gap.

These optional `layout` and `spacing` properties live in the existing content
JSON, with no database migration. Older blocks retain full-width or equal-pair
layouts and regular spacing. Preview includes unsaved layout choices, and
reordering preserves them. The cover leads the gallery, cropped to 16:9 (the viewer shows it whole); a matching first content
image is displayed once, preserving its caption. Images open a keyboard-accessible
viewer and retain their original private `/media/` URLs; without JavaScript their
links open the source images directly. Videos remain inline.

## Ownership of projects

Projects, terms (`categories`) and their links belong to one product, stored in a
`source` column: `'moriz'` (this site, including all existing content) or `'eyal'`
(reserved for a future Eyal Projects site that shares this Supabase project).

- **The owner is decided in the database, never by the client.** `private.cms_admins`
  maps an Auth user to one source (no policies, no grants, so browsers cannot read
  or change it). `private.cms_source()` returns the caller's source, or null for
  visitors and non-admin accounts. Row defaults, RLS policies and the RPCs all use it.
- Reads: an admin sees only their own source; visitors see published rows of any
  source (this site additionally filters `source = 'moriz'`, `src/lib/cms/source.ts`).
  Writes need `source = cms_source()`, so an explicit `source` for another product is
  rejected. A `source` inside an RPC payload is ignored, and `source` can never be updated.
- Taxonomy slugs and names are unique per source and kind. **Project slugs stay
  globally unique** (known Phase 1 limitation: a duplicate-slug error reveals that the
  slug exists in the other product).
- `project_categories` carries `source`, and composite foreign keys
  `(project_id, source)` and `(category_id, source)` make cross-source links impossible
  for every role, including the service role.
- Media: one private bucket per source, `project-media` (moriz) and
  `project-media-eyal`. Storage policies map the bucket to its source, and a file
  becomes public only while a published project of the same source references it.
  `/media/<projectId>/<file>` URLs are unchanged.
- This site's server never trusts request data for ownership; `CMS_SOURCE` and
  `CMS_MEDIA_BUCKET` are constants.

Adding an Eyal admin later is one SQL statement through the CLI or SQL editor (the
`private` schema is not exposed through the API):

```sql
insert into private.cms_admins (user_id, source) values ('<eyal auth uuid>', 'eyal');
```

The Eyal site must scope its queries to `source = 'eyal'` and use bucket
`project-media-eyal`. Any change to this layer is a cross-product change; check it
against both sites.

## Deployment environment

Use Node.js 22 or newer (required by the installed Supabase SDK).
Set these in Vercel for the relevant environment, then redeploy the application:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://eqyjdwloiffotezhedxh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
SUPABASE_ADMIN_EMAIL=morzavi1@gmail.com
SUPABASE_ADMIN_USER_ID=300a2870-9861-4a41-9272-1d783b2636df
```

The two owner identity variables are server-only. The CMS login and project writes
use normal user sessions and RLS; they do not require a service-role key.
`.env.local` is ignored; `.env.example` has placeholders only.

Password login needs no email delivery, SMTP, or redirect allowlist. Preserve the
shared project's existing Site URL, providers, and unrelated redirects. Supabase
Auth handles password verification and authentication rate limits. The server
uses `SUPABASE_ADMIN_EMAIL` internally and checks the resulting user ID against
`SUPABASE_ADMIN_USER_ID` before granting access.

The legacy magic-link configuration helper remains available for historical
operations, but is not required for password login:

```sh
npm run cms:configure-auth
npm run cms:configure-auth -- --apply
```

The helper first reviews the changes, preserves existing redirect URLs, and only
changes the signup flag and redirect allowlist. Do **not** push the entire default
`supabase/config.toml` to this shared project.

Authentication regression checks live in `tests/cms/auth.spec.ts`. Set
`CMS_TEST_ADMIN_PASSWORD` only in the test process to include the real owner
login, session persistence, and logout test; the password is never committed.

## Database and files

CMS migrations:

- `20261008120000_cms_schema.sql`: projects, categories, relationships, timestamps,
  owner check, and RLS.
- `20261008120100_cms_storage.sql`: private bucket and media access policies.
- `20261008120200_cms_seed.sql`: preserved existing projects and example categories.
- `20261008120300_cms_save_project.sql`: transactional project/category saving.
- `20261008120400_cms_optional_slug.sql`: optional project URLs, retaining all
  existing slugs, their uniqueness, and their format constraint.
- `20261012120000_cms_projects_v2.sql`: English and case-study columns, `media`
  (gallery) and `highlights` JSONB, SEO fields, `categories.kind`/`name_en` with
  per-kind uniqueness, partial-update `cms_save_project`, `cms_reorder_projects`,
  media privacy for gallery and OG files, and SVG in the bucket allowlist.
- `20261012120010_cms_save_project_partial_insert.sql`: lets partial payloads
  without a title update existing projects.
- `20261012120100_cms_services_backfill.sql`: copies legacy service tags into
  service terms and links them. Idempotent.
- `20261013120000_cms_project_source.sql`: the ownership boundary above
  (`private.cms_admins`, `private.cms_source()`, `source` columns, composite link keys,
  per-source taxonomy uniqueness, source-scoped RLS and RPCs, per-source media buckets).
  Replaces `private.is_admin()`.
- `20261016120000_cms_panel_style.sql`: optional `projects.panel_style` JSONB for the
  case study panel background, and `cms_save_project` saving it.
- `20261016120100_cms_merge_services_into_categories.sql`: Moriz services become
  categories (matching names or slugs merge into the existing category) and the
  `projects.services` mirror is cleared. Idempotent; Eyal rows are untouched.

This Supabase project is shared with other apps whose migrations are not all in
this repository (for example the Eyal Diagnostic's), so `supabase db push` can
refuse to run. `20261008190000_diagnostic_session_source.sql` is the Moriz
Diagnostic's `diagnostic_sessions.source` column, already applied remotely and
kept here byte-identical to the Moriz Diagnostic repo as a file only.
Apply a new migration with `npx supabase db query --linked -f <file>` and then
`npx supabase migration repair --status applied <version>`. Never mark
`20261008190000` as reverted.

The six earlier diagnostic migrations were recovered from the remote migration
history before adding the CMS. Unrelated diagnostic schema objects were checked
before and after migration and were unchanged. All migrations were dry-run reviewed
before the additive CMS migrations were applied. Never reset the linked database.

`projects.content`, `projects.media` and `projects.highlights` are JSONB arrays
(shapes in `src/types/project.ts`). Reads are lenient (`parseContent`,
`parseMedia`, `parseHighlights` drop anything unknown, so one unexpected block
never breaks a page); writes are validated strictly. The save function only
updates keys present in the payload.
`project_categories` has a composite primary key and cascading foreign keys.
RLS allows public reads of published projects and only their related categories.
All CMS writes require a mapped admin and are limited to that admin's source,
including direct API requests.
Database types were generated into `src/types/database.types.ts` from the remote
public schema.

Images and videos live in the private `project-media` bucket (this site; Eyal's
files go to `project-media-eyal`) under
`<project UUID>/<random UUID>.<extension>`. Stable UUID folders survive slug changes.
JPEG, PNG, WebP, AVIF, GIF, MP4, and WebM are supported, up to 50 MiB per file.
SVG is accepted only for the project logo, and every `/media` response carries a
sandboxing Content-Security-Policy so an SVG opened directly cannot run script.
Image width and height are recorded at upload, so pages keep each file's own
aspect ratio without cropping.
The `/media/[projectId]/[filename]` route streams through Supabase RLS, supports
video range requests, and disables shared caching. A visitor can read a file only
while a published project references it. Unsaved uploads and draft media remain
private, even when their URL is known.

Files are deleted only from the Case Study gallery (after a confirmation that lists where
the file is used) and when saving drops a file that nothing references any more.
Slots such as the cover or a block only unlink. Files shared by duplicated projects
are preserved. Abandoning an unsaved editor can leave private orphan files; those
may be cleaned manually in Storage. Private media bypasses `next/image`
optimization, so the browser compresses images before upload
(`src/components/admin/compress-image.ts`): a PNG, JPEG or WebP over 500 KB or
wider than 2400px is scaled to at most 2400px wide and re-encoded as WebP at quality
0.85 (Safari can't write WebP, so it uses JPEG for opaque images and PNG for
transparent ones). The original, at full size, is kept when the result isn't
smaller; logos and GIFs upload untouched. Videos are not transcoded, and files
uploaded by scripts that write to Storage directly skip this step.

## Existing content

`practice-ai`, `haaretz`, and `chabad-club` were seeded with their existing titles,
descriptions, order, slugs, and four placeholder accordion sections. They were
published to preserve the current public pages. Their original source dictionary
remains as an archive. The original data had no images or services: add real media,
categories, services, and case-study text in `/admin` when ready. No other project
content was found to migrate.

## Verification

### Card hover media and user counts

In **פרטי הפרויקט → הגדרות נוספות** (the card sections), choose or upload separate hover media
for the homepage and the projects page. Either slot accepts an image or a video;
an empty slot automatically uses the gallery's `main_video`, falling back to the
card's own video cover when present. Without a video the regular cover remains.
Explicit slot selections override this default. The alternate loads on mouse or keyboard
intent and appears once ready. Pointer exit or blur restores the cover and pauses
the alternate video. Touch screens retain the cover. Reduced motion uses a video's
poster, or keeps the cover when there is no poster. Failed alternates retain the cover.
Private previews use the same components and unsaved selections.

The case-study sidebar presents `website_url` as the **מעבר לאתר** button. The
destination URL stays in `href` and opens in a separate tab with
`noopener noreferrer`; the long address is not printed in the metadata.

These selections are optional `hover_homepage` and `hover_projects` booleans on
existing gallery `media` items (one file per surface). They use the current JSONB
save path and file references, without a schema, RPC, RLS or bucket change. Selecting
hover media does not automatically append it to the case-study gallery; place it in
a content block to display it there too. Gallery replacement preserves the selection;
removal clears it, and usage warnings identify both hover slots. Existing files,
source ownership and media publication rules remain the same. The additional keys
are optional; consumers of the shared tables can continue reading the existing
`src`/`kind` fields. The future Eyal Projects client has no implementation in this repo.

The **פרטי הפרויקט → מספר משתמשים** field accepts display values such as `10,000+` or `6K+`.
It is stored as a `user-count` highlight (no new column), so card highlight choices
keep working and it counts towards the three-highlight limit. On the case study it
is shown with the project details (label **משתמשים**) and is left out of the panel
highlights and the highlights block; in the Highlights section it appears as a
locked row. When a card has no chosen highlight, the user count is selected
automatically. Clearing the count removes that fact.

The project details in the panel follow the editor's order: client, year, my role,
users, type. Empty fields are hidden with their labels. **מעבר לאתר** follows the
details directly, uses the site's primary button (`button--primary`) and, on a
coloured panel, takes the panel's colours through the button's own tokens so its
hover, active and focus states still apply. It is hidden when there is no link and
is full width below 640px.

Targeted coverage: `npx playwright test --config=playwright.cms.config.ts tests/cms/card-options.spec.ts tests/cms/gallery-rows.spec.ts`.

```sh
npm run typecheck
npm run lint
npm run build
npm run test:cms
```

The CMS browser suite requires the Supabase CLI login and local environment
(including `SUPABASE_ADMIN_EMAIL` and `SUPABASE_ADMIN_USER_ID`). `tests/cms/ownership.spec.ts`
also provisions a temporary `eyal` admin (granted through the CLI, removed with its
Auth user) to prove isolation of rows, links, spoofing attempts and media. It
creates a temporary non-owner account and data under a unique `cms-qa-*` namespace,
checks real RLS and storage behavior, runs the editor/publishing flow, and cleans up
only that run's fixtures. Privileged credentials are obtained in memory for test
setup; the application continues to use normal user sessions and RLS.

The case-study update passed the targeted content-validation and complete
publishing-flow tests (two tests), including layout/spacing save and reload after
reordering, responsive media sizes, mobile action clearance, viewer keyboard bounds,
Escape and focus restoration, native accordions and source links without JavaScript,
and image errors that occur before hydration. Lint, TypeScript and production build
also pass.
