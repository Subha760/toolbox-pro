/** Removes only edge-connected pixels near a sampled plain background. */
export function removePlainPixels(data, width, height, tolerance = 45) {
  const count = width * height;
  if (data.length !== count * 4 || !count)
    throw new Error("Invalid portrait pixels.");
  const corners = [0, width - 1, (height - 1) * width, count - 1];
  const background = [0, 1, 2].map(
    (c) => corners.reduce((sum, p) => sum + data[p * 4 + c], 0) / 4,
  );
  const seen = new Uint8Array(count),
    queue = new Uint32Array(count);
  let head = 0,
    tail = 0,
    removed = 0;
  const visit = (p) => {
    if (seen[p]) return;
    seen[p] = 1;
    const i = p * 4;
    const distance = Math.hypot(
      data[i] - background[0],
      data[i + 1] - background[1],
      data[i + 2] - background[2],
    );
    if (distance <= tolerance) {
      queue[tail++] = p;
      data[i + 3] = Math.round(
        255 * Math.max(0, (distance - tolerance * 0.7) / (tolerance * 0.3)),
      );
      removed++;
    }
  };
  for (let x = 0; x < width; x++) {
    visit(x);
    visit((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    visit(y * width);
    visit(y * width + width - 1);
  }
  while (head < tail) {
    const p = queue[head++],
      x = p % width,
      y = Math.floor(p / width);
    if (x) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    if (y) visit(p - width);
    if (y < height - 1) visit(p + width);
  }
  if (removed < count * 0.01 || removed > count * 0.97)
    throw new Error(
      "Use a plain, evenly lit wall with a clearly different foreground, or try AI removal.",
    );
  return data;
}
