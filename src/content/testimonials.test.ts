import assert from "node:assert/strict";
import { test } from "node:test";
import { en } from "../i18n/dictionaries/en.ts";
import { he } from "../i18n/dictionaries/he.ts";
import { testimonialImageAlt } from "./testimonials.ts";

const expected = {
  he: {
    elementor: "לוגו אלמנטור",
    "asher-morgenstern": "אשר מורגנשטיין",
    "elbi-ben-shimol": "לוגו אלבי בן שימול",
    "rona-even": "לוגו אמא חוזרת לג׳ינס",
    "tal-lev": "טל לב",
    "shay-goren": "שי גורן",
  },
  en: {
    elementor: "Elementor logo",
    "asher-morgenstern": "Asher Morgenstern",
    "elbi-ben-shimol": "Elbi Ben Shimol logo",
    "rona-even": "Mom Back in Jeans logo",
    "tal-lev": "Tal Lev",
    "shay-goren": "Shay Goren",
  },
} as const;

test("testimonial images use the person's name or the brand on the logo", () => {
  for (const [locale, dictionary] of [
    ["he", he],
    ["en", en],
  ] as const) {
    const want: Record<string, string> = expected[locale];
    assert.deepEqual(
      dictionary.testimonials.items.map((item) => item.id).sort(),
      Object.keys(want).sort(),
    );
    for (const item of dictionary.testimonials.items) {
      const alt = testimonialImageAlt(item, dictionary.testimonials.logoAlt);
      assert.equal(alt, want[item.id]);
      assert.equal(alt.includes("{brand}"), false);
      if (item.image.kind === "portrait") assert.equal(alt, item.name);
      if (item.image.brand) {
        assert.ok(
          item.role.includes(item.image.brand) ||
            item.name.includes(item.image.brand),
          `${item.id} brand is not in the testimonial`,
        );
      }
    }
  }
});
