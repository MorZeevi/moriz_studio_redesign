# Responsive and RTL planning checklist

Hebrew pages must be RTL. Keep future English/LTR support in mind and make the information architecture language-independent where possible. The checklist records topics to resolve later, without implementation details.

## Confirmed bilingual architecture requirements

The owner explicitly requires Hebrew-first implementation and bilingual-ready architecture:

- Default language: Hebrew, with `lang="he"` and `dir="rtl"`.
- Future English: `lang="en"` and `dir="ltr"`, using the same components.
- All current content and UI labels must be Hebrew; no English translation or invented English copy.
- The owner subsequently selected one underlined EN language link beside the desktop header CTA, replacing the language-button pair. Mobile keeps the same link in its navigation drawer. English is unavailable until its content is supplied; see [the language-link choice](14-decisions.md#compact-language-link).
- Keep text separate from UI/components, using matching dictionary keys for later translations.
- Use logical margins, padding, positioning and start alignment wherever related to reading direction. Flex/Grid should adapt to document direction.
- Layout, interactions, animations and responsive behavior must structurally support both directions. No motion is selected for the current wireframe.

## Current prototype foundation

Language configuration and direction mapping are in [src/i18n/config.ts](../src/i18n/config.ts); Hebrew content is in [its dictionary](../src/i18n/dictionaries/he.ts). The locale root layout derives document attributes from that configuration. Only `/he` is enabled and `/` redirects to it. Components share markup, logical positioning/spacing and direction-inheriting layouts; mixed-direction labels use bidirectional isolation.

The wireframe includes provisional stacking at narrow widths and native FAQ controls. These are reviewable prototype settings. Final breakpoint values, responsive states, future English typography/length validation and URL/SEO policy: TODO: Decision required

Prototype verification on 2026-10-06: Hebrew document attributes and language availability checked through local HTTP output; layout and FAQ opening inspected in Safari at desktop and a 390px viewport. Future English content, LTR visual review, device coverage and a full accessibility audit remain pending.

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
