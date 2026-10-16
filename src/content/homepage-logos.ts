// Client logos as solid silhouettes on transparent PNGs in public/logos
// (trimmed, 200px tall; white details knocked out). They are painted through a
// CSS mask in one shared ink, so every logo matches and one file serves light
// and dark themes. `ratio` is width / height; `scale` is an
// optical size against the shared logo height (the tall shield needs more).
// `caption` sets name lines as live text beside the mark (an emblem whose
// file has no wordmark).
export const homepageLogos: {
  src: string;
  alt: string;
  ratio: number;
  scale: number;
  caption?: string[];
}[] = [
  { src: "/logos/amdocs.png", alt: "Amdocs", ratio: 4.545, scale: 1 },
  { src: "/logos/stratasys.png", alt: "Stratasys", ratio: 3.255, scale: 1.1 },
  {
    src: "/logos/mamram.png",
    alt: "ממר״ם",
    ratio: 0.71,
    scale: 1.6,
    caption: ["ממר״ם", "Mamram"],
  },
  { src: "/logos/themarker.png", alt: "TheMarker", ratio: 4.575, scale: 1 },
  { src: "/logos/haaretz.png", alt: "הארץ", ratio: 3.12, scale: 1 },
  { src: "/logos/fedex.png", alt: "FedEx", ratio: 3.225, scale: 0.85 },
  { src: "/logos/matrix.png", alt: "Matrix", ratio: 2.28, scale: 1.3 },
  {
    src: "/logos/schneider.png",
    alt: "מרכז שניידר לרפואת ילדים",
    ratio: 4.265,
    scale: 1.4,
  },
  {
    src: "/logos/john-bryce.png",
    alt: "John Bryce",
    ratio: 3.295,
    scale: 1.2,
  },
];
