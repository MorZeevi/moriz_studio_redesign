# Creative About me research for the homepage

Research date: 10 October 2026. Owner request (2026-10-10): redesign the homepage About (קצת עליי) section, using the portrait from the בואו נדבר button and the supplied three-paragraph biography with its bold phrases kept; research inspiration for a creative About section, then build the strongest direction as a local trial.

**Recommendation: קשב — the bio demonstrates the method it describes.** Scroll moves the reading focus through the three paragraphs, and each of the owner’s bold phrases receives a yellow highlighter stroke as it is read. The portrait cutout from the contact button sits on the brand-yellow shape and stays beside the text on desktop. It is implemented as a local trial for visual acceptance.

This report adds a creative and interactive layer to the [20 classic About references](about-me-portfolios-2026-10-10.html) captured earlier the same day; those layouts are not repeated.

## Why this direction

- The copy claims methods from attention retention, gradual journeys and smart content division; the section shows them on her own words instead of describing them.
- The owner’s bold phrases already mark what matters, so the interaction adds emphasis without new content or invented claims.
- Text is never hidden: unfocused paragraphs keep at least 4.5:1 on the canvas (the large bold phrases at least 3:1 over the marker), and without JavaScript or with reduced motion every phrase is drawn.
- One signature interaction, matching the owner’s ‘bold but readable’ choice; the yellow ties to the header avatar and the brand secondary colour.

## Alternatives

- **Portrait mask reveal.** The portrait opens from the yellow shape as the section enters (Sirnik-style reveal applied to the image). More cinematic, but it spends the interaction on the image rather than the message, and the current 600px portrait limits its scale.
- **Clickable personal items.** The owner’s backlog idea (2026-10-09). Deferred by the owner on 2026-10-10 until items and meanings are supplied; the layout leaves room beside the portrait.

## References

| Reference | Pattern | Observed | Takeaway | Fit for Moriz |
| --- | --- | --- | --- | --- |
| [Sol (XKM Studio)](https://www.awwwards.com/inspiration/scroll-based-text-highlight-sol) ([capture](assets/about-me-creative-2026-10-10/sol.jpg)) | Scroll-based text highlight | A long paragraph sits over a dark atmospheric portrait; words already read stay dim while the current sentence turns fully white. Tagged GSAP, scroll, highlight. | Progressive emphasis turns reading into the interaction itself. | Primary mechanism reference. Moriz keeps every word readable and highlights only the owner’s bold phrases. |
| [Eduard Bodak — Portfolio](https://www.awwwards.com/inspiration/highlight-benefit-on-scroll-eduard-bodak-portfolio) ([capture](assets/about-me-creative-2026-10-10/bodak.jpg)) | Highlight benefit on scroll | A ruled list of benefits on black; the row at the reading line brightens while the others remain grey. | A single active item at the eye line is enough focus; the rest can stay quietly legible. | Reference for paragraph-level focus on desktop. |
| [Sirnik](https://www.awwwards.com/inspiration/about-section-sirnik) ([capture](assets/about-me-creative-2026-10-10/sirnik.jpg)) | About section with text reveal | A studio statement in large sans type on black, revealed line by line on scroll. Tagged scroll animation, text reveal, minimal. | A studio-voice paragraph can carry an About section on typography and motion alone. | Supports a large reading size; the reveal itself is not used, so text never waits to appear. |
| [Nephew Media](https://webflow.com/made-in-webflow/website/highlight-text-on-scroll) ([capture](assets/about-me-creative-2026-10-10/webflow.jpg)) | Highlight text on scroll (Webflow clone) | Large grey paragraphs on black; the line at the centre of the viewport lights up as it is reached. | Tie the effect to the viewport centre so it follows the visitor’s own pace. | Confirms the eye-line trigger used for the focus calculation. |
| [Scroll Reveal Words (Zeroqode)](https://www.framer.com/marketplace/components/scroll-reveal-words/) ([capture](assets/about-me-creative-2026-10-10/framer.jpg)) | Sticky word highlight band | A sticky band where the current word lights up while the list scrolls past dimmed; includes a screen-reader fallback. | Keep the full text available to assistive technology regardless of the visual state. | Accessibility reference; the Moriz text is ordinary DOM text in every state. |
| [Regina Musi](https://www.awwwards.com/inspiration/about-me-section-regina-musi-portfolio-website) ([capture](assets/about-me-creative-2026-10-10/regina.jpg)) | Editorial About me with numbered facts | A large serif ‘About me’ heading, three numbered short statements (love, past experience, approach) and a black-and-white photograph framed by landscape. | Short structured statements plus one honest photograph read as confident and personal. | Typographic confidence reference; Moriz keeps the owner’s continuous paragraphs. |
| [Dongkyu Lee](https://www.awwwards.com/inspiration/interaction-dongkyu-lee-work-overview-1) ([capture](assets/about-me-creative-2026-10-10/dongkyu.jpg)) | About as an interactive card | A calm card with columns (‘Hello, I’m Dongkyu’, ‘I design’, ‘Let’s connect’); secondary content fades in on interaction. Tagged interaction, transition, microinteraction. | Microinteractions can stay small and still feel crafted. | Restraint reference: one interaction, done carefully. |
| [Freshman](https://mobbin.com/sites/sections/cc46fe95-d2fb-46a6-927a-96c9bc6d5ecc) ([capture](assets/about-me-creative-2026-10-10/freshman.jpg)) | Oversized name + small black-and-white portrait | A huge mixed sans/serif name, one short line of positioning, and a small monochrome portrait below. | A modest black-and-white portrait works when the typography carries the scale. | Supports keeping the 600px monochrome cutout at a moderate size. |
| [Savor](https://mobbin.com/sites/sections/8691b8cf-86d0-4134-b528-d806561b518b) ([capture](assets/about-me-creative-2026-10-10/savor.jpg)) | Large heading offset against a compact paragraph | A large serif ‘Who we are’ set against a narrow paragraph, with candid photographs below. | Asymmetry between heading, text and image gives a restrained section presence. | Composition reference for the two-column split. |

From the baseline report: **Dennis Snellenberg**, asymmetric portrait composition with a short client-facing paragraph.; **Adham Dannaway**, cutout portrait beside a compact bio.; **Seán Halpin**, distinctive portrait shape that makes the section feel warm.

## Trial

Screenshots of the local trial: [trial-desk-light-2.jpg](assets/about-me-creative-2026-10-10/trial-desk-light-2.jpg), [trial-desk-dark-1.jpg](assets/about-me-creative-2026-10-10/trial-desk-dark-1.jpg), [trial-mobile-1.jpg](assets/about-me-creative-2026-10-10/trial-mobile-1.jpg).

Files: [about-me.tsx](../../src/components/about-me.tsx), [about-me.module.css](../../src/components/about-me.module.css), [he.ts](../../src/i18n/dictionaries/he.ts), [about-me.spec.ts](../../tests/navigation/about-me.spec.ts).

## Method

Element pages captured headlessly in Chrome at 1440×900 on 2026-10-10 and visually inspected; Mobbin section previews downloaded from Mobbin. Some captures still show a cookie notice. Awwwards entries are video previews of a single element, so each description covers the captured frame and the element's stated tags, not a full-site audit. Descriptions paraphrase; takeaways are design judgments. The 20 classic layouts in the baseline report are not repeated.
