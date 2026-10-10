export type GettingStartedStep = {
  /** Inline icon from the studio set: mobile.svg, video.svg or quote.svg. */
  icon: "phone" | "video" | "quote";
  title: string;
  /** One short line that also carries the step's key facts. */
  detail: string;
};
