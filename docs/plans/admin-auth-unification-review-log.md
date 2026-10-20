# Plan Review Log: Unified Admin Auth (Moriz + Eyal)

Started 2026-10-20. MAX_ROUNDS=5. Reviewer: Codex CLI 0.162.1, account-default model.

Review target: `docs/plans/admin-auth-unification-plan.md`, checked against the real code at:
- Moriz `main` @ a20dddd
- Eyal-protfolio `v2/redesign` @ c4d1bfb

**How the review ran.** Codex's `read-only` and `workspace-write` sandboxes both reject every shell call on this Windows machine ("blocked by policy"), so in those modes Codex cannot read code. The review therefore ran in `danger-full-access`, confined (`-C`) to a throwaway `git archive` snapshot of both repos:
- No `.env` files were present in the snapshot.
- The prompt prohibited writes, network access and env-file reads.
- After each round, a `git status` on the snapshot verifies that no files were modified.

## Round 1 — Codex (thread 01a157d5-5029-7d42-b2e0-88efbcb3e13b, snapshot unchanged: 0 files)


Findings:

- **[P1] E0 breaks the existing Eyal CMS gate.**  
  **Evidence:** `eyal/tests/projects/projects.spec.ts:347–356` fills the email field, clicks the magic-link button, and expects the owner-email rejection. E0 removes those controls but only specifies adding `auth.spec.ts`.  
  **Impact:** `test:projects` fails after E0, violating the checkpoint invariant.  
  **Plan fix:** Update the existing editor test’s login preamble in E0, alongside adding the password tests.

- **[P1] E0 introduces the real-owner logout test before fixing Eyal’s global logout.**  
  **Evidence:** `eyal/src/app/admin/actions.ts:372` is not the applicable location; the actual `logout()` at the end of that file calls bare `signOut()`. The test being ported calls logout with real credentials at `moriz/tests/cms/auth.spec.ts:35–45`; Moriz’s scope fix is explicitly deferred to A2.  
  **Impact:** Running the ported opt-in test during E0 can revoke Eyal’s sessions across devices.  
  **Plan fix:** Include local logout and its static scope assertion in E0, before any password-login/logout verification.

- **[P1] “Synthetic `is_test` data” does not prevent real notification sends.**  
  **Evidence:** `moriz/src/diagnostic/notify/leadNotifier.ts:26–27` and `eyal/src/diagnostic/notify/leadNotifier.ts:40–41` check only `LEAD_NOTIFY_ENABLED`; neither excludes test leads. `eyal/scripts/qa-lead-flows.mjs:22` permits live execution, submits ordinary direct contacts at lines 69–76, and deletes its rows at lines 151–154.  
  **Impact:** Merely replacing the script’s secret authentication leaves production-classified writes, real emails, and destructive cleanup enabled, contrary to D4. Even test-marked contact submissions can email the owner.  
  **Plan fix:** Make this script scratch-only for this work; require notification-disabled verification deployments and explicitly enumerate permitted live fixture operations.

- **[P2] Eyal’s CMS gate has an undocumented empty-database prerequisite.**  
  **Evidence:** `eyal/tests/projects/setup.ts:177–183` refuses execution when Eyal projects or terms already exist because the editor flow rewrites ordering.  
  **Impact:** The proposed repeated production-backed gate may become unusable; removing the guard would risk real content.  
  **Plan fix:** Specify a scratch database for the full Eyal CMS suite and retain the empty-content guard.

- **[P2] New guard tests are outside the specified unit-test discovery.**  
  **Evidence:** `moriz/package.json:12` limits `test:diagnostic` to `src/diagnostic/**/*.test.ts` and `src/diagnostic-core/**/*.test.ts`; M-A1 puts new modules and tests under `src/lib/auth`.  
  **Impact:** The advertised gate can pass without running sanitizer, guard-equivalence, or logout-scope tests.  
  **Plan fix:** Explicitly extend each repository’s test command to discover the new auth tests.

- **[P2] Proxy response rebuilding needs an explicit preservation rule.**  
  **Evidence:** `moriz/src/proxy.ts:16–20` and `eyal/src/proxy.ts:17–21` rebuild `NextResponse.next()` during refresh. Render-time cookie writes are swallowed at `moriz/src/lib/supabase/server.ts:14–19`.  
  **Impact:** Adding headers or redirects incorrectly can discard the overwritten request header or refreshed cookies, causing lost destinations or repeated login.  
  **Plan fix:** Require sanitized request-header forwarding on every response reconstruction and refreshed-cookie propagation onto redirects; test an expired access token with a valid refresh token.

- **[P2] Tighten the redirect and CSRF contracts before implementation.**  
  **Evidence:** Login navigation currently uses `router.replace()` at `moriz/src/components/admin/login-form.tsx:23`; admin JSON parsing currently accepts arbitrary content types at `moriz/src/app/digital-audit/api/admin/session-classification/route.ts:30–32`.  
  **Impact:** “`/admin…`” is ambiguous about path boundaries, normalization and login loops; “same-origin” leaves missing/null origins and forwarded-header trust unspecified.  
  **Plan fix:** Define exact route boundaries, normalized-path validation, login/callback exclusions, exact trusted-origin comparison, rejection of missing/null origins, and parsed JSON media-type checks.

- **[P2] Two factual claims need correction.**  
  **Evidence:** `eyal/src/lib/cms/routes.ts:5–8` defines public-site paths, not admin route constants. `eyal/src/app/admin/auth/callback/route.ts:14` also calls global `signOut()` after an unsuccessful code exchange/identity check.  
  **Impact:** The plan directs inspection to the wrong constants and omits an existing session-revocation path when considering verification safety.  
  **Plan fix:** Correct the routes description and explicitly prohibit probing Eyal’s live callback with an authenticated owner context before retirement.

**Question 4: SEPARATE ISSUE.**

Codex's detailed finding on the public diagnostic endpoints is kept out of this public repository and tracked privately. It is not a blocker for this plan. Phase A must not be described as application-wide source isolation. M-A6 modifies helpers shared with public routes, so its public behavior changes need regression coverage.

Verified correct:

- Moriz already has password-only login, hydration gating, 429 handling, and local wrong-user sign-out.
- Both CMS guards use `getUser()` and fail closed on missing owner UUID.
- Both proxy matchers currently omit Diagnostic Admin.
- Both logout actions currently use bare `signOut()`.
- Moriz’s owner-password logout test is opt-in.
- M-A6 covers every existing service-role operation reachable directly from the listed admin pages and four APIs: both queue variants, detail/answers/snapshot/brief reads, classification, status, brief save/generate/approve, and test-session creation.
- No additional admin-reachable session-ID database path was found outside that inventory.
- Eyal already scopes session existence, answers, snapshots, leads, briefs, mutations, and session-associated events to its own source.
- Eyal’s direct-contact classification condition must not be copied into Moriz.
- Moriz’s source migration declares `NOT NULL DEFAULT 'moriz'`.
- Eyal’s isolation script is local scratch-only and already tests foreign-session detail and mutation denial.
- Eyal analytics already excludes the three named private prefixes.
- E0’s password/recovery-before-retirement order is sound; preserving the same UUID preserves identity mapping.
- Retaining secrets and Eyal’s legacy redirect environment variable supports rollback; shared Auth email settings must remain intact.
- M-A1 through M-A4 preserve the stated CMS flow structurally, with A2’s deliberate logout change; E0 needs the corrections above.
- Separate repository copies and no schema changes are appropriate. Phase C and the optional CMS-auth delegation can remain deferred.
- Snapshot exports cannot verify the claimed checkout cleanliness, origin equality, or historical commit attribution.

VERDICT: REVISE
### Claude's response

I verified all 3 P1s against the code. Fixed in the plan:

- **P1 Eyal CMS gate breaks at E0.** E0 step 6 now also updates the `projects.spec.ts` login preamble (email/magic-link → wrong password).
- **P1 Eyal global logout before the owner-password test.** New E0 step 0: local-scope logout plus a static assertion before any login/logout verification. Never probe the live callback (its global `signOut()` on a failed exchange) with an owner context.
- **P1 D4 vs notifications and QA scripts.** Added D4 operating rules:
  - `LEAD_NOTIFY_ENABLED=false` asserted on every verification server that can receive a contact.
  - An enumerated list of permitted live operations.
  - No `generate`, no deletes, no `A4_ALLOW_LIVE=1`.
  - Production verification is read-only plus test-session creation.
  - `qa-lead-flows.mjs` and `qa-moriz-isolation.mjs` are local/scratch only.

Necessary factual corrections, also applied:
- `src/lib/cms/routes.ts` holds public paths only.
- The Eyal gate's empty-content prerequisite and its fallback gate.
- Test discovery for `src/lib/auth/**`.
- Public-funnel regression coverage for M-A6.
- Q4 recorded as a SEPARATE ISSUE, with residual-risk wording.

Deferred P2s (implementation checklist, not plan changes):
- Proxy response rebuilding must forward the overwritten request header and copy refreshed cookies onto redirects; test an expired access token with a valid refresh token.
- An exact redirect/CSRF contract: path-boundary and normalized-path validation, login/callback exclusions, exact trusted-origin comparison, rejection of missing/null `Origin`, and a parsed JSON media-type check.

## Round 2 — Codex (same thread, snapshot unchanged: 0 files)


The three prior P1s are resolved: E0 updates the existing email-form test, fixes logout scope before verification, and restricts notification-capable verification to local servers with notifications disabled.

One new P1 remains:

- **[P1] The replacement Eyal auth-only gate still runs the rejecting global setup.**  
  **Evidence:** `eyal/playwright.projects.config.ts:11` unconditionally registers `tests/projects/setup.ts`; `eyal/tests/projects/setup.ts:177–183` rejects any existing Eyal projects or terms. Selecting only `auth.spec.ts` does not bypass global setup.  
  **Impact:** On a populated CMS, the revised fallback fails before running its auth tests, leaving the required checkpoint gate unusable.  
  **Plan fix:** Add a separate auth-only Playwright configuration without the editor global setup, and name its exact command in the E0 and E-A gates.

Non-blocking clarification:

- **[P2] D4’s permitted “classification” operation includes restoring fixtures into production views.**  
  **Evidence:** `moriz/src/diagnostic/sessionClassification.ts:3` accepts `restore_real`; `moriz/src/diagnostic/sessionClassificationService.ts:67–68` maps it to `is_test=false`.  
  **Impact:** A permitted classification check can contradict “synthetic `is_test` only” and leave the retained fixture visible as a real lead.  
  **Plan fix:** Permit only `mark_test` against live-project fixtures; test `restore_real` exclusively against scratch databases.

The added test-discovery requirement resolves that earlier P2. Deferring the proxy-preservation and precise redirect/CSRF contracts to the implementation checklist introduces no additional plan blocker, provided they remain implementation acceptance requirements.

VERDICT: REVISE
### Claude's response

- **P1 fixed.** The Eyal auth-only fallback gate now uses a new `playwright.projects-auth.config.ts` (no `globalSetup`, `testMatch: auth.spec.ts`) via `npm run test:projects:auth`. It is named as the E0/E-A fallback gate.
- **P2 adopted (a one-line D4 safety correction).** Live-project classification is `mark_test` only; `restore_real` is tested in unit tests or against a scratch DB only.

## Round 3 — Codex (same thread, snapshot unchanged: 0 files)


No new P1 findings. The round-2 P1 is resolved.

- The proposed auth-only configuration removes the global setup registered at `eyal/playwright.projects.config.ts:11`, avoiding the populated-CMS rejection at `eyal/tests/projects/setup.ts:181–183`. The source test being ported has no fixture dependency (`moriz/tests/cms/auth.spec.ts:1`).
- The round-2 P2 is resolved: restricting live classification to `mark_test` preserves `is_test=true`, matching `moriz/src/diagnostic/sessionClassificationService.ts:67–68`; `restore_real` is now explicitly scratch/unit-only.

The earlier proxy-preservation and precise redirect/CSRF checklist requirements remain applicable. This approves the revised plan, not an implementation.

VERDICT: APPROVED
### Resolution

- **Converged: APPROVED in round 3 of 5. Zero open P1s.**
- At Codex's condition, the two deferred P2s (proxy header/cookie preservation; the exact redirect and CSRF contract) were added to plan §8 as implementation acceptance requirements.
- A public-endpoint hardening item is tracked privately (plan §11), not a blocker.

# Implementation diff review (Stage 1 / Moriz Phase A)

Reviewer: Codex, static review of the implementation diff. Branch `feat/admin-auth-unification`.

## Round 1 — Codex (diff origin/main...0add883)

Findings:

- **[P1] The “existing owner only” gate can create an Auth user before checking identity.**  
  **Evidence:** `branch/tests/cms-gate/setup.ts:88` calls `generateLink({ type: "magiclink", email: ownerEmail })`; the UUID check occurs only after `verifyOtp`, at line 101.  
  **Impact:** Supabase magic-link generation can create a user when the email does not exist. A mistyped `SUPABASE_ADMIN_EMAIL` therefore mutates the shared Auth project before the gate aborts, violating the explicitly read-only, existing-owner-only contract. Failure also occurs before teardown is registered.  
  **Fix:** First fetch the existing owner with `admin.auth.admin.getUserById(ownerId)`, require its email to match the configured email, and only then generate and verify the link. Register cleanup as sessions are minted so partial setup failures revoke them locally.

- **[P1] Required end-to-end security acceptance cases are missing.**  
  **Evidence:** `branch/tests/cms-gate/gate.spec.ts:199` tests `next` using an already authenticated owner, rather than password login. The API cases at line 255 use empty payloads and cover only the three routes listed at line 224. The detail test at line 290 opens an arbitrary existing lead and can skip entirely.  
  **Impact:** The suite does not establish the plan §8 requirements for password-login-to-`next`, authenticated outsider denial, foreign-source detail/status denial, logout denial on both surfaces, or a permitted mutation happy path on an `is_test` session. Mocked authorization and query-shape assertions cannot establish those integrated behaviors.  
  **Fix:** Keep the CMS gate read-only, and add a separate acceptance suite covering these cases. Restrict mutation coverage to the same synthetic test session on a local server with notifications explicitly disabled; use existing outsider credentials or a scratch environment.

- **[P2] Redirect authority comes directly from an unvalidated Host header.**  
  **Evidence:** `branch/src/lib/auth/proxy-core.ts:77` uses `Host` to construct the absolute login URL. `branch/src/lib/auth/request-guards.ts:24` similarly uses it as the expected origin.  
  **Impact:** A request reaching this application with `Host: evil.example` produces an external login redirect; matching hostile Origin and Host values also satisfy the origin predicate. Ordinary browser JavaScript cannot spoof Host, so this alone does **not** demonstrate browser CSRF or an owner-auth bypass. Exploitability depends on ingress host validation. `private, no-store` mitigates shared-cache poisoning, but does not validate redirect authority.  
  **Fix:** Validate hosts against configured deployment origins, including explicit development origins. Reject unknown hosts before constructing redirects or comparing origins, and add mismatched/hostile Host tests.

- **[P2] The logout scanner misses valid global-sign-out syntax.**  
  **Evidence:** `branch/src/lib/auth/logout-scope.test.ts:65` searches only for the literal `signOut(`.  
  **Impact:** `client.auth.signOut ()` and `client.auth.signOut /* comment */ ()` evade detection despite invoking global logout. The claimed repository-wide protection can therefore pass after an unsafe call is introduced. No such active call was found in the inspected paths.  
  **Fix:** Use TypeScript AST call-expression inspection, distinguish client and admin signatures, and add whitespace/comment regression cases.

Verified correct:

- CMS `auth.ts`, retired callback, and private layout are byte-identical to main; `loginWithPassword` is unchanged.
- Logout explicitly uses local scope.
- Lead pages verify ownership through `getUser()` before diagnostic reads.
- Traced admin reads and mutations enforce Moriz ownership, including inner joins and brief save/generate/approve paths.
- `SessionNotOwnedError` becomes a typed 404 for brief operations.
- Missing/null Origin and non-JSON media types are rejected before owner lookup.
- Proxy matcher, GET/HEAD-only lead redirects, overwritten header forwarding, and redirect-cookie copying are present.
- The lazy guard import avoids loading framework-only auth during injected Node route tests.
- Legacy secret checks were replaced with authorization-negative coverage; new auth tests are included in unit discovery.

Review was static only; no files changed, network accessed, builds, or tests run.

VERDICT: REVISE

### Claude's response

- **P1 owner-first identity check: fixed in 4b35c58.** The gate setup now looks the owner up with `getUserById`, requires its email to match `SUPABASE_ADMIN_EMAIL`, and only then calls `generateLink`. Each minted session is tracked immediately and revoked (local scope) on any setup failure. The logic lives in a shared helper, `tests/support/session-kit.ts`.
- **P1 missing e2e acceptance cases: fixed in 4401553 and b25bb70.** An opt-in live suite (`playwright.admin-acceptance.config.ts`) covers the plan §8 cases, separate from the read-only CMS gate. It requires `ADMIN_ACCEPTANCE_LIVE=1`, runs a local server with notifications and AI forced off, uses synthetic `is_test` data only, and uses existing Auth users only.
- **P2 scanner whitespace and comments: fixed in 8a83c00.** The scanner matches `signOut\s*\(` after blanking comments, with regression cases. An AST was not needed.
- **P2 Host-header trust: deferred, no code change.** Vercel routes by Host, `request.url` is normalized by Next (127.0.0.1 becomes localhost), and the responses are `private, no-store`. The residual risk is the Vercel Host-routing ingress assumption. Revisit it on any hosting change.

## Round 2 — Codex (same thread, snapshot b25bb70, snapshot unchanged: 0 files)

Both round-1 P1s are resolved in the implementation. No new P1 found.

- **[P2] Foreign-session probe cannot prove that no write occurred.**  
  **Evidence:** `branch/tests/admin-acceptance/lead-flow.spec.ts:160` deliberately submits the foreign lead’s current status, then checks that the status remains unchanged.  
  **Impact:** The 404 assertion catches a missing ownership guard that returns success, but unchanged data cannot distinguish rejection from an update followed by a 404.  
  **Fix:** Describe this as a denial-response check; retain injected-client unit assertions that prove the update operation is never reached. Test changes to foreign status only against a scratch database.

- **[P2] Password-to-next coverage exists but remains unverified in the reported run.**  
  **Evidence:** `branch/tests/admin-acceptance/session.spec.ts:36` skips without `CMS_TEST_ADMIN_PASSWORD`.  
  **Impact:** The reported 9-pass run does not establish the actual password-login return path. This resolves the missing-test implementation finding, but leaves a verification gap.  
  **Fix:** Run the opt-in case before rollout and record its result.

- **[P2] Logout checks browser access, rather than replay of the revoked session.**  
  **Evidence:** `branch/tests/admin-acceptance/session.spec.ts:15` checks access after UI logout has removed browser cookies.  
  **Impact:** This would also pass if logout cleared cookies without revoking the minted session.  
  **Fix:** Replay the separately minted logout session’s original cookies in a fresh context and assert denial on both surfaces.

Verified correct:

- `branch/tests/support/session-kit.ts:57` validates the existing owner and matching email before link generation. Outsider lookup also requires an existing, different UUID.
- Sessions are tracked before subsequent identity/cookie work, and setup failures invoke local-scope cleanup.
- The new infrastructure contains no user-creation calls, SQL, table/storage writes, or global sign-out.
- Acceptance mutations use the newly created Moriz `is_test` session; no restore-to-real, brief generation, or destructive cleanup appears.
- The local server explicitly disables notifications and AI, rejects reuse of another server, and requires live-write opt-in.
- Scanner whitespace/comment cases are now covered.

**Host deferral remains acceptable as P2**, assuming Vercel’s stated Host-routing boundary holds. I found no demonstrated browser CSRF or owner-auth bypass warranting P1. The preview owner-POST check establishes functionality; it does not itself prove hostile-Host rejection. Keep that ingress assumption explicit for any future hosting change.

Static review only; no tests, builds, network access, or file writes performed.

VERDICT: APPROVED

### Claude's response

All three P2s are non-blocking and deferred.

- **Foreign-status probe.** It is a denial-response check. Write prevention is proven by the unit tests in `src/diagnostic/db/ownership.test.ts` (`SessionNotOwnedError` is thrown before any write).
- **Password to `next` path.** The owner verified it manually on a local dev server on 2026-10-20 (real password login; `/digital-audit/admin` and `/admin/projects` reachable).
- **Logout cookie replay.** Replaying the original logout-session cookies in a fresh context is a deferred follow-up.

## Verification at b25bb70

- CMS gate: 17 passed, 1 skipped (the opt-in password test).
- Acceptance suite: 9 passed, 1 skipped.
- Unit tests: 497/497 at 4401553 (only an acceptance spec changed since).
- Typecheck, lint and build pass.

### Resolution

- **Converged: APPROVED in round 2 of the implementation review.** No open P1s.
- Merge and production deploy await explicit owner approval.
