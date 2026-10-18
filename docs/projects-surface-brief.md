# Projects surface brief

Primary targets: homepage `#projects`, `/he/projects` and `/he/projects/[slug]`.
References: owner-selected basement.studio capture in `docs/research/assets/mobbin-projects-2026-10-07/d01-basement-studio.jpg` for rows; `/Users/morzeevi/Desktop/Screen Recording 2026-10-08 at 19.06.38.mov` showing the LAM website for the latest whole-canvas scroll transition.
Scope: extend the established site; preserve its typography, palette, Hebrew direction and other sections. No new visual identity. Use the owner's existing project inventory provisionally; final order, imagery and four questions/answers await owner data.

## Direction contract

THESIS: Give each project a generous editorial row, making the work itself the main visual. Follow the owner's supplied reference directly.

OWN-WORLD: Existing dark/light palette, Danidin headings, Leon text, squared media frames, fine separators and outlined links. No invented project art or claims.

STORY: Visitors scan the project name and brief, expand four details, then follow a clear link to its dedicated page.

FIRST VIEWPORT: Large section heading beside an All Projects link over a full-width rule. Desktop: name right, description and accordion middle, large 16:9 media frame left. Mobile: heading and link wrap; each project has name, image, description, four questions and project link in one column. The All Projects collection and dedicated pages carry the same static dark surface with back navigation.

FORM: The owner’s 2026-10-08 LAM video reference supersedes the earlier section-only, light-body and timing-only rules. The whole homepage canvas and sticky header fade together from existing light (`#fbfbff`) to charcoal (`#262626`), with Projects transparent and no section rectangle or gradient mask. Entry runs from the section top at 85% to 40% of viewport height; exit runs from its bottom at 60% to 15%. Smoothstep scroll targets use 100ms exponential settling in a bounded animation-frame loop that stops at rest and suspends settling while the document is hidden. Resize/content-height changes refresh geometry; deep-link restoration is immediate. Primary/secondary foregrounds track contrast; light-ground dialog/media controls retain local colors. Reduced motion switches immediately between binary states; SSR/no JavaScript stays light with native navigation. Three owned body variables and the backdrop data attribute restore on unmount/route changes. Standalone project pages stay dark. Preserve reference-derived rows, four details, navigation, Party Mode, palette/type tokens and the corrected label וורדעל.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

No DESIGN.md predates this local extension; the established site's direction is retained and recorded in this brief. No shipping rasters are introduced; the research capture is a reference only.

Latest finish review: **ship** for the background-transition extension, with no material fixes across seven valid desktop/mobile/reduced-motion captures. Local contrast, transition, cleanup and native-navigation checks pass. Owner visual acceptance remains pending; no publication is authorized.

## Homepage project stack refinement 11 October 2026

The current homepage uses numbered sticky project headers above scrolling project bodies. At desktop widths of 64rem and above, the Projects heading and project headers reserve the measured navbar height while the navbar is visible. When its existing `data-header-hidden` state activates, the stack pins to the viewport top, removing the strip where scrolling media previously appeared above the heading. Upward scrolling or keyboard focus restores the navbar clearance. The shared navbar measurement and animations remain unchanged; narrower layouts retain their existing top positioning.

Header descriptions use the existing 20px `--text-body-lg` token and full `--project-foreground`, rendering white on the dark Projects surface while retaining readable contrast during the canvas transition. The existing ResizeObserver continues to measure wrapped project headers. Project copy, media links and the collection and case study layouts are preserved.

Validation: all twelve header-scroll and project-backdrop tests pass, including navbar return by keyboard, wrapped descriptions, reduced motion, no JavaScript and 390/980/1024/1440px layouts. Desktop and mobile captures were visually reviewed; lint, TypeScript and diff checks pass. The refinement is available locally and has not been published.

## Dedicated case studies — 12 October 2026

Mode: Experience. This extension applies to `/he/projects/[slug]` and private CMS
previews. The earlier static-dark direction for this surface is superseded by
the owner's choice to follow the existing light/dark theme. Homepage and collection
composition remain unchanged.

The owner's two supplied editorial-gallery references guide the media rhythm:
an independent scrolling gallery, varied image widths, staggered pairs and deliberate
white space. The information panel occupies roughly one quarter of desktop width
at the logical start (right in Hebrew, left in English), sticky 32px from the top.
Its height is bounded to the viewport, with internal scrolling for long information.
Below 1024px it becomes ordinary flow above the gallery. Danidin titles, Leon copy,
fine rules, numbered accordion rows and restrained brand-yellow controls extend the
existing graphic language. Native exclusive accordions preserve all case-study copy.
The public case-study header is removed; its back link and shared light/dark toggle
sit on one row inside the information panel above the title, with 24px separation.
Gallery images and videos use the shared `--radius-md` corner token.
The gallery-column return link
remains at the end of the case study; private previews omit both navigation links.
For local gallery review, `?gallery=demo6` repeats the cover six times using full,
centered, staggered-pair and end-aligned placements. This development-only view
preserves the saved CMS content and normal project URL.
The owner's Osmo video reference and follow-up request for a visible image reveal
add a once-per-image mask opening from top to bottom with a 24px upward arrival.
The entrance uses 1.5 times the shared slow duration (900ms) and the shared ease,
100ms queue interval and a 300ms maximum wait. Images trigger at 80% of viewport height;
the information panel remains steady. Already-passed media, keyboard-focused images,
reduced-motion preferences and no-JavaScript rendering preserve immediate access.
The observer disconnects on unmount and active animations are cancelled; changing
to reduced motion also settles all media immediately. Desktop light/dark and mobile
captures plus motion recordings are in `.impeccable/review/project-motion`.
Both targeted navigation tests pass, including theme switching, shared corners,
scroll reveal completion, modal focus restoration and the sticky panel. Lint and
TypeScript checks pass; the no-JavaScript gallery was also checked in Chrome.
On public case-study pages below 1024px, floating actions become 44px icon-only
controls in the logical-end gutter. Accordion summaries and answers reserve 24px
plus the device safe area at that edge to keep text and plus/minus controls clear.

CMS media blocks control logical alignment and spacing with optional JSON metadata;
legacy blocks keep their existing defaults. The cover appears first at full gallery
width, followed by media in authored order. Captions stay beside their images. Images
open a native modal viewer with previous/next, captions, counter, Escape and restored
focus. Direct original-image links remain usable without JavaScript. Private media
delivery and publication rules are unchanged; no new artwork or project claims are
introduced. English layout is supported through logical CSS; the English route stays disabled.

Validation: lint, TypeScript and production build pass. Two targeted CMS tests cover
content validation and the complete publishing flow, including reordered layout and
spacing persistence, media sizes, mobile action clearance, viewer keyboard bounds,
Escape and focus restoration, no-JavaScript accordions/source links, and image failure
before hydration. All twelve existing navigation tests pass. Responsive checks cover
320/390/768/1024/1440px in both themes, short viewport panel fit and the left-hand LTR
panel. Eight review captures are recorded in `.impeccable/review/project-detail`.
The changed-UI detector returned no findings before the final mobile clearance fix.
The finish reviewer's follow-up verdict is **ship** for the mobile clearance fix:
both valid 390px captures show complete answers and unobstructed minus controls,
with floating actions available and no regressions introduced by the fix. This
scoped follow-up does not constitute a new full-surface audit.
The implementation is local and has not been published.

Sticky correction: the sidebar spans the complete desktop case-study grid,
including the return-navigation row and bottom clearance. Its first media row
has a viewport-based minimum height, so a single-image gallery cannot leave
the panel with no sticky travel. Once pinned, the panel remains at 32px through
the document's final scroll position; the footer sits in the gallery column.
Mobile keeps ordinary flow.
The targeted navigation regression covers short and long galleries, both themes,
RTL/LTR, 1000px/500px viewport heights and the mobile fallback.
The correction's scoped finish-review verdict is **ship**: three valid captures
confirm the desktop 32px pin, ordinary mobile flow and retained navigation,
actions, typography, themes and direction, with no material fixes requested.

System comparison: `PRODUCT.md`, `docs/09-design-system.md`, the shared tokens, font
loaders, foundations and theme rules were checked against the finished components.
Brand primitives, Danidin/Leon, the 2rem logical container gutters and existing theme
roles remain intact; case-study title metrics and media spacing are local surface
choices. No new `DESIGN.md` or system sidecar is created for this ordinary extension.
Pre-existing documentation drift remains: the foundation guide omits the already
implemented liquid radius and public theme roles, and the historical direction above
still describes static-dark case studies. This section supersedes that surface
direction; shared system files are preserved.

## Projects page (archive) — 13 October 2026

Case-study background refinement, 18 October 2026: the page wrapper is transparent
over the shared homepage canvas and its existing site-wide grain. It follows the
same light/dark background colours. CMS-selected sidebar colours and their local
grain remain scoped to the information panel.

The All Projects collection is replaced by an editorial index:
- a typographic hero
- sticky category filters and a standard / compact / editorial layout switch
- whole-card links with a hover/focus information layer
- a primary-colour contact card inside the grid
- the site footer's contact form

It follows the site's light/dark theme like the case studies. The grid compositions are configured in `src/components/projects-grid-config.ts`. Decision record: `docs/14-decisions.md` § "Projects page: editorial index…". Research: `docs/research/projects-page-mobbin-2026-10-12.md`. A development-only fixture (`/he/projects?demo=1`) fills the grid for layout checks; it never runs in production.
