export type ProjectDetail = {
  id: string;
  question: string;
  answer: string | null;
};

export type Project = {
  id?: string;
  slug: string | null;
  title: string;
  description: string | null;
  image: { src: string; alt: string } | null;
  /** A video cover plays muted and looping while visible. */
  video?: { src: string; poster?: string } | null;
  hoverMedia?: {
    src: string;
    kind: "image" | "video";
    poster?: string;
    alt: string;
  } | null;
  /** One project fact picked for this card (not necessarily a result). */
  highlight?: { value: string; label: string } | null;
  type?: string | null;
  details: ProjectDetail[];
  categories?: { id: string; name: string }[];
};

/** A projects-page card: the card fields plus what the archive filters on. */
export type ArchiveProject = Project & {
  id: string;
  /** Null when the project has no case study page. */
  href: string | null;
  featured: boolean;
  year: number | null;
  categorySlugs: string[];
};
