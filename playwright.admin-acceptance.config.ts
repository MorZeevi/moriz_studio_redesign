import { defineConfig } from "@playwright/test";
import { FORCED_SERVER_ENV } from "./tests/admin-acceptance/server-env";

// Live admin acceptance suite (plan section 8, D4). It runs against the LIVE
// Supabase project, so it is opt-in and writes only synthetic is_test data on a
// local dev server with notifications and AI forced off. It is separate from the
// read-only CMS gate (playwright.cms-gate.config.ts) and is not part of any
// per-slice gate. Run: ADMIN_ACCEPTANCE_LIVE=1 npm run test:admin-acceptance
if (process.env.ADMIN_ACCEPTANCE_LIVE !== "1")
  throw new Error(
    "test:admin-acceptance writes synthetic is_test rows to the live Supabase project. Set ADMIN_ACCEPTANCE_LIVE=1 to opt in.",
  );

// The same values reach the test process so setup can assert them.
Object.assign(process.env, FORCED_SERVER_ENV);

const port = 4399;
export default defineConfig({
  testDir: "./tests/admin-acceptance",
  testMatch: "*.spec.ts",
  globalSetup: "./tests/admin-acceptance/setup.ts",
  workers: 1,
  timeout: 180000,
  expect: { timeout: 15000 },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    trace: "off",
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://127.0.0.1:${port}/admin/login`,
    reuseExistingServer: false,
    timeout: 120000,
    env: FORCED_SERVER_ENV,
  },
});
