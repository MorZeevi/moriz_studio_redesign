import { defineConfig } from "@playwright/test";
// Read-only CMS regression gate. Unlike playwright.cms.config.ts it creates no
// Auth users, writes no tables and publishes nothing: it only mints two owner
// sessions (see tests/cms-gate/setup.ts) and reads the protected surfaces.
const port = 4398;
export default defineConfig({
  testDir: "./tests",
  testMatch: ["cms-gate/**/*.spec.ts", "cms/auth.spec.ts"],
  globalSetup: "./tests/cms-gate/setup.ts",
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
  },
});
