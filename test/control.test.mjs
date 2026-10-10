import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import worker, { authenticate, validateSetting } from "../control/worker.mjs";
test("dashboard queries execute in SQLite and count returning browsers across dates", () => {
  const source = readFileSync(new URL("../control/worker.mjs", import.meta.url), "utf8");
  const schema = readFileSync(new URL("../control/schema.sql", import.meta.url), "utf8");
  const result = spawnSync("python3", ["-c", `
import json,re,sqlite3,sys
source,schema=json.load(sys.stdin)
db=sqlite3.connect(':memory:')
db.executescript(schema)
db.execute("INSERT INTO events(id,visitor,tool,kind,created) VALUES ('a','repeat','qr-code-generator','open',datetime('now','-1 day'))")
db.execute("INSERT INTO events(id,visitor,tool,kind) VALUES ('b','repeat','qr-code-generator','open')")
db.execute("INSERT INTO events(id,visitor,tool,kind) VALUES ('c','once','qr-code-generator','open')")
part=source.split('const statements = [')[1].split('const rows =')[0]
queries=re.findall(r'prepare\\(\\s*"([^"]+)"',part)
assert len(queries)==8
results=[db.execute(q,('-30 days',) if '?' in q else ()).fetchall() for q in queries]
assert results[1][0][0]==1, results[1]
`], { input: JSON.stringify([source, schema]), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
test("admin rejects missing and forged authentication without reading database", async () => {
  const env = {
    ACCESS_AUD: "private-aud",
    OWNER_EMAIL: "owner@example.com",
    DB: {
      prepare() {
        throw Error("Database must not be reached");
      },
    },
  };
  for (const headers of [
    {},
    { "Cf-Access-Authenticated-User-Email": "owner@example.com" },
    { "Cf-Access-Jwt-Assertion": "forged" },
  ]) {
    const r = await worker.fetch(
      new Request("https://tools.choicematrix.in/api/admin/dashboard", {
        headers,
      }),
      env,
    );
    assert.equal(r.status, 401);
  }
  const backup = await worker.fetch(
    new Request(
      "https://tools.choicematrix.in/admin/downloads/signing-backup.zip",
    ),
    env,
  );
  assert.equal(backup.status, 401);
  assert.equal(
    await authenticate(new Request("https://tools.choicematrix.in"), {}),
    null,
  );
});
test("mutations reject foreign origins before accessing storage", async () => {
  const r = await worker.fetch(
    new Request("https://tools.choicematrix.in/api/report", {
      method: "POST",
      headers: { Origin: "https://untrusted.example" },
      body: "{}",
    }),
    {},
  );
  assert.equal(r.status, 403);
});
test("ads cannot enable without valid identifiers and certified consent stays mandatory", () => {
  assert.throws(() =>
    validateSetting("ads", { enabled: true, publisherId: "", slots: {} }, []),
  );
  assert.throws(() =>
    validateSetting(
      "ads",
      { enabled: true, publisherId: "<script>", slots: {} },
      [],
    ),
  );
  const value = validateSetting(
    "ads",
    {
      enabled: true,
      publisherId: "ca-pub-1234567890123456",
      slots: { tool: "12345" },
      requireCertifiedCmp: false,
    },
    [],
  );
  assert.equal(value.requireCertifiedCmp, true);
});
test("tool controls accept known tool IDs and bounded plain-text fields only", () => {
  assert.throws(() =>
    validateSetting(
      "tools",
      { unknown: { enabled: false, featured: false, message: "" } },
      ["known"],
    ),
  );
  assert.deepEqual(
    validateSetting(
      "tools",
      {
        known: {
          enabled: false,
          featured: true,
          message: "Maintenance",
          script: "evil",
        },
      },
      ["known"],
    ),
    { known: { enabled: false, featured: true, message: "Maintenance" } },
  );
  assert.throws(() =>
    validateSetting(
      "announcement",
      { enabled: true, text: "x".repeat(251) },
      [],
    ),
  );
});
test("owner JWT requires a valid signature, matching email and audience, and a live expiry", async () => {
  const keys = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const publicKey = await crypto.subtle.exportKey("jwk", keys.publicKey);
  publicKey.kid = "test-owner-key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ keys: [publicKey] }), {
      headers: { "content-type": "application/json" },
    });
  const b64 = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  async function token(overrides = {}) {
    const head = b64({ alg: "RS256", kid: publicKey.kid }),
      body = b64({
        iss: "https://toolinger-owner.cloudflareaccess.com",
        email: "owner@example.com",
        aud: ["owner-aud"],
        exp: Math.floor(Date.now() / 1000) + 120,
        ...overrides,
      });
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      keys.privateKey,
      new TextEncoder().encode(`${head}.${body}`),
    );
    return `${head}.${body}.${Buffer.from(signature).toString("base64url")}`;
  }
  const env = { OWNER_EMAIL: "owner@example.com", ACCESS_AUD: "owner-aud" };
  try {
    assert.equal(
      await authenticate(
        new Request("https://tools.choicematrix.in", {
          headers: { "Cf-Access-Jwt-Assertion": await token() },
        }),
        env,
      ),
      "owner@example.com",
    );
    const backupRequest = new Request(
      "https://tools.choicematrix.in/admin/downloads/signing-backup.zip",
      { headers: { "Cf-Access-Jwt-Assertion": await token() } },
    );
    const backup = await worker.fetch(backupRequest, {
      ...env,
      SIGNING_BACKUP_0: Buffer.from("private-test-backup")
        .toString("base64")
        .slice(0, 8),
      SIGNING_BACKUP_1: Buffer.from("private-test-backup")
        .toString("base64")
        .slice(8, 16),
      SIGNING_BACKUP_2: Buffer.from("private-test-backup")
        .toString("base64")
        .slice(16),
    });
    assert.equal(backup.status, 200);
    assert.equal(backup.headers.get("cache-control"), "no-store");
    assert.equal(await backup.text(), "private-test-backup");
    for (const invalid of [
      { email: "someone@example.com" },
      { aud: ["other-aud"] },
      { exp: 0 },
      { exp: undefined },
      { iss: "https://wrong.example" },
    ])
      assert.equal(
        await authenticate(
          new Request("https://tools.choicematrix.in", {
            headers: { "Cf-Access-Jwt-Assertion": await token(invalid) },
          }),
          env,
        ),
        null,
      );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
