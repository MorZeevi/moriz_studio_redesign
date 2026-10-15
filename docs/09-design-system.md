# Design system foundations

Implemented on 2026-10-06 using the installed **Tailwind 4.3.3** CSS-first architecture. No version migration, new page layouts or logo. Normal browser root size remains unchanged: `1rem = 16px` by default.

## Reuse in another project

See the [design-system reuse guide](design-system-reuse.md) for the current palette, typography, button families, themes, forms, responsive patterns, and file-copy checklist. The [portable visual reference](design-system-visual.html) includes embedded fonts and interactive component examples; open it directly in a browser.

The [standalone kit](../design-system/README.md) packages the same system as copyable files: plain-CSS tokens, a Tailwind 4 adapter, framework-free components, React wrappers, fonts and a live demo. Since 2026-10-15 the site itself runs on the kit, so it is the single source of truth: a value changed there reaches the site.

## Source of truth

The kit in [`design-system/`](../design-system/README.md) owns every shared value and component. The site adds a thin layer on top and keeps its old import paths as re-exports, so call sites did not change.

| Site file | Role |
| --- | --- |
| [globals.css](../src/app/globals.css) | Public entry (locale root and `/digital-audit`): Tailwind, the kit's [Tailwind adapter](../design-system/tailwind/index.css), the kit's opt-in [dark theme](../design-system/css/theme.css), then the site layers below. Tailwind does not scan `design-system/`: its TSX uses the kit's own classes, never Tailwind utilities. |
| [admin/admin.css](../src/app/admin/admin.css) | Admin entry: the same layers without the kit's dark theme and the public theme layer, so the admin stays light even on a dark operating system. |
| [site.css](../src/styles/site.css) | Site-only names: the wireframe compatibility aliases (`--color-canvas`, `--color-ink`, …), the `--trial-*` metrics, `page-shell` / `hero-shell`, `--font-mono` for the developer inspector, and `color-scheme: light` for the admin root. Do not copy the trial metrics into new sections. |
| [theme.css](../src/styles/theme.css) | Public theme layer under `:root[data-public-site]`: the `--site-*` roles read the kit's `--color-*` roles once on the root, so components keep the page theme inside regions that flip `--color-*` locally. Dark mode adds `--site-hero-rotating` and `--site-cta-*`. |
| [wireframe.css](../src/styles/wireframe.css) | Existing page compositions, using shared values. |
| [fonts.ts](../src/styles/fonts.ts) | Re-exports the kit's `next/font/local` loaders for Danidin and Leon (files in `design-system/fonts/`). Comparison-only families remain in [font-candidates.ts](../src/styles/font-candidates.ts), with preloading disabled. |
| [Button](../src/components/ui/button.tsx) | Re-exports the kit's `Button` and `buttonClassName`. |
| [LiquidLink](../src/components/ui/liquid-link.tsx) | Thin client wrapper over the kit's `LiquidLink`; keeps the site's `navigation="native" \| "client"` prop (client uses `next/link`). Also re-exports `LiquidButton`, `LiquidBadge` and `LiquidFilter`. |
| [theme-provider.tsx](../src/components/theme-provider.tsx), [lib/theme.ts](../src/lib/theme.ts) | The kit's `ThemeProvider`, `useTheme` and bootstrap script on the site's storage key `moriz:theme`. |
| [theme-toggle.tsx](../src/components/theme-toggle.tsx) | Site markup (`[data-theme-controls]` wrapper, `[data-theme-toggle]` button, which tests and `wireframe.css` target) on the kit's `.theme-toggle` classes; hover follows the page theme through `--site-surface`. |

Liquid CTA overrides use the kit names: `--liquid-height`, `--liquid-fill`, `--liquid-pressed-fill`, `--liquid-ink`, `--liquid-icon-size`, `--liquid-filter` and the `--ease-liquid` token. Its shapes are `.liquid__icon`, `.liquid__label` and `.liquid__bridge`, so CSS modules target them with `:global(.liquid__label)` (Biome parses CSS modules for this). Kit rules sit in Tailwind's `base`, `components` and `utilities` layers, so any unlayered site or CSS-module rule overrides them regardless of specificity. The liquid navigation keeps its own `--liquid-gap` and `--liquid-filter` on its own elements.

In development the inspector also instruments `design-system/react` and `design-system/next`, so it names kit components and files.

## Colors

| Primitive | Value | Use |
| --- | --- | --- |
| `primary` | `#FB2C36` | Expressive accent / large graphic areas |
| `secondary` | `#DDDC8C` | Secondary emphasis |
| `dark` | `#262626` | Inverse background and strong borders |
| `light` | `#FBFBFF` | Default background and inverse text |

Use `bg-background`, `bg-background-inverse`, `bg-surface`, `text-text-primary`, `text-text-secondary`, `text-text-inverse`, `border-border`, `border-border-strong` and `outline-focus`. Primary text is solid `#262626` with no opacity; secondary text is dark at 70%. Surfaces, dividers, overlays and action states derive from this palette. `surface-inverse` sets an inverse background and the appropriate inherited text/border/focus/button context; use it around dark sections.

Pure primary red cannot meet 4.5:1 with either brand text color at body sizes. Primary buttons use `action-primary` (80% primary + 20% dark) with inverse text; pure red is for accents and large text/graphics. Standard `border` is a subtle divider; use `border-strong border-border-strong` for meaningful control boundaries. No unrelated gray palette or soft shadow collection is exposed.

## Typography

Use a semantic HTML heading level independently of its visual class. The supplied WOFF2 is **Danidin Condensed Bold**, registered as 700, rather than a Black face; it reuses the existing loader/file. Leon Regular is 400 and Leon Heavy is 900. Both families contain Hebrew and Latin glyphs. H1/H2 default to Danidin, H3/H4 and UI/body text to Leon; no synthetic styles are generated.

| Class | Size | Line height / tracking |
| --- | --- | --- |
| `type-display` | `clamp(5rem, 11vw, 10rem)` | `0.82 / -0.035em` |
| `type-h1` | `clamp(4rem, 9vw, 9rem)` | `0.86 / -0.03em` |
| `type-h2` | `clamp(3rem, 6vw, 6rem)` | `0.9 / -0.025em` |
| `type-h3` | `clamp(2rem, 3vw, 3rem)` | `1 / -0.02em` |
| `type-h4` | `1.5rem` | `1.15` |
| `type-body-lg` | `1.25rem` | `1.5` |
| `type-body` | `1rem` | `1.6` |
| `type-body-sm` | `0.875rem` | `1.55` |
| `type-label` | `0.875rem` | `1.2` |
| `type-caption` | `0.75rem` | `1.4` |

Display/H1/H2 use Danidin 700; H3/H4/labels/buttons use Leon 900; body/caption use Leon 400. Use `max-w-prose` for a 65ch reading measure. Type classes set typography, not margins. Tune values centrally and review wrapping in both languages.

## Spacing and layout

| Tailwind step | 1 | 2 | 3 | 4 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 30 | 40 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rem | .25 | .5 | .75 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 7.5 | 10 |

Use `gap-6`, `p-8`, `py-16`, `ms-4`, `pe-6`, etc. CSS can reference the equivalent `--space-*` aliases. Additional Tailwind steps still follow the 0.25rem base rhythm; prefer the listed scale.

`site-container` fills **100% of the available width**, with `padding-inline: 2rem` on both sides at every breakpoint, per the owner's 2026-10-10 update. This supersedes the previous 90rem cap and fluid gutters. This is the only container implementation; old `page-shell` / `hero-shell` names are compatibility aliases. `section-sm`, `section-md`, `section-lg` use the supplied fluid 4–6rem, 5–8rem and 6–10rem vertical spacing. Put section spacing on an outer section and `site-container` on its inner content.

Local browser verification of the full-width update passed at 320, 390, 1440 and 1920px, including the Projects route at 1920px: visible shared containers fill the viewport and no horizontal overflow was found. The existing footer legal row retains extra clearance for the floating WhatsApp control. Desktop/mobile hero and advantages captures were reviewed; lint and diff whitespace checks pass.

## Shape and buttons

`rounded-xs` = .125rem, `rounded-sm` = .25rem, `rounded-md` = .375rem, `rounded-pill` = 999rem. Default buttons use `rounded-sm`. `border-default` = .0625rem; `border-strong` = .125rem. Only optional `shadow-hard` is provided (.25rem .25rem, no blur); it is not applied globally. Focus rings are accessibility cues, not decorative shadows.

```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary" size="md">שליחת הודעה</Button>
<Button variant="outline" size="sm" disabled>Unavailable</Button>
```

Variants: `primary`, `secondary`, `outline`, `ghost` (underlined text). Sizes: `sm`, `md`, `lg`, with minimum heights 2.75/3/3.5rem. Defaults are primary/medium and `type="button"`; set `type="submit"` explicitly for a form. All variants have hover, active, focus-visible and native disabled states; `aria-disabled` also disables the native control. Hover underlines, active presses, and disabled semantics avoid color-only feedback. Use an anchor for navigation, with `button button--outline button--md` styling; do not use a button for a link or rely on styling alone to disable an anchor.

## Motion, direction and accessibility

Use `duration-fast` / `duration-normal` / `duration-slow` (.15/.3/.6s) with `ease-standard` / `ease-enter` / `ease-exit`. CSS/GSAP may read the corresponding `--duration-*` and `--ease-*` properties from the document root. Durations become 0s under reduced motion; button translation stops. Future JS animations must also check `matchMedia('(prefers-reduced-motion: reduce)')`. Page animations are added only where the owner asks for them; see [10-motion-and-interactions.md](10-motion-and-interactions.md) (for example the getting-started rail and icons).

Set `lang` and `dir` on the document (already driven by the locale layout); use logical spacing, `text-start`, `start`/`end` positioning and natural DOM order. `directional-icon` mirrors a right-pointing directional SVG in RTL; do not apply it to logos, media play symbols or other nondirectional artwork. Use `bdi` for mixed-language names. The logo track deliberately has its own LTR movement coordinate system, while Hebrew labels remain RTL. English page content is still pending; do not enable an empty `/en` route.

Keep the global two-color focus-visible ring and native keyboard behavior. Body line height is 1.6. Default body contrast is 7.69:1; default buttons meet at least 4.99:1 on light and inverse surfaces. Do not put ordinary body text on pure red or treat subtle divider borders as control boundaries.

Verification: production CSS and real font faces were inspected in Chrome, with both RTL/LTR at 320–1920px, 200% text enlargement, all type roles, button sizes/states, keyboard focus, disabled controls, inverse surfaces, reduced motion and existing homepage interactions. Lint, TypeScript and production build pass. Navigation/cards/service/project components remain deferred until their page work needs them.

Kit migration, 2026-10-15: the duplicate site copies (`tokens.css`, `foundations.css`, the liquid CSS module, the button, theme provider and font files) were replaced by the kit. Headless Chrome compared every element's computed styles before and after, on `/he`, `/he/projects`, a project page, `/digital-audit` and `/admin/login` at 320, 390, 1024, 1440 and 1920px in light and dark (RTL). Two baseline runs matched exactly. The only difference is the kit's `cursor: pointer` on `LiquidButton`; the old CSS module left buttons with the default arrow. Liquid hover and focus states and the production build's CSS also match. `/admin/login` stays light under a dark operating system. The built admin CSS differs from the public bundle only by the dark-theme blocks and the header and theme-control rules, which no admin page renders (the CMS preview hides the theme toggle). [design-system-visual.html](design-system-visual.html) still names the pre-kit file paths. Lint, TypeScript, the build, the liquid-link and theme tests and the inspector unit test pass. The remaining navigation and inspector test failures also fail on the unchanged revision `9fe3aa8`.
