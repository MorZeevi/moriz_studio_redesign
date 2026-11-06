"use client";

type ConversionEvent =
  | "contact_click"
  | "contact_form_start"
  | "contact_form_success"
  | "contact_form_error"
  | "projects_section_view"
  | "contact_section_view";
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  clarity?: (...args: unknown[]) => void;
};
export function canMeasure() {
  return (
    process.env.NODE_ENV === "production" &&
    /^(www\.)?moriz\.studio$/.test(window.location.hostname) &&
    !/^\/(?:admin|digital-audit)(?:\/|$)/.test(window.location.pathname)
  );
}
/** Only public path and controlled dimensions; never destinations or field values. */
export function trackConversion(
  event: ConversionEvent,
  dimensions: {
    channel?: "whatsapp" | "phone" | "email";
    placement?: string;
  } = {},
) {
  if (!canMeasure()) return;
  const target = window as AnalyticsWindow;
  const params = { page_path: location.pathname, ...dimensions };
  target.dataLayer ??= [];
  function send(..._args: unknown[]) {
    // biome-ignore lint/complexity/noArguments: Google tag command queues require an Arguments object.
    target.dataLayer?.push(arguments);
  }
  send("event", event, params);
  target.clarity?.("event", event);
}
