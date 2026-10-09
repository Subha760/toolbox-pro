# Toolinger owner console

Website: https://tools.choicematrix.in/
Owner console: https://tools.choicematrix.in/admin/

Cloudflare Access allows only **Subhababai21@gmail.com**, using an emailed one-time code. The API independently validates the signed Access JWT, expiry, issuer, application audience and owner email. Being able to open a dashboard HTML file or set an email header does not grant access. No password or owner secret is embedded in the frontend.

The console has overview/date ranges, opted-in anonymous visitors and returning browsers, tool opens/button-action attempts, tool enable/maintenance/featured controls, report triage/private notes/deletion, website announcements, validated AdSense publisher/slot settings, audit records and JSON exports. Counts start after deployment; historical visitor numbers are not invented. Returning browsers are consented identifiers active on two distinct UTC dates in the selected range, not registered user accounts.

Public reports include only the submitted message, tool ID, type and optional email. Files and tool inputs are not attached. Owner exports may include reporter email addresses and should remain private.

Storage: Cloudflare D1 database `toolinger-control`, with parameterized queries. Usage expires after 90 days; reports after 180; audit after 365. A daily Worker cron removes expired records. Owner deletion controls also support privacy requests. Per-hour hashed request-IP counters limit public endpoint traffic and are removed daily. Browser Global Privacy Control and Do Not Track prevent optional usage recording.

Domain: GoDaddy is the registrar; the active authoritative nameservers are Cloudflare. Only `tools.choicematrix.in` was added. The Cloudflare Worker proxies the GitHub Pages frontend, serves the API and ads.txt, and supplies HTTPS. The existing apex/shop/store/deals domains are untouched. Frontend CI publishes assets with root URLs and custom-domain canonical metadata; the old GitHub Pages project URL is an origin, not the public canonical address.

Worker source, schema and deployment configuration are in `control/`. The initial database schema is idempotent. `TOOL_IDS` in Wrangler variables must match the catalog whenever tools change. Deploy with an owner-controlled Cloudflare session using `npx wrangler deploy --config control/wrangler.toml`; API changes are not silently deployed by the frontend workflow. This session deployed the Worker directly through the connected Cloudflare API.

AdSense stays off until genuine publisher/slot IDs are saved. A certified consent platform must supply the TCF purpose/vendor consent before browser ads load. No arbitrary ad scripts or secret credentials can be entered through the settings API. Native Android ads stay disabled and need a separate AdMob/consent integration before launch with ads.
