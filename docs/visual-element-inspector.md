# Visual Element Inspector

## Use it locally

Run `npm run dev` and open `/he` or `/he/fonts`. The bottom-right controls expose **Developer tools** and an independent **Inspector: OFF/ON** toggle. Turn inspection ON directly, even with the details panel closed; open **Developer tools** when you need selected-element details or a prompt draft.

- Hover previews the deepest element under the pointer with a dashed border.
- Click locks selection with a solid border; another click changes it.
- Double-click a website element while inspection is ON to copy its escaped `#id`, or its compound `.class1.class2` selector when it has no ID. If neither exists, copy its unique DOM selector. A confirmation appears in the panel; clipboard failure exposes a selectable fallback. Normal website activation remains blocked.
- **Clear** clears selection and keeps inspection ON. **Escape**, switching OFF or changing routes stops inspection and clears highlights. Closing the panel only hides its details; inspection, selection and the draft remain available when you reopen it.
- **Move panel left/right** uncovers content behind the panel. The external controls stay at bottom right, separate from the provisional WhatsApp control. They stack on narrow screens; the panel fits above them, including at 200% text enlargement.
- Scrolling, touch panning and resizing remain available. Enter/Space selects a focused website element while inspection is ON. Website clicks and keyboard activation are intercepted; tool controls remain usable.
- Enter a request, then **Copy prompt**. Clipboard failure reveals a **Select prompt** fallback for manual copying. The draft survives route changes, but not a reload.

The English toolbar supports Hebrew content without translating it. No Codex request, analytics, API call or external message is sent.

## Source detection

[The Turbopack loader](../tools/devtools/source-loader.cjs) uses the existing TypeScript compiler API. In development only, it attaches `data-inspector-file`, `data-inspector-line`, `data-inspector-column` and, when known, `data-inspector-component` to intrinsic JSX elements in local `src/**/*.tsx`. It excludes devtools and dependencies. The original TSX supplies the one-based location; metadata paths are project-relative. The JSX-preserving transform emits source maps and preserves module directives before Next performs its normal compilation.

**Exact JSX declaration** identifies where that native element is written. **Component (declared)** is its lexically enclosing named component/function or class, including common arrow/memo/forwardRef forms; it is not a runtime owner tree. Anonymous components may have a file/line but no component name. No React Fiber internals, generated stack line guesses, browser extension or Babel configuration is required.

Generated HTML, `createElement` output, dynamic tag components and dependency internals may lack exact annotations. The nearest annotated ancestor is then shown as **Containing source**, explicitly not the selected element's exact declaration. Otherwise the panel displays **Unavailable**. Namespaced JSX tags are not annotated. Source positions identify JSX markup; text and styling may live in dictionaries, CSS Modules or shared tokens.

The current source transform targets the existing Turbopack setup. Switching to `next dev --webpack` would require configuring the same loader for webpack; DOM inspection can still operate without exact annotations.

## Structure and lifecycle

The [devtools folder](../src/components/devtools/) separates toolbar composition, overlay rendering, selected metadata, event/geometry management, portal ownership, DOM utilities, source resolution, prompt formatting and serializable types. Its CSS Module reuses the shared tokens and Button foundation; it does not alter public page styles.

The locale root layout conditionally imports the toolbar only for `NODE_ENV=development`. The Turbopack rule separately uses its `development` condition. Production has neither the toolbar client entry/CSS nor source attributes. No public route or API was added.

Inspection installs capture listeners only while ON and cleans up listeners, observers and animation frames when stopped. Geometry comes from `getBoundingClientRect`; coordinates and reported dimensions are CSS pixels. Frame scheduling tracks scrolling, resizing and animated elements, with selected subtree/size observers refreshing metadata. Disconnected selections clear automatically. Selectors use escaped IDs/classes and unique structural fallbacks. Text previews are limited to 500 characters, with truncation marked; live form control values are omitted. `dom-accessibility-api` computes accessible names.

A single owned portal hosts pointer-transparent overlays and interactive controls in a manual popover. When the site's native modal menu opens, the host moves inside it to avoid modal inertness while retaining top-layer rendering. Only inspector-owned nodes are appended/moved; inspected elements are never restyled or wrapped. The panel and Next developer UI are excluded from targeting.

V1 covers the current document's light DOM and SVG. Iframes and shadow-root internals are not traversed; select their host elements. Pseudo-elements cannot be independently selected. Use current browsers with native dialog/popover support; verification uses installed Chrome. Selectors identify the current DOM and can change after structural edits.

## Tests

The browser test runner is a development dependency; it uses installed Chrome without downloading a browser. Development tests reuse the server at port 3000 or start it if absent. The production test starts and stops its own server at port 3013 after a build.

```sh
npm run lint
npm run typecheck
npm run test:inspector:unit
npm run test:inspector
npm run build
npm run test:inspector:production
```

Source tests verify original positions, component declarations, spreads, SVG, exclusions, directives and source maps. Browser tests cover external ON/OFF with the panel closed, selection/draft preservation on collapse/reopen, lock/clear/Escape, link/button/keyboard suppression, disabled and nested elements, animation, scroll/resize, actual React rerenders, removed nodes, clipboard failure/success, modal menus, navigation, RTL/LTR, narrow viewports, text enlargement and closed-panel touch scrolling/selection. Production checks inspect both routes, static JS/CSS and the client-reference manifest for inspector artifacts.

## Connecting an agent later

`PromptContext` is a serializable payload containing page pathname/language/direction, selected DOM/source information and request text. `formatPrompt` converts it to readable context, independently of the clipboard. The live Element reference stays private to the inspection hook; `captureSelection()` refreshes the snapshot before copying.

Add an explicit **Send to agent** action with a separate transport adapter that accepts `PromptContext` (or its formatted text). That adapter can call an authorized coding-agent connector without changing selection, source mapping or overlay logic. No transport is implemented in this version.

## File changes

- Added `src/components/devtools/`: toolbar, overlay, selected panel, two hooks, DOM/source/prompt helpers, types and CSS Module.
- Added `tools/devtools/source-loader.cjs`, `tests/devtools/`, `playwright.inspector.config.ts` and this guide.
- Updated `next.config.ts` for development instrumentation and the locale root layout for conditional mounting.
- Updated package manifests for `dom-accessibility-api`, `@playwright/test` and scoped test/lint commands; `.gitignore` excludes test output.
- Updated README and PRODUCT to record this developer-only addition. Public homepage markup/content and design tokens are unchanged by this feature.
