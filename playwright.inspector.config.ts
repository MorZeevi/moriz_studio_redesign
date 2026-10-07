import { defineConfig } from "@playwright/test";

const production = process.env.INSPECTOR_PRODUCTION === "1";
const port = production ? 3013 : 3000;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/devtools",
  testMatch: production ? "production.spec.ts" : "inspector.spec.ts",
  outputDir: `test-results/inspector-${production ? "production" : "development"}`,
  workers: 1,
  timeout: 20000,
  use: {
    baseURL,
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: production
      ? "npm run start -- --port 3013"
      : "npm run dev -- --port 3000",
    url: `${baseURL}/he`,
    reuseExistingServer: !production && !process.env.CI,
    timeout: 30000,
  },
});
