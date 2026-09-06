import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app.js", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const tools = [...source.matchAll(/\{ id: "([^"]+)", name: "([^"]+)", category: "([^"]+)", description: "([^"]+)", keywords: \[[^\]]*\], engine: "([^"]+)"(?:, mode: "([^"]+)")? \}/g)]
  .map((match) => ({ id: match[1], name: match[2], category: match[3], engine: match[5], mode: match[6] }));

test("catalog has at least 100 real entries", () => assert.ok(tools.length >= 100, `found ${tools.length}`));
test("tool IDs are unique", () => assert.equal(new Set(tools.map(({ id }) => id)).size, tools.length));
test("every configured engine is rendered", () => {
  for (const engine of new Set(tools.map((tool) => tool.engine))) assert.match(source, new RegExp(`case ["']${engine}["']`), `missing renderer for ${engine}`);
});
test("local AI catalogue is wired", () => assert.equal(tools.filter(({ category }) => category === "ai").length, 4));
test("production entry mounts React", () => { assert.match(index, /id="root"/); assert.match(index, /src="\.\/main\.jsx"/); });
