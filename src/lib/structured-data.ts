import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { localized } from "@/lib/cms/localize";
import { projectSnippetInput } from "@/lib/project-snippet";
import { projectSearchDescription } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Project } from "@/types/project";

// Schema.org graph for search engines, adapted from the previous site so the
// studio keeps the same entity ids.
export const organizationId = `${SITE_URL}/#organization`;
export const personId = `${SITE_URL}/#person`;
export const websiteId = `${SITE_URL}/#website`;

type NamedOffer = { name: string; description: string };

function addOffer(offers: NamedOffer[], name: string, description: string) {
  const label = name.trim();
  const text = description.trim();
  if (!label || !text || offers.some((offer) => offer.name === label)) return;
  offers.push({ name: label, description: text });
}

/** Services named on the site, each described with copy that already exists. */
export function offerServices(content: SiteContent): NamedOffer[] {
  const offers: NamedOffer[] = [];
  const phrase = "אפיון, עיצוב ופיתוח";
  const offered = content.faq.questions.find((item) =>
    item.question.includes(phrase),
  );
  if (offered) addOffer(offers, phrase, offered.answer.join("\n\n"));

  const themeCopy = [
    content.advantages.research.description,
    content.advantages.experience.description,
    content.advantages.development.description,
  ];
  content.advantages.themes.forEach((theme, index) => {
    addOffer(offers, theme, themeCopy[index] ?? "");
  });

  const about = content.about.paragraphs
    .flat()
    .map((segment) => segment.text)
    .join("");
  const marker = "אני יוצרת ";
  const start = about.indexOf(marker);
  const end = start >= 0 ? about.indexOf(".", start) : -1;
  const creation =
    start >= 0 ? about.slice(start, end >= 0 ? end + 1 : undefined).trim() : "";
  const ai = content.faq.questions.find((item) => item.question.includes("AI"));
  for (const name of [
    "אפליקציות Web",
    "מערכות מותאמות אישית",
    "פתרונות AI לעסק",
    "כלים אינטראקטיביים",
  ]) {
    if (!creation.includes(name)) continue;
    addOffer(
      offers,
      name,
      name === "פתרונות AI לעסק" && ai ? ai.answer.join("\n\n") : creation,
    );
  }
  if (content.projects.archive.description.includes("מערכות למידה"))
    addOffer(offers, "מערכות למידה", content.projects.archive.description);
  return offers;
}

function personDetails(content: SiteContent) {
  const degree = content.about.credentials.find((item) => item.value === "B.A");
  const [field, school] = (degree?.label ?? "")
    .split("|")
    .map((part) => part.trim());
  const aboutText = content.about.paragraphs
    .flat()
    .map((segment) => segment.text)
    .join("");
  const jobTitle = content.hero.portraitAlt.split("—")[1]?.trim();
  const topics = new Set<string>();
  if (field) topics.add(field);
  for (const part of (degree?.detail ?? "").split("·")) {
    const topic = part.trim();
    if (topic) topics.add(topic);
  }
  const frontEnd = "פיתוח Front-End";
  if (content.about.credentials.some((item) => item.label.includes(frontEnd)))
    topics.add(frontEnd);
  for (const term of content.advantages.research.terms) topics.add(term);
  for (const offer of offerServices(content)) topics.add(offer.name);
  return {
    ...(jobTitle ? { jobTitle } : {}),
    ...(school
      ? {
          alumniOf: {
            "@type": "EducationalOrganization" as const,
            name: school,
          },
        }
      : {}),
    ...(degree && field
      ? {
          hasCredential: {
            "@type": "EducationalOccupationalCredential" as const,
            name: degree.label,
            educationalLevel: degree.value,
            ...(aboutText.includes("תואר")
              ? { credentialCategory: "תואר" }
              : {}),
          },
        }
      : {}),
    ...(topics.size ? { knowsAbout: [...topics] } : {}),
  };
}

function reviews(content: SiteContent) {
  return content.testimonials.items.flatMap((item) => {
    const quote = item.body
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    if (!quote.length) return [];
    return [
      {
        "@type": "Review" as const,
        author: {
          "@type": "Person" as const,
          name: item.name,
          ...(item.role ? { jobTitle: item.role } : {}),
        },
        reviewBody: quote.join("\n\n"),
        itemReviewed: { "@id": organizationId },
      },
    ];
  });
}

export function homeStructuredData(
  content: SiteContent,
  locale: EnabledLocale,
) {
  const url = `${SITE_URL}/${locale}`;
  const sameAs = content.footer.socials.map((social) => social.href);
  const services = offerServices(content);
  const clientReviews = reviews(content);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": organizationId,
        name: content.studioName,
        alternateName: "מוריז סטודיו",
        url,
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
        ...(services.length
          ? {
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: content.projects.caseStudy.services,
                itemListElement: services.map((service) => ({
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: service.name,
                    description: service.description,
                    provider: { "@id": organizationId },
                  },
                })),
              },
            }
          : {}),
        ...(clientReviews.length ? { review: clientReviews } : {}),
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
        ...personDetails(content),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url,
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

export function projectsIndexStructuredData({
  content,
  locale,
  projects,
}: {
  content: SiteContent;
  locale: EnabledLocale;
  projects: Project[];
}) {
  const url = `${SITE_URL}/${locale}/projects`;
  const itemListElement = projects.map((project, index) => {
    const name = localized(project, "title", locale);
    const description = projectSearchDescription(
      projectSnippetInput(project, locale),
    );
    return {
      "@type": "ListItem" as const,
      position: index + 1,
      name,
      ...(project.slug
        ? { url: `${url}/${encodeURIComponent(project.slug)}` }
        : {}),
      ...(description ? { description } : {}),
    };
  });
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#projects`,
    name: content.projects.archive.heading,
    numberOfItems: itemListElement.length,
    itemListElement,
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
