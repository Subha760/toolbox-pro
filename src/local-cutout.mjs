import { validatePhoto } from "./background-removal.mjs";
/** Portrait matting runs in a CPU worker, so it does not require WebGL. */
export function localCutout(file, signal, progress = (message) => {}) {
  validatePhoto(file);
  return new Promise((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException("Cancelled", "AbortError"));
    const worker = new Worker(
      new URL("./portrait-worker.ts", import.meta.url),
      { type: "module" },
    );
    let done = false;
    const finish = (error, blob) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      worker.terminate();
      error ? reject(error) : resolve(blob);
    };
    const abort = () => finish(new DOMException("Cancelled", "AbortError"));
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            "Portrait processing timed out. Try a smaller photo or plain-wall removal. Your original can still be cropped and downloaded.",
          ),
        ),
      150000,
    );
    signal?.addEventListener("abort", abort, { once: true });
    worker.onerror = () =>
      finish(
        new Error(
          "Portrait processing could not start. Try a current browser or plain-wall removal.",
        ),
      );
    worker.onmessage = ({ data }) => {
      if (data.type === "progress") progress(data.message);
      else if (data.type === "error") finish(new Error(data.message));
      else if (data.type === "result") {
        if (!(data.blob instanceof Blob) || !data.blob.size)
          return finish(new Error("No usable portrait was produced."));
        finish(null, data.blob);
      }
    };
    worker.postMessage({
      file,
      base: new URL(import.meta.env.BASE_URL, location.origin).href,
    });
  });
}
