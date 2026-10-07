# Reuse this website project

Unzip `moriz-website-template.zip`, then open its `moriz-website-template` folder in your editor. The archive contains the complete source, local fonts, design system, development inspector, tests, planning notes and research references. Dependencies and generated build files are installed locally rather than bundled.

## Start locally

Install Node.js 22 (the project was developed with 22.14.0) and npm, then run:

```sh
cd moriz-website-template
npm ci
npm run dev
```

Open http://127.0.0.1:3000/he. Internet access is needed to install dependencies. No API keys or environment variables are required for the initial preview.

The floating **Developer tools** button opens the inspector. Turn inspection ON, click to select, or double-click to copy an element's ID/classes. Escape stops inspection. It is excluded from production builds. See [the inspector guide](docs/visual-element-inspector.md).

## Make it your own

- Hebrew text: `src/i18n/dictionaries/he.ts`.
- Page composition: `src/app/[locale]/page.tsx` and `src/components/`.
- Colors, typography and spacing: `src/styles/tokens.css`; follow [the design-system guide](docs/09-design-system.md).
- Fonts: `src/assets/fonts/`, registered in `src/styles/fonts.ts` and `src/styles/font-candidates.ts`. The supplied fonts may require your own license for reuse; use fonts you are licensed to use.
- Carousel logos: add images to `public/logos/` and update `src/content/homepage-logos.ts`.
- WhatsApp: copy `.env.example` to `.env.local`, set your own `NEXT_PUBLIC_WHATSAPP_NUMBER`, then restart the server.

This is an in-progress Moriz studio project: replace its identity, owner biography, project/client content and metadata before publishing your own site. Hebrew is enabled; English has direction-aware scaffolding but no translation yet. The video, logos and later sections still contain placeholders. Research screenshots are design references, not assets for your public website. Keep third-party attribution, including the React Bits component notice.

The shared planning documents record the original owner's choices; adapt them to your own brief if you continue with a coding agent.

## Check and build

```sh
npm run lint
npm run typecheck
npm run test:inspector:unit
npm run build
npm run start
```

Browser inspector tests additionally require Google Chrome: `npm run test:inspector`. Production verification runs after a build: `npm run test:inspector:production`.

This archive is editable source, not a hosted preview. `npm run dev` runs only on your own computer. Hosting is a separate step when your site is ready.
