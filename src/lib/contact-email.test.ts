import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildContactEmail,
  CONTACT_RECIPIENT,
  parseContactSubmission,
  sendContactEmail,
} from "./contact-email.ts";

const valid = {
  name: "  מור\nלוי  ",
  phone: "050-123-4567",
  message: "  אשמח לדבר על פרויקט.  ",
  preferWhatsApp: true,
  website: "",
};

test("accepts a short contact request and normalizes its text", () => {
  assert.deepEqual(parseContactSubmission(valid), {
    name: "מור לוי",
    phone: "050-123-4567",
    message: "אשמח לדבר על פרויקט.",
    preferWhatsApp: true,
    website: "",
    interests: [],
  });
  assert.equal(parseContactSubmission({ ...valid, phone: "123" }), null);
  assert.equal(parseContactSubmission({ ...valid, name: " " }), null);
  assert.equal(
    parseContactSubmission({ ...valid, message: "x".repeat(2001) }),
    null,
  );
  assert.equal(
    parseContactSubmission({ ...valid, preferWhatsApp: "yes" }),
    null,
  );
});

test("email has a fixed destination and reports WhatsApp as a reply preference", () => {
  const submission = parseContactSubmission(valid);
  assert.ok(submission);
  const email = buildContactEmail(submission);
  assert.equal(email.to, CONTACT_RECIPIENT);
  assert.equal(email.from, CONTACT_RECIPIENT);
  assert.match(email.text, /עדיפות לוואטסאפ: כן/);
  assert.match(email.text, /אשמח לדבר על פרויקט/);
  assert.equal(email.subject, "פנייה חדשה מאתר moriz.studio");
});

test("sends through Gmail with a fixed sender and recipient", async () => {
  const submission = parseContactSubmission(valid);
  assert.ok(submission);
  let password = "";
  let email: ReturnType<typeof buildContactEmail> | undefined;
  const accepted = await sendContactEmail(
    submission,
    "test-app-password",
    async (secret, message) => {
      password = secret;
      email = message;
      return { accepted: [CONTACT_RECIPIENT] };
    },
  );
  assert.equal(accepted, true);
  assert.equal(password, "test-app-password");
  assert.ok(email);
  assert.equal(email.to, CONTACT_RECIPIENT);
  assert.equal(email.from, CONTACT_RECIPIENT);
  assert.match(email.text, /מור לוי/);
  assert.equal(
    await sendContactEmail(submission, "test-app-password", async () => ({
      accepted: [],
    })),
    false,
  );
});

test("email reports where the visitor came from, and drops a malformed source", () => {
  const tagged = parseContactSubmission({
    ...valid,
    source: {
      utmSource: "facebook",
      utmMedium: "group",
      utmCampaign: "2026-11-chatbot-article",
      landingPath: "/he",
      page: "/he/services\nBcc: someone",
      referrer: 42,
      extra: "ignored",
    },
  });
  assert.ok(tagged);
  assert.deepEqual(tagged.source, {
    utmSource: "facebook",
    utmMedium: "group",
    utmCampaign: "2026-11-chatbot-article",
    landingPath: "/he",
    page: "/he/services Bcc: someone",
  });
  const text = buildContactEmail(tagged).text;
  assert.match(text, /מקור: facebook \/ group \/ 2026-11-chatbot-article/);
  assert.match(text, /עמוד כניסה: \/he\n/);

  const untagged = parseContactSubmission({ ...valid, source: "nonsense" });
  assert.ok(untagged);
  assert.equal(untagged.source, undefined);
  assert.match(buildContactEmail(untagged).text, /מקור: לא ידוע/);
});

test("keeps only the interests the form offers and lists them in the email", () => {
  const submission = parseContactSubmission({
    ...valid,
    interests: ["web-app", "seo", 7, "website"],
  });
  assert.ok(submission);
  assert.deepEqual(submission.interests, ["website", "web-app"]);
  assert.match(
    buildContactEmail(submission).text,
    /מתעניינים ב: בניית אתר, מערכת או אפליקציית Web/,
  );
  const none = parseContactSubmission(valid);
  assert.ok(none);
  assert.match(buildContactEmail(none).text, /מתעניינים ב: \(לא נבחר\)/);
});
