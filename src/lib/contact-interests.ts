/** What a visitor can say they are interested in on the contact form. The
 * server accepts only these ids; `label` (Hebrew) is what Mor reads in the
 * email, whichever site the visitor used. `labelEn` is the English form's
 * checkbox text. */
export const CONTACT_INTERESTS = [
  {
    id: "web-app",
    label: "מערכת או אפליקציית Web",
    labelEn: "Web app or system",
  },
  { id: "website", label: "בניית אתר", labelEn: "Website" },
  { id: "ai-tool", label: "כלי AI", labelEn: "AI tool" },
  { id: "ux-ui", label: "עיצוב UX/UI", labelEn: "UX/UI design" },
  {
    id: "specification",
    label: "אפיון פרויקט",
    labelEn: "Product specification",
  },
  // For visitors who are not sure what they need, or want it checked first.
  // Not the /digital-audit questionnaire.
  {
    id: "diagnosis",
    label: "עזרה באבחון הצורך",
    labelEn: "Help working out what I need",
  },
] as const;

export type ContactInterest = (typeof CONTACT_INTERESTS)[number]["id"];
