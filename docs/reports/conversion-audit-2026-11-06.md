# Conversion and delivery improvements — 6 November 2026

Implementation branch: `codex/conversion-performance-fresh-2026-11-06`, based on remote `c6fa338`.
The primary checkout and its local changes were preserved. A fresh isolated clone under `.worktrees/` was necessary because the original linked checkout stalled reading iCloud-backed Git objects. No metadata repair, reset or forced checkout was used.

## Evidence

- At 393 × 852, the original Projects heading and accumulated title rows occupied nearly half the viewport. The last project image scrolled through a narrow remaining area.
- The transparent mobile header overlapped the About image and lost contrast.
- Project pages ended at next-project navigation without an inline enquiry invitation.
- Read-only testing of one published image: original 470,954 bytes; authenticated 750px transformation 54,573 bytes (88% fewer bytes). Direct SDK and proxied response timings are not interchangeable.
- Clarity's consistent 30 October–5 November window returned 47 mobile sessions, 36.53 seconds average active engagement; 74 desktop sessions, 81.12 seconds. This is descriptive, not causal. A broader initial response used a different window and is not combined with this baseline.
- Clarity aggregate responses flagged PracticalAI and Chabad Club friction, but did not reliably establish contact conversions. No recordings were reviewed. Missing events do not establish zero leads.

## Implemented checklist

- [x] First independent commit: contact intent, form start/accepted/error and section exposure events; public path only; preview/admin exclusions; form/chat masking.
- [x] Normal mobile project scrolling, compact logos and short summaries; desktop stack retained.
- [x] Hero WhatsApp CTA ahead of the secondary projects action.
- [x] Exact claim: **400K+ משתמשים במוצרים שבניתי או לקחתי בהם חלק**.
- [x] Existing Elementor excerpt attributed to Gabriella Lester / גבריאלה לסטר, Product Marketing Director, אלמנטור.
- [x] Project-end enquiry invitation before next-project navigation, plus a compact intro action.
- [x] Width allowlist 320/640/750/1080/1200/1600/1920/2400; quality 80; aspect ratio preserved; private/no-store and original video range path retained.
- [x] Opaque theme-aware mobile header.
- [x] One mobile bottom bar; hide when hero actions/contact section are visible, an editable control is focused, or a dialog is open. Reserve bottom/safe-area space.
- [x] Remove the opening cover, which intentionally covered readable content while waiting for fonts and the reveal; retain the site's other visual identity.
- [x] Visible server/reduced-motion hero text; remove the incoming offscreen text state; stable service summary.
- [x] Chat imports on first use and remains mounted afterward; no Party Mode media warmup before activation.
- [x] Preserve existing lightweight mobile poster/tap-to-play, short form, phone keyboard, recovery and success announcements.
- [x] Existing Noise already pauses offscreen/background and stays static on mobile; retained. Core GSAP/header dependencies retained to avoid delaying navigation and native controls.
- [x] Existing footer containment regressions pass at 320/390/430/768px; no speculative footer redesign.

## Verification

- Lint, TypeScript and production build.
- 17 browser regressions: conversion flow, existing homepage refinements and first-content visibility. Public routes include home, archive, PracticalAI, Chabad Club and a representative article; widths include 320, 393 × 852, 740 × 360, 768, 1024 and 1440. Light and dark layouts were exercised.
- Three unit checks cover analytics privacy/host gating and width/format restrictions; three existing contact tests pass.
- The public resized-image endpoint returned 200 with `Cache-Control: private, no-store`; unsupported width returned 400. No storage policy or schema changed. Live draft/unpublish/cross-owner mutation fixtures were not run against production; verify those in the existing isolated CMS acceptance environment before rollout.
- Desktop/mobile visual inspection used Chrome, including iPhone viewport emulation. Physical iOS keyboard and safe-area rendering are still release-device checks; viewport/focus emulation is not a physical-device result.
- Contact success/failure browser tests intercept delivery, so no test enquiry was sent.

### Preliminary cold-load comparison

Three fresh browser contexts per variant/device; local production servers on the same Mac and database; browser cache disabled. Mobile: 393 × 852, DPR 2, 150ms latency, 1.6Mbps download and 4× CPU slowdown. Desktop: 1440 × 1000, DPR 1, no throttling. Observe four seconds after load. This compares the main implementation build before final small focus-recovery and button-width refinements; it is not field data or a final Core Web Vitals certification.

| Device | Baseline median LCP | Candidate median LCP | Baseline CLS | Candidate CLS |
| --- | --- | --- | --- | --- |
| Mobile | 4.396s | 3.768s | 0 | 0.008 |
| Desktop | 0.316s | 0.296s | 0.005 | 0.005 |

Mobile transfer median: 1,075,145 → 1,004,167 bytes. Desktop: 2,850,838 → 3,897,386 bytes; earlier showreel playback after removing the cover changes the video transfer window. Do not claim a universal bandwidth reduction. Mobile LCP remains above the 2.5s target; continue measuring real visitor loading after release. No INP improvement or conversion lift is claimed.

The opt-in comparison test is `tests/navigation/conversion-performance.spec.ts`; sanitized results live in `.cache/conversion-review/performance.json`.

## Release sequence and deferred work

1. Review and deploy the independent measurement commit first where possible. Mark the actual deployment time. If shipped with UX, disclose that no equivalent pre-change custom-event baseline exists.
2. Review and release the UX/media changes after checking a physical phone and isolated CMS permission fixtures. Nothing was published by this task.
3. Only after this first-priority release: review PracticalAI/Chabad Club recordings and reproduce concrete friction; enrich case-study challenge/approach/result and service-oriented SEO using supported material; prepare campaign-tagged Facebook landing recommendations. Existing authored CMS SEO and recently merged metadata remain preserved.
4. Review complete 7-day and 28-day windows by device/acquisition source. Report **contact intent**, **server-accepted forms**, and **owner-confirmed qualified leads** separately. Five qualified enquiries per 100 visits is a business target, not a promise.

## Owner follow-up: hero simplification

The inline hero WhatsApp action and Elementor excerpt/attribution were removed at the owner's request. The qualified 400K+ line remains, and project browsing is again the sole primary hero action. The mobile bottom-bar label is now **שנדבר בוואטסאפ?**. Project-page enquiry actions and the original testimonial section remain. TypeScript, lint and the focused mobile regression (393×852, 740×360, 320×568) pass.

Owner follow-up: the project-sidebar WhatsApp action is removed. The project-end enquiry invitation remains before next-project navigation.
