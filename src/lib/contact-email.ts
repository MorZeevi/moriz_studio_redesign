import nodemailer from "nodemailer";
import { CONTACT_INTERESTS, type ContactInterest } from "./contact-interests.ts";

export const CONTACT_RECIPIENT = "morzavi1@gmail.com";
export const CONTACT_MAX_BODY_LENGTH = 10000;

export type ContactSubmission = {
  name: string;
  phone: string;
  message: string;
  preferWhatsApp: boolean;
  website: string;
  interests: ContactInterest[];
  source?: ContactSource;
};

/** Where the visitor came from, as their own browser recorded it. Shown to
 * Mor in the email as plain text; never trusted for anything else. */
export type ContactSource = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPath?: string;
  page?: string;
};

const SOURCE_FIELDS = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "referrer",
  "landingPath",
  "page",
] as const;

// Optional and best-effort: anything malformed is dropped, not rejected, so a
// bad source never costs a real enquiry.
function parseContactSource(value: unknown): ContactSource | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const fields = value as Record<string, unknown>;
  const source: ContactSource = {};
  for (const key of SOURCE_FIELDS) {
    const raw = fields[key];
    if (typeof raw !== "string") continue;
    // biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are removed so a value stays on its own line.
    const text = raw.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    if (text) source[key] = text.slice(0, 300);
  }
  return Object.keys(source).length ? source : undefined;
}

export function parseContactSubmission(
  value: unknown,
): ContactSubmission | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const fields = value as Record<string, unknown>;
  if (
    typeof fields.name !== "string" ||
    typeof fields.phone !== "string" ||
    typeof fields.message !== "string" ||
    typeof fields.preferWhatsApp !== "boolean" ||
    typeof fields.website !== "string"
  )
    return null;

  const name = fields.name.trim().replace(/\s+/g, " ");
  const phone = fields.phone.trim();
  const message = fields.message.trim();
  const website = fields.website.trim();
  if (
    !name ||
    name.length > 120 ||
    phone.length > 40 ||
    !/^\d{9,15}$/.test(phone.replace(/[\s\-+().]/g, "")) ||
    message.length > 2000 ||
    website.length > 200
  )
    return null;

  // Optional; unknown ids are dropped so only the form's own choices remain.
  const chosen = Array.isArray(fields.interests) ? fields.interests : [];
  const interests = CONTACT_INTERESTS.map((interest) => interest.id).filter(
    (id) => chosen.includes(id),
  );
  const source = parseContactSource(fields.source);
  return {
    name,
    phone,
    message,
    preferWhatsApp: fields.preferWhatsApp,
    website,
    interests,
    ...(source && { source }),
  };
}

function sourceLines(source: ContactSource | undefined) {
  if (!source) return ["מקור: לא ידוע"];
  const campaign = [source.utmSource, source.utmMedium, source.utmCampaign]
    .filter(Boolean)
    .join(" / ");
  return [
    `מקור: ${campaign || (source.referrer ? "הפניה מאתר אחר" : "כניסה ישירה")}`,
    source.referrer && `הגיעו מ: ${source.referrer}`,
    source.landingPath && `עמוד כניסה: ${source.landingPath}`,
    source.page && `נשלח מעמוד: ${source.page}`,
  ].filter((line): line is string => !!line);
}

export function buildContactEmail(submission: ContactSubmission) {
  return {
    from: CONTACT_RECIPIENT,
    to: CONTACT_RECIPIENT,
    subject: "פנייה חדשה מאתר moriz.studio",
    text: [
      "פנייה חדשה מאתר moriz.studio",
      `שם: ${submission.name}`,
      `טלפון: ${submission.phone}`,
      `עדיפות לוואטסאפ: ${submission.preferWhatsApp ? "כן" : "לא"}`,
      `מתעניינים ב: ${
        CONTACT_INTERESTS.filter((interest) =>
          submission.interests.includes(interest.id),
        )
          .map((interest) => interest.label)
          .join(", ") || "(לא נבחר)"
      }`,
      "",
      "הודעה:",
      submission.message || "(לא נכתבה הודעה)",
      "",
      ...sourceLines(submission.source),
    ].join("\n"),
  };
}

type SendMail = (
  appPassword: string,
  email: ReturnType<typeof buildContactEmail>,
) => Promise<{ accepted: Array<string> }>;

const sendViaGmail: SendMail = async (appPassword, email) => {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: CONTACT_RECIPIENT, pass: appPassword },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  try {
    const result = await transport.sendMail(email);
    return { accepted: result.accepted.map(String) };
  } finally {
    transport.close();
  }
};

/** The Gmail account sends to its own inbox; visitors cannot select the
 * recipient, sender or subject. */
export async function sendContactEmail(
  submission: ContactSubmission,
  appPassword: string,
  send: SendMail = sendViaGmail,
): Promise<boolean> {
  const result = await send(appPassword, buildContactEmail(submission));
  return result.accepted.some(
    (address) => address.toLowerCase() === CONTACT_RECIPIENT,
  );
}
