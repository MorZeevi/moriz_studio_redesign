# Moriz Studio website redesign

This project contains planning documentation, requested research, and an owner-requested local homepage wireframe and shared design foundations. The files in `docs/` remain the project source of truth. Documentation is in English; website content is Hebrew-first/RTL, with architecture prepared for future English/LTR support.

## Current work stage

As of 2026-10-06, the [design system foundations](docs/09-design-system.md) are implemented using the installed Tailwind 4.3.3 CSS-first theme: supplied palette, Danidin CondensedBold and Leon, shared type/spacing/container/radius/border/motion tokens, RTL/LTR utilities and a reusable button. No logo or page layout redesign was created. The existing [Mammoth hero/header trial](docs/homepage-workbook.md#selected-trial--mammoth-murals-layout) remains In progress; later workbook sections remain Not started. Its content and compositions are retained while global palette/fonts and shared containers now use the foundation.

At the owner's request, [focused Mobbin research on homepage structure](docs/research/mobbin-homepage-structure-2025-2026.md) preceded the confirmed sequence: **Hero → three communication themes / advantages → projects → brief owner introduction → client testimonials → how to start working together → FAQ → contact → footer**. WhatsApp appears only as a floating control at the lower side. The prototype uses lower inline-end as a temporary review position; the final side and detailed behavior remain open. See [the prototype review record](docs/02-page-structure.md#wireframe-prototype--review-status). FAQ content remains deferred.

Update, 2026-10-07: the owner authorized the [first advantages research card](docs/homepage-workbook.md#2-three-communication-themes--advantages). It now shows the agreed Hebrew title/paragraph and eight grayscale UI/UX pills, adapted from React Bits FallingText; the subsequent revision replaces נגישות/פרוטוטייפ with מחקר מתחרים. They drop once on viewport entry, support mouse dragging, resize with the card and remain static for reduced motion or missing JavaScript. The advantages section is In progress; the other two cards remain placeholders, and visual acceptance is pending.

Update, 2026-10-07: the second advantages card demonstrates its interactive-experience message with viewport-wide **NORMAL / PARTY** mode: a real rotating disco ball, stronger red/yellow lighting with a temporary cyan accent, projected heading color, two cycling colored tags and selected typography/CTA motion. The refined ball is smaller and sits slightly left of center. The underlying light theme, fonts and navigation remain usable. Mobile composition, reduced motion, keyboard controls and a clean return to NORMAL are implemented. No runtime dependency was added. See [Party Mode](docs/party-mode.md); owner visual acceptance and final supporting copy remain pending.

## Local development

Sharing or reusing the complete project? See [SHARING.md](SHARING.md) for setup and customization instructions.

Installed stack: React 19.3.0, Next.js 16.3.8 (App Router), Tailwind CSS 4.3.3, and Node.js 22.14.0. Node is the existing runtime; the project requires Node 20.9 or newer. TypeScript and Biome support implementation checks. Dependency versions are pinned in `package.json` and `package-lock.json`.

From the project folder:

```sh
npm ci
npm run dev
```

Open [the local wireframe](http://127.0.0.1:3000/). The entry URL redirects to `/he`; only Hebrew content is enabled. No public deployment has been created.

The earlier font candidates can still be compared at [the local font preview](http://127.0.0.1:3000/he/fonts). The selected foundation uses the supplied **Danidin CondensedBold** face and **Leon Regular/Heavy** WOFF2 files. [fonts.ts](src/styles/fonts.ts) defines their loaders once; [font-candidates.ts](src/styles/font-candidates.ts) preserves comparison-only families without preloading them on the homepage. No font conversion was needed. See [the design-system guide](docs/09-design-system.md) before building a new section.

Development preview also includes floating **Developer tools** controls with an external **Inspector: OFF/ON** toggle. Enable inspection with the panel closed, select elements, then open the panel to view their DOM and exact JSX source location and copy context plus a request for Codex. Closing the panel preserves inspection, selection and the draft; the external toggle or Escape stops inspection. It is excluded from production. See [the inspector guide](docs/visual-element-inspector.md) for usage, limitations, architecture and test commands.

Font review verification on 2026-10-06: all five copied files match their source hashes, and all five font faces load successfully in Chrome. The comparison passed at 320, 390, 768 and 1440px, including 200% text enlargement, editable text, keyboard-operated size control, reset and return navigation without overflow or runtime errors. Lint, typecheck and production build passed.

```sh
npm run lint
npm run typecheck
npm run build
```

- Text and UI labels: [src/i18n/dictionaries/he.ts](src/i18n/dictionaries/he.ts). Hero H1, description and CTA are owner-agreed; later section copy remains source wording and clearly marked placeholders.
- Page markup: [src/app/[locale]/page.tsx](src/app/%5Blocale%5D/page.tsx); reusable components are in `src/components/`.
- Shared style entry: [src/app/globals.css](src/app/globals.css). [tokens.css](src/styles/tokens.css) is the token source; [foundations.css](src/styles/foundations.css) provides reusable rules. Existing compositions are isolated in [wireframe.css](src/styles/wireframe.css); new sections should use the design-system guide.
- Language availability and directions: [src/i18n/config.ts](src/i18n/config.ts). The document derives `lang` and `dir` from the route's enabled locale. Components share markup and consume dictionary content.
- Navigation is visible and centered on desktop from 1024px, with a CTA and adjacent underlined EN language link on the left and text logo on the right. Mobile/tablet retain the hamburger and the same single EN link in its drawer. Both variants include Projects/About/Contact homepage anchors; the current-language button pair is removed. EN remains unavailable until English content is supplied. The header CTA provisionally repeats **לצפיה בפרויקטים** → `#projects` pending the owner's label/destination preference. To enable English later, supply a matching dictionary, register its loader, and add `en` to `enabledLocales`. No English dictionary, translation, or working English page exists yet.
- The floating WhatsApp control remains disabled until a real international number is supplied through `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local`. See [.env.example](.env.example); use digits only, without `+` or spaces, then restart the development server. No destination or prefilled message is invented.

Final language URL/SEO policy, navigation beyond the selected homepage anchors, later responsive states and brand choices remain planning decisions. The current locale-prefixed route is a prototype implementation convention.

Verification on 2026-10-06: lint, TypeScript and the production build passed. Local HTTP checks confirmed the Hebrew default redirect, document language/direction, section order, unavailable English option and single floating WhatsApp control. The Hebrew layout and FAQ were inspected in Safari at desktop and a 390px viewport. English content/layout verification remains deferred until translations are supplied.

Subsequent Mammoth hero/header trial verification on 2026-10-06: lint, typecheck and build pass. Headless Chrome checks pass at 320, 390, 768, 1024, 1440 and 1920px and 200% text enlargement, including exact copy, RTL/mobile order, section sequence, project-anchor CTA, menu keyboard/mouse/touch behavior and disabled English, with no runtime errors. [Implementation captures and trial notes](docs/homepage-workbook.md#selected-trial--mammoth-murals-layout) are saved for owner review. Final visual acceptance remains pending.

During Chrome development review, ColorZilla added `cz-shortcut-listen` to the page body and triggered React's hydration warning. This extension-specific warning was absent in the Safari review; browser extensions and settings were left unchanged.

## Planning files and current status

Owner-requested React Bits [LogoLoop](https://reactbits.dev/animations/logo-loop) is installed with `npx jsrepo@latest add https://reactbits.dev/r/LogoLoop-TS-CSS` and appears immediately below the hero. Six neutral placeholders remain until the owner supplies images. Put files in `public/logos/` and register their `/logos/filename.svg` (or PNG/WebP) path and real `alt` name in [src/content/homepage-logos.ts](src/content/homepage-logos.ts); the placeholders are replaced automatically once the list has entries. The grayscale strip moves left at 60px/s, pauses on hover, has a keyboard/touch pause button and stops for reduced motion. It forms an extension of the hero trial; the existing nine section markers and later sections remain in order. Local adaptations to the imported component cover type-safe items, semantic markup and an idle animation loop when paused. No runtime dependency was added.

Status reviewed on 2026-10-06. All 16 numbered planning files exist, alongside the shared homepage workbook. An existing template is not evidence that its planning or design work is complete; unresolved fields remain intentional.

LogoLoop verification on 2026-10-06: lint, typecheck and production build pass. Chrome checks pass at 320, 390, 768, 1024, 1440 and 1920px, including 200% text enlargement, continuous movement with adjacent sequences, hover/manual/keyboard/touch pause, resume, initial and live reduced-motion preferences, unchanged section order and no runtime errors. The final build was rerun successfully outside the restricted sandbox after its first run stalled.

| File | Purpose and current status | What remains |
| --- | --- | --- |
| [00-project-brief.md](docs/00-project-brief.md) | Working brief: goals, preferred audience, positioning, business constraints, language, milestone, and conversion target recorded. | Measurement definitions, tracking period/method, evidence details, and launch dates. |
| [01-sitemap.md](docs/01-sitemap.md) | Seven planned page types and collection/detail relationships recorded. | Final navigation, page relationships/actions, and remaining page-level goals. |
| [homepage-workbook.md](docs/homepage-workbook.md) | Shared workspace; exact hero copy and approved Mammoth trial implemented locally. Hero In progress, later sections Not started. Earlier drafts retained as history. | Visual acceptance of the hero trial, future video, then later section content/layout review. |
| [02-page-structure.md](docs/02-page-structure.md) | Nine-part Home sequence confirmed; first coded wireframe available as a provisional reference. Other pages remain templates. | Agree section layouts in the workbook, then record internal hierarchy, Home project selection, navigation/actions and Contact/Footer contents; other pages later. |
| [03-content.md](docs/03-content.md) | Separate content inventory with owner-supplied themes, client-starting steps and available proof; links to collaborative Hebrew drafts in the workbook. | Agreed Hebrew text, project descriptions, testimonial details, FAQ and later SEO copy. No English translation yet. |
| [04-projects-and-case-studies.md](docs/04-projects-and-case-studies.md) | Three projects selected for the website; reusable case-study template prepared. | Which projects appear on Home and in what order, available visuals, roles/scopes/outcomes, usage data, and case-study hierarchy. |
| [05-research-and-tools-blog.md](docs/05-research-and-tools-blog.md) | Platform purpose, broad audience, and topic-based organization recorded. | Taxonomy, article structure, metadata, filtering, quality rules, and future automation decisions; after the homepage milestone. |
| [06-diagnostic-questionnaire.md](docs/06-diagnostic-questionnaire.md) | Existing feature purpose and visual-redesign-only scope recorded. | Document the current flow, questions, options, logic, results, and analytics before its later redesign. |
| [07-research-plan.md](docs/07-research-plan.md) | Two Mobbin reports and owner references available; focused homepage research completed with date limits. | Other research areas remain templates. Further pattern selection and research for later pages are open. |
| [08-brand-direction.md](docs/08-brand-direction.md) | Foundation palette and typography selected; desired attributes, feeling and references recorded. | Moodboard, logo and graphic language; page art direction later. |
| [09-design-system.md](docs/09-design-system.md) | Implemented palette, typography, spacing/layout, shape, motion, buttons and RTL/LTR foundations with practical usage guidance. | Page-specific components as needed; final visual tuning. |
| [10-motion-and-interactions.md](docs/10-motion-and-interactions.md) | Floating WhatsApp selected; prototype control implemented but destination not configured. | Final side, destination, responsive behavior, visual treatment, and intentionally selected motion. |
| [11-interaction-backlog.md](docs/11-interaction-backlog.md) | Four initial inspiration ideas recorded with status Idea. | Optional investigation and selection later; none is a website requirement. |
| [12-responsive-and-rtl.md](docs/12-responsive-and-rtl.md) | Hebrew-first implementation and bilingual-ready architecture requirements recorded; initial shared components and logical styling implemented. | Final responsive states, future English validation, navigation, touch behavior, and accessibility requirements. |
| [13-seo-and-sharing.md](docs/13-seo-and-sharing.md) | Future SEO/sharing template prepared. | Metadata, indexing, structured data, canonicals, sitemap/robots, hreflang, and SEO copy. |
| [14-decisions.md](docs/14-decisions.md) | Explicit owner decisions logged, including Home order and WhatsApp placement. | Continue recording future choices and evidence; unanswered rationale fields remain open. |
| [15-general-backlog.md](docs/15-general-backlog.md) | Discipline categories and the deferred FAQ task recorded. | Add deferred work as it arises; empty categories do not need filling now. |

## Next work for the homepage

Use [the homepage workbook](docs/homepage-workbook.md) as the shared workspace for English planning notes and Hebrew website copy. It supersedes the earlier workflow in which the owner handled text separately. The owner authorized specific exceptions to the all-sections-before-code timing: the local hero/header trial and, on 2026-10-07, the first advantages research card.

1. Review the Mammoth-inspired trial locally at `/he`, including desktop headline wrapping and mobile H1 → video → description → CTA order. Review the centered desktop navigation/left CTA, mobile hamburger and **לצפיה בפרויקטים** anchor.
2. Review the first research-card trial at `/he#advantages`, including the supplied text, grayscale falling pills, mouse dragging and stacked mobile layout. Review the second card’s Party Mode as described in the guide; its supporting copy and the third card remain placeholders. Hero acceptance is still pending; the owner will create its video later, and branding/playback behavior remain open.
3. Work through later sections in confirmed order: define information, review relevant references, draft/refine Hebrew options and compare desktop/mobile layouts before recording agreement. Keep deferred source material explicit.
4. Reflect agreements in content, page planning and decision records. Later coded updates follow their section reviews; no change to later sections, new pages, APIs or publishing is part of the hero trial.

The other pages follow the homepage milestone. The blog, questionnaire, design-system, responsive, and SEO templates do not all need to be completed before the homepage structure work can continue. Their relevant details should be resolved at their respective stages.

## Start here

For the current stage, start with [the workbook hero](docs/homepage-workbook.md#1-hero) and the next-work list above. The [Home planning inventory](docs/02-page-structure.md#section-planning-inventory) supplies confirmed inputs; content and layout are refined together in the workbook.

For the initial project setup, the sequence is `00-project-brief.md`, `01-sitemap.md`, then `07-research-plan.md` and research before defining page hierarchy in `02-page-structure.md`. Those foundations are already recorded for the current homepage work; remaining TODOs can be revisited when relevant.

Keep source content and the agreed content inventory in `03-content.md`, separate from the sitemap and page structure. Develop homepage drafts and layout comparisons together in the workbook, then link recorded agreements to the relevant planning documents. Record explicit decisions in `14-decisions.md`, deferred work in `15-general-backlog.md`, and interaction inspiration in `11-interaction-backlog.md`.

## Recommended order of work

The project owner's preferred first-week milestone is a developed homepage together with entirely new branding; the remaining pages follow afterward. Start with a black-and-white homepage wireframe before visual identity work. The confirmed branding scope includes fonts, typography, colors, a logo, and graphic elements, as documented in [08-brand-direction.md](docs/08-brand-direction.md). Specific visual choices, deployment/public-launch timing, and calendar dates remain undecided. Apply the process below to the homepage first, then continue with the remaining pages. The existing questionnaire is planned for visual redesign only.

1. Define project goals
2. Create the sitemap
3. Research relevant websites and UX patterns
4. Define page structure and information hierarchy
5. Develop black-and-white layouts alongside 2–3 Hebrew content options per homepage section in the workbook
6. Review the authorized hero/header coded trial, then agree later section content/layout before their code updates
7. Explore typography and brand direction
8. Create the visual identity
9. Apply the identity to the wireframes
10. Build the design system
11. Select and design interactions
12. Design responsive states
13. Develop the website
14. QA, accessibility, performance and SEO

## Intentionally incomplete documents

All planning documents retain unresolved fields. Most research records remain empty; the [Mobbin agency-inspiration report](docs/research/mobbin-agency-inspiration-2025-2026.md), [homepage-structure research](docs/research/mobbin-homepage-structure-2025-2026.md) and [hero research](docs/research/mobbin-agency-hero-research.md) contain findings and evidence limits. The homepage sequence is confirmed. The workbook records exact agreed hero copy and the selected Mammoth trial; the rendered trial needs visual acceptance and later section content/layout remain open. Visual identity, design-system values, final responsive details, case-study hierarchy and SEO remain undefined. Floating WhatsApp behavior/destination and optional backlog interactions remain later decisions.

Use `TODO: Decision required` for unresolved fields. Page hierarchy uses `TODO: Define hierarchy after UX/UI research.`

## Working principles

- Pre-fill only information explicitly supplied by the project owner.
- Draft the authorized Hebrew homepage options from supplied facts in the workbook; distinguish proposals from owner agreements. Do not invent evidence, project claims, branding or UX conclusions.
- Do not skip ahead in the process.
- A coded black-and-white homepage wireframe exists, with the owner-authorized Mammoth hero/header trial. Review the trial before moving to later sections; their updates follow the collaborative workbook process. Temporary prototype choices remain reviewable; production development and visual identity are later stages. Conduct additional research only when requested.
- Keep UI text in dictionaries, derive document direction from language, and use logical CSS/shared components. Implement only Hebrew content for now; English remains unavailable.
- Plan Hebrew pages as RTL and keep future English/LTR support in mind; do not translate content or create English website copy yet.
- Do not promote backlog ideas into selected interactions until they are intentionally selected.
