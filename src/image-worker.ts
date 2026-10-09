import { filterPixels } from "./image-engine.mjs";
self.onmessage = ({ data: job }) => {
  try {
    const pixels = filterPixels(
      new Uint8ClampedArray(job.buffer),
      job.width,
      job.height,
      job.mode,
      job.brightness,
      job.contrast,
    );
    self.postMessage({ buffer: pixels.buffer }, { transfer: [pixels.buffer] });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
