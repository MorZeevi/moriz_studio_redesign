import type { ProjectContentBlock, ProjectImage } from "@/types/project";
import styles from "./projects.module.css";

function ContentImage({ image }: { image: ProjectImage }) {
  if (!image.src) return null;
  return (
    <figure className={styles.contentFigure}>
      {/* biome-ignore lint/performance/noImgElement: Private media must bypass optimization and its shared cache. */}
      <img
        src={image.src}
        alt={image.alt ?? ""}
        loading="lazy"
        className={styles.blockImage}
      />
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}
function TextContent({
  block,
  group,
}: {
  block: Extract<ProjectContentBlock, { type: "text" }>;
  group: string;
}) {
  if (block.collapsible && block.title)
    return (
      <details name={group} className={styles.detail}>
        <summary className={styles.question}>{block.title}</summary>
        <p className={styles.answer}>{block.text}</p>
      </details>
    );
  return (
    <section className={styles.contentText}>
      {block.title && <h2>{block.title}</h2>}
      <p>{block.text}</p>
    </section>
  );
}
function VideoContent({
  block,
}: {
  block: Extract<ProjectContentBlock, { type: "video" }>;
}) {
  if (!block.src) return null;
  return (
    <video
      className={styles.blockVideo}
      src={block.src}
      poster={block.poster || undefined}
      autoPlay={block.autoplay ?? false}
      loop={block.loop ?? false}
      muted={block.autoplay || block.muted || false}
      controls={block.controls ?? true}
      playsInline
      preload="metadata"
      aria-label="סרטון הפרויקט"
    />
  );
}
export function ProjectContent({
  blocks,
  group,
}: {
  blocks: ProjectContentBlock[];
  group: string;
}) {
  return (
    <div className={styles.contentBlocks}>
      {blocks.map((block, index) => {
        const key = `${group}-${index}`;
        switch (block.type) {
          case "text":
            return <TextContent key={key} block={block} group={group} />;
          case "image":
            return <ContentImage key={key} image={block} />;
          case "video":
            return <VideoContent key={key} block={block} />;
          case "two_images":
          case "gallery":
            return (
              <div
                key={key}
                className={
                  block.type === "two_images"
                    ? styles.imagePair
                    : styles.gallery
                }
              >
                {block.images.map((image, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Stateless public figures render the saved JSON array in its exact order.
                  <ContentImage key={`${key}-${i}`} image={image} />
                ))}
              </div>
            );
        }
        return null;
      })}
    </div>
  );
}
