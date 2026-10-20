# General backlog

Use this document for ideas and tasks that should not interrupt the current stage. Owner-deferred tasks are recorded below; the generic TODO entries remain placeholders, not assigned work. Experimental interaction ideas belong in [11-interaction-backlog.md](11-interaction-backlog.md).

## UX

- [ ] About section: replace the 600×600 portrait with the higher-resolution file the owner will supply (change `about.portrait` in the Hebrew dictionary). Recorded 2026-10-10.
- [ ] About section: add clickable personal items, with each click revealing what the item symbolizes for Moriz. Item selection and personal meanings to be supplied by the owner. Requested on 2026-10-09 for the task list only; implementation deferred until explicitly requested.
- [ ] TODO: Decision required

## UI

- [x] Desktop header navigation pills: adjust the button height (גובה בכפתורים בתפריט ניווט). See `src/components/liquid-navigation.module.css`; target height to be confirmed by the owner. Recorded 2026-10-20.
- [x] Homepage projects section: adjust the size of the project logos (הגודל של הלוגואים בפרויקטים). See `src/components/projects-section.tsx` (`project.logo`) and its styles. Recorded 2026-10-20.
- [x] Design quote: replace its design (להחליף את העיצוב של הציטוט). See `src/components/design-quote.tsx` and `design-quote.module.css`; new direction to be decided with the owner. Recorded 2026-10-20.

## Content

- [x] Owner to supply common prospective-client questions for the homepage FAQ. Deferred by the owner on 2026-10-06 for later completion; see [the content-planning note](03-content.md#faq--source-information). Re-requested on 2026-10-20 (להשלים שאלות תשובות). The [mobile audit](../mobile-audit.md) (F03) found the eight `שאלה N — להשלמה` placeholders visible on the live homepage. Done 2026-10-20: the owner supplied nine questions and answers (`faq.questions` in the Hebrew dictionary).
- [x] Showreel: produce the hero showreel video (להכין שואוריל). It plugs into the hero video (`hero.video` in the Hebrew dictionary; see [hero-video.md](hero-video.md)). Recorded 2026-10-20.
- [ ] About section: revise the About text (הטקסט באודות). See `src/components/about-me.tsx` and `about` in the Hebrew dictionary; copy to be supplied by the owner. Recorded 2026-10-20.
- [ ] About gallery: add more photos (להוסיף תמונות לגלריית תמונות). See `src/components/about-gallery.tsx`; images to be supplied by the owner. Recorded 2026-10-20.
- [ ] Testimonials: add Asher's testimonial (להוסיף המלצה של אשר). See `src/components/testimonials.tsx` and the Hebrew dictionary; text and approval to be supplied by the owner. Recorded 2026-10-20.
- [ ] Getting started: add photos of Mor (להוסיף תמונות שלי באיך מתחילים לעבוד). See `src/components/getting-started.tsx` (`#getting-started`); photos to be supplied by the owner. Recorded 2026-10-20.
- [x] moriz.ai: add questions to the AI knowledge base (להוסיף שאלות למנגנון AI). Rows live in the Supabase `ai_knowledge` table on the shared project. Open round-2 topics: whether the short intro call is free and by phone, online stores, typical project timeline, support after launch, and who supplies content, images, domain and hosting. Insert rows only after the owner approves the drafts. Recorded 2026-10-20. Done 2026-10-20: the nine FAQ answers were added as rows (14 active in total).

## Branding

- [ ] TODO: Decision required

## Motion

- [x] Footer: restore the parallax reveal as it was before it was cancelled (לתקן את האנימציה בפוטר כמו שהיתה ובוטלה). See `src/components/footer-parallax.tsx`. History: 87c2cf0 (2026-10-16) capped the rise to the height of the section above and moved the end point to `bottom bottom`; 872fe2b (2026-10-18) enabled it on mobile. Confirm with the owner which version looked right before changing code. Recorded 2026-10-20.

## Development

- [ ] TODO: Decision required

## SEO

- [ ] TODO: Decision required

## Research

- [ ] TODO: Decision required

## Future ideas

- [ ] TODO: Decision required
