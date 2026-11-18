import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { he } from "./dictionaries/he";

// Labels used by the project surfaces (cards, archive, case study) and the
// CMS preview. Both languages reuse their site dictionary's project labels.
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
const { items: _enItems, ...enLabels } = en.projects;
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
    ...enLabels,
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
    contactLink: en.navigation.contactLink.label,
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
