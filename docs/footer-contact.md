# Footer contact form

Owner-approved design and validation preview, 12 October 2026. The form is part of the homepage footer; the standalone contact placeholder has been removed. One `#contact` section is retained for header, mobile-navigation and footer links.

## Layout and visual authority

The incumbent Leon font, light/dark theme roles, 2rem gutters and spacing tokens are the source of truth. The [Mobbin research](research/footer-contact-mobbin-2026-10-12.md) informs the open composition, thin field rules and small outlined action. Desktop (64rem and above) places the invitation on the right and the form on the left, capped at 40rem; name and phone share a row. Smaller widths stack invitation and all four fields. The message is a vertically resizable, three-line textarea. Existing footer navigation, wordmark animation and floating controls remain.

## Behavior and component boundary

`SiteFooter` remains a Server Component. Its `FooterContactForm` child is a Client Component receiving dictionary-owned contact copy. No new endpoint, server action, database migration, dependency or persistence is introduced.

Name, valid email and a nonblank message are required; phone is optional with `type="tel"` and no restrictive format rule. Inline Hebrew errors appear after blur or submission and clear as the field becomes valid. Submission focuses the first invalid field. Input values are retained. The always-visible preview note makes clear that messages are not sent; a valid attempt announces this again via a status region. The fieldset is disabled in server HTML and enables only after hydration, preventing native fallback submission without JavaScript.

## Copy

All labels, errors and preview feedback live in `contact` in the Hebrew dictionary. The heading is **בואו נדבר**, invitation **ספרו לי בקצרה על הפרויקט שלכם.**, action **שליחת הודעה**. The owner selected **design first**, so delivery and its destination are a separate future task.

## Verification and remaining acceptance

Local verification passed for empty/whitespace-only required fields, invalid email, first-invalid focus, error clearing after correction, an empty optional phone, retained values and the no-send status after a valid attempt. Submission caused no request or URL change. Keyboard order is name → phone → email → message → action; the header CTA reaches the contact section with clearance. With JavaScript disabled, the visible preview note remains, fieldset descendants are disabled and native submission is prevented.

Desktop/mobile light and dark captures and 320px contact geometry passed. The contact form also fits at 320px with 200% root text size; existing homepage sections outside the form overflow in that combination. This does not establish full-page zoom conformance. Details and offenders are recorded in `.impeccable/review/footer-contact/qa-report.json`.

Lint, TypeScript and diff-whitespace checks passed; the Impeccable detector reported no findings. The three saved full-resolution research references have recorded provenance, with no missing sources found. Finish review returned **ship** for the local normal-size footer scope. Verification evidence is stored locally under `.impeccable/review/footer-contact/`; owner visual acceptance remains pending. Social-profile URLs and legal-page destinations remain existing placeholders. No publishing is included.
