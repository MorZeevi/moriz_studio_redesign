import { test, expect } from "@playwright/test";

test("mobile project titles scroll naturally and contact actions remain clear", async ({
  page,
}) => {
  for (const viewport of [
    { width: 393, height: 852 },
    { width: 740, height: 360 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/he");
    await expect(page.locator(".hero-actions a")).toHaveCount(1);
    await expect(page.locator(".hero-actions a")).toHaveAttribute(
      "href",
      "#projects",
    );
    await expect(page.locator(".hero-trust blockquote")).toHaveCount(0);
    await expect(page.locator(".hero-trust")).toContainText(
      "400K+ משתמשים במוצרים שבניתי או לקחתי בהם חלק",
    );
    await page.locator(".hero-actions").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-mobile-actions]")).toBeHidden();
    const head = page.locator("[data-stack-head]").last();
    await head.scrollIntoViewIfNeeded();
    await expect(head).toHaveCSS("position", "relative");
    await expect(page.locator("[data-mobile-actions]")).toBeVisible();
    await expect(page.locator("[data-mobile-actions] a")).toHaveText(
      "שנדבר בוואטסאפ?",
    );
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-mobile-actions]")).toBeHidden();
    await page.locator("#contact-name").focus();
    await expect(page.locator("[data-mobile-actions]")).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("project end invites enquiry before the next project and retains private variants", async ({
  page,
  request,
}) => {
  await page.goto("/he/projects/practicalai");
  const end = page.locator('[data-contact-placement="project-end"]');
  await expect(end.getByRole("heading")).toHaveText("רוצים לבנות משהו דומה?");
  await expect(end.locator("a")).toHaveAttribute("href", /^https:\/\/wa.me\//);
  await expect(page.locator('img[srcset*="?w="]').first()).toBeAttached();
  const image = page.locator('img[srcset*="?w="]').first();
  const src = await image.getAttribute("src");
  expect(src).toBeTruthy();
  const response = await request.get(src ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  const invalid = await request.get(`${(src ?? "").split("?")[0]}?w=99999`);
  expect(invalid.status()).toBe(400);
});

test("contact server failure preserves entered values and communicates recovery", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  await page.goto("/he#contact");
  await page.locator("#contact-name").fill("בדיקה");
  await page.locator("#contact-phone").fill("0521234567");
  await page
    .locator("#contact")
    .getByRole("button", { name: "שליחת הודעה" })
    .click();
  await expect(page.locator("#contact-status")).not.toBeEmpty();
  await expect(page.locator("#contact-name")).toHaveValue("בדיקה");
});

test("public surfaces fit tablet and desktop in both themes", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({
      colorScheme: width === 1024 ? "dark" : "light",
      reducedMotion: "reduce",
    });
    for (const path of [
      "/he",
      "/he/projects",
      "/he/projects/practicalai",
      "/he/projects/chabad-club",
      "/he/articles/learning-platform-design",
    ]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("mobile chat hides the bar and restores its opener after Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/he#projects");
  const bar = page.locator("[data-mobile-actions]");
  const opener = bar.getByRole("button", { name: "moriz.ai" });
  await expect(bar).toBeVisible();
  await opener.click();
  await expect(page.locator("dialog[open] textarea")).toBeVisible();
  await expect(bar).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(bar).toBeVisible();
  await expect(opener).toBeFocused();
});

test("accepted contact form clears the fields and announces success", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true}',
    }),
  );
  await page.goto("/he#contact");
  await page.locator("#contact-name").fill("בדיקה");
  await page.locator("#contact-phone").fill("0521234567");
  await page
    .locator("#contact")
    .getByRole("button", { name: "שליחת הודעה" })
    .click();
  await expect(page.locator("#contact-name")).toHaveValue("");
  await expect(page.locator("#contact-status")).not.toBeEmpty();
});
