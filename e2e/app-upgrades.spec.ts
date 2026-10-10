import { test, expect } from "@playwright/test";
test("quick search works from a tool, handles no results and restores focus", async ({
  page,
}) => {
  await page.goto("tools/word-counter/");
  await expect(
    page.getByRole("button", { name: "Quick tool search" }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "What do you need?" }),
  ).toBeVisible();
  await page.getByLabel("Find a tool quickly").fill("passport");
  await expect(page.locator(".quick-results")).toContainText(
    "Passport & ID Photo Maker",
  );
  await page.getByLabel("Find a tool quickly").fill("nonexistent-tool-xyz");
  await expect(page.locator(".quick-results")).toContainText(
    "No matching tools",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Quick tool search" }),
  ).toBeFocused();
});
test("everyday cost estimates calculate and reject invalid efficiency", async ({
  page,
}) => {
  await page.goto("daily/");
  const panel = page.locator(".daily-costs");
  await expect(panel).toContainText("15,000.00");
  await panel.getByRole("button", { name: "Fuel cost", exact: true }).click();
  await page.getByLabel("Total journey distance (km)").fill("30");
  await expect(panel.locator(".cost-total")).toContainText("200.00");
  await page.getByLabel("Vehicle efficiency (km/litre)").fill("0");
  await expect(panel).toContainText("Efficiency must be greater than zero");
  await panel.getByRole("button", { name: "Electricity", exact: true }).click();
  await expect(panel.locator(".cost-total")).toContainText("480.00");
  await page.getByLabel("Hours used per day").fill("25");
  await expect(panel).toContainText("at most 24 hours");
});
