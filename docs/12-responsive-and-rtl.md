# Responsive and RTL planning checklist

Hebrew pages must be RTL. Keep future English/LTR support in mind and make the information architecture language-independent where possible. The checklist records topics to resolve later, without implementation details.

## Confirmed bilingual architecture requirements

The owner explicitly requires Hebrew-first implementation and bilingual-ready architecture:

- Default language: Hebrew, with `lang="he"` and `dir="rtl"`.
- English (live since 2026-11-18 at `/en`): `lang="en"` and `dir="ltr"`, using the same components and `src/i18n/dictionaries/en.ts`.
- ~~All current content and UI labels must be Hebrew; no English translation or invented English copy.~~ Superseded 2026-11-18: the owner approved an English site with drafted marketing English for review.
- The owner subsequently selected one underlined EN language link beside the desktop header CTA, replacing the language-button pair. Mobile keeps the same link in its navigation drawer. English is unavailable until its content is supplied; see [the language-link choice](14-decisions.md#compact-language-link).
- Keep text separate from UI/components, using matching dictionary keys for later translations.
- Use logical margins, padding, positioning and start alignment wherever related to reading direction. Flex/Grid should adapt to document direction.
- Layout, interactions, animations and responsive behavior must structurally support both directions. No motion is selected for the current wireframe.

## Current prototype foundation

Language configuration and direction mapping are in [src/i18n/config.ts](../src/i18n/config.ts); content is in [the Hebrew](../src/i18n/dictionaries/he.ts) and [English](../src/i18n/dictionaries/en.ts) dictionaries (same shape). The locale root layout derives document attributes from that configuration. `/he` and `/en` are enabled; `/` redirects to `/he`. Components share markup, logical positioning/spacing and direction-inheriting layouts; mixed-direction labels use bidirectional isolation.

The wireframe includes provisional stacking at narrow widths and native FAQ controls. These are reviewable prototype settings. Final breakpoint values, responsive states, future English typography/length validation and URL/SEO policy: TODO: Decision required

Prototype verification on 2026-10-06: Hebrew document attributes and language availability checked through local HTTP output; layout and FAQ opening inspected in Safari at desktop and a 390px viewport. Future English content, LTR visual review, device coverage and a full accessibility audit remain pending.

## English (LTR) rules, 2026-11-18

- Hebrew rendering must not change. Fixes for English are scoped to the root element, `html[dir="ltr"] .x` (in CSS Modules `:global(html[dir="ltr"]) .x`) or `html[lang="en"]`, never a bare `:dir(ltr)`/`:lang(en)`: Hebrew pages contain LTR islands (the logo strip, email/phone spans, the FAQ layout's `direction: ltr`, the toggle's `<bdi lang="en">`) that a bare selector would also match.
- Mirrored for LTR this way: the FAQ layout (heading left, questions right, the control on each question's right edge), the chat message pop origins, the contact form phone alignment, the case-study website arrow (no double flip; hover nudge follows reading direction) and the Party Mode fallback ball position.
- Hero: on desktop the English description is capped at about the Hebrew measure (`31rem`, balanced wrapping), because the longer English lines met the growing hero video.
- Logo lockups follow the page direction (`dir` from `localeConfig`), and logo alts have English names (`src/content/homepage-logos.ts`).
- Fonts: Danidin and Leon render the Latin punctuation the English copy uses (quotes, apostrophes, dashes, ellipsis, ampersand); checked in Chrome 2026-11-18.

## Future planning checklist

- [ ] **Hebrew RTL behavior:** TODO: Decision required
- [ ] **Future English LTR behavior:** TODO: Decision required
- [ ] **Logical CSS properties:** TODO: Decision required
- [ ] **Navigation direction:** TODO: Decision required
- [ ] **Icons that need mirroring:** TODO: Decision required
- [ ] **Typography differences:** TODO: Decision required
- [ ] **Text alignment:** TODO: Decision required
- [ ] **Responsive layout:** TODO: Decision required
- [ ] **Mobile navigation:** TODO: Decision required
- [ ] **Touch interactions:** TODO: Decision required
- [ ] **Hover alternatives:** TODO: Decision required
- [ ] **Animation changes on mobile:** TODO: Decision required
- [ ] **Content order:** TODO: Decision required
- [ ] **Breakpoints:** TODO: Decision required
- [ ] **Accessibility:** TODO: Decision required
