import { expect, test } from "@playwright/test";

const aiLabel = "לשאול את moriz.ai";

test("FAQ keeps one native answer open and supports keyboard toggling", async ({
  page,
}) => {
  await page.goto("/he#faq");
  const items = page.locator("#faq details");
  await expect(items).toHaveCount(8);
  await expect(page.locator("#faq details[open]")).toHaveCount(0);
  await items.nth(0).locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(items.nth(0)).toHaveAttribute("open");
  await expect(items.nth(0).getByText("תשובה — להשלמה")).toBeVisible();
  await items.nth(1).locator("summary").click();
  await expect(items.nth(0)).not.toHaveAttribute("open");
  await expect(items.nth(1)).toHaveAttribute("open");
  await page.keyboard.press("Space");
  await expect(page.locator("#faq details[open]")).toHaveCount(0);
});

test("FAQ opens the existing conversation and restores the correct opener", async ({
  page,
}) => {
  await page.route("**/api/ai/ask", (route) =>
    route.fulfill({ json: { answer: "תשובת בדיקה", hasAnswer: true } }),
  );
  await page.goto("/he#faq");
  const faqTrigger = page
    .locator("#faq")
    .getByRole("button", { name: aiLabel });
  const floatingTrigger = page.locator("button.floating-action");
  const dialog = page.getByRole("dialog", { name: "moriz.ai" });
  const thread = dialog.getByRole("region", { name: "השיחה עם moriz.ai" });
  await faqTrigger.click();
  await expect(dialog).toBeVisible();
  await expect(page.locator("dialog#moriz-ai-dialog")).toHaveCount(1);
  await expect(dialog.getByRole("textbox")).toBeFocused();
  await dialog.getByRole("button", { name: "למי זה מתאים?" }).click();
  await expect(thread.getByText("תשובת בדיקה")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(faqTrigger).toBeFocused();
  await floatingTrigger.click();
  await expect(thread.getByText("תשובת בדיקה")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(floatingTrigger).toBeFocused();
  const whatsapp = page
    .locator("#faq")
    .getByRole("link", { name: "שנדבר בוואטסאפ?" });
  await expect(whatsapp).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/[1-9]\d+$/,
  );
  await expect(whatsapp).toHaveAttribute("target", "_blank");
});

test("desktop places heading and actions right, with questions and their plus on the left", async ({
  page,
}) => {
  await page.goto("/he#faq");
  const heading = await page.locator("#faq h2").boundingBox();
  const action = await page.locator("#faq button").boundingBox();
  const summary = page.locator("#faq summary").first();
  const question = await summary.boundingBox();
  const plus = await summary.locator("svg").boundingBox();
  if (!heading || !action || !question || !plus)
    throw new Error("Missing FAQ geometry");
  expect(question.x + question.width).toBeLessThan(heading.x);
  expect(question.x + question.width).toBeLessThan(action.x);
  expect(plus.x).toBeLessThan(question.x + question.width / 2);
});

test("narrow screens keep long questions and answers inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/he#faq");
  const item = page.locator("#faq details").first();
  // Exercise future real copy, without adding invented answers to the product.
  await item
    .locator("summary > span")
    .nth(1)
    .evaluate((node) => {
      node.textContent =
        "שאלה לדוגמה עם כמה שורות ומילים נוספות לבדיקת רוחב התצוגה";
    });
  await item.locator("p").evaluate((node) => {
    node.textContent = "תשובה לדוגמה לצורך בדיקת פריסה בלבד. ".repeat(12);
  });
  await item.locator("summary").click();
  await expect(item.locator("p")).toBeVisible();
  const layout = await page.locator("#faq").evaluate((section) => {
    const heading = section.querySelector("h2")?.getBoundingClientRect();
    const first = section.querySelector("details")?.getBoundingClientRect();
    const last = [...section.querySelectorAll("details")]
      .at(-1)
      ?.getBoundingClientRect();
    const ai = section.querySelector("button")?.getBoundingClientRect();
    if (!heading || !first || !last || !ai)
      throw new Error("Missing FAQ layout");
    return {
      headingBeforeQuestions: heading.bottom <= first.top,
      actionsAfterQuestions: last.bottom <= ai.top,
      overflow: document.documentElement.scrollWidth > innerWidth,
      outside: [...section.querySelectorAll("summary, p, button, a")].some(
        (node) => {
          const box = node.getBoundingClientRect();
          return box.x < 0 || box.right > innerWidth;
        },
      ),
    };
  });
  expect(layout).toEqual({
    headingBeforeQuestions: true,
    actionsAfterQuestions: true,
    overflow: false,
    outside: false,
  });
});

test("mobile FAQ launcher uses the existing modal sheet and preserves focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he#faq");
  const trigger = page.locator("#faq").getByRole("button", { name: aiLabel });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "moriz.ai" });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((node) => node.matches(":modal"))).toBe(true);
  await dialog.getByRole("button", { name: "סגירה", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("without JavaScript native answers and WhatsApp remain available", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/he#faq`);
  const items = page.locator("#faq details");
  await items.nth(0).locator("summary").click();
  await expect(items.nth(0).locator("p")).toBeVisible();
  await items.nth(1).locator("summary").click();
  await expect(items.nth(0)).not.toHaveAttribute("open");
  await expect(items.nth(1).locator("p")).toBeVisible();
  await expect(
    page.locator("#faq").getByRole("button", { name: aiLabel }),
  ).toBeDisabled();
  await expect(page.locator("#faq").getByRole("link")).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\//,
  );
  await context.close();
});
