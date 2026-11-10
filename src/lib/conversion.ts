"use client";

type ConversionEvent =
  | "contact_click"
  | "contact_anchor_click"
  | "contact_form_start"
  | "contact_form_success"
  | "contact_form_error"
  | "generate_lead"
  | "diagnostic_click"
  | "chat_open"
  | "projects_section_view"
  | "contact_section_view";
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  clarity?: (...args: unknown[]) => void;
};

const INTERNAL_KEY = "moriz-internal";

/** The owner's devices opt out once with `?internal=1` (`?internal=0` opts
 * back in), so their visits never reach Google Analytics or Clarity. */
function isInternalVisitor() {
  try {
    const flag = new URLSearchParams(window.location.search).get("internal");
    if (flag === "1") window.localStorage.setItem(INTERNAL_KEY, "1");
    if (flag === "0") window.localStorage.removeItem(INTERNAL_KEY);
    return window.localStorage.getItem(INTERNAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function canMeasure() {
  return (
    process.env.NODE_ENV === "production" &&
    /^(www\.)?moriz\.studio$/.test(window.location.hostname) &&
    !/^\/(?:admin|digital-audit)(?:\/|$)/.test(window.location.pathname) &&
    !isInternalVisitor()
  );
}
/** Only public path and controlled dimensions; never destinations or field values. */
export function trackConversion(
  event: ConversionEvent,
  dimensions: {
    channel?: "whatsapp" | "phone" | "email" | "form";
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
