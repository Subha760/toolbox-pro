import { test, expect } from "@playwright/test";
const dashboard = {
  totals: { visitors: 3, opens: 9, attempts: 4 },
  returning: 1,
  daily: [{ day: "2026-10-09", events: 13, visitors: 3 }],
  tools: [{ tool: "passport-photo-maker", opens: 9, attempts: 4 }],
  visitors: [
    {
      visitor: "test-browser-123",
      first_seen: "2026-10-08",
      last_seen: "2026-10-09",
      actions: 13,
      tools: 1,
    },
  ],
  reports: [
    {
      id: "report1",
      tool: "passport-photo-maker",
      kind: "bug",
      message: "The background still has some visible edges.",
      email: "",
      status: "open",
      note: "",
      created: "2026-10-09",
    },
  ],
  settings: {
    tools: {},
    ads: {
      enabled: false,
      publisherId: "",
      slots: { directory: "", tool: "", guide: "" },
      requireCertifiedCmp: true,
    },
    announcement: { text: "", enabled: false },
  },
  audit: [],
  days: 30,
};
test("owner console displays real API values, edits reports and saves ad configuration", async ({
  page,
}) => {
  const writes: any[] = [];
  await page.route("https://tools.choicematrix.in/api/**", async (route) => {
    const r = route.request();
    if (r.method() === "POST") {
      writes.push(r.postDataJSON());
      await route.fulfill({ json: { ok: true } });
    } else await route.fulfill({ json: dashboard });
  });
  await page.goto("admin/");
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Consented visitors", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reports", exact: false }).click();
  await expect(
    page.getByText("The background still has some visible edges."),
  ).toBeVisible();
  await page.getByLabel("Status").selectOption("resolved");
  await page.getByLabel("Private note").fill("Verified fix");
  await page.getByRole("button", { name: "Save report" }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toEqual({
    id: "report1",
    status: "resolved",
    note: "Verified fix",
  });
  await page.getByRole("button", { name: "Advertising", exact: false }).click();
  await page.getByLabel("Publisher ID").fill("ca-pub-1234567890123456");
  await page.getByLabel("tool slot ID").fill("123456");
  await page.getByRole("button", { name: "Save ad settings" }).click();
  await expect.poll(() => writes.length).toBe(2);
  expect(writes[1].value.enabled).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("owner console does not expose dashboard data without a session", async ({
  page,
}) => {
  await page.route("https://tools.choicematrix.in/api/**", (route) =>
    route.fulfill({ status: 401, json: { error: "Sign in required" } }),
  );
  await page.goto("admin/");
  await expect(
    page.getByRole("heading", { name: "Owner sign-in required" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open secure sign-in" }),
  ).toHaveAttribute("href", "https://tools.choicematrix.in/admin/");
  await expect(
    page.getByText("Consented visitors", { exact: true }),
  ).toHaveCount(0);
});
test("tool icons represent their functions and reporting avoids attaching inputs", async ({
  page,
}) => {
  await page.goto("tools/");
  const qr = page
    .locator(".catalog-card")
    .filter({
      has: page.getByRole("heading", {
        name: "QR Code Generator",
        exact: true,
      }),
    });
  const photo = page
    .locator(".catalog-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Passport & ID Photo Maker",
        exact: true,
      }),
    });
  expect(await qr.locator(".tool-icon").innerHTML()).not.toEqual(
    await photo.locator(".tool-icon").innerHTML(),
  );
  let report: any;
  await page.route(
    "https://tools.choicematrix.in/api/report",
    async (route) => {
      report = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { ok: true, id: "newreport" } });
    },
  );
  await page.goto("tools/word-counter/");
  await page
    .getByRole("button", { name: "Report a problem / suggest a feature" })
    .click();
  await page
    .getByLabel("What happened?")
    .fill("The counter does not update in my browser.");
  await page.getByRole("button", { name: "Send report", exact: true }).click();
  await expect(page.getByText("Report received. Thank you.")).toBeVisible();
  expect(report.tool).toBe("word-counter");
  expect(report).not.toHaveProperty("input");
});
