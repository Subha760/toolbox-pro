import test from "node:test";
import assert from "node:assert/strict";
import worker, { authenticate, validateSetting } from "../control/worker.mjs";
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
