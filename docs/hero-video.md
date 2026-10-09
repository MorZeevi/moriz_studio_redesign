# Hero showreel video

Implemented 2026-10-09 on the `scaling-element-on-scroll-gsap-flip` branch, replacing the nine-image hero slideshow. The reference is Osmo's "Scaling Element on Scroll (GSAP Flip)": a small media box in the hero that grows into a large box below as the page scrolls.

## Media

The source is the owner's placeholder `magnific_create-a-show-reel…_55548.mp4` (1764×1176, 3:2, 13 MB). It is re-encoded with ffmpeg to `public/videos/hero-showreel.mp4` (H.264, CRF 26, no audio, `+faststart`, ~2.7 MB), with a JPEG poster from 0.5 s at `public/videos/hero-showreel-poster.jpg`. Replace both files to swap the showreel; keep the 3:2 ratio or update `aspect-ratio` on `.hero-video-slot` and `.hero-video-end`.

## Behavior

- The hero follows the owner's mockup and lines up with the header grid. On desktop it uses the header's three columns: the menu's measured width in the middle (`--site-nav-inline-size`, written by the liquid navigation beside `--site-header-height`) and the same `--space-6` gap. The description runs from the wordmark to the middle of the menu (right column plus half the menu column; the last description sentence is bold), the video fills the left column (contact pill to the menu's left edge), the heading spans the right and middle columns in the top row beside the video, the description sits at the bottom of the first viewport with the projects CTA (CTA red with white text, down arrow) beside it in the left column (left edge on the video's, bottom on the description's last line), and the logo carousel (moved into the hero) runs full width beneath it after its rule line. On mobile everything stacks (heading, copy, video, logos), and the video is 75% wide at the left so it still has room to grow.
- The hero slot (`.hero-video-slot`) is a 3:2 block; the video is named by `aria-label` ("שואוריל — עבודות נבחרות").
- The video lives in an absolutely positioned target inside the slot, so growing never shifts layout. The pause button scales with the target (container query units, 24 px minimum) so it fits the small mobile video.
- An empty end slot (`.hero-video-end`) sits at the bottom of the hero section: full container width, 3:2, capped at `100svh` minus `--space-16`. Excess height is cropped by `object-fit: cover`.
- `Flip.fit(target, endSlot, { scale: false })` on a scrubbed ScrollTrigger runs from scroll 0 (`clamp(top bottom)`, since the corner slot is already in view at load) to the end slot's center reaching the viewport center. Width/height animate (not scale), so the corner radius and pause button stay undistorted. The timeline is rebuilt after `document.fonts.ready` and a debounced resize, because Flip measures both slots when it builds.
- Playback: muted, looping and inline. It plays only while visible, the tab is shown and the pixel opening is not active. The pause/resume button travels with the video.
- Reduced motion: no autoplay (poster shown, the button can start it) and no scaling. The scroll effect is keyed on the component's own reduced-motion state rather than `gsap.matchMedia()`: a GSAP matchMedia change reverts and refreshes every ScrollTrigger and dropped the reader to the top of the page.
- With reduced motion or without JavaScript (no `data-pixel-reveal` on `<html>`), `.hero-video-stage` is `display: none`, so no empty end slot is left. The timeline is also rebuilt when `data-pixel-reveal` changes, since client navigation sets it after first render.
- The pixel opening ignores the video's own `resize` event; see [pixel opening](pixel-reveal.md).
- Known trade-off: the video grows from the top-left toward the full-width end slot below the hero, so mid-scroll it passes over the heading and logos. The carousel is its own stacking context (`z-index: 0`) so its edge fades stay under the video.

## Implementation and verification

- [HeroVideo](../src/components/hero-video.tsx) and [styles](../src/components/hero-video.module.css); slot and end-slot layout in [wireframe.css](../src/styles/wireframe.css); end slot markup in the [homepage](../src/app/[locale]/page.tsx).
- GSAP (`gsap` ≥ 3.13 includes Flip and ScrollTrigger). Cleanup kills only this component's timeline (never `ScrollTrigger.getAll()`), and late `fonts.ready` callbacks are ignored after unmount so React StrictMode cannot leave an orphan timeline.
- [Browser tests](../tests/navigation/hero-video.spec.ts) cover playback and pause, growth to the end slot and back at 1440 and 390 px, no horizontal overflow, and reduced motion. Run with `npx playwright test --config=playwright.navigation.config.ts tests/navigation/hero-video.spec.ts`.

Two Party Mode tests assumed layout coincidences that the taller hero broke: the compact-tags case now scrolls the tags themselves into view and waits for their dance, and the reduced-motion dance check polls, because media-query change events arrive at the next rendering step.
