# Toolbox Pro

Toolbox Pro is a client-side collection of 90+ browser utilities for images, text, cryptography, developer workflows, math, unit conversion, date/time, finance, health, and productivity.

## Production branch

The `production-readiness` branch contains deployment-hardening work without changing the existing application architecture.

### Production checks added

- Static-file and asset reference validation through GitHub Actions.
- JavaScript syntax validation with Node.
- Basic HTML parsing validation.
- Placeholder advertising credentials are surfaced as a CI warning.
- `robots.txt` and a production `404.html` are included.
- `SECURITY.md` and `.well-known/security.txt` provide a security-reporting path.
- `.gitignore` prevents common local files, logs, dependencies, and environment files from being committed.
- `styles.css` provides a stable lowercase stylesheet entrypoint while preserving the existing `Style.css` file.
- A web-app manifest is included for installable/PWA-friendly metadata.

## Architecture

The application is static and browser-first. Tool operations are implemented in `app.js`; policy/legal copy is in `policies.js`; styling is in `Style.css`. There is no application database or backend API in the current repository.

## Before public launch

1. Replace placeholder advertising identifiers in `ads.txt` and the ad configuration with the real publisher/network values you actually use.
2. Replace placeholder contact details in `policies.js` with a real support address/domain.
3. Verify every third-party CDN dependency and pin/upgrade versions deliberately.
4. Run the GitHub Actions production check and test the major tools on mobile and desktop.
5. Configure the final hosting domain, HTTPS, analytics/consent configuration, and a real sitemap if the production domain is known.

## Privacy note

The application is designed for client-side processing, but external CDNs, advertising networks, fonts, and browser storage/consent behavior can still involve third-party requests or local data. The privacy policy should therefore be kept synchronized with the final production configuration.
