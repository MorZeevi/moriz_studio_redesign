# SEO Phase 2: owner review

Status: **proposal for Mor's review.** Only the two metadata descriptions in section 1 change code. Everything else here is documented, not done. Approving this PR authorizes no CMS edit, Vercel change or GA4 change; each needs its own explicit go-ahead.

Source: the Phase 2 plan and its Codex review, plus the commercial-opportunity sprint (research branch `seo/moriz-phase1-research`, not part of this PR).

## 1. In this PR (code, copy only)

| Where | Before | After |
|---|---|---|
| Homepage meta description and Open Graph / JSON-LD description (`src/i18n/dictionaries/he.ts`, `metadata.description`) | Moriz Studio — איפיון, עיצוב ופיתוח אתרים, אפליקציות WEB וכלי AI מבוססי מחקר. מהרעיון ועד מוצר דיגיטלי שעובד בשבילכם. | Moriz Studio — סטודיו לעיצוב ופיתוח אתרים בישראל. איפיון, עיצוב ופיתוח אתרים, אפליקציות WEB וכלי AI מבוססי מחקר, מהרעיון ועד מוצר דיגיטלי שעובד בשבילכם. |
| `/he/projects` meta description (new `projects.archive.description`, used in `projects/page.tsx`) | inherited the homepage description | עבודות נבחרות של Moriz Studio: אתרים, אפליקציות WEB ופרויקטי איפיון ועיצוב, בהם עבודות עבור עיתון הארץ, חב״ד קלאב ו-AI פרקטי. |

Unchanged on purpose: `<title>`, H1, hero, visible copy, FAQ, canonical, routing, language. The homepage description is not visible on the page. It feeds the search snippet, the Open Graph description (social previews) and the Organization JSON-LD description; Google does not rank on it. The client names in the projects description (עיתון הארץ, חב״ד קלאב, AI פרקטי) are the names shown on the live site's project cards. Mor should rewrite either string in her own voice before merge.

## 2. `/en` and `www` (verified read-only on production, 2026-10-26)

| Start URL | Result |
|---|---|
| `https://moriz.studio/en` | 308 to `/he`, then 200 |
| `https://moriz.studio/en/projects` | 308 to `/he/projects`, then 200 |
| `https://www.moriz.studio/` | **307** to `https://moriz.studio/`, 308 to `/he`, 200 |
| `https://www.moriz.studio/en` | 307 to apex `/en`, 308 to `/he`, 200 |
| `http://www.moriz.studio/` | 308, 307, 308, then 200 |

- **`/en`: correct, no change.** It comes from `next.config.ts`. It is a permanent redirect with no body, so there is no language or canonical mismatch.
- **`www`: not fixed in code.** The 307 is served by Vercel (`Server: Vercel`) and no repo file contains a `www` rule. A host redirect in `next.config.ts` would duplicate the dashboard rule and risk a loop.
- **Proposed, NOT performed (needs whoever holds Vercel domain access):** Vercel, project, Domains, `www.moriz.studio`: set "Redirect to `moriz.studio`" with status **308 (Permanent)**. First confirm `www` is attached to this project. Do not redirect the apex to `www`. Afterwards, re-run: `curl -sI --max-redirs 0 https://www.moriz.studio/` (expect 308 and `Location: https://moriz.studio/`), then `curl -sL --max-redirs 5 -o /dev/null -w "%{http_code} %{num_redirects} %{url_effective}\n" https://www.moriz.studio/` (expect `200 2 https://moriz.studio/he`).

## 3. Mom Is Back case study: CMS only, NOT performed

The page lives in the live CMS (edited in `/admin`). Nothing was changed. Proposed values for Mor to apply, or reject:

| Field | Before (live) | Proposed |
|---|---|---|
| `seo_description` | empty; falls back to "איפיון ועיצוב עמוד הבית" | עיצוב מחדש של דף הבית של "אמא חוזרת לג׳ינס", קהילת אורח חיים בריא בהובלת רונה אבן, דיאטנית קלינית. איפיון ועיצוב UI/UX. |
| `seo_title` (optional; skip if unsure) | empty; falls back to "אמא חוזרת לג׳ינס \| Moriz Studio" | עיצוב מחדש לדף הבית: אמא חוזרת לג׳ינס \| Moriz Studio |
| New `text` block "מה רונה אומרת" | none | Rona's existing homepage testimonial, verbatim: "מור עיצבה מחדש את דף הבית באתר שלי, ואני ממש מרוצה! שירותית, מהירה ומדויקת, עם הקשבה למה שאני צריכה ועיצוב שמתאים לי ולעסק שלי. ממליצה בחום 💜" Attribution: רונה אבן, אמא חוזרת לג׳ינס |

Basis: "עיצוב מחדש" and "דף הבית" come from Rona's own testimonial; the rest is on the live page. Deliberately left out: "הקהילה הגדולה בישראל" and "200K+" (an unsourced comparative claim and an undated size), the "1K ביום" stat (unlabeled), and "מעבר לאתר" (meaning unstated). No results or metrics are invented. Questions for Mor: is Rona fine with the quote on the project page too, and does she want to add two lines on what the old home page got wrong and what changed? No placeholder text should be published.

## 4. GA4 contact tracking: BLOCKED, no tracking code written

What exists: `<GoogleAnalytics gaId="G-R1KN0P3K42" />` and Clarity load on every indexable public page (`src/app/[locale]/layout.tsx`). There are no `sendGAEvent`, `gtag(` or `dataLayer` calls in `src/`. The contact form (`footer-contact-form.tsx`) submits with `fetch` and shows an inline success state, so no pageview marks a lead.

Why blocked: there is no consent banner or consent mode for the public site, and the privacy policy only names the tools. Click-level events (WhatsApp, email, phone) are new behavioral measurement, and whether existing disclosure covers it has not been assessed.

**Decision required from Mor (or her adviser):** does the current privacy disclosure cover click-level GA4 events, or is consent needed first? If consent is needed, defer tracking.

When unblocked, the agreed design is:
- `generate_lead` fires only after a confirmed form submission (right after `setSubmissionState("success")`), never on click or error. It is the only candidate GA4 key event.
- `contact_click` with `method` of `whatsapp`, `email` or `phone` is an intent signal, not a lead and not a key event. Fire sites: `floating-actions.tsx`, `site-footer.tsx` (WhatsApp, mailto, tel), `faq.tsx`.
- No message text, name, phone or email in any parameter. First check in GA4 DebugView whether enhanced measurement already logs outbound `wa.me` clicks, to avoid duplicates.

## 5. Not in this PR (deferred by the plan)

Homepage `<title>` change (revisit about 2026-11-23 with GSC data); the optional FAQ wording tweak (W4); new FAQ entries; other project descriptions; GBP (owner-handled).
