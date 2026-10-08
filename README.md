# Toolinger

120 free browser tools for images, PDFs, text, developer tasks, health, finance, conversions, social media and on-device AI.

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

The directory includes search, category filters, favourite and recent tools, persistent light/dark themes and shareable `#/tool-id` URLs. Text utilities include optional examples. Switching tools clears unsaved input; Notepad explicitly saves its text on the current device. The Reset control resets the current workspace. Preferences can be cleared from Privacy choices.

Tool processing happens locally. AI downloads libraries and models on first use; the inputs stay in the browser. There are no active advertising or analytics scripts. Policies live in `src/policies.ts`; keep them synchronized with actual features. Support contact: lootchaser2026@gmail.com.

PDF, QR, formatting and AI libraries load when needed. A service worker provides cached same-origin app assets for repeat visits. AI model downloads require internet access and a capable browser.

## Photo studio

Upload JPG, PNG or WebP, optionally remove the portrait background with on-device MediaPipe AI, choose dimensions, and adjust zoom and horizontal/vertical position. Generate a preview before exporting PNG/JPG or a 4 × 6 inch PDF sheet at 300-DPI sizing. Print the PDF at 100% / actual size. Framing guides are not exported. Changing settings invalidates the previous preview.

Dimension templates and framing guides do not certify compliance. Verify current requirements with the issuing authority. Enhancement is off by default. Aadhaar enrolment uses a live photograph. Review fine hair and edge quality after AI processing.

## Deployment

Pushes to `main` run the GitHub Pages workflow. It checks types, unit tests, production build and all browser workflows before publishing `dist`. The production-check workflow also validates the optional backend contracts. The existing Android workflow builds a debug APK using Capacitor.

## Test limits

Browser coverage exercises all 120 tools with sample input or, for the four local text AI tools, their empty-input validation. Model inference is network- and device-dependent and is checked separately. Print dialogs, official passport acceptance, every possible file format, and every browser/device are not guaranteed by automated checks.
