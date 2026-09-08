import test from 'node:test';
import assert from 'node:assert/strict';
import { requestCutout, validateEndpoint, validatePhoto } from '../src/background-removal.mjs';

const photo = new Blob(['test photo'], { type: 'image/png' });
const endpoint = 'https://studio.example/v1/remove-background';

test('does not upload when no backend has been configured', async () => {
  await assert.rejects(requestCutout(photo, '', undefined, () => { throw new Error('must not call'); }), /not available yet/);
});
test('no credentials are sent to the configured backend', async () => {
  const result = await requestCutout(photo, endpoint, undefined, async (url, options) => {
    assert.equal(url, endpoint);
    assert.equal(options.body, photo);
    assert.equal(options.credentials, 'omit');
    assert.deepEqual(options.headers, { 'Content-Type': 'image/png' });
    return new Response(new Blob(['png'], { type: 'image/png' }));
  });
  assert.equal(result.size, 3);
});
test('rejects HTML error pages returned with HTTP 200', async () => {
  await assert.rejects(requestCutout(photo, endpoint, undefined, async () => new Response('<html/>', { headers: { 'Content-Type': 'text/html' } })), /invalid image/);
});
test('reports busy without automatic retries', async () => {
  let calls = 0;
  await assert.rejects(requestCutout(photo, endpoint, undefined, async () => { calls++; return new Response('', {status:429}); }), /busy/);
  assert.equal(calls, 1);
});
test('rejects unsafe endpoints and oversized or unsupported files', () => {
  for (const url of ['http://studio.example', 'https://secret@studio.example', 'https://studio.example?key=secret']) assert.throws(() => validateEndpoint(url));
  assert.throws(() => validatePhoto({type:'image/png', size:11*1024*1024}));
  assert.throws(() => validatePhoto({type:'image/svg+xml', size:100}));
});
