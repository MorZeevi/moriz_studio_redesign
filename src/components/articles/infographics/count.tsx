import type { StatNumber } from "@/lib/articles/infographic-values";

export function CountText({
  text,
  parsed,
}: {
  text: string;
  parsed: StatNumber | null;
}) {
  if (!parsed) return <span>{text}</span>;
  return (
    <span
      data-count=""
      data-final={text}
      data-target={String(parsed.numeric)}
      data-decimals={String(parsed.decimals)}
      data-grouped={parsed.grouped ? "true" : "false"}
    >
      {text}
    </span>
  );
}

export function withUnit(value: string, unit: string) {
  const trimmed = unit.trim();
  if (!trimmed) return value;
  return /\p{L}/u.test(trimmed) ? `${value} ${trimmed}` : `${value}${trimmed}`;
}
