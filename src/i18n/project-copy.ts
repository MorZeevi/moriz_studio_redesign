import type { Locale } from "./config";
import { he } from "./dictionaries/he";

// Labels used by the project surfaces (cards, archive, case study). Hebrew
// reuses the site dictionary; English exists so the CMS preview can render
// projects in English before the public /en site is enabled.
type DictionaryLabels = Omit<(typeof he)["projects"], "items">;
export type ProjectCopy = DictionaryLabels & {
  info: string;
  client: string;
  year: string;
  type: string;
  services: string;
  role: string;
  users: string;
  audience: string;
  website: string;
  visitWebsite: string;
  highlights: string;
  nextProject: string;
  contactHeading: string;
  contactLink: string;
  video: string;
  categories: string;
  filterLabel: string;
  all: string;
  empty: string;
  sections: Record<
    "challenge" | "approach" | "solution" | "design" | "final",
    string
  >;
};
const { items: _items, ...heLabels } = he.projects;
export const projectCopy: Record<Locale, ProjectCopy> = {
  he: {
    ...heLabels,
    info: "פרטי הפרויקט",
    client: "לקוח",
    year: "שנה",
    type: "סוג פרויקט",
    services: "שירותים",
    role: "התפקיד שלי",
    users: "משתמשים",
    audience: "קהל יעד",
    website: "אתר",
    visitWebsite: "מעבר לאתר",
    highlights: "עובדות על הפרויקט",
    nextProject: "הפרויקט הבא",
    contactHeading: "רוצים לבנות משהו דומה?",
    contactLink: he.navigation.contactLink.label,
    video: "סרטון הפרויקט",
    categories: "קטגוריות",
    filterLabel: "סינון פרויקטים לפי סוג",
    all: "הכל",
    empty: "אין פרויקטים מהסוג הזה.",
    sections: {
      challenge: "האתגר",
      approach: "הגישה",
      solution: "הפתרון",
      design: "עיצוב ופיתוח",
      final: "התוצר הסופי",
    },
  },
  en: {
    heading: "Projects",
    allHeading: "All projects",
    allLink: "View all projects",
    homeLink: "Back to home",
    visualLabel: "Screens / visual — coming soon",
    answerPlaceholder: "Answer — coming soon",
    detailsHeading: "About the project",
    projectLink: "Full case study",
    viewProject: "View project",
    comingSoon: "Coming soon",
    backLink: "Back to projects",
    archive: {
      heading: "Selected work",
      description:
        "Learning systems, web applications, interactive tools and custom products. Characterization, design and development of the studio's work.",
      layoutLabel: "Project layout",
      layouts: { standard: "Grid", compact: "Compact", editorial: "Editorial" },
      results: "Showing {count} projects",
      resultOne: "Showing one project",
      resultNone: "No projects to show",
      showAll: "Show all projects",
      cta: {
        heading: "Could the next project be yours?",
        body: "Tell me what you want to build, and we'll work out the right way to do it together.",
        link: "Let's talk",
      },
    },
    caseStudy: {
      additionalInfo: "More information",
      gallery: "Project images",
      client: "Client",
      year: "Year",
      services: "Services",
      openImage: "Enlarge image",
      viewer: "Project image viewer",
      close: "Close image",
      previous: "Previous image",
      next: "Next image",
      imageError: "The image could not be loaded.",
      openOriginal: "Open the original image",
      video: "Project video",
    },
    info: "Project information",
    client: "Client",
    year: "Year",
    type: "Project type",
    services: "Services",
    role: "My role",
    users: "Users",
    audience: "Target audience",
    website: "Website",
    visitWebsite: "Visit the live site",
    highlights: "Project highlights",
    nextProject: "Next project",
    contactHeading: "Want to build something similar?",
    contactLink: "Let's talk",
    video: "Project video",
    categories: "Categories",
    filterLabel: "Filter projects by type",
    all: "All",
    empty: "No projects of this type.",
    sections: {
      challenge: "The challenge",
      approach: "The approach",
      solution: "The solution",
      design: "Design & development",
      final: "Final experience",
    },
  },
};
