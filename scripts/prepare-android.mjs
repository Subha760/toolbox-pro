import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
const path = "android/app/build.gradle";
let gradle = await readFile(path, "utf8");
gradle = gradle
  .replace(/versionCode \d+/, "versionCode 40004")
  .replace(/versionName "[^"]+"/, 'versionName "4.4.0"');
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
const vector = `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><group android:translateX="22" android:translateY="22"><path android:fillColor="#f9f6ee" android:pathData="M13,17h38v10H38v25H26V27H13z"/><path android:fillColor="#d4f14b" android:pathData="M49,40l2,5 5,2 -5,2 -2,5 -2,-5 -5,-2 5,-2z"/></group></vector>`;
await writeFile(
  "android/app/src/main/res/drawable/ic_launcher_foreground.xml",
  vector,
);
await writeFile(
  "android/app/src/main/res/drawable/ic_launcher_background.xml",
  '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><solid android:color="#244bff"/></shape>',
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
