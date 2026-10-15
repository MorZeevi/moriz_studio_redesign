import type { ComponentPropsWithRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** Native button with the kit's variants. Set type="submit" in forms. */
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
      // aria-disabled alone would leave the control clickable.
      disabled={disabled || ariaDisabled === true || ariaDisabled === "true"}
      aria-disabled={ariaDisabled}
      className={`button button--${variant} button--${size} ${className}`}
    />
  );
}

/** Class names for an anchor that looks like a Button. */
export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
) {
  return `button button--${variant} button--${size}`;
}
