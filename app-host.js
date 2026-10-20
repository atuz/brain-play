// WKWebView exposes this handler before the page loads. The URL flag is also
// supported so an App can identify itself without relying on a user-agent guess.
export function connectAppHost(href, host = {}) {
  const flag = new URL(href).searchParams.get('app');
  const handler = () => host.webkit?.messageHandlers?.brainPlay;
  const available = () => typeof handler()?.postMessage === 'function';
  const embedded = flag !== '0' && (flag === '1' || available());
  function send(type) {
    if (!embedded || !available()) return false;
    try {
      handler().postMessage({ type, source: 'brain-play', version: 1 });
      return true;
    } catch { return false; }
  }
  return { embedded, ready: () => send('ready'), close: () => send('close') };
}
