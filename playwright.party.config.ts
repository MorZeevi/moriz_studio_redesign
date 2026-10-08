import { defineConfig } from "@playwright/test";

const port = Number(process.env.PARTY_TEST_PORT ?? 3001);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/party-mode",
  outputDir: "test-results/party-mode",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chrome", use: { browserName: "chromium", channel: "chrome" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `${baseURL}/he`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
