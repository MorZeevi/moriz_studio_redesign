# Homepage navigation

Implemented locally on 2026-10-08. This is a desktop navigation extension using the existing design-system tokens. It supersedes the earlier three-link desktop header and provisional left projects CTA; those decisions remain recorded as history in [owner decisions](14-decisions.md#desktop-header-navigation-revision).

## Current behavior

Latest background correction, 2026-10-10: the homepage header is transparent and has no separate Noise canvas. The hero’s existing grain (340, 1, 0.3, 2, 22) extends upward by the measured header height to cover the initial header area. That single grain layer moves with the document; the sticky header adds no extra texture over the hero, video or later sections. The existing header measurement now updates on mobile as well as desktop. Desktop remains sticky and mobile remains in normal flow. Navigation pills and bridges retain their solid white `#fff` base and yellow hover glow. The header remains hidden during the opening reveal.

At `min-width: 64rem` (1024px with the unchanged default root size), the homepage header is sticky, light and full-width. The **moriz.studio** wordmark remains on the right. Following the owner's 2026-10-09 request, the theme toggle and the underlined, unavailable **EN** control sit beside the **moriz.studio** wordmark on the right (`.header-brand`), and **בואו נדבר** → `#contact` stands alone on the left. Following the owner's later 2026-10-09 reference, it is the secondary (yellow) pill with dark palette text with Mor's transparent cut-out portrait (`public/images/mor-avatar-cutout.webp`, decorative `alt=""`) in the round blob instead of the arrow, superseding the charcoal fill. It shares the hero's 48px geometry and liquid interaction; press uses `--color-surface-strong`. The hero retains **לצפיה בפרויקטים** → `#projects`.

Desktop links use the owner's exact wording and RTL order:

| Label | Native anchor |
| --- | --- |
| פרויקטים | `#projects` |
| קצת עלי | `#about` |
| איך מתחילים | `#getting-started` |
| שאלות תשובות | `#faq` |

Links use Leon Regular (400) and light-gray pills from `--color-surface`. The owner's latest hover-color correction uses secondary yellow `--color-secondary` (`#DDDC8C`) for the cursor glow; its maximum mix stays at 32%. The current-section dot retains brand red `--color-primary` (`#FB2C36`). The user-approved SVG goo filter connects the pills with a stretching neck as hover, focus or current-state gaps open; each component instance receives a unique filter ID. Keyboard focus uses an underline inside the filtered silhouette so it stays visible.

Links remain native anchors. `aria-current="location"` follows the four tracked sections in page order, independently of menu order: Projects precedes About in the page. No item is current before the first tracked target; FAQ is the last tracked menu item. Desktop scroll padding uses measured `--site-header-height` plus 16px so targets, including the separate contact CTA, clear the sticky header.

Below the desktop breakpoint, the existing hamburger/dialog drawer retains its three links, EN, Escape behavior and focus trap. Separate `navigation.desktopLinks` dictionary data preserves the existing `navigation.links` mobile labels and order. An open drawer closes when the viewport enters desktop.

## Implementation

Desktop header layout uses a three-column grid with equal outer tracks. The liquid menu stays centered across the entire `.hero-shell.site-header-inner`, including hover/current-section expansion, while the text wordmark and language link align to opposite outer edges. Mobile keeps its existing flex layout. The shared `StudioLogo` displays the exact lowercase text `moriz.studio` without a space, using a local Roboto Flex variable subset at the existing responsive wordmark size. The `moriz.` prefix rests at bold 700 and responds to pointer pressure; `studio` remains regular 400 even during hover. Its direction is explicitly LTR within the Hebrew layout, and its reserved width keeps the menu centered during pressure. It also appears in the homepage footer, project collection and project-detail home links. Every instance links natively to `/${locale}#top`; the locale layout sets `id="top"` on the body. This latest correction supersedes the earlier SVG and all-regular Leon treatments; the converted SVG remains available as an asset. See [wordmark source, font and behavior](wordmark.md).

- [liquid-navigation.tsx](../src/components/liquid-navigation.tsx) and [liquid-navigation.module.css](../src/components/liquid-navigation.module.css) own the SVG filter, pills, section state and pointer glow; [navigation.tsx](../src/components/navigation.tsx) integrates desktop navigation with the existing drawer.
- [Homepage](../src/app/[locale]/page.tsx) and [wireframe.css](../src/styles/wireframe.css) own the header arrangement, sticky desktop layout and scroll padding. Copy stays in the Hebrew dictionary.
- Section updates are coalesced into one requested animation frame, using a passive scroll listener, resize/hash updates and `ResizeObserver` for header/main geometry changes.
- Pointer smoothing runs during mouse hover with a 700ms fade tail, ignores touch, and stops on unmount, breakpoint or motion-preference changes. Reduced motion removes animated glow and transitions while preserving links, focus and current state. Listeners, observers and animation frames are cleaned up.

The existing palette, shared Danidin/Leon font families, Party Mode, Projects and content structure are unchanged. Roboto Flex is scoped to the wordmark; this extension establishes no new system-wide design rule or token set.

## Validation and review

The latest wordmark motion correction passed nine navbar/wordmark Playwright tests, TypeScript, production build, two-file targeted Biome checks and diff whitespace checks. Earlier validation passed all 16 development Inspector tests, the production Inspector test (1/1) and full navbar lint; the Inspector tests were not rerun for the motion correction. The corrected pressure field and the independent review of six motion-fidelity fixes are recorded in [the wordmark guide](wordmark.md). Navigation/wordmark command: `npx playwright test --config=playwright.navigation.config.ts`; existing checks: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:inspector`, `npm run test:inspector:production`.

The independent reviewer visually inspected the local `.impeccable/review/` captures `desktop`, `mobile`, `header-1440`, `header-1280`, `header-1024`, `active-hover`, `header-active-hover`, `header-keyboard-reduced`, `party` and `mobile-menu` and accepted rendering/source behavior at the requested scope. The review's documentation-persistence finding is resolved by this guide and the current guidance in [PRODUCT.md](../PRODUCT.md). Impeccable launcher/engine was unavailable, so the detector could not run; manual craft checks were performed. Owner visual acceptance has not been recorded. No deployment or publication was performed.

## Page-order refinement, 2026-10-08

The owner’s small-changes request supersedes the earlier link order. Desktop RTL reading order is now **פרויקטים → קצת עלי → איך מתחילים → שאלות תשובות → בואו נדבר**. Destinations, centered composition, liquid interaction and scroll tracking remain unchanged. Closing the mobile drawer on entry to desktop returns focus to the first desktop link, Projects. The existing three mobile links already follow page order. Browser tests can target an isolated preview with `NAVIGATION_TEST_PORT=3108`; the default remains 3000.
