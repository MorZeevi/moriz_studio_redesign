import { type BrowserContext, expect, test } from "@playwright/test";
import {
  ADMIN_API,
  FUNNEL_ANSWERS,
  LEAD_NAME,
  ORIGIN,
  PUBLIC_API,
  fixture,
  postJson,
  serviceDb,
} from "./support";

// (c) one admin test session carried through the public funnel and the admin
// mutations, (d) CSRF negatives on it, (e) cross-source probes.
//
// D4: synthetic is_test data only, on the local server with notifications and AI
// forced off. Classification is mark_test ONLY, briefs are save ONLY (never
// generate), and nothing is deleted.

test.describe.configure({ mode: "serial" });

let owner: BrowserContext;
let sessionId = "";

test.beforeAll(async ({ browser }) => {
  owner = await browser.newContext();
  await owner.addCookies(fixture().main.cookies);
});
test.afterAll(async () => {
  await owner.close();
});

test("(c) an admin test session is moriz-owned and is_test", async () => {
  const response = await postJson(owner.request, `${ADMIN_API}/test-session`, {});
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.isTest).toBe(true);
  sessionId = body.sessionId;
  expect(sessionId).toMatch(/^[0-9a-f-]{36}$/);

  const { data, error } = await serviceDb()
    .from("diagnostic_sessions")
    .select("source,is_test")
    .eq("id", sessionId)
    .single();
  expect(error).toBeNull();
  expect(data).toEqual({ source: "moriz", is_test: true });
});

test("(c) the public funnel works on that session: answers, result, contact", async ({
  playwright,
}) => {
  const visitor = await playwright.request.newContext({ baseURL: ORIGIN });
  for (const [questionId, answer] of Object.entries(FUNNEL_ANSWERS)) {
    const response = await postJson(visitor, `${PUBLIC_API}/answer`, {
      sessionId,
      questionId,
      answer,
    });
    expect(response.status(), questionId).toBe(200);
  }
  const result = await postJson(visitor, `${PUBLIC_API}/result`, { sessionId });
  expect(result.status()).toBe(200);
  expect((await result.json()).result?.primarySolution).toBeTruthy();

  const contact = await postJson(visitor, `${PUBLIC_API}/contact`, {
    sessionId,
    fullName: LEAD_NAME,
    phone: "0500000000",
    reviewConsent: true,
    marketingConsent: false,
  });
  expect(contact.status()).toBe(200);
  await visitor.dispose();
});

test("(c) the owner sees the lead and can update status, classification and brief", async () => {
  const page = await owner.newPage();
  await page.goto(`/digital-audit/admin/leads/${sessionId}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(LEAD_NAME);
  await page.close();

  const status = await postJson(owner.request, `${ADMIN_API}/lead-status`, {
    sessionId,
    status: "in_review",
  });
  expect(status.status()).toBe(200);

  const mark = await postJson(owner.request, `${ADMIN_API}/session-classification`, {
    sessionId,
    action: "mark_test",
  });
  expect(mark.status()).toBe(200);
  expect((await mark.json()).isTest).toBe(true);

  const brief = await postJson(owner.request, `${ADMIN_API}/lead-brief`, {
    mode: "save",
    sessionId,
    evidenceMd: "QA synthetic evidence",
  });
  expect(brief.status()).toBe(200);

  const { data } = await serviceDb()
    .from("diagnostic_contacts")
    .select("status")
    .eq("session_id", sessionId)
    .single();
  expect(data?.status).toBe("in_review");
});

test("(d) CSRF and auth negatives on that session are each a 404", async ({
  playwright,
}) => {
  const url = `${ADMIN_API}/lead-status`;
  const body = JSON.stringify({ sessionId, status: "in_review" });

  const crossOrigin = await postJson(owner.request, url, { sessionId, status: "in_review" }, {
    origin: "https://evil.example",
  });
  expect(crossOrigin.status(), "cross-origin").toBe(404);

  // No Origin header at all.
  const missingOrigin = await owner.request.post(url, {
    headers: { "content-type": "application/json" },
    data: body,
    maxRedirects: 0,
  });
  expect(missingOrigin.status(), "missing Origin").toBe(404);

  const textPlain = await owner.request.post(url, {
    headers: { origin: ORIGIN, "content-type": "text/plain" },
    data: body,
    maxRedirects: 0,
  });
  expect(textPlain.status(), "text/plain").toBe(404);

  const anonymous = await playwright.request.newContext({ baseURL: ORIGIN });
  const signedOut = await postJson(anonymous, url, { sessionId, status: "in_review" });
  expect(signedOut.status(), "signed out").toBe(404);
  await anonymous.dispose();
});

test("(e) an Eyal-owned test lead is invisible and untouchable from the Moriz admin", async () => {
  const db = serviceDb();
  const { data: lead } = await db
    .from("diagnostic_contacts")
    .select("session_id,status,diagnostic_sessions!inner(source,is_test)")
    .eq("diagnostic_sessions.source", "eyal")
    .eq("diagnostic_sessions.is_test", true)
    .limit(1)
    .maybeSingle();
  test.skip(!lead, "no Eyal is_test lead exists to probe; nothing is created for this");
  if (!lead) return;

  const page = await owner.newPage();
  const detail = await page.goto(`/digital-audit/admin/leads/${lead.session_id}`);
  expect(detail?.status()).toBe(404);
  await page.close();

  // Its CURRENT status: a no-op even if the guard were missing.
  const update = await postJson(owner.request, `${ADMIN_API}/lead-status`, {
    sessionId: lead.session_id,
    status: lead.status,
  });
  expect(update.status()).toBe(404);

  const { data: after } = await db
    .from("diagnostic_contacts")
    .select("status")
    .eq("session_id", lead.session_id)
    .single();
  expect(after?.status).toBe(lead.status);
});
