# Selected motion and interactions

## Selected interactions

The owner has selected the floating WhatsApp contact control below. Its selected visual treatment is a WhatsApp-green circle with the owner's WhatsApp icon in palette charcoal; the confirmed destination is `+972522937174`. Placement and detailed opening behavior remain provisional. The owner also requested the getting-started rail and step-icon animation below (2026-10-10). No experimental backlog idea has been promoted into this register. The wireframe's FAQ disclosure is a temporary review pattern recorded in [02-page-structure.md](02-page-structure.md#wireframe-prototype--review-status), not a selected final interaction.

Do not move ideas from [11-interaction-backlog.md](11-interaction-backlog.md) into this register until they are intentionally selected.

### Floating WhatsApp contact control

#### Name

Floating WhatsApp contact control — internal planning label.

#### Location

Home: floating at the lower side of the viewport. This is the only homepage WhatsApp entry point, with no inline WhatsApp CTA in the hero or other sections. Exact left/right side and use on other pages: TODO: Decision required

#### Trigger

The visitor activates the WhatsApp contact control. Precise input behavior: TODO: Decision required

#### Behavior

Provide access to the confirmed WhatsApp enquiry channel. Contact destination, message content, visibility/scroll behavior, and opening behavior: TODO: Decision required

#### Purpose

Support the confirmed goal of receiving WhatsApp enquiries about potential projects.

#### User benefit

Give an interested visitor access to the owner's chosen contact channel. Any additional benefit claim: TODO: Decision required

#### Desktop behavior

TODO: Decision required

#### Mobile behavior

TODO: Decision required

#### Reduced-motion behavior

TODO: Decision required

#### Accessibility considerations

TODO: Decision required

#### Performance considerations

TODO: Decision required

#### Implementation notes

Local wireframe: shared component in [src/components/wireframe.tsx](../src/components/wireframe.tsx), with labels supplied by the Hebrew dictionary. Its position uses logical inline-end and block-end properties, with physical safe-area values mapped to the current document direction. The circle uses WhatsApp green (`#25D366`) with no outer border or shadow. Mobile retains a 56px circle with a 24px icon and 16px padding; desktop (64rem and above) uses a 72px circle with a 32px icon and 20px padding. A CSS alpha mask colors the icon with `--color-dark` (`#262626`) from the palette. The icon's empty margins are trimmed in the local optimized PNG. Hover and press mix the local WhatsApp green at 85% with palette charcoal with the shared 150ms color transition, which becomes immediate for reduced motion. Keyboard focus retains the shared visible ring; activation requires no hover.

The confirmed destination is `https://wa.me/972522937174`, opening a conversation without a prefilled message. `NEXT_PUBLIC_WHATSAPP_NUMBER` may override the default using international digits only; absent or empty values use the confirmed number, and invalid nonempty values disable the control. The provisional position is left in Hebrew RTL and would be right in LTR. Final placement and opening behavior: TODO: Decision required

#### Status

Functional placement selected by the owner on 2026-10-06; circular yellow treatment and supplied icon selected on 2026-10-09 and implemented in `whatapp-btn`. The owner subsequently confirmed `+972522937174`, palette charcoal for the icon and increased padding, then requested WhatsApp green and a larger desktop button. See [the decision record](14-decisions.md#floating-only-whatsapp-access). No entrance or continuous animation has been selected.

### Getting-started rail and step icons

#### Location

Home, section 6 (`#getting-started`). Component: [getting-started.tsx](../src/components/getting-started.tsx), styles in [getting-started.module.css](../src/components/getting-started.module.css), icons in [getting-started-icons.tsx](../src/components/getting-started-icons.tsx).

#### Trigger

Each step enters the viewport (IntersectionObserver, once, bottom margin −15%). Hover on a step (pointer devices only).

#### Behavior

Desktop: the rail fills from the inline start (right in RTL), one segment per step, staggered by `--duration-slow × 0.6`; each node fills with the accent as the line reaches it; the icon, title and line rise 0.75rem and fade in. Then each icon plays once: the phone rings and its red dot ripples twice; the Zoom live dot blinks twice; the quote's check draws in. Mobile: the same per step, along a vertical rail, without the cross-step stagger. Hover tilts the icon.

#### Reduced-motion behavior

Durations are 0s through the global tokens; the component also checks `matchMedia('(prefers-reduced-motion: reduce)')` and shows every step at once, with delays removed.

#### Accessibility considerations

Semantic `<ol>` with `h3` per step; icons, numbers and the rail are `aria-hidden`. Text keeps primary or secondary colours; the accent is used only for lines, nodes, borders and dots. Without JavaScript every step renders in its final state.

#### Performance considerations

CSS transitions and keyframes on transform/opacity/stroke only; one IntersectionObserver that stops watching each step once it is revealed.

#### Status

Implemented locally at the owner's request (2026-10-10); visual acceptance pending.

### Case-study gallery queued reveal

Selected by the owner on 2026-10-12 from
`/Users/morzeevi/Desktop/osmo-queued-scroll-reveal-1440x900.mp4`.
Following the owner's request for a clearer image reveal, each gallery figure or
video reveals once when its top reaches 80% of viewport height. A mask opens from
top to bottom with a 24px upward arrival over 900ms (1.5 times the shared slow
duration), using the shared entrance ease.
Newly entering media start 100ms apart, with waiting capped at 300ms during fast
scrolling. The desktop information panel remains still, and the gallery keeps its
authored layout on desktop and ordinary stacked layout on mobile.

The implementation uses one IntersectionObserver and native Web Animations,
disconnecting/cancelling on unmount. Keyboard focus reveals its image immediately;
reduced motion, including a preference change while open, settles every image.
Without JavaScript all media renders visible. Local desktop light/dark and mobile
motion captures were inspected; theme, viewer/focus, scrolling and reduced-motion
navigation checks pass. Components: `project-gallery.tsx`, `project-detail.module.css`.

## Reusable interaction template — unselected

The following is a blank template, not an interaction entry. Copy it when an interaction is intentionally selected.

### Name

TODO: Decision required

### Location

TODO: Decision required

### Trigger

TODO: Decision required

### Behavior

TODO: Decision required

### Purpose

TODO: Decision required

### User benefit

TODO: Decision required

### Desktop behavior

TODO: Decision required

### Mobile behavior

TODO: Decision required

### Reduced-motion behavior

TODO: Decision required

### Accessibility considerations

TODO: Decision required

### Performance considerations

TODO: Decision required

### Implementation notes

TODO: Decision required

### Status

TODO: Decision required
