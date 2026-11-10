"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { canMeasure, trackConversion } from "@/lib/conversion";

export function ConversionAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || !canMeasure()) return;
    const click = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      const channel =
        url.hostname === "wa.me"
          ? "whatsapp"
          : url.protocol === "tel:"
            ? "phone"
            : url.protocol === "mailto:"
              ? "email"
              : null;
      const placement =
        link.closest<HTMLElement>("[data-contact-placement]")?.dataset
          .contactPlacement ?? "page";
      if (channel) trackConversion("contact_click", { channel, placement });
      else if (url.origin !== location.origin) return;
      else if (url.hash === "#contact")
        trackConversion("contact_anchor_click", {
          placement: link.closest("header")
            ? "header"
            : link.closest("footer")
              ? "footer"
              : placement,
        });
      else if (/^\/digital-audit(?:\/|$)/.test(url.pathname))
        trackConversion("diagnostic_click", {
          placement: link.closest("#diagnostic-banner") ? "banner" : "nav",
        });
    };
    document.addEventListener("click", click, true);
    const pending = new Set<Element>();
    const timers = new Map<Element, ReturnType<typeof setTimeout>>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const timer = timers.get(entry.target);
          if (timer) clearTimeout(timer);
          timers.delete(entry.target);
          if (
            !entry.isIntersecting ||
            entry.intersectionRatio < 1 ||
            document.hidden
          )
            continue;
          timers.set(
            entry.target,
            setTimeout(() => {
              trackConversion(
                entry.target.id === "projects-heading"
                  ? "projects_section_view"
                  : "contact_section_view",
              );
              observer.unobserve(entry.target);
              pending.delete(entry.target);
              timers.delete(entry.target);
            }, 1000),
          );
        }
      },
      { threshold: 1 },
    );
    for (const id of ["projects-heading", "contact-heading"]) {
      const heading = document.getElementById(id);
      if (heading) {
        pending.add(heading);
        observer.observe(heading);
      }
    }
    const cancel = () => {
      if (document.hidden) {
        for (const timer of timers.values()) clearTimeout(timer);
        timers.clear();
      } else {
        for (const heading of pending) {
          observer.unobserve(heading);
          observer.observe(heading);
        }
      }
    };
    document.addEventListener("visibilitychange", cancel);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("visibilitychange", cancel);
      observer.disconnect();
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, [pathname]);
  return null;
}
