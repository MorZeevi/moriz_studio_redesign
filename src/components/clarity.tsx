"use client";

import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

/** Microsoft Clarity session analytics; loads its tag once after hydration. */
export function ClarityAnalytics({ projectId }: { projectId: string }) {
  useEffect(() => {
    Clarity.init(projectId);
  }, [projectId]);
  return null;
}
