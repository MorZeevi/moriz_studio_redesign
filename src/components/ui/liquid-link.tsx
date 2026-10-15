"use client";

import Link from "next/link";
import {
  LiquidLink as KitLiquidLink,
  type LiquidLinkProps as KitLiquidLinkProps,
} from "../../../design-system/react/liquid";

export {
  LiquidBadge,
  LiquidButton,
  LiquidFilter,
} from "../../../design-system/react/liquid";

type LiquidLinkProps = Omit<KitLiquidLinkProps, "as"> & {
  /** "client" routes through next/link; Server Components cannot pass it as `as`. */
  navigation?: "native" | "client";
};

/** The design-system liquid CTA with the site's navigation switch. */
export function LiquidLink({
  navigation = "native",
  ...props
}: LiquidLinkProps) {
  return (
    <KitLiquidLink {...props} as={navigation === "client" ? Link : undefined} />
  );
}
