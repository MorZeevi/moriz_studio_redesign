import { computeAccessibleName } from "dom-accessibility-api";
import { resolveSource } from "./source-context";
import type { InspectorRect, SelectedElementContext } from "./types";

export const ownedSelector = "[data-devtools-owned], nextjs-portal";

export function eventElement(event: Event): Element | null {
  const path = event.composedPath();
  if (
    path.some((node) => node instanceof Element && node.matches(ownedSelector))
  )
    return null;
  const target = path.find((node) => node instanceof Element) ?? event.target;
  let element =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  // Inspect a shadow host, not an internal node with an unusable document selector.
  while (element?.getRootNode() instanceof ShadowRoot) {
    element = (element.getRootNode() as ShadowRoot).host;
  }
  return element &&
    !element.closest(ownedSelector) &&
    !element.matches("html, body, head, script, style, link, meta")
    ? element
    : null;
}

export function isOwnedEvent(event: Event) {
  return event
    .composedPath()
    .some(
      (node) => node instanceof Element && Boolean(node.closest(ownedSelector)),
    );
}

export function readRect(element: Element): InspectorRect {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y, width, height };
}

export function sameRect(a: InspectorRect | null, b: InspectorRect | null) {
  return (
    a === b ||
    Boolean(
      a &&
        b &&
        a.x === b.x &&
        a.y === b.y &&
        a.width === b.width &&
        a.height === b.height,
    )
  );
}

export function elementLabel(element: Element) {
  const id = element.id ? `#${element.id}` : "";
  const classes = [...element.classList]
    .slice(0, 2)
    .map((name) => `.${name}`)
    .join("");
  return `${element.localName}${id || classes}`;
}

export function uniqueSelector(element: Element) {
  const document = element.ownerDocument;
  const unique = (value: string) => {
    const matches = document.querySelectorAll(value);
    return matches.length === 1 && matches[0] === element;
  };
  if (element.id && unique(`#${CSS.escape(element.id)}`))
    return `#${CSS.escape(element.id)}`;
  const parts: string[] = [];
  for (let node: Element | null = element; node; node = node.parentElement) {
    const tag = CSS.escape(node.localName);
    const id = node.id ? `#${CSS.escape(node.id)}` : "";
    const classes = [...node.classList]
      .slice(0, 2)
      .map((name) => `.${CSS.escape(name)}`)
      .join("");
    const segment = id || `${tag}${classes}`;
    const candidate = [segment, ...parts].join(" > ");
    if (unique(candidate)) return candidate;
    const siblings = node.parentElement
      ? [...node.parentElement.children].filter(
          (sibling) => sibling.localName === node.localName,
        )
      : [node];
    parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(node) + 1})`);
    if (unique(parts.join(" > "))) return parts.join(" > ");
  }
  return parts.join(" > ");
}

export function elementIdentifier(element: SelectedElementContext) {
  if (element.id) return `#${CSS.escape(element.id)}`;
  if (element.classes.length) {
    return element.classes.map((name) => `.${CSS.escape(name)}`).join("");
  }
  return element.selector;
}

function visibleText(element: Element): string {
  if (element.matches("input, textarea, select")) return "";
  if (element instanceof HTMLElement) return element.innerText;
  return [...element.childNodes]
    .map((node) => {
      if (node instanceof Element && getComputedStyle(node).display === "none")
        return "";
      return node.textContent || "";
    })
    .join(" ");
}

export function inspectElement(element: Element): SelectedElementContext {
  const text = visibleText(element).replace(/\s+/g, " ").trim();
  const dataAttributes = Object.fromEntries(
    [...element.attributes]
      .filter(
        ({ name }) =>
          name.startsWith("data-") && !name.startsWith("data-inspector-"),
      )
      .map(({ name, value }) => [name, value]),
  );
  let accessibleName = "";
  try {
    accessibleName = computeAccessibleName(element);
  } catch {
    /* DOM-only inspection remains useful. */
  }
  return {
    tag: element.localName,
    id: element.id,
    classes: [...element.classList],
    dataAttributes,
    text: text.slice(0, 500),
    textTruncated: text.length > 500,
    accessibleName,
    selector: uniqueSelector(element),
    rect: readRect(element),
    source: resolveSource(element),
  };
}
