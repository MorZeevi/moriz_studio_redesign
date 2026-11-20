import type { EnabledLocale } from "@/i18n/config";

type ConversionCopy = {
  action: string;
  mobileAction: string;
  /** The hero's main action, opened in WhatsApp. */
  heroAction: string;
  /**
   * The line above the hero headline; `value` is set in the action colour.
   * `detail` shows from tablet width up; phones keep the short line.
   */
  proof: { before: string; value: string; label: string; detail: string };
  /** Invitations to talk placed along the homepage. */
  invitations: { afterProjects: string; afterProcess: string };
  projectNote: string;
  projectHeading: string;
  projectBody: string;
  projectFormLink: string;
  /** Opening messages typed into WhatsApp for the visitor. */
  whatsappMessage: string;
  projectWhatsappMessage: (title: string) => string;
};

// The English lines are drafts for the owner to review.
export const conversionCopyByLocale = {
  he: {
    action: "בואו נדבר בוואטסאפ",
    mobileAction: "שנדבר בוואטסאפ?",
    heroAction: "בואו נדבר על הפרויקט שלכם",
    proof: {
      before: "מעל",
      value: "400k+",
      label: "משתמשים",
      detail: "במוצרים שעבדתי עליהם",
    },
    invitations: {
      afterProjects: "יש לכם מערכת או מוצר בראש?",
      afterProcess: "מתחילים בשיחה של 10 דקות, בלי התחייבות.",
    },
    projectNote: "שיחה ראשונה של 10 דקות, בלי התחייבות.",
    projectHeading: "רוצים לבנות משהו דומה?",
    projectBody: "ספרו לי בקצרה על הפרויקט שלכם, ונחשוב יחד על הצעד הבא.",
    projectFormLink: "או השאירו פרטים",
    whatsappMessage: "היי מור, הגעתי מהאתר ואשמח לדבר על פרויקט",
    projectWhatsappMessage: (title: string) =>
      `היי מור, ראיתי את הפרויקט ${title} באתר ואשמח לדבר על משהו דומה`,
  },
  en: {
    action: "Let's talk on WhatsApp",
    mobileAction: "Chat on WhatsApp?",
    heroAction: "Let's talk about your project",
    proof: {
      before: "Over",
      value: "400k+",
      label: "users",
      detail: "of products I've worked on",
    },
    invitations: {
      afterProjects: "Have a system or product in mind?",
      afterProcess: "We start with a 10-minute call, no commitment.",
    },
    projectNote: "A first 10-minute call, no commitment.",
    projectHeading: "Want to build something similar?",
    projectBody:
      "Tell me briefly about your project, and we'll work out the next step together.",
    projectFormLink: "Or leave your details",
    whatsappMessage:
      "Hi Mor, I found you through your website and would love to talk about a project",
    projectWhatsappMessage: (title: string) =>
      `Hi Mor, I saw the ${title} project on your website and would love to talk about something similar`,
  },
} satisfies Record<EnabledLocale, ConversionCopy>;

export function conversionCopyFor(locale: EnabledLocale): ConversionCopy {
  return conversionCopyByLocale[locale];
}

/** Hebrew copy, kept for callers that have no locale. */
export const conversionCopy: ConversionCopy = conversionCopyByLocale.he;
