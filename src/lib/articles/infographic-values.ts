/** Published numbers for article infographics. The unit stays in a separate prop. */
const STAT_VALUE = /^[+]?(?:\d{1,3}(?:,\d{3}){1,3}|\d{1,12})(?:\.(\d{1,4}))?$/;

export type StatNumber = {
  numeric: number;
  decimals: number;
  grouped: boolean;
};

export function parseStatValue(raw: string): StatNumber | null {
  const value = raw.trim();
  const match = STAT_VALUE.exec(value);
  if (!match) return null;
  const numeric = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  return {
    numeric,
    decimals: match[1]?.length ?? 0,
    grouped: value.includes(","),
  };
}

/** Intermediate count-up text. The animation finishes on the author's exact string. */
export function formatStatValue(
  value: number,
  spec: { decimals: number; grouped: boolean },
) {
  const negative = value < 0;
  const absolute = Math.abs(value);
  const digits =
    spec.decimals === 0
      ? String(Math.round(absolute))
      : absolute.toFixed(spec.decimals);
  const [whole, fraction] = digits.split(".");
  const body = spec.grouped
    ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : whole;
  const text = fraction ? `${body}.${fraction}` : body;
  return negative ? `-${text}` : text;
}
