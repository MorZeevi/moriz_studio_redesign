# Private portfolio CMS

The existing Next.js portfolio now reads projects from the linked Supabase project
`eqyjdwloiffotezhedxh`. The Hebrew public routes and existing cards are preserved.
Content changes appear on the next public request; no deployment is needed.

## Use

Open `/admin`, enter `morzavi1@gmail.com`, and open the magic link in the same browser.
Only Auth user `300a2870-9861-4a41-9272-1d783b2636df` can use the CMS.
Public signup is disabled. There is no registration or password screen.

Choose **New project**. The editor has five tabs:

- **General** (כללי): name, client, year, website URL, my role, project type,
  services and categories.
- **Homepage & Archive** (עמוד הבית וארכיון): cover media, the "featured" toggle
  (show on homepage), short card description, archive description, optional
  homepage/archive media overrides, manual order, and which highlight each card shows.
- **Case Study**: hero headline and intro, target audience (shown only on the case
  study), up to three highlights, and the content blocks.
- **Gallery** (גלריה): project logo, main video (with poster and loop setting), and
  the image/video gallery with alt text, captions, descriptions, layout, ordering
  (drag or Up/Down), replace and delete.
- **Settings & SEO**: slug, SEO title/description and the social (OG) image.

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
requires a name, short description and cover; a project with a slug (a case study)
also requires a logo, a main video and at least six gallery images (the logo does
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

### Categories, services and project types

`/admin/categories` manages three lists: categories (archive filters), services
and project types. Each has a Hebrew and an English name, an order, and a usage
count. Renaming keeps assignments and the slug; deleting asks for confirmation and
removes assignments only. A project has any number of categories and services and
at most one type. All three are rows in `categories` (`kind` = `category`,
`service` or `type`) linked through `project_categories`; names and slugs are unique
per kind. `projects.services` remains as a mirror of the linked service names.

### Content blocks

Blocks: text (with optional eyebrow and subsections), image, image + text (media
on either side, optionally styled as a feature), video, two images, three images,
gallery, and highlights. The **Add block** menu also offers ready sections built
from those blocks: Challenge, Approach, Solution, Design & Development and Final
Experience. Blocks can be reordered, hidden, duplicated and deleted; hidden blocks
may stay incomplete and never render publicly. Every upload lands in the project
gallery and can be picked again from any slot, so files are uploaded once. Gallery
files not placed in a block are shown at the end of the case study.

### Case study presentation

Project pages place the information panel at the logical start of the page
(right in Hebrew, left in English). It stays visible on desktop; below 1024px
it appears above the gallery. The full description and nonempty text blocks
become exclusive native accordions, with the first open. Text block order and
copy are retained; the list-page collapsible setting does not affect this panel.
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
reordering preserves them. The cover leads the gallery; a matching first content
image is displayed once, preserving its caption. Images open a keyboard-accessible
viewer and retain their original private `/media/` URLs; without JavaScript their
links open the source images directly. Videos remain inline.

## Deployment environment

Use Node.js 22 or newer (required by the installed Supabase SDK).
Set these in Vercel for the relevant environment, then redeploy the application:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://eqyjdwloiffotezhedxh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
SUPABASE_ADMIN_EMAIL=morzavi1@gmail.com
SUPABASE_ADMIN_USER_ID=300a2870-9861-4a41-9272-1d783b2636df
SUPABASE_AUTH_REDIRECT_URL=https://<your-domain>/admin/auth/callback
```

The final three variables are server-only. No service-role key is required by the
application. `.env.local` is ignored; `.env.example` has placeholders only.

In Supabase **Authentication → URL Configuration → Redirect URLs**, add the exact
production callback URL above. Local callbacks for `127.0.0.1:3000`,
`localhost:3000`, and `127.0.0.1:4398` are already configured. Keep the existing Site
URL and unrelated redirects if other apps use this Supabase project.

Alternatively, set `SUPABASE_AUTH_REDIRECT_URL` locally and run:

```sh
npm run cms:configure-auth
npm run cms:configure-auth -- --apply
```

The helper first reviews the changes, preserves existing redirect URLs, and only
changes the signup flag and redirect allowlist. Do **not** push the entire default
`supabase/config.toml` to this shared project.

Magic links use Supabase's default email provider. Email delivery to the owner's
inbox still needs a real login check. If Supabase refuses delivery to that address
or you need higher sending limits, configure custom SMTP in **Authentication →
Email → SMTP Settings**. Custom email-code templates are unavailable on this free
tier with the default provider, which is why this implementation uses magic links.

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
All CMS writes require the fixed owner Auth UUID, including direct API requests.
Database types were generated into `src/types/database.types.ts` from the remote
public schema.

Images and videos live in the private `project-media` bucket under
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

Files are deleted only from the Gallery tab (after a confirmation that lists where
the file is used) and when saving drops a file that nothing references any more.
Slots such as the cover or a block only unlink. Files shared by duplicated projects
are preserved. Abandoning an unsaved editor can leave private orphan files; those
may be cleaned manually in Storage. There is no transcoding, and private media
bypasses `next/image` optimization.

## Existing content

`practice-ai`, `haaretz`, and `chabad-club` were seeded with their existing titles,
descriptions, order, slugs, and four placeholder accordion sections. They were
published to preserve the current public pages. Their original source dictionary
remains as an archive. The original data had no images or services: add real media,
categories, services, and case-study text in `/admin` when ready. No other project
content was found to migrate.

## Verification

```sh
npm run typecheck
npm run lint
npm run build
npm run test:cms
```

The CMS browser suite requires the Supabase CLI login and local environment. It
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
