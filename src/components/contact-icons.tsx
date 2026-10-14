// Stroked glyphs for the contact form and details, drawn in currentColor.
const outline = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Points toward the end of the line: left in RTL. */
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" {...outline} />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" {...outline} />
    </svg>
  );
}

export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M3.5 20.5l1.3-4.3A8.5 8.5 0 1 1 7.9 19.3z" {...outline} />
      <path
        d="M9 8.6c.2 2.9 3.4 6.2 6.4 6.4l1.1-1.3-1.9-1.1-.9.8c-1.1-.5-2.2-1.6-2.7-2.7l.8-.9-1.1-1.9z"
        {...outline}
        strokeWidth={1.25}
      />
    </svg>
  );
}

export function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" {...outline} />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" {...outline} />
    </svg>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M20.5 16.4v2.6a1.8 1.8 0 0 1-2 1.8A17.8 17.8 0 0 1 3.2 5.5a1.8 1.8 0 0 1 1.8-2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9l-1.1 1.1a14.4 14.4 0 0 0 5.4 5.4l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.5 1.8z"
        {...outline}
      />
    </svg>
  );
}
