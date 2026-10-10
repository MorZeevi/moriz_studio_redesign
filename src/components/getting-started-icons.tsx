import type { GettingStartedStep } from "@/content/getting-started";
import styles from "./getting-started.module.css";

// Hairline glyphs drawn inline (stroked, thinner than public/icons/*.svg) so
// the outline follows the theme through currentColor and the red accent can
// animate. The quote check is stroked so it can draw in.
const ACCENT = "#FB2C36";

const outline = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-icon="phone">
      <g className={styles.glyph}>
        <rect x="6" y="2" width="12" height="20" rx="3" {...outline} />
        <path d="M10.25 5H13.75" {...outline} />
        <circle cx="12" cy="18" r="1.25" fill={ACCENT} />
      </g>
      <circle
        className={styles.ripple}
        cx="12"
        cy="18"
        r="1.25"
        fill="none"
        stroke={ACCENT}
        strokeWidth="0.6"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-icon="video">
      <g className={styles.glyph}>
        <rect x="2.5" y="6.5" width="13" height="11" rx="3" {...outline} />
        <path
          d="M15.5 10.5L20.6 7.7C21.25 7.35 22 7.8 22 8.55V15.45C22 16.2 21.25 16.65 20.6 16.3L15.5 13.5"
          {...outline}
        />
        <circle className={styles.live} cx="7" cy="11" r="1.6" fill={ACCENT} />
      </g>
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-icon="quote">
      <g className={styles.glyph}>
        <rect x="4.5" y="2.5" width="13" height="19" rx="3" {...outline} />
        <path d="M8 7H14M8 10.5H11.5" {...outline} />
        <path
          className={styles.check}
          d="M7.2 15.7L9.4 17.9L13.8 13.5"
          pathLength={1}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function StepIcon({ icon }: { icon: GettingStartedStep["icon"] }) {
  if (icon === "phone") return <PhoneIcon />;
  if (icon === "video") return <VideoIcon />;
  return <QuoteIcon />;
}
