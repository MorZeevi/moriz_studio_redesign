import type { Locale } from "@/i18n/config";
import { projectCopy } from "@/i18n/project-copy";
import { localized } from "@/lib/cms/localize";
import { isVideoSrc } from "@/lib/cms/validation";
import type {
  Highlight,
  ProjectContentBlock,
  ProjectImage,
  ProjectMediaItem,
} from "@/types/project";
import styles from "./projects.module.css";

type Context = {
  locale: Locale;
  /** Gallery metadata (alt, caption, size, poster) looked up by src. */
  media: Map<string, ProjectMediaItem>;
};
export function ContentImage({
  image,
  context,
  layout,
}: {
  image: ProjectImage;
  context: Context;
  layout?: string;
}) {
  if (!image.src) return null;
  const item = context.media.get(image.src);
  const alt =
    localized(image, "alt", context.locale) ||
    (item ? localized(item, "alt", context.locale) : "");
  const caption =
    localized(image, "caption", context.locale) ||
    (item ? localized(item, "caption", context.locale) : "");
  return (
    <figure className={styles.contentFigure} data-layout={layout}>
      {isVideoSrc(image.src) ? (
        <video
          className={styles.blockVideo}
          src={image.src}
          poster={item?.poster}
          width={item?.width}
          height={item?.height}
          controls
          muted
          playsInline
          preload={item?.poster ? "none" : "metadata"}
          aria-label={alt || projectCopy[context.locale].video}
        />
      ) : (
        // biome-ignore lint/performance/noImgElement: Private media must bypass optimization and its shared cache.
        <img
          src={image.src}
          alt={alt}
          width={item?.width}
          height={item?.height}
          loading="lazy"
          decoding="async"
          className={styles.blockImage}
        />
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
export function Highlights({
  highlights,
  locale,
}: {
  highlights: Highlight[];
  locale: Locale;
}) {
  const items = highlights.filter((h) => h.value.trim() && h.label.trim());
  if (!items.length) return null;
  return (
    <dl className={styles.highlights}>
      {items.map((h) => (
        <div key={h.id}>
          <dt>{localized(h, "label", locale)}</dt>
          <dd className={styles.highlightValue}>
            <bdi>{h.value}</bdi>
          </dd>
          {localized(h, "description", locale) && (
            <dd className={styles.highlightDescription}>
              {localized(h, "description", locale)}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
function TextContent({
  block,
  group,
  locale,
}: {
  block: Extract<ProjectContentBlock, { type: "text" }>;
  group: string;
  locale: Locale;
}) {
  const title = localized(block, "title", locale);
  const text = localized(block, "text", locale);
  const eyebrow = localized(block, "eyebrow", locale);
  if (block.collapsible && title)
    return (
      <details name={group} className={styles.detail}>
        <summary className={styles.question}>{title}</summary>
        <p className={styles.answer}>{text}</p>
      </details>
    );
  return (
    <section className={styles.contentText}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      {title && <h2>{title}</h2>}
      {text && <p>{text}</p>}
      {!!block.subsections?.length && (
        <div className={styles.subsections}>
          {block.subsections.map((sub, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Stateless public content renders the saved array in order.
            <div key={i}>
              {localized(sub, "title", locale) && (
                <h3>{localized(sub, "title", locale)}</h3>
              )}
              <p>{localized(sub, "text", locale)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
function VideoContent({
  block,
  context,
}: {
  block: Extract<ProjectContentBlock, { type: "video" }>;
  context: Context;
}) {
  if (!block.src) return null;
  const item = context.media.get(block.src);
  return (
    <video
      className={styles.blockVideo}
      src={block.src}
      poster={block.poster || item?.poster || undefined}
      width={item?.width}
      height={item?.height}
      autoPlay={block.autoplay ?? false}
      loop={block.loop ?? false}
      muted={block.autoplay || block.muted || false}
      controls={block.controls ?? true}
      playsInline
      preload="metadata"
      aria-label={
        (item && localized(item, "alt", context.locale)) ||
        projectCopy[context.locale].video
      }
    />
  );
}
export function ProjectContent({
  blocks,
  group,
  locale = "he",
  media = [],
  highlights = [],
}: {
  blocks: ProjectContentBlock[];
  group: string;
  locale?: Locale;
  media?: ProjectMediaItem[];
  highlights?: Highlight[];
}) {
  const context: Context = {
    locale,
    media: new Map(media.map((item) => [item.src, item])),
  };
  return (
    <div className={styles.contentBlocks}>
      {blocks.map((block, index) => {
        if (block.hidden) return null;
        const key = block.id ?? `${group}-${index}`;
        switch (block.type) {
          case "text":
            return (
              <TextContent
                key={key}
                block={block}
                group={group}
                locale={locale}
              />
            );
          case "image":
            return <ContentImage key={key} image={block} context={context} />;
          case "video":
            return <VideoContent key={key} block={block} context={context} />;
          case "two_images":
          case "three_images":
            return (
              <div
                key={key}
                className={
                  block.type === "two_images"
                    ? styles.imagePair
                    : styles.imageTriple
                }
              >
                {block.images.map((image, i) => (
                  <ContentImage
                    // biome-ignore lint/suspicious/noArrayIndexKey: Stateless public figures render the saved JSON array in its exact order.
                    key={`${key}-${i}`}
                    image={image}
                    context={context}
                  />
                ))}
              </div>
            );
          case "gallery":
            return (
              <div key={key} className={styles.mediaGrid}>
                {block.images.map((image, i) => (
                  <ContentImage
                    // biome-ignore lint/suspicious/noArrayIndexKey: Stateless public figures render the saved JSON array in its exact order.
                    key={`${key}-${i}`}
                    image={image}
                    context={context}
                    layout={mediaLayout(context.media.get(image.src))}
                  />
                ))}
              </div>
            );
          case "media_text": {
            const title = localized(block, "title", locale);
            const eyebrow = localized(block, "eyebrow", locale);
            return (
              <section
                key={key}
                className={styles.mediaText}
                data-side={block.side ?? "start"}
                data-feature={block.feature ? "" : undefined}
              >
                <ContentImage image={block} context={context} />
                <div>
                  {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
                  {title && <h2>{title}</h2>}
                  <p>{localized(block, "text", locale)}</p>
                </div>
              </section>
            );
          }
          case "highlights":
            return (
              <section key={key} className={styles.contentText}>
                {localized(block, "title", locale) && (
                  <h2>{localized(block, "title", locale)}</h2>
                )}
                <Highlights highlights={highlights} locale={locale} />
              </section>
            );
        }
        return null;
      })}
    </div>
  );
}
/** A gallery item's span: its chosen layout, or one inferred from its shape. */
export function mediaLayout(item: ProjectMediaItem | undefined) {
  if (item?.layout) return item.layout;
  if (item?.width && item.height && item.height > item.width * 1.1)
    return "third";
  return "half";
}
