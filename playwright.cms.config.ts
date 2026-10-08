import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/cms",
  testMatch: "*.spec.ts",
  globalSetup: "./tests/cms/setup.ts",
  workers: 1,
  timeout: 180000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    trace: "off",
  },
  webServer: {
    command: "npm run dev -- --port 3000",
    url: "http://127.0.0.1:3000/admin/login",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
