"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ArchiveProject } from "@/content/projects";
import type { ProjectCopy } from "@/i18n/project-copy";
import { ProjectArchiveCard } from "./project-archive-card";
import styles from "./projects-archive.module.css";
import { ProjectsContactCard } from "./projects-contact-card";
import { Button } from "./ui/button";
import {
  contactCardIndex,
  defaultProjectLayout,
  editorialSlots,
  type ProjectLayout,
  projectImageSizes,
  projectLayoutAttribute,
  projectLayoutStorageKey,
  projectLayouts,
  regularRatios,
} from "./projects-grid-config";

export type ArchiveCategory = { slug: string; name: string; count: number };

type Labels = Pick<
  ProjectCopy,
  "filterLabel" | "all" | "empty" | "allHeading" | "viewProject" | "comingSoon"
> &
  ProjectCopy["archive"];

// ---------- Saved layout (localStorage, mirrored on <html>) ----------

const layoutEvent = "moriz:projects-layout";
function subscribeLayout(callback: () => void) {
  window.addEventListener(layoutEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(layoutEvent, callback);
    window.removeEventListener("storage", callback);
  };
}
function readLayout(): ProjectLayout {
  try {
    const saved = localStorage.getItem(projectLayoutStorageKey);
    if (projectLayouts.includes(saved as ProjectLayout)) {
      return saved as ProjectLayout;
    }
  } catch {}
  return defaultProjectLayout;
}
function saveLayout(layout: ProjectLayout) {
  try {
    localStorage.setItem(projectLayoutStorageKey, layout);
  } catch {}
  window.dispatchEvent(new Event(layoutEvent));
}

// ---------- Reduced motion ----------

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

/** Filters, layout switch and the projects grid with its contact card. */
export function ProjectsArchive({
  projects,
  categories,
  initialCategory,
  labels,
  contactHref,
}: {
  projects: ArchiveProject[];
  categories: ArchiveCategory[];
  initialCategory: string | null;
  labels: Labels;
  contactHref: string;
}) {
  const [category, setCategory] = useState(
    categories.some((c) => c.slug === initialCategory) ? initialCategory : null,
  );
  const layout = useSyncExternalStore(
    subscribeLayout,
    readLayout,
    () => defaultProjectLayout,
  );
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const archiveRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const [settled, setSettled] = useState(false);

  const visible = category
    ? projects.filter((p) => p.categorySlugs.includes(category))
    : projects;
  const ctaAt = contactCardIndex(visible.length);
  const items: (
    | { kind: "project"; project: ArchiveProject }
    | { kind: "cta" }
  )[] = visible.map((project) => ({ kind: "project" as const, project }));
  items.splice(ctaAt, 0, { kind: "cta" });
  const slots = editorialSlots(
    items.map((item) => ({
      featured: item.kind === "project" && item.project.featured,
    })),
  );

  useEffect(() => {
    gsap.registerPlugin(Flip);
  }, []);

  // Keep <html> in step with the saved layout (the pre-paint script handles
  // the first load; this covers client navigation and later changes). Reads
  // storage, not `layout`: during hydration `layout` is still the server
  // default and would flash it for a frame.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-sync whenever the layout changes.
  useLayoutEffect(() => {
    document.documentElement.setAttribute(projectLayoutAttribute, readLayout());
  }, [layout]);

  // Animate from the captured state once the new arrangement has rendered.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after each filter or layout change.
  useLayoutEffect(() => {
    const state = flipState.current;
    const grid = gridRef.current;
    flipState.current = null;
    if (!state || !grid) return;
    // Items fly absolutely positioned; hold the grid at its new height so the
    // page below doesn't jump while they move.
    grid.style.minBlockSize = `${grid.offsetHeight}px`;
    const release = () => {
      grid.style.minBlockSize = "";
    };
    const flip = Flip.from(state, {
      targets: grid.querySelectorAll("[data-flip-id]"),
      duration: 0.7,
      ease: "expo.out",
      absolute: true,
      scale: false,
      nested: true,
      onComplete: release,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.05 },
        ),
    });
    return () => {
      flip.progress(1).kill();
      release();
    };
  }, [category, layout]);

  function capture() {
    setSettled(true);
    const grid = gridRef.current;
    const archive = archiveRef.current;
    if (!grid || !archive) return;
    // With the controls stuck, bring the start of the results back into view
    // so a shorter result list doesn't leave the reader in the footer.
    const top = archive.getBoundingClientRect().top;
    if (top < 0) {
      window.scrollTo({ top: window.scrollY + top, behavior: "instant" });
    }
    if (reducedMotion) return;
    flipState.current = Flip.getState(grid.querySelectorAll("[data-flip-id]"));
  }

  function chooseCategory(slug: string | null) {
    if (slug === category) return;
    capture();
    setCategory(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("category", slug);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url);
  }

  function chooseLayout(next: ProjectLayout) {
    if (next === layout) return;
    capture();
    saveLayout(next);
  }

  const status =
    visible.length === 0
      ? labels.resultNone
      : visible.length === 1
        ? labels.resultOne
        : labels.results.replace("{count}", String(visible.length));

  return (
    <section
      ref={archiveRef}
      id="projects"
      className={styles.archive}
      aria-labelledby="projects-archive-heading"
    >
      <h2 id="projects-archive-heading" className="sr-only">
        {labels.allHeading}
      </h2>

      <div className={styles.controls}>
        <div className={`site-container ${styles.controlsInner}`}>
          {categories.length > 0 && (
            <fieldset className={styles.filters}>
              <legend className="sr-only">{labels.filterLabel}</legend>
              <FilterPill
                label={labels.all}
                count={projects.length}
                pressed={!category}
                onClick={() => chooseCategory(null)}
              />
              {categories.map((c) => (
                <FilterPill
                  key={c.slug}
                  label={c.name}
                  count={c.count}
                  pressed={category === c.slug}
                  onClick={() => chooseCategory(c.slug)}
                />
              ))}
            </fieldset>
          )}

          <fieldset className={styles.layouts}>
            <legend className="sr-only">{labels.layoutLabel}</legend>
            {projectLayouts.map((mode) => (
              <label key={mode} className={styles.layout} data-mode={mode}>
                <input
                  type="radio"
                  name="projects-layout"
                  value={mode}
                  checked={layout === mode}
                  onChange={() => chooseLayout(mode)}
                  className={styles.layoutInput}
                />
                <LayoutIcon mode={mode} />
                <span>{labels.layouts[mode]}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {status}
      </p>

      <div className="site-container">
        {visible.length === 0 && (
          <div className={styles.empty}>
            <p>{category ? labels.empty : labels.resultNone}</p>
            {category && (
              <button
                type="button"
                className="button button--outline button--sm"
                onClick={() => chooseCategory(null)}
              >
                {labels.showAll}
              </button>
            )}
          </div>
        )}

        <ul
          ref={gridRef}
          className={styles.grid}
          data-settled={settled ? "" : undefined}
        >
          {items.map((item, index) => {
            const slot = slots[index];
            const style = {
              "--e-span": slot.span,
              "--e-ratio": slot.ratio,
              "--t-span": slot.tabletSpan,
              "--t-ratio": slot.tabletRatio,
              "--standard-ratio": regularRatios.standard,
              "--compact-ratio": regularRatios.compact,
              "--i": Math.min(index, 8),
            } as CSSProperties;
            const projectIndex = index > ctaAt ? index - 1 : index;
            return (
              <li
                key={item.kind === "cta" ? "cta" : item.project.id}
                data-flip-id={item.kind === "cta" ? "cta" : item.project.id}
                data-large={slot.large ? "" : undefined}
                data-offset={slot.offset ? "" : undefined}
                data-kind={item.kind}
                className={styles.item}
                style={style}
              >
                {item.kind === "cta" ? (
                  <ProjectsContactCard
                    heading={labels.cta.heading}
                    body={labels.cta.body}
                    link={labels.cta.link}
                    href={contactHref}
                  />
                ) : (
                  <ProjectArchiveCard
                    project={item.project}
                    index={projectIndex}
                    sizes={projectImageSizes[layout]}
                    eager={projectIndex < 2}
                    badgeLabel={labels.viewProject}
                    soonLabel={labels.comingSoon}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function FilterPill({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={pressed}
      className={styles.pill}
      onClick={onClick}
    >
      <span>{label}</span>
      <sup className={styles.count}>{count}</sup>
    </Button>
  );
}

function LayoutIcon({ mode }: { mode: ProjectLayout }) {
  const cells: Record<ProjectLayout, [number, number, number, number][]> = {
    standard: [
      [2, 2, 9, 9],
      [13, 2, 9, 9],
      [2, 13, 9, 9],
      [13, 13, 9, 9],
    ],
    compact: [
      [2, 2, 5.5, 5.5],
      [9.25, 2, 5.5, 5.5],
      [16.5, 2, 5.5, 5.5],
      [2, 9.25, 5.5, 5.5],
      [9.25, 9.25, 5.5, 5.5],
      [16.5, 9.25, 5.5, 5.5],
      [2, 16.5, 5.5, 5.5],
      [9.25, 16.5, 5.5, 5.5],
      [16.5, 16.5, 5.5, 5.5],
    ],
    editorial: [
      [2, 2, 13, 11],
      [17, 2, 5, 11],
      [2, 15, 20, 7],
    ],
  };
  return (
    <svg
      className={styles.layoutIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {cells[mode].map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="1" />
      ))}
    </svg>
  );
}
