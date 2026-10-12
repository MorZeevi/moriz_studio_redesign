# Moriz Diagnostic at `/digital-audit`

The existing Moriz Diagnostic runs inside this site, unchanged. It is a Hebrew, RTL lead-magnet questionnaire: seven questions, a deterministic result that never needs AI, optional AI personalization, optional human-review contact capture, and an admin lead queue. The standalone app `Moriz_studio/moriz-diagnostic` (commit `b96a88d`) remains the behavioral reference.

Status: faithful transplant only (milestone 1). The visual redesign planned in [06-diagnostic-questionnaire.md](06-diagnostic-questionnaire.md) comes later and is a separate decision.

## Routes

| Route | Purpose |
| --- | --- |
| `/digital-audit` | Landing and questionnaire |
| `/digital-audit/result` | Deterministic result, AI note, contact form |
| `/digital-audit/admin`, `/digital-audit/admin/leads/[sessionId]` | Lead queue and detail (`?secret=`, temporary guard) |
| `/digital-audit/api/diagnostic/*`, `/digital-audit/api/admin/*` | Server routes; the only path to Supabase |

Files: routes in `src/app/digital-audit/`, logic in `src/diagnostic/` (UI in `components/`, AI in `ai/`, DB in `db/`) and `src/diagnostic-core/` (questions, scoring, result templates), assets in `public/digital-audit/`, ops scripts in `tools/diagnostic/`.

## Differences from the standalone app

The standalone app used `basePath: '/digital-audit'`. The website cannot, so these changed and nothing else did:

- `/digital-audit` is a route folder with its own root layout, like `/admin` and `/[locale]`. Public URLs are identical.
- Next no longer adds the prefix, so `router.push`, `<Link>`, `revalidatePath` and `usePathname()` handling in `AdminQueueRefresh` go through `withBasePath()` / `stripBasePath()` (`src/diagnostic/basePath.ts`).
- The global stylesheet became `src/app/digital-audit/diagnostic.css`, scoped to `html[data-diagnostic-app]` with `:where()` so specificity is unchanged. `src/app/globals.css` has `@source not` lines so Tailwind does not scan the diagnostic and emit utilities into the site.
- Static files moved from `public/` to `public/digital-audit/`. Imports use the site's `@/` alias (`@/diagnostic/...`).
- Tooling: `allowImportingTsExtensions` in `tsconfig.json`, the `test:diagnostic` and `diagnostic:analytics-readback` scripts, Biome (replacing ESLint) with targeted `biome-ignore` comments and a test-file override in `biome.json`.

## Environment

Names only; values live in `.env.local` / Vercel and are never committed. All are server-only.

- Required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_ACCESS_SECRET`.
- AI personalization (default off): `AI_PERSONALIZATION_ENABLED`, `AI_PROVIDER`, `AI_TIMEOUT_MS`, `AI_MAX_TOKENS`. AI lead brief (default off): `LEAD_BRIEF_AI_ENABLED`, `LEAD_BRIEF_TIMEOUT_MS`, `LEAD_BRIEF_MAX_TOKENS`.
- Moonshot, shared with the FAQ assistant: `MOONSHOT_API_KEY`, `MOONSHOT_BASE_URL`, `MOONSHOT_MODEL`. The code default `kimi-k2-0711-preview` is stale; always set `MOONSHOT_MODEL` explicitly to a model the account can use.
- Lead email (default off): `LEAD_NOTIFY_ENABLED`, `RESEND_API_KEY`, `LEAD_NOTIFY_TO_EMAIL`, `LEAD_NOTIFY_FROM_EMAIL`.

## Shared Supabase

Sessions get `source='moriz'` from the column default; the insert path never sends `source`. `is_test` is independent of `source`. The admin queue defaults to `source=moriz`. The shared-backend contract is in [AGENTS.md](../AGENTS.md). This milestone made no schema change.

## Testing

`npm run test:diagnostic` runs the 439 unit tests with no network. To exercise the live flow, sign in at `/digital-audit/admin?secret=...` and use "התחלת בדיקת ניסיון" so the session is stored with `is_test=true`; do not use the public start button against production data.
