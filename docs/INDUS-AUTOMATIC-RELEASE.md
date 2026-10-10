# Indus automatic updates

Workflow: `.github/workflows/indus-release.yml`.

The Marketplace documentation for https://github.com/marketplace/actions/indus-appstore-release explicitly requires an app to be manually published at least once. It cannot create the first store listing. Marketplace links to the current source at https://github.com/PhonePe/Indus-Flows; its README examples still name the obsolete `indusappstore/appstore-release` repository. The current v1 implementation was inspected and is pinned to commit `d0b550922eff1366945ffe6137a44609752c6dc4`. The APK path uploads to `https://developer-api.indusappstore.com/devtools/apk/upgrade/io.toolinger.app`. No signing key is passed to the action.

1. Open the Indus Developer Console and create the listing for **io.toolinger.app**. Use the signed public APK, logo, screenshots, policies and submission documents from https://github.com/Subha760/toolbox-pro/releases/tag/v4.2.0. Complete the store declarations and wait for initial publication.
2. Generate the Indus Developer API token under Tools & Resources. Save it as the GitHub Actions repository secret **INDUS_APP_STORE_API_TOKEN** at https://github.com/Subha760/toolbox-pro/settings/secrets/actions. Do not paste it into chat, logs or the repository.
3. Set the Actions repository variable **INDUS_FIRST_PUBLISHED** to **true** after the first publication, at https://github.com/Subha760/toolbox-pro/settings/variables/actions.
4. Run **Publish Toolinger update to Indus Appstore** in Actions with a published stable release tag. It also runs automatically after **Publish signed Android release assets** succeeds on main. That trigger supports releases created by GitHub's built-in workflow token, which do not trigger ordinary release-event workflows.

The workflow uploads only the signed public APK and verifies its published SHA-256 checksum. It does not upload the private owner app or share the signing key with the action. Version codes must increase and updates must preserve the original signing key. The publishing workflow must finish successfully before a store upload starts. If initial publication, a token, or the action repository is unavailable, the prerequisite job explains the missing setup and skips the upload. Store acceptance, review and publication are controlled by Indus.

The connected GitHub integration returned HTTP 403 for repository Actions-secret and variable access. Those account settings must be configured by the repository owner.
