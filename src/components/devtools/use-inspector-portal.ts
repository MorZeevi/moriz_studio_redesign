"use client";

import { useEffect, useRef, useState } from "react";

export function useInspectorPortal() {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = document.createElement("div");
    container.setAttribute("data-devtools-owned", "");
    document.body.append(container);
    setHost(container);
    function reposition() {
      const modals = [
        ...document.querySelectorAll<HTMLDialogElement>("dialog:modal"),
      ];
      const focusedModal = document.activeElement?.closest("dialog:modal");
      const parent = focusedModal ?? modals.at(-1) ?? document.body;
      const root = rootRef.current;
      if (container.parentElement !== parent) {
        if (root?.matches(":popover-open")) root.hidePopover();
        parent.append(container);
      }
      if (root && !root.matches(":popover-open")) {
        if (typeof root.showPopover === "function") root.showPopover();
        else root.removeAttribute("popover");
      }
    }
    const observer = new MutationObserver(reposition);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    reposition();
    return () => {
      observer.disconnect();
      container.remove();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!host || !root) return;
    if (typeof root.showPopover === "function") root.showPopover();
    else root.removeAttribute("popover");
  }, [host]);

  return { host, rootRef };
}
