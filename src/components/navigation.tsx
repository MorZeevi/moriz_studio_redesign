"use client";

import { useRef } from "react";
import { LiquidNavigation } from "@/components/liquid-navigation";
import { MobileNavigation } from "@/components/mobile-navigation";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";

export function Navigation({
  locale,
  content,
  studioName,
  theme,
  pageAnchors,
}: {
  locale: EnabledLocale;
  content: SiteContent["navigation"];
  studioName: string;
  theme: SiteContent["theme"];
  /** Off the homepage: the section anchors that exist on this page. */
  pageAnchors?: string[];
}) {
  const desktopNavigationRef = useRef<HTMLElement>(null);
  return (
    <>
      <nav
        ref={desktopNavigationRef}
        className="desktop-navigation"
        aria-label={content.label}
      >
        <LiquidNavigation
          links={content.desktopLinks}
          locale={locale}
          pageAnchors={pageAnchors}
        />
      </nav>
      <MobileNavigation
        locale={locale}
        content={content}
        studioName={studioName}
        theme={theme}
        pageAnchors={pageAnchors}
        desktopNavigationRef={desktopNavigationRef}
      />
    </>
  );
}
