import type { ServiceDocument } from "@/content/services";
import { paragraphsText } from "@/content/services";
import type { EnabledLocale } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";
import { organizationId, websiteId } from "@/lib/structured-data";

const israel = { "@type": "Country" as const, name: "Israel" };

function serviceNode({
  url,
  name,
  description,
  serviceType,
}: {
  url: string;
  name: string;
  description: string;
  serviceType: string;
}) {
  return {
    "@type": "Service" as const,
    "@id": `${url}#service`,
    name,
    description,
    serviceType,
    url,
    inLanguage: "he-IL" as const,
    provider: { "@id": organizationId },
    areaServed: israel,
    isPartOf: { "@id": websiteId },
  };
}

/**
 * Service, FAQPage and BreadcrumbList for one service URL.
 * FAQ text is the visible answer paragraphs joined with a blank line.
 */
export function serviceStructuredData({
  locale,
  studioName,
  servicesLabel,
  page,
  catalog = [],
}: {
  locale: EnabledLocale;
  studioName: string;
  servicesLabel: string;
  page: ServiceDocument;
  catalog?: ServiceDocument[];
}) {
  const home = `${SITE_URL}/${locale}`;
  const hub = `${home}/services`;
  const url = `${home}${page.path}`;
  const crumbs = page.slug
    ? [
        { name: studioName, item: home },
        { name: servicesLabel, item: hub },
        { name: page.heading, item: url },
      ]
    : [
        { name: studioName, item: home },
        { name: page.heading, item: url },
      ];
  const graph = [
    serviceNode({
      url,
      name: page.heading,
      description: paragraphsText(page.answer),
      serviceType: page.keyword,
    }),
    ...catalog.map((service) =>
      serviceNode({
        url: `${home}${service.path}`,
        name: service.heading,
        description: paragraphsText(service.answer),
        serviceType: service.keyword,
      }),
    ),
    {
      "@type": "FAQPage" as const,
      "@id": `${url}#faq`,
      mainEntity: page.faq.map((item) => ({
        "@type": "Question" as const,
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer" as const,
          text: item.answer.join("\n\n"),
        },
      })),
    },
    {
      "@type": "BreadcrumbList" as const,
      "@id": `${url}#breadcrumb`,
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem" as const,
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    },
  ];
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  } as Record<string, unknown>;
}
