# Private portfolio CMS

The existing Next.js portfolio now reads projects from the linked Supabase project
`eqyjdwloiffotezhedxh`. The Hebrew public routes and existing cards are preserved.
Content changes appear on the next public request; no deployment is needed.

## Use

Open `/admin`, enter `morzavi1@gmail.com`, and open the magic link in the same browser.
Only Auth user `300a2870-9861-4a41-9272-1d783b2636df` can use the CMS.
Public signup is disabled. There is no registration or password screen.

Choose **New project**, upload a cover, enter details, select categories, add service
tags and content blocks, then preview and publish. New projects start as drafts.
Preview in the editor includes unsaved changes and is private. The project list
also provides a private preview of the last saved version.

Saving edits to a published project updates its public content immediately.
Unpublish explicitly to hide it. Homepage and Projects visibility and ordering
are controlled separately. Slugs stay fixed when an existing title changes.

Categories are global, reusable, and support multiple assignments per project.
Renaming keeps assignments and the category slug. Deleting asks for confirmation,
shows the usage count, and removes assignments without deleting projects.
Services are editable text tags stored directly on each project.

Supported blocks: text, image, video, two images, and gallery. Drag the block
handle or use Up/Down buttons. Videos support posters, looping, controls, and
autoplay; autoplay always uses muted playback.

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

The six earlier diagnostic migrations were recovered from the remote migration
history before adding the CMS. Unrelated diagnostic schema objects were checked
before and after migration and were unchanged. All migrations were dry-run reviewed
before the additive CMS migrations were applied. Never reset the linked database.

`projects.content` is an ordered JSONB array; services are a text array.
`project_categories` has a composite primary key and cascading foreign keys.
RLS allows public reads of published projects and only their related categories.
All CMS writes require the fixed owner Auth UUID, including direct API requests.
Database types were generated into `src/types/database.types.ts` from the remote
public schema.

Images and videos live in the private `project-media` bucket under
`<project UUID>/<random UUID>.<extension>`. Stable UUID folders survive slug changes.
JPEG, PNG, WebP, AVIF, GIF, MP4, and WebM are supported, up to 50 MiB per file.
The `/media/[projectId]/[filename]` route streams through Supabase RLS, supports
video range requests, and disables shared caching. A visitor can read a file only
while a published project references it. Unsaved uploads and draft media remain
private, even when their URL is known.

Replacing/removing saved media cleans unused files after saving, preserving files
shared by duplicated projects. Abandoning an unsaved editor can leave private
orphan files; those may be cleaned manually in Storage. There is no transcoding
or media library.

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
