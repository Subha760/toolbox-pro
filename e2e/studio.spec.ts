import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
test("portrait matting runs locally and studio colours reach the downloaded preview", async ({
  page,
}) => {
  test.setTimeout(90000);
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173") &&
      !/^(data|blob):/.test(r.url())
    )
      external.push(r.url());
  });
  await page.goto("tools/passport-photo-maker/");
  await page
    .getByLabel("Choose portrait")
    .setInputFiles(resolve("e2e/fixtures/astronaut.png"));
  await expect(page.getByAltText("Passport preview")).toBeVisible();
  await page
    .getByRole("button", { name: "Remove Background with AI", exact: true })
    .click();
  await expect(page.getByAltText("AI background removed")).toBeVisible({
    timeout: 75000,
  });
  await page.getByRole("button", { name: "Navy blue", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true }),
  ).toBeEnabled();
  const bluePixels = () =>
    page.getByAltText("Passport preview").evaluate((img: HTMLImageElement) => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const x = c.getContext("2d")!;
      x.drawImage(img, 0, 0);
      const p = x.getImageData(0, 0, c.width, c.height).data;
      let blue = 0;
      for (let i = 0; i < p.length; i += 4)
        if (p[i] === 22 && p[i + 1] === 58 && p[i + 2] === 112) blue++;
      return blue / (c.width * c.height);
    });
  await expect.poll(bluePixels).toBeGreaterThan(0.04);
  await page.getByRole("button", { name: "Red", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Download JPG", exact: true }),
  ).toBeEnabled();
  await expect.poll(bluePixels).toBeLessThan(0.01);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("toolinger-passport.png");
  expect(external).toEqual([]);
});
test("plain-wall removal and automatic framing work without AI downloads", async ({
  page,
}) => {
  await page.goto("tools/passport-photo-maker/");
  const buffer = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 400;
      const x = c.getContext("2d")!;
      x.fillStyle = "#ddd";
      x.fillRect(0, 0, 320, 400);
      x.fillStyle = "#633b28";
      x.beginPath();
      x.ellipse(160, 140, 60, 90, 0, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = "#264635";
      x.fillRect(70, 250, 180, 150);
      return c.toDataURL().split(",")[1];
    }),
    "base64",
  );
  await page
    .getByLabel("Choose portrait")
    .setInputFiles({ name: "camera.png", mimeType: "", buffer });
  await expect(page.getByAltText("Passport preview")).toBeVisible();
  await page.getByRole("button", { name: "Remove plain background" }).click();
  await expect(page.getByAltText("AI background removed")).toBeVisible();
  await page.getByRole("button", { name: "Red", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Download JPG", exact: true }),
  ).toBeEnabled();
  const first = await page.getByAltText("Passport preview").getAttribute("src");
  await page.getByLabel("Horizontal position").fill("80");
  await expect
    .poll(() => page.getByAltText("Passport preview").getAttribute("src"))
    .not.toBe(first);
});
test("photo errors do not leave unusable colour controls or spinning buttons", async ({
  page,
}) => {
  await page.goto("tools/passport-photo-maker/");
  await page
    .getByLabel("Choose portrait")
    .setInputFiles({
      name: "broken.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("not an image"),
    });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Remove Background with AI",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Download JPG", exact: true }),
  ).toBeDisabled();
});
test("workbench theme and photo studio fit phones in light and dark modes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "./",
    "tools/",
    "daily/",
    "tools/passport-photo-maker/",
    "guides/",
    "privacy/",
  ]) {
    await page.goto(path);
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      path,
    ).toBe(390);
  }
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "test-results/workbench-mobile-dark.png",
    fullPage: true,
  });
});
