// P6b — first-touch attribution for the diagnostic funnel. Captured once
// (whichever event fires first, usually `landing_view`) and replayed on every
// later event so campaign source survives navigation, refresh, and browser
// restart. localStorage (not sessionStorage) because session-client.ts's
// StoredSession already uses localStorage and survives a browser restart —
// attribution must outlive at least as long as the session it's meant to
// attribute, or a resumed session's `lead_submitted` would lose its source.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

// Pure (no window access) so it's testable without a DOM.
export function parseUtmParams(search: string): Record<string, string> | undefined {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export interface Attribution {
  utm?: Record<string, string>;
  referrer?: string;
  landingPath: string;
  firstSeenAt: string;
}

interface BuildAttributionInput {
  search: string;
  pathname: string;
  referrer: string;
  origin: string;
  now: string;
}

// Pure (no window access) so it's testable without a DOM. Drops same-origin
// referrers — they only reflect internal navigation, not a campaign source.
export function buildAttribution(input: BuildAttributionInput): Attribution {
  const utm = parseUtmParams(input.search);
  const attribution: Attribution = {
    landingPath: input.pathname,
    firstSeenAt: input.now,
  };
  if (utm) attribution.utm = utm;
  if (input.referrer && !input.referrer.startsWith(input.origin)) {
    attribution.referrer = input.referrer;
  }
  return attribution;
}

const STORAGE_KEY = 'moriz-diagnostic-attribution';

const MAX_LANDING_PATH_LENGTH = 500;
const MAX_TIMESTAMP_LENGTH = 40;
const MAX_REFERRER_LENGTH = 500;
const MAX_UTM_KEYS = 20;
const MAX_UTM_KEY_LENGTH = 64;
const MAX_UTM_VALUE_LENGTH = 256;

// Shared with validation.ts (server ingest boundary) so the utm bound
// enforced there can never silently drift from the one enforced here.
export function isValidUtm(utm: unknown): utm is Record<string, string> {
  if (typeof utm !== 'object' || utm === null || Array.isArray(utm)) {
    return false;
  }
  const entries = Object.entries(utm as Record<string, unknown>);
  if (entries.length > MAX_UTM_KEYS) {
    return false;
  }
  return entries.every(
    ([key, value]) =>
      key.length > 0 &&
      key.length <= MAX_UTM_KEY_LENGTH &&
      typeof value === 'string' &&
      value.length <= MAX_UTM_VALUE_LENGTH
  );
}

export function isValidAttribution(value: unknown): value is Attribution {
  if (typeof value !== 'object' || value === null) return false;
  const { landingPath, firstSeenAt, referrer, utm } = value as Record<string, unknown>;
  if (typeof landingPath !== 'string' || landingPath.length === 0 || landingPath.length > MAX_LANDING_PATH_LENGTH) {
    return false;
  }
  if (typeof firstSeenAt !== 'string' || firstSeenAt.length === 0 || firstSeenAt.length > MAX_TIMESTAMP_LENGTH) {
    return false;
  }
  if (referrer !== undefined && (typeof referrer !== 'string' || referrer.length > MAX_REFERRER_LENGTH)) {
    return false;
  }
  if (utm !== undefined && !isValidUtm(utm)) {
    return false;
  }
  return true;
}

// Storage access is a boundary that can throw in the wild (privacy settings,
// partitioned/sandboxed webviews, quota exceeded) — swallow and degrade
// rather than let trackDiagnosticEvent take down the caller (e.g. the
// landing_view mount effect, or a click handler's state update after it).
function readStored(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidAttribution(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(attribution: Attribution): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage blocked/full: attribution is still returned to the caller for
    // this event, it just won't persist for the next one.
  }
}

// Returns the persisted first-touch attribution, capturing it from the
// current URL on first call if nothing is stored yet. Never overwrites an
// existing *utm*, so later page views/navigations can't clobber the
// original campaign source. The one exception: a stored record with no utm
// (a direct/organic first touch) is upgraded in place if this visit carries
// a real utm — otherwise a same-browser direct visit before the first
// campaign link would permanently block attribution.
export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;

  const existing = readStored();
  if (existing?.utm) return existing;

  const attribution = buildAttribution({
    search: window.location.search,
    pathname: window.location.pathname,
    referrer: document.referrer,
    origin: window.location.origin,
    now: new Date().toISOString(),
  });

  if (existing && !attribution.utm) return existing;

  writeStored(attribution);
  return attribution;
}
