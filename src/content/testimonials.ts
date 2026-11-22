export type Testimonial = {
  id: string;
  /** Owner-chosen pull quote; null when none has been supplied. */
  headline: string | null;
  /** Verbatim testimonial text, one entry per paragraph. */
  body: string[];
  /** Recorded testimonial shown in place of the quote mark. */
  video?: {
    src: string;
    poster: string;
  };
  name: string;
  role: string;
  /** What the work was, so a reader can find the testimonial closest to their own project. */
  project?: string;
  image: {
    src: string;
    /**
     * Logos sit on a fixed light tile; portraits and round brand marks
     * fill the frame.
     */
    kind: "logo" | "mark" | "portrait";
    objectPosition?: string;
    /**
     * Brand on a logo or mark, when that brand is not the person's name.
     * Portraits leave this empty and use `name`.
     */
    brand?: string;
  };
};

/**
 * Alt text for a testimonial image. A portrait uses the person's name.
 * A logo or mark uses `logoAlt`, with `{brand}` replaced by the brand
 * (or the person's name when the image has no separate brand).
 */
export function testimonialImageAlt(
  item: Pick<Testimonial, "name" | "image">,
  logoAlt: string,
) {
  if (item.image.kind === "portrait") return item.name;
  const brand = item.image.brand?.trim() || item.name;
  return logoAlt.replaceAll("{brand}", brand);
}
