import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ownerReviewList,
  paragraphsText,
  publicServicePages,
  serviceLlmsPages,
  serviceSitemapEntries,
  services,
  servicesChrome,
} from "@/content/services.ts";
import { he } from "@/i18n/dictionaries/he.ts";
import { getPublishedArticles } from "@/lib/articles/load.ts";
import { renderLlmsTxt } from "@/lib/llms.ts";
import { META_DESCRIPTION_MAX, publicSitemapEntries } from "@/lib/seo.ts";
import { serviceDocumentTitle } from "@/lib/services/metadata.ts";
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
