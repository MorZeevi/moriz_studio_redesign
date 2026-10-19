"use client";

import gsap from "gsap";
import {
  type MouseEvent,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { LanguageLink } from "@/components/language-link";
import { LiquidWindowMask } from "@/components/liquid-window-mask";
import { StudioLogo } from "@/components/studio-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { MenuToggle } from "@/components/ui/menu-toggle";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { anchorHref } from "@/lib/anchor-href";
import {
  buildLiquidWindowGrid,
  LIQUID_WINDOW_DURATION,
  LIQUID_WINDOW_EASING,
  type LiquidWindowGrid,
} from "@/lib/liquid-window-grid";
import styles from "./mobile-navigation.module.css";

type Phase = "closed" | "opening" | "open" | "closing";
type WindowScene = {
  windows: Animation[];
  clock: Animation;
  direction: 1 | -1;
  deadline: number;
};

function cancelScene(scene: WindowScene | null) {
  if (!scene) return;
  window.clearTimeout(scene.deadline);
  scene.clock.onfinish = null;
  scene.clock.cancel();
  for (const animation of scene.windows) animation.cancel();
}

/** Synchronize every cell to the clock, including cells waiting in their delay. */
function playScene(scene: WindowScene, direction: 1 | -1) {
  const time = Number(scene.clock.currentTime) || 0;
  scene.direction = direction;
  for (const animation of [...scene.windows, scene.clock]) {
    animation.currentTime = time;
    animation.updatePlaybackRate(direction);
    animation.play();
  }
  window.clearTimeout(scene.deadline);
  scene.deadline = window.setTimeout(() => scene.clock.finish(), 3000);
}

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
  const filterId = `navigation-windows-${id}`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const windowsRef = useRef<SVGGElement>(null);
  const sceneRef = useRef<WindowScene | null>(null);
  const phaseRef = useRef<Phase>("closed");
  const pendingHref = useRef<string | null>(null);
  const navigationFrame = useRef(0);
  const finishRef = useRef<(open: boolean) => void>(() => {});
  const [phase, setPhase] = useState<Phase>("closed");
  const [ready, setReady] = useState(false);
  const [grid, setGrid] = useState<LiquidWindowGrid | null>(null);
  const iconOpen = phase === "opening" || phase === "open";

  function changePhase(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  finishRef.current = (open) => {
    window.clearTimeout(sceneRef.current?.deadline);
    if (open && dialogRef.current?.open) {
      changePhase("open");
    } else {
      dialogRef.current?.close();
    }
  };

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (phase !== "open" || !dialog || motion.matches) return;

    // Follow the window reveal with one quiet, top-to-bottom reading sequence.
    const context = gsap.context(() => {
      gsap.fromTo(
        dialog.querySelectorAll(".navigation-links > li"),
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.06,
          ease: "power2.out",
          clearProps: "transform,opacity",
        },
      );
    }, dialog);
    // Keyboard focus and a changed motion preference reveal all links at once.
    const finish = () => context.revert();
    dialog.addEventListener("focusin", finish);
    motion.addEventListener("change", finish);
    return () => {
      dialog.removeEventListener("focusin", finish);
      motion.removeEventListener("change", finish);
      context.revert();
    };
  }, [phase]);

  useLayoutEffect(() => {
    if (!grid || !dialogRef.current?.open || !windowsRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let scene: WindowScene | null = null;
    try {
      const duration =
        Math.max(...grid.cells.map((cell) => cell.delay)) +
        LIQUID_WINDOW_DURATION;
      const windows = Array.from(windowsRef.current.children).map(
        (element, i) => {
          const animation = element.animate(
            [
              { transform: "scale(0.62)", opacity: 0 },
              { opacity: 1, offset: 0.55 },
              { transform: "scale(1.1)", opacity: 1 },
            ],
            {
              duration: LIQUID_WINDOW_DURATION,
              delay: grid.cells[i].delay,
              // WAAPI play() rewinds reverse playback past an effect's end.
              // A common end keeps every cell on the same reversible clock.
              endDelay: duration - grid.cells[i].delay - LIQUID_WINDOW_DURATION,
              easing: LIQUID_WINDOW_EASING,
              fill: "both",
            },
          );
          animation.pause();
          return animation;
        },
      );
      const clock = new Animation(
        new KeyframeEffect(null, [], { duration, fill: "both" }),
        document.timeline,
      );
      clock.pause();
      scene = { windows, clock, direction: 1, deadline: 0 };
      sceneRef.current = scene;
      const currentScene = scene;
      clock.onfinish = () => finishRef.current(currentScene.direction === 1);
      scene.deadline = window.setTimeout(
        () => finishRef.current(phaseRef.current !== "closing"),
        3000,
      );
      if (phaseRef.current === "open") {
        for (const animation of [...windows, clock])
          animation.currentTime = duration;
      } else if (phaseRef.current === "closing") {
        finishRef.current(false);
      } else {
        playScene(scene, 1);
      }
    } catch {
      // A missing/stopped animation must never block navigation or dismissal.
      finishRef.current(phaseRef.current !== "closing");
    }
    return () => {
      cancelScene(scene);
      if (sceneRef.current === scene) sceneRef.current = null;
    };
  }, [grid]);

  useEffect(() => {
    setReady(true);
    const desktop = window.matchMedia("(min-width: 64rem)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onDesktop = () => {
      if (!desktop.matches) return;
      pendingHref.current = null;
      dialogRef.current?.close();
    };
    const settle = () => {
      if (!dialogRef.current?.open || desktop.matches) return;
      if (phaseRef.current === "closing") {
        finishRef.current(false);
      } else {
        finishRef.current(true);
        setGrid(buildLiquidWindowGrid(window.innerWidth, window.innerHeight));
      }
    };
    const onMotion = () => {
      if (motion.matches) settle();
    };
    desktop.addEventListener("change", onDesktop);
    motion.addEventListener("change", onMotion);
    window.addEventListener("resize", settle);
    const dialog = dialogRef.current;
    return () => {
      desktop.removeEventListener("change", onDesktop);
      motion.removeEventListener("change", onMotion);
      window.removeEventListener("resize", settle);
      cancelAnimationFrame(navigationFrame.current);
      cancelScene(sceneRef.current);
      sceneRef.current = null;
      dialog?.close();
    };
  }, []);

  function setOpen(open: boolean) {
    if (open) {
      pendingHref.current = null;
      if (phaseRef.current === "closed") {
        setGrid(buildLiquidWindowGrid(window.innerWidth, window.innerHeight));
        dialogRef.current?.showModal();
        closeRef.current?.focus({ preventScroll: true });
      }
      changePhase("opening");
    } else {
      if (phaseRef.current === "closed") return;
      changePhase("closing");
      closeRef.current?.focus({ preventScroll: true });
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishRef.current(open);
    } else if (sceneRef.current) {
      playScene(sceneRef.current, open ? 1 : -1);
    } else if (!open) {
      finishRef.current(false);
    }
  }

  function onClose() {
    cancelScene(sceneRef.current);
    sceneRef.current = null;
    changePhase("closed");
    setGrid(null);
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
    event.preventDefault();
    pendingHref.current = link.href;
    setOpen(false);
  }

  return (
    <>
      <MenuToggle
        ref={triggerRef}
        open={iconOpen}
        onOpenChange={setOpen}
        strokeWidth={3}
        className={`mobile-menu-toggle ${styles.toggle}`}
        disabled={!ready}
        aria-label={content.openLabel}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={phase !== "closed"}
      />
      <dialog
        ref={dialogRef}
        id={dialogId}
        className={`navigation-dialog ${styles.dialog}`}
        data-state={phase}
        aria-label={content.label}
        onClose={onClose}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
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
        {grid && (
          <svg
            className={styles.windows}
            viewBox={`0 0 ${grid.w} ${grid.h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <LiquidWindowMask
              id={filterId}
              grid={grid}
              reveal
              windowsRef={windowsRef}
            />
            <rect
              width={grid.w}
              height={grid.h}
              fill="var(--color-secondary)"
              mask={`url(#${filterId}-mask)`}
            />
          </svg>
        )}
        <div className={`navigation-panel ${styles.panel}`}>
          <div className={styles.header}>
            {phase !== "closed" && (
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
              open={iconOpen}
              onOpenChange={setOpen}
              strokeWidth={3}
              className={`menu-close ${styles.toggle}`}
              aria-label={iconOpen ? content.closeLabel : content.openLabel}
              aria-controls={dialogId}
              aria-expanded={phase !== "closed"}
            />
          </div>
          <div className={styles.body} inert={phase !== "open"}>
            <nav aria-label={content.label}>
              <ul className={`navigation-links ${styles.links}`}>
                {[...content.desktopLinks, content.contactLink].map((link) => (
                  <li key={link.href}>
                    <a href={anchorHref(link.href, locale, pageAnchors)}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <LanguageLink locale={locale} content={content.languages} />
          </div>
        </div>
      </dialog>
    </>
  );
}
