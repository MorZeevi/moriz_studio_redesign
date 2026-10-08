export type ProjectDetail = {
  id: string;
  question: string;
  answer: string | null;
};

export type Project = {
  slug: string;
  title: string;
  description: string | null;
  contribution: string | null;
  image: { src: string; alt: string } | null;
  details: ProjectDetail[];
};
