# Hero Liquid Button

Implemented locally on 2026-10-08. The owner authorized replacing only the hero **לצפיה בפרויקטים** CTA with the supplied Liquid Button interaction, on desktop and mobile. It remains a native `href="#projects"` anchor, with copy supplied by the existing dictionary and `data-party-react="cta"` retained for Party Mode.

## Current behavior

The owner's latest color correction supersedes the earlier gray/glow treatment. The label uses Leon Regular (400), the existing small body size (`0.875rem`) and light `--color-text-inverse` ink. The icon square, label and bridge use the existing red CTA token `--color-action-primary`, preserving readable contrast. There is no cursor glow, gradient or hover shadow. The normal minimum height is `--control-height-sm` (`2.75rem`, 44px at the default root size). The square sits on the right in RTL and on the left in LTR, with the directional SVG arrow mirrored in RTL.

At rest the gap is 2px. Fine-pointer hover and visible keyboard focus stretch it to `1.35em`, retaining a connected goo neck. The link owns a unique `useId` SVG filter, independent of the navbar filter; its blur follows the gap from 3.5 to 7. Keyboard focus adds a visible underline inside the filtered label.

Pressing returns the gap to 2px and uses the darker red `--color-action-primary-hover` token. Touch receives pointer-press feedback and activates the same native destination. Reduced motion keeps the connected 2px silhouette static, removes transitions, and retains the focus underline. The anchor remains usable with JavaScript disabled.

The hero reserves inline-end clearance for the floating WhatsApp control, capped at 25% of the available width so enlarged text can still fit. The label can wrap; control height can grow with text. This extension retains the incumbent palette, fonts and layout foundations and establishes no global button style or new token set.

## Implementation

- [liquid-link.tsx](../src/components/ui/liquid-link.tsx) renders the native anchor, directional SVG and instance filter. Its effect interpolates blur during transitions and stops after a bounded 900ms window; it removes listeners, animation frames and pressed state on cleanup or motion-preference changes. Cursor tracking has been removed.
- [liquid-link.module.css](../src/components/ui/liquid-link.module.css) owns geometry, red CTA colors, focus, press and reduced-motion states.
- [Homepage](../src/app/[locale]/page.tsx) supplies the hero label, `#projects` destination and Party Mode hook. [wireframe.css](../src/styles/wireframe.css) supplies hero spacing and inline clearance.

## Validation and review

The five tests in [liquid-link.spec.ts](../tests/navigation/liquid-link.spec.ts) pass. They cover native anchor activation, Leon 400, RTL arrow/placement, independent filter motion, hover/press states, keyboard activation and visible focus, reduced motion, widths 320/390/1024 at normal and 200% text size, actual CDP touch events, no JavaScript and LTR arrow behavior. Run them with `npx playwright test --config=playwright.navigation.config.ts tests/navigation/liquid-link.spec.ts`.

The existing five navbar tests, 16 development Inspector tests and final production Inspector test (1/1) also pass. TypeScript and the final production build pass; the changed hero/button files pass lint. Whole-project lint remains blocked by unrelated concurrent admin/project component errors. The final production check verifies native hero navigation and the absence of development Inspector/source metadata/chunks; a targeted no-JavaScript/LTR retest also passes after the final RTL selector adjustment.

An independent reviewer accepted the initial gray/glow hero-button implementation without material fixes. The later red/no-glow correction uses the existing CTA tokens and was checked with the updated browser tests and desktop/mobile captures. The Impeccable launcher/engine was unavailable; manual craft checks were performed. Owner visual acceptance has not been recorded, and no deployment or publication was performed.
