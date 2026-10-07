# Page structure planning

Use these templates to record confirmed page goals and define page structure after research. Source content and agreed copy belong in [03-content.md](03-content.md). Develop homepage content and layout proposals together in [the shared workbook](homepage-workbook.md), then reflect agreed structure here.

## Home

### Current work stage

Current focus: review the implemented [first advantages research card](homepage-workbook.md#2-three-communication-themes--advantages), authorized on 2026-10-07. It presents the supplied title/paragraph and nine grayscale falling pills below the text, using a 280px minimum area that grows with its contents. The owner selected automatic falling on viewport entry. The advantages section is In progress; its other two cards remain placeholders. The [Mammoth hero/header trial](homepage-workbook.md#selected-trial--mammoth-murals-layout) also remains In progress. Both trials await visual acceptance. The confirmed sequence remains Hero → three communication themes / advantages → projects → brief owner introduction → client testimonials → how to start working together → FAQ → contact → footer. WhatsApp remains floating-only; final branding and later section layouts/content remain open.

### Wireframe prototype / review status

The prototype runs locally using React, Next.js, Tailwind CSS, and Node.js. Only Hebrew is enabled. Desktop navigation is visibly centered from 1024px, with a CTA and adjacent underlined EN language link on the left and temporary text-only Moriz Studio logo on the right. Mobile/tablet use a hamburger, with the same EN text link inside the drawer. Both navigation variants contain Projects (`#projects`), About (`#about`) and Contact (`#contact`); no current-language button is shown. English stays unavailable. The header CTA provisionally reuses **לצפיה בפרויקטים** → `#projects` pending the owner's label/destination preference. The document direction is derived from language, text is stored in a separate dictionary, and components/layout styling are shared for future LTR use. Final multi-page navigation is still open.

Temporary implementation proposals, not final owner decisions:

- Hero: exact owner-agreed H1 and description; Mammoth-inspired asymmetry, with large headline and description/CTA on the right and empty future-video div at bottom left from 1024px. Mobile/tablet order: H1 → video → description → CTA. One inline CTA **לצפיה בפרויקטים** → `#projects`. No inline WhatsApp CTA. See [trial details](homepage-workbook.md#selected-trial--mammoth-murals-layout).
- Advantages: three owner-supplied themes with supporting-content placeholders.
- Projects: three unassigned review slots. These do not select actual Home projects or their order.
- About: text and optional visual placeholders.
- Testimonials: two review slots; no client names or quotes supplied or invented.
- Starting together: the three owner-supplied steps, with remaining details marked for completion.
- FAQ: three empty question slots using native disclosure controls. The count and accordion presentation are draft choices; questions and answers remain deferred.
- Contact and Footer: information/action placeholders, with no additional contact channel or form selected.
- WhatsApp: lower inline-end (left in Hebrew, right in future LTR) as a temporary review position. Disabled until a real destination is configured. No animation selected.

Temporary font, spacing, grayscale values, breakpoint and slot counts are prototype settings, not final branding, tokens, or UX decisions. Final section presentation and internal hierarchy: TODO: Decision required

Review checklist:

- [x] Implement the first local Hebrew/RTL black-and-white wireframe from the owner-confirmed sequence.
- [x] Separate Hebrew text/UI labels from component markup and prepare language-driven direction.
- [ ] Review and approve or revise the draft layout with the owner. TODO: Decision required
- [ ] Supply selected project visuals, testimonials, and final text when available. TODO: Decision required
- [ ] Confirm the final floating-control side and destination. TODO: Decision required

Hero/header trial verification on 2026-10-06: lint, typecheck and production build pass. Browser checks cover 320/390/768/1024/1440/1920px and 200% text enlargement, exact hero copy, one hero CTA, same-page anchors, RTL/mobile order and all nine section IDs. The menu supports keyboard focus cycling, Escape/close/backdrop dismissal, focus restoration and touch navigation; English stays disabled. No browser runtime errors were observed. Saved desktop/mobile/menu captures and remaining visual acceptance are recorded in [the workbook](homepage-workbook.md#selected-trial--mammoth-murals-layout).

### Page goal

Create a strong overall impression and communicate that working with the studio owner offers something distinctive.

### User goal

TODO: Decision required

### Business goal

The desired visitor response is to be impressed by the overall offering and feel strongly decided on asking the owner to develop their product.

### Possible sections

Sections confirmed by the project owner on 2026-10-06. The complete sequence is recorded under Hierarchy below. Supporting information and presentation remain to be defined.

- Hero.
- A three-item section covering research-based specification, an interactive and attractive experience, and development. The owner-supplied wording and image are recorded in [the content document](03-content.md#supporting-messages). Section label and presentation: TODO: Decision required
- Projects.
- A brief introduction to the owner.
- Testimonials / reviews.
- How it works — how a prospective client starts working with the owner, confirmed after client testimonials and before FAQ. The three-step process is recorded in [the content document](03-content.md#how-it-works--source-information). Supporting information and presentation: TODO: Decision required
- Questions and answers / FAQ. The owner will supply the questions later; see [the content-planning note](03-content.md#faq--source-information).
- Contact, explicitly added by the owner after FAQ and before the footer. Content and presentation: TODO: Decision required
- Footer, explicitly added by the owner after contact. Contents and presentation: TODO: Decision required

Final section scope and presentation: TODO: Decision required

### Hierarchy

Homepage sequence specified by the owner on 2026-10-06:

1. Hero.
2. Three communication themes / advantages.
3. Projects.
4. Brief owner introduction.
5. Client testimonials.
6. How to start working together.
7. Questions and answers / FAQ.
8. Contact.
9. Footer.

See [the continuation decision](14-decisions.md#homepage-sequence-after-projects) and [the client-starting section placement](14-decisions.md#client-starting-section-placement).

The owner clarified that the client-starting section belongs after client testimonials. Its inclusion and position are confirmed.

Hierarchy within each section:

TODO: Define hierarchy after UX/UI research.

### Opening-sequence comparison for owner review

The alternatives below were presented after the requested Mobbin research. The owner selected the first alternative on 2026-10-06. Preserve both for the decision record. The subsequently specified page sequence is recorded above.

| Alternative | Opening sequence to compare | Possible benefit to examine | Tradeoff to examine |
| --- | --- | --- | --- |
| Explain the offering before the work | Hero → three communication themes → projects | Introduces the combination of research, experience design, and development before showing examples. | Visitors encounter an additional section before the project evidence. |
| Show the work before explaining the themes | Hero → projects → three communication themes | Brings concrete examples earlier, as in the reviewed source-page sequences. | Project presentation needs sufficient context; visuals alone may not explain the owner's contribution. |

Evidence: [homepage-structure research and its limits](research/mobbin-homepage-structure-2025-2026.md). The references use detailed capability lists, which are not equivalent to Moriz's short three-theme section. These possible benefits are hypotheses, not demonstrated conversion outcomes.

Selected opening sequence: **Hero → three communication themes / advantages → projects**, confirmed by the owner. See [the decision record](14-decisions.md#homepage-opening-sequence).

With the overall sequence confirmed, the owner previously requested a coded wireframe. Its later-section layouts serve as provisional references for [the workbook](homepage-workbook.md). Define each section's information, draft/refine Hebrew content together and compare desktop/mobile layouts; record agreed choices before moving on. The owner subsequently authorized the [Mammoth hero/header trial](14-decisions.md#mammoth-murals-hero-trial) before completing the workbook. Contact/Footer contents and final floating-control details remain open. Deferred FAQ copy remains a later source dependency. Record approved choices in [14-decisions.md](14-decisions.md).

The earlier owner-only text-editing workflow is superseded by collaborative copywriting in [the workbook](homepage-workbook.md#working-process). Keep source facts and agreed wording in [03-content.md](03-content.md#text-editing). Project presentation on Home still requires selecting from the three website projects and recording available source material. Trial navigation is selected; future multi-page navigation remains open in [01-sitemap.md](01-sitemap.md#final-navigation-structure).

### Required information

- The three communication themes supplied by the owner; see [the source wording and image](03-content.md#supporting-messages).
- How the working relationship begins: a short telephone call, an in-depth specification discussion, and receipt of a quote; see [the source information](03-content.md#how-it-works--source-information). This section is confirmed after client testimonials and before FAQ.

Additional required information: TODO: Decision required

### Primary CTA

Send a WhatsApp message about a potential product-development project.

The owner selected WhatsApp access **only through a floating control at the lower side of the viewport**. No inline WhatsApp CTA is included in the hero or other homepage sections. Exact left/right side, wording or accessible label, contact number, message content, visibility/scroll behavior, and responsive details: TODO: Decision required

The confirmed Contact section after FAQ remains in the page sequence. Its contents and other actions have not been defined; this placement choice does not create a form or select another contact channel.

See [the decision record](14-decisions.md#floating-only-whatsapp-access) and [the selected control's planning record](10-motion-and-interactions.md#floating-whatsapp-contact-control).

### Secondary actions

One inline hero CTA: **לצפיה בפרויקטים** → homepage Projects section (`#projects`). No separate Projects page is created by the trial.

### Trust / proof elements

Available material is recorded in the [content evidence inventory](03-content.md#available-credibility-material). The client-testimonials section is confirmed after the brief owner introduction and before the client-starting section. Testimonial selection, attribution, presentation, and placement of other proof remain open.

The owner included testimonials / reviews in the proposed homepage sections and is considering also including them on the Projects page. Which testimonials to use, and whether they should appear on both pages: TODO: Decision required

TODO: Decision required

### References to research

[Owner-provided inspiration references](research/owner-inspiration-references.md): Huncwot for form, page structure, and specifically the project presentation layout; Mammoth Murals for the owner's appreciation of brutalism; Stokt for its technological overall atmosphere.

[Mobbin homepage-structure research](research/mobbin-homepage-structure-2025-2026.md), collected 2026-10-06 before choosing the structure. Includes inspected section references, source-page content sequences, date-verification limits, and a comparison against all seven proposed sections. It does not establish Moriz's final section order.

Specific patterns to adopt: TODO: Decision required

### Open questions

- What label and supporting information should accompany the three selected themes? TODO: Decision required
- What supporting information should accompany each step for starting to work together? TODO: Decision required
- Should testimonials also appear on the Projects page? TODO: Decision required
- What information should be included in Contact and the footer? TODO: Decision required
- Which lower side should the floating WhatsApp control use, and how should it behave across responsive states? TODO: Decision required
- What should the hierarchy within each confirmed section be? TODO: Define hierarchy after UX/UI research.

### Confirmed section intent

On 2026-10-06, the owner supplied an image identifying the three themes she wants to present and clarified that "How it works" should explain how to start working together. This clarification does not establish the final section sequence or hierarchy.

### Section planning inventory

This table groups the available inputs by the owner's sections. The complete confirmed page sequence is recorded under Hierarchy. Source information remains in the content and portfolio documents.

| Proposed section | Confirmed input / source | Remaining decisions |
| --- | --- | --- |
| Hero | Exact agreed H1/description, Mammoth desktop/mobile trial, future-video placeholder and one **לצפיה בפרויקטים** → `#projects` action; see [the workbook hero](homepage-workbook.md#1-hero). The owner selected no inline WhatsApp CTA. | Visual acceptance of the trial, future video asset/playback and branding remain open. |
| Three-item section | The owner supplied three themes and an image; see [the content source](03-content.md#supporting-messages). | Section label, supporting information, final wording, and presentation: TODO: Decision required |
| Projects | Three products are selected for the website; see [the portfolio inventory](04-projects-and-case-studies.md#projects-to-appear-on-the-website). Huncwot's project layout is an owner-provided reference. | Which projects appear on Home, what information to show, their order, and the relationship to project pages: TODO: Decision required |
| Brief owner introduction | The owner proposed a short introduction. Existing background and working-model facts are in [the brief](00-project-brief.md#studio-positioning). | Which facts to include, the amount of information, and the relationship to About: TODO: Decision required |
| Testimonials / reviews | Five testimonials are reported as available; see [the evidence inventory](03-content.md#testimonials). The owner is considering also showing reviews on Projects. | Selection, attribution, presentation, and use across pages: TODO: Decision required |
| How to start working together | Confirmed after client testimonials and before FAQ. The owner supplied an initial call of 5–10 minutes, an in-depth specification discussion, and receipt of a quote; see [the source information](03-content.md#how-it-works--source-information). | Supporting details, internal hierarchy, final wording, and presentation: TODO: Decision required |
| Questions and answers / FAQ | The owner will supply common client questions later; see [the deferred content note](03-content.md#faq--source-information). | Questions, answers, final wording, and presentation: TODO: Decision required |
| Contact | Confirmed after FAQ and before the footer. The primary page-level conversion is sending a WhatsApp message through the floating control only. | Section contents, other actions, internal hierarchy, and presentation: TODO: Decision required |
| Footer | Confirmed after Contact. | Contents, links, hierarchy, and presentation: TODO: Decision required |

### Structure planning checklist

- [x] Compile the owner's proposed homepage sections.
- [x] Link confirmed information to its source documents.
- [x] Keep the FAQ questions in the backlog for later completion.
- [x] Collect focused Mobbin research for homepage structure, documenting date limits and gaps.
- [x] Confirm the opening sequence with the owner: Hero → three communication themes / advantages → projects.
- [x] Record the owner's subsequent sequence: brief introduction → client testimonials → FAQ → contact → footer.
- [x] Confirm the client-starting section after client testimonials and before FAQ.
- [x] Confirm the complete nine-part homepage section sequence with the owner.
- [x] Review the focused homepage research with the owner to choose the overall section sequence.
- [x] Select centered desktop navigation with a left CTA and mobile hamburger; keep Projects/About/Contact homepage anchors and language selection.
- [ ] Define final multi-page navigation and the information/actions in Contact and Footer. TODO: Decision required
- [ ] Select the projects to show on Home, their order, and available source information/visuals. TODO: Decision required
- [ ] Define hierarchy within the confirmed sections. TODO: Define hierarchy after UX/UI research.
- [x] Confirm floating-only WhatsApp access at the lower side of the viewport, with no inline WhatsApp CTA.
- [ ] Define the floating control's exact side and responsive behavior. TODO: Decision required
- [x] Start a local Hebrew/RTL black-and-white wireframe at the owner's request, using the confirmed section sequence and placeholders for unresolved decisions.
- [ ] Approve or revise the draft section layouts and internal hierarchy. TODO: Decision required

## Projects

### Page goal

TODO: Decision required

### User goal

TODO: Decision required

### Business goal

TODO: Decision required

### Possible sections

The owner is considering including testimonials / reviews on this page as well as on the homepage. Inclusion and placement: TODO: Decision required

Other possible sections: TODO: Decision required

### Hierarchy

TODO: Define hierarchy after UX/UI research.

### Required information

TODO: Decision required

### Primary CTA

TODO: Decision required

### Secondary actions

TODO: Decision required

### Trust / proof elements

Testimonials / reviews are being considered by the owner. Available evidence is recorded in [03-content.md](03-content.md#available-credibility-material).

Selection and presentation: TODO: Decision required

### References to research

TODO: Decision required

### Open questions

TODO: Decision required

## Project / Case Study

### Page goal

TODO: Decision required

### User goal

TODO: Decision required

### Business goal

TODO: Decision required

### Possible sections

No sections have been selected. This area is reserved for future planning.

TODO: Decision required

### Hierarchy

TODO: Define hierarchy after UX/UI research.

### Required information

TODO: Decision required

### Primary CTA

TODO: Decision required

### Secondary actions

TODO: Decision required

### Trust / proof elements

TODO: Decision required

### References to research

TODO: Decision required

### Open questions

TODO: Decision required

## About

### Page goal

TODO: Decision required

### User goal

TODO: Decision required

### Business goal

TODO: Decision required

### Possible sections

No sections have been selected. This area is reserved for future planning.

TODO: Decision required

### Hierarchy

TODO: Define hierarchy after UX/UI research.

### Required information

TODO: Decision required

### Primary CTA

TODO: Decision required

### Secondary actions

TODO: Decision required

### Trust / proof elements

TODO: Decision required

### References to research

TODO: Decision required

### Open questions

TODO: Decision required

## Research & Tools

### Page goal

TODO: Decision required

### User goal

TODO: Decision required

### Business goal

TODO: Decision required

### Possible sections

No sections have been selected. This area is reserved for future planning.

TODO: Decision required

### Hierarchy

TODO: Define hierarchy after UX/UI research.

### Required information

TODO: Decision required

### Primary CTA

TODO: Decision required

### Secondary actions

TODO: Decision required

### Trust / proof elements

TODO: Decision required

### References to research

TODO: Decision required

### Open questions

TODO: Decision required

## Research / Article page

### Page goal

TODO: Decision required

### User goal

TODO: Decision required

### Business goal

TODO: Decision required

### Possible sections

No sections have been selected. This area is reserved for future planning.

TODO: Decision required

### Hierarchy

TODO: Define hierarchy after UX/UI research.

### Required information

TODO: Decision required

### Primary CTA

TODO: Decision required

### Secondary actions

TODO: Decision required

### Trust / proof elements

TODO: Decision required

### References to research

TODO: Decision required

### Open questions

TODO: Decision required

## Diagnostic Questionnaire

### Page goal

TODO: Decision required

### User goal

TODO: Decision required

### Business goal

TODO: Decision required

### Possible sections

No sections have been selected. This area is reserved for future planning.

TODO: Decision required

### Hierarchy

TODO: Define hierarchy after UX/UI research.

### Required information

TODO: Decision required

### Primary CTA

TODO: Decision required

### Secondary actions

TODO: Decision required

### Trust / proof elements

TODO: Decision required

### References to research

TODO: Decision required

### Open questions

TODO: Decision required
