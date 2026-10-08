# Text Pressure wordmark

Implemented locally on 2026-10-08 as an extension of the existing studio identity. The owner's latest correction requires the exact lowercase `moriz.studio`, without a space: `moriz.` rests at bold 700 and `studio` stays regular 400, including during pressure. This supersedes the earlier `moriz.`-only, all-regular Leon and displayed SVG treatments. The subsequent motion correction follows the owner's rejection of the initial animation.

## Source and font

The component was imported using `npx jsrepo@latest add https://reactbits.dev/r/TextPressure-TS-CSS` with jsrepo v3.8.1. [TextPressure.tsx](../src/components/react-bits/TextPressure.tsx) records the [React Bits registry source](https://reactbits.dev/r/TextPressure-TS-CSS) and [original CodePen](https://codepen.io/JuanFuentes/full/rgXKGQ). The local adaptation preserves case, renders inline spans without adding a heading, and bounds activation to the wordmark's nearby pointer field.

[TextPressure.css](../src/components/react-bits/TextPressure.css) registers the local `Roboto Flex Pressure` face from [roboto-flex-moriz.woff2](../public/fonts/roboto-flex-moriz.woff2). The wordmark-only subset was obtained from the [Google Fonts CSS source](https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap&text=moriz.studio). The bundled [RobotoFlex-OFL.txt](../public/fonts/RobotoFlex-OFL.txt) contains its copyright notice and SIL Open Font License 1.1. Runtime font loading uses the local file.

## Behavior and integration

[StudioLogo](../src/components/studio-logo.tsx) is a native Next link to `/${locale}#top`, with the accessible name `moriz.studio` and explicit LTR direction inside the Hebrew layout. The locale layout places the `top` target on the body. The component is shared by the homepage header/footer, project collection header and project-detail header; click or Enter returns to the localized homepage's exact top.

The existing `--trial-wordmark-size` and inherited surface color are retained. A hidden measurement span reserves pressure width, keeping the link bounds stable and the desktop menu centered. Visible glyph spans are hidden from assistive technology; readable text and the link's accessible name retain the whole wordmark.

On a fine hover pointer, near letters expand while far letters compress simultaneously. The registry width curve `205 - 200 * distance / radius` is clamped to Roboto Flex's actual `25..151` width axis, then blended with the normal width of 100 as proximity activates. The pressure radius is half the resting visible glyph width, with a 24px minimum; the larger hidden reserve is excluded. Resting glyph centers remain stable while the letters deform, preventing the effect from chasing its own reflow. The bold prefix's weight can increase toward 900; the suffix remains 400.

Global passive pointer tracking allows pressure just outside the link, without requiring `:hover`. Activation fades to zero across one pressure radius beyond the wordmark bounds. A shared cursor advances by one fifteenth of the remaining distance before per-character axes are calculated, and activation strength eases independently. Moving away returns to the 700/400 baseline. Frames stop when settled or inactive. Scrolling, resizing, font readiness, hidden/offscreen state, pointer cancellation and motion/pointer preference changes reset the effect; unmount removes listeners, observers and animation frames. Touch and reduced motion remain static. Server-rendered/no-JavaScript text retains the same weight split and native link behavior, and keyboard focus uses the existing visible focus treatment.

Roboto Flex is a component-specific font. The shared Danidin/Leon families, palette, design tokens, homepage content and converted SVG asset are preserved; no new global type rule is established.

## Validation and review

The motion correction passed nine navbar/wordmark Playwright tests, production build, TypeScript, two-file targeted Biome checks and diff whitespace checks. [wordmark.spec.ts](../tests/navigation/wordmark.spec.ts) verifies rendered glyph expansion/compression, reversed width axes after a left-to-right sweep and proximity outside the anchor while `:hover` is false. It also covers the loaded local font, 700/400 weight split, stable reserved width and centered navigation, native click/Enter return to scroll position zero, visible reduced-motion keyboard focus, touch and no-JavaScript links. The earlier 16 development Inspector tests and one production Inspector test passed before this motion correction and were not rerun for it.

The independent motion reviewer first requested six fidelity fixes and subsequently verified all six as resolved, returning a ship disposition scoped to those fixes. This is not a whole-page review. The current captures under `.impeccable/review/wordmark/` are `desktop-rest.png`, `desktop-pressure.png` (left pressure), `desktop-pressure-right.png`, `desktop-proximity.png`, `mobile.png` and `keyboard-reduced.png`. The Impeccable launcher was unavailable, so the detector did not run. Owner visual acceptance has not been recorded. No deployment, publication or commit was performed.
