"use client";

import {
  type MouseEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { StudioLogo } from "@/components/studio-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { MenuToggle } from "@/components/ui/menu-toggle";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { anchorHref } from "@/lib/anchor-href";
import styles from "./mobile-navigation.module.css";

// The menu opens and closes instantly: the window reveal could stall on
// phones, leaving the menu half drawn.
type Phase = "closed" | "open";

export function MobileNavigation({
  locale,
  content,
  studioName,
  theme,
  pageAnchors,
  desktopNavigationRef,
}: {
  locale: EnabledLocale;
  content: SiteContent["navigation"];
  studioName: string;
  theme: SiteContent["theme"];
  pageAnchors?: string[];
  desktopNavigationRef: RefObject<HTMLElement | null>;
}) {
  const id = useId().replace(/:/g, "");
  const dialogId = `mobile-navigation-${id}`;
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pendingHref = useRef<string | null>(null);
  const navigationFrame = useRef(0);
  const [phase, setPhase] = useState<Phase>("closed");
  const [ready, setReady] = useState(false);
  const open = phase === "open";

  useEffect(() => {
    setReady(true);
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onDesktop = () => {
      if (!desktop.matches) return;
      pendingHref.current = null;
      dialogRef.current?.close();
    };
    desktop.addEventListener("change", onDesktop);
    const dialog = dialogRef.current;
    return () => {
      desktop.removeEventListener("change", onDesktop);
      cancelAnimationFrame(navigationFrame.current);
      dialog?.close();
    };
  }, []);

  function setOpen(next: boolean) {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (next) {
      pendingHref.current = null;
      if (!dialog.open) dialog.showModal();
      setPhase("open");
      closeRef.current?.focus({ preventScroll: true });
    } else {
      dialog.close();
    }
  }

  function onClose() {
    setPhase("closed");
    const destination = window.matchMedia("(min-width: 64rem)").matches
      ? desktopNavigationRef.current?.querySelector("a")
      : triggerRef.current;
    destination?.focus({ preventScroll: true });
    const href = pendingHref.current;
    pendingHref.current = null;
    if (href) {
      navigationFrame.current = requestAnimationFrame(() =>
        window.location.assign(href),
      );
    }
  }

  function onLinkClick(event: MouseEvent<HTMLDialogElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (!link || link.target === "_blank" || link.hasAttribute("download"))
      return;
    // Close first so the scroll lock lifts before the page moves to the anchor.
    event.preventDefault();
    pendingHref.current = link.href;
    setOpen(false);
  }

  return (
    <>
      <MenuToggle
        ref={triggerRef}
        open={open}
        onOpenChange={setOpen}
        strokeWidth={3}
        className={`mobile-menu-toggle ${styles.toggle}`}
        disabled={!ready}
        aria-label={content.openLabel}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={open}
      />
      <dialog
        ref={dialogRef}
        id={dialogId}
        className={`navigation-dialog ${styles.dialog}`}
        data-state={phase}
        aria-label={content.label}
        onClose={onClose}
        onClick={onLinkClick}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          // Development tooling can portal controls into the active dialog.
          // Keep the public menu's keyboard cycle within its own panel.
          const controls = Array.from(
            event.currentTarget
              .querySelector(".navigation-panel")
              ?.querySelectorAll<HTMLElement>(
                "a[href], button:not([disabled])",
              ) ?? [],
          ).filter(
            (control) =>
              !control.closest("[inert]") &&
              control.getClientRects().length > 0,
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className={`navigation-panel ${styles.panel}`}>
          <div className={styles.header}>
            {open && (
              <StudioLogo
                name={studioName}
                locale={locale}
                className="studio-wordmark"
              />
            )}
            <div className={styles.theme}>
              <ThemeToggle labels={theme} />
            </div>
            <MenuToggle
              ref={closeRef}
              open={open}
              onOpenChange={setOpen}
              strokeWidth={3}
              className={`menu-close ${styles.toggle}`}
              aria-label={open ? content.closeLabel : content.openLabel}
              aria-controls={dialogId}
              aria-expanded={open}
            />
          </div>
          <div className={styles.body} inert={!open}>
            <nav aria-label={content.label}>
              <ul className={`navigation-links ${styles.links}`}>
                {[...content.desktopLinks, content.contactLink].map((link) => {
                  const localized = anchorHref(link.href, locale, pageAnchors);
                  const onPage =
                    !link.href.startsWith("#") &&
                    (pathname === localized ||
                      pathname.startsWith(`${localized}/`));
                  return (
                  <li key={link.href}>
                    <a
                      href={localized}
                      aria-current={onPage ? "page" : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </dialog>
    </>
  );
}
