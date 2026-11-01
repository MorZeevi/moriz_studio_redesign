import assert from "node:assert/strict";
import { test } from "node:test";
import { he } from "../i18n/dictionaries/he.ts";
import { renderLlmsTxt } from "./llms.ts";

const text = renderLlmsTxt({
  content: he,
  siteUrl: "https://moriz.studio",
  locale: "he",
  whatsappUrl: "https://wa.me/972522937174",
  projects: [
    {
      title: "חב״ד קלאב",
      slug: "chabad-club",
      description: "פלטפורמה המחברת בין קהילת חב״ד לבעלי העסקים שבה.",
    },
    { title: "וורדעל", slug: "וורדעל", description: "משחק מילים אינטראקטיבי." },
  ],
  articles: [
    {
      title: "תהליך אפיון UX למערכת מורכבת",
      slug: "ux-specification-process",
      description: "תהליך אפיון UX למערכת מורכבת, שלב אחרי שלב.",
    },
  ],
});

test("llms.txt names Mor, the services, the process and the warranty", () => {
  assert.match(text, /^# Moriz Studio\n/);
  assert.match(text, /נעים להכיר, אני מור זאבי\. בעלת הסטודיו\./);
  assert.match(text, /תואר בטכנולוגיות למידה מ-H\.I\.T/);
  assert.match(text, /B\.A — בטכנולוגיות למידה \| H\.I\.T/);
  assert.match(text, /7\+ — שנות ניסיון בפיתוח Front-End/);
  assert.match(text, /אפיון, עיצוב ופיתוח/);
  assert.match(text, /וורדפרס או וויקס/);
  assert.match(text, /קוד נקי שנבנה במיוחד עבורכם/);
  assert.match(text, /עולים לשיחת אפיון/);
  assert.match(text, /בתוקף ל־14 ימי עבודה/);
  assert.match(text, /לכם, במלואם/);
  assert.match(text, /3 חודשי אחריות לתיקון תקלות מהותיות/);
  assert.match(text, /morzavi1@gmail\.com/);
  assert.match(text, /052-293-7174/);
  assert.match(text, /https:\/\/wa\.me\/972522937174/);
  assert.match(text, /https:\/\/www\.instagram\.com\/moriz_studio\//);
  assert.match(text, /https:\/\/www\.linkedin\.com\/in\/mor-zeevi/);
});

test("llms.txt lists the Hebrew pages and keeps project slugs encoded once", () => {
  assert.match(text, /\[עמוד הבית\]\(https:\/\/moriz\.studio\/he\)/);
  assert.match(
    text,
    /\[עבודות נבחרות\]\(https:\/\/moriz\.studio\/he\/projects\)/,
  );
  assert.match(
    text,
    /\[חב״ד קלאב\]\(https:\/\/moriz\.studio\/he\/projects\/chabad-club\)/,
  );
  assert.match(
    text,
    /\[וורדעל\]\(https:\/\/moriz\.studio\/he\/projects\/%D7%95%D7%95%D7%A8%D7%93%D7%A2%D7%9C\)/,
  );
  assert.match(text, /\[מאמרים\]\(https:\/\/moriz\.studio\/he\/articles\)/);
  assert.match(
    text,
    /https:\/\/moriz\.studio\/he\/articles\/ux-specification-process/,
  );
  assert.match(
    text,
    /\[מדיניות פרטיות\]\(https:\/\/moriz\.studio\/he\/privacy-policy\)/,
  );
  assert.match(text, /\/en מופנית באופן קבוע אל https:\/\/moriz\.studio\/he/);
  assert.equal(text.includes("%25"), false);
});

test("llms.txt leaves out prices and the lead magnet", () => {
  assert.equal(text.includes("כמה עולה אתר"), false);
  assert.equal(text.includes("₪"), false);
  assert.equal(text.includes("/digital-audit"), false);
  assert.equal(text.includes("איפיון"), false);
});
