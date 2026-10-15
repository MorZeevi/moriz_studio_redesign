import type { SourceContext } from "./types";

export function resolveSource(element: Element): SourceContext {
  const node = element.closest("[data-inspector-file]");
  if (!node) return { kind: "unavailable" };
  const file = node.getAttribute("data-inspector-file");
  const line = Number(node.getAttribute("data-inspector-line"));
  const column = Number(node.getAttribute("data-inspector-column"));
  if (
    !file ||
    !/^(src|design-system\/(react|next))\//.test(file) ||
    !Number.isInteger(line) ||
    line < 1
  ) {
    return { kind: "unavailable" };
  }
  return {
    kind: node === element ? "exact" : "containing",
    component: node.getAttribute("data-inspector-component") || undefined,
    file,
    line,
    column: Number.isInteger(column) && column > 0 ? column : undefined,
  };
}
