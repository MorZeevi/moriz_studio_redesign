# Homepage pixel opening

Implemented locally on 2026-10-09, then updated to the owner-supplied `/Users/morzeevi/Downloads/pixel-reveal-nextjs_new`. The approved scope is the opening cover only, on the homepage, once per browser tab session. The existing hero heading, copy, layout and Party Mode projection remain unchanged; `WordReveal` is not included.

## Appearance and timing

The cover uses the existing secondary yellow `--color-secondary` (`#DDDC8C`). The new supplied animation replaces shrinking squares with rounded windows that grow and merge through an SVG luminance mask and goo filter. It uses the new defaults: seven rows on screens at least 640px wide, nine rows on narrower screens, width/height ratios of 1.8 and 1.4 respectively, and a quarter-height corner radius. Half-window overhangs and a final scale of 1.1 clear the viewport edges. Each instance has unique filter and mask IDs.

After fonts are ready (bounded to 800ms), the full cover holds for 300ms. Windows start randomly across 620ms and open over 460ms using the supplied easing and opacity curve. This timing supersedes the earlier doubled shrinking-pixel timing. The owner's latest correction keeps the navbar rendered immediately underneath the opening cover on desktop and mobile. It appears naturally through the opening windows, with no separate visibility delay or header animation. The cover is removed when the final window finishes, with the existing three-second deadline from pre-paint initialization and an independent CSS fallback on the entire overlay.

## Playback and accessibility

The locale layout's static first-party head script initializes the cover before paint only for the locale homepage. The `PixelReveal` client component is mounted only on that page and checks eligibility again on mount, including client navigation from project pages. Session state uses `sessionStorage['moriz:pixel-reveal']`; completion or user dismissal records `1`. Refreshes and client return skip playback. If storage is blocked, document state still prevents replay during client navigation; a full reload may play again.

Reduced motion, disabled JavaScript, hidden documents and direct section links skip the cover. `#top` is eligible. Skipped reduced-motion/section visits and visits to other pages do not consume the stored session opening. Project pages, font previews and admin have no cover.

The overlay is decorative (`aria-hidden`) and uses `pointer-events: none`. Keyboard, pointer, scrolling, hash changes, resize, motion-preference changes and hiding the tab dismiss it immediately without preventing the underlying action. It does not lock scrolling or move focus. Timers, animation frames and event listeners are cancelled on completion/unmount. The CSS fallback also clears the SVG cover if JavaScript stops during startup. Without JavaScript the cover is hidden by default.

## Implementation and verification

- [PixelReveal](../src/components/pixel-reveal.tsx) owns grid construction, playback and cleanup; [styles](../src/styles/pixel-reveal.css) contain only the supplied cover effect and its fallbacks.
- [Bootstrap](../src/lib/pixel-reveal.ts) shares the storage key and deadline and generates the static head initializer. The locale layout suppresses the intentional root-attribute hydration difference; homepage rendering and font classes are retained.
- [Browser tests](../tests/navigation/pixel-reveal.spec.ts) cover desktop/mobile, session skipping, project-first entry, reduced motion, section links, no JavaScript, blocked storage, slow fonts, interruption, the CSS fallback and pre-hydration initialization. Run with `npx playwright test --config=playwright.navigation.config.ts tests/navigation/pixel-reveal.spec.ts`.

Browser coverage includes liquid-window geometry, duration, the immediately rendered navbar beneath the cover, and the existing playback safeguards. Header visibility is also checked for reduced motion, no JavaScript, failed startup and pre-hydration initialization. Desktop/mobile intermediate captures support visual review. No dependency or publication was added.

To replay locally in the same tab, remove the `moriz:pixel-reveal` sessionStorage item and reload the homepage; a fresh browser session also plays it.
