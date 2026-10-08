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
