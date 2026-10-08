import { expect, type Page, test } from "@playwright/test";

const toggle = (page: Page) => page.getByRole("switch", { name: "מצב מסיבה" });
const state = (page: Page) => page.locator("[data-party-state]");

async function start(page: Page) {
  await toggle(page).click();
  await expect(state(page)).toHaveAttribute("data-party-state", "active");
}

async function stop(page: Page) {
  // Resize/scroll observers can briefly retain an offscreen control.
  // Use the inline switch for cleanup; dedicated cases exercise the floating one.
  await toggle(page).scrollIntoViewIfNeeded();
  await toggle(page).click();
  await expect(state(page)).toHaveAttribute("data-party-state", "idle");
  await expect(page.locator("[data-party-effects]")).toHaveCount(0);
  await expect(page.locator("[data-party-projection]")).toHaveCount(0);
}

async function seekTags(page: Page, time: number) {
  await expect(page.locator("[data-party-video]")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await page
    .locator("[data-party-video]")
    .evaluate((video) => (video as HTMLVideoElement).pause());
  return page.locator("[data-party-tag]").evaluateAll(
    (elements, currentTime) =>
      elements.map((element) => {
        for (const animation of element.getAnimations()) {
          animation.pause();
          animation.currentTime = currentTime;
        }
        const style = getComputedStyle(element);
        const baseValue = style.getPropertyValue("--falling-transform").trim();
        const base = new DOMMatrix(
          baseValue && baseValue !== "none" ? baseValue : undefined,
        );
        const value = style.transform;
        const actual = new DOMMatrix(value === "none" ? undefined : value);
        const relative = base.inverse().multiply(actual);
        return {
          y: relative.f,
          angle: (Math.atan2(relative.b, relative.a) * 180) / Math.PI,
        };
      }),
    time,
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/he");
  await toggle(page).scrollIntoViewIfNeeded();
});

test("viewport effects rotate, preserve interaction, and restore original styles", async ({
  page,
}) => {
  const before = await page
    .locator("[data-party-react]")
    .evaluateAll((elements) =>
      elements.map((element) => ({
        style: element.getAttribute("style"),
        transform: getComputedStyle(element).transform,
        opacity: getComputedStyle(element).opacity,
        width: element.getBoundingClientRect().width,
      })),
    );
  await expect(toggle(page)).toHaveAttribute("aria-checked", "false");
  await start(page);
  await expect(toggle(page)).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[data-party-video]")).toHaveAttribute(
    "data-playing",
    "true",
  );
  const time = await page
    .locator("[data-party-video]")
    .evaluate((video) => (video as HTMLVideoElement).currentTime);
  await expect
    .poll(() =>
      page
        .locator("[data-party-video]")
        .evaluate((video) => (video as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(time + 0.3);
  const bounds = await page.locator("[data-party-effects]").boundingBox();
  expect(bounds).toEqual({ x: 0, y: 0, width: 1440, height: 1000 });
  await expect(page.locator("[data-party-effects]")).toHaveCSS(
    "pointer-events",
    "none",
  );
  await page.locator("#faq summary").first().click();
  await expect(page.locator("#faq details").first()).toHaveAttribute(
    "open",
    "",
  );
  await expect(page.locator("[data-party-off]")).toBeVisible();
  // Safari does not focus buttons on pointer click; test keyboard focus return explicitly.
  await page.locator("[data-party-off]").focus();
  await page.keyboard.press("Enter");
  await expect(state(page)).toHaveAttribute("data-party-state", "idle");
  await expect(page.locator("[data-party-effects]")).toHaveCount(0);
  const after = await page
    .locator("[data-party-react]")
    .evaluateAll((elements) =>
      elements.map((element) => ({
        style: element.getAttribute("style"),
        transform: getComputedStyle(element).transform,
        opacity: getComputedStyle(element).opacity,
        width: element.getBoundingClientRect().width,
      })),
    );
  expect(after).toEqual(before);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("rapid reversals cannot leave stale effects or transforms", async ({
  page,
}) => {
  for (let index = 0; index < 7; index++) {
    await toggle(page).click();
    await page.waitForTimeout(90);
  }
  await expect(state(page)).toHaveAttribute("data-party-state", "active");
  await toggle(page).click();
  await page.waitForTimeout(220);
  await toggle(page).click();
  await expect(state(page)).toHaveAttribute("data-party-state", "active");
  await stop(page);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test("the selected video format preserves real alpha transparency", async ({
  page,
}) => {
  await start(page);
  await expect(page.locator("[data-party-video]")).toHaveAttribute(
    "data-playing",
    "true",
  );
  const alpha = await page.locator("[data-party-video]").evaluate((element) => {
    const video = element as HTMLVideoElement;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(video, 0, 0);
    return {
      corner: context.getImageData(0, 0, 1, 1).data[3],
      center: context.getImageData(canvas.width / 2, canvas.height / 2, 1, 1)
        .data[3],
    };
  });
  expect(alpha.corner).toBe(0);
  expect(alpha.center).toBeGreaterThan(240);
  await stop(page);
});

test("keyboard switch and reduced motion retain the visual mode without loops", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await toggle(page).focus();
  await page.keyboard.press("Space");
  await expect(state(page)).toHaveAttribute("data-party-state", "active");
  await expect(page.locator("[data-party-rig]")).toHaveCSS("transform", "none");
  expect(
    await page
      .locator("[data-party-video]")
      .evaluate((video) => (video as HTMLVideoElement).paused),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect?.getTiming().iterations === Infinity,
          ).length,
    ),
  ).toBe(0);
  await page.keyboard.press("Enter");
  await expect(state(page)).toHaveAttribute("data-party-state", "idle");
});

test("changing motion preference cancels active spatial animation", async ({
  page,
}) => {
  await start(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(state(page)).toHaveAttribute("data-party-state", "active");
  await expect(page.locator("[data-party-rig]")).toHaveCSS("transform", "none");
  expect(
    await page
      .locator("[data-party-video]")
      .evaluate((video) => (video as HTMLVideoElement).paused),
  ).toBe(true);
  await stop(page);
});

test("backgrounding pauses loops without replaying the completed entrance", async ({
  page,
}) => {
  await start(page);
  await expect(page.locator("[data-party-video]")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const time = await page
    .locator("[data-party-video]")
    .evaluate((video) => (video as HTMLVideoElement).currentTime);
  await page.waitForTimeout(250);
  expect(
    await page
      .locator("[data-party-video]")
      .evaluate((video) => (video as HTMLVideoElement).currentTime),
  ).toBe(time);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const rigAnimation = await page
    .locator("[data-party-rig]")
    .evaluate((rig) => rig.getAnimations()[0].playState);
  expect(rigAnimation).toBe("finished");
  await expect(state(page)).toHaveAttribute("data-party-state", "active");
  await stop(page);
});

test("initial reduced motion downloads only the still ball", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const mediaRequests: string[] = [];
  page.on("request", (request) => {
    if (/party-mode\/.*\.(webm|mov)$/.test(request.url()))
      mediaRequests.push(request.url());
  });
  await page.reload();
  await start(page);
  expect(mediaRequests).toEqual([]);
  await stop(page);
});

test("failed video preserves the poster; missing ball media restores NORMAL", async ({
  page,
}) => {
  await page.route("**/party-mode/*.{webm,mov}", (route) => route.abort());
  await start(page);
  await expect(page.locator("[data-party-poster]")).toBeVisible();
  await expect(page.locator("[data-party-video]")).not.toHaveAttribute(
    "data-playing",
    "true",
  );
  await stop(page);
  await page.route("**/party-mode/disco-ball.webp", (route) => route.abort());
  await page.reload();
  await toggle(page).click();
  await expect(state(page)).toHaveAttribute("data-party-state", "idle");
  await expect(toggle(page)).toHaveAttribute("aria-checked", "false");
  await expect(
    page.getByRole("status").filter({ hasText: "לא ניתן לטעון" }),
  ).toBeVisible();
});

test("navigation and reload do not retain Party Mode", async ({ page }) => {
  await start(page);
  await page.goto("/he/fonts");
  await expect(page.locator("[data-party-effects]")).toHaveCount(0);
  await page.goto("/he");
  await expect(toggle(page)).toHaveAttribute("aria-checked", "false");
  await start(page);
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-checked", "false");
});

test("mobile uses fewer lights, preserves touch scrolling and menu behavior", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  const visibleDots = await page
    .locator("[data-party-reflection]")
    .evaluateAll(
      (elements) =>
        elements.filter(
          (element) => getComputedStyle(element).display !== "none",
        ).length,
    );
  const visibleBeams = await page
    .locator("[data-party-beam]")
    .evaluateAll(
      (elements) =>
        elements.filter(
          (element) => getComputedStyle(element).display !== "none",
        ).length,
    );
  expect(visibleDots).toBe(10);
  expect(visibleBeams).toBe(2);
  await expect(page.locator("[data-party-rig]")).toHaveCSS("width", "77px");
  await expect(page.locator("[data-party-video]")).toHaveAttribute(
    "src",
    /-mobile\.(webm|mov)$/,
  );
  await page.locator(".mobile-menu-toggle").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "קצת עליי" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(state(page)).toHaveAttribute("data-party-state", "active");
  await expect(page.locator("[data-party-off]")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await stop(page);
});

test("resizing an active scene changes media without replaying the entrance", async ({
  page,
}) => {
  await start(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(state(page)).toHaveAttribute("data-party-state", "active");
  await expect(page.locator("[data-party-video]")).toHaveAttribute(
    "src",
    /-mobile\.(webm|mov)$/,
  );
  await expect(page.locator("[data-party-video]")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await stop(page);
});

test("200% text enlargement keeps both switch labels whole and contained", async ({
  page,
}) => {
  // Activate before mutating the document so hydration sees the server attributes.
  await start(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await toggle(page).scrollIntoViewIfNeeded();
    if (width === 390)
      await expect(page.locator("[data-party-rig]")).toHaveCSS("width", "77px");
    await expect
      .poll(() =>
        toggle(page).evaluate((button) => {
          const bounds = button.getBoundingClientRect();
          const indicator = button.children[0].getBoundingClientRect();
          return (
            button.scrollWidth <= button.clientWidth &&
            indicator.left >= bounds.left &&
            indicator.right <= bounds.right &&
            indicator.top >= bounds.top &&
            indicator.bottom <= bounds.bottom &&
            [...button.children]
              .slice(1)
              .every((label) => label.scrollWidth <= label.clientWidth)
          );
        }),
      )
      .toBe(true);
  }
  await stop(page);
});

test("two colored tag fills rotate, keep contrast, and restore their original styles", async ({
  page,
}) => {
  const tags = page.locator("[data-party-tag]");
  const read = () =>
    tags.evaluateAll((elements) => {
      // WAAPI can serialize a neutral color-mix as oklab instead of srgb.
      // Compare rendered RGB values, rather than those equivalent strings.
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      const rgb = (color: string) => {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      return elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundColor: rgb(style.backgroundColor),
          color: rgb(style.color),
        };
      });
    });
  const normal = await read();
  const attributes = await tags.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("style")),
  );
  await start(page);
  await expect(page.locator("[data-party-video]")).toHaveAttribute(
    "data-playing",
    "true",
  );
  const seekColors = async (time: number) => {
    await tags.evaluateAll((elements, currentTime) => {
      for (const element of elements)
        for (const animation of element.getAnimations())
          animation.currentTime = currentTime;
    }, time);
  };
  await seekColors(1500);
  const first = await read();
  expect(
    first.flatMap((style, index) =>
      style.backgroundColor.join() !== normal[index].backgroundColor.join()
        ? [index]
        : [],
    ),
  ).toEqual([0, 4]);
  await seekColors(7500);
  const second = await read();
  expect(
    second.flatMap((style, index) =>
      style.backgroundColor.join() !== normal[index].backgroundColor.join()
        ? [index]
        : [],
    ),
  ).toEqual([1, 5]);
  const ratios = await tags.evaluateAll((elements) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    const luminance = (color: string) => {
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data]
        .slice(0, 3)
        .map((channel) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        })
        .reduce(
          (total, value, index) =>
            total + value * [0.2126, 0.7152, 0.0722][index],
          0,
        );
    };
    return elements.map((element) => {
      const style = getComputedStyle(element);
      const foreground = luminance(style.color),
        background = luminance(style.backgroundColor);
      return (
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05)
      );
    });
  });
  expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
  await stop(page);
  expect(await read()).toEqual(normal);
  // Physics may update its own transform variable, but Party never adds inline colors.
  expect(
    await tags.evaluateAll((elements) =>
      elements.some(
        (element) =>
          (element as HTMLElement).style.backgroundColor ||
          (element as HTMLElement).style.color,
      ),
    ),
  ).toBe(false);
  expect(
    attributes.every(
      (attribute) => !attribute || !/background|color/.test(attribute),
    ),
  ).toBe(true);
});

test("heading projections share the ball origin without changing accessible names", async ({
  page,
}) => {
  const heading = page.getByRole("heading", {
    level: 2,
    name: "פרויקטים",
    exact: true,
  });
  await start(page);
  await expect(heading).toHaveCount(1);
  await expect(page.locator("[data-party-projection]")).toHaveCount(2);
  await heading.scrollIntoViewIfNeeded();
  const readGeometry = () =>
    page.evaluate(() => {
      const rig = document.querySelector<HTMLElement>("[data-party-rig]");
      const effects = document.querySelector<HTMLElement>(
        "[data-party-effects]",
      );
      const light = document.querySelector<HTMLElement>(
        "#projects-heading [data-party-heading-light='0']",
      );
      if (!rig || !effects || !light) throw new Error("Missing geometry");
      const bounds = rig.getBoundingClientRect();
      const apex = getComputedStyle(light).clipPath.match(
        /polygon\(([-\d.]+)px ([-\d.]+)px/,
      );
      const rect = light.getBoundingClientRect();
      return {
        centerX: bounds.left + bounds.width / 2,
        anchorX: Number.parseFloat(
          effects.style.getPropertyValue("--party-anchor-x"),
        ),
        apexX: apex ? Number(apex[1]) + rect.left : NaN,
        apexY: apex ? Number(apex[2]) + rect.top : NaN,
        anchorY: Number.parseFloat(
          effects.style.getPropertyValue("--party-anchor-y"),
        ),
        mask: getComputedStyle(
          document.querySelector<HTMLElement>(
            "[data-party-beams]",
          ) as HTMLElement,
        ).maskImage,
      };
    });
  await expect
    .poll(async () => {
      const geometry = await readGeometry();
      return Math.max(
        Math.abs(geometry.apexX - geometry.anchorX),
        Math.abs(geometry.apexY - geometry.anchorY),
      );
    })
    .toBeLessThan(4);
  const geometry = await readGeometry();
  expect(geometry.centerX).toBeCloseTo(1440 * 0.4, 0);
  expect(Math.abs(geometry.apexX - geometry.anchorX)).toBeLessThan(4);
  expect(Math.abs(geometry.apexY - geometry.anchorY)).toBeLessThan(4);
  expect(geometry.mask).toContain("data:image/svg+xml");
  await stop(page);
});

test("the active toggle stays readable with all three beams overlapping", async ({
  page,
}) => {
  await start(page);
  const ratio = await page.evaluate(async () => {
    const control = document.querySelector<HTMLElement>("[data-party-toggle]");
    const beams = document.querySelector<HTMLElement>("[data-party-beams]");
    const atmosphere = document.querySelector<HTMLElement>(
      "[data-party-atmosphere]",
    );
    if (!control || !beams || !atmosphere)
      throw new Error("Missing colored controls");
    const label = control.lastElementChild as HTMLElement;
    const selection = control.firstElementChild as HTMLElement;
    const canvas = document.createElement("canvas");
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    const image = new Image();
    const source = beams.style.maskImage.match(/^url\("(.*)"\)$/)?.[1];
    if (!source) throw new Error("Missing readability mask");
    image.src = source;
    await image.decode();
    context.drawImage(image, 0, 0);
    const bounds = label.getBoundingClientRect();
    const mask =
      context.getImageData(
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2,
        1,
        1,
      ).data[0] / 255;
    const rgb = (color: string) => {
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const mix = (base: number[], light: number[], opacity: number) =>
      base.map(
        (channel, index) => channel * (1 - opacity) + light[index] * opacity,
      );
    const layers = [
      {
        color: rgb(getComputedStyle(atmosphere).backgroundColor),
        opacity: Number(getComputedStyle(atmosphere).opacity),
      },
      ...[...beams.children].map((beam) => ({
        color: rgb(getComputedStyle(beam).backgroundColor),
        opacity: Number(getComputedStyle(beam).opacity) * mask,
      })),
    ];
    // Conservatively composite every cone at full strength at this label.
    // The real cones usually overlap fewer times, and use a multiply blend.
    const composite = (color: string) =>
      layers.reduce(
        (base, layer) => mix(base, layer.color, layer.opacity),
        rgb(color),
      );
    const luminance = (channels: number[]) =>
      channels
        .map((channel) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        })
        .reduce(
          (total, value, index) =>
            total + value * [0.2126, 0.7152, 0.0722][index],
          0,
        );
    const foreground = luminance(composite(getComputedStyle(label).color));
    const background = luminance(
      composite(getComputedStyle(selection).backgroundColor),
    );
    return (
      (Math.max(foreground, background) + 0.05) /
      (Math.min(foreground, background) + 0.05)
    );
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
  await stop(page);
});

test("reduced motion keeps a fixed colored tag pair and the stronger toggle state", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const normal = await page
    .locator("[data-party-tag]")
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).backgroundColor),
    );
  await start(page);
  const colors = () =>
    page
      .locator("[data-party-tag]")
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).backgroundColor),
      );
  const first = await colors();
  expect(
    first.flatMap((color, index) => (color !== normal[index] ? [index] : [])),
  ).toEqual([0, 4]);
  await page.waitForTimeout(250);
  expect(await colors()).toEqual(first);
  await expect(page.locator("[data-party-atmosphere]")).toHaveCSS(
    "opacity",
    "0.03",
  );
  await expect(toggle(page)).toHaveAttribute("data-enabled", "true");
  expect(
    await page.evaluate(() =>
      document
        .getAnimations()
        .some(
          (animation) => animation.effect?.getTiming().iterations === Infinity,
        ),
    ),
  ).toBe(false);
  await stop(page);
  expect(await colors()).toEqual(normal);
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("--party-cyan"),
    ),
  ).toBe("");
});

test("the colored tag pair dances and hands its groove to the next pair", async ({
  page,
}) => {
  await start(page);
  const moving = (poses: { y: number; angle: number }[]) =>
    poses.flatMap((pose, index) =>
      Math.abs(pose.y) > 0.1 || Math.abs(pose.angle) > 0.1 ? [index] : [],
    );
  const first = await seekTags(page, 1500);
  expect(moving(first)).toEqual([0, 4]);
  expect(first[0].y).toBeLessThan(-1);
  expect(first[4].y).toBeLessThan(-1);
  expect(Math.abs(first[0].y - first[4].y)).toBeGreaterThan(0.5);
  expect(moving(await seekTags(page, 7500))).toEqual([1, 5]);
  expect(moving(await seekTags(page, 5600))).toEqual([]);
  await seekTags(page, 1500);
  await stop(page);
  const restored = await page
    .locator("[data-party-tag]")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        const physics = style.getPropertyValue("--falling-transform").trim();
        const base = new DOMMatrix(
          physics && physics !== "none" ? physics : undefined,
        );
        const actual = new DOMMatrix(
          style.transform === "none" ? undefined : style.transform,
        );
        return {
          animations: element.getAnimations().length,
          inline: (element as HTMLElement).style.transform,
          error: Math.max(
            ...["a", "b", "c", "d", "e", "f"].map((key) =>
              Math.abs(
                (base[key as keyof DOMMatrix] as number) -
                  (actual[key as keyof DOMMatrix] as number),
              ),
            ),
          ),
        };
      }),
    );
  expect(
    restored.every(
      (tag) => tag.animations === 0 && tag.inline === "" && tag.error < 0.001,
    ),
  ).toBe(true);
});

test("dancing preserves live physics transforms and suspends for mouse dragging", async ({
  page,
}) => {
  await start(page);
  await seekTags(page, 1500);
  const tag = page.locator("[data-party-tag='0']");
  const composed = await tag.evaluate((element) => {
    const html = element as HTMLElement;
    const saved = html.style.getPropertyValue("--falling-transform");
    const sample = (x: number) => {
      html.style.setProperty(
        "--falling-transform",
        `translate(${x}px, 20px) rotate(10deg)`,
      );
      return new DOMMatrix(getComputedStyle(element).transform);
    };
    const first = sample(100),
      second = sample(200);
    if (saved) html.style.setProperty("--falling-transform", saved);
    else html.style.removeProperty("--falling-transform");
    return {
      dx: second.e - first.e,
      dy: second.f - first.f,
      angle: (Math.atan2(first.b, first.a) * 180) / Math.PI,
    };
  });
  expect(composed.dx).toBeCloseTo(100, 2);
  expect(composed.dy).toBeCloseTo(0, 2);
  expect(Math.abs(composed.angle - 10)).toBeGreaterThan(0.5);
  await expect(page.locator("[data-party-tags]")).not.toHaveAttribute(
    "data-falling-state",
    "static",
  );
  const bounds = await tag.boundingBox();
  if (!bounds) throw new Error("Missing dancing tag bounds");
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await expect(page.locator("[data-party-tags]")).toHaveAttribute(
    "data-dragging",
    "true",
  );
  const count = () =>
    page
      .locator("[data-party-tag]")
      .evaluateAll(
        (elements) =>
          elements
            .flatMap((element) => element.getAnimations())
            .filter((animation) => animation.id === "party-tag-dance").length,
      );
  expect(await count()).toBe(0);
  await page.mouse.move(
    bounds.x + bounds.width / 2 - 25,
    bounds.y + bounds.height / 2 - 20,
    { steps: 6 },
  );
  await page.mouse.up();
  await expect(page.locator("[data-party-tags]")).not.toHaveAttribute(
    "data-dragging",
    "true",
  );
  await expect.poll(count).toBe(8);
  await stop(page);
});

test("the tag dance pauses while hidden and cancels offscreen or with reduced motion", async ({
  page,
}) => {
  await start(page);
  const danceStates = () =>
    page.locator("[data-party-tag]").evaluateAll((elements) =>
      elements
        .flatMap((element) => element.getAnimations())
        .filter((animation) => animation.id === "party-tag-dance")
        .map((animation) => animation.playState),
    );
  await expect.poll(danceStates).toHaveLength(8);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect((await danceStates()).every((state) => state === "paused")).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect((await danceStates()).every((state) => state === "running")).toBe(
    true,
  );
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect.poll(danceStates).toHaveLength(0);
  await toggle(page).scrollIntoViewIfNeeded();
  await expect.poll(danceStates).toHaveLength(8);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(state(page)).toHaveAttribute("data-party-state", "active");
  expect(await danceStates()).toEqual([]);
  await stop(page);
});

test("compact tags use gentler hops and update when the viewport changes", async ({
  page,
}) => {
  await start(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await toggle(page).scrollIntoViewIfNeeded();
  await expect(page.locator("[data-party-video]")).toHaveAttribute(
    "src",
    /-mobile\.(webm|mov)$/,
  );
  const first = await seekTags(page, 1440);
  expect(first[0].y).toBeCloseTo(-4, 1);
  expect(Math.abs(first[0].angle)).toBeCloseTo(2, 1);
  expect(Math.abs(first[4].y)).toBeLessThan(0.1);
  expect((await seekTags(page, 1890))[4].y).toBeCloseTo(-4, 1);
  await stop(page);
});
