import { test, expect } from "@playwright/test";
test("startup is brief, video is absent, and sound preference is opt-in", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".startup-intro")).toHaveCount(0, {
    timeout: 3000,
  });
  await expect(page.locator("video")).toHaveCount(0);
  const button = page.getByRole("button", { name: "Startup sound: off" });
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await button.click();
  await expect(
    page.getByRole("button", { name: "Startup sound: on" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator(".startup-intro")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Startup sound: on" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Startup sound: on" }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("toolinger-startup-sound-v1"),
    ),
  ).toBe("off");
});
test("refined tool controls remain readable and usable in dark mode on phones", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("tools/case-converter/");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator(".workspace-tool-identity")).toContainText("Text");
  const textarea = page.locator(".tool-panel textarea:not([readonly])").first();
  await textarea.fill("Hello Toolinger");
  expect(
    await textarea.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(15);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
});
