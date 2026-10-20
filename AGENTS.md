<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Moriz Diagnostic (`/digital-audit`)

The Moriz Diagnostic (a lead-magnet questionnaire with AI personalization and an admin lead queue) lives in this repo under the public route `/digital-audit`. It was transplanted unchanged from the standalone app `Moriz_studio/moriz-diagnostic` (commit `b96a88d`), which stays the behavioral reference for questions, scoring, result copy, AI behavior and analytics. Overview, route map and env: [docs/digital-audit.md](docs/digital-audit.md).

- Code: routes in `src/app/digital-audit/**` (its own root layout, noindex), logic in `src/diagnostic/` and `src/diagnostic-core/`, assets in `public/digital-audit/`, ops scripts in `tools/diagnostic/`. Run its tests with `npm run test:diagnostic`.
- The product is separate from the rest of the site and from Eyal Diagnostic. Changing its questions, scoring, copy or UI is an owner decision, not a drive-by edit.
- There is no Next `basePath`: `/digital-audit` is a real route folder, so every `<Link>`, `router.push`, `<a href>`, `fetch`, `window.location` and `revalidatePath` target must go through `withBasePath()` (`src/diagnostic/basePath.ts`).
- Secrets are server-only and must never become `NEXT_PUBLIC_*`: `SUPABASE_SERVICE_ROLE_KEY`, `MOONSHOT_API_KEY`, `RESEND_API_KEY`. The browser never touches Supabase; all DB access goes through the `/digital-audit/api/**` routes. The diagnostic uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, separate from the CMS keys. `MOONSHOT_*` and `AI_PROVIDER` are shared with the site's FAQ assistant (`src/lib/ai`), so `MOONSHOT_MODEL` must name a model Moonshot currently serves.
- `/digital-audit/admin` and `/digital-audit/api/admin/*` are guarded by the same owner login as the CMS (Supabase session, `SUPABASE_ADMIN_USER_ID`, via `src/lib/auth/admin.ts`); there is no URL secret. The admin API routes also require a same-origin `Origin` and an `application/json` body. Admin reads and mutations are pinned to `OWN_SOURCE` (`'moriz'`, `src/diagnostic/diagnosticSource.ts`). Do not add analytics, session replay, or any tool that captures URLs or query strings to this site without redacting `/digital-audit/admin` and `/admin` first.
- The diagnostic's global CSS is scoped to `html[data-diagnostic-app]`, and `src/app/globals.css` tells Tailwind not to scan the diagnostic folders. Keep both, or diagnostic styles will leak into the site.
- This repo's `supabase/migrations/` is a mixed ledger (diagnostic and CMS). Never run `supabase db push`, repair, or revert; see [docs/cms.md](docs/cms.md).

<!-- shared-backend-contract:start — keep byte-identical across Eyal-protfolio/AGENTS.md and moriz-diagnostic/CLAUDE.md + AGENTS.md -->
## Diagnostic shared backend contract

**Two products, one backend.** Eyal Diagnostic (`Eyal-protfolio`, `/digital-audit`) and Moriz Diagnostic (`Moriz_studio/moriz-diagnostic`) are separate products. Each may change its questions, scoring, result taxonomy, copy, UI/UX, AI prompts, and product behavior independently. Those are product-local changes and need no check against the other product. Do not merge the two into one shared product or codebase.

Both apps use one Supabase project (`eqyjdwloiffotezhedxh`) and its `diagnostic_*` tables. Any change to that shared layer is a **cross-product change**: check it against both products' code before rollout. Shared-contract changes include:

- schema changes (tables, columns, types)
- required columns and constraints
- RLS policies, grants, and permissions
- shared views, functions, and RPCs
- assumptions about stored record shape (for example `result_snapshot`, stored answer ids, enum/check values)

**Session ownership (`diagnostic_sessions.source`).**

- Every diagnostic session/lead has explicit ownership: `source='eyal'` or `source='moriz'`.
- The Eyal app writes `source='eyal'`. The Moriz app writes `source='moriz'`.
- Historical diagnostic records (created before the column existed) resolve as `'moriz'`.
- `source` is never client-controlled. Never derive it from a request body, query string, UTM, or referrer.
- `is_test` is independent of `source`. A test session keeps its app's source.
- Each app's admin UI may evolve independently.

**Supabase migrations: neither Diagnostic repo owns the full history.** The shared project is also used by other apps. Its remote migration ledger contains unrelated (e.g. CMS) versions that exist in neither Diagnostic repo. Each repo's `supabase/migrations/` holds diagnostic migrations only.

- Before any shared-backend change, inspect the live schema and the remote migration ledger (`supabase migration list --linked`).
- Foreign versions in the ledger are a coordination issue, not corruption.
- Never repair, revert, reclassify, or delete another app's migration versions to make a local `db push` succeed. Touch another app's migrations only with explicit owner scope.
- If `db push` refuses because of foreign versions, apply the diagnostic migration through another explicitly approved path, then record only that diagnostic version as applied (`supabase migration repair --status applied <diagnostic_version>`).
- A shared diagnostic migration lands byte-identical (same filename and content) in both repos' `supabase/migrations/`.
<!-- shared-backend-contract:end -->

## Projects shared backend contract

The Projects CMS tables (`projects`, `categories`, `project_categories`) and the media buckets are shared with a future Eyal Projects site on the same Supabase project. Every row has `source = 'moriz' | 'eyal'`, decided by the database from the signed-in user (`private.cms_admins`, `private.cms_source()`), never from a request. This site is `moriz`: it scopes queries with `CMS_SOURCE` and uses bucket `project-media` (`src/lib/cms/source.ts`). Any change to the schema, RLS, RPCs or buckets here is a cross-product change; see [docs/cms.md](docs/cms.md#ownership-of-projects). Do not set `source` from client input.
