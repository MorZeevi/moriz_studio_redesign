"use client";

import { useId } from "react";

export function SparkleIcon() {
  const gradientId = `ai-sparkle-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" fill={`url(#${gradientId})`} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="color-mix(in srgb, var(--color-action-primary) 45%, white)" />
          <stop offset="0.5" stopColor="var(--color-action-primary)" />
          <stop
            offset="1"
            stopColor="color-mix(in srgb, var(--color-action-primary) 65%, var(--color-dark))"
          />
        </linearGradient>
      </defs>
      <path d="M9.5 3.5c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" />
      <path d="M18 1.5c.3 2 1.2 2.9 3.2 3.2-2 .3-2.9 1.2-3.2 3.2-.3-2-1.2-2.9-3.2-3.2 2-.3 2.9-1.2 3.2-3.2Z" />
    </svg>
  );
}
