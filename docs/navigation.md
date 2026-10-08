# Homepage navigation

Implemented locally on 2026-10-08. This is a desktop navigation extension using the existing design-system tokens. It supersedes the earlier three-link desktop header and provisional left projects CTA; those decisions remain recorded as history in [owner decisions](14-decisions.md#desktop-header-navigation-revision).

## Current behavior

At `min-width: 64rem` (1024px with the unchanged default root size), the homepage header is sticky, light and full-width. The **moriz.studio** wordmark remains on the right; the underlined, unavailable **EN** control remains on the left. The separate desktop projects CTA is removed, while **לצפיה בפרויקטים** → `#projects` remains in the hero.

Desktop links use the owner's exact wording and RTL order:

| Label | Native anchor |
| --- | --- |
| קצת עלי | `#about` |
| פרויקטים | `#projects` |
| איך מתחילים | `#getting-started` |
| שאלות תשובות | `#faq` |
| בואו נדבר | `#contact` |

The latest explicit correction overrides the earlier yellow/bold direction: links use Leon Regular (400), light-gray pills from `--color-surface`, and brand red `--color-primary` (`#FB2C36`) for the cursor glow and current-section dot. The glow's maximum red mix is 32% to preserve body-size text readability. The user-approved SVG goo filter connects the pills with a stretching neck as hover, focus or current-state gaps open; each component instance receives a unique filter ID. Keyboard focus uses an underline inside the filtered silhouette so it stays visible.

Links remain native anchors. `aria-current="location"` follows the tracked sections in page order, independently of menu order: Projects precedes About in the page. No item is current before the first tracked target; Contact becomes current at the document bottom. Desktop scroll padding uses measured `--site-header-height` plus 16px so targets clear the sticky header.

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
