/**
 * YouTube postMessage adapter — 5-layer leak defense Layers 4 + 5.
 *
 * Protocol (verified RESEARCH §Code Examples):
 *   Parent posts {event:'listening', id:'<iframe-id>'} after iframe load.
 *   YouTube responds with {event:'onReady'}, {event:'onStateChange', info:N},
 *   {event:'onError', info:N}, {event:'infoDelivery', info:{...}}.
 *   YT_STATE_PLAYING=1, YT_STATE_PAUSED=2 (the two we map to handlers).
 *
 * One-shot listening (RESEARCH §Open Question 2): YouTube's official
 * iframe_api.js re-posts {event:'listening'} every 250ms. We ship one-shot;
 * if BrowserStack iOS 16 shows missed onReady, add a 250ms heartbeat for the
 * first 2s of lifecycle (Plan 03-03 matrix run is the gate).
 *
 * No defensive removeEventListener postMessage — YouTube has no clean
 * unsubscribe protocol. We rely on Layer 1 (Svelte iframe DOM teardown).
 *
 * Source:
 *   - https://developers.google.com/youtube/iframe_api_reference
 *   - https://developers.google.com/youtube/player_parameters
 */

const ALLOWED_ORIGIN = 'https://www.youtube-nocookie.com';
const YT_STATE_PLAYING = 1;
const YT_STATE_PAUSED = 2;

export type YouTubeHandlers = {
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (err: unknown) => void;
};

export function attachYouTube(iframe: HTMLIFrameElement, handlers: YouTubeHandlers): () => void {
  let disposed = false;

  // Layer 4: named ref (NOT inline closure).
  const onMsg = (e: MessageEvent): void => {
    // Layer 5: origin allowlist.
    if (e.origin !== ALLOWED_ORIGIN) return;
    if (e.source !== iframe.contentWindow) return;
    let data: unknown;
    try {
      data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch {
      return;
    }
    if (typeof data !== 'object' || data === null) return;
    const event = (data as { event?: string }).event;
    const info = (data as { info?: number | { errorCode?: number } }).info;
    if (event === 'onReady') handlers.onReady?.();
    else if (event === 'onStateChange') {
      if (info === YT_STATE_PLAYING) handlers.onPlay?.();
      else if (info === YT_STATE_PAUSED) handlers.onPause?.();
    } else if (event === 'onError') handlers.onError?.(info);
    // infoDelivery + other events: ignored
  };

  // Layer 4: named ref.
  const onLoad = (): void => {
    // One-shot listening handshake. RESEARCH §Open Question 2 escalation path:
    // add a 250ms heartbeat for the first 2s if BrowserStack iOS 16 misses onReady.
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening', id: iframe.id || 'reel-yt' }),
      ALLOWED_ORIGIN
    );
  };

  window.addEventListener('message', onMsg);
  iframe.addEventListener('load', onLoad);

  return function dispose(): void {
    if (disposed) return; // idempotent
    disposed = true;
    iframe.removeEventListener('load', onLoad);
    window.removeEventListener('message', onMsg);
    // No defensive postMessage — YouTube has no clean unsubscribe. Layer 1
    // (Svelte iframe DOM removal) tears down contentWindow.
  };
}
