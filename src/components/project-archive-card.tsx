"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useId, useRef } from "react";
import type { ArchiveProject } from "@/content/projects";
import { CoverVideo } from "./cover-video";
import badgeStyles from "./media-badge.module.css";
import styles from "./project-archive-card.module.css";
import { LiquidBadge } from "./ui/liquid-link";
import { useMediaBadge } from "./use-media-badge";

/**
 * A projects-page card. The whole card is the link; media stays the focus.
 * Hover and keyboard focus reveal the same information layer and the
 * homepage's "view project" badge; touch screens show the information under
 * the caption instead.
 */
export function ProjectArchiveCard({
  project,
  index,
  sizes,
  eager,
  badgeLabel,
}: {
  project: ArchiveProject;
  /** Position in the current results, shown as 01, 02… */
  index: number;
  sizes: string;
  eager: boolean;
  /** The pointer badge's text, as on the homepage ("view project"). */
  badgeLabel: string;
}) {
  const id = useId();
  const cardRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const badge = useMediaBadge(cardRef, mediaRef);
  const number = String(index + 1).padStart(2, "0");
  const meta = [project.type, project.year].filter(Boolean).join(" · ");
  const hasReveal = Boolean(
    project.description || project.categories?.length || project.highlight,
  );

  const body = (
    <>
      <div className={styles.frame}>
        <div ref={mediaRef} className={styles.mediaBox}>
          {project.video ? (
            <CoverVideo
              src={project.video.src}
              poster={project.video.poster}
              label={project.image?.alt ?? project.title}
              className={styles.media}
            />
          ) : project.image ? (
            <Image
              src={project.image.src}
              alt={project.image.alt}
              fill
              sizes={sizes}
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : undefined}
              className={styles.media}
              unoptimized={project.image.src.startsWith("/media/")}
            />
          ) : (
            <div className={styles.fallback} aria-hidden="true">
              <span>{project.title}</span>
            </div>
          )}
          {project.href && (
            <span className={badgeStyles.badge} aria-hidden="true">
              <LiquidBadge variant="secondary" open={badge.active}>
                {badgeLabel}
              </LiquidBadge>
            </span>
          )}
        </div>
        {hasReveal && (
          <div id={`${id}-info`} className={styles.reveal}>
            {project.description && (
              <p className={styles.description}>{project.description}</p>
            )}
            {project.highlight?.value && (
              <p className={styles.highlight}>
                <bdi className={styles.highlightValue}>
                  {project.highlight.value}
                </bdi>{" "}
                {project.highlight.label}
              </p>
            )}
            {!!project.categories?.length && (
              <ul className={styles.services}>
                {project.categories.map((category) => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className={styles.caption}>
        <span className={styles.number} aria-hidden="true">
          {number}
        </span>
        <h3 id={`${id}-title`} className={styles.title}>
          {project.title}
        </h3>
        {meta && <p className={styles.meta}>{meta}</p>}
        {project.href && (
          <span className={styles.arrow} aria-hidden="true">
            <ArrowGlyph />
          </span>
        )}
      </div>
    </>
  );

  const shared = {
    className: styles.card,
    "data-featured": project.featured ? "" : undefined,
    "data-has-reveal": hasReveal ? "" : undefined,
    "aria-labelledby": `${id}-title`,
    "aria-describedby": hasReveal ? `${id}-info` : undefined,
  };

  return project.href ? (
    <Link
      {...shared}
      ref={cardRef as React.Ref<HTMLAnchorElement>}
      href={project.href}
      onFocus={badge.onFocus}
      onBlur={badge.onBlur}
    >
      {body}
    </Link>
  ) : (
    <article {...shared} ref={cardRef}>
      {body}
    </article>
  );
}

function ArrowGlyph() {
  return (
    <svg
      className="directional-icon"
      style={{ "--icon-size": "1.25rem" } as CSSProperties}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

/** CMS preview of the projects-page card, sized like a featured or regular slot. */
export function ProjectArchiveCardPreview({
  project,
  badgeLabel,
}: {
  project: ArchiveProject;
  badgeLabel: string;
}) {
  return (
    <div
      style={
        {
          maxInlineSize: project.featured ? "56rem" : "36rem",
          containerType: "inline-size",
          "--card-ratio": "4 / 3",
          "--card-title-size": project.featured
            ? "clamp(2.5rem, 4vw, 4.5rem)"
            : undefined,
        } as CSSProperties
      }
    >
      <ProjectArchiveCard
        project={project}
        index={0}
        sizes="(min-width: 64rem) 56rem, 94vw"
        eager
        badgeLabel={badgeLabel}
      />
    </div>
  );
}
