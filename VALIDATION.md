# Toolinger 4 upgrade verification — 9 October 2026

- Strict TypeScript checks, 29 unit tests, production build and 10 optional backend contract tests pass.
- 134 catalogue tools: 120 existing tools plus 14 daily-life tools. Browser coverage exercises sample input, downloads, saved data or empty-input validation for every tool.
- 167 generated standalone pages have canonical metadata and working public routes. Policy and guide content remains readable without JavaScript; sitemap and robots files are generated.
- Daily-life checks cover persistent tasks, habit completion, expenses in cents, shopping quantities, hydration undo, meal-to-shopping integration, focus timer pause/reset, savings, bill splitting, fractional recipe quantities, leap-year date arithmetic, world time zones and packing lists.
- Backup import validates all sections before offering a reviewed restore. Invalid backups leave saved data unchanged. Export and confirmed clearing are checked.
- Image filters run in a transferable-buffer Web Worker; unit checks verify alpha preservation and convolution results. Processing controls block duplicate runs and validate image-size/dimension limits.
- Passport workflows verify PNG/JPG downloads, automatic preview updates, framing, output dimensions and 4 × 6 inch print PDFs. MODNet matting is tested with a real NASA portrait in the browser gate, including checks that navy and red studio colours replace transparent background pixels. The model and CPU runtime load entirely from Toolinger. A second real portrait was visually reviewed.
- Desktop appearance reviewed; 390-pixel mobile directory, passport and meal-planning pages checked for horizontal overflow. Light/dark theme persistence, normal URLs, legacy hash links and navigation are checked.
- AdSense remains disabled. Browser checks confirm no advertising requests are sent and local privacy choices persist. A Google-certified CMP, public publisher/ad-unit IDs and domain-root ads.txt must be configured before activation; see ADSENSE.md.
- `npm audit` reports zero known vulnerabilities in the installed dependencies.

The four local text-AI tools use empty-input validation in the deployment gate; actual model inference was checked separately during the previous upgrade. Models need network access on first use. These checks do not certify official acceptance of passport photos, every file format or every device/browser.

The photo studio includes a separate edge-connected plain-wall removal option, support for camera files with missing MIME metadata, large-camera-image downscaling, explicit errors and cancellation. Colour/framing changes update previews automatically. The workbench theme is checked at 390 pixels across home, directory, daily pages, guides, policies and photo studio.
