"use client";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";
import { canMeasure } from "@/lib/conversion";
import { ClarityAnalytics } from "./clarity";
import { ConversionAnalytics } from "./conversion-analytics";

/** Root layout also gates deployment; aliases never load either vendor tag. */
export function PublicAnalytics() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(canMeasure());
  }, []);
  return enabled ? (
    <>
      <GoogleAnalytics gaId="G-R1KN0P3K42" />
      <ClarityAnalytics projectId="z1751pirhl" />
      <ConversionAnalytics />
    </>
  ) : null;
}
