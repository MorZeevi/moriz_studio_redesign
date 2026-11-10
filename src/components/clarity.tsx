"use client";

import Clarity from "@microsoft/clarity";
import { getAttribution } from "@/diagnostic/attribution";
import { canMeasure } from "@/lib/conversion";
import { useEffect } from "react";

/** Microsoft Clarity session analytics; loads its tag once after hydration. */
export function ClarityAnalytics({ projectId }: { projectId: string }) {
  useEffect(() => {
    if (!canMeasure()) return;
    Clarity.init(projectId);
    // Campaign tags as Clarity filters, so sessions can be read per source.
    const utm = getAttribution()?.utm;
    for (const key of ["utm_source", "utm_medium", "utm_campaign"])
      if (utm?.[key]) Clarity.setTag(key, utm[key]);
  }, [projectId]);
  return null;
}
