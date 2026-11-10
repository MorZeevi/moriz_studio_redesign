/** What a visitor can say they are interested in on the contact form. The
 * server accepts only these ids; the labels are what Mor reads in the email. */
export const CONTACT_INTERESTS = [
  { id: "website", label: "בניית אתר" },
  { id: "web-app", label: "מערכת או אפליקציית Web" },
  { id: "interactive-tool", label: "כלי אינטראקטיבי" },
  { id: "ux-ui", label: "עיצוב UX/UI" },
  { id: "specification", label: "אפיון פרויקט" },
] as const;

export type ContactInterest = (typeof CONTACT_INTERESTS)[number]["id"];
