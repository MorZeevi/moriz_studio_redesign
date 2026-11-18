# SEO and sharing planning

The production SEO entries remain placeholders. The local wireframe uses a technical Hebrew title/description and `noindex, nofollow`; these are prototype settings, not approved website SEO copy or production indexing decisions. Its `/he` route does not finalize multilingual URL, canonical, or hreflang strategy. No English content or SEO metadata is authored.

## Page titles

TODO: Decision required

## Meta descriptions

TODO: Decision required

## Open Graph

TODO: Decision required

## Social sharing

TODO: Decision required

## Structured data

TODO: Decision required

## Canonicals

TODO: Decision required

## Index/noindex

TODO: Decision required

## Sitemap

TODO: Decision required

## Robots

Production: allow `/`; disallow `/admin`, `/api/`, `/digital-audit`, `/he/fonts`, `/en/fonts` and `/he/articles/preview`. Previews: disallow everything (`src/app/robots.ts`).

## Hebrew/English hreflang strategy

Implemented 2026-11-18, when English launched at `/en`:

- `pageAlternates(path)` (`src/lib/seo.ts`) returns a self-referencing canonical plus `he`, `en` and `x-default` (Hebrew) for every page that exists in both languages: home, projects, case studies, services, privacy. The Hebrew-only articles use `pageAlternates(path, { hebrewOnly: true })` (`he` and `x-default`).
- Open Graph comes from `openGraphFor(locale)` (`src/lib/site.ts`): `og:locale` `he_IL` or `en_US` with the other as `og:locale:alternate`. The share image path is per locale in `ogImagePath`; English points at the Hebrew `/og-image.png` until the owner supplies an English one. The getting-started quote image is a dictionary field (`gettingStarted.steps[2].image`), so English changes it in `en.ts`.
- JSON-LD: `inLanguage` is `he-IL` or `en`; the English organization has `addressLocality: "Tel Aviv"` and `areaServed: Worldwide` (owner: the English site serves clients anywhere); Hebrew stays Israel. Offers and topics are picked from the Hebrew copy and named in the page's language.
- `/sitemap.xml` lists every page once per locale with hreflang alternates. English has no articles entries.
- `robots.txt` also disallows `/en/fonts`.
- `/llms.txt` stays Hebrew-first and ends with an `## English` section listing the English pages (no articles).
- After deploy: the old `/en` → `/he` redirect was permanent (308), so browsers and Google may have cached it. Request indexing of `/en` in Search Console and test in a private window.

## Project indexing decisions

TODO: Decision required

## Blog SEO

TODO: Decision required
