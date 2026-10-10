# Toolinger

134 free browser tools for images, PDFs, text, developer tasks, health, finance, conversions, social media and on-device AI.

Live site: https://subha760.github.io/toolbox-pro/

## Develop and verify

Use Node 22.12+ and run `npm ci`, then `npm run dev`.

- `npm run check`: strict TypeScript checks, unit tests and production build.
- `npm run build && npx playwright install chromium && npm run test:e2e`: a browser workflow for every catalogue entry, plus navigation, PDF order, saved tools, themes and mobile layout checks.
- `python -m unittest discover -s backend -p 'test_*.py'`: optional photo-service contract tests (requires Pillow).
- `npm run preview`: serve the production build.

To use an installed Chromium for local tests, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium`.

The browser AI dependency includes optional Node CUDA binaries, which are not needed by this website. CI sets `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` to avoid that extra download.

## Interface and privacy

The directory includes search, category filters, favourite and recent tools, persistent light/dark themes and dedicated `/tools/tool-id/` URLs (legacy hash links still work). Text utilities include optional examples. Switching tools clears unsaved input; Notepad explicitly saves its text on the current device. The Reset control resets the current workspace. Preferences can be cleared from Privacy choices.

Tool processing happens locally. AI downloads libraries and models on first use; the inputs stay in the browser. There are no active advertising or analytics scripts. Policies live in `src/policies.ts`; keep them synchronized with actual features. Support contact: help@choicematrix.in.

PDF, QR, formatting and AI libraries load when needed. A service worker provides cached same-origin app assets for repeat visits. The photo studio serves MODNet and its CPU WASM runtime from Toolinger; its first use downloads approximately 40 MB, then caches those files. AI model downloads require internet access and a capable browser.

## Pages and daily-life tools

The production build generates 167 standalone pages: home, directory, categories, individual tools, daily dashboard, saved tools, guides, backups and eight policy pages. Each page has canonical metadata; policies and guides remain readable without JavaScript. See `dist/routes.json`, `dist/sitemap.xml` and `scripts/build-pages.mjs`. The deployed base path is `/toolbox-pro/`; development uses `/`.

Fourteen daily-life tools include tasks, habits, expenses, shopping, focus sessions, hydration, meal planning, savings, bill splitting, recipe scaling, date arithmetic, world clocks, unit prices and packing lists. Saved data stays in local storage on this device. My space exports JSON backups and validates imported sections before asking users to restore. Meal ingredients feed the shared shopping list. Monetary calculations use integer cents; timers use elapsed deadlines. Image filters use a dedicated Web Worker.

Google AdSense is prepared but disabled. See [ADSENSE.md](ADSENSE.md) for publisher IDs, ad units, certified consent management and root-domain ads.txt requirements.

## Photo studio

Upload JPG, PNG or WebP, remove portrait backgrounds with local MODNet matting or the plain-wall option, choose dimensions, and adjust zoom and horizontal/vertical position. Previews update automatically before exporting PNG/JPG or a 4 × 6 inch PDF sheet at 300-DPI sizing. Print the PDF at 100% / actual size. Framing guides are not exported. Changing framing or colour regenerates the preview; export buttons wait until it is ready.

Dimension templates and framing guides do not certify compliance. Verify current requirements with the issuing authority. Enhancement is off by default. Aadhaar enrolment uses a live photograph. Review fine hair and edge quality after AI processing.

## Deployment

Pushes to `main` run the GitHub Pages workflow. It checks types, unit tests, production build and all browser workflows before publishing `dist`. The production-check workflow also validates the optional backend contracts. The Android workflow builds root-path assets (`VITE_APP_BASE=/`) and a debug APK using Capacitor.

## Test limits

Browser coverage exercises all 134 tools with sample input or, for the four local text AI tools, their empty-input validation. Model inference is network- and device-dependent and is checked separately. Print dialogs, official passport acceptance, every possible file format, and every browser/device are not guaranteed by automated checks.

## Workbench visual identity

The interface uses self-hosted Syne and Space Grotesk fonts, warm paper, cobalt, orange and lime, layered tool artwork, tactile hover states and a moving type ribbon. Reduced-motion settings disable animation and pointer tilt. All tools, daily pages and policies share the design. Font, model, runtime and browser-test image licence notices ship beside those assets.
