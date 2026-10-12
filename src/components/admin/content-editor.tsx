"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { projectCopy } from "@/i18n/project-copy";
import { galleryImages } from "@/lib/cms/validation";
import type {
  BlockType,
  MediaSpacing,
  MultiMediaLayout,
  ProjectContentBlock,
  SingleMediaLayout,
  ProjectImage,
  ProjectMediaItem,
  TextSubsection,
} from "@/types/project";
import { LocalizedField } from "./localized-field";
import { MediaUpload } from "./media-upload";
import { SortableList } from "./sortable-list";
import styles from "./admin.module.css";

export const blockLabels: Record<BlockType, string> = {
  text: "טקסט",
  image: "תמונה",
  video: "סרטון",
  two_images: "שתי תמונות",
  three_images: "שלוש תמונות",
  gallery: "גלריה",
  media_text: "תמונה וטקסט",
  highlights: "היילייטס",
};
const he = projectCopy.he.sections;
const en = projectCopy.en.sections;
type Preset = keyof typeof he;
const presetLabels: Record<Preset, string> = {
  challenge: `סקשן: ${he.challenge}`,
  approach: `סקשן: ${he.approach}`,
  solution: `סקשן: ${he.solution}`,
  design: `סקשן: ${he.design}`,
  final: `סקשן: ${he.final}`,
};
function newId() {
  return crypto.randomUUID();
}
function newBlock(type: BlockType): ProjectContentBlock {
  const id = newId();
  switch (type) {
    case "text":
      return { id, type, text: "", title: "" };
    case "image":
      return { id, type, src: "", alt: "", caption: "" };
    case "video":
      return {
        id,
        type,
        src: "",
        poster: "",
        autoplay: false,
        loop: false,
        muted: true,
        controls: true,
      };
    case "two_images":
      return { id, type, images: [{ src: "" }, { src: "" }] };
    case "three_images":
      return { id, type, images: [{ src: "" }, { src: "" }, { src: "" }] };
    case "gallery":
      return { id, type, images: [] };
    case "media_text":
      return { id, type, src: "", text: "", title: "", side: "start" };
    case "highlights":
      return { id, type };
  }
}
/** Default case-study sections, built from the ordinary block types. */
function presetBlock(
  preset: Preset,
  media: ProjectMediaItem[],
): ProjectContentBlock {
  const eyebrow = { eyebrow: he[preset], eyebrow_en: en[preset] };
  switch (preset) {
    case "challenge":
      return { id: newId(), type: "text", ...eyebrow, title: "", text: "" };
    case "approach":
    case "design":
      return {
        id: newId(),
        type: "text",
        ...eyebrow,
        title: "",
        text: "",
        subsections: [{ title: "", text: "" }],
      };
    case "solution":
      return {
        id: newId(),
        type: "media_text",
        ...eyebrow,
        src: "",
        title: "",
        text: "",
        side: "start",
        feature: true,
      };
    case "final":
      return {
        id: newId(),
        type: "gallery",
        images: galleryImages(media).map((m) => ({ src: m.src })),
      };
  }
}
type MediaProps = {
  projectId: string;
  onBusy: (busy: boolean) => void;
  media: ProjectMediaItem[];
  onUploaded: (item: ProjectMediaItem) => void;
};
function EditableImage({
  image,
  onChange,
  label = "קובץ תמונה",
  kind = "image",
  ...props
}: MediaProps & {
  image: ProjectImage;
  onChange: (image: ProjectImage) => void;
  label?: string;
  kind?: "image" | "any";
}) {
  const fromGallery = props.media.find((m) => m.src === image.src);
  return (
    <div>
      <MediaUpload
        projectId={props.projectId}
        onBusy={props.onBusy}
        onUploaded={props.onUploaded}
        choices={props.media}
        kind={kind}
        label={label}
        value={image.src || null}
        onChange={(src) => onChange({ ...image, src: src ?? "" })}
      />
      <LocalizedField
        label="טקסט חלופי לתמונה"
        hint={
          fromGallery?.alt && !image.alt
            ? `ריק = מהגלריה: ${fromGallery.alt}`
            : undefined
        }
        value={image.alt}
        valueEn={image.alt_en}
        onChange={(alt) => onChange({ ...image, alt })}
        onChangeEn={(alt_en) => onChange({ ...image, alt_en })}
      />
      <LocalizedField
        label="כיתוב תמונה"
        value={image.caption}
        valueEn={image.caption_en}
        onChange={(caption) => onChange({ ...image, caption })}
        onChangeEn={(caption_en) => onChange({ ...image, caption_en })}
      />
    </div>
  );
}
function TextFields<
  T extends {
    eyebrow?: string;
    eyebrow_en?: string;
    title?: string;
    title_en?: string;
    text: string;
    text_en?: string;
  },
>({ block, onChange }: { block: T; onChange: (block: T) => void }) {
  return (
    <>
      <LocalizedField
        label="כותרת־על"
        hint="למשל: האתגר, הגישה, הפתרון"
        value={block.eyebrow}
        valueEn={block.eyebrow_en}
        onChange={(eyebrow) => onChange({ ...block, eyebrow })}
        onChangeEn={(eyebrow_en) => onChange({ ...block, eyebrow_en })}
      />
      <LocalizedField
        label="כותרת בלוק"
        value={block.title}
        valueEn={block.title_en}
        onChange={(title) => onChange({ ...block, title })}
        onChangeEn={(title_en) => onChange({ ...block, title_en })}
      />
      <LocalizedField
        label="טקסט"
        multiline
        value={block.text}
        valueEn={block.text_en}
        onChange={(text) => onChange({ ...block, text })}
        onChangeEn={(text_en) => onChange({ ...block, text_en })}
      />
    </>
  );
}
function Subsections({
  items,
  onChange,
}: {
  items: TextSubsection[];
  onChange: (items: TextSubsection[]) => void;
}) {
  return (
    <div className={styles.subsections}>
      <h3>תתי־סעיפים</h3>
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Subsections have no identity beyond their position; they are edited in place.
        <fieldset key={index} aria-label={`תת־סעיף ${index + 1}`}>
          <LocalizedField
            label="כותרת תת־סעיף"
            hint="למשל: ארכיטקטורת מידע, זרימת משתמש, מערכת עיצוב"
            value={item.title}
            valueEn={item.title_en}
            onChange={(title) =>
              onChange(items.map((s, i) => (i === index ? { ...s, title } : s)))
            }
            onChangeEn={(title_en) =>
              onChange(
                items.map((s, i) => (i === index ? { ...s, title_en } : s)),
              )
            }
          />
          <LocalizedField
            label="טקסט תת־סעיף"
            multiline
            value={item.text}
            valueEn={item.text_en}
            onChange={(text) =>
              onChange(items.map((s, i) => (i === index ? { ...s, text } : s)))
            }
            onChangeEn={(text_en) =>
              onChange(
                items.map((s, i) => (i === index ? { ...s, text_en } : s)),
              )
            }
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            הסרת תת־סעיף
          </Button>
        </fieldset>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onChange([...items, { title: "", text: "" }])}
      >
        הוספת תת־סעיף
      </Button>
    </div>
  );
}
/** Where a media block sits in the case-study gallery column. */
function Presentation({
  block,
  onChange,
}: {
  block: ProjectContentBlock;
  onChange: (block: ProjectContentBlock) => void;
}) {
  if (block.type === "text" || block.type === "highlights") return null;
  const single = block.type === "image" || block.type === "video";
  const hasLayout = block.type !== "media_text";
  return (
    <div className={styles.grid}>
      {hasLayout && (
        <label className={styles.field}>
          <span>פריסת מדיה בעמוד הפרויקט</span>
          <select
            value={block.layout ?? (single ? "full" : "equal")}
            onChange={(e) =>
              onChange({
                ...block,
                layout: e.target.value as SingleMediaLayout & MultiMediaLayout,
              })
            }
          >
            {single ? (
              <>
                <option value="full">רוחב מלא</option>
                <option value="center">מרכז — שני שלישים</option>
                <option value="start">תחילת שורה — חצי רוחב</option>
                <option value="end">סוף שורה — חצי רוחב</option>
              </>
            ) : (
              <>
                <option value="equal">זוגות שווים</option>
                <option value="staggered">זוגות מדורגים — 60/40</option>
              </>
            )}
          </select>
        </label>
      )}
      <label className={styles.field}>
        <span>רווח לפני המדיה</span>
        <select
          value={block.spacing ?? "regular"}
          onChange={(e) =>
            onChange({ ...block, spacing: e.target.value as MediaSpacing })
          }
        >
          <option value="regular">רגיל</option>
          <option value="generous">מרווח</option>
          <option value="extra">מרווח במיוחד</option>
        </select>
      </label>
    </div>
  );
}
export function ContentEditor({
  blocks,
  update,
  ...props
}: MediaProps & {
  blocks: ProjectContentBlock[];
  /** Functional update, so uploads that finish later never drop edits. */
  update: (
    change: (blocks: ProjectContentBlock[]) => ProjectContentBlock[],
  ) => void;
}) {
  const [choice, setChoice] = useState<string>("text");
  function set(id: string | undefined, block: ProjectContentBlock) {
    update((list) => list.map((item) => (item.id === id ? block : item)));
  }
  const imageProps = {
    projectId: props.projectId,
    onBusy: props.onBusy,
    onUploaded: props.onUploaded,
    media: props.media.filter((m) => m.kind === "image" && m.role !== "logo"),
  };
  return (
    <div>
      <SortableList
        items={blocks}
        type="block"
        itemKey={(block, index) => block.id ?? `block-${index}`}
        label={(_, index) => `בלוק ${index + 1}`}
        onMove={(from, to) =>
          update((list) => {
            const next = [...list];
            next.splice(to, 0, next.splice(from, 1)[0]);
            return next;
          })
        }
        render={(block, index, handle) => (
          <section
            className={styles.block}
            data-hidden={block.hidden ? "" : undefined}
            aria-label={`${blockLabels[block.type]} ${index + 1}`}
          >
            <header className={styles.blockHeader}>
              <strong>
                {blockLabels[block.type]}
                {"eyebrow" in block && block.eyebrow
                  ? ` · ${block.eyebrow}`
                  : ""}
                {block.hidden ? " · מוסתר" : ""}
              </strong>
              <div className={styles.actions}>
                {handle}
                <Button
                  size="sm"
                  variant="ghost"
                  aria-pressed={!!block.hidden}
                  onClick={() =>
                    set(block.id, { ...block, hidden: !block.hidden })
                  }
                >
                  {block.hidden ? "הצגה" : "הסתרה"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    update((list) => {
                      const next = [...list];
                      next.splice(index + 1, 0, {
                        ...structuredClone(block),
                        id: newId(),
                      });
                      return next;
                    })
                  }
                >
                  שכפול
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (
                      window.confirm(
                        "להסיר את הבלוק? השינוי יישמר רק בשמירת הפרויקט.",
                      )
                    )
                      update((list) => list.filter((b) => b.id !== block.id));
                  }}
                >
                  הסרת בלוק
                </Button>
              </div>
            </header>
            {block.type === "text" && (
              <>
                <TextFields
                  block={block}
                  onChange={(next) => set(block.id, next)}
                />
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={block.collapsible ?? false}
                    onChange={(e) =>
                      set(block.id, { ...block, collapsible: e.target.checked })
                    }
                  />
                  הצגה כשאלה נפתחת ברשימת הפרויקטים
                </label>
                <Subsections
                  items={block.subsections ?? []}
                  onChange={(subsections) =>
                    set(block.id, {
                      ...block,
                      subsections: subsections.length ? subsections : undefined,
                    })
                  }
                />
              </>
            )}
            {block.type === "image" && (
              <EditableImage
                {...imageProps}
                image={block}
                onChange={(image) => set(block.id, { ...block, ...image })}
              />
            )}
            {block.type === "video" && (
              <>
                <MediaUpload
                  projectId={props.projectId}
                  onBusy={props.onBusy}
                  onUploaded={props.onUploaded}
                  choices={props.media.filter((m) => m.kind === "video")}
                  label="קובץ סרטון"
                  kind="video"
                  value={block.src || null}
                  onChange={(src) =>
                    set(block.id, { ...block, src: src ?? "" })
                  }
                />
                <MediaUpload
                  {...imageProps}
                  choices={imageProps.media}
                  label="תמונת פוסטר"
                  value={block.poster || null}
                  onChange={(poster) =>
                    set(block.id, { ...block, poster: poster ?? "" })
                  }
                />
                <div className={styles.actions}>
                  {(["autoplay", "loop", "muted", "controls"] as const).map(
                    (flag) => (
                      <label className={styles.check} key={flag}>
                        <input
                          type="checkbox"
                          checked={block[flag] ?? false}
                          disabled={flag === "muted" && !!block.autoplay}
                          onChange={(e) =>
                            set(block.id, {
                              ...block,
                              [flag]: e.target.checked,
                              ...(flag === "autoplay" && e.target.checked
                                ? { muted: true }
                                : {}),
                            })
                          }
                        />
                        {
                          {
                            autoplay: "הפעלה אוטומטית",
                            loop: "לולאה",
                            muted: "השתקה",
                            controls: "פקדי ניגון",
                          }[flag]
                        }
                      </label>
                    ),
                  )}
                </div>
              </>
            )}
            {(block.type === "two_images" ||
              block.type === "three_images" ||
              block.type === "gallery") && (
              <>
                <div className={styles.grid}>
                  {block.images.map((image, imageIndex) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: Image slots are positional; the same file may appear twice.
                    <div key={imageIndex}>
                      <EditableImage
                        {...imageProps}
                        label={`תמונה ${imageIndex + 1}`}
                        image={image}
                        onChange={(nextImage) => {
                          const images = block.images.map((item, i) =>
                            i === imageIndex ? nextImage : item,
                          );
                          set(block.id, {
                            ...block,
                            images,
                          } as ProjectContentBlock);
                        }}
                      />
                      {block.type === "gallery" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            set(block.id, {
                              ...block,
                              images: block.images.filter(
                                (_, i) => i !== imageIndex,
                              ),
                            })
                          }
                        >
                          הסרת תמונה מהגלריה
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {block.type === "gallery" && (
                  <div className={styles.actions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        set(block.id, {
                          ...block,
                          images: [...block.images, { src: "" }],
                        })
                      }
                    >
                      הוספת תמונה לגלריה
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const present = new Set(block.images.map((i) => i.src));
                        set(block.id, {
                          ...block,
                          images: [
                            ...block.images.filter((i) => i.src),
                            ...imageProps.media
                              .filter((m) => !present.has(m.src))
                              .map((m) => ({ src: m.src })),
                          ],
                        });
                      }}
                    >
                      הוספת כל תמונות הגלריה
                    </Button>
                  </div>
                )}
              </>
            )}
            {block.type === "media_text" && (
              <>
                <EditableImage
                  {...imageProps}
                  media={props.media.filter((m) => m.role !== "logo")}
                  kind="any"
                  label="תמונה או סרטון"
                  image={block}
                  onChange={(image) => set(block.id, { ...block, ...image })}
                />
                <TextFields
                  block={block}
                  onChange={(next) => set(block.id, next)}
                />
                <label className={styles.field}>
                  <span>מיקום המדיה</span>
                  <select
                    value={block.side ?? "start"}
                    onChange={(e) =>
                      set(block.id, {
                        ...block,
                        side: e.target.value as "start" | "end",
                      })
                    }
                  >
                    <option value="start">
                      בתחילת השורה (ימין בעברית, שמאל באנגלית)
                    </option>
                    <option value="end">
                      בסוף השורה (שמאל בעברית, ימין באנגלית)
                    </option>
                  </select>
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={block.feature ?? false}
                    onChange={(e) =>
                      set(block.id, { ...block, feature: e.target.checked })
                    }
                  />
                  הדגשה כפיצ׳ר
                </label>
              </>
            )}
            <Presentation
              block={block}
              onChange={(next) => set(block.id, next)}
            />
            {block.type === "highlights" && (
              <>
                <LocalizedField
                  label="כותרת בלוק"
                  value={block.title}
                  valueEn={block.title_en}
                  onChange={(title) => set(block.id, { ...block, title })}
                  onChangeEn={(title_en) =>
                    set(block.id, { ...block, title_en })
                  }
                />
                <p className={styles.hint}>
                  מציג כאן את ההיילייטס שהוגדרו למעלה בלשונית הזו.
                </p>
              </>
            )}
          </section>
        )}
      />
      <div className={styles.inline}>
        <label>
          <span className="sr-only">סוג בלוק</span>
          <select
            aria-label="סוג בלוק"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
          >
            <optgroup label="סקשנים מוכנים">
              {Object.entries(presetLabels).map(([value, label]) => (
                <option key={value} value={`preset:${value}`}>
                  {label}
                </option>
              ))}
            </optgroup>
            <optgroup label="בלוקים">
              {Object.entries(blockLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <Button
          variant="outline"
          onClick={() => {
            const block = choice.startsWith("preset:")
              ? presetBlock(choice.slice(7) as Preset, props.media)
              : newBlock(choice as BlockType);
            update((list) => [...list, block]);
          }}
        >
          הוספת בלוק
        </Button>
      </div>
    </div>
  );
}
