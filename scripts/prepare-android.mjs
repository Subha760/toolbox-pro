import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
const path = "android/app/build.gradle";
let gradle = await readFile(path, "utf8");
gradle = gradle
  .replace(/versionCode \d+/, "versionCode 40006")
  .replace(/versionName "[^"]+"/, 'versionName "4.6.0"');
if (!gradle.includes("TOOLINGER_KEYSTORE")) {
  gradle = gradle
    .replace(
      "    buildTypes {",
      `    signingConfigs {
        release {
            if (System.getenv('TOOLINGER_KEYSTORE')) {
                storeFile file(System.getenv('TOOLINGER_KEYSTORE'))
                storePassword System.getenv('TOOLINGER_STORE_PASSWORD')
                keyAlias System.getenv('TOOLINGER_KEY_ALIAS')
                keyPassword System.getenv('TOOLINGER_KEY_PASSWORD')
            }
        }
    }
    buildTypes {`,
    )
    .replace(
      "        release {\n            minifyEnabled",
      "        release {\n            signingConfig signingConfigs.release\n            minifyEnabled",
    );
}
await writeFile(path, gradle);
const manifest = "android/app/src/main/AndroidManifest.xml";
let xml = await readFile(manifest, "utf8");
xml = xml.replace('android:allowBackup="true"', 'android:allowBackup="false"');
await writeFile(manifest, xml);
for (const [dpi, size] of [
  ["mdpi", 48],
  ["hdpi", 72],
  ["xhdpi", 96],
  ["xxhdpi", 144],
  ["xxxhdpi", 192],
]) {
  const folder = `android/app/src/main/res/mipmap-${dpi}`;
  await mkdir(folder, { recursive: true });
  for (const name of [
    "ic_launcher",
    "ic_launcher_round",
    "ic_launcher_foreground",
  ])
    await copyFile(
      `public/app-icons/toolinger-${size}.png`,
      `${folder}/${name}.png`,
    );
}
// Use the canonical store artwork in adaptive icons too, avoiding a separately
// hand-drawn mark that can drift from the listing icon.
await mkdir("android/app/src/main/res/drawable-nodpi", { recursive: true });
await copyFile(
  "public/app-icons/toolinger-512.png",
  "android/app/src/main/res/drawable-nodpi/toolinger_launcher_art.png",
);
await writeFile(
  "android/app/src/main/res/drawable/ic_launcher_foreground.xml",
  '<inset xmlns:android="http://schemas.android.com/apk/res/android" android:inset="16.6667%"><bitmap android:src="@drawable/toolinger_launcher_art" android:gravity="fill"/></inset>',
);
await writeFile(
  "android/app/src/main/res/drawable/ic_launcher_background.xml",
  '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><solid android:color="#10105c"/></shape>',
);
console.log(
  "Android release version, brand icons and secure signing configuration prepared.",
);

for (const name of ["ic_launcher", "ic_launcher_round"]) {
  await writeFile(
    `android/app/src/main/res/mipmap-anydpi-v26/${name}.xml`,
    `<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@drawable/ic_launcher_background"/><foreground android:drawable="@drawable/ic_launcher_foreground"/></adaptive-icon>`,
  );
}
