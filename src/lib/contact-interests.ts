/** What a visitor can say they are interested in on the contact form. The
 * server accepts only these ids; the labels are what Mor reads in the email. */
export const CONTACT_INTERESTS = [
  { id: "web-app", label: "מערכת או אפליקציית Web" },
  { id: "website", label: "בניית אתר" },
  { id: "ai-tool", label: "כלי AI" },
  { id: "ux-ui", label: "עיצוב UX/UI" },
  { id: "specification", label: "אפיון פרויקט" },
  // For visitors who are not sure what they need, or want it checked first.
  { id: "diagnosis", label: "עזרה באבחון הצורך" },
] as const;

export type ContactInterest = (typeof CONTACT_INTERESTS)[number]["id"];
