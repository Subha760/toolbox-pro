const SITE = "https://tools.choicematrix.in";
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
const decode = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  );
let cachedKeys,
  keysExpire = 0;
export async function authenticate(request, env) {
  if (!env.ACCESS_AUD || !env.OWNER_EMAIL) return null;
  try {
    const token = request.headers.get("Cf-Access-Jwt-Assertion") || "";
    const [head, body, sig] = token.split(".");
    const header = JSON.parse(new TextDecoder().decode(decode(head))),
      claims = JSON.parse(new TextDecoder().decode(decode(body)));
    if (
      header.alg !== "RS256" ||
      claims.iss !== "https://toolinger-owner.cloudflareaccess.com" ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= Date.now() / 1000 ||
      claims.nbf > Date.now() / 1000 ||
      claims.email?.toLowerCase() !== env.OWNER_EMAIL.toLowerCase() ||
      !(Array.isArray(claims.aud) ? claims.aud : [claims.aud]).includes(
        env.ACCESS_AUD,
      )
    )
      return null;
    if (!cachedKeys || keysExpire < Date.now()) {
      const r = await fetch(
        "https://toolinger-owner.cloudflareaccess.com/cdn-cgi/access/certs",
      );
      if (!r.ok) return null;
      cachedKeys = (await r.json()).keys;
      keysExpire = Date.now() + 300000;
    }
    const jwk = cachedKeys.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return (await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      decode(sig),
      new TextEncoder().encode(head + "." + body),
    ))
      ? claims.email
      : null;
  } catch {
    return null;
  }
}
export function validateSetting(key, value, toolIds) {
  if (key === "ads") {
    if (
      typeof value.enabled !== "boolean" ||
      !/^$|^ca-pub-\d{16}$/.test(value.publisherId || "")
    )
      throw Error("Valid AdSense publisher ID required");
    const slots = Object.fromEntries(
      ["directory", "tool", "guide"].map((k) => {
        const v = value.slots?.[k] || "";
        if (!/^$|^\d{1,20}$/.test(v)) throw Error("Invalid ad slot");
        return [k, v];
      }),
    );
    if (
      value.enabled &&
      (!value.publisherId || !Object.values(slots).some(Boolean))
    )
      throw Error("Supply publisher and slot IDs before enabling");
    return {
      enabled: value.enabled,
      publisherId: value.publisherId || "",
      slots,
      requireCertifiedCmp: true,
    };
  }
  if (key === "announcement") {
    if (
      typeof value.text !== "string" ||
      value.text.length > 250 ||
      typeof value.enabled !== "boolean"
    )
      throw Error("Announcement must be under 250 characters");
    return { text: value.text, enabled: value.enabled };
  }
  if (key === "tools") {
    const result = {};
    for (const [id, v] of Object.entries(value)) {
      if (
        !toolIds.includes(id) ||
        !v ||
        typeof v !== "object" ||
        typeof v.enabled !== "boolean" ||
        typeof v.featured !== "boolean" ||
        typeof v.message !== "string" ||
        v.message.length > 200
      )
        throw Error("Invalid tool setting");
      result[id] = {
        enabled: v.enabled,
        featured: v.featured,
        message: v.message,
      };
    }
    return result;
  }
  throw Error("Unknown setting");
}
async function rate(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const hour = Math.floor(Date.now() / 3600000);
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip + ":" + hour),
  );
  const key = Array.from(new Uint8Array(hash), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
  const row = await env.DB.prepare(
    "INSERT INTO limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
  )
    .bind(key, (hour + 1) * 3600)
    .first();
  return row.count <= 120;
}
async function api(request, env, url) {
  const path = url.pathname;
  const admin = path.startsWith("/api/admin/");
  let owner = null;
  if (admin) {
    owner = await authenticate(request, env);
    if (!owner) return json({ error: "Owner sign-in required" }, 401);
  }
  const origin = request.headers.get("Origin");
  if (
    request.method !== "GET" &&
    (![SITE, "https://localhost", "https://subha760.github.io"].includes(
      origin,
    ) ||
      (admin && origin !== SITE))
  )
    return json({ error: "Origin not allowed" }, 403);
  if (request.method === "GET" && path === "/api/config") {
    const rows = (await env.DB.prepare("SELECT key,value FROM settings").all())
      .results;
    return json(
      Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)])),
    );
  }
  if (request.method === "GET" && path === "/api/admin/session")
    return json({ email: owner });
  if (request.method === "GET" && path === "/api/admin/dashboard") {
    const days = Math.min(
      90,
      Math.max(1, Number(url.searchParams.get("days")) || 30),
    );
    const since = `-${days} days`;
    const statements = [
      env.DB.prepare(
        "SELECT count(*) actions,count(distinct visitor) visitors,sum(kind='open') opens,sum(kind='action') attempts FROM events WHERE created>=datetime('now',?)",
      ).bind(since),
      env.DB.prepare(
        "SELECT count(*) returning_count FROM (SELECT visitor FROM events WHERE created>=datetime('now',?) GROUP BY visitor HAVING count(distinct substr(created,1,10))>=2)",
      ).bind(since),
      env.DB.prepare(
        "SELECT substr(created,1,10) day,count(*) events,count(distinct visitor) visitors FROM events WHERE created>=datetime('now',?) GROUP BY day ORDER BY day",
      ).bind(since),
      env.DB.prepare(
        "SELECT tool,sum(kind='open') opens,sum(kind='action') attempts FROM events WHERE created>=datetime('now',?) GROUP BY tool ORDER BY opens DESC",
      ).bind(since),
      env.DB.prepare(
        "SELECT visitor,min(created) first_seen,max(created) last_seen,count(*) actions,count(distinct tool) tools FROM events GROUP BY visitor ORDER BY last_seen DESC LIMIT 200",
      ),
      env.DB.prepare("SELECT * FROM reports ORDER BY created DESC LIMIT 500"),
      env.DB.prepare("SELECT key,value FROM settings"),
      env.DB.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 100"),
    ];
    const rows = await env.DB.batch(statements);
    return json({
      totals: rows[0].results[0],
      returning: rows[1].results[0].returning_count,
      daily: rows[2].results,
      tools: rows[3].results,
      visitors: rows[4].results,
      reports: rows[5].results,
      settings: Object.fromEntries(
        rows[6].results.map((r) => [r.key, JSON.parse(r.value)]),
      ),
      audit: rows[7].results,
      days,
    });
  }
  if (request.method !== "POST") return json({ error: "Not found" }, 404);
  if (Number(request.headers.get("content-length")) > 16000)
    return json({ error: "Request too large" }, 413);
  const raw = await request.text();
  if (raw.length > 16000) return json({ error: "Request too large" }, 413);
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    return json({ error: "Expected a JSON object" }, 400);
  const ids = JSON.parse(env.TOOL_IDS || "[]");
  if (!admin && !(await rate(request, env)))
    return json({ error: "Please try again later" }, 429);
  if (path === "/api/event") {
    if (
      !ids.includes(data.tool) ||
      !["open", "action"].includes(data.kind) ||
      !/^[-a-f0-9]{36}$/.test(data.visitor || "") ||
      !/^[-a-f0-9]{36}$/.test(data.id || "") ||
      data.consent !== true
    )
      return json({ error: "Invalid event" }, 400);
    await env.DB.prepare(
      "INSERT OR IGNORE INTO events(id,visitor,tool,kind) VALUES (?,?,?,?)",
    )
      .bind(data.id, data.visitor, data.tool, data.kind)
      .run();
    return json({ ok: true });
  }
  if (path === "/api/report") {
    if (
      data.website ||
      !ids.includes(data.tool) ||
      !["bug", "feature", "feedback"].includes(data.kind) ||
      typeof data.message !== "string" ||
      data.message.trim().length < 10 ||
      data.message.length > 2000 ||
      typeof data.email !== "string" ||
      data.email.length > 254 ||
      (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    )
      return json({ error: "Check your report and email" }, 400);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO reports(id,tool,kind,message,email) VALUES (?,?,?,?,?)",
    )
      .bind(id, data.tool, data.kind, data.message.trim(), data.email)
      .run();
    return json({ ok: true, id }, 201);
  }
  if (path === "/api/admin/delete") {
    if (
      !["visitor", "report"].includes(data.type) ||
      !/^[-a-f0-9]{36}$/.test(data.id || "")
    )
      return json({ error: "Invalid deletion target" }, 400);
    const statement =
      data.type === "visitor"
        ? "DELETE FROM events WHERE visitor=?"
        : "DELETE FROM reports WHERE id=?";
    await env.DB.batch([
      env.DB.prepare(statement).bind(data.id),
      env.DB.prepare(
        "INSERT INTO audit(actor,action,target) VALUES (?,?,?)",
      ).bind(owner, data.type + ".deleted", data.id),
    ]);
    return json({ ok: true });
  }
  if (path === "/api/admin/settings") {
    let value;
    try {
      value = validateSetting(data.key, data.value, ids);
    } catch (e) {
      return json({ error: e.message }, 400);
    }
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      ).bind(data.key, JSON.stringify(value)),
      env.DB.prepare(
        "INSERT INTO audit(actor,action,target) VALUES (?,?,?)",
      ).bind(owner, "settings.updated", data.key),
    ]);
    return json({ ok: true });
  }
  if (path === "/api/admin/report") {
    if (
      !["open", "investigating", "resolved", "closed"].includes(data.status) ||
      typeof data.note !== "string" ||
      data.note.length > 2000
    )
      return json({ error: "Invalid report update" }, 400);
    const found = await env.DB.prepare("SELECT id FROM reports WHERE id=?")
      .bind(data.id)
      .first();
    if (!found) return json({ error: "Report not found" }, 404);
    await env.DB.batch([
      env.DB.prepare("UPDATE reports SET status=?,note=? WHERE id=?").bind(
        data.status,
        data.note,
        data.id,
      ),
      env.DB.prepare(
        "INSERT INTO audit(actor,action,target) VALUES (?,?,?)",
      ).bind(owner, "report." + data.status, data.id),
    ]);
    return json({ ok: true });
  }
  return json({ error: "Not found" }, 404);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/admin/downloads/signing-backup.zip") {
        if (!(await authenticate(request, env)))
          return json({ error: "Owner sign-in required" }, 401);
        const backup = [
          env.SIGNING_BACKUP_0,
          env.SIGNING_BACKUP_1,
          env.SIGNING_BACKUP_2,
        ].join("");
        if (
          !env.SIGNING_BACKUP_0 ||
          !env.SIGNING_BACKUP_1 ||
          !env.SIGNING_BACKUP_2
        )
          return json({ error: "Signing backup is not configured" }, 404);
        return new Response(decode(backup), {
          headers: {
            "content-type": "application/zip",
            "content-disposition":
              "attachment; filename=Toolinger-private-signing-backup.zip",
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
          },
        });
      }
      if (url.pathname.startsWith("/api/")) {
        const origin = request.headers.get("Origin");
        const publicPath = [
          "/api/config",
          "/api/event",
          "/api/report",
        ].includes(url.pathname);
        const cors =
          publicPath &&
          [SITE, "https://localhost", "https://subha760.github.io"].includes(
            origin,
          );
        if (request.method === "OPTIONS")
          return new Response(null, {
            status: cors ? 204 : 403,
            headers: cors
              ? {
                  "Access-Control-Allow-Origin": origin,
                  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                  "Access-Control-Allow-Headers": "Content-Type",
                  Vary: "Origin",
                }
              : {},
          });
        const response = await api(request, env, url);
        if (cors) {
          response.headers.set("Access-Control-Allow-Origin", origin);
          response.headers.set("Vary", "Origin");
        }
        return response;
      }
      if (url.pathname === "/ads.txt") {
        const row = await env.DB.prepare(
          "SELECT value FROM settings WHERE key='ads'",
        ).first();
        const ads = JSON.parse(row.value);
        return new Response(
          ads.enabled
            ? `google.com, ${ads.publisherId.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`
            : "# Advertising is disabled until publisher details are supplied.\n",
          { headers: { "content-type": "text/plain" } },
        );
      }
      const target = new URL(
        "https://subha760.github.io/toolbox-pro" + url.pathname,
      );
      target.search = url.search;
      const response = await fetch(target, { redirect: "manual" });
      const headers = new Headers(response.headers);
      headers.set("x-content-type-options", "nosniff");
      headers.set("referrer-policy", "strict-origin-when-cross-origin");
      if (headers.get("content-type")?.includes("text/html")) {
        headers.set("cache-control", "no-cache, no-transform");
      }
      const redirect = headers.get("location");
      if (redirect) {
        const location = new URL(redirect, target);
        if (location.hostname === "subha760.github.io")
          headers.set(
            "location",
            SITE +
              location.pathname.replace(/^\/toolbox-pro(?=\/|$)/, "") +
              location.search,
          );
      }
      if (url.pathname.startsWith("/assets/"))
        headers.set("cache-control", "public, max-age=31536000, immutable");
      if (url.pathname.startsWith("/admin")) {
        headers.set("cache-control", "no-store");
        headers.set("x-frame-options", "DENY");
        headers.set("x-robots-tag", "noindex, nofollow");
      }
      return new Response(response.body, { status: response.status, headers });
    } catch {
      return json({ error: "Service temporarily unavailable" }, 503);
    }
  },
  async scheduled(event, env) {
    await env.DB.batch([
      env.DB.prepare(
        "DELETE FROM events WHERE created<datetime('now','-90 days')",
      ),
      env.DB.prepare(
        "DELETE FROM reports WHERE created<datetime('now','-180 days')",
      ),
      env.DB.prepare(
        "DELETE FROM audit WHERE created<datetime('now','-365 days')",
      ),
      env.DB.prepare("DELETE FROM limits WHERE expires<?").bind(
        Math.floor(Date.now() / 1000),
      ),
    ]);
  },
};
