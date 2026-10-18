# Hero showreel video

Implemented 2026-10-09 on the `scaling-element-on-scroll-gsap-flip` branch, replacing the nine-image hero slideshow. The reference is Osmo's "Scaling Element on Scroll (GSAP Flip)": a small media box in the hero that grows into a large box below as the page scrolls.

## Media

The source is the owner's placeholder `magnific_create-a-show-reel…_55548.mp4` (1764×1176, 3:2, 13 MB). It is re-encoded with ffmpeg to `public/videos/hero-showreel.mp4` (H.264, CRF 26, no audio, `+faststart`, ~2.7 MB), with a JPEG poster from 0.5 s at `public/videos/hero-showreel-poster.jpg`. Replace both files to swap the showreel; keep the 3:2 ratio or update `aspect-ratio` on `.hero-video-slot` and `.hero-video-end`.

## Behavior

- The hero lines up with the header grid. On desktop it uses the header's three columns: the menu's measured width in the middle (`--site-nav-inline-size`, written by the liquid navigation beside `--site-header-height`) and the same `--space-6` gap. The heading spans the right and middle columns in the top row. The description and projects CTA sit at the bottom of the first viewport on the right, with the CTA directly below the description; the video fills the left column. On mobile the heading, full-width video, **גללו לגלות** scroll cue and logos stack. The description and projects button are hidden; the cue links to `#advantages`. The video waits for a tap and does not grow on scroll.
- The hero slot (`.hero-video-slot`) is a 3:2 block; the video is named by `aria-label` ("שואוריל — עבודות נבחרות").
- The video lives in an absolutely positioned target inside the slot, so growing never shifts layout. The pause button scales with the target (container query units, 24 px minimum) so it fits the small mobile video.
- An empty end slot (`.hero-video-end`) follows the opening hero grid: full container width, 3:2, capped at `100svh` minus `--space-16`. Excess height is cropped by `object-fit: cover`.
- Updated 2026-10-18 following the owner's correction: the logo carousel stays in its original last row of the opening hero grid, visible in the first viewport. The video's existing scrubbed timeline translates the strip downward in sync with the video, keeping it below the video during growth and `--space-16` below it when fully expanded. Reverse scrolling returns the strip to its exact initial position. The expansion stage reserves the strip's height through `--hero-logo-height` so it never overlaps the following section. Resizing and font loading remeasure both elements. On mobile, with reduced motion or without JavaScript, the strip stays in its original grid row without translation or extra reserved space.
- `Flip.fit(target, endSlot, { scale: false })` on a scrubbed ScrollTrigger runs from scroll 0 (`clamp(top bottom)`, since the corner slot is already in view at load) to the end slot's center reaching the viewport center. Width/height animate (not scale), so the corner radius and pause button stay undistorted. The timeline is rebuilt after `document.fonts.ready` and a debounced resize, because Flip measures both slots when it builds.
- Playback: muted, looping and inline. It plays only while visible, the tab is shown and the pixel opening is not active. The pause/resume button travels with the video.
- Reduced motion: no autoplay (poster shown, the button can start it) and no scaling. The scroll effect is keyed on the component's own reduced-motion state rather than `gsap.matchMedia()`: a GSAP matchMedia change reverts and refreshes every ScrollTrigger and dropped the reader to the top of the page.
- With reduced motion or without JavaScript (no `data-pixel-reveal` on `<html>`), `.hero-video-stage` is `display: none`, so no empty end slot is left. The timeline is also rebuilt when `data-pixel-reveal` changes, since client navigation sets it after first render.
- The pixel opening ignores the video's own `resize` event; see [pixel opening](pixel-reveal.md).
- The video grows from its corner slot toward the full-width end slot. Its existing animation path through the opening hero is preserved; the logos move with its lower edge and never overlap that path.

## Implementation and verification

- [HeroVideo](../src/components/hero-video.tsx) and [styles](../src/components/hero-video.module.css); slot and end-slot layout in [wireframe.css](../src/styles/wireframe.css); end slot markup in the [homepage](../src/app/[locale]/page.tsx).
- GSAP (`gsap` ≥ 3.13 includes Flip and ScrollTrigger). Cleanup kills only this component's timeline (never `ScrollTrigger.getAll()`), and late `fonts.ready` callbacks are ignored after unmount so React StrictMode cannot leave an orphan timeline.
- [Browser tests](../tests/navigation/hero-video.spec.ts) cover playback and pause, growth at 1024/1440/2048 px, the original first-viewport logo placement, logo separation throughout forward/reverse scrolling and resizing, exact return to the original position, mobile tap-to-play at 320/390 px, no horizontal overflow, reduced motion and no JavaScript. Run with `npx playwright test --config=playwright.navigation.config.ts tests/navigation/hero-video.spec.ts`.

Two Party Mode tests assumed layout coincidences that the taller hero broke: the compact-tags case now scrolls the tags themselves into view and waits for their dance, and the reduced-motion dance check polls, because media-query change events arrive at the next rendering step.
