import type { ComponentPropsWithRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  disabled = false,
  "aria-disabled": ariaDisabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || ariaDisabled === true || ariaDisabled === "true"}
      aria-disabled={ariaDisabled}
      className={`button button--${variant} button--${size} ${className}`}
    />
  );
}
