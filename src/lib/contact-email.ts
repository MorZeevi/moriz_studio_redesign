import nodemailer from "nodemailer";

export const CONTACT_RECIPIENT = "morzavi1@gmail.com";
export const CONTACT_MAX_BODY_LENGTH = 10000;

export type ContactSubmission = {
  name: string;
  phone: string;
  message: string;
  preferWhatsApp: boolean;
  website: string;
};

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

  return {
    name,
    phone,
    message,
    preferWhatsApp: fields.preferWhatsApp,
    website,
  };
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
      "",
      "הודעה:",
      submission.message || "(לא נכתבה הודעה)",
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
