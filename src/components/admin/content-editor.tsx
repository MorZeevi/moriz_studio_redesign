"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  ProjectContentBlock,
  ProjectImage,
  MediaSpacing,
  SingleMediaLayout,
  MultiMediaLayout,
} from "@/types/project";
import { MediaUpload } from "./media-upload";
import styles from "./admin.module.css";

const labels: Record<ProjectContentBlock["type"], string> = {
  text: "טקסט",
  image: "תמונה",
  video: "סרטון",
  two_images: "שתי תמונות",
  gallery: "גלריה",
};
function newBlock(type: ProjectContentBlock["type"]): ProjectContentBlock {
  switch (type) {
    case "text":
      return { type, text: "", title: "" };
    case "image":
      return { type, src: "", alt: "", caption: "" };
    case "video":
      return {
        type,
        src: "",
        poster: "",
        autoplay: false,
        loop: false,
        muted: true,
        controls: true,
      };
    case "two_images":
      return { type, images: [{ src: "" }, { src: "" }] };
    case "gallery":
      return { type, images: [] };
  }
}
type MediaProps = { projectId: string; onBusy: (busy: boolean) => void };
function EditableImage({
  image,
  onChange,
  ...props
}: MediaProps & {
  image: ProjectImage;
  onChange: (image: ProjectImage) => void;
}) {
  return (
    <div>
      <MediaUpload
        {...props}
        label="קובץ תמונה"
        value={image.src}
        onChange={(src) => onChange({ ...image, src: src ?? "" })}
      />
      <label className={styles.field}>
        <span>טקסט חלופי לתמונה</span>
        <input
          dir="auto"
          value={image.alt ?? ""}
          onChange={(e) => onChange({ ...image, alt: e.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span>כיתוב תמונה</span>
        <input
          dir="auto"
          value={image.caption ?? ""}
          onChange={(e) => onChange({ ...image, caption: e.target.value })}
        />
      </label>
    </div>
  );
}
export function ContentEditor({
  blocks,
  onChange,
  ...props
}: MediaProps & {
  blocks: ProjectContentBlock[];
  onChange: (blocks: ProjectContentBlock[]) => void;
}) {
  const [keys, setKeys] = useState(() => blocks.map(() => crypto.randomUUID()));
  const [type, setType] = useState<ProjectContentBlock["type"]>("text");
  const [imageKeys, setImageKeys] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      blocks.map((block, index) => [
        keys[index],
        block.type === "gallery" || block.type === "two_images"
          ? block.images.map(() => crypto.randomUUID())
          : [],
      ]),
    ),
  );
  function update(index: number, block: ProjectContentBlock) {
    onChange(blocks.map((item, i) => (i === index ? block : item)));
  }
  function move(from: number, to: number) {
    if (
      from === to ||
      from < 0 ||
      from >= blocks.length ||
      to < 0 ||
      to >= blocks.length
    )
      return;
    const next = [...blocks];
    const ids = [...keys];
    next.splice(to, 0, next.splice(from, 1)[0]);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setKeys(ids);
    onChange(next);
  }
  return (
    <div>
      {blocks.map((block, index) => (
        <section
          key={keys[index]}
          className={styles.block}
          aria-label={`${labels[block.type]} ${index + 1}`}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-moriz-block"))
              e.preventDefault();
          }}
          onDrop={(e) => {
            const value = e.dataTransfer.getData("application/x-moriz-block");
            if (!value) return;
            e.preventDefault();
            move(Number(value), index);
          }}
        >
          <header className={styles.blockHeader}>
            <Button
              className={styles.handle}
              variant="ghost"
              size="sm"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/x-moriz-block",
                  String(index),
                );
                e.dataTransfer.effectAllowed = "move";
              }}
              title="גררו כדי לשנות סדר"
            >
              <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                aria-hidden="true"
                fill="currentColor"
              >
                {[5, 10, 15].map((y) => (
                  <g key={y}>
                    <circle cx="5" cy={y} r="1.2" />
                    <circle cx="11" cy={y} r="1.2" />
                  </g>
                ))}
              </svg>
              <strong>{labels[block.type]}</strong>
            </Button>
            <div className={styles.actions}>
              <Button
                size="sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                aria-label={`הזזת בלוק ${index + 1} למעלה`}
              >
                למעלה
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={index === blocks.length - 1}
                onClick={() => move(index, index + 1)}
                aria-label={`הזזת בלוק ${index + 1} למטה`}
              >
                למטה
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (
                    window.confirm(
                      "להסיר את הבלוק? השינוי יישמר רק בשמירת הפרויקט.",
                    )
                  ) {
                    setKeys((ids) => ids.filter((_, i) => i !== index));
                    onChange(blocks.filter((_, i) => i !== index));
                  }
                }}
              >
                הסרת בלוק
              </Button>
            </div>
          </header>
          {block.type === "text" && (
            <>
              <label className={styles.field}>
                <span>כותרת בלוק</span>
                <input
                  dir="auto"
                  value={block.title ?? ""}
                  onChange={(e) =>
                    update(index, { ...block, title: e.target.value })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>טקסט</span>
                <textarea
                  dir="auto"
                  value={block.text}
                  onChange={(e) =>
                    update(index, { ...block, text: e.target.value })
                  }
                />
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={block.collapsible ?? false}
                  onChange={(e) =>
                    update(index, { ...block, collapsible: e.target.checked })
                  }
                />
                הצגה כשאלה נפתחת ברשימת הפרויקטים
              </label>
            </>
          )}
          {block.type === "image" && (
            <EditableImage
              {...props}
              image={block}
              onChange={(image) => update(index, { ...block, ...image })}
            />
          )}
          {block.type === "video" && (
            <>
              <MediaUpload
                {...props}
                label="קובץ סרטון"
                kind="video"
                value={block.src}
                onChange={(src) => update(index, { ...block, src: src ?? "" })}
              />
              <MediaUpload
                {...props}
                label="תמונת פוסטר"
                value={block.poster ?? null}
                onChange={(poster) =>
                  update(index, { ...block, poster: poster ?? "" })
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
                          update(index, {
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
          {(block.type === "two_images" || block.type === "gallery") && (
            <>
              <div className={styles.grid}>
                {block.images.map((image, imageIndex) => (
                  <div key={imageKeys[keys[index]]?.[imageIndex]}>
                    <EditableImage
                      {...props}
                      image={image}
                      onChange={(nextImage) => {
                        const images = block.images.map((item, i) =>
                          i === imageIndex ? nextImage : item,
                        );
                        update(
                          index,
                          block.type === "two_images"
                            ? {
                                ...block,
                                images: images as [ProjectImage, ProjectImage],
                              }
                            : { ...block, images },
                        );
                      }}
                    />
                    {block.type === "gallery" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImageKeys((current) => ({
                            ...current,
                            [keys[index]]: current[keys[index]].filter(
                              (_, i) => i !== imageIndex,
                            ),
                          }));
                          update(index, {
                            ...block,
                            images: block.images.filter(
                              (_, i) => i !== imageIndex,
                            ),
                          });
                        }}
                      >
                        הסרת תמונה מהגלריה
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {block.type === "gallery" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImageKeys((current) => ({
                      ...current,
                      [keys[index]]: [
                        ...(current[keys[index]] ?? []),
                        crypto.randomUUID(),
                      ],
                    }));
                    update(index, {
                      ...block,
                      images: [...block.images, { src: "" }],
                    });
                  }}
                >
                  הוספת תמונה לגלריה
                </Button>
              )}
            </>
          )}
          {block.type !== "text" && (
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>פריסת מדיה בעמוד הפרויקט</span>
                <select
                  value={
                    block.layout ??
                    (block.type === "image" || block.type === "video"
                      ? "full"
                      : "equal")
                  }
                  onChange={(e) =>
                    update(
                      index,
                      block.type === "image" || block.type === "video"
                        ? {
                            ...block,
                            layout: e.target.value as SingleMediaLayout,
                          }
                        : {
                            ...block,
                            layout: e.target.value as MultiMediaLayout,
                          },
                    )
                  }
                >
                  {block.type === "image" || block.type === "video" ? (
                    <>
                      <option value="full">רוחב מלא</option>
                      <option value="center">מרכז — שני שלישים</option>
                      <option value="start">תחילת שורה — חצי רוחב</option>
                      <option value="end">סוף שורה — חצי רוחב</option>
                    </>
                  ) : (
                    <>
                      <option value="equal">זוג שווה</option>
                      <option value="staggered">זוג מדורג — 60/40</option>
                    </>
                  )}
                </select>
              </label>
              <label className={styles.field}>
                <span>רווח לפני המדיה</span>
                <select
                  value={block.spacing ?? "regular"}
                  onChange={(e) =>
                    update(index, {
                      ...block,
                      spacing: e.target.value as MediaSpacing,
                    })
                  }
                >
                  <option value="regular">רגיל</option>
                  <option value="generous">מרווח</option>
                  <option value="extra">מרווח במיוחד</option>
                </select>
              </label>
            </div>
          )}
        </section>
      ))}
      <div className={styles.inline}>
        <label>
          <span className="sr-only">סוג בלוק</span>
          <select
            aria-label="סוג בלוק"
            value={type}
            onChange={(e) =>
              setType(e.target.value as ProjectContentBlock["type"])
            }
          >
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="outline"
          onClick={() => {
            const id = crypto.randomUUID();
            const block = newBlock(type);
            setKeys((ids) => [...ids, id]);
            setImageKeys((current) => ({
              ...current,
              [id]:
                block.type === "two_images"
                  ? block.images.map(() => crypto.randomUUID())
                  : [],
            }));
            onChange([...blocks, block]);
          }}
        >
          הוספת בלוק
        </Button>
      </div>
    </div>
  );
}
