import type { EnabledLocale } from "@/i18n/config";

type ConversionCopy = {
  action: string;
  mobileAction: string;
  /** Shown above the hero heading; `value` is set in bold. */
  proof: { value: string; label: string };
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
    proof: { value: "400K+", label: "משתמשים במוצרים שלקחתי בהם חלק" },
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
    proof: { value: "400K+", label: "users of products I helped build" },
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
export const conversionCopy = conversionCopyByLocale.he;
