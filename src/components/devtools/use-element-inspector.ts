"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  elementLabel,
  eventElement,
  inspectElement,
  isOwnedEvent,
  ownedSelector,
  readRect,
  sameRect,
} from "./inspector-utils";
import type { InspectorRect, SelectedElementContext } from "./types";

export type Highlight = { rect: InspectorRect; label: string };

export function useElementInspector(
  onDoubleClick?: (element: SelectedElementContext) => void,
) {
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState<SelectedElementContext | null>(null);
  const [hoverHighlight, setHoverHighlight] = useState<Highlight | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const selectedElement = useRef<Element | null>(null);
  const dirty = useRef(false);

  const clear = useCallback(() => {
    selectedElement.current = null;
    setSelected(null);
    setSelectedHighlight(null);
    setNotice("");
  }, []);

  const stop = useCallback(() => {
    setEnabled(false);
    clear();
    setHoverHighlight(null);
  }, [clear]);

  const captureSelection = useCallback(() => {
    const element = selectedElement.current;
    return element?.isConnected ? inspectElement(element) : null;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    let press: {
      x: number;
      y: number;
      pointerId: number;
      moved: boolean;
    } | null = null;
    let hoverBox: Highlight | null = null;
    let selectedBox: Highlight | null = null;
    let snapshot: SelectedElementContext | null = null;
    let disabledClick: { element: Element; time: number } | null = null;
    let copiedOnPointerUp: { element: Element; time: number } | null = null;
    const observer = new MutationObserver(() => {
      dirty.current = true;
    });
    const resizeObserver = new ResizeObserver(() => {
      dirty.current = true;
    });

    function select(element: Element) {
      selectedElement.current = element;
      snapshot = inspectElement(element);
      setSelected(snapshot);
      setNotice("");
      observer.disconnect();
      observer.observe(element, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
      });
      resizeObserver.disconnect();
      resizeObserver.observe(element);
      dirty.current = false;
    }

    function tick() {
      const element = selectedElement.current;
      if (element && !element.isConnected) {
        clear();
        observer.disconnect();
        resizeObserver.disconnect();
        setNotice("Selected element was removed. Select another element.");
      }
      let nextSelected: Highlight | null = null;
      if (selectedElement.current) {
        const target = selectedElement.current;
        nextSelected = { rect: readRect(target), label: elementLabel(target) };
        if (
          dirty.current ||
          snapshot?.rect.width !== nextSelected.rect.width ||
          snapshot?.rect.height !== nextSelected.rect.height
        ) {
          snapshot = inspectElement(target);
          setSelected(snapshot);
          dirty.current = false;
        }
      }
      if (
        !sameRect(selectedBox?.rect ?? null, nextSelected?.rect ?? null) ||
        selectedBox?.label !== nextSelected?.label
      ) {
        selectedBox = nextSelected;
        setSelectedHighlight(nextSelected);
      }
      let nextHover: Highlight | null = null;
      if (pointer) {
        let target = document.elementFromPoint(pointer.x, pointer.y);
        if (target?.getRootNode() instanceof ShadowRoot)
          target = (target.getRootNode() as ShadowRoot).host;
        if (
          target &&
          target !== selectedElement.current &&
          !target.closest(ownedSelector) &&
          !target.matches("html, body")
        ) {
          nextHover = { rect: readRect(target), label: elementLabel(target) };
        }
      }
      if (
        !sameRect(hoverBox?.rect ?? null, nextHover?.rect ?? null) ||
        hoverBox?.label !== nextHover?.label
      ) {
        hoverBox = nextHover;
        setHoverHighlight(nextHover);
      }
      frame = requestAnimationFrame(tick);
    }

    function block(event: Event) {
      if (isOwnedEvent(event) || !eventElement(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    function doubleClick(event: MouseEvent) {
      const element = eventElement(event);
      if (isOwnedEvent(event) || !element) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (
        copiedOnPointerUp?.element === element &&
        event.timeStamp - copiedOnPointerUp.time < 500
      ) {
        copiedOnPointerUp = null;
        return;
      }
      select(element);
      onDoubleClick?.(inspectElement(element));
    }

    function pointerMove(event: PointerEvent) {
      pointer =
        event.pointerType === "touch" || isOwnedEvent(event)
          ? null
          : { x: event.clientX, y: event.clientY };
      if (
        press &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8
      )
        press.moved = true;
      if (!isOwnedEvent(event)) event.stopImmediatePropagation();
    }

    function pointerDown(event: PointerEvent) {
      if (isOwnedEvent(event) || !eventElement(event)) return;
      if (event.isPrimary && event.button === 0) {
        press = {
          x: event.clientX,
          y: event.clientY,
          pointerId: event.pointerId,
          moved: false,
        };
      }
      // Prevent native mouse focus/dragging, but leave touch panning available.
      if (event.pointerType !== "touch") event.preventDefault();
      event.stopImmediatePropagation();
    }

    function pointerUp(event: PointerEvent) {
      const element = eventElement(event);
      if (!isOwnedEvent(event) && element) {
        if (
          press &&
          press.pointerId === event.pointerId &&
          !press.moved &&
          event.button === 0
        ) {
          select(element);
          // Disabled controls may not emit native click/dblclick events, but do emit pointerup.
          if (event.pointerType !== "touch" && element.closest(":disabled")) {
            if (
              disabledClick?.element === element &&
              event.timeStamp - disabledClick.time < 500
            ) {
              onDoubleClick?.(inspectElement(element));
              copiedOnPointerUp = { element, time: event.timeStamp };
              disabledClick = null;
            } else disabledClick = { element, time: event.timeStamp };
          } else disabledClick = null;
        }
        if (event.pointerType !== "touch") event.preventDefault();
        event.stopImmediatePropagation();
      }
      press = null;
    }

    function cancelPointer() {
      press = null;
    }
    function leaveDocument() {
      pointer = null;
    }

    function keyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        stop();
        return;
      }
      if (
        isOwnedEvent(event) ||
        event.key === "Tab" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      const element = eventElement(event);
      if (!element) return;
      if (event.key === "Enter" || event.key === " ") {
        select(element);
        event.preventDefault();
      } else if (
        element.closest(
          "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
        )
      ) {
        event.preventDefault();
      }
      event.stopImmediatePropagation();
    }

    const blockedEvents = [
      "click",
      "auxclick",
      "contextmenu",
      "mousedown",
      "mouseup",
      "dragstart",
      "submit",
      "keypress",
      "keyup",
    ];
    blockedEvents.forEach((name) => {
      window.addEventListener(name, block, true);
    });
    window.addEventListener("pointermove", pointerMove, true);
    window.addEventListener("dblclick", doubleClick, true);
    window.addEventListener("pointerdown", pointerDown, true);
    window.addEventListener("pointerup", pointerUp, true);
    window.addEventListener("pointercancel", cancelPointer, true);
    window.addEventListener("keydown", keyDown, true);
    document.addEventListener("pointerleave", leaveDocument);
    const markDirty = () => {
      dirty.current = true;
    };
    window.addEventListener("resize", markDirty);
    window.addEventListener("scroll", markDirty, true);
    window.visualViewport?.addEventListener("resize", markDirty);
    window.visualViewport?.addEventListener("scroll", markDirty);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      blockedEvents.forEach((name) => {
        window.removeEventListener(name, block, true);
      });
      window.removeEventListener("pointermove", pointerMove, true);
      window.removeEventListener("dblclick", doubleClick, true);
      window.removeEventListener("pointerdown", pointerDown, true);
      window.removeEventListener("pointerup", pointerUp, true);
      window.removeEventListener("pointercancel", cancelPointer, true);
      window.removeEventListener("keydown", keyDown, true);
      document.removeEventListener("pointerleave", leaveDocument);
      window.removeEventListener("resize", markDirty);
      window.removeEventListener("scroll", markDirty, true);
      window.visualViewport?.removeEventListener("resize", markDirty);
      window.visualViewport?.removeEventListener("scroll", markDirty);
    };
  }, [enabled, clear, stop, onDoubleClick]);

  return {
    enabled,
    setEnabled,
    selected,
    hoverHighlight,
    selectedHighlight,
    notice,
    clear,
    stop,
    captureSelection,
  };
}
