# Scrolling reviews

Owner request, 2026-10-18: keep the reviews in view while scrolling advances through all five, then continue down the page. The existing review copy, layout, index, arrows and read-more controls remain.

At desktop widths of 1024px and above, the reviews use native CSS sticky positioning within a local scroll track. Each review receives an equal portion of the track (55% of the viewport height, at least 280px). Scrolling forward selects 1 → 5; scrolling backward reverses that sequence. After the fifth step the section scrolls away normally. No wheel or touch events are intercepted and no global GSAP timelines are changed.

Clicking an index entry or using the arrow/keyboard controls while the section is sticky moves to the matching scroll step, so later scrolling continues from that review. Selection still clears the expanded state and keeps the current tab, panel, counter and live announcement synchronized.

Below 1024px, with reduced motion, or when the review panel is too tall to fit with 48px clearance above and below, the section uses its existing manual controls without reserved scroll space. Resizing, font loading and expanded review heights remeasure the local track. Without JavaScript all reviews remain visible in normal flow. Reduced motion also removes panel transitions.

Browser coverage: `tests/navigation/testimonials.spec.ts` checks all five steps in both directions, stable position and release, manual/keyboard synchronization, mobile/reduced-motion/short-viewport behavior and no-JavaScript readability.
