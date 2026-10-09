import { Capacitor } from "@capacitor/core";
export function saveDownload(blob: Blob, name: string) {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  void (async () => {
    if (blob.size > 80 * 1024 * 1024)
      throw Error(
        "This export is too large for the Android share sheet. Use the website for large files.",
      );
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(Error("Unable to prepare download"));
      reader.readAsDataURL(blob);
    });
    const path = `toolinger/${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const file = await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({
      title: name,
      files: [file.uri],
      dialogTitle: "Save or share your Toolinger file",
    });
  })().catch((error) =>
    window.dispatchEvent(
      new CustomEvent("toolinger:download-error", {
        detail: error.message || "Unable to save the file",
      }),
    ),
  );
}
