import { expect, type Page, type Route, test } from "@playwright/test";

type AskBody = {
  question: string;
  history: { role: string; content: string }[];
};

// Answers from a stub so the tests never call the model.
async function stubAnswers(
  page: Page,
  answer: (body: AskBody) => { answer: string; hasAnswer: boolean },
) {
  const bodies: AskBody[] = [];
  await page.route("**/api/ai/ask", async (route: Route) => {
    const body = route.request().postDataJSON() as AskBody;
    bodies.push(body);
    await route.fulfill({ json: answer(body) });
  });
  return bodies;
}

function trigger(page: Page) {
  return page.locator("button.floating-action");
}

function drawer(page: Page) {
  return page.getByRole("dialog", { name: "moriz.ai" });
}

function thread(page: Page) {
  return drawer(page).getByRole("region", { name: "השיחה עם moriz.ai" });
}

test("the sparkle launcher opens a full-height chat drawer", async ({
  page,
}) => {
  await page.goto("/he");
  await expect(trigger(page)).toContainText("Ask moriz.ai");
  // Sparkle glyph, no portrait; the label stays collapsed until hover.
  await expect(trigger(page).locator("img")).toHaveCount(0);
  await expect(trigger(page).locator("svg path")).not.toHaveCount(0);

  await trigger(page).click();
  await expect(drawer(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");

  const box = await drawer(page).boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error("Missing drawer bounds");
  expect(box.height).toBeGreaterThan(viewport.height * 0.9);
  // Docked on the pills' edge: left in Hebrew.
  expect(box.x).toBeLessThan(40);

  // Non-modal on desktop: the page stays usable.
  expect(await drawer(page).evaluate((node) => node.matches(":modal"))).toBe(
    false,
  );
  await expect(drawer(page).getByRole("textbox")).toBeFocused();

  // The hint types itself out to the full text.
  await expect(drawer(page).getByText("אפשר לשאול כל שאלה…")).toBeVisible({
    timeout: 5000,
  });
  await expect(drawer(page).getByText("היי, אני moriz.ai")).toBeVisible();
});

test("suggestions send, answers carry the avatar, and follow-ups include history", async ({
  page,
}) => {
  const bodies = await stubAnswers(page, (body) =>
    body.question === "כמה עולה אתר?"
      ? { answer: "תשובה על מחירים", hasAnswer: true }
      : { answer: "", hasAnswer: false },
  );
  await page.goto("/he");
  await trigger(page).click();

  await drawer(page).getByRole("button", { name: "כמה עולה אתר?" }).click();
  const thread = drawer(page).getByRole("region", {
    name: "השיחה עם moriz.ai",
  });
  await expect(thread.getByText("כמה עולה אתר?")).toBeVisible();
  await expect(thread).toContainText("תשובה על מחירים");
  // Mor's photo sits beside the answer; the visitor bubble has none.
  await expect(thread.locator("li img")).toHaveCount(1);
  expect(bodies[0]).toEqual({ question: "כמה עולה אתר?", history: [] });

  // The asked question leaves the chip row.
  await expect(
    drawer(page).getByRole("button", { name: "כמה עולה אתר?" }),
  ).toHaveCount(0);

  const field = drawer(page).getByRole("textbox", { name: "השאלה שלך" });
  const oneLine = (await field.boundingBox())?.height ?? 0;
  await field.pressSequentially("ותוך");
  await field.press("Shift+Enter");
  await field.pressSequentially("כמה");
  await field.press("Shift+Enter");
  await field.pressSequentially("זמן?");
  expect((await field.boundingBox())?.height).toBeGreaterThan(oneLine);
  await field.press("Enter");
  // The field shrinks back to one line once the question is sent.
  await expect
    .poll(async () => (await field.boundingBox())?.height)
    .toBe(oneLine);
  await expect(
    thread.getByRole("link", { name: "דברו איתי בוואטסאפ" }),
  ).toBeVisible();
  expect(bodies[1]).toEqual({
    question: "ותוך\nכמה\nזמן?",
    history: [
      { role: "user", content: "כמה עולה אתר?" },
      { role: "assistant", content: "תשובה על מחירים" },
    ],
  });
});

test("Escape closes, the thread survives reopening, and new chat clears it", async ({
  page,
}) => {
  await stubAnswers(page, () => ({ answer: "שלום", hasAnswer: true }));
  await page.goto("/he");
  await trigger(page).click();
  await drawer(page).getByRole("button", { name: "למי זה מתאים?" }).click();
  await expect(thread(page).getByText("שלום")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(drawer(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");

  await trigger(page).click();
  await expect(thread(page).getByText("שלום")).toBeVisible();

  await drawer(page).getByRole("button", { name: "שיחה חדשה" }).click();
  await expect(thread(page).getByText("שלום")).toHaveCount(0);
  await expect(drawer(page).getByText("היי, אני moriz.ai")).toBeVisible();
});

test("mixed Hebrew and English keeps its word order while revealing", async ({
  page,
}) => {
  await stubAnswers(page, () => ({
    answer: "אני עובדת עם Next.js App Router ו-Google Analytics",
    hasAnswer: true,
  }));
  await page.goto("/he");
  await trigger(page).click();
  await drawer(page).getByRole("button", { name: "למי זה מתאים?" }).click();
  const answer = thread(page).locator("li p").last();
  await expect(answer).toContainText("Router");
  const order = () =>
    answer.evaluate((node) => {
      const range = document.createRange();
      return ["Next.js", "App", "Router"].map((word) => {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let text = walker.nextNode();
        while (text && !text.textContent?.includes(word))
          text = walker.nextNode();
        if (!text) return -1;
        const start = text.textContent?.indexOf(word) ?? 0;
        range.setStart(text, start);
        range.setEnd(text, start + word.length);
        return Math.round(range.getBoundingClientRect().left);
      });
    });
  const revealing = await order();
  // English reads left to right even inside the Hebrew answer.
  expect(revealing[0]).toBeLessThan(revealing[1]);
  expect(revealing[1]).toBeLessThan(revealing[2]);
  await page.waitForTimeout(2600);
  const settled = await order();
  expect(settled[0]).toBeLessThan(settled[1]);
  expect(settled[1]).toBeLessThan(settled[2]);
});

test("a failed request offers a retry", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/ai/ask", (route) =>
    ++calls === 1
      ? route.fulfill({ status: 502, json: { error: "ai_unavailable" } })
      : route.fulfill({ json: { answer: "עכשיו זה עובד", hasAnswer: true } }),
  );
  await page.goto("/he");
  await trigger(page).click();
  await drawer(page).getByRole("button", { name: "למי זה מתאים?" }).click();
  await drawer(page).getByRole("button", { name: "לנסות שוב" }).click();
  await expect(drawer(page)).toContainText("עכשיו זה עובד");
  await expect(
    drawer(page).getByRole("button", { name: "לנסות שוב" }),
  ).toHaveCount(0);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the chat is a full-screen modal sheet", async ({ page }) => {
    await page.goto("/he#faq");
    // The homepage's floating AI pill is desktop-only; phones use the FAQ launcher.
    await page
      .locator("#faq")
      .getByRole("button", { name: "לשאול את moriz.ai" })
      .click();
    await expect(drawer(page)).toBeVisible();
    // Waits out the slide-up.
    await expect
      .poll(() => drawer(page).boundingBox())
      .toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
    expect(await drawer(page).evaluate((node) => node.matches(":modal"))).toBe(
      true,
    );
    await drawer(page).getByRole("button", { name: "סגירה" }).click();
    await expect(drawer(page)).toBeHidden();
  });
});

test("the API rejects malformed history", async ({ request }) => {
  const response = await request.post("/api/ai/ask", {
    data: { question: "שלום", history: [{ role: "system", content: "x" }] },
  });
  expect(response.status()).toBe(400);
});
