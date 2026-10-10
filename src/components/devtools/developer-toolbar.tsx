"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import styles from "./inspector.module.css";
import { InspectorOverlay } from "./inspector-overlay";
import { elementIdentifier } from "./inspector-utils";
import { formatPrompt } from "./prompt-context";
import { SelectedElementPanel } from "./selected-element-panel";
import type { SelectedElementContext } from "./types";
import { useElementInspector } from "./use-element-inspector";
import { useInspectorPortal } from "./use-inspector-portal";

// Remembered per browser so the buttons stay out of the way across reloads.
const hiddenKey = "devtools:hidden";
function readHidden() {
  try {
    return window.localStorage.getItem(hiddenKey) === "1";
  } catch {
    return false;
  }
}

export function DeveloperToolbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [dockLeft, setDockLeft] = useState(false);
  const [request, setRequest] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [copyFallback, setCopyFallback] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [copyLabel, setCopyLabel] = useState("Generated prompt");
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const requestId = useId();
  const panelId = useId();
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const copyText = useCallback(async (text: string, label: string) => {
    setCopiedText(text);
    setCopyLabel(label);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(
        label === "Element selector" ? `Copied: ${text}` : "Prompt copied.",
      );
      setCopyFallback(false);
    } catch {
      setCopyStatus(
        `Clipboard unavailable. Select and copy the ${label.toLowerCase()} below.`,
      );
      setCopyFallback(true);
    }
  }, []);
  const copyIdentifier = useCallback(
    (element: SelectedElementContext) => {
      void copyText(elementIdentifier(element), "Element selector");
    },
    [copyText],
  );
  const inspector = useElementInspector(copyIdentifier);
  const { stop } = inspector;
  const { host, rootRef } = useInspectorPortal();

  useEffect(() => setHidden(readHidden()), []);
  useEffect(() => {
    if (pathname !== previousPath.current) {
      stop();
      previousPath.current = pathname;
    }
  }, [pathname, stop]);
  const selectionKey = inspector.selected?.selector;
  const previousSelection = useRef(selectionKey);
  useEffect(() => {
    if (selectionKey !== previousSelection.current) {
      setCopyStatus("");
      setCopyFallback(false);
      previousSelection.current = selectionKey;
    }
  }, [selectionKey]);

  if (!host || process.env.NODE_ENV !== "development") return null;
  const page = {
    pathname,
    language: document.documentElement.lang,
    direction: document.documentElement.dir,
  };
  const prompt = inspector.selected
    ? formatPrompt({ page, element: inspector.selected, request })
    : "";

  function collapse() {
    setOpen(false);
    launcherRef.current?.focus({ preventScroll: true });
  }

  function toggleHidden() {
    const next = !hidden;
    if (next) {
      stop();
      setOpen(false);
    }
    setHidden(next);
    try {
      window.localStorage.setItem(hiddenKey, next ? "1" : "0");
    } catch {}
  }

  async function copyPrompt() {
    const element = inspector.captureSelection();
    if (!element || !request.trim()) return;
    const currentPrompt = formatPrompt({ page, element, request });
    await copyText(currentPrompt, "Generated prompt");
  }

  return createPortal(
    <div
      ref={rootRef}
      popover="manual"
      className={styles.root}
      data-devtools-owned
      dir="ltr"
      lang="en"
    >
      <InspectorOverlay highlight={inspector.hoverHighlight} />
      <InspectorOverlay highlight={inspector.selectedHighlight} selected />
      <div className={styles.launcher} data-devtools-launcher>
        <Button
          variant="outline"
          size="sm"
          aria-label={hidden ? "Show developer tools" : "Hide developer tools"}
          title={hidden ? "Show developer tools" : "Hide developer tools"}
          onClick={toggleHidden}
        >
          {hidden ? "Dev" : "Hide"}
        </Button>
        {!hidden && (
          <>
            <Button
              ref={launcherRef}
              variant="outline"
              size="sm"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => (open ? collapse() : setOpen(true))}
            >
              {open ? "Close developer tools" : "Developer tools"}
            </Button>
            <Button
              variant={inspector.enabled ? "secondary" : "outline"}
              size="sm"
              aria-pressed={inspector.enabled}
              onClick={() =>
                inspector.enabled ? stop() : inspector.setEnabled(true)
              }
            >
              Inspector: {inspector.enabled ? "ON" : "OFF"}
            </Button>
          </>
        )}
      </div>
      {open && !hidden && (
        <aside
          id={panelId}
          className={`${styles.panel} ${dockLeft ? styles.panelLeft : ""}`}
          aria-label="Developer tools"
        >
          <div className={styles.header}>
            <h2>Developer tools</h2>
            <span className={styles.badge}>DEV ONLY</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDockLeft((left) => !left)}
          >
            Move panel {dockLeft ? "right" : "left"}
          </Button>
          <div className={styles.controls}>
            <Button
              variant="ghost"
              size="sm"
              disabled={!inspector.selected}
              onClick={inspector.clear}
            >
              Clear
            </Button>
          </div>
          <p className={styles.status} role="status">
            {inspector.notice ||
              (inspector.selected
                ? `Selected: ${inspector.selected.source.component || inspector.selected.tag}`
                : inspector.enabled
                  ? "Click to select; double-click to copy its ID or classes. Escape stops inspection."
                  : "Inspector OFF. Website interactions work normally.")}
          </p>
          <div className={styles.request}>
            <label htmlFor={requestId}>Ask Codex about this element</label>
            <textarea
              id={requestId}
              dir="auto"
              rows={3}
              value={request}
              onChange={(event) => {
                setRequest(event.target.value);
                setCopyStatus("");
                setCopyFallback(false);
              }}
              placeholder="Describe the change you want…"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!inspector.selected || !request.trim()}
              onClick={copyPrompt}
            >
              Copy prompt
            </Button>
            <p className={styles.status} role="status">
              {copyStatus}
            </p>
          </div>
          {copyFallback ? (
            <div className={styles.promptPreview}>
              <label htmlFor={`${requestId}-prompt`}>{copyLabel}</label>
              <textarea
                id={`${requestId}-prompt`}
                ref={promptRef}
                readOnly
                value={copiedText}
                rows={8}
                aria-label={copyLabel}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  promptRef.current?.focus();
                  promptRef.current?.select();
                }}
              >
                {copyLabel === "Element selector"
                  ? "Select selector"
                  : "Select prompt"}
              </Button>
            </div>
          ) : (
            prompt && (
              <details className={styles.promptPreview}>
                <summary>Generated prompt</summary>
                <textarea
                  readOnly
                  value={prompt}
                  rows={8}
                  aria-label="Generated prompt"
                />
              </details>
            )
          )}
          <SelectedElementPanel selected={inspector.selected} />
        </aside>
      )}
    </div>,
    host,
  );
}
