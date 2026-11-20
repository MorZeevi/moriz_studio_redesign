# Hero portrait

The homepage hero shows the owner's portrait beside the message. Last changed 20 November 2026.

## Asset

- `public/images/mor-hero-high-ponytail.png` (1024 × 1535, RGBA). The owner supplied it as a finished transparent cut-out; it is used as delivered.
- Served by `src/components/hero-portrait.tsx` with Next Image, responsive sizes and preload. The bottom fade is a CSS alpha mask, so the grain and the light or dark ground stay visible through it.
- To swap the photo: add the new transparent PNG in the same 2:3 frame under a new file name (a reused name stays stale in the dev image cache) and point `hero-portrait.tsx` at it.

## Layout

- 1024px and above: the message is on the start side and the portrait on the end side, drawn at 102% of its frame. Behind it, "נעים להכיר, אני מור" runs along the outer page edge in faint outline letters (`.hero-note`); English sets it on the right edge.
- Below 1024px: the first screen holds the short proof line, the headline, the portrait and then the action and projects link, centred. The portrait takes the height that is left. The description and the vertical hello are hidden.
- The client logos and the showreel follow the first screen at every width.

## Proof line

`.hero-proof` sits above the headline: a stack of four faces (`public/images/proof-faces/`, cropped from a stock collage the owner supplied; its licence is the owner's to confirm), then the figure from `src/content/conversion-copy.ts`.
