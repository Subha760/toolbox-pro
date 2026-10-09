# Toolinger Android release

Public app ID: `io.toolinger.app`. Version: `4.1.0`, version code `40001`. Target/compile API: 36; minimum API: 24. Capacitor 8, bundled tools/model assets, Android system share sheet for exports, branded icons, no marketing SDKs. Backup of private app data is disabled. Only Internet permission is requested by the app manifest; file upload uses the system picker and exports use the app cache/share sheet.

Owner app ID: `io.toolinger.owner`. It opens https://tools.choicematrix.in/admin/ and requires the same owner-only Cloudflare Access sign-in. Distribute the owner APK privately; it is not the public store listing.

## Release files

- Signed `Toolinger-4.1.0.apk`: universal APK for device installation or Indus submission.
- Signed `Toolinger-4.1.0.aab`: Android App Bundle for Google Play submission.
- Signed `Toolinger-Owner-4.1.0.apk`: private owner dashboard app.
- Private signing backup: keystore, alias and passwords. **Never upload this backup to a release, public repository or store listing.** Keep an offline copy. Future updates must preserve the key and app ID, and increment version code.

The GitHub connection could not write Actions secrets (403); the release was built locally. The checked-in workflow produces a test APK and also signs release APK/AAB when these owner-supplied encrypted repository secrets exist:

`ANDROID_KEYSTORE_BASE64`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, `ANDROID_KEY_ALIAS`.

Use GitHub Settings → Secrets and variables → Actions. The private backup includes matching files for those values. A debug APK from CI is for testing, not store submission. Local rebuilding uses `scripts/build-android-release.py` with `TOOLINGER_SIGNING_DIR` pointing to the private key folder. Run a root-path Vite build, `npx cap add android` once, `npx cap sync android`, and `node scripts/prepare-android.mjs` before Gradle.

## Suggested public listing

Title: **Toolinger: Everyday Tools**

Short description: **134 handy tools for photos, PDFs, text, plans and everyday calculations.**

Description: Toolinger brings everyday tools into one workspace. Create ID-photo templates with on-device background removal, resize and convert images, work with PDFs, format text and code, and handle useful calculations. Plan tasks, track habits and water, organise shopping and meals, compare prices, and export a private backup of your daily-life entries. File and text processing runs on your device. AI features may download model files before use. Optional anonymous usage counts require permission. Report problems directly from each tool. Photo templates do not guarantee official acceptance; check the issuing authority's requirements.

Privacy policy: https://tools.choicematrix.in/privacy/
Support: lootchaser2026@gmail.com
Website: https://tools.choicematrix.in/
Store icon: `public/app-icons/toolinger-512.png`.

## Submission details the account owner must complete

Upload the signed AAB in Play Console and the signed APK/AAB in the Indus developer console. Store publication requires the owner's developer accounts, identity/account verification, current declarations, device testing and store review. New Play personal accounts may require a closed-test period before production access; use the requirements shown in that account.

The app has no public user accounts or account creation. Usage collection is optional: random app/browser identifier, tool ID, event type and timestamp, retained 90 days. Reports are voluntarily submitted messages/optional email, retained 180 days. Tool files/text/planner data are not collected by Toolinger. Hosting providers receive network metadata; AI assets may be downloaded from Hugging Face. Native advertising is disabled. Complete Play Data Safety and Indus privacy disclosures from these actual behaviours; do not claim “no data collected” while optional events/reports exist.

Health and financial calculators are estimates; complete applicable health-app declarations using the available calculators and their disclaimer. Choose age audience/content rating in the store questionnaires according to your intended audience. Verify photo upload, model download, background removal, studio colours, PDF/image export, Android save/share, offline bundled tools and owner login on real devices before production rollout.

Browser tests and package/signature checks do not replace physical Android device testing or store approval. These packages have not been submitted to either store by this session.
