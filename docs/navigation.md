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

Below the desktop breakpoint, the owner's approved full-screen mobile navigation (2026-10-19) replaces the drawer. The borderless 48px hamburger uses the supplied 32px SVG line morph to an X over 200ms. The full-viewport yellow surface (`--color-secondary`, dark palette ink in both themes) grows through the same merging rounded windows as the homepage opening, completing in 350ms. The six RTL links rise by 8px during the reveal: a 125ms initial delay, 150ms ease-out and 15ms stagger, finishing with the windows. Closing hides the links and reverses the window timeline at a faster rate, completing in 240ms. The item entrance resets on close/reopen; keyboard focus or reduced-motion changes immediately reveal every link. There is no startup hold. The mobile header and menu header use an 8px gap between the theme control and hamburger, following the owner's spacing refinement. The menu retains the wordmark, theme control, shared 32px gutters, safe-area clearance and unavailable EN; short/landscape screens scroll internally with the close control pinned at the top.

Mobile links are derived from `navigation.desktopLinks` followed by `navigation.contactLink`: **פרויקטים → קצת עלי → איך מתחילים → שאלות תשובות → אבחון דיגיטלי → בואו נדבר**. They preserve `anchorHref` destinations on Home and the project archive. Ordinary link activation waits for the closing animation before following its native URL; modified clicks retain browser behavior. The diagnostic is only linked to, with no product changes.

The native modal owns focus containment, Escape dismissal and background scroll lock through the exit. Repeated toggles reverse the current timeline without snapping. The trigger enables after hydration so the first available tap is handled; closing restores trigger focus. Entry to desktop immediately closes the menu and focuses Projects. A mobile resize settles the transition and rebuilds the window grid; reduced motion bypasses the reveal and icon transitions. Animation failures/failsafes settle to a usable state. Timers, animations, listeners and pending navigation frames are cleaned up.

## Implementation

Desktop header layout uses a three-column grid with equal outer tracks. The liquid menu stays centered across the entire `.hero-shell.site-header-inner`, including hover/current-section expansion, while the text wordmark and language link align to opposite outer edges. Mobile keeps its existing header flex layout; the open menu mirrors it inside the modal. The shared `StudioLogo` displays the exact lowercase text `moriz.studio` without a space, using a local Roboto Flex variable subset at the existing responsive wordmark size. The `moriz.` prefix rests at bold 700 and responds to pointer pressure; `studio` remains regular 400 even during hover. Its direction is explicitly LTR within the Hebrew layout, and its reserved width keeps the menu centered during pressure. It also appears in the homepage footer, project collection and project-detail home links. Every instance links natively to `/${locale}#top`; the locale layout sets `id="top"` on the body. This latest correction supersedes the earlier SVG and all-regular Leon treatments; the converted SVG remains available as an asset. See [wordmark source, font and behavior](wordmark.md).

- [liquid-navigation.tsx](../src/components/liquid-navigation.tsx) and [liquid-navigation.module.css](../src/components/liquid-navigation.module.css) own the SVG filter, pills, section state and pointer glow; [navigation.tsx](../src/components/navigation.tsx) integrates desktop navigation with `MobileNavigation`.
- [Homepage](../src/app/[locale]/page.tsx) and [wireframe.css](../src/styles/wireframe.css) own the header arrangement, sticky desktop layout and scroll padding. Copy stays in the Hebrew dictionary.
- Section updates are coalesced into one requested animation frame, using a passive scroll listener, resize/hash updates and `ResizeObserver` for header/main geometry changes.
- Pointer smoothing runs during mouse hover with a 700ms fade tail, ignores touch, and stops on unmount, breakpoint or motion-preference changes. Reduced motion removes animated glow and transitions while preserving links, focus and current state. Listeners, observers and animation frames are cleaned up.

The existing palette, shared Danidin/Leon font families, Party Mode, Projects and content structure are unchanged. Roboto Flex is scoped to the wordmark; this extension establishes no new system-wide design rule or token set.

## Validation and review

The latest wordmark motion correction passed nine navbar/wordmark Playwright tests, TypeScript, production build, two-file targeted Biome checks and diff whitespace checks. Earlier validation passed all 16 development Inspector tests, the production Inspector test (1/1) and full navbar lint; the Inspector tests were not rerun for the motion correction. The corrected pressure field and the independent review of six motion-fidelity fixes are recorded in [the wordmark guide](wordmark.md). Navigation/wordmark command: `npx playwright test --config=playwright.navigation.config.ts`; existing checks: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:inspector`, `npm run test:inspector:production`.

The independent reviewer visually inspected the local `.impeccable/review/` captures `desktop`, `mobile`, `header-1440`, `header-1280`, `header-1024`, `active-hover`, `header-active-hover`, `header-keyboard-reduced`, `party` and `mobile-menu` and accepted rendering/source behavior at the requested scope. The review's documentation-persistence finding is resolved by this guide and the current guidance in [PRODUCT.md](../PRODUCT.md). Impeccable launcher/engine was unavailable, so the detector could not run; manual craft checks were performed. Owner visual acceptance has not been recorded. No deployment or publication was performed.

## Page-order refinement, 2026-10-08

The owner’s small-changes request supersedes the earlier link order. Desktop RTL reading order is now **פרויקטים → קצת עלי → איך מתחילים → שאלות תשובות → בואו נדבר**. Destinations, centered composition, liquid interaction and scroll tracking remain unchanged. Closing the mobile drawer on entry to desktop returns focus to the first desktop link, Projects. The existing three mobile links already follow page order. Browser tests can target an isolated preview with `NAVIGATION_TEST_PORT=3108`; the default remains 3000.


## Mobile implementation, 2026-10-19

`mobile-navigation.tsx` and its CSS Module own the four phases (closed/opening/open/closing), native dialog and reversible Web Animations timeline. Each cell's `endDelay` pads its effect to the master duration, preserving the stagger when playback reverses. The shared `liquid-window-grid.ts` and `LiquidWindowMask` reuse the loader's seven/nine rows, 1.8/1.4 cell ratios and goo-filter geometry. The menu uses a 110ms random spread and 240ms windows; the loader keeps its default 620ms spread and 460ms windows; the loader retains its own session, bootstrap, font wait and interruption rules and remains skipped on mobile.

`@/components/ui/menu-toggle` is a controlled native button (`open`, `onOpenChange`, normal button/ref/ARIA props, optional `strokeWidth` and `iconClassName`). Its supplied SVG paths/dashes/rotation are retained; the hidden checkbox is replaced with button semantics. `menu-toggle-demo.tsx` provides an isolated client example, without adding a public route. This repo already has TypeScript, Tailwind 4 and `@/components/ui` mapped to `src/components/ui`; no shadcn initialization or stylesheet reset is required. The standard `cn` helper uses `clsx` and `tailwind-merge`.

Focused browser coverage in `mobile-navigation.spec.ts` exercises phone/tablet/landscape geometry, reversed transitions, focus containment/restoration, scroll locking, same-page and cross-page destinations, reduced motion, theme switching and animation failure. Existing navigation, theme and pixel-opening tests cover integration and desktop/loader regressions.


Mobile validation, 2026-10-19: all 25 focused mobile-navigation, desktop-navigation and pixel-opening browser tests pass, including the exit's intermediate stagger, interrupted reversal and reduced-motion hydration. Lint (358 files), TypeScript and whitespace checks pass. Eight viewport/theme cases were captured, including 320px, tablet, short landscape and 1024/1440px desktop; the independent reviewer scored the closing-timing correction resolved. Separate wordmark checks (4) and the mobile keyboard/theme integration check pass. The broader pre-existing theme suite still has six failures around grain expectations, duplicate project links, Projects fade geometry and early theme-control hydration; those were not changed as part of this menu task. The design detector could not run because its local executable returned permission denied. No publication was performed.
