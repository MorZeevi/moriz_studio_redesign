"use client";
import type { CSSProperties, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  addToGallery,
  inGallery,
  moveToAdjacentRow,
  moveToRow,
  removeFromGallery,
  setRowLayout,
  swapInRow,
} from "@/lib/cms/gallery-rows";
import type { GalleryRow, ProjectMediaItem } from "@/types/project";
import { BulkUpload, MediaDetails, ReplaceFile } from "./gallery-manager";
import { MediaPreview } from "./media-upload";
import { moveItem, SortableList } from "./sortable-list";
import styles from "./admin.module.css";

const ITEM_MIME = "application/x-moriz-gallery-item";
type Rows = (change: (rows: GalleryRow[]) => GalleryRow[]) => void;

function fileName(src: string) {
  return src.split("/").pop() ?? src;
}
function ratio(item: ProjectMediaItem) {
  return item.width && item.height
    ? ({ "--ratio": `${item.width} / ${item.height}` } as CSSProperties)
    : undefined;
}
function dragItem(src: string) {
  return (e: DragEvent) => {
    e.dataTransfer.setData(ITEM_MIME, src);
    e.dataTransfer.effectAllowed = "move";
  };
}

/**
 * The case-study gallery as rows: one file at full width or two side by side,
 * images and videos mixed. The order here is the order on the project page.
 */
export function GalleryRowsEditor({
  projectId,
  media,
  rows,
  setRows,
  update,
  onUploaded,
  onBusy,
  usage,
  onDelete,
  onReplace,
  cover,
  ogImage,
  onUseAsCover,
  onUseAsOg,
}: {
  projectId: string;
  media: ProjectMediaItem[];
  rows: GalleryRow[];
  /** Functional update of the rows, so consecutive uploads all land. */
  setRows: Rows;
  update: (change: (media: ProjectMediaItem[]) => ProjectMediaItem[]) => void;
  /** Adds an uploaded file to the project and as a new gallery row. */
  onUploaded: (item: ProjectMediaItem) => void;
  onBusy: (busy: boolean) => void;
  usage: (src: string) => string[];
  /** Deletes the file from the whole project, then from storage. */
  onDelete: (src: string) => void;
  onReplace: (from: string, to: ProjectMediaItem) => void;
  cover: string | null;
  ogImage: string | null;
  onUseAsCover: (src: string) => void;
  onUseAsOg: (src: string) => void;
}) {
  const files = new Map(media.map((m) => [m.src, m]));
  // The logo and the main video have their own places.
  const extras = media.filter((m) => !m.role && !inGallery(rows, m.src));
  const counts = rows
    .flatMap((row) => row.items)
    .reduce(
      (sum, src) => {
        const kind = files.get(src)?.kind;
        if (kind) sum[kind]++;
        return sum;
      },
      { image: 0, video: 0 },
    );
  const numbers = new Map(
    rows.flatMap((row) => row.items).map((src, index) => [src, index + 1]),
  );
  function drop(rowId: string) {
    return (e: DragEvent) => {
      const src = e.dataTransfer.getData(ITEM_MIME);
      if (!src) return;
      e.preventDefault();
      e.stopPropagation();
      setRows((list) => moveToRow(addToGallery(list, src), src, rowId));
    };
  }
  function remove(item: ProjectMediaItem) {
    const places = usage(item.src).filter((place) => place !== "גלריה");
    const message = places.length
      ? `הקובץ בשימוש גם ב: ${places.join(", ")}. מחיקתו תסיר אותו מכל המקומות ומהאחסון. למחוק?`
      : "למחוק את הקובץ מהפרויקט? השינוי יישמר רק בשמירת הפרויקט.";
    if (window.confirm(message)) onDelete(item.src);
  }
  function tags(item: ProjectMediaItem) {
    return [
      item.kind === "video" ? "סרטון" : "תמונה",
      // Isolated left-to-right, so "1600×900" is not mirrored in Hebrew.
      item.width && item.height ? `\u2066${item.width}×${item.height}\u2069` : "",
      item.src === cover ? "תמונה ראשית" : "",
      item.src === ogImage ? "תמונת שיתוף" : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return (
    <div>
      <p className={styles.hint} data-gallery-count={counts.image}>
        {rows.length
          ? `${rows.length} שורות · ${counts.image} תמונות · ${counts.video} סרטונים. הסדר כאן הוא הסדר בעמוד הפרויקט; במובייל הפריטים מוצגים בטור אחד באותו סדר.`
          : "הגלריה ריקה. העלו תמונות וסרטונים, או הוסיפו קבצים שכבר בפרויקט."}
      </p>
      <BulkUpload projectId={projectId} onBusy={onBusy} onUploaded={onUploaded} />
      <SortableList
        className={styles.galleryRows}
        items={rows}
        type="gallery-row"
        itemKey={(row) => row.id}
        label={(_, index) => `שורה ${index + 1}`}
        onMove={(from, to) => setRows((list) => moveItem(list, from, to))}
        render={(row, index, handle) => {
          const pair = row.items.length > 1;
          const canPair = pair || index < rows.length - 1;
          return (
            <section
              className={styles.galleryRow}
              aria-label={`שורה ${index + 1}`}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes(ITEM_MIME)) e.preventDefault();
              }}
              onDrop={drop(row.id)}
            >
              <header className={styles.blockHeader}>
                <strong>שורה {index + 1}</strong>
                <fieldset
                  className={styles.segmented}
                  aria-label={`פריסת שורה ${index + 1}`}
                >
                  <button
                    type="button"
                    aria-pressed={!pair}
                    onClick={() =>
                      setRows((list) => setRowLayout(list, row.id, "full"))
                    }
                  >
                    אלמנט אחד ברוחב מלא
                  </button>
                  <button
                    type="button"
                    aria-pressed={pair}
                    disabled={!canPair}
                    title={
                      canPair
                        ? undefined
                        : "אין פריט בשורה הבאה. הוסיפו קובץ נוסף לגלריה."
                    }
                    onClick={() =>
                      setRows((list) => setRowLayout(list, row.id, "pair"))
                    }
                  >
                    שני אלמנטים זה לצד זה
                  </button>
                </fieldset>
                {handle}
              </header>
              <div className={styles.rowItems} data-pair={pair || undefined}>
                {row.items.map((src) => {
                  const item = files.get(src);
                  const number = numbers.get(src) ?? 0;
                  const label = `פריט ${number}`;
                  if (!item)
                    return (
                      <div key={src} className={styles.rowItem}>
                        <p className={styles.error}>
                          הקובץ כבר לא בפרויקט.
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setRows((list) => removeFromGallery(list, src))
                          }
                        >
                          הסרה מהגלריה
                        </Button>
                      </div>
                    );
                  return (
                    <article
                      key={src}
                      className={styles.rowItem}
                      aria-label={label}
                    >
                      {/* biome-ignore lint/a11y/noStaticElementInteractions: Dragging is a mouse shortcut; the row buttons below move files by keyboard. */}
                      <div
                        className={styles.rowPreview}
                        style={ratio(item)}
                        draggable
                        onDragStart={dragItem(src)}
                        title="גררו לשורה אחרת"
                      >
                        <MediaPreview
                          src={src}
                          label={item.alt || fileName(src)}
                        />
                      </div>
                      <p className={styles.hint}>
                        {label} · {tags(item)}
                      </p>
                      <div className={styles.actions}>
                        {pair && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setRows((list) => swapInRow(list, row.id))
                            }
                            aria-label={`החלפת צד ל${label}`}
                          >
                            החלפת צד
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={index === 0 && !pair}
                          onClick={() =>
                            setRows((list) => moveToAdjacentRow(list, src, -1))
                          }
                          aria-label={`העברת ${label} לשורה הקודמת`}
                        >
                          לשורה הקודמת
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={index === rows.length - 1 && !pair}
                          onClick={() =>
                            setRows((list) => moveToAdjacentRow(list, src, 1))
                          }
                          aria-label={`העברת ${label} לשורה הבאה`}
                        >
                          לשורה הבאה
                        </Button>
                      </div>
                      <div className={styles.actions}>
                        <ReplaceFile
                          projectId={projectId}
                          item={item}
                          onBusy={onBusy}
                          onReplace={onReplace}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setRows((list) => removeFromGallery(list, src))
                          }
                          aria-label={`הסרת ${label} מהגלריה`}
                        >
                          הסרה מהגלריה
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(item)}
                          aria-label={`מחיקת הקובץ של ${label}`}
                        >
                          מחיקת קובץ
                        </Button>
                      </div>
                      <details className={styles.more}>
                        <summary>שימוש במקום אחר</summary>
                        <div className={styles.actions}>
                          {item.src !== cover && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUseAsCover(item.src)}
                            >
                              שימוש כתמונה ראשית
                            </Button>
                          )}
                          {item.kind === "image" &&
                            /\.(jpg|png|webp)$/i.test(item.src) &&
                            item.src !== ogImage && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onUseAsOg(item.src)}
                              >
                                תמונת שיתוף
                              </Button>
                            )}
                        </div>
                      </details>
                      <MediaDetails
                        projectId={projectId}
                        item={item}
                        label={label}
                        single={!pair}
                        onBusy={onBusy}
                        update={update}
                      />
                    </article>
                  );
                })}
              </div>
            </section>
          );
        }}
      />
      {!!extras.length && (
        <section className={styles.extras} aria-labelledby="gallery-extras">
          <h3 id="gallery-extras">קבצים בפרויקט שאינם בגלריה</h3>
          <p className={styles.hint}>
            למשל התמונה הראשית, מדיה למעבר עכבר או קבצים בבלוקי תוכן. הוספה
            לגלריה מציגה אותם גם בסוף עמוד הפרויקט. אפשר גם לגרור קובץ לשורה.
          </p>
          <ul className={styles.extrasGrid}>
            {extras.map((item) => {
              const places = usage(item.src);
              return (
                <li key={item.src}>
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: Dragging is a mouse shortcut for the "הוספה לגלריה" button. */}
                  <div
                    className={styles.rowPreview}
                    style={ratio(item)}
                    draggable
                    onDragStart={dragItem(item.src)}
                  >
                    <MediaPreview
                      src={item.src}
                      label={item.alt || fileName(item.src)}
                    />
                  </div>
                  <p className={styles.hint}>
                    {tags(item)}
                    {places.length ? ` · בשימוש: ${places.join(", ")}` : ""}
                  </p>
                  <div className={styles.actions}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setRows((list) => addToGallery(list, item.src))
                      }
                    >
                      הוספה לגלריה
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(item)}
                    >
                      מחיקת קובץ
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
