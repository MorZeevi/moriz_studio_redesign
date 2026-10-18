import type { GalleryRow, ProjectContentBlock } from "@/types/project";
import { galleryRowsBlock, MAX_ROW_ITEMS } from "./validation";

// Pure edits of the case-study gallery rows. Every function returns new rows
// and never leaves an empty row behind.

function newRow(items: string[]): GalleryRow {
  return { id: crypto.randomUUID(), items };
}
const tidy = (rows: GalleryRow[]) => rows.filter((row) => row.items.length);

export function galleryRows(content: ProjectContentBlock[]): GalleryRow[] {
  return galleryRowsBlock(content)?.rows ?? [];
}
/** Replaces the gallery block's rows; the block always stays last. */
export function withGalleryRows(
  content: ProjectContentBlock[],
  rows: GalleryRow[],
): ProjectContentBlock[] {
  const current = galleryRowsBlock(content);
  return [
    ...content.filter((block) => block.type !== "gallery_rows"),
    {
      id: current?.id ?? crypto.randomUUID(),
      type: "gallery_rows",
      rows: tidy(rows),
    },
  ];
}
/** Rows from groups of srcs (the legacy gallery), with new ids. */
export function rowsFrom(groups: string[][]): GalleryRow[] {
  return groups.filter((items) => items.length).map((items) => newRow(items));
}
export function inGallery(rows: GalleryRow[], src: string) {
  return rows.some((row) => row.items.includes(src));
}
/** Adds a file as a new full-width row at the end. */
export function addToGallery(rows: GalleryRow[], src: string): GalleryRow[] {
  return inGallery(rows, src) ? rows : [...rows, newRow([src])];
}
/** Takes a file out of the gallery; the file itself stays in the project. */
export function removeFromGallery(
  rows: GalleryRow[],
  src: string,
): GalleryRow[] {
  return tidy(
    rows.map((row) => ({
      ...row,
      items: row.items.filter((item) => item !== src),
    })),
  );
}
/** Swaps the two files of a pair. */
export function swapInRow(rows: GalleryRow[], rowId: string): GalleryRow[] {
  return rows.map((row) =>
    row.id === rowId && row.items.length === 2
      ? { ...row, items: [row.items[1], row.items[0]] }
      : row,
  );
}
/**
 * One file at full width, or two side by side. Splitting moves the second
 * file to its own row below; pairing pulls in the first file of the next row.
 */
export function setRowLayout(
  rows: GalleryRow[],
  rowId: string,
  layout: "full" | "pair",
): GalleryRow[] {
  const index = rows.findIndex((row) => row.id === rowId);
  if (index < 0) return rows;
  const row = rows[index];
  if (layout === "full") {
    if (row.items.length < 2) return rows;
    return [
      ...rows.slice(0, index),
      { ...row, items: [row.items[0]] },
      newRow(row.items.slice(1)),
      ...rows.slice(index + 1),
    ];
  }
  const next = rows[index + 1];
  if (row.items.length >= MAX_ROW_ITEMS || !next) return rows;
  return tidy([
    ...rows.slice(0, index),
    { ...row, items: [...row.items, next.items[0]] },
    { ...next, items: next.items.slice(1) },
    ...rows.slice(index + 2),
  ]);
}
/**
 * Moves a file into another row: it joins a row with a free slot, otherwise
 * it gets its own row right after the target.
 */
export function moveToRow(
  rows: GalleryRow[],
  src: string,
  targetId: string,
): GalleryRow[] {
  const source = rows.find((row) => row.items.includes(src));
  if (!source || source.id === targetId) return rows;
  const without = rows.map((row) =>
    row === source
      ? { ...row, items: row.items.filter((item) => item !== src) }
      : row,
  );
  const result: GalleryRow[] = [];
  for (const row of without) {
    if (row.id !== targetId) {
      result.push(row);
      continue;
    }
    if (row.items.length < MAX_ROW_ITEMS)
      result.push({ ...row, items: [...row.items, src] });
    else result.push(row, newRow([src]));
  }
  return tidy(result);
}
/**
 * Moves a file one row up or down. From a pair, the file first gets a row of
 * its own on that side; a lone file joins the neighbouring row when it has a
 * free slot, otherwise the two rows trade places.
 */
export function moveToAdjacentRow(
  rows: GalleryRow[],
  src: string,
  direction: -1 | 1,
): GalleryRow[] {
  const index = rows.findIndex((row) => row.items.includes(src));
  if (index < 0) return rows;
  const row = rows[index];
  if (row.items.length > 1) {
    const rest = { ...row, items: row.items.filter((item) => item !== src) };
    const own = newRow([src]);
    return [
      ...rows.slice(0, index),
      ...(direction < 0 ? [own, rest] : [rest, own]),
      ...rows.slice(index + 1),
    ];
  }
  const target = rows[index + direction];
  if (!target) return rows;
  if (target.items.length < MAX_ROW_ITEMS) return moveToRow(rows, src, target.id);
  const next = [...rows];
  next[index] = target;
  next[index + direction] = row;
  return next;
}
