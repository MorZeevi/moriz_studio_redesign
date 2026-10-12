import { defineConfig } from "@playwright/test";
// Another checkout's dev server may already hold :3000; CMS_TEST_PORT=4398
// runs the suite against this checkout's code instead.
const port = process.env.CMS_TEST_PORT ?? "3000";
export default defineConfig({
  testDir: "./tests/cms",
  testMatch: "*.spec.ts",
  globalSetup: "./tests/cms/setup.ts",
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
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
