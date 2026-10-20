import { readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import type { APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { type AcceptanceFixture, acceptancePath } from "./setup";

export const ORIGIN = "http://127.0.0.1:4399";
export const ADMIN_API = "/digital-audit/api/admin";
export const PUBLIC_API = "/digital-audit/api/diagnostic";
export const LEAD_NAME = "QA בדיקה אוטומטית";

export function fixture(): AcceptanceFixture {
  return JSON.parse(readFileSync(acceptancePath, "utf8"));
}

/** Service-role client for read-only lookups and DB assertions. */
export function serviceDb() {
  loadEnvConfig(process.cwd());
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and the service role key are required.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const JSON_HEADERS = { origin: ORIGIN, "content-type": "application/json" };

/** A same-origin JSON POST, as the admin UI sends it. */
export function postJson(
  request: APIRequestContext,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return request.post(path, {
    headers: { ...JSON_HEADERS, ...headers },
    data: JSON.stringify(body),
    maxRedirects: 0,
  });
}

/** The trust_website fixture answers with a synthetic business description. */
export const FUNNEL_ANSWERS = {
  business_description: { type: "text", value: "בדיקת QA אוטומטית — לא ליד אמיתי" },
  primary_goal: { type: "single", optionId: "explain_business" },
  biggest_challenge: { type: "single", optionId: "unclear_value" },
  current_asset: { type: "single", optionId: "nothing" },
  user_actions: { type: "multi", optionIds: ["understand_fit"] },
  urgency: { type: "single", optionId: "this_month" },
  desired_process: { type: "single", optionId: "short_focused" },
} as const;
