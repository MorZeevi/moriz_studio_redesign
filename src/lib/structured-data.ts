import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { SITE_URL } from "@/lib/site";

// Schema.org graph for search engines, adapted from the previous site so the
// studio keeps the same entity ids.
export const organizationId = `${SITE_URL}/#organization`;
export const personId = `${SITE_URL}/#person`;
export const websiteId = `${SITE_URL}/#website`;

export function homeStructuredData(
  content: SiteContent,
  locale: EnabledLocale,
) {
  const url = `${SITE_URL}/${locale}`;
  const sameAs = content.footer.socials.map((social) => social.href);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": organizationId,
        name: content.studioName,
        alternateName: "מוריז סטודיו",
        url: SITE_URL,
        image: `${SITE_URL}/og-image.png`,
        description: content.metadata.description,
        founder: { "@id": personId },
        address: {
          "@type": "PostalAddress",
          addressLocality: "תל אביב",
          addressCountry: "IL",
        },
        areaServed: { "@type": "Country", name: "Israel" },
        sameAs,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: content.contact.details.phoneHref.replace("tel:", ""),
          email: content.contact.details.email,
          availableLanguage: ["Hebrew", "English"],
        },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: "Mor Zeevi",
        alternateName: "מור זאבי",
        url,
        image: `${SITE_URL}/images/mor-avatar.png`,
        sameAs,
        worksFor: { "@id": organizationId },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: SITE_URL,
        name: content.studioName,
        inLanguage: "he-IL",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: content.faq.questions.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer.join("\n\n"),
          },
        })),
      },
    ],
  };
}

export function projectStructuredData({
  content,
  locale,
  slug,
  name,
  description,
  image,
}: {
  content: SiteContent;
  locale: EnabledLocale;
  slug: string;
  name: string;
  description?: string;
  image?: string | null;
}) {
  const home = `${SITE_URL}/${locale}`;
  const url = `${home}/projects/${encodeURIComponent(slug)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        url,
        name,
        ...(description ? { description } : {}),
        ...(image ? { image: new URL(image, SITE_URL).href } : {}),
        inLanguage: "he-IL",
        creator: { "@id": organizationId },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: content.studioName, item: home },
          { name: content.projects.archive.heading, item: `${home}/projects` },
          { name, item: url },
        ].map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          ...crumb,
        })),
      },
    ],
  };
}
