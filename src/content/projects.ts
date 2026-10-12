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
  contribution: string | null;
  image: { src: string; alt: string } | null;
  /** A video cover plays muted and looping while visible. */
  video?: { src: string; poster?: string } | null;
  /** One project fact picked for this card (not necessarily a result). */
  highlight?: { value: string; label: string } | null;
  type?: string | null;
  details: ProjectDetail[];
  categories?: { id: string; name: string }[];
};
