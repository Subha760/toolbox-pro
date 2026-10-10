import { readFile, writeFile, mkdir } from "node:fs/promises";
import ts from "typescript";
const load = async (path) => {
  const source = await readFile(path, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  return import(
    `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
  );
};
const [{ TOOL_LIST, CATEGORY_LABELS }, { LEGAL_CONTENT }, { GUIDES }] =
  await Promise.all([
    load("src/catalog.ts"),
    load("src/policies.ts"),
    load("src/guides.ts"),
  ]);
const base = process.env.VITE_APP_BASE || "/toolbox-pro/",
  origin = process.env.VITE_SITE_ORIGIN || "https://subha760.github.io",
  home = origin + base;
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const template = await readFile("dist/index.html", "utf8");
const pages = [];
const add = (path, title, description, body, type = "WebPage") =>
  pages.push({ path, title, description, body, type });
add(
  "admin",
  "Owner console — Toolinger",
  "Private Toolinger owner dashboard.",
  "<p>Owner sign-in is required.</p>",
);
const links = (tools) =>
  `<ul>${tools.map((t) => `<li><a href="${base}tools/${t.id}/">${escape(t.name)}</a> — ${escape(t.description)}</li>`).join("")}</ul>`;
add(
  "",
  "Toolinger — Tools for a better everyday",
  "Free browser tools for files, plans and everyday decisions. Create ID photos, plan tasks, track habits and manage budgets.",
  `<p>Useful tools for your files, plans and daily decisions.</p><nav><a href="${base}tools/">Browse all ${TOOL_LIST.length} tools</a> · <a href="${base}daily/">Daily dashboard</a> · <a href="${base}guides/">Practical guides</a></nav>${links(TOOL_LIST.filter((t) => t.category === "lifestyle"))}`,
);
add(
  "tools",
  "All tools — Toolinger",
  "Explore free image, PDF, text, developer and daily-life browser tools.",
  links(TOOL_LIST),
);
add(
  "daily",
  "Daily dashboard — Toolinger",
  "Plan tasks, build habits, log water, track spending and organise your day with private browser tools.",
  links(TOOL_LIST.filter((t) => t.category === "lifestyle")),
);
add(
  "saved",
  "Saved tools — Toolinger",
  "Keep your favourite tools close. Saved tools are stored on this device.",
  "<p>Tap the star on a tool to save it. Your saved toolkit stays in this browser.</p>",
);
add(
  "my-space",
  "My space & backups — Toolinger",
  "Export, restore and manage locally saved planner data.",
  "<p>Download a backup, review and restore a Toolinger JSON backup, or clear your daily-life data.</p>",
);
add(
  "guides",
  "Practical guides — Toolinger",
  "Clear guidance for ID photos, routines, budgets, PDF work and local data.",
  `<ul>${GUIDES.map((g) => `<li><a href="${base}guides/${g.slug}/">${escape(g.title)}</a><p>${escape(g.description)}</p></li>`).join("")}</ul>`,
);
for (const [id, label] of Object.entries(CATEGORY_LABELS))
  add(
    `categories/${id}`,
    `${label} — Toolinger`,
    `Explore ${label.toLowerCase()} for everyday tasks.`,
    links(TOOL_LIST.filter((t) => t.category === id)),
  );
for (const tool of TOOL_LIST)
  add(
    `tools/${tool.id}`,
    `${tool.name} — Toolinger`,
    tool.description,
    `<p>${escape(tool.description)}</p><p>Use clear controls, then review and download your result. Processing happens on your device.</p><h2>How to use ${escape(tool.name)}</h2><ol><li>Enter content or select your file.</li><li>Adjust the options and run the tool.</li><li>Review the output before saving or sharing.</li></ol><p><a href="${base}categories/${tool.category}/">More ${escape(CATEGORY_LABELS[tool.category].toLowerCase())}</a></p>`,
    "WebApplication",
  );
for (const [id, page] of Object.entries(LEGAL_CONTENT))
  add(
    id,
    `${page.title} — Toolinger`,
    `${page.title}, privacy choices and support information for Toolinger.`,
    page.body
      .split("\n\n")
      .map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`)
      .join(""),
  );
for (const guide of GUIDES)
  add(
    `guides/${guide.slug}`,
    `${guide.title} — Toolinger`,
    guide.description,
    `<p>${escape(guide.description)}</p>${guide.sections.map((s) => `<section><h2>${escape(s.title)}</h2><p>${escape(s.body)}</p></section>`).join("")}${links(TOOL_LIST.filter((t) => guide.tools.includes(t.id)))}`,
    "Article",
  );
for (const page of pages) {
  const url = home + (page.path ? page.path + "/" : "");
  const title = page.title.replace(/ — Toolinger$/, "");
  const schema = {
    "@context": "https://schema.org",
    "@type": page.type,
    name: page.title,
    description: page.description,
    url,
    ...(page.type === "WebApplication"
      ? {
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any browser",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }
      : {}),
  };
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escape(page.description)}" />`,
    )
    .replace(
      "</head>",
      `${page.path === "admin" ? '<meta name="robots" content="noindex,nofollow"/>' : ""}<link rel="canonical" href="${url}"/><meta property="og:title" content="${escape(page.title)}"/><meta property="og:description" content="${escape(page.description)}"/><meta property="og:url" content="${url}"/><meta property="og:type" content="${page.type === "Article" ? "article" : "website"}"/><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script></head>`,
    )
    .replace(
      '<div id="root"></div>',
      `<div id="root"><main class="content-page page-width"><a href="${base}">Toolinger</a><h1>${escape(title)}</h1>${page.body}</main></div><noscript><p style="text-align:center">Enable JavaScript to run interactive tools. Policies and guides are available above.</p></noscript>`,
    );
  const dir = page.path ? "dist/" + page.path : "dist";
  await mkdir(dir, { recursive: true });
  await writeFile(dir + "/index.html", html);
}
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages
    .filter((p) => p.path !== "admin")
    .map((p) => `<url><loc>${home}${p.path ? p.path + "/" : ""}</loc></url>`)
    .join("")}</urlset>`,
);
await writeFile(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /owner/\nDisallow: /api/\nSitemap: ${home}sitemap.xml\n`,
);
const ads = JSON.parse(await readFile("public/ad-config.json", "utf8"));
if (ads.enabled) {
  if (
    !/^ca-pub-\d{16}$/.test(ads.publisherId) ||
    !Object.values(ads.slots).some((s) => /^\d+$/.test(s)) ||
    ads.requireCertifiedCmp !== true
  )
    throw new Error("Ads need valid publisher, ad slots and a certified CMP.");
  await writeFile(
    "dist/ads.txt",
    `google.com, ${ads.publisherId.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`,
  );
}
await writeFile(
  "dist/routes.json",
  JSON.stringify(
    pages.map(({ path, title }) => ({ path, title })),
    null,
    2,
  ),
);
console.log(
  `Generated ${pages.length} standalone pages, canonical metadata and sitemap.`,
);
