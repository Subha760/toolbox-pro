const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export function filterPixels(
  data,
  widthPx,
  heightPx,
  mode,
  brightness = 0,
  contrast = 0,
) {
  if (mode === "brightness-contrast") {
    const bright = clamp(Number(brightness) || 0, -100, 100);
    const contrastValue = clamp(Number(contrast) || 0, -100, 100);
    const factor =
      (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));

    for (let index = 0; index < data.length; index += 4) {
      data[index] = clamp(factor * (data[index] - 128) + 128 + bright, 0, 255);
      data[index + 1] = clamp(
        factor * (data[index + 1] - 128) + 128 + bright,
        0,
        255,
      );
      data[index + 2] = clamp(
        factor * (data[index + 2] - 128) + 128 + bright,
        0,
        255,
      );
    }
  }

  if (mode === "grayscale") {
    for (let index = 0; index < data.length; index += 4) {
      const avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
      data[index] = avg;
      data[index + 1] = avg;
      data[index + 2] = avg;
    }
  }

  if (mode === "sepia") {
    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      data[index] = clamp(0.393 * red + 0.769 * green + 0.189 * blue, 0, 255);
      data[index + 1] = clamp(
        0.349 * red + 0.686 * green + 0.168 * blue,
        0,
        255,
      );
      data[index + 2] = clamp(
        0.272 * red + 0.534 * green + 0.131 * blue,
        0,
        255,
      );
    }
  }

  if (mode === "blur" || mode === "sharpen") {
    const kernel =
      mode === "blur"
        ? [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9]
        : [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const copy = new Uint8ClampedArray(data);

    for (let y = 1; y < heightPx - 1; y += 1) {
      for (let x = 1; x < widthPx - 1; x += 1) {
        for (let channel = 0; channel < 3; channel += 1) {
          let sum = 0;
          let kIndex = 0;
          for (let ky = -1; ky <= 1; ky += 1) {
            for (let kx = -1; kx <= 1; kx += 1) {
              const px = ((y + ky) * widthPx + (x + kx)) * 4 + channel;
              sum += copy[px] * kernel[kIndex];
              kIndex += 1;
            }
          }
          const current = (y * widthPx + x) * 4 + channel;
          data[current] = clamp(sum, 0, 255);
        }
      }
    }
  }

  return data;
}
