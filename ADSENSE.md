# Google AdSense readiness

Advertising is disabled. The site includes Privacy, Terms, Cookies, Advertising, Disclaimer, About, Contact and Accessibility pages. These describe the current local-processing implementation; they do not guarantee Google approval.

Before activation:

1. Register the site and obtain your public `ca-pub-…` publisher ID and responsive ad-unit IDs.
2. Integrate and configure a Google-certified consent management platform (CMP), including required regional disclosures and consent choices. It must expose the IAB TCF `__tcfapi`. The built-in preferences panel is an additional site control, not a replacement for a certified CMP.
3. Update `public/ad-config.json`: set the publisher ID and directory/tool/guide slot IDs, keep `requireCertifiedCmp: true`, then set `enabled: true`. Build validates the configuration. Keep the configuration disabled until the CMP is installed and verified.
4. Serve the generated `ads.txt` from the root of the approved domain. A file at the GitHub Pages project path `/toolbox-pro/ads.txt` alone may not satisfy the domain-root requirement; use your controlled root-domain site or a custom domain.
5. Check the AdSense dashboard, privacy disclosures, domain ownership, regional consent requirements and representative mobile pages before enabling.

No ad script loads while disabled, without local advertising permission, without eligible CMP purpose/vendor consent, or when a Do Not Track / Global Privacy Control signal is present. Ads are labelled, separated from tool controls and omitted when not eligible. Withdrawing local permission reloads the page to unload advertising scripts. Only necessary browser storage operates by default; no analytics tracker is installed.

Publisher IDs are public configuration, not credentials. Never commit account passwords or private API keys. Keep editorial policies and contact information accurate as the business changes.
