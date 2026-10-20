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
