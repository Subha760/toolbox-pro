# Upgrade verification — 8 October 2026

- Strict TypeScript checking, 17 unit tests, production build and 10 optional backend contract tests pass.
- Browser checks cover all 120 catalogue entries with sample inputs/downloads or validation, plus search, saved tools, themes, direct routes, state reset, policy dialogs, mobile widths, print-sheet sizing and safe input handling.
- Actual inference checked separately: positive sentiment, semantic similarity, extractive summary and keyword extraction all return meaningful output with Transformers.js 4.
- Portrait background removal checked with a real portrait using MediaPipe; reviewed transparent cutout and final white-background output.
- Passport export dimensions: 413 × 531 pixels for the common 35 × 45 mm template. Print PDF: 288 × 432 points (4 × 6 inches), six standard-size photos with margins. Changing settings clears the old preview.
- Light and dark desktop layouts reviewed; 390-pixel mobile directory and passport workspace checked for horizontal overflow.
- `npm audit` reports zero known vulnerabilities across production and development dependencies at verification time.
- Initial app JavaScript changed from roughly 291 KB gzip to 103 KB gzip. PDF, QR, formatters and text AI load on demand. First-use AI still requires model downloads.

These checks do not certify government acceptance of photos, every image/file edge case, or every browser/device. Network-dependent inference is kept out of the deployment gate; its input-validation workflows remain in the browser suite.
