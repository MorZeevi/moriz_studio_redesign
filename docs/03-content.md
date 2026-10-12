# Content planning

This document holds the source content inventory and agreed wording, separate from information architecture and page structure. Develop homepage Hebrew copy proposals alongside layout comparisons in [the shared workbook](homepage-workbook.md), then reflect agreed content here with a link to its review record. Hebrew is the first website language; no content translation or English website copy is created here.

## Text editing

Earlier on 2026-10-06, the owner took text editing separately while requesting documentation status and structural planning. The approved workbook plan supersedes that workflow: define each section's purpose/information, review saved references together, draft 2–3 Hebrew options, refine the preferred version and compare desktop/mobile layouts. Record agreed copy and layout before moving to the next section. The [homepage workbook](homepage-workbook.md) is the shared drafting workspace; this document remains the source inventory and agreed-content record. The owner supplied the agreed hero H1 and description, then authorized a [coded Mammoth hero/header trial](14-decisions.md#mammoth-murals-hero-trial) before finishing later sections. Copy for later sections remains open.

The coded wireframe uses Hebrew-first, bilingual-ready architecture. Hebrew UI labels, the exact agreed hero wording and later-section placeholders are separate from components in [src/i18n/dictionaries/he.ts](../src/i18n/dictionaries/he.ts). The approved hero trial reflects the agreed H1, description and CTA in that dictionary now; later copy updates follow their section reviews. No English dictionary or translation exists yet; future English must use matching content keys and the same components.

## Available credibility material

The following material is reported by the project owner. This inventory does not select page placement, presentation order, or final website wording.

### Testimonials

- Five testimonials are available; four were supplied on 2026-10-10 and are used verbatim in `testimonials.items` (`src/i18n/dictionaries/he.ts`).
- **Tal Lev (טל לב), מטפלת סינית מוסמכת** — headline "אני כל כך שמחה בתוצאה, האתר משקף אותי באמת והרחיב את כמות הפניות"; five-paragraph body; portrait supplied.
- **Elbi Ben Shimol (אלבי בן שימול), ביטוחים ופיננסים** — headline "העבודה עם מור הייתה ברמה אחרת!"; one-paragraph body; logo supplied. Spelling confirmed by the owner: אלבי.
- **Shay Goren (שי גורן), בעלת עסק לסדנאות** — one-paragraph body ("היה לי תענוג אמיתי…"); portrait supplied. Headline: designer-proposed verbatim excerpt (see below)
- **Gabriella Laster (גבריאלה לסטר), Product Marketing Director at Elementor** — one-paragraph body about Angie, Elementor's AI plugin ("עבדתי עם מור על פיתוח חוויות אינטראקטיביות…"); Elementor logo supplied. Headline: designer-proposed verbatim excerpt (see below)
- Display order set by the owner: Elementor → Tal Lev → Elbi Ben Shimol → Shay Goren.
- Headlines for Gabriella (owner-edited excerpt: "לכל אחד שמחפש שילוב של יכולת טכנית וחשיבה יצירתית.") and Shay are verbatim sentences from their bodies, Shay's proposed by the designer at the owner's request on 2026-10-10; the owner can swap them.
- Fifth testimonial: TODO: to be supplied
- Publication permissions and constraints: TODO: Decision required

### Product user counts

- The owner reports actual usage figures for existing products.
- These describe usage of existing products, rather than projected future usage.
- Values, associated products, measurement definitions, dates, and supporting sources: TODO: Decision required

### Experience at well-known organizations

- The owner's experience with well-known organizations includes both employee roles and independent engagements.
- The owner will provide the organization and engagement details later.
- Organization names, specific roles, dates, and relationship type for each organization: TODO: Decision required
- Publication permissions and constraints: TODO: Decision required

### Selection and presentation

Which material to publish, on which pages, and how to present it: TODO: Decision required

## Home

### Main message

Moriz combines research, UX/UI design and web app development, as specified by the approved workbook plan. The owner-agreed headline and supporting text below express a research-led approach to solving complex problems and building a system suited to the business and its users. See [the workbook hero](homepage-workbook.md#1-hero) for layout proposals and [the copy decision](14-decisions.md#owner-supplied-hero-copy).

### Supporting messages

On 2026-10-06, the owner supplied an image showing the three themes she wants to present. The English descriptions below are internal planning notes; the supplied Hebrew wording is preserved as source material for future content work.

| Internal planning theme | Owner-supplied Hebrew wording |
| --- | --- |
| Research-based specification. | איפיון חכם מבוסס מחקר |
| An interactive and attractive experience. | חוויה אינטראקטיבית ואטרקטיבית |
| Development; exact scope of the supplied claim remains to be clarified. | פיתוח ללא גבולות |

![Owner-supplied image identifying the three homepage themes](research/assets/owner-inputs/homepage-three-themes-2026-10-06.png)

The image is retained as a record of the owner's original input. On 2026-10-07 the owner approved implementation of the first card with heading **איפיון ועיצוב מבוססי מחקר** and supporting text **כל כפתור, כל אנימציה וכל בחירה היא מושכלת. אני מתעדכנת כל הזמן במחקרים ומתודולוגיות חדשות.** The approved plan corrects the supplied typo “ויעצוב”.

Its eight grayscale falling pills are **מחקר משתמשים, UI, UX, מסע משתמש, בדיקות שמישות, מחקר מתחרים, ארכיטקטורת מידע, Design System**. The owner requested removing נגישות and פרוטוטייפ and adding מחקר מתחרים in a subsequent revision on 2026-10-07. The terms are capability labels, not results or endorsement claims. The card is implemented locally; visual acceptance is pending. See [the workbook composition](homepage-workbook.md#2-three-communication-themes--advantages). The owner approved Party Mode as the second card’s interactive demonstration, subsequently presented as **let’s party?** with **No / Yes** labels. Accessible switch/status/off-control strings are in the Hebrew dictionary. See [Party Mode](party-mode.md).

On 2026-10-10 the owner approved retaining the current categories and implementing these descriptions:

- **חוויה אינטראקטיבית ואטרקטיבית:** פחות טקסט, יותר ויז׳ואל ומעורבות של המשתמשים.
- **פיתוח ללא גבולות:** אני הופכת את האפיון והעיצוב למוצר דיגיטלי עובד, עם פתרונות שמותאמים לצרכים שלכם. עד לפרטים הקטנים.

These replace the supporting-copy placeholders. No development technology, integration or guarantee is inferred from the category title.

The owner subsequently selected **סקיצה שהופכת לממשק חי** from [the visual research board](research/homepage-services-visual-concepts-2026-10-10.html) and authorized the third card's local demonstration. Its copy lives in `development.demo` in [the Hebrew dictionary](../src/i18n/dictionaries/he.ts): title **המשימות שלי**, note **ממשק לדוגמה**, stages **סקיצה / ממשק חי**, actions **להפוך למוצר / חזרה לסקיצה**, sketch explanation **השלב הבא: להפוך את הסקיצה למוצר**, tasks **אפיון המסך / בניית הממשק**, and completion suffix **הושלמו**. The example reuses the research board's task list; it introduces no client project, outcome or factual claim. Owner visual acceptance remains pending.

Superseded on 2026-10-10: the third card now shows an infinity sign with a slow sliding bead (secondary colour) instead of the task list. Its only copy is `development.infinity` — the SVG title **סמל אינסוף** and the bead's slider label **הזזת הנקודה על סמל האינסוף**.

### How it works — source information

The owner supplied the following sequence on 2026-10-06 to explain how a prospective client starts working with her after initial contact. These are internal content-planning facts, not website copy.

1. A short telephone call lasting 5–10 minutes.
2. An in-depth specification discussion.
3. The prospective client receives a quote.

These three steps describe the start of the working relationship. The owner subsequently confirmed that this section belongs after client testimonials and before FAQ on Home. Page sequence is recorded separately in [02-page-structure.md](02-page-structure.md#hierarchy); supporting information and final copy remain open.

Owner update, 2026-10-10: the phone call is a few simple questions to see whether there is an initial fit with the client's needs; the discovery call (שיחת אפיון) is free of charge and takes place on Zoom; a quote is valid for 14 working days. No duration is shown for the Zoom call (owner decision).

Website wording is implemented in `gettingStarted.steps` in [the Hebrew dictionary](../src/i18n/dictionaries/he.ts) and recorded in the [homepage workbook](homepage-workbook.md#6-how-to-start-working-together). The lines for steps 2 and 3 and the shortened step 2 title (**שיחת אפיון**) are drafts awaiting owner approval.

Client preparation and any subsequent steps: TODO: Decision required

### FAQ — source information

On 2026-10-06, the owner deferred supplying the common questions that prospective clients ask before agreeing to a project. The owner will complete this later; continue the current planning work in the meantime.

Questions: TODO: Decision required

Answers and final website wording: TODO: Decision required

### About (קצת עליי) — homepage biography

Supplied verbatim by the owner on 2026-10-10. Bold phrases (shown in bold) were read from her screenshot of the current site and await confirmation. Source of truth in code: `about.paragraphs` in the [Hebrew dictionary](../src/i18n/dictionaries/he.ts); presentation in [the decision](14-decisions.md#about-section-reading-focus-and-highlighter). Image: the cutout portrait from the header contact button until a higher-resolution file is supplied.

אני עוזרת ליזמים, מנהלי מוצר ובעלי עסקים שמתמודדים עם קושי להעביר את הערך שלהם במרחב הדיגיטלי. הם השקיעו משאבים רבים בפיתוח המוצר או השירות שלהם, אבל **חווית המשתמש הנוכחית עושה להם עוול וההשקעה יורדת לטמיון.**

עם **תואר אקדמי בטכנולוגיות למידה מ-H.I.T וניסיון של שנים בפיתוח**, יצרתי תהליך לבניית מעטפת דיגיטלית **מבוססת פרקטיקות מחקריות ומתודולוגיות מעולם שימור הקשב.** הכלים שאני יוצרת שונים בסוגם: אתרי תדמית, אפליקציות Web, מערכות מותאמות אישית וכלים אינטראקטיביים (כמו מחשבונים ואינפוגרפיקות). כולם כוללים חלוקת תוכן חכמה, משחקיות, אנימציות ומסע לקוח הדרגתי וברור.

**בסוף התהליך, הלקוחות שלי מצוידים בכלים דיגיטליים שעוזרים לקהל שלהם לעשות יותר עם פחות מאמץ, ומשיגים את המטרות העסקיות שלהם.**

### Footer contact — agreed implementation copy

On 2026-10-12 the owner approved implementing the gentle, classic, minimal footer form after [Mobbin research](research/footer-contact-mobbin-2026-10-12.md). Copy lives in `contact` in [the Hebrew dictionary](../src/i18n/dictionaries/he.ts): heading **בואו נדבר**, invitation **ספרו לי בקצרה על הפרויקט שלכם.**, labels **שם מלא**, **טלפון (לא חובה)**, **אימייל**, **הודעה קצרה**, and action **שליחת הודעה**. Name, email and message are required; phone is optional.

Preview notice: **תצוגה מקדימה בלבד — ההודעה לא תישלח.** Valid-attempt status: **הפרטים תקינים. זו תצוגה מקדימה וההודעה לא נשלחה.** Inline errors: **נא למלא את השם שלכם.**, **נא למלא כתובת אימייל תקינה.**, **נא לכתוב כמה מילים על הפרויקט שלכם.** This is design and validation only; delivery/storage remain outside this pass. Local implementation is complete; owner visual acceptance remains pending. See [behavior and validation](footer-contact.md).

### Headlines

Hero H1 — agreed, supplied by the owner on 2026-10-06; preserved verbatim:

> יוצרת פתרונות דיגיטליים מבוססי מחקר

Owner clarification, 2026-10-09: **נעים להכיר, אני מור** is small introductory text above the existing H1, beside the supplied avatar in a horizontal RTL row. The portrait is 48px wide on mobile and 56px from 768px, preserving its full proportions; the introduction is 16px/18px. The H1, supporting copy and hero action remain unchanged. The subsequent enlargement and move beside the H1 were undone at the owner's request.

Later section headlines: TODO: Decision required

### Body copy

Hero supporting text — agreed, supplied by the owner on 2026-10-06; preserved verbatim:

> **מחקר מנצח טיעונים**. מתוך התפיסה הזו אני ניגשת לכל פרויקט – מורכב ככל שיהיה.  
> עם תואר בטכנולוגיות למידה מ-HIT וניסיון עשיר בפיתוח  
> אצור עבורכם כלי דיגיטלי שבאמת מביא לפעולה.

The owner now supplies years of development experience as a fact; no exact duration is recorded. Later section body copy: TODO: Decision required

### CTAs

WhatsApp is the primary conversion channel. On Home, the owner selected a floating contact control at the lower side only, with no inline WhatsApp CTA in the hero or other sections. See [the placement decision](14-decisions.md#floating-only-whatsapp-access).

One inline hero CTA is selected: **לצפיה בפרויקטים** → existing homepage Projects section (`#projects`). Preserve this spelling exactly as supplied by the owner; see [the trial record](homepage-workbook.md#selected-trial--mammoth-murals-layout). The temporary menu labels are **פרויקטים**, **קצת עליי**, **יצירת קשר**, plus language selection.

The owner subsequently requested a left CTA in the desktop header. Its text/destination were not supplied; provisionally reuse **לצפיה בפרויקטים** → `#projects` pending the owner's preference. This does not change the single inline hero CTA. Desktop navigation is visible and centered; mobile retains the hamburger. See [the revision record](14-decisions.md#desktop-header-navigation-revision).

Language control: owner-selected underlined **EN** text link beside the desktop header CTA, replacing the Hebrew/English button pair. Use the same single text link in the mobile drawer. Hebrew accessible language names remain in the dictionary; English is still unavailable until translated content is supplied. See [the choice](14-decisions.md#compact-language-link).

Final WhatsApp wording/accessible label, contact number and message content: TODO: Decision required

### Project descriptions

TODO: Decision required

### Social proof

TODO: Decision required

### SEO copy

TODO: Decision required

### Hebrew copy

Hero wording is agreed under [Headlines](#headlines) and [Body copy](#body-copy). Keep it unchanged during layout comparison. Later sections: TODO: Decision required

### Future English version

TODO: Decision required

## Projects

### Main message

TODO: Decision required

### Supporting messages

TODO: Decision required

### Headlines

TODO: Decision required

### Body copy

TODO: Decision required

### CTAs

TODO: Decision required

### Project descriptions

TODO: Decision required

### Social proof

TODO: Decision required

### SEO copy

TODO: Decision required

### Hebrew copy

TODO: Decision required

### Future English version

TODO: Decision required

## Project / Case Study

### Main message

TODO: Decision required

### Supporting messages

TODO: Decision required

### Headlines

TODO: Decision required

### Body copy

TODO: Decision required

### CTAs

TODO: Decision required

### Project descriptions

TODO: Decision required

### Social proof

TODO: Decision required

### SEO copy

TODO: Decision required

### Hebrew copy

TODO: Decision required

### Future English version

TODO: Decision required

## About

### Main message

TODO: Decision required

### Supporting messages

TODO: Decision required

### Headlines

TODO: Decision required

### Body copy

TODO: Decision required

### CTAs

TODO: Decision required

### Project descriptions

TODO: Decision required

### Social proof

TODO: Decision required

### SEO copy

TODO: Decision required

### Hebrew copy

TODO: Decision required

### Future English version

TODO: Decision required

## Research & Tools

### Main message

TODO: Decision required

### Supporting messages

TODO: Decision required

### Headlines

TODO: Decision required

### Body copy

TODO: Decision required

### CTAs

TODO: Decision required

### Project descriptions

TODO: Decision required

### Social proof

TODO: Decision required

### SEO copy

TODO: Decision required

### Hebrew copy

TODO: Decision required

### Future English version

TODO: Decision required

## Research / Article page

### Main message

TODO: Decision required

### Supporting messages

TODO: Decision required

### Headlines

TODO: Decision required

### Body copy

TODO: Decision required

### CTAs

TODO: Decision required

### Project descriptions

TODO: Decision required

### Social proof

TODO: Decision required

### SEO copy

TODO: Decision required

### Hebrew copy

TODO: Decision required

### Future English version

TODO: Decision required

## Diagnostic Questionnaire

### Main message

TODO: Decision required

### Supporting messages

TODO: Decision required

### Headlines

TODO: Decision required

### Body copy

TODO: Decision required

### CTAs

TODO: Decision required

### Project descriptions

TODO: Decision required

### Social proof

TODO: Decision required

### SEO copy

TODO: Decision required

### Hebrew copy

TODO: Decision required

### Future English version

TODO: Decision required
