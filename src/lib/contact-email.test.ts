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
