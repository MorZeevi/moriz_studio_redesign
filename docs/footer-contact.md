# Contact form

Footer navigation correction, 2026-10-22: local section links use native anchors so repeated clicks on the current hash scroll again; page and cross-page links retain Next.js navigation. The parallax travel is capped at the empty top gutter so navigation never moves beneath the contact band. A footer taller than the viewport finishes its reveal when its top reaches the viewport top; shorter footers finish at the document bottom. The decorative wordmark ignores pointer events.

Current implementation, 15 October 2026. One `#contact` section appears before, and outside, the shared `<footer>` on the homepage and Projects page. Its outer canvas is transparent, exposing the site's fixed `page-grain` over the regular light/dark background. The form itself stays on the oversized red, grain-textured liquid silhouette.

## Layout and visual authority

Inside the side gutters, `.contactShell` retains the right-hand invitation, left-hand form and direct links, with generous padding. The owner's [small liquid button](research/assets/footer-contact-cta-2026-10-15/owner-liquid-shape.png) sets the shallow join's proportions. Hover or form focus stretches the decorative join; content stays fixed. Reduced motion keeps it still. Mobile stacks everything in one rounded red panel. Footer navigation and the wordmark remain below on the footer surface. The [15 October Mobbin research](research/footer-contact-cta-mobbin-2026-10-15.md) records the composition reference.

## Sending behavior

Name and phone are required; message is optional and has no placeholder. **שליחת הודעה** posts the entered details to `/api/contact`, which sends a plain-text email from and to the fixed server-side address `morzavi1@gmail.com` through Gmail SMTP. The WhatsApp checkbox records a preferred reply channel in that email; it never changes the destination. The site shows sending, success and failure states, prevents duplicate clicks while sending, keeps values after failure and clears them after success. Invalid fields retain inline Hebrew errors. If JavaScript is unavailable, direct email, phone and WhatsApp links remain usable. The footer below has more space above its navigation and remains in normal document flow at every width.

The route validates the fields again, limits payload size, uses a hidden spam-trap field, and never accepts a sender, recipient or subject from the browser. It does not store the message or log its contents. Gmail SMTP failure or missing configuration returns a failure to the form instead of showing a false success.

Historical mobile motion revision, 18 October 2026 (superseded below): the owner requested the same footer reveal and image-masked wordmark on phones as on desktop. Footer parallax and the staggered letter animation now run at all widths; the existing photo fill loads when the wordmark is nearby. Reduced motion keeps the footer and letters still while preserving the photo fill. Without JavaScript the footer and solid wordmark stay readable. This supersedes the earlier small-screen static fallback above.

## Motion refinement, 19 October 2026

The owner's shaking-footer recording supersedes the earlier scroll reveal. The footer surface is static at every width. Below 1024px, the image-filled wordmark is also static. On desktop, the complete wordmark enters once by 12px over 450ms with a smooth ease-out; there is no per-letter rotation or scroll scrubbing. The shared `useDesktopEntrance` hook starts only when content intersects the viewport and settles immediately for reduced motion or entry into the mobile breakpoint. It does not pre-hide content or reserve scroll space. The image fill is retained after its first nearby intersection to avoid reloading/repainting it while reversing scroll.

## Desktop footer reveal restored, 20 October 2026

The owner asked for the footer parallax back on desktop. The shaking in the 19 October recording happened on mobile, so `FooterParallax` returns at 1024px and wider only: the footer rises from beneath the contact section, never further than that section's height, and settles when the page bottoms out. Below 1024px and under reduced motion the footer surface stays static, as decided on 19 October. The owner also asked for the earlier letter animation on desktop: each wordmark letter again rises from 85% below, tipped at its own angle, and scrubs upright by the last scroll. It runs only at 1024px and wider without reduced motion; phones keep the static image-filled word. The footer is also shorter: less top padding, and the wordmark is tucked up into the empty top of its lowercase line box (about 95px less at 1440px).

## Configuration and verification

Enable two-step verification for `morzavi1@gmail.com`, generate a Google App Password for this site, and set it as server-only `CONTACT_GMAIL_APP_PASSWORD` in local and deployed environments. Do not add it to `NEXT_PUBLIC_*` variables or commit it. The recipient and authenticated sender are fixed in `src/lib/contact-email.ts`. The diagnostic's optional lead notifications still use their separate Resend settings.

Run `npm run test:contact` for validation and mocked delivery, then test the rendered form at desktop and mobile widths. A real inbox delivery check requires the Gmail App Password; mock success is not proof of delivery.
