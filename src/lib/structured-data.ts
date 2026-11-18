import { type EnabledLocale, localeConfig } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { he } from "@/i18n/dictionaries/he";
import { localized } from "@/lib/cms/localize";
import { projectSnippetInput } from "@/lib/project-snippet";
import { projectSearchDescription } from "@/lib/seo";
import { ogImagePath, SITE_URL } from "@/lib/site";
import type { Project } from "@/types/project";

// Schema.org graph for search engines, adapted from the previous site so the
// studio keeps the same entity ids.
export const organizationId = `${SITE_URL}/#organization`;
export const personId = `${SITE_URL}/#person`;
export const websiteId = `${SITE_URL}/#website`;

type NamedOffer = { name: string; description: string };

/**
 * Per-locale wording the graph needs but the dictionary does not hold as a
 * field. Which offers and topics appear is decided from the Hebrew dictionary
 * (the source copy), so English lists the same entities. The English names
 * are the phrases used in en.ts; structured-data.test.ts checks they still
 * appear there.
 */
const graphCopy = {
  he: {
    organizationAlternateName: "מוריז סטודיו",
    personAlternateName: "מור זאבי",
    locality: "תל אביב",
    fullService: "אפיון, עיצוב ופיתוח",
    creationOffers: [
      "אפליקציות Web",
      "מערכות מותאמות אישית",
      "פתרונות AI לעסק",
      "כלים אינטראקטיביים",
    ],
    learningSystems: "מערכות למידה",
    frontEnd: "פיתוח Front-End",
    degree: "תואר",
  },
  en: {
    organizationAlternateName: "מוריז סטודיו",
    personAlternateName: "מור זאבי",
    locality: "Tel Aviv",
    fullService: "UX, design and development",
    creationOffers: [
      "web apps",
      "custom systems",
      "AI solutions for business",
      "interactive tools",
    ],
    learningSystems: "learning systems",
    frontEnd: "Front-End development",
    degree: "degree",
  },
} satisfies Record<
  EnabledLocale,
  {
    organizationAlternateName: string;
    personAlternateName: string;
    locality: string;
    fullService: string;
    creationOffers: string[];
    learningSystems: string;
    frontEnd: string;
    degree: string;
  }
>;

/** The offer for this Hebrew creation-sentence name, in `locale`. */
function creationOfferName(hebrewName: string, locale: EnabledLocale) {
  const index = graphCopy.he.creationOffers.indexOf(hebrewName);
  return graphCopy[locale].creationOffers[index] ?? hebrewName;
}

function addOffer(offers: NamedOffer[], name: string, description: string) {
  const label = name.trim();
  const text = description.trim();
  if (!label || !text || offers.some((offer) => offer.name === label)) return;
  offers.push({ name: label, description: text });
}

/**
 * The FAQ item at the position of the Hebrew question containing `phrase`.
 * Both dictionaries keep the FAQ in the same order.
 */
function faqLike(content: SiteContent, phrase: string) {
  const index = he.faq.questions.findIndex((item) =>
    item.question.includes(phrase),
  );
  return index < 0 ? undefined : content.faq.questions[index];
}

/**
 * The about sentence that lists what the studio creates. Located in the
 * Hebrew copy ("אני יוצרת …"), then read from the same segment of `content`
 * up to its first full stop.
 */
function creationSentence(content: SiteContent) {
  const marker = "אני יוצרת ";
  for (const [p, paragraph] of he.about.paragraphs.entries()) {
    for (const [i, segment] of paragraph.entries()) {
      if (!segment.text.includes(marker)) continue;
      const text = content.about.paragraphs[p]?.[i]?.text ?? "";
      // Hebrew: from the marker. Other locales: the whole translated segment.
      const start = text.includes(marker)
        ? text.indexOf(marker)
        : text.search(/\S/);
      if (start < 0) return "";
      const end = text.indexOf(".", start);
      return text.slice(start, end >= 0 ? end + 1 : undefined).trim();
    }
  }
  return "";
}

/** Services named on the site, each described with copy that already exists. */
export function offerServices(
  content: SiteContent,
  locale: EnabledLocale = "he",
): NamedOffer[] {
  const copy = graphCopy[locale];
  const offers: NamedOffer[] = [];
  const offered = faqLike(content, graphCopy.he.fullService);
  if (offered) addOffer(offers, copy.fullService, offered.answer.join("\n\n"));

  const themeCopy = [
    content.advantages.research.description,
    content.advantages.experience.description,
    content.advantages.development.description,
  ];
  content.advantages.themes.forEach((theme, index) => {
    addOffer(offers, theme, themeCopy[index] ?? "");
  });

  const hebrewCreation = creationSentence(he);
  const creation = creationSentence(content);
  const ai = faqLike(content, "AI");
  for (const name of graphCopy.he.creationOffers) {
    if (!hebrewCreation.includes(name)) continue;
    addOffer(
      offers,
      creationOfferName(name, locale),
      name === "פתרונות AI לעסק" && ai ? ai.answer.join("\n\n") : creation,
    );
  }
  if (he.projects.archive.description.includes(graphCopy.he.learningSystems))
    addOffer(
      offers,
      copy.learningSystems,
      content.projects.archive.description,
    );
  return offers;
}

function personDetails(content: SiteContent, locale: EnabledLocale) {
  const copy = graphCopy[locale];
  const degree = content.about.credentials.find((item) => item.value === "B.A");
  const [field, school] = (degree?.label ?? "")
    .split("|")
    .map((part) => part.trim());
  const hebrewAbout = he.about.paragraphs
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
  if (
    he.about.credentials.some((item) =>
      item.label.includes(graphCopy.he.frontEnd),
    )
  )
    topics.add(copy.frontEnd);
  for (const term of content.advantages.research.terms) topics.add(term);
  for (const offer of offerServices(content, locale)) topics.add(offer.name);
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
            ...(hebrewAbout.includes(graphCopy.he.degree)
              ? { credentialCategory: copy.degree }
              : {}),
          },
        }
      : {}),
    ...(topics.size ? { knowsAbout: [...topics] } : {}),
  };
}

export function homeStructuredData(
  content: SiteContent,
  locale: EnabledLocale,
) {
  const url = `${SITE_URL}/${locale}`;
  const sameAs = content.footer.socials.map((social) => social.href);
  const services = offerServices(content, locale);
  const copy = graphCopy[locale];
  const inLanguage = localeConfig[locale].languageTag;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": organizationId,
        name: content.studioName,
        alternateName: copy.organizationAlternateName,
        url,
        image: `${SITE_URL}${ogImagePath[locale]}`,
        description: content.metadata.description,
        founder: { "@id": personId },
        address: {
          "@type": "PostalAddress",
          addressLocality: copy.locality,
          addressCountry: "IL",
        },
        // Hebrew site: Israel. English site: clients anywhere (owner, 2026-11-18).
        areaServed:
          locale === "en"
            ? { "@type": "Place", name: "Worldwide" }
            : { "@type": "Country", name: "Israel" },
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
      },
      {
        "@type": "Person",
        "@id": personId,
        name: "Mor Zeevi",
        alternateName: copy.personAlternateName,
        url,
        image: `${SITE_URL}/images/mor-avatar.png`,
        sameAs,
        worksFor: { "@id": organizationId },
        ...personDetails(content, locale),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url,
        name: content.studioName,
        inLanguage,
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
        inLanguage: localeConfig[locale].languageTag,
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
