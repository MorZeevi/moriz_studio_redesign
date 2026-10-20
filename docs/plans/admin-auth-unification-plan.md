# Unified Admin Auth — Moriz then Eyal (v2)

Status: PLAN ONLY. Codex review APPROVED (3 rounds, 2026-10-20; see `admin-auth-unification-review-log.md`). No code changed in either repo.

Baselines:
- **Moriz:** `MorZeevi/moriz_studio_redesign` `main` @ `a20dddd`. The local checkout was fast-forwarded from `11e2a36`; it has no local changes.
- **Eyal:** `eyalfuks51/Eyal-protfolio` `v2/redesign` @ `c4d1bfb`. The local checkout equals origin; the only untracked item is `output/`.

Both sites use one Supabase project (`eqyjdwloiffotezhedxh`). Staging: Stage 1 is Moriz (Phase A, then Phase B). Stage 2 is Eyal (E0 password migration, then Phase A, then Phase B). Eyal starts only after Moriz Phase A is verified in production.

---

## 1. Current state

| | Moriz `/admin` (CMS, Mor OS) | Moriz `/digital-audit/admin` | Eyal `/admin` (Projects CMS) | Eyal `/digital-audit/admin` |
|---|---|---|---|---|
| Login | **Password** (`loginWithPassword`, commits 976347f/24bdf99). The form has a password field only; the email comes from `SUPABASE_ADMIN_EMAIL` | `?secret=` = `ADMIN_ACCESS_SECRET` | **Magic link** (`requestLoginLink` → `signInWithOtp`, PKCE callback exchanging `?code=`) | `?secret=` |
| Identity check | `requireAdmin()`: `getUser()` + `SUPABASE_ADMIN_USER_ID` (Mor) | string compare → `notFound()` | same `requireAdmin()` (Eyal `dbce8f48…`) | string compare → `notFound()` |
| APIs | server actions | 4 routes, `x-admin-secret` | server actions | same 4 routes, `x-admin-secret` |
| Proxy refresh | `/admin/:path*`, `/media/:path*` | **not covered** | `/admin/:path*`, `/media/:path*` | **not covered** |
| Logout | `signOut()`: **global** scope (signs out every device) | none | `signOut()`: global | none |
| Lead ownership | n/a | **not enforced**. Detail and mutations are keyed by `sessionId` only; the queue offers `?source=eyal\|all` | n/a | **already enforced**: `OWN_SOURCE='eyal'` on every read and write (9561a45) |
| Old callback | retired: `/admin/auth/callback` redirects to login | | live | |

Other facts that matter:
- **Moriz password login is done.** It has invalid-password and HTTP 429 (rate-limit) messages, waits for hydration, has a sign-out on wrong user, and is covered by `tests/cms/auth.spec.ts`. The plan preserves it as is.
- **`tests/cms/auth.spec.ts` logs out with the real owner password** (`CMS_TEST_ADMIN_PASSWORD`). Because `logout()` is global, running that test today signs Mor out on every device.
- **Eyal analytics already redacts** `/digital-audit/admin`, `/admin` and `/media` (`src/instrumentation-client.ts`). Keep it.
- **Eyal QA scripts send the secret.** `scripts/qa-lead-flows.mjs` and `scripts/qa-moriz-isolation.mjs` use `ADMIN_ACCESS_SECRET` / `x-admin-secret`.
- **Historical rows filter safely.** `diagnostic_sessions.source` is `NOT NULL DEFAULT 'moriz'`, so a `.eq('source','moriz')` filter includes historical rows.

Root causes of friction, now:
1. There are two credentials per site: a password or magic link for the CMS, and a URL secret for leads.
2. The secret lives in the URL: it is lost on bookmark, back or share, and it leaks to logs, history and referrer.
3. After login you always land on `/admin/projects`; the original destination is lost.
4. A missing secret on the leads side is a silent 404, not a login redirect.
5. Eyal only: the magic link needs an inbox round-trip and must be opened in the same browser.

## 2. Reconciliation with the previous plan

**Removed:**
- Magic-link `next` cookie across the email round-trip.
- Callback changes for Moriz.
- `emailRedirectTo` and redirect-allowlist concerns for Moriz.
- D3 (choice of login method): password is decided and implemented for Moriz.
- Phase B "6-digit code" and `token_hash` confirm route.
- The dev-login script that depended on the confirm route.

**Simplified:**
- `next` now goes straight through the password form: the login page sanitizes it and passes it as a prop, and the client calls `router.replace(next)` on success.

**Kept:**
- The route-agnostic guard.
- The proxy matcher fix.
- Cookie-auth CSRF controls.
- Local logout scope. This is more urgent now, because of the owner-password logout test.
- Node test-runner lazy import.
- Single cutover per repo.
- Phase C notes.

**Changed:**
- The Moriz ownership fix now mirrors Eyal's 9561a45 pattern: source predicates at the DB layer. The previous plan used a service-level `getSessionSource` check. Mirroring keeps both products symmetric.

**Added:** Stage 2 for Eyal, starting with E0, the password migration.

## 3. Owner decisions (APPROVED 2026-10-20)

- **D1, Moriz cross-source leads: approved.** Moriz-only. Source ownership is enforced server-side across all admin reads and mutations, and the Eyal/All tabs are removed.
- **D2, identities: approved.** One authorized owner identity per website: Mor on Moriz, Eyal on Eyal, via each site's `SUPABASE_ADMIN_USER_ID`. No additional roles or users.
  - Consequence: anyone who uses Moriz `?secret=` today loses Moriz lead access.
  - No `private.cms_admins` lookup (that would be an RPC, i.e. a schema change).
- **D3, Eyal password: approved.** Eyal moves to password authentication, keeping the existing Supabase Auth identity and UUID (`dbce8f48…`) and the `cms_admins` mapping.
  - The password is never stored in the repo or env.
  - **Password login and recovery must both be verified before magic link is retired** (see E0).
- **D4, test writes: approved.** Synthetic `is_test` data only. No real-lead mutations, no unintended notifications, no destructive cleanup.
- **D5, shared-project cleanup: deferred.** Shared Supabase Auth configuration (redirect URLs, email provider, OTP/magic link) is not changed in this work. Do not disable email OTP or magic link project-wide: both test harnesses mint sessions with `generateLink` + `verifyOtp`.

## 4. Target design (same shape in both repos, separate copies)

- **One identity:** the Supabase Auth cookie session (`path: "/"`, already sent to `/digital-audit`). One login (`/admin/login`, password), one logout.
- **`src/lib/auth/admin.ts`** (server-only, route-agnostic; not under `lib/cms` or `diagnostic/`):
  - `getAdminUser()`: `getUser()` + `SUPABASE_ADMIN_USER_ID`. It fails closed if that is unset.
  - `requireAdminPage(next)`: redirects to `/admin/login?next=…`.
  - `isAdminRequest(request)`: a boolean combining the user check, a same-origin `Origin` check, and `application/json` for body routes. Routes keep returning their existing 404 JSON.
  - **Additive.** `src/lib/cms/auth.ts` `requireAdmin()` and the CMS login flow are **not rewritten in Phase A** (CMS invariant, §4a). The new guard implements the same check (`getUser()` + `SUPABASE_ADMIN_USER_ID`, fail-closed); a unit test asserts the two agree. Switching `requireAdmin()` to delegate is optional Phase B cleanup and needs the full CMS gate.
- **`src/lib/auth/next-path.ts`** (pure, node-testable): `safeAdminNext()` allows only `/admin…` and `/digital-audit/admin…`. It rejects `//`, `\`, schemes and control characters.
- **Proxy:**
  - Add `/digital-audit/admin/:path*` and `/digital-audit/api/admin/:path*` to the matcher. The public funnel is untouched.
  - When no claims are present, redirect only an **explicit list** of protected pages. In Phase A that list is `/digital-audit/admin/**` only; CMS redirects stay exactly as today. Adding `/admin/**` (excluding `/admin/login` and `/admin/auth/**`) is Phase B (M-B1).
  - **Never redirect** `/media/*` (it serves published images to anonymous visitors), `/`, or any `/api` path.
  - Always **overwrite** the `x-admin-path` request header, so `(private)/layout.tsx` can build `next` and a client cannot spoof the header.
  - The same rules apply to Eyal's proxy.
- **Lead ownership (Moriz):** `OWN_SOURCE='moriz'` in `src/diagnostic/diagnosticSource.ts`, used as the source predicate on admin reads and mutations, plus `assertOwnedSession` / `SessionNotOwnedError` for child rows. The insert path still relies on the DB default; never send `source` on insert (existing contract).
- **Rejected alternatives:**
  - Secret in an httpOnly cookie: still a second credential.
  - New auth provider: new dependency.
  - Proxy-only checks: Next docs call the proxy an optimistic check only.
  - `getClaims` for authoritative checks: it ignores logout until the JWT expires.
  - Roles via `cms_admins`: needs a schema change.
  - Shared npm package between repos: the products must stay separate.
  - Moving routes now: that is Phase C.

---

## 5. Stage 1 — Moriz

### 4a. CMS stability invariant (blocking gate at every checkpoint)

**Protected surfaces:** `/admin/login`, `/admin/projects/**`, `/admin/categories`, `/admin/os`. They must stay usable after every slice: projects, editing, publishing and navigation. This is not only a final acceptance check.

**Rules:**
- Work only on a feature branch; never commit to `main`.
- Make no change to production data or live Supabase Auth configuration.
- Do not rewrite CMS auth. Add shared infrastructure additively, extend it to Diagnostic Admin, and switch CMS consumers last (or not at all in Phase A).
- Diagnostic Admin may be non-functional on the branch mid-migration. The CMS may not.
- On any CMS regression: stop, then repair or revert before the next slice.

**CMS gate.** Run it after every slice that touches the shared auth guard, `src/proxy.ts`, sessions/cookies, login or logout. It has three parts:
1. Typecheck + `npm run build`.
2. `npm run test:cms`, with `CMS_TEST_ADMIN_PASSWORD` **unset**.
   - `test:cms` already covers the following:
     - The password screen and wrong-password rejection (`auth.spec.ts`).
     - Retired callback.
     - Private-route redirects.
     - The full editor/publish flow, ownership/RLS, card options and gallery rows, using minted test sessions.
   - It uses its own namespaced test rows and test users; cleanup is limited to that namespace.
3. A manual smoke check on the dev server with a minted owner session:
   - Open `/admin/projects`, `/admin/categories` and `/admin/os`.
   - Open a project editor without saving.
   - Navigate between them.

**Owner-session safety:**
- The only test that logs out with the real owner credentials is the opt-in `auth.spec.ts` "owner password" case (`CMS_TEST_ADMIN_PASSWORD`). It stays skipped until M-A2 has landed and a static unit test proves `logout()` calls `signOut({ scope: "local" })`. Today's global-scope logout would revoke Mor's live sessions.
- Never call `signOut()` without `scope: "local"` in tests or scripts.

### Phase A (feature branch; ordered checkpoints; one PR; one cutover deploy)

**M-A0, baseline.** On a new branch, run the CMS gate and record the result as the baseline. Any later failure is measured against it.

**M-A1, guard and sanitizer (additive; no consumer switched).**
- New: `src/lib/auth/admin.ts`, `src/lib/auth/next-path.ts` and their tests.
- `src/lib/cms/auth.ts` is **unchanged**.
- CMS gate: build plus `test:cms`. Nothing imports the new files yet, so the CMS is unaffected by construction.

**M-A2, logout scope (the only Phase A change to CMS behavior; a deliberate fix).**
- `src/app/admin/actions.ts`: `logout()` → `signOut({ scope: "local" })`.
- Add a static unit test asserting the scope **before** any e2e logout.
- CMS gate. Verify logout using a **minted** session (never the real owner password): logout lands on `/admin/login`, and the minted session can no longer open `/admin/projects`.

**M-A3, proxy (additive).**
- `src/proxy.ts`: add `/digital-audit/admin/:path*` and `/digital-audit/api/admin/:path*` to the matcher.
- Add an optimistic redirect for `/digital-audit/admin/**` pages only.
- Always overwrite `x-admin-path`.
- `/admin/**`, `/media/*` and `/` behavior is unchanged: same refresh and no new redirects.
- CMS gate. Specifically check that the existing `auth.spec.ts` assertions (`/\/admin\/login$/`) still pass unchanged. That proves CMS redirects did not change.

**M-A4, login `next` (additive).**
- `src/app/admin/login/page.tsx`: read and sanitize `?next=`; if already admin, redirect to it; pass it to the form.
- `src/components/admin/login-form.tsx`: `router.replace(next ?? "/admin/projects")`.
- With no `next`, behavior is byte-for-byte today's.
- Not touched: `loginWithPassword`, `auth/callback/route.ts`, `(private)/layout.tsx`.
- CMS gate, plus a unit test showing that a hostile `next` falls back to `/admin/projects`.

**M-A5, lead APIs (authorization).** Diagnostic-only; no CMS file touched.
- The four `src/app/digital-audit/api/admin/*/route.ts` routes take an injected `isAuthorized(request)`.
  - `lead-brief` and `lead-status` get the DI factory shape the other two already have.
  - The default dep **lazy-imports** `@/lib/auth/admin` inside the function. `test:diagnostic` loads route files under plain node, where `@/` and `server-only` do not resolve.
- Remove `isAdminSecretValid` from `leadBriefService.ts`, `leadStatusService.ts` and `sessionClassificationService.ts`.

**M-A6, lead ownership (D1).** Diagnostic-only. From Eyal's 9561a45, port **only the source filtering**: the `source` predicates and `assertOwnedSession`, with `moriz` values. Do **not** copy its `entry_path` / direct-contact conditions (for example the classification update's `.or('completed_at…,entry_path.eq.direct')`). Moriz does not have that migration, and copying them would change Moriz's behavior. Files:
- `src/diagnostic/diagnosticSource.ts`: add `OWN_SOURCE`.
- `src/diagnostic/db/queries.ts`: queue, lead-by-session, answers, snapshot and brief reads.
- `src/diagnostic/db/mutations.ts`: status, classification, brief upsert/approve.
- `src/diagnostic/leadQueueView.ts`: drop `source` and `secret`.
- Foreign session → `session_not_found` → 404.

**M-A7, pages and clients.** Diagnostic-only.
- `src/app/digital-audit/admin/page.tsx` and `leads/[sessionId]/page.tsx`: `requireAdminPage(next)`; drop `secret`; drop the source tabs.
- Remove the `secret` prop from `StatusControl`, `LeadBriefPanel`, `TestClassificationControl` and `StartTestSessionControl`.
- `src/diagnostic/testSessionClient.ts`: no secret header; same-origin `fetch` sends cookies.

**M-A8, cleanup.**
- Remove `ADMIN_ACCESS_SECRET` from code and `.env.example`.
- Update `AGENTS.md` lines 18–19, `docs/digital-audit.md` (routes, env, testing) and `docs/cms.md` (logout scope, `next`).
- `leadNotifier.ts`: change the text to the `/digital-audit/admin/leads/<id>` URL.

M-A5 to M-A7 ship together: there is no window where both the secret and the session are accepted. On the branch, Diagnostic Admin may be broken between them. M-A8 then runs the final CMS gate plus the diagnostic unit and e2e checks.

### Phase B (after Phase A is verified in production)

**M-B1, login states and CMS `next`.**
- Extend the proxy's optimistic-redirect list to `/admin/**` (excluding `/admin/login` and `/admin/auth/**`), and pass `next` from `x-admin-path` in `(private)/layout.tsx`.
- Update the anchored `/\/admin\/login$/` assertions in `tests/cms/auth.spec.ts` to assert login **plus** the expected `next`. Do not loosen them.
- CMS gate.
- An expired-session notice (`?reason=expired`, set by the proxy when an auth cookie existed but is invalid).
- A "return to …" hint.
- Invalid-password, 429, loading and hydration states already exist; keep them.

**M-B2, navigation.**
- A "לידים" link in the CMS header (plain `<a>`, since it crosses root layouts).
- "ניהול אתר" plus a logout form in the lead-admin header. Copy-level only; no redesign.

**M-B3, test sessions.**
- Extract the session minting in `tests/cms/setup.ts` into `tests/support/admin-session.ts`. It writes a Playwright `storageState` to `.cache/admin-auth.json` (gitignored, mode 0600).
- Reused by the CMS specs and a new `tests/diagnostic-admin/` spec.
- The owner-password test stays opt-in (`CMS_TEST_ADMIN_PASSWORD`) and is safe after M-A2.

**M-B4, dev friction.** Document that the dev session persists through the proxy refresh. No bypass is added.

Both sites use the same Supabase project, so they use the same default auth cookie name (`sb-eqyjdwloiffotezhedxh-auth-token`; confirm during implementation). Cookies are scoped by host, not port. Running both repos on `127.0.0.1` therefore makes Mor's and Eyal's local sessions overwrite each other.

Document one host per repo: Moriz on `127.0.0.1` (already its `dev` script), Eyal on `localhost`. Playwright contexts are isolated, so this only affects manual development.

---

## 6. Stage 2 — Eyal (`v2/redesign`)

**E0, magic link to password.** Port Moriz 976347f + 24bdf99. Ships alone, before E-A, so the leads unification lands on the final login.
0. **First, before any password-login or logout verification:** change Eyal's `logout()` (end of `src/app/admin/actions.ts`) to `signOut({ scope: "local" })`, and add the static scope assertion. Eyal's current callback also calls a global `signOut()` when a code exchange fails (`src/app/admin/auth/callback/route.ts:14`). **Never** open that live callback with an authenticated owner context before E0 retires it.
1. Owner action (D3): set a password on Eyal's Auth user in the Supabase dashboard.
2. `src/app/admin/actions.ts`: replace `requestLoginLink` with `loginWithPassword`. Keep the owner-id check and `signOut({scope:"local"})` on a wrong user.
3. `src/app/admin/auth/callback/route.ts`: retire it (redirect to `/admin/login`, no code exchange).
4. `src/app/admin/login/page.tsx` and `src/components/admin/login-form.tsx`: password field, hydration gate, error and 429 states.
5. `.env.example` and `docs/projects-cms.md`:
   - Mark `SUPABASE_AUTH_REDIRECT_URL` as legacy.
   - Update the "Magic-link login" text.
   - Update `docs/PRELAUNCH_CHECKLIST.md` line 80, since the callback allowlist is no longer needed.
6. Add `tests/projects/auth.spec.ts` (port of `tests/cms/auth.spec.ts`). Its owner-password logout case stays opt-in and skipped until step 0 has landed.
   - **Also update the existing login preamble** in `tests/projects/projects.spec.ts` (~lines 347–356). It fills the email field and clicks the magic-link button; change it to a wrong-password rejection, as Moriz did in 976347f. Otherwise the Eyal CMS gate breaks at E0.
7. **Recovery path (D3).** The app has no reset-password flow. Supabase's recovery email would need a callback, which reintroduces redirect handling. Recovery is therefore an owner-only runbook: set a new password on the same UUID through the Auth admin API (`updateUserById`) from a local script. The script uses the Supabase-CLI-derived service role, the same pattern as `tests/cms/setup.ts`; nothing is added to the app. Document it in both repos (`docs/cms.md`, `docs/projects-cms.md`).
8. **Retire-gate order:**
   1. Set the password.
   2. Verify password login on the E0 build, locally or on a preview, while production still runs magic link.
   3. Verify recovery: set a temporary password, log in, set the final password, log in.
   4. Only then deploy E0, which retires the callback.
9. Rollback: revert. Eyal's magic link keeps working because the Supabase email provider config is unchanged (D5).

**E-A0…E-A8, Phase A.** Same slices and the same additive ordering as M-A0…M-A8. The §4a invariant applies to Eyal's `/admin` CMS too, using `npm run test:projects` as its CMS gate. Caveat: `tests/projects/setup.ts` refuses to run once Eyal has any projects or terms, because the editor flow rewrites ordering. Keep that guard. If content exists, the Eyal CMS gate becomes an **auth-only run** plus the read-only manual smoke check from §4a. `playwright.projects.config.ts` always registers that setup as `globalSetup`, so selecting `auth.spec.ts` alone does not bypass it. E0 therefore adds `playwright.projects-auth.config.ts`, with the same `webServer`/`baseURL` but no `globalSetup` and `testMatch: "auth.spec.ts"`, and a script `npm run test:projects:auth`. That command is the named fallback gate for E0 and E-A. Differences:
- **No ownership code slice.** Ownership is already pinned (9561a45). That commit's tests check query shape, and it adds a scratch-DB script. Verify route-level foreign-session negative tests (detail page and the 4 APIs) and add any that are missing.
- `tests/projects/auth.spec.ts` (ported in E0) gets the same `?next=` assertion update in E-B (as M-B1).
- Paths differ: the public site is in the `src/app/(site)/` group. `src/lib/cms/routes.ts` holds **public** site paths only; admin redirect targets are hardcoded in `src/lib/cms/auth.ts`, `src/app/admin/login/page.tsx` and the callback, as in Moriz.
- QA scripts:
  - `scripts/qa-lead-flows.mjs` and `scripts/qa-moriz-isolation.mjs` must authenticate with a minted session cookie (the `tests/projects/setup.ts` pattern) instead of `x-admin-secret`.
  - Both are **local/scratch-DB only** in this work. Never set `A4_ALLOW_LIVE=1`. `qa-lead-flows.mjs` submits production-classified direct contacts (which can send notification email) and deletes its rows, so it violates D4 against the live project.
- Keep the `instrumentation-client.ts` redaction. Update its comment, since URLs no longer carry a secret.
- Update `AGENTS.md` (diagnostic section), `.env.example` and the docs to drop `ADMIN_ACCESS_SECRET`.
- Rotate or delete Eyal's `ADMIN_ACCESS_SECRET` in Vercel after verification.

**E-B, Phase B.** Same as M-B1 to M-B3 against Eyal's harness (`tests/projects/setup.ts`, `playwright.projects.config.ts`).

---

## 7. Security risks and mitigations

| Risk | Mitigation |
|---|---|
| CSRF on the 4 lead APIs once auth is cookie-based (the custom header used to force a preflight; routes parse `request.text()`) | Lax cookies + `Origin` check + `application/json` required; server actions are origin-checked by Next |
| Open redirect via `next` | allowlist sanitizer at the login page, the form and `requireAdminPage`; tests |
| Cross-source read/write (Moriz) | DB-layer `OWN_SOURCE` predicates + owned-session guard; 404 |
| Refresh-token reuse on `/digital-audit` | proxy matcher |
| Logout must revoke; tests must not sign Mor out everywhere | `getUser()` on authoritative checks; `scope: "local"` |
| Password brute force (password-only form; attempts reach Supabase from Vercel egress IPs, so its per-IP limit is coarse) | strong unique passwords; Supabase rate limit (429 already handled); leaked-password protection on if available. Residual risk is accepted; no new infrastructure |
| Misconfigured env | fail closed when `SUPABASE_ADMIN_USER_ID` or `SUPABASE_ADMIN_EMAIL` is unset (existing behavior; keep the tests) |
| Existence disclosure | pages redirect to the already-public `/admin/login`; APIs keep 404 |
| Burned secrets | delete `ADMIN_ACCESS_SECRET` in both Vercel projects after each stage is verified |

## 8. Required tests (per repo)

**Unit (`test:diagnostic` for Moriz, `test:digital-audit` for Eyal):**
- Guard: no user, wrong user, env unset, owner.
- Each of the 4 routes: unauthenticated → 404; cross-origin → 404; non-JSON → rejected; foreign session → 404 with no write; owned → OK.
- Existing secret-negative tests are converted, not deleted.
- `leadQueueView` hrefs carry no `secret` (Moriz: no `source` either).
- `testSessionClient` sends no header.
- `next-path` sanitizer cases.
- A regression test that fails if `x-admin-secret` or `ADMIN_ACCESS_SECRET` reappears in `src/`.
- Moriz only: query/mutation tests asserting the `moriz` predicate, mirroring Eyal's `queries.test.ts`.

**E2E (Playwright, `storageState`, live project, reads plus `is_test` only):**
- Signed out: both surfaces redirect with `next`; API POST → 404.
- Password login → lands on `next`.
- Owner: CMS → leads → lead detail with no second login; reload; back.
- Outsider session: denied on both surfaces.
- Logout: denied on both surfaces.
- Foreign-source lead id: detail 404; `lead-status` 404.
- One mutation happy path on an `is_test` session (D4), local dev server only.

**D4 operating rules (both repos):**
- `notifyNewLead` checks only `LEAD_NOTIFY_ENABLED`; it does **not** skip test leads. Every verification server that can receive a contact submission must therefore start with `LEAD_NOTIFY_ENABLED=false` (process env override). Assert this at runtime before submitting.
- Permitted live-project operations:
  1. Reads.
  2. Admin test-session creation (`is_test=true`, no contact row, no email).
  3. Contact submission, status change, classification `mark_test` only, and brief `save` on that **same** `is_test` session, local dev server only, notifications off. `restore_real` (which sets `is_test=false`) is tested only in unit tests or against a scratch DB, never on the live project.
- Never use brief `generate` (it spends AI tokens), and never touch a non-`is_test` lead.
- On production deployments (where notifications are on), verification is read-only plus admin test-session creation. No contact submissions.
- No deletes. `is_test` rows stay in place; they are excluded from production views.
- Never set `A4_ALLOW_LIVE=1` (Eyal).

**Gates:** unit, CMS/projects Playwright, lint, typecheck, build.

**Test discovery.** `test:diagnostic` (Moriz) and `test:digital-audit` (Eyal) only glob `src/diagnostic/**` and `src/diagnostic-core/**`. New tests under `src/lib/auth/**` (guard, sanitizer, guard/`requireAdmin` equivalence, logout-scope assertion) need an explicit runner: add an `src/lib/auth/**/*.test.ts` glob to each repo's unit command, and add it to the CMS gate.

**Public-funnel regression (Moriz).** M-A6 adds source predicates to helpers that the public funnel also uses (answers, snapshot, lead-by-session). Run `test:diagnostic` plus one local funnel pass (answer → result → contact on a test session, with notifications forced off, see D4 rules) to prove Moriz-owned sessions still work.

**Implementation acceptance requirements (Codex review, deferred P2; both repos).**
- Proxy: every rebuilt `NextResponse.next()` forwards the overwritten `x-admin-path` request header, and every redirect carries the refreshed auth cookies. Test an expired access token with a valid refresh token on both CMS and lead-admin paths.
- Redirect contract: exact path boundaries (`/admin` or `/admin/…`; `/digital-audit/admin` or `/digital-audit/admin/…`; never `/adminx`), validation after normalization, `/admin/login` and `/admin/auth/**` excluded as destinations, and no login loops.
- CSRF contract on the 4 lead APIs:
  - exact comparison of `Origin` against the deployment's own origin (no trust in `X-Forwarded-*` host headers);
  - a missing or `null` `Origin` is rejected;
  - for body routes, a parsed `Content-Type` media type equal to `application/json`.

## 9. Rollout and rollback

**Moriz:**
- Branch `feat/admin-auth-unification`; one PR.
- Verify locally, then in production right after merge. The password flow needs no redirect allowlist, so a Vercel preview also works if its env has the Supabase vars.
- Tell Mor that `?secret=` bookmarks stop working.
- Keep `ADMIN_ACCESS_SECRET` in Vercel until production is verified, so a Vercel instant rollback or `git revert` works.
- Delete it after about a week clean. There is no schema change, so there is no data rollback.

**Eyal:**
- E0 is its own PR and deploy; verify it.
- Then the E-A PR, with the same rollback rule. Then E-B.

**Shared project:**
- Only D5 cleanup, at the end, and optional.
- No migrations, RLS or RPC changes in either stage.

## 10. Phase C (future; documentation only, both repos)

Coupling:
- **CSS.** The lead-admin CSS modules depend on tokens (`--surface`, `--primary`, `--primary-ink`, `--radius-md`, `--focus-ring-width`…) defined in `diagnostic.css` under `html[data-diagnostic-app]`, in a separate root layout.
- **Paths.** `leadQueueView`, `shouldRefreshAdminQueue`, the `AdminQueueRefresh` `pageshow` handler and the `lead-status` `revalidatePath` hardcode `/admin`, which collides with the CMS `/admin`.
- **Tailwind.** `@source not` paths in `admin.css` / `globals.css`.
- **Eyal only.** CMS tokens are scoped to `.cmsScope`.

Smallest path:
1. Add a `LEADS_ADMIN_BASE` constant, still `/digital-audit/admin`.
2. Move the lead-admin tokens onto a shell class.
3. Move the pages to `src/app/admin/(private)/leads/` and set the constant to `/admin/leads`. Add 308 redirects from `/digital-audit/admin/:path*`. The APIs stay in place.
4. Add a "לידים" tab in the CMS header.

Auth needs no change if Phase A keeps the guard out of the `digital-audit` folder and free of `/digital-audit` and `CMS_SOURCE`.

## 11. Out-of-scope findings (flag only)

- **Public diagnostic endpoints.** A related hardening item outside this plan's scope was found during review (Codex r1: separate issue, not a release blocker). Its details are tracked privately, outside this public repository.
  - Phase A must **not** be described as full application-wide source isolation. It isolates the admin surfaces only.
- **Migration drift.** `20261010150000_diagnostic_session_entry_path.sql` exists in Eyal's `supabase/migrations/` but not in Moriz's, while the shared contract requires byte-identical copies.
