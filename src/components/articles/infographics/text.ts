import { isValidElement, type ReactNode } from "react";

export function plainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((item) => plainText(item)).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return plainText(node.props.children);
  }
  return "";
}

export function oneLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
