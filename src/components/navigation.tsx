"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { LanguageLink } from "@/components/language-link";

export function Navigation({
  locale,
  content,
}: {
  locale: EnabledLocale;
  content: SiteContent["navigation"];
}) {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const desktopNavigationRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    function closeMobileMenu(event: MediaQueryListEvent) {
      if (event.matches) dialogRef.current?.close();
    }
    desktop.addEventListener("change", closeMobileMenu);
    return () => desktop.removeEventListener("change", closeMobileMenu);
  }, []);

  function openMenu() {
    dialogRef.current?.showModal();
    setIsOpen(true);
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  function restoreFocus() {
    setIsOpen(false);
    const destination = window.matchMedia("(min-width: 64rem)").matches
      ? desktopNavigationRef.current?.querySelector("a")
      : triggerRef.current;
    destination?.focus({ preventScroll: true });
  }

  return (
    <>
      <nav
        ref={desktopNavigationRef}
        className="desktop-navigation"
        aria-label={content.label}
      >
        <ul className="desktop-navigation-links">
          {content.links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        ref={triggerRef}
        type="button"
        className="menu-toggle mobile-menu-toggle"
        aria-label={content.openLabel}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={isOpen}
        onClick={openMenu}
      >
        <svg
          className="size-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        className="navigation-dialog"
        aria-label={content.label}
        onClose={restoreFocus}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeMenu();
          } else if (event.key === "Tab") {
            const controls = event.currentTarget.querySelectorAll<HTMLElement>(
              "a[href], button:not([disabled])",
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
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          ) {
            closeMenu();
          }
        }}
      >
        <div className="navigation-panel">
          <button
            type="button"
            className="menu-toggle menu-close"
            aria-label={content.closeLabel}
            onClick={closeMenu}
          >
            <svg
              className="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m5 5 14 14M19 5 5 19" />
            </svg>
          </button>

          <nav aria-label={content.label}>
            <ul className="navigation-links">
              {content.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={closeMenu}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <LanguageLink locale={locale} content={content.languages} />
        </div>
      </dialog>
    </>
  );
}
