// The single WhatsApp destination for the site. To change it, set
// NEXT_PUBLIC_WHATSAPP_NUMBER (international digits, no +), or edit the fallback here.
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "972522937174";

export const WHATSAPP_URL = /^[1-9]\d{7,14}$/.test(WHATSAPP_NUMBER)
  ? `https://wa.me/${WHATSAPP_NUMBER}`
  : null;
