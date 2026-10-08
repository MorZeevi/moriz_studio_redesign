"use client";

import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./party-mode.module.css";
import { PartyModeEffects } from "./party-mode-effects";

export type PartyPhase = "idle" | "entering" | "active" | "exiting";
export type PartyLabels = SiteContent["advantages"]["party"];

interface PartyContext {
  enabled: boolean;
  phase: PartyPhase;
  labels: PartyLabels;
  toggleRef: RefObject<HTMLButtonElement | null>;
  setEnabled: (enabled: boolean) => void;
  setInlineVisible: (visible: boolean) => void;
}

const Context = createContext<PartyContext | null>(null);

export function usePartyMode() {
  const context = useContext(Context);
  if (!context) throw new Error("Party controls require PartyModeProvider");
  return context;
}

export function PartyModeProvider({
  children,
  labels,
}: {
  children: ReactNode;
  labels: PartyLabels;
}) {
  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState<PartyPhase>("idle");
  const [inlineVisible, setInlineVisible] = useState(true);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [message, setMessage] = useState("");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const offRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setHost(document.body);
  }, []);

  const request = useCallback((value: boolean) => {
    setMessage("");
    setEnabled(value);
    if (value) setPhase("entering");
  }, []);

  const updatePhase = useCallback(
    (next: PartyPhase) => {
      if (next === "idle" && offRef.current === document.activeElement) {
        const destination = inlineVisible
          ? toggleRef.current
          : document.getElementById("main-content");
        destination?.focus({ preventScroll: true });
      }
      setPhase(next);
    },
    [inlineVisible],
  );

  const fail = useCallback(() => {
    setMessage(labels.unavailable);
    setEnabled(false);
    updatePhase("idle");
  }, [labels.unavailable, updatePhase]);

  const context = useMemo(
    () => ({
      enabled,
      phase,
      labels,
      toggleRef,
      setEnabled: request,
      setInlineVisible,
    }),
    [enabled, phase, labels, request],
  );
  const running = enabled || phase !== "idle";

  useEffect(() => {
    const control = offRef.current;
    const launcher = document.querySelector<HTMLElement>(
      "[data-devtools-launcher]",
    );
    if (!running || inlineVisible || !control || !launcher) return;
    const measure = () => {
      const clearance =
        window.innerHeight - launcher.getBoundingClientRect().top;
      control.style.setProperty(
        "--party-dev-clearance",
        `${Math.max(0, clearance)}px`,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(launcher);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [running, inlineVisible]);

  return (
    <Context value={context}>
      {children}
      <span className="sr-only" role="status" aria-live="polite">
        {message ||
          (phase === "entering"
            ? labels.preparing
            : phase === "active"
              ? labels.active
              : "")}
      </span>
      {host &&
        running &&
        createPortal(
          <>
            <PartyModeEffects
              enabled={enabled}
              onPhase={updatePhase}
              onFailure={fail}
            />
            {!inlineVisible && (
              <Button
                ref={offRef}
                variant="secondary"
                className={styles.offControl}
                data-party-off
                aria-label={labels.off}
                onClick={() => request(false)}
              >
                <span className={styles.offDot} aria-hidden="true" />
                <bdi>{labels.normal}</bdi>
                <span aria-hidden="true">↗</span>
              </Button>
            )}
          </>,
          host,
        )}
    </Context>
  );
}
