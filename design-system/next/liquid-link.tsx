"use client";

import Link from "next/link";
import { LiquidLink, type LiquidLinkProps } from "../react/liquid";

/** LiquidLink with Next.js client navigation. Server Components cannot pass
 * next/link through LiquidLink's `as` prop, so use this wrapper instead. */
export function NextLiquidLink(props: Omit<LiquidLinkProps, "as">) {
  return <LiquidLink {...props} as={Link} />;
}
