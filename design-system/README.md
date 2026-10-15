# Moriz Design System

A self-contained kit of the Moriz Studio visual system: tokens, CSS, a Tailwind 4 adapter, React components and fonts. Copy this folder into a new project to build with the same look: condensed display type, readable Hebrew and Latin text, charcoal and off-white surfaces, red and yellow accents, compact controls and the liquid CTA.

Extracted on 15 October 2026 from repository revision `9fe3aa8` of the Moriz Studio site. The look is unchanged; only the packaging is new. The Moriz Studio site consumes this folder directly (`src/app/globals.css` imports the Tailwind adapter and `css/theme.css`; `src/components/ui/*` and `src/styles/fonts.ts` re-export the React and Next modules), so a value changed here reaches the site. The `/digital-audit` product and the CMS admin are outside this system.

Open [`demo/index.html`](demo/index.html) through a local server (see [Demo](#demo)) to see every token and component rendered from the shipped files.

## Contents

| Path | What it is |
| --- | --- |
| `css/tokens.css` | Every value as a plain `:root` custom property. The single source of truth. |
| `css/fonts.css` | `@font-face` rules for non-Next projects |
| `css/base.css` | Element defaults: body, headings, focus ring, selection |
| `css/components.css` | Button, liquid CTA, fields, checkbox, chips, disclosure, theme toggle |
| `css/utilities.css` | Container, sections, inverse surface, type roles, helpers |
| `css/theme.css` | Optional dark mode, following the OS until the reader chooses |
| `css/index.css` | Plain-CSS entry: fonts, tokens, then base / components / utilities in cascade layers |
| `tailwind/index.css` | Tailwind 4 entry: the same CSS in Tailwind's layers, plus utility names for the tokens |
| `react/` | `Button`, `LiquidLink`, `LiquidButton`, `LiquidBadge`, `ThemeProvider`, `ThemeToggle`, `themeBootstrap` |
| `next/fonts.ts`, `next/liquid-link.tsx` | `next/font/local` loaders for Danidin and Leon; `NextLiquidLink` for client routing |
| `js/liquid-motion.js` | Framework-free liquid motion (`enhanceLiquid()`) for plain HTML |
| `fonts/` | Danidin Condensed Bold, Leon Regular, Leon Heavy (WOFF2) |
| `demo/index.html`, `demo/serve.mjs` | Live reference page and a static server for it |

## Install

Copy the folder (for example to `design-system/` in the new repo). It needs no build step. `package.json` declares subpath exports, so `npm install ./design-system` also works if you prefer `@moriz/design-system/...` imports.

The fonts are commercial typefaces. Confirm the license covers the new project before shipping them.

### Plain HTML or any framework

```html
<html lang="he" dir="rtl">
  <head>
    <link rel="stylesheet" href="design-system/css/index.css" />
    <!-- Optional dark mode -->
    <link rel="stylesheet" href="design-system/css/theme.css" />
  </head>
```

Kit rules live in the `mz.base`, `mz.components` and `mz.utilities` cascade layers. Any CSS you write outside a layer overrides them without specificity contests. Tokens and the theme stay unlayered. `base.css` sets `box-sizing: border-box` but is not a full reset: headings and paragraphs keep browser margins unless you remove them.

For the liquid CTA without React, write the markup shown in the demo and call `enhanceLiquid()` once:

```html
<script type="module">
  import { enhanceLiquid } from "./design-system/js/liquid-motion.js";
  enhanceLiquid();
</script>
```

### Next.js with Tailwind 4

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/tailwind/index.css";
@import "../design-system/css/theme.css"; /* optional dark mode */
@source not "../design-system/demo";
```

```tsx
// app/layout.tsx
import { fontVariables } from "../design-system/next/fonts";
import { ThemeProvider, themeBootstrap } from "../design-system/react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Sets data-theme before paint. Omit both this and the provider for light only. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap("my-app:theme") }} />
      </head>
      <body>
        <ThemeProvider storageKey="my-app:theme">{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

The adapter maps every token to a Tailwind name: `bg-primary`, `bg-surface`, `text-text-secondary`, `border-border-strong`, `font-display`, `text-h1` (size, line height and tracking together), `rounded-liquid`, `shadow-hard`, `ease-enter`, `max-w-prose`. Spacing utilities (`p-6`, `gap-4`, `ms-8`) land on the same 0.25rem rhythm as `--space-*`. Tailwind's default colors, fonts, radii and type sizes are removed, so `bg-red-500` produces nothing.

The adapter references the tokens with `@theme inline reference`. That keeps a single source in `tokens.css` and lets `.surface-inverse` and the dark theme reach every utility. Biome 2.5 cannot parse that line, so leave `tailwind/index.css` outside Biome.

### Tailwind without Next.js

Use the Tailwind entry above and add `@import "../design-system/css/fonts.css";` because there is no `next/font` loader.

## Foundations

### Color

| Primitive | Value | Role |
| --- | --- | --- |
| `--color-primary` | `#fb2c36` | Brand red: accents and large graphics |
| `--color-secondary` | `#dddc8c` | Muted yellow: secondary emphasis and actions |
| `--color-dark` | `#262626` | Charcoal: text, inverse surfaces, strong borders |
| `--color-light` | `#fbfbff` | Off-white: canvas and inverse text |
| `--color-white` | `#fff` | Card surface in the light theme |

Build with the semantic roles, not the primitives. They are mixed from the four brand colors with `color-mix()`; there is no separate gray palette.

| Role | Light | Dark (`css/theme.css`) |
| --- | --- | --- |
| `--color-background` | Off-white | Charcoal |
| `--color-surface` | 5% charcoal in off-white | 7% off-white in charcoal |
| `--color-card` | White | Same as surface |
| `--color-text-primary` | Charcoal | Off-white |
| `--color-text-secondary` | Charcoal at 70% | Off-white at 80% |
| `--color-border` | 25% charcoal in off-white | 25% off-white in charcoal |
| `--color-border-strong` | Charcoal | Off-white |
| `--color-focus` | Charcoal | Muted yellow |
| `--color-accent-text` | Action red | Brand red |
| `--color-action-primary` | 80% red + 20% charcoal | Unchanged |
| `--color-action-primary-hover` | 65% red + 35% charcoal | Unchanged |
| `--color-action-secondary-hover` | 85% yellow + 15% charcoal | Unchanged |

Also available: `--color-background-inverse`, `--color-surface-strong`, `--color-text-inverse`, `--color-text-secondary-inverse`, `--color-accent` (pure red) and `--color-overlay` (charcoal at 40%, for modal backdrops).

Contrast: charcoal on off-white is about 14.7:1, off-white on action red about 5:1, charcoal on yellow about 10.6:1. Pure brand red fails 4.5:1 with both text colors at ordinary sizes, so it is for large type and graphics only. Use `--color-accent-text` for red text and `--color-action-primary` for button fills.

`.surface-inverse` turns any region charcoal and flips the text, border and focus roles inside it. Components need no extra rules there.

### Typography

| Family | Face | Weight | Roles |
| --- | --- | --- | --- |
| Danidin | Condensed Bold | 700 | Display, H1, H2 |
| Leon | Heavy | 900 | H3, H4, labels, buttons |
| Leon | Regular | 400 | Body, captions, liquid CTA, inputs |

Only these faces exist. `font-synthesis: none` stops the browser from faking others.

| Class | Size | Line height | Tracking |
| --- | --- | --- | --- |
| `type-display` | `clamp(5rem, 11vw, 10rem)` | 0.82 | -0.035em |
| `type-h1` | `clamp(4rem, 9vw, 9rem)` | 0.86 | -0.03em |
| `type-h2` | `clamp(3rem, 6vw, 6rem)` | 0.9 | -0.025em |
| `type-h3` | `clamp(2rem, 3vw, 3rem)` | 1 | -0.02em |
| `type-h4` | 1.5rem | 1.15 | |
| `type-body-lg` | 1.25rem | 1.5 | |
| `type-body` | 1rem | 1.6 | |
| `type-body-sm` | 0.875rem | 1.55 | |
| `type-label` | 0.875rem | 1.2 | |
| `type-caption` | 0.75rem | 1.4 | |

Pick the heading level for document structure and the class for appearance. Type classes never set margins. `prose-measure` limits reading width to 65ch. Keep the browser's root font size: everything is in `rem`.

### Space, layout and shape

- **Spacing:** `--space-1` to `--space-40` (0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 10rem).
- **Container:** `site-container` is full width with a 2rem gutter on both sides at every size.
- **Sections:** put `section-sm` / `section-md` / `section-lg` on the outer element (fluid 4–6, 5–8, 6–10rem vertical padding) and `site-container` inside it.
- **Radii:** `xs` 2px, `sm` 4px (buttons), `md` 6px, `liquid` 0.72rem, `pill`.
- **Borders:** `--border-width-default` 1px for dividers, `--border-width-strong` 2px for control boundaries and focus.
- **Depth:** surfaces are flat. `shadow-hard` (a 4px offset, no blur) is opt-in.
- **Controls:** 44 / 48 / 56px minimum heights (`--control-height-sm|md|lg`).

There is no fixed breakpoint map. Choose breakpoints from content fit, and check 320, 390, 768, 1024, 1440 and 1920px plus 200% text size.

### Motion

`--duration-fast|normal|slow` (0.15 / 0.3 / 0.6s) with `--ease-standard`, `--ease-enter` and `--ease-exit`. Under `prefers-reduced-motion` the durations become 0s. Literal durations, SVG filters and JavaScript motion must check the preference themselves; the kit's components already do. `--ease-liquid` is the liquid CTA's spring, an intentional exception.

## Components

### Button

```tsx
import { Button, buttonClassName } from "../design-system/react";

<Button variant="primary" size="md" type="submit">שליחת הודעה</Button>
<Button variant="secondary" size="sm">שמירת טיוטה</Button>
<Button variant="outline" disabled>לא זמין</Button>
<Button variant="ghost">ביטול</Button>
<a href="/projects" className={buttonClassName("outline")}>צפייה בפרויקטים</a>
```

Plain HTML uses the classes directly: `button button--{primary|secondary|outline|ghost} button--{sm|md|lg}`. The default `type` is `button`. Both `disabled` and `aria-disabled` disable the native control. For navigation use an anchor; button styling cannot disable a link.

### Liquid CTA

```tsx
import { NextLiquidLink } from "../design-system/next/liquid-link";
import { LiquidButton, LiquidLink } from "../design-system/react";

<LiquidLink href="#projects" arrow="down">לצפייה בפרויקטים</LiquidLink>
<NextLiquidLink href="/projects" variant="secondary">כל הפרויקטים</NextLiquidLink>
<LiquidButton type="submit">שליחת הודעה</LiquidButton>
```

`LiquidLink` renders a native anchor. For client-side routing in Next.js, use `NextLiquidLink`. A Server Component cannot pass `next/link` through the `as` prop, because functions cannot cross into Client Components. Inside your own client components, `as` accepts any router link. `glyph` replaces the arrow, and `icon` takes a portrait image. `LiquidBadge` is a visual-only copy for use inside another interactive element. Each instance creates its own SVG filter. The liquid CTA has no loading or disabled styles yet.

To customize one instance, set `--liquid-height`, `--liquid-fill`, `--liquid-pressed-fill`, `--liquid-ink` or `--radius-liquid` on it. For example, the site's WhatsApp submit uses `--liquid-fill: #25d366; --liquid-ink: var(--color-dark)`. That green is channel-specific, not a system color.

### Form fields

```html
<div class="field">
  <label class="field__label" for="phone">Phone<span class="field__required" aria-hidden="true">*</span></label>
  <input class="input" id="phone" type="tel" dir="ltr" aria-invalid="true" aria-describedby="phone-error" />
  <span class="field__error" id="phone-error">Enter 9 to 15 digits.</span>
</div>
```

Use `input--multiline` on a textarea, `field__optional` and `field__hint` for secondary text, and the `checkbox` markup from the demo. Mark errors with `aria-invalid` plus a message; the stronger border is a second cue, not the only one. Keep phone and email `dir="ltr"` inside RTL forms.

### Chips, disclosures, theme toggle

- `chip-list` + `chip` (`chip--inverse`, `chip--surface`, `chip--compact`) for static content labels. They are not filters.
- `disclosure-group` > `details.disclosure` > `summary.disclosure__summary` + `.disclosure__content`. Give the plus icon's vertical stroke the `disclosure__stem` class so it disappears when the row is open.
- `<ThemeToggle labels={{ switchToLight: "…", switchToDark: "…" }} />` inside `ThemeProvider`. It is hidden until the bootstrap has set `data-theme`.

## Direction and accessibility

- Set `lang` and `dir` on `<html>`. Use logical properties (`padding-inline`, `inset-inline-start`, `text-align: start`) and natural DOM order.
- `directional-icon` mirrors a right-pointing arrow in RTL. Never mirror logos, portraits or play symbols. Wrap mixed-language names in `<bdi>`.
- The global focus ring is a 2px outline at a 4px offset with an off-white inner ring, so it shows on charcoal and red. Keep it.
- `visually-hidden` hides text visually while keeping it available to screen readers.

## Known gaps

The source site never defined these. Design them deliberately rather than inventing them ad hoc:

- Success, warning and error colors, and a data-visualization palette
- Loading, empty and notification states; disabled and pending styles for the liquid CTA
- Cards, modals, tables and navigation components. The site's header, mobile drawer and FAQ panel are page compositions; see `src/components/` in the source repo.

## Demo

`demo/index.html` loads the kit's real CSS, fonts and motion script, so it doubles as a smoke test. Browsers block ES modules (and sometimes fonts) over `file://`, so serve the folder with the bundled zero-dependency server (Node 20.11 or later):

```bash
node design-system/demo/serve.mjs
```

Then open `http://127.0.0.1:4319/demo/` (set `PORT` to change it). Use the header controls to switch light/dark and LTR/RTL.

## Changing the system

Edit values in `css/tokens.css` only. Components, the theme and the Tailwind adapter read them by name. To add a token for Tailwind, add one `var()` line to `tailwind/index.css`. If you change the brand colors, re-check the contrast pairs above.

Background on the original implementation is in [`docs/09-design-system.md`](../docs/09-design-system.md) and [`docs/design-system-reuse.md`](../docs/design-system-reuse.md) in the source repo.
