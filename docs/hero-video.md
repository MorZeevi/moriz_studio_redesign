# Hero showreel video

Implemented 2026-10-09 on the `scaling-element-on-scroll-gsap-flip` branch, replacing the nine-image hero slideshow. The reference is Osmo's "Scaling Element on Scroll (GSAP Flip)": a small media box in the hero that grows into a large box below as the page scrolls.

## Media

The source is the owner's placeholder `magnific_create-a-show-reel…_55548.mp4` (1764×1176, 3:2, 13 MB). It is re-encoded with ffmpeg to `public/videos/hero-showreel.mp4` (H.264, CRF 26, no audio, `+faststart`, ~2.7 MB), with a JPEG poster from 0.5 s at `public/videos/hero-showreel-poster.jpg`. Replace both files to swap the showreel; keep the 3:2 ratio or update `aspect-ratio` on `.hero-video-slot` and `.hero-video-end`.

## Behavior

- The hero follows a reference corner layout. On desktop it is a 12-column grid at least one viewport tall: the heading spans the top nine columns from the inline-start (right) edge, the copy block (description and the primary projects link) sits bottom-right in six columns (at most 40rem), and the video sits bottom-left in four columns. Extra bottom padding keeps the video clear of the floating WhatsApp control in the same corner. On mobile everything stacks (heading, copy, video), and the video is 75% wide at the left so it still has room to grow.
- The hero slot (`.hero-video-slot`) is a 3:2 block; the video is named by `aria-label` ("שואוריל — עבודות נבחרות").
- The video lives in an absolutely positioned target inside the slot, so growing never shifts layout. The pause button scales with the target (container query units, 24 px minimum) so it fits the small mobile video.
- An empty end slot (`.hero-video-end`) sits at the bottom of the hero section: full container width, 3:2, capped at `100svh` minus `--space-16`. Excess height is cropped by `object-fit: cover`.
- `Flip.fit(target, endSlot, { scale: false })` on a scrubbed ScrollTrigger runs from scroll 0 (`clamp(top bottom)`, since the corner slot is already in view at load) to the end slot's center reaching the viewport center. Width/height animate (not scale), so the corner radius and pause button stay undistorted. The timeline is rebuilt after `document.fonts.ready` and a debounced resize, because Flip measures both slots when it builds.
- Playback: muted, looping and inline. It plays only while visible, the tab is shown and the pixel opening is not active. The pause/resume button travels with the video.
- Reduced motion: no autoplay (poster shown, the button can start it) and no scaling. The scroll effect is keyed on the component's own reduced-motion state rather than `gsap.matchMedia()`: a GSAP matchMedia change reverts and refreshes every ScrollTrigger and dropped the reader to the top of the page.
- With reduced motion or without JavaScript (no `data-pixel-reveal` on `<html>`), `.hero-video-stage` is `display: none`, so no empty end slot is left. The timeline is also rebuilt when `data-pixel-reveal` changes, since client navigation sets it after first render.
- The pixel opening ignores the video's own `resize` event; see [pixel opening](pixel-reveal.md).
- Known trade-off: on desktop the video grows from the bottom-left corner toward the full-width end slot, so mid-scroll it passes over the description beside it.

## Implementation and verification

- [HeroVideo](../src/components/hero-video.tsx) and [styles](../src/components/hero-video.module.css); slot and end-slot layout in [wireframe.css](../src/styles/wireframe.css); end slot markup in the [homepage](../src/app/[locale]/page.tsx).
- GSAP (`gsap` ≥ 3.13 includes Flip and ScrollTrigger). Cleanup kills only this component's timeline (never `ScrollTrigger.getAll()`), and late `fonts.ready` callbacks are ignored after unmount so React StrictMode cannot leave an orphan timeline.
- [Browser tests](../tests/navigation/hero-video.spec.ts) cover playback and pause, growth to the end slot and back at 1440 and 390 px, no horizontal overflow, and reduced motion. Run with `npx playwright test --config=playwright.navigation.config.ts tests/navigation/hero-video.spec.ts`.

Two Party Mode tests assumed layout coincidences that the taller hero broke: the compact-tags case now scrolls the tags themselves into view and waits for their dance, and the reduced-motion dance check polls, because media-query change events arrive at the next rendering step.
