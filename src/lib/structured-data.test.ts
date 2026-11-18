import assert from "node:assert/strict";
import { test } from "node:test";
import { he } from "../i18n/dictionaries/he.ts";
import { homeStructuredData, offerServices } from "./structured-data.ts";

const data = homeStructuredData(he, "he");
const json = JSON.stringify(data);
const parsed = JSON.parse(json) as typeof data;
const blob = JSON.stringify(he);

function graphNode(type: string) {
  const graph = parsed["@graph"] as Array<Record<string, unknown>>;
  const node = graph.find((item) => {
    const kind = item["@type"];
    return kind === type || (Array.isArray(kind) && kind.includes(type));
  });
  assert.ok(node, type);
  return node;
}

test("homepage JSON-LD is well-formed and keeps the existing entities", () => {
  assert.equal(parsed["@context"], "https://schema.org");
  assert.equal(JSON.parse(json).constructor, Object);
  const types = (parsed["@graph"] as Array<Record<string, unknown>>).map(
    (item) => item["@type"],
  );
  assert.deepEqual(types, [
    ["Organization", "ProfessionalService"],
    "Person",
    "WebSite",
    "FAQPage",
  ]);
  const organization = graphNode("Organization");
  assert.equal(
    (organization.contactPoint as { email: string }).email,
    "morzavi1@gmail.com",
  );
  assert.equal(json.includes("aggregateRating"), false);
  assert.equal(json.includes("reviewRating"), false);
  assert.equal("review" in organization, false);
  assert.equal(json.includes('"@type":"Review"'), false);
});

test("each service is copied from the site and has no price", () => {
  const offers = offerServices(he);
  assert.ok(offers.length >= 4);
  for (const offer of offers) {
    assert.equal(blob.includes(offer.name), true, offer.name);
    assert.equal(blob.includes(offer.description), true, offer.description);
  }
  const catalog = graphNode("Organization").hasOfferCatalog as {
    itemListElement: Array<{ itemOffered: { "@type": string; name: string } }>;
  };
  assert.equal(catalog.itemListElement.length, offers.length);
  assert.equal(
    catalog.itemListElement.every(
      (item) => item.itemOffered["@type"] === "Service",
    ),
    true,
  );
  assert.equal(JSON.stringify(catalog).includes("price"), false);
});

test("person credentials come from the about section", () => {
  const person = graphNode("Person");
  assert.equal(person.jobTitle, "בעלת הסטודיו");
  assert.deepEqual(person.alumniOf, {
    "@type": "EducationalOrganization",
    name: "H.I.T",
  });
  assert.deepEqual(person.hasCredential, {
    "@type": "EducationalOccupationalCredential",
    name: "בטכנולוגיות למידה | H.I.T",
    educationalLevel: "B.A",
    credentialCategory: "תואר",
  });
  const topics = person.knowsAbout as string[];
  for (const topic of ["UI/UX", "פיתוח Front-End", "גיימיפיקציה של מוצרים"]) {
    assert.equal(topics.includes(topic), true, topic);
    assert.equal(blob.includes(topic), true, topic);
  }
});

test("English JSON-LD lists the same offers in English and its own language", async () => {
  const { en } = await import("../i18n/dictionaries/en.ts");
  const english = homeStructuredData(en, "en");
  const englishBlob = JSON.stringify(en);
  const offers = offerServices(en, "en");
  assert.equal(offers.length, offerServices(he).length);
  for (const offer of offers) {
    assert.equal(
      englishBlob.toLowerCase().includes(offer.name.toLowerCase()),
      true,
      offer.name,
    );
    assert.equal(englishBlob.includes(offer.description), true, offer.name);
  }
  const graph = english["@graph"] as Array<Record<string, unknown>>;
  const website = graph.find((item) => item["@type"] === "WebSite");
  assert.equal(website?.inLanguage, "en");
  assert.equal(
    (graph[0]?.address as { addressLocality: string } | undefined)
      ?.addressLocality,
    "Tel Aviv",
  );
  assert.equal(graph[0]?.url, "https://moriz.studio/en");
  assert.deepEqual(graph[0]?.areaServed, {
    "@type": "Place",
    name: "Worldwide",
  });
  // The Hebrew graph keeps Hebrew values.
  const hebrew = data["@graph"] as Array<Record<string, unknown>>;
  assert.deepEqual(hebrew[0]?.areaServed, {
    "@type": "Country",
    name: "Israel",
  });
  assert.equal(
    hebrew.find((item) => item["@type"] === "WebSite")?.inLanguage,
    "he-IL",
  );
});
