import { defineConfig } from "@playwright/test";

const port = Number(process.env.NAVIGATION_TEST_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/navigation",
  outputDir: "test-results/navigation",
  workers: 1,
  timeout: 20000,
  use: {
    baseURL,
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `${baseURL}/he`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
