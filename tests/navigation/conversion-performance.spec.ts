import { test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

test("local before/after cold-load comparison", async ({ browser }) => {
  test.skip(
    process.env.RUN_CONVERSION_BENCHMARK !== "1",
    "Optional comparison needs the two production servers.",
  );
  test.setTimeout(180000);
  const results: unknown[] = [];
  for (const mobile of [true, false]) {
    for (let run = 0; run < 3; run++) {
      for (const port of [3175, 3176]) {
        const context = await browser.newContext({
          viewport: mobile
            ? { width: 393, height: 852 }
            : { width: 1440, height: 1000 },
          deviceScaleFactor: mobile ? 2 : 1,
        });
        const page = await context.newPage();
        const client = await context.newCDPSession(page);
        await client.send("Network.enable");
        await client.send("Network.setCacheDisabled", { cacheDisabled: true });
        if (mobile) {
          await client.send("Network.emulateNetworkConditions", {
            offline: false,
            latency: 150,
            downloadThroughput: 200000,
            uploadThroughput: 93750,
          });
          await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        }
        await page.addInitScript(() => {
          const metrics = { lcp: 0, cls: 0 };
          Object.assign(window, { benchmarkMetrics: metrics });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries())
              metrics.lcp = entry.startTime;
          }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as (PerformanceEntry & {
              hadRecentInput: boolean;
              value: number;
            })[])
              if (!entry.hadRecentInput) metrics.cls += entry.value;
          }).observe({ type: "layout-shift", buffered: true });
        });
        await page.goto(`http://127.0.0.1:${port}/he`, { waitUntil: "load" });
        await page.waitForTimeout(4000);
        results.push({
          variant: port === 3175 ? "baseline" : "changed",
          mobile,
          run,
          ...(await page.evaluate(() => ({
            ...Reflect.get(window, "benchmarkMetrics"),
            bytes: performance
              .getEntriesByType("resource")
              .reduce(
                (sum, entry) =>
                  sum + (entry as PerformanceResourceTiming).transferSize,
                0,
              ),
          }))),
        });
        await context.close();
      }
    }
  }
  mkdirSync(".cache/conversion-review", { recursive: true });
  writeFileSync(
    ".cache/conversion-review/performance.json",
    JSON.stringify(results, null, 2),
  );
});
