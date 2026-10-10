import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

async function openTools(page: Page, enable = true) {
  await page
    .getByRole("button", { name: "Developer tools", exact: true })
    .click();
  if (enable)
    await page.getByRole("button", { name: "Inspector: OFF" }).click();
}
async function select(page: Page, selector: string) {
  await page.locator(selector).click();
  await expect(
    page.locator('[data-inspector-overlay="selected"]'),
  ).toBeVisible();
}

const pageErrors = new WeakMap<Page, string[]>();
test("double-click copies ID first, otherwise classes, without website activation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openTools(page);
  await page.locator("#hero-heading").dblclick();
  await expect(
    page.getByRole("status").filter({ hasText: "Copied: #hero-heading" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "#hero-heading",
  );
  await page.getByRole("button", { name: "Move panel left" }).click();
  await page.locator(".hero-projects-link").dblclick();
  await expect(
    page.getByRole("status").filter({ hasText: "Copied: .hero-projects-link" }),
  ).toBeVisible();
  const linkSelector = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  expect(linkSelector).toContain(".hero-projects-link");
  await expect(page.locator(linkSelector)).toHaveAttribute("href", "#projects");
  await expect(page).not.toHaveURL(/#projects$/);
  await page.getByRole("button", { name: "Move panel right" }).click();
  const disabled = await page.locator(".floating-whatsapp").boundingBox();
  if (!disabled) throw new Error("Missing disabled control");
  await page.mouse.click(disabled.x + disabled.width / 2, disabled.y + 8);
  await page.mouse.click(disabled.x + disabled.width / 2, disabled.y + 8, {
    clickCount: 2,
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Copied: .floating-whatsapp" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    ".floating-whatsapp",
  );
  await page.getByRole("button", { name: "Move panel left" }).click();
  await page.locator(".hero-description strong").dblclick();
  const fallbackSelector = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  await expect(page.locator(fallbackSelector)).toHaveText("מחקר מנצח טיעונים");
  await page.getByLabel("Ask Codex about this element").dblclick();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    fallbackSelector,
  );
  await page.keyboard.press("Escape");
  await page.locator("#hero-heading").dblclick();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    fallbackSelector,
  );
});

test("double-click clipboard failure exposes the identifier for manual copying", async ({
  page,
}) => {
  await openTools(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: () => Promise.reject(new Error("Denied")),
    });
  });
  await page.locator("#hero-heading").dblclick();
  await expect(
    page.getByRole("textbox", { name: "Element selector" }),
  ).toHaveValue("#hero-heading");
  await page.getByRole("button", { name: "Select selector" }).click();
  expect(
    await page
      .getByRole("textbox", { name: "Element selector" })
      .evaluate((e: HTMLTextAreaElement) => e.selectionEnd - e.selectionStart),
  ).toBe("#hero-heading".length);
});
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  await page.goto("/he");
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

test("OFF is inert; hover and lock show exact source without shifting layout", async ({
  page,
}) => {
  const heading = page.locator("#hero-heading");
  const before = await heading.boundingBox();
  await openTools(page, false);
  await expect(
    page.getByRole("button", { name: "Inspector: OFF" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Inspector: OFF" }).click();
  await heading.hover();
  await expect(page.locator('[data-inspector-overlay="hover"]')).toBeVisible();
  await select(page, "#hero-heading");
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "Exact JSX declaration",
  );
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "src/app/[locale]/page.tsx",
  );
  const line = Number(await heading.getAttribute("data-inspector-line"));
  expect(
    readFileSync("src/app/[locale]/page.tsx", "utf8")
      .split("\n")
      [line - 1].trim(),
  ).toMatch(/^<h1(?:\s|$)/);
  await page.mouse.move(30, 300);
  await expect(
    page.locator('[data-inspector-overlay="selected"]'),
  ).toBeVisible();
  expect(await heading.boundingBox()).toEqual(before);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator("[data-inspector-details]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Inspector: ON" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Inspector: OFF" }),
  ).toBeVisible();
  await expect(page.locator("[data-inspector-overlay]")).toHaveCount(0);
  await page.locator(".hero-projects-link").click();
  await expect(page).toHaveURL(/#projects$/);
});

test("links, FAQ buttons and keyboard activation are blocked during inspection", async ({
  page,
}) => {
  await openTools(page);
  await select(page, ".hero-projects-link");
  await expect(page).not.toHaveURL(/#projects$/);
  await page.locator(".hero-projects-link").focus();
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/#projects$/);
  await page.locator(".faq-item summary").first().scrollIntoViewIfNeeded();
  await page.locator(".faq-item summary").first().click();
  await expect(page.locator(".faq-item").first()).not.toHaveAttribute("open");
  await page.getByRole("button", { name: "Close developer tools" }).click();
  await expect(
    page.getByRole("button", { name: "Inspector: ON" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(".faq-item summary").first().click();
  await expect(page.locator(".faq-item").first()).not.toHaveAttribute("open");
  await page.getByRole("button", { name: "Inspector: ON" }).click();
  await page.locator(".faq-item summary").first().click();
  await expect(page.locator(".faq-item").first()).toHaveAttribute("open");
});

test("external toggle works with the panel closed and never opens it", async ({
  page,
}) => {
  const toggle = page.getByRole("button", { name: "Inspector: OFF" });
  const launcher = page.getByRole("button", {
    name: "Developer tools",
    exact: true,
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(launcher).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Inspector: ON" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("complementary", { name: "Developer tools" }),
  ).toHaveCount(0);
  await select(page, ".hero-projects-link");
  await expect(page).not.toHaveURL(/#projects$/);
  await page.getByRole("button", { name: "Inspector: ON" }).click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-inspector-overlay]")).toHaveCount(0);
  await page.locator(".hero-projects-link").click();
  await expect(page).toHaveURL(/#projects$/);
});

test("closing and reopening the panel preserves inspection, selection and draft", async ({
  page,
}) => {
  await openTools(page);
  await page
    .getByLabel("Ask Codex about this element")
    .fill("Keep inspecting with the panel closed");
  await select(page, "#hero-heading");
  await page.getByRole("button", { name: "Close developer tools" }).click();
  await expect(
    page.getByRole("complementary", { name: "Developer tools" }),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-inspector-overlay="selected"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Inspector: ON" }),
  ).toHaveAttribute("aria-pressed", "true");
  await select(page, ".hero-description strong");
  await page
    .getByRole("button", { name: "Developer tools", exact: true })
    .click();
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "HeroDescription",
  );
  await expect(page.getByLabel("Ask Codex about this element")).toHaveValue(
    "Keep inspecting with the panel closed",
  );
  await page.getByRole("button", { name: "Close developer tools" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Inspector: OFF" }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-inspector-overlay]")).toHaveCount(0);
});

test("nested nodes and icons can be selected; source fallback is explicit", async ({
  page,
}) => {
  await openTools(page);
  await page.getByRole("button", { name: "Move panel left" }).click();
  await select(page, ".hero-description strong");
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "HeroDescription",
  );
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "מחקר מנצח טיעונים",
  );
  await page.getByRole("button", { name: "Move panel right" }).click();
  const control = page.locator(".floating-whatsapp");
  const box = await control.boundingBox();
  if (!box) throw new Error("Missing WhatsApp control");
  await page.mouse.click(box.x + box.width / 2, box.y + 8);
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "LiquidLink",
  );
  // The floating pills' glyphs ignore pointer events, so use the header icon;
  // the panel moves off the header's right side first.
  await page.getByRole("button", { name: "Move panel left" }).click();
  await page
    .locator(".header-brand-controls [data-theme-controls] svg:visible")
    .first()
    .click({ force: true });
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "ThemeToggle",
  );
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "> svg:nth-of-type(1) > path",
  );
  await page.evaluate(() => {
    const node = document.createElement("span");
    node.id = "generated-node";
    node.textContent = "Generated content";
    document.querySelector("#hero-heading")?.append(node);
  });
  await select(page, "#generated-node");
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "Containing source",
  );
});

test("scroll, resize, animation and rerenders keep selection accurate; removed nodes clear", async ({
  page,
}) => {
  await openTools(page);
  await select(page, "#hero-heading");
  await page.mouse.move(20, 300);
  await page.mouse.wheel(0, 150);
  await expect
    .poll(
      async () =>
        (
          await page
            .locator('[data-inspector-overlay="selected"]')
            .boundingBox()
        )?.y,
    )
    .toBeLessThan(136);
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect
    .poll(async () =>
      Math.round(
        (
          await page
            .locator('[data-inspector-overlay="selected"]')
            .boundingBox()
        )?.width || 0,
      ),
    )
    .toBe(
      Math.round(
        (await page.locator("#hero-heading").boundingBox())?.width || 0,
      ),
    );
  const originalX = (await page.locator("#hero-heading").boundingBox())?.x || 0;
  await page.evaluate(() => {
    const heading = document.querySelector("#hero-heading");
    heading?.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(60px)" }],
      { duration: 120, fill: "forwards" },
    );
  });
  await expect
    .poll(async () =>
      Math.round(
        (
          await page
            .locator('[data-inspector-overlay="selected"]')
            .boundingBox()
        )?.x || 0,
      ),
    )
    .toBe(Math.round(originalX + 60));
  await page.evaluate(() => {
    const node = document.querySelector("#hero-heading");
    if (node) node.textContent = "Updated heading";
  });
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "Updated heading",
  );
  await page.evaluate(() => document.querySelector("#hero-heading")?.remove());
  await expect(page.locator("[data-inspector-details]")).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: "was removed" }),
  ).toBeVisible();
});

test("prompts preserve Hebrew and accessible names, with clipboard success and failure", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openTools(page);
  await select(page, ".hero-projects-link");
  await page
    .getByLabel("Ask Codex about this element")
    .fill("Make this button taller.");
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Prompt copied." }),
  ).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("File: src/components/ui/liquid-link.tsx");
  expect(copied).toContain("Accessible name: לצפיה בפרויקטים");
  expect(copied).toContain("Request:\nMake this button taller.");
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: () => Promise.reject(new Error("Denied")),
    });
  });
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Select prompt" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Select prompt" }).click();
  const fallback = page.getByRole("textbox", { name: "Generated prompt" });
  expect(
    await fallback.evaluate(
      (e: HTMLTextAreaElement) => e.selectionEnd - e.selectionStart,
    ),
  ).toBe(copied.length);
});

test("toolbar remains usable inside the native mobile menu; Escape restores menu behavior", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".mobile-menu-toggle").click();
  await expect(page.locator(".navigation-dialog")).toBeVisible();
  await openTools(page);
  await page.locator(".navigation-panel nav a").first().click();
  await expect(page.locator(".navigation-dialog")).toBeVisible();
  await expect(page).not.toHaveURL(/#projects$/);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Inspector: OFF" }),
  ).toBeVisible();
  await expect(page.locator(".navigation-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".navigation-dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Inspector: OFF" }),
  ).toBeVisible();
});

test("route transitions stop inspection and retain the draft without duplicate toolbars", async ({
  page,
}) => {
  await page.goto("/he/fonts");
  await openTools(page);
  await page.getByLabel("Ask Codex about this element").fill("Keep this draft");
  await page.getByRole("button", { name: "Inspector: ON" }).click();
  await page.getByRole("link", { name: "חזרה לעמוד הבית" }).click();
  await expect(page).toHaveURL(/\/he$/);
  await expect(
    page.getByRole("button", { name: "Inspector: OFF" }),
  ).toBeVisible();
  await expect(page.getByLabel("Ask Codex about this element")).toHaveValue(
    "Keep this draft",
  );
  await expect(
    page.locator('[popover="manual"][data-devtools-owned]'),
  ).toHaveCount(1);
});

test("narrow viewports and LTR/RTL contain the panel and do not shift content", async ({
  page,
}) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    const before = await page.locator("#hero-heading").boundingBox();
    await openTools(page, false);
    for (const direction of ["rtl", "ltr"]) {
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
      }, direction);
      const panel = await page
        .getByRole("complementary", { name: "Developer tools" })
        .boundingBox();
      if (!panel) throw new Error("Panel missing");
      expect(panel.x).toBeGreaterThanOrEqual(0);
      expect(panel.x + panel.width).toBeLessThanOrEqual(width);
      const launcher = await page
        .locator("[data-devtools-launcher]")
        .boundingBox();
      if (!launcher) throw new Error("External controls missing");
      expect(launcher.x).toBeGreaterThanOrEqual(0);
      expect(launcher.x + launcher.width).toBeLessThanOrEqual(width);
      expect(panel.y + panel.height).toBeLessThanOrEqual(launcher.y);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    expect(await page.locator("#hero-heading").boundingBox()).toEqual(before);
    await page.getByRole("button", { name: "Close developer tools" }).click();
  }
});

test("touch panning scrolls without selection and a touch tap selects", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await page.goto("/he");
    await page.getByRole("button", { name: "Inspector: OFF" }).click();
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 30, y: 350 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 30, y: 150 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    await expect(
      page.locator('[data-inspector-overlay="selected"]'),
    ).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator("#hero-heading").tap();
    await expect(
      page.locator('[data-inspector-overlay="selected"]'),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Developer tools", exact: true })
      .click();
    await expect(page.locator("[data-inspector-details]")).toContainText(
      "Home",
    );
  } finally {
    await context.close();
  }
});

test("real React rerenders refresh a locked element's text and dimensions", async ({
  page,
}) => {
  await page.goto("/he/fonts");
  await openTools(page);
  await page.locator("[data-font-sample] p").first().click();
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "FontPreview",
  );
  await page.evaluate(() => {
    const input = document.querySelector("#font-preview-text");
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "React changed this headline");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("[data-font-sample] p").first()).toHaveText(
    "React changed this headline",
  );
  await expect(page.locator("[data-inspector-details]")).toContainText(
    "React changed this headline",
  );
  await expect(
    page.locator('[data-inspector-overlay="selected"]'),
  ).toBeVisible();
});

test("generated selectors handle escaped IDs, duplicates and relevant data attributes", async ({
  page,
}) => {
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.style.cssText = "position:fixed;top:400px;left:30px";
    fixture.innerHTML =
      '<button id="dev:test" data-example="context">Escaped ID</button><button id="duplicate">First duplicate</button><button id="duplicate">Second duplicate</button>';
    document.querySelector("#hero")?.append(fixture);
  });
  await openTools(page);
  await select(page, '[id="dev:test"]');
  const selectorField = page
    .locator("[data-inspector-details] dt")
    .filter({ hasText: /^Selector$/ })
    .locator("..")
    .locator("dd");
  expect(await selectorField.innerText()).toBe("#dev\\:test");
  await expect(page.locator("[data-inspector-details]")).toContainText(
    '"data-example": "context"',
  );
  await page.locator('[id="duplicate"]').last().click();
  const selector = await selectorField.innerText();
  expect(await page.locator(selector).count()).toBe(1);
  await expect(page.locator(selector)).toHaveText("Second duplicate");
});

test("200% text enlargement keeps toolbar controls inside a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await openTools(page, false);
  const panel = page.getByRole("complementary", { name: "Developer tools" });
  expect(await panel.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
    true,
  );
  const launcher = page.locator("[data-devtools-launcher]");
  expect(await launcher.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
    true,
  );
  const launcherBox = await launcher.boundingBox();
  const panelBox = await panel.boundingBox();
  if (!launcherBox || !panelBox) throw new Error("Toolbar controls missing");
  expect(launcherBox.x).toBeGreaterThanOrEqual(0);
  expect(launcherBox.x + launcherBox.width).toBeLessThanOrEqual(390);
  expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(launcherBox.y);
  await page.getByRole("button", { name: "Inspector: OFF" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Inspector: OFF" }),
  ).toBeVisible();
});
