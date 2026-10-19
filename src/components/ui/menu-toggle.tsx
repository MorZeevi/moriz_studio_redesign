"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type MenuToggleProps = ComponentProps<"button"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strokeWidth?: number;
  iconClassName?: string;
};

/** Supplied line morph, with a native keyboard-accessible button. */
export function MenuToggle({
  open,
  onOpenChange,
  className,
  iconClassName,
  strokeWidth = 2,
  onClick,
  ...props
}: MenuToggleProps) {
  return (
    <button
      type="button"
      aria-expanded={open}
      className={cn("menu-toggle", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onOpenChange(!open);
      }}
      {...props}
    >
      <svg
        strokeWidth={strokeWidth}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 32 32"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={cn(
          "size-8 transition-transform duration-[600ms] ease-out motion-reduce:transition-none",
          open && "-rotate-45",
          iconClassName,
        )}
      >
        <path
          className={cn(
            "transition-all duration-[600ms] ease-out motion-reduce:transition-none",
            open
              ? "[stroke-dasharray:20_300] [stroke-dashoffset:-32.42px]"
              : "[stroke-dasharray:12_63]",
          )}
          d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
        />
        <path d="M7 16 27 16" />
      </svg>
    </button>
  );
}
