# Public light and dark modes

The homepage, project collection and project pages follow the visitor's system preference until they choose a mode. A single sun/moon button switches immediately in desktop and mobile headers. There is no arrow or dropdown.

Manual `light`/`dark` choices persist in `localStorage["moriz:theme"]`. Without an override, follow live `prefers-color-scheme` changes. Storage events synchronize tabs. Invalid or unavailable storage falls back to System; a manual choice still works in memory when persistence is blocked. The owner's latest correction removes the return-to-System menu; subsequent button clicks switch between Light and Dark.

The locale root runs `themeBootstrap` before paint and mounts `ThemeProvider`. `data-theme` records the resolved mode; `data-theme-preference` records the selected preference. The provider reapplies these attributes during development remounts without changing server-rendered content. CSS also follows the OS without JavaScript. The separate admin root has no public marker or theme provider and retains its existing colors, including CMS previews.

The kit's [css/theme.css](../design-system/css/theme.css) maps stable palette primitives to the semantic roles for dark mode; only the public entry `globals.css` imports it, so the admin entry stays light. `src/styles/theme.css` derives the public `--site-*` roles from those roles and adds the dark-only CTA and hero accents. Dark canvas is `#262626`, primary foreground is `#fbfbff`, secondary foreground is 80% light, and elevated cards/nav use a 7% light mix over charcoal. Red/yellow accents and media remain unchanged. Shared controls use the chosen theme independently of the homepage Projects scroll fade. The font comparison utility inherits readable theme colors.

In Light, Projects keeps the existing whole-canvas scroll fade. Dark holds the canvas at charcoal everywhere; changing mode recomputes Projects before paint and cleans up its body variables on navigation. Party Mode refreshes only its cached tag colors, preserving the ball, physics, dances and active state. Switching it off restores the current theme.

Keep the grain, pixel opening, header hiding during that opening, and CSS-hidden hero introduction intact. At 1024–1199px, compact nav padding and contact sizing leave room for the theme control while retaining a centered desktop menu.

Checks: `tests/navigation/theme.spec.ts` covers pre-hydration system colors, persistence, routes, tabs, live OS changes, keyboard controls, responsive header fit, mobile drawer colors, blocked storage, disabled JavaScript, opening visibility, Projects switching and active Party restoration. Run it with `playwright.navigation.config.ts`, alongside the existing navigation/opening/backdrop checks and Party Mode regressions.
