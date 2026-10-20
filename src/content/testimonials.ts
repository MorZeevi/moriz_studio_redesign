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
  image: {
    src: string;
    /**
     * Logos sit on a fixed light tile; portraits and round brand marks
     * fill the frame.
     */
    kind: "logo" | "mark" | "portrait";
    objectPosition?: string;
  };
};
