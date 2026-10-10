# Selected motion and interactions

## Selected interactions

The owner has selected the floating WhatsApp contact control below. Its selected visual treatment is a WhatsApp-green circle with the owner's WhatsApp icon in palette charcoal; the confirmed destination is `+972522937174`. Placement and detailed opening behavior remain provisional. No experimental backlog idea has been promoted into this register. The wireframe's FAQ disclosure is a temporary review pattern recorded in [02-page-structure.md](02-page-structure.md#wireframe-prototype--review-status), not a selected final interaction.

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
