import { conversionCopyByLocale } from "@/content/conversion-copy";
import type { EnabledLocale } from "@/i18n/config";

// The single WhatsApp destination for the site. To change it, set
// NEXT_PUBLIC_WHATSAPP_NUMBER (international digits, no +), or edit the fallback here.
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "972522937174";

export const WHATSAPP_URL = /^[1-9]\d{7,14}$/.test(WHATSAPP_NUMBER)
  ? `https://wa.me/${WHATSAPP_NUMBER}`
  : null;

/** The WhatsApp link with an opening message already typed, so an enquiry
 * says where on the site it started. */
export function whatsappUrl(text: string) {
  return WHATSAPP_URL && `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

/** The default contact link: WhatsApp with the general opening message, in
 * the page's language. */
export function whatsappContactUrl(locale: EnabledLocale) {
  return whatsappUrl(conversionCopyByLocale[locale].whatsappMessage);
}

/** The Hebrew contact link, kept for callers that have no locale. */
export const WHATSAPP_CONTACT_URL = whatsappContactUrl("he");
