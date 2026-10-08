/** Parse 1-based pages and inclusive ranges, preserving user order. */
export function parsePageSelection(raw, total) {
  if (!raw.trim())
    throw new Error("Enter page numbers or ranges, such as 3,1-2.");
  const pages = [];
  for (const part of raw.split(",")) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error("Use page numbers or ranges, such as 3,1-2.");
    const start = Number(match[1]),
      end = Number(match[2] ?? match[1]);
    if (start < 1 || end > total || start > end)
      throw new Error(`Pages must be between 1 and ${total}.`);
    for (let page = start; page <= end; page++)
      if (!pages.includes(page - 1)) pages.push(page - 1);
  }
  return pages;
}

function secureIndex(size) {
  const limit = Math.floor(0x100000000 / size) * size;
  const bytes = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(bytes);
  } while (bytes[0] >= limit);
  return bytes[0] % size;
}
export function securePassword(length, groups) {
  if (!globalThis.crypto?.getRandomValues)
    throw new Error("Secure randomness requires a current browser over HTTPS.");
  if (!groups.length) throw new Error("Choose a character type.");
  const count = Math.max(
    groups.length,
    Math.min(64, Math.max(8, Math.floor(length) || 16)),
  );
  const source = groups.join("");
  const result = groups.map((group) => group[secureIndex(group.length)]);
  while (result.length < count) result.push(source[secureIndex(source.length)]);
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join("");
}
export function portraitLayout(
  iw,
  ih,
  width,
  height,
  zoom = 100,
  horizontal = 50,
  vertical = 50,
) {
  const scale = (Math.max(width / iw, height / ih) * Math.max(100, zoom)) / 100;
  const drawWidth = iw * scale,
    drawHeight = ih * scale;
  return {
    drawWidth,
    drawHeight,
    dx: (-(drawWidth - width) * horizontal) / 100,
    dy: (-(drawHeight - height) * vertical) / 100,
  };
}
/** 4x6 sheet in 300-DPI pixels, with 0.1-inch borders and gaps. */
export function sheetLayout(width, height) {
  const margin = 30,
    gap = 30,
    sheetWidth = 1200,
    sheetHeight = 1800;
  const columns = Math.floor((sheetWidth - margin * 2 + gap) / (width + gap));
  const rows = Math.floor((sheetHeight - margin * 2 + gap) / (height + gap));
  const positions = [];
  const left = (sheetWidth - columns * width - (columns - 1) * gap) / 2;
  const top = (sheetHeight - rows * height - (rows - 1) * gap) / 2;
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++)
      positions.push({
        x: left + col * (width + gap),
        y: top + row * (height + gap),
      });
  return { positions, sheetWidth, sheetHeight };
}
