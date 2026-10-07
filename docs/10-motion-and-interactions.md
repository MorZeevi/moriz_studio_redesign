# Selected motion and interactions

## Selected interactions

The owner has selected the floating WhatsApp contact control below. The local wireframe includes a provisional implementation; final visual treatment, motion, and detailed behavior remain open. No experimental backlog idea has been promoted into this register. The wireframe's FAQ disclosure is a temporary review pattern recorded in [02-page-structure.md](02-page-structure.md#wireframe-prototype--review-status), not a selected final interaction.

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

Local wireframe: shared component in [src/components/wireframe.tsx](../src/components/wireframe.tsx), with labels supplied by the Hebrew dictionary. Its position uses logical inline-end and block-end properties, with physical safe-area values mapped to the current document direction. It uses no animation and requires no hover to activate.

The real destination is not supplied. The control is disabled until `NEXT_PUBLIC_WHATSAPP_NUMBER` contains an international number using digits only; then it provides a native `wa.me` link without an invented message. The provisional position is left in Hebrew RTL and would be right in LTR. Final placement and opening behavior: TODO: Decision required

#### Status

Functional placement selected by the owner on 2026-10-06; local draft implemented, destination unconfigured, final design pending. See [the decision record](14-decisions.md#floating-only-whatsapp-access). No animation has been selected.

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
