import type { GettingStartedStep } from "@/content/getting-started";
import styles from "./getting-started.module.css";

// Inline copies of public/icons/{mobile,video,quote}.svg so the glyph follows
// the theme through currentColor and the red accent can animate. The quote
// check is stroked here (filled in the static file) so it can draw in.
const ACCENT = "#FB2C36";

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-icon="phone">
      <g className={styles.glyph}>
        <path
          d="M9.175 22.359C8.389 22.298 7.595 22.012 6.950 21.555C6.646 21.340 6.160 20.854 5.945 20.550C5.559 20.004 5.296 19.359 5.171 18.650C5.122 18.374 5.122 5.690 5.170 5.375C5.276 4.694 5.554 4.002 5.945 3.450C6.160 3.146 6.646 2.660 6.950 2.445C7.567 2.009 8.320 1.727 9.071 1.651C9.423 1.616 14.577 1.616 14.929 1.651C15.680 1.727 16.433 2.009 17.050 2.445C17.354 2.660 17.840 3.146 18.055 3.450C18.446 4.002 18.724 4.694 18.830 5.375C18.878 5.690 18.878 18.374 18.829 18.650C18.704 19.359 18.441 20.004 18.055 20.550C17.840 20.854 17.354 21.340 17.050 21.555C16.635 21.849 16.067 22.112 15.575 22.238C15.101 22.361 15.194 22.357 12.150 22.363C10.576 22.365 9.237 22.364 9.175 22.359ZM15.125 20.554C15.382 20.486 15.800 20.290 16.009 20.140C16.186 20.013 16.556 19.639 16.667 19.475C16.851 19.203 17.012 18.813 17.080 18.475C17.128 18.235 17.128 5.765 17.080 5.525C17.010 5.175 16.851 4.795 16.650 4.500C16.278 3.952 15.613 3.767 15.036 4.049C14.539 4.292 14.280 4.804 14.354 5.394C14.386 5.648 14.363 5.815 14.272 5.999C14.160 6.222 13.970 6.372 13.713 6.441C13.531 6.490 10.469 6.490 10.287 6.441C10.030 6.372 9.840 6.222 9.728 5.999C9.637 5.815 9.614 5.648 9.646 5.394C9.720 4.804 9.461 4.293 8.964 4.049C8.389 3.766 7.722 3.953 7.350 4.500C7.149 4.795 6.990 5.175 6.920 5.525C6.872 5.765 6.872 18.235 6.920 18.475C6.993 18.839 7.158 19.225 7.363 19.512C7.489 19.689 7.862 20.057 8.033 20.173C8.333 20.377 8.789 20.553 9.137 20.599C9.220 20.610 10.553 20.618 12.100 20.615L14.912 20.611L15.125 20.554Z"
          fill="currentColor"
          fillRule="evenodd"
        />
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
        <path
          d="M6 6H12A4 4 0 0 1 16 10V14A4 4 0 0 1 12 18H6A4 4 0 0 1 2 14V10A4 4 0 0 1 6 6ZM6 7.75A2.25 2.25 0 0 0 3.75 10V14A2.25 2.25 0 0 0 6 16.25H12A2.25 2.25 0 0 0 14.25 14V10A2.25 2.25 0 0 0 12 7.75ZM17.5 10.2L20.4 8.3C21.1 7.85 22 8.35 22 9.18V14.82C22 15.65 21.1 16.15 20.4 15.7L17.5 13.8Z"
          fill="currentColor"
          fillRule="evenodd"
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
        <path
          d="M7.5 2H14.5A3.5 3.5 0 0 1 18 5.5V18.5A3.5 3.5 0 0 1 14.5 22H7.5A3.5 3.5 0 0 1 4 18.5V5.5A3.5 3.5 0 0 1 7.5 2ZM7.5 3.75A1.75 1.75 0 0 0 5.75 5.5V18.5A1.75 1.75 0 0 0 7.5 20.25H14.5A1.75 1.75 0 0 0 16.25 18.5V5.5A1.75 1.75 0 0 0 14.5 3.75ZM7.875 6.5H14.125A0.875 0.875 0 0 1 14.125 8.25H7.875A0.875 0.875 0 0 1 7.875 6.5ZM7.875 9.75H11.625A0.875 0.875 0 0 1 11.625 11.5H7.875A0.875 0.875 0 0 1 7.875 9.75Z"
          fill="currentColor"
          fillRule="evenodd"
        />
        <path
          className={styles.check}
          d="M7.2 15.7L9.4 17.9L13.8 13.5"
          pathLength={1}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.9"
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
