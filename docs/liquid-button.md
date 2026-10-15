# Hero Liquid Button

Implemented locally on 2026-10-08. The owner authorized replacing only the hero **לצפיה בפרויקטים** CTA with the supplied Liquid Button interaction, on desktop and mobile. It remains a native `href="#projects"` anchor, with copy supplied by the existing dictionary and `data-party-react="cta"` retained for Party Mode.

## Current behavior

The owner's latest color correction supersedes the earlier gray/glow treatment. The label uses Leon Regular (400), the existing body size (`1rem`) and light `--color-text-inverse` ink. The icon square, label and bridge use the existing red CTA token `--color-action-primary`, preserving readable contrast. There is no cursor glow, gradient or hover shadow. The normal minimum height is `--control-height-md` (`3rem`, 48px at the default root size). The square sits on the right in RTL and on the left in LTR, with the directional SVG arrow mirrored in RTL.

At rest the gap is 2px. Fine-pointer hover and visible keyboard focus stretch it to `1.35em`, retaining a connected goo neck. The link owns a unique `useId` SVG filter, independent of the navbar filter; its blur follows the gap from 3.5 to 7. Keyboard focus adds a visible underline inside the filtered label.

Pressing returns the gap to 2px and uses the darker red `--color-action-primary-hover` token. Touch receives pointer-press feedback and activates the same native destination. Reduced motion keeps the connected 2px silhouette static, removes transitions, and retains the focus underline. The anchor remains usable with JavaScript disabled.

The hero reserves inline-end clearance for the floating WhatsApp control, capped at 25% of the available width so enlarged text can still fit. The label can wrap; control height can grow with text. This extension retains the incumbent palette, fonts and layout foundations and uses the shared `--radius-liquid` (`0.72rem`) corner token.

The homepage all-projects link shares the liquid geometry with a secondary yellow fill and charcoal text. Its pressed fill uses `--color-action-secondary-hover`. `LiquidLink` accepts `variant="primary" | "secondary"` (primary by default) and `navigation="native" | "client"` (native by default); the collection link uses Next.js client navigation while the hero remains a native anchor. Each instance has its own filter.

## Implementation

- Since 2026-10-15 the component lives in the design-system kit: [react/liquid.tsx](../design-system/react/liquid.tsx) renders the native anchor, directional SVG and instance filter, and [js/liquid-motion.js](../design-system/js/liquid-motion.js) interpolates blur during transitions and stops after a bounded 900ms window; it removes listeners, animation frames and pressed state on cleanup or motion-preference changes. Cursor tracking has been removed. [liquid-link.tsx](../src/components/ui/liquid-link.tsx) is the site's thin wrapper that keeps the `navigation` prop.
- The `.liquid` rules in [css/components.css](../design-system/css/components.css) own geometry, red CTA colors, focus, press and reduced-motion states. Per-instance overrides use `--liquid-height`, `--liquid-fill`, `--liquid-pressed-fill` and `--liquid-ink` (formerly `--lb-*`).
- [Homepage](../src/app/[locale]/page.tsx) supplies the hero label, `#projects` destination and Party Mode hook. [wireframe.css](../src/styles/wireframe.css) supplies hero spacing and inline clearance.

## Validation and review

The six tests in [liquid-link.spec.ts](../tests/navigation/liquid-link.spec.ts) pass. They cover the secondary client-navigation link and native anchor activation, Leon 400, RTL arrow/placement, independent filter motion, hover/press states, keyboard activation and visible focus, reduced motion, widths 320/390/1024 at normal and 200% text size, actual CDP touch events, no JavaScript and LTR arrow behavior. Run them with `npx playwright test --config=playwright.navigation.config.ts tests/navigation/liquid-link.spec.ts`.

The existing five navbar tests, 16 development Inspector tests and final production Inspector test (1/1) also pass. TypeScript and the final production build pass; the changed hero/button files pass lint. Whole-project lint remains blocked by unrelated concurrent admin/project component errors. The final production check verifies native hero navigation and the absence of development Inspector/source metadata/chunks; a targeted no-JavaScript/LTR retest also passes after the final RTL selector adjustment.

An independent reviewer accepted the initial gray/glow hero-button implementation without material fixes. The later red/no-glow correction uses the existing CTA tokens and was checked with the updated browser tests and desktop/mobile captures. The Impeccable launcher/engine was unavailable; manual craft checks were performed. Owner visual acceptance has not been recorded, and no deployment or publication was performed.

Homepage refinement verification, 2026-10-08: all six liquid-link cases and five navigation cases pass after updating the expected size, menu order and resize focus destination. Browser checks can use `NAVIGATION_TEST_PORT=3108` to isolate the worktree preview. TypeScript, targeted lint and the production build pass. Desktop/mobile captures confirm the shared corners and secondary color.
