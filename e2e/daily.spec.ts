import { test, expect } from "@playwright/test";
const go = async (page: any, id: string) => {
  await page.goto(`tools/${id}/`);
  await expect(page.getByTestId("tool-content")).toBeVisible();
};
test("daily planner persists, updates dashboard and exports", async ({
  page,
}) => {
  await go(page, "daily-planner");
  await page.getByLabel("Task", { exact: true }).fill("Buy groceries");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page.reload();
  await expect(page.locator(".daily-list")).toContainText("Buy groceries");
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await d).suggestedFilename()).toBe("tasks.csv");
  await page.goto("daily/");
  await expect(page.locator(".hub-panel").first()).toContainText(
    "Buy groceries",
  );
  await go(page, "daily-planner");
  await page.locator(".daily-list input[type=checkbox]").check();
  await expect(page.locator(".tool-stat-row")).toContainText("completed");
});
test("habits persist today completion", async ({ page }) => {
  await go(page, "habit-tracker");
  await page.getByLabel("New habit").fill("Read");
  await page.getByRole("button", { name: "Add habit", exact: true }).click();
  await page.getByRole("button", { name: "Mark done today" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Done today ✓" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".habit-card")).toContainText("1 day streak");
});
test("expense tracker stores cents and exports", async ({ page }) => {
  await go(page, "expense-tracker");
  await page.getByLabel("Expense", { exact: true }).fill("Lunch");
  await page.getByLabel("Amount", { exact: true }).fill("19.99");
  await page.getByRole("button", { name: "Add expense", exact: true }).click();
  await page.reload();
  await expect(page.locator(".daily-list")).toContainText("19.99");
  await expect(page.locator(".tool-stat-row")).toContainText("19.99");
});
test("shopping list counts quantity and persists checks", async ({ page }) => {
  await go(page, "shopping-list");
  await page.getByLabel("Item", { exact: true }).fill("Milk");
  await page.getByLabel("Quantity", { exact: true }).fill("2");
  await page.getByLabel("Price per item").fill("3.25");
  await page.getByRole("button", { name: "Add to list" }).click();
  await expect(page.locator(".tool-stat-row")).toContainText("6.50");
  await page.locator(".daily-list input").check();
  await page.reload();
  await expect(page.locator(".daily-list input")).toBeChecked();
});
test("focus timer starts pauses and resets", async ({ page }) => {
  await go(page, "focus-timer");
  await page.getByLabel("Session length (minutes)").fill("1");
  await page.getByRole("button", { name: "Start timer" }).click();
  await expect(page.getByRole("timer")).not.toHaveText("01:00", {
    timeout: 4000,
  });
  await page.getByRole("button", { name: "Pause timer" }).click();
  const paused = await page.getByRole("timer").innerText();
  await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible();
  await page.getByRole("button", { name: "Reset timer" }).click();
  await expect(page.getByRole("timer")).toHaveText("01:00");
  expect(paused).not.toBe("01:00");
});
test("water log survives reload and supports undo", async ({ page }) => {
  await go(page, "hydration-tracker");
  await page.getByRole("button", { name: "Add 250 ml" }).click();
  await page.reload();
  await expect(page.locator(".water-summary")).toContainText("250");
  await page.getByRole("button", { name: "Undo last drink" }).click();
  await expect(page.locator(".water-summary strong")).toContainText("0");
});
test("meal planner feeds the shared shopping list without duplicates", async ({
  page,
}) => {
  await go(page, "meal-planner");
  await page.getByLabel("Monday breakfast").fill("Oats");
  await page
    .getByLabel("Ingredients to buy (one per line)")
    .fill("Milk\nMilk\nOats");
  await page
    .getByRole("button", { name: "Add ingredients to shopping list" })
    .click();
  await expect(page.getByTestId("tool-content")).toContainText(
    "2 ingredients added",
  );
  await go(page, "shopping-list");
  await expect(page.locator(".daily-list li")).toHaveCount(2);
  await go(page, "meal-planner");
  await expect(page.getByLabel("Monday breakfast")).toHaveValue("Oats");
});
for (const [id, button, expected] of [
  ["savings-goal", "Calculate", "Monthly contributions needed: 18"],
  ["split-bill", "Calculate", "Person 3: 366.66"],
  ["recipe-scaler", "Scale recipe", "1 cup rice"],
  ["date-calculator", "Calculate dates", "Days between: 7"],
  ["unit-price-comparison", "Calculate", "Package B costs less per unit"],
])
  test(`${id}: useful calculation`, async ({ page }) => {
    await go(page, id);
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(page.locator(".daily-result")).toContainText(expected);
    await expect(
      page.getByRole("button", { name: "Download result" }),
    ).toBeVisible();
  });
test("world clock adds and removes time zones", async ({ page }) => {
  await go(page, "world-clock");
  await page
    .getByLabel("Time zone", { exact: true })
    .selectOption("Asia/Tokyo");
  await page.getByRole("button", { name: "Add city" }).click();
  await expect(page.locator(".clock-grid article")).toHaveCount(4);
  await page
    .locator(".clock-grid article")
    .last()
    .getByRole("button", { name: "Remove city" })
    .click();
  await expect(page.locator(".clock-grid article")).toHaveCount(3);
});
test("packing essentials do not duplicate", async ({ page }) => {
  await go(page, "packing-checklist");
  await page.getByRole("button", { name: "Add travel essentials" }).click();
  await page.getByRole("button", { name: "Add travel essentials" }).click();
  await expect(page.locator(".daily-list li")).toHaveCount(6);
  await page.getByLabel("Item to pack").fill("Sunglasses");
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(page.locator(".daily-list li")).toHaveCount(7);
});
test("backup validation and reviewed restore preserve data", async ({
  page,
}) => {
  await page.goto("my-space/");
  const upload = page.getByLabel("Restore a Toolinger backup");
  await upload.setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "toolinger-backup",
        version: 1,
        data: { tasks: [{ title: "bad" }] },
      }),
    ),
  });
  await expect(page.locator(".my-space")).toContainText("Nothing was imported");
  await expect(
    page.getByRole("button", { name: "Restore these sections" }),
  ).toHaveCount(0);
  await upload.setInputFiles({
    name: "good.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "toolinger-backup",
        version: 1,
        data: {
          tasks: [
            {
              id: "one",
              title: "Restored task",
              done: false,
              due: "",
              priority: "Normal",
            },
          ],
        },
      }),
    ),
  });
  await page.getByRole("button", { name: "Restore these sections" }).click();
  await go(page, "daily-planner");
  await expect(page.locator(".daily-list")).toContainText("Restored task");
  await page.goto("my-space/");
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  expect((await d).suggestedFilename()).toMatch(/backup/);
  await page
    .getByRole("button", { name: "Clear daily data", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm clear daily data" }).click();
  await go(page, "daily-planner");
  await expect(page.locator(".daily-list li")).toHaveCount(0);
});
test("all standalone pages have metadata and public routes", async ({
  request,
}) => {
  const routes = await (await request.get("routes.json")).json();
  expect(routes.length).toBeGreaterThan(160);
  for (const route of routes) {
    const r = await request.get(route.path ? route.path + "/" : "./");
    expect(r.status(), route.path).toBe(200);
    const html = await r.text();
    expect(html).toContain('<link rel="canonical"');
    expect(html).toContain(route.title.replaceAll("&", "&amp;"));
  }
});
test("policies and guides remain readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/toolbox-pro/privacy/");
  await expect(page.locator("main")).toContainText("Google AdSense");
  await page.goto(
    "http://127.0.0.1:4173/toolbox-pro/guides/prepare-an-id-photo/",
  );
  await expect(page.locator("main h2").first()).toBeVisible();
  await context.close();
});
test("advertising stays disabled and privacy choice persists", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/googlesyndication|doubleclick/.test(r.url())) requests.push(r.url());
  });
  await page.goto("tools/");
  await page
    .getByRole("button", { name: "Ad privacy choices", exact: true })
    .click();
  await expect(page.locator(".consent-panel")).toContainText(
    "Advertising is currently disabled",
  );
  await page.getByRole("button", { name: "Necessary only" }).click();
  await expect(page.locator(".consent-panel")).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("toolinger-ad-consent-v1")!)
          .advertising,
    ),
  ).toBe(false);
});
test("multipage navigation and mobile daily workspace", async ({ page }) => {
  await page.goto("./");
  await page
    .locator(".header-nav")
    .getByRole("link", { name: "Daily life", exact: true })
    .click();
  await expect(page).toHaveURL(/daily\/$/);
  await page.goBack();
  await expect(page.locator(".experience")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await go(page, "meal-planner");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: "test-results/daily-mobile.png",
    fullPage: true,
  });
});

test("configured ads still require a certified CMP signal", async ({
  page,
}) => {
  const adRequests: string[] = [];
  page.on("request", (r) => {
    if (/googlesyndication|doubleclick/.test(r.url())) adRequests.push(r.url());
  });
  await page.route("**/ad-config.json", (route) =>
    route.fulfill({
      json: {
        enabled: true,
        provider: "adsense",
        publisherId: "ca-pub-1234567890123456",
        slots: { directory: "1234567890" },
        requireCertifiedCmp: true,
      },
    }),
  );
  await page.goto("tools/");
  await expect(page.locator(".consent-panel")).toBeVisible();
  await page
    .getByRole("button", { name: "Allow advertising", exact: true })
    .click();
  await expect(page.locator(".consent-panel")).toHaveCount(0);
  await expect(page.locator(".ad-placement")).toHaveCount(0);
  expect(adRequests).toEqual([]);
});
