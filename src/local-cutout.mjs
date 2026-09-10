import { validatePhoto } from './background-removal.mjs';

export function localCutout(file, signal, progress = () => {}) {
  validatePhoto(file);
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Cancelled', 'AbortError'));
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.title = 'Private portrait processing';
    frame.src = new URL('./portrait-ai.html', document.baseURI).href;
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('message', receive);
      signal?.removeEventListener('abort', abort);
      frame.remove();
    };
    const finish = (error, blob) => { cleanup(); error ? reject(error) : resolve(blob); };
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
    const receive = ({source, origin, data}) => {
      if (source !== frame.contentWindow || origin !== location.origin) return;
      if (data?.type === 'ready') frame.contentWindow.postMessage({file}, location.origin);
      if (data?.type === 'progress') progress(data.message);
      if (data?.type === 'error') finish(new Error(data.message));
      if (data?.type === 'result') {
        if (!(data.blob instanceof Blob) || data.blob.type !== 'image/png' || !data.blob.size) return finish(new Error('AI produced an invalid image.'));
        finish(null, data.blob);
      }
    };
    const timer = setTimeout(() => finish(new Error('AI timed out. Check your connection and try a smaller portrait.')), 85000);
    window.addEventListener('message', receive);
    signal?.addEventListener('abort', abort, {once:true});
    progress('Loading lightweight AI… first use needs an internet connection.');
    document.body.append(frame);
  });
}
