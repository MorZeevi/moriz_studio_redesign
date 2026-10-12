# Homepage Q&A

Mode: Persuade. Targets: the homepage FAQ component, its styles and chat launcher integration.

## Direction contract

**THESIS:** Answer pre-project questions through the site's connected liquid-button silhouette. The owner's four references govern composition, the expanding answer and the two contact actions.

**OWN-WORLD:** Keep Danidin headings, Leon body text, the secondary-yellow canvas, grain and existing page gutters. Question surfaces are white with charcoal ink in both themes; only the open question text uses the CTA color. AI is white with an animated gradient outline and the existing sparkle; WhatsApp is green with the supplied cutout portrait.

**STORY:** Scan the questions, open one answer, then ask moriz.ai or contact Mor through WhatsApp. All eight questions and answers remain explicit placeholders until the owner supplies copy.

**FIRST VIEWPORT:** Desktop has a 40/60 split: heading and stacked actions on the physical right, RTL question text on the left. Each row joins a left plus tile to a wide question body. Opening grows that body downward and turns the plus into a close cross. Below 1024px: heading, questions, then actions.

**FORM:** Owner-pinned local extension, no concept seed or new visual world. All answers start closed; native disclosures allow one open item. Reduced motion is immediate. Both AI launchers share one conversation and restore focus to their actual opener.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

The incumbent visual system is documented in `docs/09-design-system.md`. This extension preserves it; no new DESIGN.md or global tokens are needed. Portrait provenance: existing owner-supplied `public/images/mor-avatar-cutout.webp`, reused without modification.

## Authorization and boundaries

Owner confirmed the right-hand heading/actions, charcoal expanded state, eight placeholder questions, distinct AI/WhatsApp styling and one-at-a-time accordion, then requested implementation. This overrides the earlier floating-only WhatsApp rule for this FAQ section. About Me remains unchanged. Work stays in `about-me-redesign`; the owner has now authorized a local merge into main; publication is not included.

## Implemented extension

Completed locally on 2026-10-12 in `src/components/faq.tsx` and `faq.module.css`, with the shared dialog entry point in `src/lib/chat-launcher.ts` and `floating-actions.tsx`. Desktop keeps the heading and stacked actions on the physical right and the questions on the left; below 1024px the natural order is heading → questions → actions. Each native disclosure joins a physical-left plus tile to the white question body. All eight start closed; opening one closes the previous item, expands the same white body and rotates the plus into a cross. Native disclosure behavior remains available without JavaScript; supported browsers animate intrinsic answer height, and reduced motion removes those transitions.

The white sparkle action with a gradient outline reads **לשאול את moriz.ai** and opens the existing shared chat dialog. Conversation state survives closing and reopening through either launcher, and closing restores focus to the actual opener. The green portrait link reads **שנדבר בוואטסאפ?** and uses the existing WhatsApp destination. The eight placeholder questions and **תשובה — להשלמה** remain; no publishable answers or service claims were invented.

Compared with the incumbent FAQ, this adds the owner's split composition, connected liquid silhouette and two local contact actions. It reuses the existing liquid components and sparkle, Danidin/Leon, charcoal/light ink, yellow page transition, grain and gutters. The green WhatsApp treatment is local to this requested surface; it is not a new global token. The existing owner-supplied `public/images/mor-avatar-cutout.webp` is reused unchanged; no new raster was generated. The four owner references govern this surface, not the site-wide visual system.

## Local review and remaining acceptance

Independent finish review returned **ship**, with no material fixes and matching persistence, fidelity and ceiling checks. Detector output was `[]`. Lint, TypeScript, production build and diff-whitespace checks passed. Browser validation passed 17 FAQ/chat/navigation checks in the main run and the remaining shared-chat check after correcting its test locator; the existing inspector FAQ regression also passed. This records combined results, not a single uninterrupted 18-test run.

Visual evidence is in `.impeccable/review/faq/`: desktop, tablet and mobile captures, closed/open states, mobile action views, light/dark variants and `geometry.json`. Review is scoped to this local FAQ extension and its shared chat integration. Owner visual acceptance and final FAQ copy remain pending. The owner subsequently authorized a local merge into main; publication is not included.

## Compact rows revision

Owner refinement, 2026-10-12: explicitly fix the physical desktop columns as heading/actions right and questions left, independent of document direction; retain RTL inside each region. Reduce summary/control heights from 88px to 64px on desktop and from 72px to 56px on mobile (48px control at the narrowest widths, with text allowed to grow). Use 16px desktop row gaps and expand the dictionary to eight numbered placeholder questions. The answer behavior and contact actions are unchanged.

Revision verification: six existing FAQ browser checks, lint, TypeScript and diff-whitespace checks pass. Desktop/tablet/mobile captures show eight items with no horizontal overflow or runtime errors. On phones the taller section is captured in separate opening and actions viewport views so the fixed page background is represented correctly.

## White and CTA-color revision

Owner refinement: right-align the heading text and anchor its box to the right edge of its desktop column. Closed question shapes are white with charcoal text; the open question and its connected answer body use the primary CTA fill with light text. Hovering a closed question gives it a light tint without overriding the open color. Question text is slightly smaller (fluid 16–20px); keyboard focus uses the current foreground color on either fill.


## Active text and compact contact revision

Owner correction: all disclosure shapes stay white. Only the open question text uses the CTA color; the answer and plus retain charcoal ink. Contact actions are reduced to 48px tall with 16–17px text and a 16px gap. The AI action keeps the connected silhouette with a white surface and a slowly flowing red/yellow/green gradient outline. Its CSS gradient-stop animation stops under reduced motion, leaving the multicolor outline visible. Shared chat behavior is unchanged.

The active question uses the owner's requested full brand red (`--color-primary`, #fb2c36), rather than the darkened action-color mix.
