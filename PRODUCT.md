# Product context

## Register

brand

## Users

Potential clients at existing businesses and companies with roughly 3–50 employees and a clear need. Preferred needs include learning/training and digitizing services. Product managers are the primary client-side decision-makers identified by the owner.

## Product Purpose

Moriz Studio's website should generate client enquiries, present the studio professionally, showcase selected work, build credibility, communicate combined UX/UI design and development, and support future articles/research. The primary enquiry channel is WhatsApp; the owner's target is five enquiries per 100 visits. Tracking definitions remain undecided.

## Brand Personality

Owner-defined attributes: innovative, original, technological, and a high standard of design. Desired experience: cohesive, refined, clear, and clean. The owner subsequently selected a bold, expressive, slightly brutalist foundation using the supplied red/yellow/dark/light palette and Danidin/Leon. Logo and page art direction remain open.

## Anti-references

Avoid clichés, empty slogans, and mediocre design, as requested by the owner. Specific anti-reference websites: TODO: Decision required

## Design Principles

- Hebrew is the first website language; use RTL and retain future English/LTR compatibility.
- The language controls document `lang` and `dir`; keep text in dictionaries and use shared components with logical CSS. Use one underlined EN language link beside the desktop header CTA and inside the mobile drawer, with English unavailable until its content is supplied.
- Follow the implemented [design-system foundations](docs/09-design-system.md): shared palette, type scale, spacing, logical containers, shapes, motion and buttons. The initial black-and-white wireframes remain composition references.
- Preserve the owner's confirmed homepage sequence and floating-only WhatsApp access.
- Develop Hebrew content and black-and-white layout together, section by section, in [the homepage workbook](docs/homepage-workbook.md). Record agreed copy in the content inventory and agreed layout in page planning before coded homepage updates.
- Treat prototype layout choices as reviewable proposals, not final UX or brand decisions.

## Accessibility & Inclusion

Hebrew/RTL is confirmed. Specific accessibility conformance target and additional user needs: TODO: Decision required

## Current implementation scope

Owner-authorized developer tooling: a development-only Visual Element Inspector for element selection, DOM/source context and copyable coding-agent prompts. This is local tooling, independent of public website language/content or page design. Exact source mapping uses development-only Turbopack annotations; no public API, direct agent integration or deployment is included. See [the inspector guide](docs/visual-element-inspector.md).

The owner now authorizes foundational design-system implementation before further page-specific UI: Tailwind 4.3.3 CSS-first tokens, the supplied palette, Danidin CondensedBold and Leon Regular/Heavy WOFF2, a 90rem logical container, type/spacing/radius/border/motion utilities and button variants/states. No Tailwind migration, root font-size change, logo, page composition redesign or new page animation. Existing content, navigation and controls remain functional; shared palette/fonts/container styles adopt the foundation. [Practical developer guide](docs/09-design-system.md).

Subsequent owner-authorized additions: five supplied WOFF2 font candidates in a separate local `/he/fonts` comparison utility, and a React Bits LogoLoop strip immediately below the hero with placeholders until images are supplied. This permits the requested logo motion with hover/manual pause and reduced-motion support; no organization names or endorsement claims are invented. See [the font candidates](docs/14-decisions.md#owner-supplied-font-candidates) and [carousel addition](docs/14-decisions.md#logo-carousel-below-the-hero).

On 2026-10-06 the owner explicitly requested moving from planning to a coded homepage wireframe and selected React, Next.js, Tailwind CSS, and Node.js. The existing docs remain the planning source of truth. This authorizes a local wireframe prototype, not production development, visual identity, publishing, content invention, or new pages.

Historical trial constraints used grayscale and a temporary system font. The new foundation request supersedes those shared visual constraints; retain native accessible controls, supplied facts and clearly identified empty content slots. Do not invent claims, testimonials, results, decorative imagery or page motion. Unknown navigation, Contact/Footer contents, project roles, and final text remain placeholders.

Earlier hero authorization: implement a local hero/header trial using the owner's Mammoth Murals desktop/mobile references and exact supplied hero copy. This specifically permits the hero/header update before the remaining workbook sections are complete. Use one inline hero CTA **לצפיה בפרויקטים** → `#projects`, an empty future-video div and text-only **Moriz Studio** logo. The owner subsequently revised desktop navigation to visible centered links with a left CTA; mobile/tablet retain the hamburger. Both variants contain homepage Projects/About/Contact anchors and language selection. The desktop CTA provisionally reuses the agreed project-viewing action pending the owner's label/destination preference. Mobile hero order: H1 → video placeholder → description → CTA. Preserve the other eight sections and floating WhatsApp. Hero stays In progress pending visual review; later sections stay Not started. No new pages, APIs or publishing were included in that trial. See [the trial decision](docs/14-decisions.md#mammoth-murals-hero-trial) and [header revision](docs/14-decisions.md#desktop-header-navigation-revision).

Latest authorization, 2026-10-07: implement the first advantages card with the owner-supplied research title/paragraph and grayscale UI/UX pills based on React Bits FallingText. The subsequent revision leaves eight pills, removing נגישות/פרוטוטייפ and adding מחקר מתחרים. The approved plan places the pills below the description and triggers one fall at 30% visibility, with mouse dragging, native touch scrolling, reduced-motion/static content and responsive boundaries. This specifically permits starting advantages before hero acceptance. The first card is implemented locally and awaits visual review; the other two cards remain placeholders. See [the card decision](docs/14-decisions.md#research-advantages-card-with-falling-pills).

The owner also requested an external developer-only Inspector ON/OFF toggle. The toggle works with the details panel closed; closing/reopening the panel preserves enabled state, selection and draft. Escape, switching OFF and route changes still stop inspection. The controls remain absent from production.

Source: [README.md](README.md), [project brief](docs/00-project-brief.md), [page structure](docs/02-page-structure.md), [content inventory](docs/03-content.md), and [owner decisions](docs/14-decisions.md).
