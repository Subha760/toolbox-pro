export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function validatePhoto(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP photo.');
  }
  if (!file.size || file.size > MAX_PHOTO_BYTES) throw new Error('Choose a photo smaller than 10 MB.');
}

export function validateEndpoint(value) {
  if (!value) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('The photo service configuration is invalid.');
  }
  return url.href;
}

export async function requestCutout(file, endpoint, signal, fetcher = fetch) {
  validatePhoto(file);
  const target = validateEndpoint(endpoint);
  if (!target) throw new Error('Background removal is not available yet. Cropping and downloads still work.');
  const response = await fetcher(target, {
    method: 'POST', body: file, signal, credentials: 'omit', cache: 'no-store',
    headers: { 'Content-Type': file.type },
  });
  const errors = {
    400: 'This photo could not be decoded. Try a different JPG or PNG.',
    403: 'The photo service is not configured for this website yet.',
    413: 'This image is too large. Use a photo below 10 MB and 16 megapixels.',
    415: 'Choose a JPG, PNG or WebP photo.',
    422: 'No usable subject was found. Try a clearer portrait.',
    429: 'The studio is busy. Please wait a minute and try again.',
    503: 'The studio is warming up or busy. Please try again shortly.',
  };
  if (!response.ok) throw new Error(errors[response.status] || 'Background removal failed. Your original photo is unchanged.');
  if (!response.headers.get('content-type')?.startsWith('image/png')) throw new Error('The service returned an invalid image.');
  const blob = await response.blob();
  if (!blob.size || blob.size > 32 * 1024 * 1024) throw new Error('The service returned an invalid image size.');
  return blob;
}
