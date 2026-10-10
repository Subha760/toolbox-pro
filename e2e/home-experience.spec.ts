import { test, expect } from "@playwright/test";
test("homepage search opens a real tool and animation can be paused", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Less busywork. More living." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause motion" }).click();
  await expect(
    page.getByRole("button", { name: "Play motion" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("textbox", { name: "Find a tool on the homepage" })
    .fill("passport");
  await page
    .locator(".experience-results")
    .getByRole("link", { name: /Passport.*Photo Maker/ })
    .click();
  await expect(page).toHaveURL(/tools\/passport-photo-maker\//);
});
test("homepage fits small screens and respects reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await expect(page.locator(".world-photo")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(
    await page
      .locator(".world-photo")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

test("homepage category action opens the generated directory", async ({
  page,
  request,
}) => {
  await page.goto("./");
  const link = page
    .locator(".motion-preview")
    .getByRole("link", { name: "Explore categories" });
  const href = await link.getAttribute("href");
  expect((await request.get(href!)).status()).toBe(200);
  await link.click();
  await expect(page).toHaveURL(/tools\/$/);
  await expect(page.locator(".category-sidebar")).toBeVisible();
});
