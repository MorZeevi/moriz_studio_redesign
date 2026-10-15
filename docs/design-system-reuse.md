# Moriz design system for new projects

Use this guide to build another project with the Moriz website’s visual system: condensed display typography, readable Hebrew and Latin text, charcoal and off-white surfaces, red and yellow accents, compact controls, and distinctive liquid links. Start with the shared foundations, then select the component patterns your new product needs.

The companion [visual reference](design-system-visual.html) contains embedded fonts, color swatches, live button states, light and dark previews, and form examples. Open it directly in a browser; it needs no server or internet connection.

Snapshot: 15 October 2026, repository revision `9fe3aa8` plus the current working tree. Values below describe the public studio website. The separate `/digital-audit` product and CMS admin interface have their own behavior and are outside this system. This guide supersedes older component descriptions where they differ from the linked implementation.

## Start here

1. Copy the [`design-system/`](../design-system/README.md) kit folder. It holds the three font assets, tokens, foundations and components listed in **Files to reuse**, and is what this site runs on.
2. For a Tailwind project, keep the CSS-first token setup and import order below. For plain CSS, translate the Tailwind directives as described below.
3. Apply Danidin and Leon once at the application root. Keep the browser’s default root font size.
4. Use semantic colors, type roles, spacing tokens, and logical CSS throughout the new UI.
5. Add the theme layer and liquid components if your new project needs those patterns.
6. Supply the new project’s own content, routes, media, form handling, and branding assets.

## Visual character

The system is bold, expressive, and slightly brutalist. Large condensed headings contrast with quiet, regular-weight body text. Layouts use generous whitespace, full-width sections, visible rules, and mostly flat surfaces. Red signals emphasis; muted yellow provides secondary emphasis. Rounded liquid controls sit alongside compact rectangular foundation buttons.

Use this visual language independently of the studio’s homepage composition. The logo, portrait, project photography, section order, grain, opening animation, and Party Mode are site-specific choices rather than prerequisites for using the system.

## Colors

### Brand palette

| Token | Exact value | Role |
| --- | --- | --- |
| `--color-primary` | `#fb2c36` | Brand red for expressive accents and large graphic areas |
| `--color-secondary` | `#dddc8c` | Muted yellow for secondary emphasis and secondary actions |
| `--color-dark` | `#262626` | Charcoal for text, inverse surfaces, and strong boundaries |
| `--color-light` | `#fbfbff` | Off-white canvas and inverse text |

### Semantic roles

Keep the `color-mix()` expressions as the source of truth. They derive neutral surfaces and states from the four brand colors without introducing a separate gray palette.

| Token | Default value or expression | Use |
| --- | --- | --- |
| `--color-background` | `var(--color-light)` | Page canvas |
| `--color-background-inverse` | `var(--color-dark)` | Inverse canvas |
| `--color-surface` | `color-mix(in srgb, var(--color-dark) 5%, var(--color-light))` | Subtle raised or grouped surface |
| `--color-surface-strong` | `color-mix(in srgb, var(--color-dark) 90%, var(--color-light))` | Surface inside an inverse region |
| `--color-text-primary` | `var(--color-dark)` | Primary text |
| `--color-text-secondary` | `color-mix(in srgb, var(--color-dark) 70%, transparent)` | Secondary text |
| `--color-text-inverse` | `var(--color-light)` | Text on charcoal or action red |
| `--color-text-secondary-inverse` | `color-mix(in srgb, var(--color-light) 80%, transparent)` | Secondary text in inverse regions |
| `--color-border` | `color-mix(in srgb, var(--color-dark) 25%, var(--color-light))` | Subtle dividing rules |
| `--color-border-strong` | `var(--color-dark)` | Meaningful control boundaries |
| `--color-accent` | `var(--color-primary)` | Expressive accent |
| `--color-focus` | `var(--color-dark)` | Focus outline in the default context |
| `--color-overlay` | `color-mix(in srgb, var(--color-dark) 40%, transparent)` | Modal backdrop |
| `--color-action-primary` | `color-mix(in srgb, var(--color-primary) 80%, var(--color-dark))` | Readable primary button fill |
| `--color-action-primary-hover` | `color-mix(in srgb, var(--color-primary) 65%, var(--color-dark))` | Primary hover or liquid press |
| `--color-action-secondary-hover` | `color-mix(in srgb, var(--color-secondary) 85%, var(--color-dark))` | Secondary hover or liquid press |

Pure brand red does not reach 4.5:1 with either brand text color at normal UI text sizes. Use `action-primary` with off-white text for primary buttons. The standard palette provides approximately 14.66:1 for charcoal on off-white, 4.98:1 for off-white on action red, and 10.59:1 for charcoal on muted yellow. These ratios describe opaque default color pairs; check composited text and local overrides separately.

White (`#fff`) is also used locally for navigation and FAQ surfaces. WhatsApp green (`#25d366`) belongs to WhatsApp-specific controls; it is not a general success token. The system does not define a complete success, warning, error, or data-visualization palette. Define those roles deliberately if the new product needs them.

### Light and dark themes

The public theme layer is scoped to `:root[data-public-site]`. Dark mode uses `[data-theme="dark"]`, with an operating-system fallback before JavaScript initializes. It maps public roles onto the shared semantic colors.

| Public role | Light | Dark |
| --- | --- | --- |
| `--site-background` | Off-white | Charcoal |
| `--site-foreground` | Charcoal | Off-white |
| `--site-muted` | Charcoal at 70% alpha | Off-white at 80% alpha |
| `--site-surface` | 5% charcoal mixed into off-white | 7% off-white mixed into charcoal |
| `--site-card` | White | Same as dark surface |
| `--site-border` | 25% charcoal mixed into off-white | 25% off-white mixed into charcoal |
| `--site-focus` | Charcoal | Muted yellow |
| `--site-heading-accent` | Action red | Brand red |

The theme layer also sets browser color scheme, selection-related accent color, and scrollbar colors. In dark mode, homepage hero and header CTAs use off-white fill with charcoal text through `--site-cta-*` overrides. The general `Button` primary variant remains action red. Secondary liquid links remain yellow.

For behavioral parity, reuse `theme.css`, `theme-provider.tsx`, `theme-toggle.tsx`, its CSS module, and `lib/theme.ts`. Keep the pre-paint bootstrap in the new root layout, then mount the provider around the application. Rename the storage key `moriz:theme` for the new product. System preference is followed until an explicit selection; the visible control toggles light and dark. See [theme behavior](theme.md).

## Typography

### Font families

| Family | Supplied face | Weight | Roles |
| --- | --- | --- | --- |
| Danidin | `Danidin-CondensedBold.woff2` | 700 | Display, H1, and H2 |
| Leon | `Leon-Regular.woff2` | 400 | Body, captions, liquid CTAs, navigation, and inputs |
| Leon | `Leon-Heavy.woff2` | 900 | H3, H4, labels, and foundation buttons |

Both families support Hebrew and Latin text. Danidin is the condensed **Bold** face, not Black. Do not request unavailable medium, italic, or semibold faces. `font-synthesis: none` prevents invented bold or italic styles.

`design-system/next/fonts.ts` (re-exported here by `src/styles/fonts.ts`) uses `next/font/local` with `display: "swap"`. Its variables are `--font-danidin-bold` and `--font-leon`; the token layer maps them to `--font-display` and `--font-body`. Fallbacks are Arial/sans-serif for Danidin and Arial/Helvetica/sans-serif for Leon. Reuse font files on another project under the applicable font license.

### Shared type scale

Sizes assume `1rem = 16px`, the browser default. Keep `rem` values in implementation so user font preferences remain effective. Choose semantic heading levels separately from the visual role.

| Utility | Font and weight | Size | Line height | Tracking |
| --- | --- | --- | --- | --- |
| `type-display` | Danidin 700 | `clamp(5rem, 11vw, 10rem)` | 0.82 | -0.035em |
| `type-h1` | Danidin 700 | `clamp(4rem, 9vw, 9rem)` | 0.86 | -0.03em |
| `type-h2` | Danidin 700 | `clamp(3rem, 6vw, 6rem)` | 0.9 | -0.025em |
| `type-h3` | Leon 900 | `clamp(2rem, 3vw, 3rem)` | 1 | -0.02em |
| `type-h4` | Leon 900 | 1.5rem / 24px | 1.15 | Normal |
| `type-body-lg` | Leon 400 | 1.25rem / 20px | 1.5 | Normal |
| `type-body` | Leon 400 | 1rem / 16px | 1.6 | Normal |
| `type-body-sm` | Leon 400 | 0.875rem / 14px | 1.55 | Normal |
| `type-label` | Leon 900 | 0.875rem / 14px | 1.2 | Normal |
| `type-caption` | Leon 400 | 0.75rem / 12px | 1.4 | Normal |

Headings use balanced wrapping; paragraphs use pretty wrapping. Type utilities set typography rather than margins. Use `--container-prose: 65ch` to constrain long reading passages.

### Existing site exceptions

The current homepage retains smaller composition-specific `--trial-*` values. Use the shared type scale for new sections. Use these exceptions only when reproducing the existing homepage exactly:

| Existing role | Value |
| --- | --- |
| Mobile hero | `clamp(2.75rem, 10vw, 5rem)` |
| Desktop hero at 64rem and above | `clamp(4.5rem, 7.8vw, 7rem)` |
| Hero description | `clamp(1rem, 1.25vw, 1.125rem)` |
| Wordmark | `clamp(1.125rem, 2vw, 1.5rem)` |
| Mobile menu | `clamp(1.75rem, 4vw, 2.5rem)` |
| Retained section heading | `clamp(1.75rem, 3.5vw, 2.75rem)` |

Local component sizes also exist, such as FAQ headings and project titles. They belong to those compositions and do not replace the shared scale.

## Spacing and layout

### Spacing scale

The base increment is `0.25rem` / 4px. Tailwind names use `--spacing-*`; regular CSS can use equivalent `--space-*` aliases.

| Step | rem | Default px | Typical use |
| --- | --- | --- | --- |
| 1 | 0.25 | 4 | Focus offset and small separation |
| 2 | 0.5 | 8 | Icon gaps and field label gaps |
| 3 | 0.75 | 12 | Compact padding |
| 4 | 1 | 16 | Body grouping and chip padding |
| 6 | 1.5 | 24 | Grid gaps and component padding |
| 8 | 2 | 32 | Page gutters and larger internal padding |
| 10 | 2.5 | 40 | Composition gaps |
| 12 | 3 | 48 | Larger content separation |
| 16 | 4 | 64 | Section-level separation |
| 20 | 5 | 80 | Large spacing |
| 24 | 6 | 96 | Large spacing |
| 30 | 7.5 | 120 | Display spacing |
| 40 | 10 | 160 | Maximum shared spacing step |

### Containers and sections

`site-container` fills 100% of the available width with `padding-inline: 2rem` on each side at every breakpoint. There is no 90rem maximum width or fluid gutter. `page-shell` and `hero-shell` are compatibility aliases for the same container. The fixed gutter is 32px at the default root size, including on a 320px viewport.

| Section utility | Vertical padding |
| --- | --- |
| `section-sm` | `clamp(4rem, 7vw, 6rem)` |
| `section-md` | `clamp(5rem, 9vw, 8rem)` |
| `section-lg` | `clamp(6rem, 12vw, 10rem)` |

Apply section spacing to the outer section and the container to its inner content. Use `minmax(0, 1fr)` in flexible grids and `min-inline-size: 0` on children to prevent long content from widening the page.

### Responsive patterns

There is no single universal breakpoint map. These are observed composition thresholds:

| Width | Existing behavior |
| --- | --- |
| Below 23rem / 368px | FAQ control shrinks from 56px to 48px |
| Up to 640px | Project image pairs and galleries use one column |
| At 60rem / 960px | Project rows and details switch to desktop grids |
| At 64rem / 1024px | Desktop navigation appears, mobile drawer yields, contact fields pair into columns |
| 64rem to below 75rem | Compact header navigation and smaller header CTA |
| 75rem to below 85rem | Intermediate navigation padding |

Choose new component breakpoints based on content fit while retaining the shared typography, spacing, and gutters. Review at 320, 390, 768, 1024, 1440, and 1920px and with enlarged text.

## Shape and depth

| Token | Value | Role |
| --- | --- | --- |
| `--radius-xs` | 0.125rem / 2px | Minimal rounding; also the button press offset |
| `--radius-sm` | 0.25rem / 4px | Foundation button corners |
| `--radius-md` | 0.375rem / 6px | Compact rounded surfaces |
| `--radius-liquid` | 0.72rem / 11.52px | Shared liquid control silhouette |
| `--radius-pill` | 999rem | Chips and fully rounded controls |
| `--border-width-default` | 0.0625rem / 1px | Dividers and subtle boundaries |
| `--border-width-strong` | 0.125rem / 2px | Strong boundaries and focus width |
| `--shadow-hard` | `0.25rem 0.25rem 0 var(--color-dark)` | Optional hard offset shadow |

Surfaces are flat by default. Use tonal differences, whitespace, or thin rules to establish hierarchy. The hard shadow is available but is not globally applied. Focus ring box shadows serve visibility rather than decorative elevation.

There is no universal card component. Existing service cards use contextual card surfaces, liquid rounding, and a 1px foreground border mixed to 10% alpha. Their text area has 24px padding on compact layouts and 32px on desktop. Project media uses rectangular 16:9 frames with thin rules. Preserve the distinction between editorial content and controls.

## Buttons and action links

### Foundation Button

Use `Button` for actions. Its defaults are `variant="primary"`, `size="md"`, and `type="button"`. It passes through native button props and a ref. Set `type="submit"` explicitly inside a form.

| Variant | Fill | Text | Border | Hover |
| --- | --- | --- | --- | --- |
| Primary | Action red | Off-white | 2px action red | Darker action red and underline |
| Secondary | Muted yellow | Charcoal | 2px strong contextual border | Darker yellow and underline |
| Outline | Transparent | Contextual primary text | 2px strong contextual border | Charcoal fill, off-white text, underline |
| Ghost | Transparent | Contextual primary text | 2px transparent | Subtle surface fill and thicker underline |

All foundation buttons use Leon Heavy 900, 4px rounding, an 8px content gap, and centered wrapping text. Ghost text is already underlined at rest. Outline hover is explicitly charcoal/off-white, including inside inverse surfaces.

| Size | Minimum height | Vertical and horizontal padding | Font size |
| --- | --- | --- | --- |
| `sm` | 2.75rem / 44px | 0.5rem 0.75rem / 8px 12px | 0.875rem / 14px |
| `md` | 3rem / 48px | 0.75rem 1.5rem / 12px 24px | 1rem / 16px |
| `lg` | 3.5rem / 56px | 1rem 2rem / 16px 32px | 1.25rem / 20px |

The sizes are minimums, so wrapping or text enlargement can increase height. Press moves the control down 2px and adds a thicker underline. Disabled state uses 50% opacity and a not-allowed cursor. Both `disabled` and `aria-disabled={true}` make this React component natively disabled. Reduced motion removes press translation and transition durations.

```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary" size="md" type="submit">שליחת הודעה</Button>
<Button variant="secondary" size="sm">שמירת טיוטה</Button>
<Button variant="outline" size="md" disabled>לא זמין</Button>
<Button variant="ghost" size="sm">ביטול</Button>

// Navigation uses an anchor, with the same visual classes when appropriate.
<a href="/projects" className="button button--outline button--md">
  צפייה בפרויקטים
</a>
```

An anchor is not disabled by button styling or `aria-disabled` alone. Use an appropriate noninteractive representation or prevent activation explicitly when navigation is unavailable.

### Liquid links and buttons

This is the public website’s signature CTA: a rounded icon square joined to a rounded label through an SVG goo bridge. Use `LiquidLink` for navigation, `LiquidButton` for actions, and `LiquidBadge` only as a visual label inside another interactive surface.

| Property | Specification |
| --- | --- |
| Text | Leon Regular 400, 1rem, line height 1.4 |
| Height | Minimum 3rem / 48px |
| Corner radius | `--radius-liquid`, 0.72rem |
| Label padding | 0.6em vertically and 1.15em horizontally |
| Primary | Action-red fill and off-white ink |
| Secondary | Muted-yellow fill and charcoal ink |
| Resting gap | 2px |
| Hover and keyboard focus | Gap expands to 1.35em; bridge remains connected |
| Motion | 0.55s with `cubic-bezier(0.3, 1.45, 0.55, 1)` |
| Press | Gap returns to 2px over 0.18s and fill uses the darker state |
| Keyboard focus | A visible 2px underline inside the filtered label |
| Reduced motion | Static 2px connected silhouette with focus underline retained |

Each instance needs a unique SVG filter id. The component interpolates blur from 3.5 to 7 during the transition. Use the kit's React component, or call `enhanceLiquid()` from `design-system/js/liquid-motion.js` on plain pages; the CSS alone omits the filter and motion behavior. The standard CTA has no cursor glow or hover shadow. The separate navigation component has its own glow behavior.

```tsx
import { LiquidButton, LiquidLink } from "@/components/ui/liquid-link";

<LiquidLink href="#projects">לצפייה בפרויקטים</LiquidLink>
<LiquidLink href="/projects" variant="secondary" navigation="client">
  כל הפרויקטים
</LiquidLink>
<LiquidButton type="submit">שליחת הודעה</LiquidButton>
```

`LiquidLink` defaults to native anchors. `navigation="client"` uses Next.js `Link`. Directional arrows mirror in RTL; `arrow="down"` stays downward in either direction. A `glyph` can replace the arrow without mirroring; the `icon` prop on `LiquidLink` supports a portrait treatment. Liquid controls do not inherit all `.button` states: for example, there is no shared liquid loading style or general disabled appearance. Add these states deliberately for new async actions.

The header CTA has its own theme-aware charcoal/off-white treatment and becomes yellow on hover/focus. The footer submit locally uses 52px minimum height, 16px radius, and 20px text; choosing WhatsApp changes it to WhatsApp green with charcoal ink. These are component overrides rather than additional global button variants.

## Forms and inputs

The current footer contact form uses pill fields and regular-weight labels. Its implemented fields are required name and phone, an optional message, and a WhatsApp-preference checkbox. The form currently validates a preview; it does not deliver or store submissions. Reuse its visual pattern independently of its submission behavior.

| Element | Current specification |
| --- | --- |
| Form | Full available width, maximum 40rem / 640px |
| Field grid | One column; two at 64rem and above; 24px gaps |
| Label | Leon 400, 16px, line height 1.4; 8px gap to control |
| Input | Minimum 48px high; 8px 24px padding; fully rounded |
| Input type | Leon 400, minimum 16px, line height 1.6 |
| Fill | Foreground at 6% alpha over the current surface |
| Border | 1px foreground at 35% alpha; solid foreground on hover/focus |
| Textarea | 24px radius, 16px vertical padding, vertical resizing |
| Invalid | 2px solid foreground border with an explicit message below |
| Error text | 14px, line height 1.55, contextual foreground |
| Checkbox | Native 24px square control with 0.4rem radius; green checked fill |

Associate every label with its input. Invalid fields use `aria-invalid` and `aria-describedby`; submit focuses the first invalid field. Do not use color alone to communicate errors. Required markers use the theme’s heading accent. Keep phone/email direction LTR inside an RTL form. The existing phone rule accepts 9–15 digits after common separators are removed; decide validation rules for the new product explicitly.

The checked checkbox uses `#25d366` with a charcoal tick. It represents the WhatsApp channel, not a generic positive state. The form’s specific disabled and pending behavior is not a reusable async submission system.

## Navigation and other components

### Navigation

Desktop navigation appears at 64rem / 1024px. It uses 44px-high liquid pills, Leon 400, white surfaces in light mode and theme surfaces in dark mode. Neighboring pills stretch on hover, focus, and the current location. A muted-yellow cursor glow is capped at 32% mixing and the active link has a location dot. At 1024–1199px the navigation uses a compact 12.5px font and smaller padding; this is a header-fit exception.

The mobile menu uses a native dialog with Escape support, focus containment, focus restoration, and close-on-navigation behavior. Keep accessible navigation semantics and the new product’s own routes. The separate unavailable EN control on this site is a content-state decision, not a design-system requirement.

### Chips

Research tags use Leon 400 at 16px / 1.25, 8px 16px padding, 1px strong borders, and pill rounding. Their surfaces alternate contextual card, charcoal/off-white, and subtle surface. These are content labels, not selectable filters. Falling physics and Party Mode are optional site effects; keep tags static unless the new product needs that interaction.

### Accordions

Two patterns are implemented. Project details use native disclosures separated by 1px rules, 48px minimum summary height, 14px questions, and 14px / 1.65 answers. The plus becomes a minus when open. FAQ uses a joined white panel and a 56px icon tile, 16px rounding, regular question text, a plus rotating 45 degrees on open, and 16px / 1.7 answers. Its content remains charcoal on white in both themes. Both retain keyboard focus and native disclosure behavior.

The FAQ currently uses pure brand red for an open question at ordinary text sizes. In a new product, use action red or another verified text color for that state if a 4.5:1 contrast target applies. This is a local adjustment to make during reuse, not a new global token.

### Media and icons

Project preview frames use a 16:9 ratio, thin rules, and cover-fit images. A liquid badge follows the pointer; keyboard focus centers the badge, and touch keeps it visible in a corner. The badge is decorative inside the media link, avoiding nested interactive controls.

The default icon size is 24px. Liquid arrows use an inline SVG with a 16×16 viewBox and 1.8-unit rounded strokes, displayed at 1.15em. Mirror directional navigation arrows in RTL; do not mirror brand marks, portraits, play symbols, or channel icons.

## Motion and accessibility

| Token | Value | Use |
| --- | --- | --- |
| `--duration-fast` | 0.15s | Basic interaction feedback |
| `--duration-normal` | 0.3s | Standard transitions |
| `--duration-slow` | 0.6s | Longer transitions |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | General feedback |
| `--ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entering elements |
| `--ease-exit` | `cubic-bezier(0.7, 0, 0.84, 0)` | Exiting elements |

Under `prefers-reduced-motion: reduce`, the three duration tokens become 0s. Components with literal transition durations, SVG filters, or JavaScript motion also need their own reduced-motion handling. The liquid CTA’s spring timing is a documented local exception to the standard easing set.

Global keyboard focus uses a 2px outline, a 4px offset, and an off-white inner ring (`box-shadow: 0 0 0 4px var(--color-light)`). Liquid links and FAQ summaries provide their own visible focus treatment so filtering does not hide it. Selected text uses charcoal on muted yellow.

Set document `lang` and `dir`; use logical properties such as `padding-inline`, `margin-inline-start`, `inset-inline-end`, and `text-align: start`. Keep natural reading order in the DOM. Use `bdi` for mixed-language names and numbers where isolation is needed. A new English product can use the same fonts and tokens with `lang="en" dir="ltr"`.

For handoff, verify keyboard-only use, meaningful labels, native disabled behavior, 200% text enlargement, contrast in both themes, touch activation, reduced motion, and no horizontal overflow at compact widths. Async loading, general empty states, data tables, and system notification styles are new design work rather than established components in this repository.

## Files to reuse

Paths below are relative to this repository root. Preserve the relative font paths or update the loader when relocating files.

| Layer | Files | Notes |
| --- | --- | --- |
| Tokens, foundations, components | `design-system/` (`css/`, `tailwind/index.css`, `react/`, `next/`, `js/`) | The kit: plain-CSS tokens, Tailwind 4 adapter, button, liquid CTA, fields, chips, disclosures, theme toggle |
| Fonts | `design-system/fonts/{Danidin-CondensedBold,Leon-Regular,Leon-Heavy}.woff2` with `design-system/next/fonts.ts` or `css/fonts.css` | Three assets and one loader per family |
| Optional themes | `design-system/css/theme.css` and `design-system/react/theme.tsx` | Opt-in dark mode with bootstrap and provider; pass your own storage key |
| Site layer reference | `src/styles/site.css`, `src/styles/theme.css`, `src/components/ui/liquid-link.tsx`, `src/components/theme-toggle.tsx` | How this site adds its `--site-*` roles, aliases and `navigation` prop on top of the kit |
| Navigation reference | `src/components/navigation.tsx`, `liquid-navigation.tsx`, `liquid-navigation.module.css`, `src/styles/wireframe.css` | Extract only the navigation rules and adapt locale/content dependencies |
| Form reference | `src/components/footer-contact-form.tsx`, `footer-contact-form.module.css`, `contact-icons.tsx` | Adapt dictionary, contact fields, validation, and submission behavior |
| Disclosures and content | `src/components/faq.tsx`, `faq.module.css`, `projects.module.css` | Pattern references with site content and dependencies |

The minimum styling setup is Tailwind CSS 4 with `@tailwindcss/postcss`; current versions are recorded in `package.json`. The current application uses Next.js 16 and React 19. Basic tokens and CSS do not require Next.js, Motion, GSAP, Matter.js, Supabase, or the Diagnostic app. The TSX wrappers require React; the local font loader and optional client-navigation link use Next.js.

### Tailwind setup

```css
/* src/app/globals.css in a new project */
@import "tailwindcss";
@import "../design-system/tailwind/index.css";
@import "../design-system/css/theme.css"; /* Optional dark mode */
@source not "../design-system";
```

```js
// postcss.config.mjs
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

```tsx
// A minimal new Next.js root layout using the kit's font loaders.
import { danidin, leon } from "../design-system/next/fonts";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl"
      className={`${danidin.variable} ${leon.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

This minimal layout follows the operating system once `css/theme.css` is imported. Persistent manual selection also needs the kit's `themeBootstrap()` script and `ThemeProvider`; see the kit README. Omit the theme import to stay light-only.

```tsx
<section className="section-md">
  <div className="site-container">
    <h1 className="type-h1">כותרת הפרויקט החדש</h1>
    <p className="type-body-lg max-w-prose">תיאור ברור של המוצר שלכם.</p>
    <Button variant="primary" size="md">מתחילים</Button>
  </div>
</section>
```

Preserve import order: Tailwind, the kit adapter, the optional kit theme, then your own layers. Avoid importing the original `globals.css` unchanged: it brings homepage composition and opening-animation styles, as well as Diagnostic-specific scan exclusions.

### Plain CSS and other frameworks

Link `design-system/css/index.css` (fonts, tokens, base, components and utilities in cascade layers) and optionally `css/theme.css`. No build step or Tailwind is needed; see the kit README and its demo.

### Starter prompt for another coding agent

> Build this project using the attached Moriz design-system guide. Reuse the supplied tokens, Danidin Condensed Bold 700, Leon Regular 400, and Leon Heavy 900. Use semantic light/dark colors, a 4px spacing rhythm, full-width containers with 2rem logical gutters, the documented type scale, 44/48/56px foundation buttons, and accessible focus states. Use liquid CTAs only where appropriate. Keep Hebrew RTL and English LTR support through logical CSS. Preserve reduced-motion behavior and readable text contrast. Build the new project’s own content and composition; treat homepage trial metrics, Moriz identity assets, and special effects as optional references. Identify any new component or state that requires a design decision rather than inventing an existing system rule.

## Implementation sources

- [Design-system kit](../design-system/README.md): [tokens](../design-system/css/tokens.css), [components](../design-system/css/components.css), [Tailwind adapter](../design-system/tailwind/index.css) and [font loaders](../design-system/next/fonts.ts).
- [Public theme CSS](../src/styles/theme.css), [theme behavior](theme.md), and [locale root layout](../src/app/[locale]/layout.tsx).
- [Button](../design-system/react/button.tsx), [liquid component](../design-system/react/liquid.tsx), and the site's [liquid wrapper](../src/components/ui/liquid-link.tsx).
- [Current composition CSS](../src/styles/wireframe.css) and [liquid navigation CSS](../src/components/liquid-navigation.module.css).
- [Contact form](../src/components/footer-contact-form.tsx), [form CSS](../src/components/footer-contact-form.module.css), [FAQ CSS](../src/components/faq.module.css), and [project CSS](../src/components/projects.module.css).
- [Existing foundation guide](09-design-system.md) for the original foundation handoff.
