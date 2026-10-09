import { test, expect, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
const source = readFileSync("src/catalog.ts", "utf8");
const tools = [
  ...source.matchAll(
    /\{ id: "([^"]+)", name: "([^"]+)", category: "([^"]+)", description: "([^"]+)", keywords: \[[^\]]*\], engine: "([^"]+)"(?:, mode: "([^"]+)")? \}/g,
  ),
].map((m) => ({
  id: m[1],
  name: m[2],
  category: m[3],
  engine: m[5],
  mode: m[6],
}));
async function imageFixture(page: Page) {
  return Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 400;
      const x = c.getContext("2d")!;
      x.fillStyle = "#e2eee8";
      x.fillRect(0, 0, 320, 400);
      x.fillStyle = "#c7967b";
      x.beginPath();
      x.ellipse(160, 150, 65, 90, 0, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = "#32574c";
      x.fillRect(70, 260, 180, 140);
      return c.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
}
async function pdfFixture() {
  const pdf = await PDFDocument.create();
  for (const width of [200, 300, 400]) pdf.addPage([width, 500]);
  return Buffer.from(await pdf.save());
}
async function go(page: Page, id: string) {
  await page.goto(`tools/${id}/`);
  await expect(page.getByTestId("tool-content")).toBeVisible();
}
for (const tool of tools.filter((t) => t.engine !== "lifestyle"))
  test(`${tool.id}: user workflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await go(page, tool.id);
    await expect(page.locator(".workspace-title h1")).toHaveText(tool.name);
    const panel = page.getByTestId("tool-content");
    const output = panel.locator("textarea[readonly]");
    const run = panel.getByRole("button", { name: "Run Tool", exact: true });
    switch (tool.engine) {
      case "image": {
        if (tool.mode !== "quote")
          await panel.locator("input[type=file]").setInputFiles({
            name: "sample.png",
            mimeType: "image/png",
            buffer: await imageFixture(page),
          });
        if (["metadata", "color-picker", "base64"].includes(tool.mode!)) {
          await run.click();
          await expect(panel).not.toContainText("Unable to process");
          if (tool.mode === "color-picker") {
            await panel.locator("canvas").click({ position: { x: 30, y: 30 } });
            await expect(panel).toContainText("Selected color:");
          } else
            await expect(panel).toContainText(
              tool.mode === "base64" ? "data:image/png;base64," : "320",
            );
        } else {
          const download = page.waitForEvent("download");
          await run.click();
          const d = await download;
          expect(await d.failure()).toBeNull();
          expect(d.suggestedFilename()).toMatch(/\.(png|jpg|pdf)$/);
        }
        break;
      }
      case "pdf": {
        if (tool.mode === "html-to-pdf") {
          const popup = page.waitForEvent("popup");
          await run.click();
          const child = await popup;
          await child.waitForLoadState();
          await expect(child.locator("body")).toContainText(
            "Print this as PDF",
          );
          await child.close();
          break;
        }
        if (tool.mode === "text-to-pdf")
          await panel
            .locator("textarea")
            .fill("Hello Toolinger.\nThis is a sample PDF.");
        else
          await panel.locator("input[type=file]").setInputFiles({
            name: "sample.pdf",
            mimeType: "application/pdf",
            buffer: await pdfFixture(),
          });
        if (["metadata", "preview"].includes(tool.mode!)) {
          await run.click();
          await expect(panel).toContainText(
            tool.mode === "metadata" ? "Pages: 3" : "PDF loaded",
          );
        } else {
          if (tool.mode === "rearrange-pages")
            await panel
              .locator('input[placeholder="New order: 3,1,2"]')
              .fill("3,1,2");
          const download = page.waitForEvent("download");
          await run.click();
          const d = await download;
          const result = await PDFDocument.load(
            readFileSync((await d.path())!),
          );
          expect(result.getPageCount()).toBeGreaterThan(0);
          if (tool.mode === "rearrange-pages")
            expect(result.getPages().map((p) => p.getWidth())).toEqual([
              400, 200, 300,
            ]);
        }
        break;
      }
      case "passport": {
        await panel.locator("input[type=file]").setInputFiles({
          name: "portrait.png",
          mimeType: "image/png",
          buffer: await imageFixture(page),
        });
        await panel
          .getByRole("button", { name: "Create Studio Photo", exact: true })
          .click();
        const preview = panel.getByAltText("Passport preview");
        await expect(preview).toBeVisible();
        expect(
          await preview.evaluate((img: HTMLImageElement) => [
            img.naturalWidth,
            img.naturalHeight,
          ]),
        ).toEqual([413, 531]);
        const download = page.waitForEvent("download");
        await panel
          .getByRole("button", { name: "Download 4 × 6 print PDF" })
          .click();
        const d = await download;
        const pdf = await PDFDocument.load(readFileSync((await d.path())!));
        expect(pdf.getPage(0).getSize()).toEqual({ width: 288, height: 432 });
        await panel.getByLabel("Horizontal position").fill("80");
        await expect(preview).toBeVisible();
        await expect(
          panel.getByRole("button", { name: "Download JPG", exact: true }),
        ).toBeEnabled();
        break;
      }
      case "text-transform": {
        const examples: Record<string, string> = {
          "html-format": "<div><p>Hello</p></div>",
          "css-format": "body{color:red;}",
          "js-format": "const x={a:1};",
        };
        await panel
          .locator("textarea:not([readonly])")
          .fill(examples[tool.mode!] ?? "Hello  Toolinger!");
        if (tool.mode === "txt-download") {
          const download = page.waitForEvent("download");
          await run.click();
          await download;
        } else {
          await run.click();
          await expect(output).not.toHaveValue("");
          await expect(output).not.toHaveValue(/Could not format/);
        }
        break;
      }
      case "text-analysis":
        await panel.locator("textarea").fill("Hello Toolinger");
        await expect(panel).toContainText("Words: 2");
        break;
      case "text-lines":
        await panel
          .locator("textarea:not([readonly])")
          .fill("Beta\nAlpha\nBeta");
        await run.click();
        await expect(output).not.toHaveValue("");
        if (tool.mode === "unique")
          await expect(output).toHaveValue("Beta\nAlpha");
        if (tool.mode === "sort")
          await expect(output).toHaveValue("Alpha\nBeta\nBeta");
        break;
      case "find-replace":
        await panel.getByPlaceholder("Original text").fill("Hello Hello");
        await panel.getByPlaceholder("Find", { exact: true }).fill("Hello");
        await panel.getByPlaceholder("Replace with").fill("Hi");
        await panel.getByRole("button", { name: "Replace All" }).click();
        await expect(output).toHaveValue("Hi Hi");
        break;
      case "markdown-preview":
        await panel.locator("textarea").fill("# Hello\n\n**World**");
        await expect(panel.locator("h1")).toHaveText("Hello");
        break;
      case "json-tool":
        await panel.locator("textarea:not([readonly])").fill('{"hello":1}');
        await run.click();
        await expect(output).toHaveValue(
          tool.mode === "validate" ? "Valid JSON" : '{\n  "hello": 1\n}',
        );
        break;
      case "base64":
        await panel
          .locator("textarea:not([readonly])")
          .fill(tool.mode === "decode" ? "SGVsbG8=" : "Hello");
        await run.click();
        await expect(output).toHaveValue(
          tool.mode === "decode" ? "Hello" : "SGVsbG8=",
        );
        break;
      case "url-encode":
        await panel
          .locator("textarea:not([readonly])")
          .fill(tool.mode === "decode" ? "Hello%20world" : "Hello world");
        await run.click();
        await expect(output).toHaveValue(
          tool.mode === "decode" ? "Hello world" : "Hello%20world",
        );
        break;
      case "uuid":
        await panel.getByRole("button", { name: "Generate UUIDs" }).click();
        await expect(output).toHaveValue(/^[\da-f-]{36}/);
        break;
      case "password":
        await panel.getByRole("button", { name: "Generate Password" }).click();
        expect(
          (await panel.locator("input[readonly]").inputValue()).length,
        ).toBe(16);
        break;
      case "hash":
        await panel.locator("textarea:not([readonly])").fill("Hello");
        await panel.getByRole("button", { name: "Generate Hash" }).click();
        await expect(output).toHaveValue(/^[\da-f]+$/);
        break;
      case "timestamp":
        await expect(panel.locator("input")).not.toHaveCount(0);
        break;
      case "regex":
        await panel.getByPlaceholder("Test text").fill("Hello 123");
        await panel.getByPlaceholder("Pattern", { exact: true }).fill("\\d+");
        await panel.getByRole("button", { name: "Test Regex" }).click();
        await expect(panel).toContainText("123");
        break;
      case "color":
        await panel.getByRole("button", { name: "HEX to RGB" }).click();
        await expect(panel).toContainText("Converted HEX");
        break;
      case "simple-calculator": {
        const values =
          tool.mode === "age"
            ? ["2000-01-01"]
            : tool.mode === "countdown"
              ? ["2030-01-01"]
              : ["1000", "10", "12", "2"];
        const inputs = panel.locator("input");
        for (let i = 0; i < (await inputs.count()); i++)
          await inputs.nth(i).fill(values[i]);
        if (tool.mode === "random-number") {
          await inputs.nth(0).fill("1");
          await inputs.nth(1).fill("10");
          await panel.getByRole("button", { name: "Generate Number" }).click();
        }
        await expect(panel).not.toContainText("NaN");
        await expect(panel).not.toContainText("Provide values");
        break;
      }
      case "bmi":
      case "bmr":
      case "calorie":
      case "water":
      case "body-fat":
        await expect(panel).not.toContainText("NaN");
        expect(await panel.locator("input").count()).toBeGreaterThan(0);
        break;
      case "unit":
        await panel.getByLabel("Value", { exact: true }).fill("10");
        await expect(panel).toContainText("Result:");
        await panel.getByRole("button", { name: "Swap Units" }).click();
        await expect(panel).not.toContainText("NaN");
        break;
      case "qr":
        await panel.getByRole("button", { name: "Generate QR" }).click();
        await expect(panel.getByAltText("Generated QR code")).toBeVisible();
        break;
      case "coin":
        await panel
          .getByRole("button", { name: "Flip Coin", exact: true })
          .click();
        await expect(panel).toContainText(/Result: (Heads|Tails)/, {
          timeout: 5000,
        });
        break;
      case "notepad":
        await panel.locator("textarea").fill("My sample note");
        await expect(panel).toContainText("Words: 3");
        await page.reload();
        await expect(page.locator(".tool-panel textarea")).toHaveValue(
          "My sample note",
        );
        break;
      case "social":
        await panel
          .locator("textarea:not([readonly])")
          .first()
          .fill("Hello Toolinger");
        await expect(output).not.toHaveValue("");
        break;
      case "local-ai":
        await panel.getByRole("button", { name: "Run local AI" }).click();
        await expect(panel).toContainText("Enter some text first.");
        break;
    }
    expect(errors).toEqual([]);
  });

test("search, saved tools, themes, policy dialogs and mobile layout", async ({
  page,
}) => {
  await page.goto("tools/");
  await page
    .getByRole("button", {
      name: "Save Passport & ID Photo Maker",
      exact: true,
    })
    .click();
  await page
    .locator(".category-sidebar")
    .getByRole("link", { name: /Saved tools/ })
    .click();
  await expect(page.locator(".catalog-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("searchbox", { name: "Search tools" })
    .fill("nonsense-no-tool");
  await expect(page.locator(".empty-state")).toContainText("No tools found.");
  await page
    .getByRole("link", { name: "Privacy policy", exact: true })
    .first()
    .click();
  await expect(page.locator("main")).toContainText("Updated 8 October 2026");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("tools/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.getByRole("button", { name: "Browse categories" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "PDF Tools" })
    .click();
  await expect(page.locator(".catalog-card")).toHaveCount(12);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
});
test("direct routes and tool state reset on switching converters", async ({
  page,
}) => {
  const units = tools.filter((t) => t.engine === "unit");
  await go(page, units[0].id);
  await page.getByLabel("Value", { exact: true }).fill("50");
  await page.evaluate((id) => (location.hash = `/${id}`), units[1].id);
  await expect(page.getByLabel("Value", { exact: true })).toHaveValue("1");
  await page.reload();
  await expect(page.locator(".workspace-title h1")).toHaveText(units[1].name);
});
test("safe markdown links and PDF page errors", async ({ page }) => {
  await go(page, "markdown-preview");
  await page.locator(".tool-panel textarea").fill("[bad](javascript:alert(1))");
  await expect(page.locator(".tool-panel a")).toHaveCount(0);
  await go(page, "rearrange-pdf-pages");
  await page.locator("input[type=file]").setInputFiles({
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: await pdfFixture(),
  });
  await page.getByPlaceholder("New order: 3,1,2").fill("5,1");
  await page.getByRole("button", { name: "Run Tool", exact: true }).click();
  await expect(page.getByTestId("tool-content")).toContainText(
    "Pages must be between 1 and 3",
  );
});

test("examples, reset, mobile photo workspace and manifest assets", async ({
  page,
  request,
}) => {
  await go(page, "base64-decoder");
  await page.getByRole("button", { name: "Try an example" }).click();
  await page.getByRole("button", { name: "Run Tool", exact: true }).click();
  await expect(page.locator(".tool-panel textarea[readonly]")).toHaveValue(
    "Hello, Toolinger!",
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(
    page.locator(".tool-panel textarea:not([readonly])"),
  ).toHaveValue("");
  await page.setViewportSize({ width: 390, height: 844 });
  await go(page, "passport-photo-maker");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page
    .getByLabel("Choose portrait")
    .setInputFiles({
      name: "portrait.png",
      mimeType: "image/png",
      buffer: await imageFixture(page),
    });
  await page
    .getByRole("button", { name: "Create Studio Photo", exact: true })
    .click();
  await expect(page.getByAltText("Passport preview")).toBeVisible();
  const manifest = await request.get("manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const body = await manifest.json();
  expect(body.start_url).toBe(".");
  expect((await request.get(body.icons[0].src)).ok()).toBeTruthy();
});

test("skip link preserves the tool and copy failures give useful feedback", async ({
  page,
}) => {
  await go(page, "word-counter");
  await page.keyboard.press("Tab");
  await page.getByRole("link", { name: "Skip to content" }).click();
  await expect(page.locator(".workspace-title h1")).toHaveText("Word Counter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
      configurable: true,
    });
    document.execCommand = () => false;
  });
  await page.getByRole("button", { name: "Share link" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Select the address bar to copy this link",
  );
});
