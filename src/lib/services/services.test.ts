import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getService,
  ownerReviewList,
  paragraphsText,
  publicServicePages,
  serviceLlmsPages,
  serviceSitemapEntries,
  services,
  servicesChrome,
  servicesChromeFor,
  servicesContent,
  servicesFor,
  servicesHubDocument,
  servicesHubFor,
} from "@/content/services.ts";
import { isEnabledLocale } from "@/i18n/config.ts";
import { he } from "@/i18n/dictionaries/he.ts";
import { getPublishedArticles } from "@/lib/articles/load.ts";
import { renderLlmsTxt } from "@/lib/llms.ts";
import { META_DESCRIPTION_MAX, publicSitemapEntries } from "@/lib/seo.ts";
import {
  serviceDocumentTitle,
  serviceMetadata,
} from "@/lib/services/metadata.ts";
import { serviceStructuredData } from "@/lib/services/structured-data.ts";
import { organizationId } from "@/lib/structured-data.ts";

const pages = publicServicePages();
const published = new Map(
  getPublishedArticles().map((article) => [article.slug, article]),
);
const knownProjects = new Set([
  "guesto",
  "chabad-club",
  "practicalai",
  "awscience",
  "hatchly",
  "וורדעל",
]);

test("each service page has a short keyword-led title and description", () => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const page of pages) {
    const title = serviceDocumentTitle(page.title, he.studioName);
    assert.equal(titles.has(title), false, title);
    assert.equal(descriptions.has(page.description), false, page.description);
    titles.add(title);
    descriptions.add(page.description);
    assert.ok(title.length <= 60, `${title} (${title.length})`);
    assert.ok(page.title.startsWith(page.keyword), page.title);
    assert.ok(page.heading.includes(page.keyword), page.heading);
    assert.ok(page.description.startsWith(page.keyword), page.description);
    assert.ok(page.description.length >= 80, page.description);
    assert.ok(
      page.description.length <= META_DESCRIPTION_MAX,
      `${page.description} (${page.description.length})`,
    );
    assert.equal(page.answer.length >= 2 && page.answer.length <= 3, true);
    assert.ok(page.faq.length >= 5 && page.faq.length <= 7, page.path);
    assert.equal(
      new Set(page.faq.map((item) => item.question)).size,
      page.faq.length,
    );
    assert.ok(page.articleSlugs.length >= 3 && page.articleSlugs.length <= 5);
    assert.ok(page.projectSlugs.length >= 2);
    const ids = page.sections.map((section) => section.id);
    assert.equal(new Set(ids).size, ids.length, page.path);
  }
});

test("service links point at published articles and real projects", () => {
  const slugs = services.map((service) => service.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const page of pages) {
    assert.match(page.path, /^\/services(?:\/[a-z0-9-]+)?$/);
    for (const slug of page.articleSlugs) {
      const article = published.get(slug);
      assert.ok(article, slug);
      assert.equal(article.draft, false, slug);
    }
    for (const slug of page.projectSlugs) {
      assert.equal(knownProjects.has(slug), true, slug);
    }
    for (const slug of page.relatedSlugs) {
      assert.equal(slugs.includes(slug), true, slug);
    }
  }
  assert.equal(servicesChrome.label, "שירותים");
});

test("new first-person lines are on a page, and prices are not", () => {
  const blob = JSON.stringify(pages);
  for (const claim of ownerReviewList) {
    assert.equal(blob.includes(claim), true, claim);
  }
  assert.equal(blob.includes("איפיון"), false);
  assert.equal(blob.includes("₪"), false);
  assert.equal(blob.includes("ש״ח"), false);
  assert.equal(blob.includes('ש"ח'), false);
  assert.equal(blob.includes("/digital-audit"), true);
});

test("JSON-LD matches the visible FAQ and reuses the studio entity", () => {
  for (const page of pages) {
    const data = serviceStructuredData({
      locale: "he",
      studioName: he.studioName,
      servicesLabel: servicesChrome.label,
      page,
      catalog: page.showCatalog ? [...services] : [],
    });
    const parsed = JSON.parse(JSON.stringify(data)) as {
      "@context": string;
      "@graph": Array<Record<string, unknown>>;
    };
    assert.equal(parsed["@context"], "https://schema.org");
    const types = parsed["@graph"].map((node) => node["@type"]);
    assert.equal(types.includes("Service"), true);
    assert.equal(types.includes("FAQPage"), true);
    assert.equal(types.includes("BreadcrumbList"), true);
    assert.equal(
      types.filter((type) => type === "Service").length,
      page.showCatalog ? services.length + 1 : 1,
    );
    const service = parsed["@graph"].find(
      (node) => node["@type"] === "Service",
    );
    assert.ok(service);
    assert.equal(service.name, page.heading);
    assert.equal(service.description, paragraphsText(page.answer));
    assert.equal(service.serviceType, page.keyword);
    assert.equal(
      (service.provider as { "@id": string })["@id"],
      organizationId,
    );
    assert.deepEqual(service.areaServed, {
      "@type": "Country",
      name: "Israel",
    });
    assert.equal(service.url, `https://moriz.studio/he${page.path}`);
    const faq = parsed["@graph"].find((node) => node["@type"] === "FAQPage");
    assert.ok(faq);
    const questions = faq.mainEntity as Array<{
      name: string;
      acceptedAnswer: { text: string };
    }>;
    assert.deepEqual(
      questions.map((item) => item.name),
      page.faq.map((item) => item.question),
    );
    assert.deepEqual(
      questions.map((item) => item.acceptedAnswer.text),
      page.faq.map((item) => item.answer.join("\n\n")),
    );
    const crumbs = parsed["@graph"].find(
      (node) => node["@type"] === "BreadcrumbList",
    );
    assert.ok(crumbs);
    const items = crumbs.itemListElement as Array<{
      name: string;
      item: string;
    }>;
    if (page.slug) {
      assert.deepEqual(
        items.map((item) => item.name),
        [he.studioName, servicesChrome.label, page.heading],
      );
    } else {
      assert.deepEqual(
        items.map((item) => item.name),
        [he.studioName, page.heading],
      );
    }
    assert.equal(items[0]?.item, "https://moriz.studio/he");
    const json = JSON.stringify(data);
    assert.equal(json.includes("price"), false);
    assert.equal(json.includes("aggregateRating"), false);
    assert.equal(json.includes("₪"), false);
  }
});

test("sitemap and llms.txt list the Hebrew service URLs", () => {
  const entries = publicSitemapEntries({
    siteUrl: "https://moriz.studio",
    locale: "he",
    projects: [],
    articles: [],
    services: serviceSitemapEntries(),
  });
  const urls = entries.map((entry) => entry.url);
  for (const entry of entries) {
    if (!entry.url.includes("/services")) continue;
    assert.ok(entry.lastModified instanceof Date, entry.url);
  }
  assert.deepEqual(
    urls.filter((url) => url.includes("/services")),
    [
      "https://moriz.studio/he/services",
      "https://moriz.studio/he/services/business-websites",
      "https://moriz.studio/he/services/mvp",
      "https://moriz.studio/he/services/ai-agents",
      "https://moriz.studio/he/services/ux-design",
      "https://moriz.studio/he/services/elearning",
    ],
  );
  const text = renderLlmsTxt({
    content: he,
    siteUrl: "https://moriz.studio",
    locale: "he",
    whatsappUrl: null,
    projects: [],
    articles: [],
    services: serviceLlmsPages(),
  });
  assert.match(text, /## שירותים/);
  for (const page of serviceLlmsPages()) {
    assert.equal(
      text.includes(`https://moriz.studio/he${page.path}`),
      true,
      page.path,
    );
  }
  assert.equal(text.includes("/digital-audit"), false);
  assert.equal(text.includes("₪"), false);
  assert.equal(text.includes("איפיון"), false);
  assert.equal(text.includes("כמה עולה אתר"), false);
});

// English. Same structure as the Hebrew, no articles and no diagnostic.

const enPages = publicServicePages("en");
const enServices = servicesFor("en");

test("Hebrew accessors default to Hebrew and keep the old exports", () => {
  assert.equal(servicesHubFor(), servicesHubDocument);
  assert.equal(servicesHubFor("he"), servicesHubDocument);
  assert.equal(servicesFor(), services);
  assert.equal(servicesChromeFor(), servicesChrome);
  assert.deepEqual(publicServicePages(), pages);
  assert.equal(getService("mvp"), getService("mvp", "he"));
  assert.notEqual(getService("mvp", "en"), getService("mvp", "he"));
  assert.equal(getService("missing", "en"), null);
});

test("English service pages mirror the Hebrew structure", () => {
  assert.equal(enPages.length, pages.length);
  pages.forEach((he, index) => {
    const en = enPages[index];
    assert.ok(en);
    assert.equal(en.slug, he.slug);
    assert.equal(en.path, he.path);
    assert.equal(en.showCatalog, he.showCatalog);
    assert.deepEqual(en.projectSlugs, he.projectSlugs);
    assert.deepEqual(en.relatedSlugs, he.relatedSlugs);
    assert.equal(en.answer.length, he.answer.length, he.path);
    assert.equal(en.faq.length, he.faq.length, he.path);
    assert.deepEqual(
      en.sections.map((section) => [section.type, section.id]),
      he.sections.map((section) => [section.type, section.id]),
    );
    en.sections.forEach((section, i) => {
      const other = he.sections[i];
      if (section.type === "steps" && other?.type === "steps") {
        assert.equal(section.steps.length, other.steps.length, section.id);
      }
      if (section.type === "split" && other?.type === "split") {
        assert.equal(section.columns.length, other.columns.length);
      }
    });
  });
  for (const slug of services.map((service) => service.slug)) {
    assert.ok(slug && getService(slug, "en"), String(slug));
  }
});

test("each English service page has a short keyword-led title and description", () => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const page of enPages) {
    const title = serviceDocumentTitle(page.title, he.studioName);
    assert.equal(titles.has(title), false, title);
    assert.equal(descriptions.has(page.description), false, page.description);
    titles.add(title);
    descriptions.add(page.description);
    assert.ok(title.length <= 60, `${title} (${title.length})`);
    assert.ok(page.title.startsWith(page.keyword), page.title);
    assert.ok(page.heading.includes(page.keyword), page.heading);
    assert.ok(page.description.startsWith(page.keyword), page.description);
    assert.ok(page.description.length >= 80, page.description);
    assert.ok(
      page.description.length <= META_DESCRIPTION_MAX,
      `${page.description} (${page.description.length})`,
    );
    assert.equal(
      new Set(page.faq.map((item) => item.question)).size,
      page.faq.length,
    );
  }
});

test("English service pages have no Hebrew, articles, diagnostic or prices", () => {
  const { ownerReviewClaims, chrome } = servicesContent("en");
  // Project slugs are ids (one is Hebrew) and are not rendered as text.
  const blob = JSON.stringify([
    chrome,
    ...enPages.map(({ projectSlugs: _ids, ...page }) => page),
  ]);
  assert.doesNotMatch(blob, /[\u0590-\u05FF]/u);
  assert.equal(blob.includes("/articles"), false);
  assert.equal(blob.includes("/digital-audit"), false);
  assert.equal(blob.includes("₪"), false);
  assert.equal(blob.includes("$"), false);
  for (const page of enPages) {
    assert.equal(page.articleSlugs.length, 0, page.path);
  }
  for (const claim of Object.values(ownerReviewClaims)) {
    assert.equal(blob.includes(claim), true, claim);
  }
  assert.deepEqual(
    Object.keys(ownerReviewClaims).sort(),
    Object.keys(servicesContent("he").ownerReviewClaims).sort(),
  );
  assert.equal(chrome.label, "Services");
});

test("English facts match the Hebrew", () => {
  const blob = JSON.stringify(enPages);
  assert.match(blob, /5-10 minute/);
  assert.match(blob, /valid for 14 business days/);
  assert.match(blob, /3-month warranty/);
  assert.match(blob, /Tel Aviv/);
  assert.match(blob, /Storyline or Articulate/);
  assert.match(blob, /H\.I\.T/);
});

test("English JSON-LD is English and points at /en", () => {
  for (const page of enPages) {
    const data = serviceStructuredData({
      // `en` may not be an enabled locale yet; the builder only reads it.
      locale: "en" as never,
      studioName: he.studioName,
      servicesLabel: servicesChromeFor("en").label,
      page,
      catalog: page.showCatalog ? [...enServices] : [],
    });
    const graph = (data as { "@graph": Array<Record<string, unknown>> })[
      "@graph"
    ];
    const nodes = graph.filter((node) => node["@type"] === "Service");
    assert.equal(nodes.length, page.showCatalog ? enServices.length + 1 : 1);
    for (const node of nodes) {
      assert.equal(node.inLanguage, "en");
      assert.match(String(node.url), /^https:\/\/moriz\.studio\/en\/services/);
    }
    assert.equal(nodes[0]?.name, page.heading);
    const json = JSON.stringify(data);
    assert.equal(json.includes("/articles"), false);
    assert.doesNotMatch(json, /[\u0590-\u05FF]/u);
  }
  const heData = serviceStructuredData({
    locale: "he",
    studioName: "Moriz Studio",
    servicesLabel: servicesChrome.label,
    page: servicesHubDocument,
  });
  const heNode = (heData as { "@graph": Array<Record<string, unknown>> })[
    "@graph"
  ][0];
  assert.equal(heNode?.inLanguage, "he-IL");
});

test("service metadata has hreflang per enabled locale and x-default Hebrew", () => {
  const meta = serviceMetadata("he", servicesHubDocument, he.studioName);
  const alternates = meta.alternates as {
    canonical: string;
    languages: Record<string, string>;
  };
  assert.equal(alternates.canonical, "/he/services");
  assert.equal(alternates.languages.he, "/he/services");
  assert.equal(alternates.languages["x-default"], "/he/services");
  assert.equal(
    (meta.openGraph as { locale?: string } | undefined)?.locale,
    "he_IL",
  );
  if (isEnabledLocale("en")) {
    assert.equal(alternates.languages.en, "/en/services");
    const page = getService("mvp", "en");
    assert.ok(page);
    const en = serviceMetadata("en", page, he.studioName);
    const enAlternates = en.alternates as typeof alternates;
    assert.equal(enAlternates.canonical, "/en/services/mvp");
    assert.equal(enAlternates.languages.he, "/he/services/mvp");
    assert.equal(enAlternates.languages["x-default"], "/he/services/mvp");
    assert.equal(
      (en.openGraph as { locale?: string } | undefined)?.locale,
      "en_US",
    );
    assert.equal(en.description, page.description);
  }
});
