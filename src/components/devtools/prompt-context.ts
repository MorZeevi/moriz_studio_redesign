import type { PromptContext } from "./types";

export function formatPrompt({ page, element, request }: PromptContext) {
  const { source } = element;
  return [
    "Selected element:",
    `Page: ${page.pathname}`,
    `Language / direction: ${page.language} / ${page.direction}`,
    `Source mapping: ${source.kind === "exact" ? "Exact JSX declaration" : source.kind === "containing" ? "Containing source (not this element's exact declaration)" : "Unavailable"}`,
    `Component (declared): ${source.component || "Unavailable"}`,
    `File: ${source.file || "Unavailable"}`,
    `Line: ${source.line || "Unavailable"}${source.column ? `, column: ${source.column}` : ""}`,
    `Selector: ${element.selector}`,
    `Tag: ${element.tag}`,
    `ID: ${element.id || "None"}`,
    `Classes: ${element.classes.join(" ") || "None"}`,
    `Data attributes: ${JSON.stringify(element.dataAttributes)}`,
    `Text: ${element.text || "None"}${element.textTruncated ? " [truncated]" : ""}`,
    `Accessible name: ${element.accessibleName || "Unavailable"}`,
    `Size: ${Math.round(element.rect.width)} × ${Math.round(element.rect.height)} CSS px`,
    "",
    "Request:",
    request.trim(),
  ].join("\n");
}
