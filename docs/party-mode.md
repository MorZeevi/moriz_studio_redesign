# Party Mode

The second advantages card demonstrates **חוויה אינטראקטיבית ואטרקטיבית** with a NORMAL / PARTY switch. The supporting paragraph remains **מידע תומך — להשלמה**. This is a local implementation awaiting owner visual review.

## Integration

- The server homepage passes its existing content through `PartyModeProvider`; only the state, controls and effects are client components.
- `PartyModeToggle` reuses the shared Button, dictionary, Danidin font, borders, hard shadow and palette.
- `PartyModeEffects` mounts a fixed, non-interactive body portal while entering, active or exiting. It does not alter document layout or the page theme.
- `PartyAnimations` owns Web Animations, media playback, visibility/resize/motion listeners and intersection observers. React updates at phase boundaries, never per frame.
- `party-light-model` shares each cone's origin, geometry and phase with `PartyHeadingLight`, which projects color onto the original large type. Hidden decorative text copies preserve accessible heading names and selection.
- The controller samples current transforms, opacity and tag colors before reversals. It never commits animation styles to existing elements. Canceling and unmounting restores their original cascade.
- State is page-local: same-page anchors retain the party; navigation to another page or reload resets it.

## Choreography and composition

The toggle reacts immediately. A weighted 850ms drop uses a small overshoot and diminishing swing. Rotation starts at the end of the drop; reflections fade in over 300ms, beams follow 150ms later, and selected visible headings/CTA begin a very small motion. The sequence completes in approximately 1.3 seconds after the poster is available.

Switching off settles UI motion, fades beams/reflections, slows the video and retracts the cable/ball; the portal disappears after 660ms. Reversals retain their current position. A NORMAL control appears at the lower RTL inline-start corner when the main switch is outside the viewport. Keyboard focus returns to the inline switch if visible, otherwise to main content, before that control disappears.

Desktop (64rem and wider): 128–154px ball at 40% of the viewport width, 64px cable, 24 reflections and 3 beams. Compact layouts: 77px ball at 47%, 32px cable, 10 reflections and 2 lower-opacity red/yellow beams. Both positions remain slightly left of center. The existing rotating asset is unchanged; Magnific was not needed for this refinement.

The page stays light, with a 3% warm atmospheric cast. Narrow, flat colored cones replace broad pale gradients: brand red, brand yellow and the owner-selected temporary cyan (`#00c9d8`). Their independent sweeps last 24, 30 and 36 seconds. A cached luminance mask reduces lighting behind copy and controls, with an 8px edge feather. Mask geometry refreshes on scroll/layout, not on animation frames. No sound, strobes, confetti or theme switch.

Reflections vary between 3–12px, brightness and sharpness. Their coordinated orbital paths share the ball clock, with 12/24/36-second periods. Only five reflections have softer gradient edges; there are no blur filters on moving lights.

The hero H1 and advantages H2 move by approximately 2.5px/0.35°; the hero project link moves by 2px/0.7°. Projects H2 receives projected light without motion. Each reaction runs only while visible. Two research tags at a time receive red/yellow/cyan fills, with the pair moving every six seconds. Foreground/background colors switch together to preserve contrast. Body text, navigation and the logo strip retain their own behavior.

The colored tag pair dances with alternating upward hops and left/right tilts. Desktop uses 6px/±4° on a 1.2-second rhythm, three cycles per colored interval, with partners offset by 300ms. Compact layouts use 4px/±2° on a 1.8-second rhythm, two cycles, offset by 450ms. Each tag rests before its color clears. Native additive transform animations follow the existing cumulative ball clock without replacing Matter's transform variable or adding DOM nodes. The groove suspends during mouse dragging, cancels offscreen and resumes at the current phase. Switching OFF settles only the additional dance transform over 180ms; physical positions remain intact. Reduced motion has no dance.

The toggle keeps its compact 256×48px composition at normal text size. PARTY uses the accessible brand action red, light lettering, a yellow dot and a 240ms snap. Narrow/enlarged-text layouts stack the labels and move the indicator vertically; its movement stays clipped inside the control.

## Layers and cleanup

Effects use z-index 10 and pointer-events none throughout. Existing WhatsApp stays at 20, the NORMAL control at 21 and the skip link at 30. Native dialogs and the development inspector remain in the browser top layer. In development a ResizeObserver measures the inspector launcher so the off control sits above its actual wrapped height.

Hidden documents pause running animations and video; finished entrance animations stay finished on resume. Changing reduced motion cancels spatial loops and uses the still poster, 6 static reflections, 2 static beams and one fixed pair of colored tags. The toggle snap is removed. An initially reduced-motion visit downloads no video. Failed playback retains the transparent poster. A missing poster restores NORMAL with a Hebrew status message.

All animation instances, video decoding, observers, event listeners, timeouts and resize callbacks are cleaned up. There is no runtime dependency added. Large blur filters, canvas/WebGL and frame-based React state are absent.

## Media

See [asset provenance and preparation](../public/party-mode/README.md). Each browser downloads one responsive video source, not all formats. Chrome uses VP9 alpha WebM; Apple WebKit uses HEVC alpha MOV. Assets are locally served; the website has no Magnific connection or API key.

The media loop is 12 seconds at 24fps, with no audio. Light movement uses the same clock and carries its cumulative loop count, keeping the slower beam sweep continuous across video wraps. Assets are prewarmed near the switch; the detached metadata decoder is then released.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npm run test:party
```

Party tests start/reuse port 3001. If your one running Next dev server uses another port, pass it explicitly, e.g. `PARTY_TEST_PORT=3000 npm run test:party`. Next disallows two dev servers for the same worktree.

The Chrome and WebKit suite covers real video transparency and advancing playback, viewport bounds, normal-state restoration, rapid reversals, keyboard focus, initial/live reduced motion, visibility pause, failed media, route/reload reset, mobile controls/menu, resize, rotating tag pairs and their color contrast, shared heading-projection geometry, enlarged indicator bounds and conservative all-beam overlap contrast. Visual review covers 320, 390, 768, 1024 and 1440px plus enlarged layout. WebKit testing on macOS verifies the Apple decoder path; physical iPhone/Android performance remains unverified.


Refinement verified 2026-10-07: the full 30-case Chrome/WebKit suite passed; the final readability-mask adjustment passed all eight focused color/projection/reduced-motion checks, including two new overlap-contrast cases (32 distinct browser cases total). Inspector development checks (16/16), unit checks (6/6), production exclusion, lint, TypeScript and the production build pass. Touch activation works in both simulated mobile browsers; a Chromium native CDP swipe scrolls the page while Party Mode remains active. The enlarged-label check runs after hydration and verifies the compact ball retains its 77px size under 200% text enlargement. No hydration/runtime errors occurred in the batched visual review.

Dancing-tag verification, 2026-10-08: all 40 Chrome/WebKit Party Mode checks pass, including pair handoff, preservation of live physics transforms, real mouse dragging, offscreen/hidden cleanup, reduced motion and compact choreography after resize. Lint, TypeScript and production build pass. Batched review at 320/390/768/1024/1440px found all sampled tag poses contained and no horizontal overflow or runtime errors. Enlarged text was reviewed after hydration, and native Chromium touch scrolling retained active Party Mode. No assets or dependencies changed.
