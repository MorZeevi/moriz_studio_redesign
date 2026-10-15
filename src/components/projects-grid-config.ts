/**
 * Every composition decision for the projects grid lives here. Change the
 * patterns, ratios or CTA position without touching the components.
 *
 * Breakpoints are in `projects-archive.module.css` (media queries cannot read
 * variables): one column below 48rem, the desktop editorial pattern from
 * 64rem, three compact columns from 80rem.
 */

export const projectLayouts = ["standard", "compact", "editorial"] as const;
export type ProjectLayout = (typeof projectLayouts)[number];

export const defaultProjectLayout: ProjectLayout = "editorial";
export const projectLayoutStorageKey = "moriz:projects-layout";
/** Set on <html> before paint so a saved layout never flashes. */
export const projectLayoutAttribute = "data-projects-layout";

/** Uniform ratios for the two regular grids. */
export const regularRatios: Record<
  Exclude<ProjectLayout, "editorial">,
  string
> = {
  standard: "4 / 3",
  compact: "4 / 3",
};

/** The contact card follows this many projects (or the last one, if fewer). */
export const contactCardAfter = 3;

/** `offset` drops a slot down for a staggered, editorial rhythm (desktop). */
type Slot = { span: number; ratio: string; large?: boolean; offset?: boolean };
type Row = Slot[];

/**
 * Editorial rows on a 12-column grid. Rows repeat in order; a featured project
 * at the start of a row takes `featuredStart`, one in second place takes
 * `featuredEnd`, so it always lands in the large slot without reordering.
 */
const desktop = {
  columns: 12,
  featuredStart: [
    { span: 8, ratio: "4 / 3", large: true },
    { span: 4, ratio: "3 / 4" },
  ],
  featuredEnd: [
    { span: 4, ratio: "3 / 4" },
    { span: 8, ratio: "4 / 3", large: true },
  ],
  rows: [
    [
      { span: 7, ratio: "4 / 3" },
      { span: 5, ratio: "4 / 5", offset: true },
    ],
    [{ span: 12, ratio: "21 / 9" }],
    [
      { span: 4, ratio: "3 / 4" },
      { span: 4, ratio: "3 / 4", offset: true },
      { span: 4, ratio: "3 / 4" },
    ],
    [
      { span: 5, ratio: "4 / 5", offset: true },
      { span: 7, ratio: "4 / 3" },
    ],
  ],
  /** A single leftover item at the end of the grid. */
  alone: { span: 12, ratio: "21 / 9" },
} satisfies EditorialPattern;

/** Tablet: the same rhythm in two columns. Mobile stacks this pattern. */
const tablet = {
  columns: 12,
  featuredStart: [{ span: 12, ratio: "16 / 10", large: true }],
  featuredEnd: [{ span: 12, ratio: "16 / 10", large: true }],
  rows: [
    [
      { span: 6, ratio: "4 / 5" },
      { span: 6, ratio: "4 / 5" },
    ],
    [{ span: 12, ratio: "16 / 9" }],
  ],
  alone: { span: 12, ratio: "16 / 9" },
} satisfies EditorialPattern;

type EditorialPattern = {
  columns: number;
  featuredStart: Row;
  featuredEnd: Row;
  rows: Row[];
  alone: Slot;
};

/** Assigns a slot to every item, in order. Featured items get large slots. */
function compose(items: { featured?: boolean }[], pattern: EditorialPattern) {
  const slots: Slot[] = [];
  let cycle = 0;
  let index = 0;
  while (index < items.length) {
    const left = items.length - index;
    let row: Row;
    if (items[index].featured) row = pattern.featuredStart;
    else if (items[index + 1]?.featured) row = pattern.featuredEnd;
    else {
      row = pattern.rows[cycle % pattern.rows.length];
      cycle += 1;
      // Never split a row around an upcoming featured item.
      if (items.slice(index + 1, index + row.length).some((i) => i.featured)) {
        row = pattern.rows.find((r) => r.length <= 2) ?? row;
      }
    }
    if (left < row.length) row = fit(row, left, pattern);
    slots.push(...row);
    index += row.length;
  }
  return slots;
}

/** Stretches the first `count` slots of a row to fill the full width. */
function fit(row: Row, count: number, pattern: EditorialPattern): Row {
  if (count === 1) return [{ ...pattern.alone, large: row[0].large }];
  const used = row.slice(0, count);
  const total = used.reduce((sum, slot) => sum + slot.span, 0);
  let remaining = pattern.columns;
  return used.map((slot, i) => {
    const span =
      i === used.length - 1
        ? remaining
        : Math.round((slot.span / total) * pattern.columns);
    remaining -= span;
    return { ...slot, span };
  });
}

export type EditorialSlot = {
  span: number;
  ratio: string;
  tabletSpan: number;
  tabletRatio: string;
  large: boolean;
  offset: boolean;
};

/** Desktop and tablet editorial slots for a sequence of grid items. */
export function editorialSlots(
  items: { featured?: boolean }[],
): EditorialSlot[] {
  const wide = compose(items, desktop);
  const medium = compose(items, tablet);
  return wide.map((slot, i) => ({
    span: slot.span,
    ratio: slot.ratio,
    tabletSpan: medium[i].span,
    tabletRatio: medium[i].ratio,
    large: Boolean(slot.large),
    offset: Boolean(slot.offset),
  }));
}

/** Where the contact card goes in a list of `count` projects. */
export function contactCardIndex(count: number) {
  return Math.min(contactCardAfter, count);
}

/** Image `sizes` per layout, matched to the column counts above. */
export const projectImageSizes: Record<ProjectLayout, string> = {
  standard: "(min-width: 48rem) 48vw, 94vw",
  compact: "(min-width: 80rem) 31vw, (min-width: 48rem) 48vw, 94vw",
  editorial: "(min-width: 64rem) 66vw, 94vw",
};

/**
 * Runs in the page before the grid paints: applies the saved (or default)
 * layout to <html>.
 * Mirrors `themeBootstrap` in `src/lib/theme.ts`.
 */
export const projectLayoutBootstrap = `(()=>{let v="${defaultProjectLayout}";try{const s=localStorage.getItem("${projectLayoutStorageKey}");if(${JSON.stringify(projectLayouts)}.includes(s))v=s}catch{}document.documentElement.setAttribute("${projectLayoutAttribute}",v)})()`;
