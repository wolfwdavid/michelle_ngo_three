/**
 * Vimeo postMessage adapter — 5-layer leak defense Layers 2 + 4 + 5.
 *
 * Layer 5 (origin allowlist): hardcoded ALLOWED_ORIGIN; messages from any other
 *   origin (e.g., a malicious cross-origin iframe) are dropped silently.
 *
 * Layer 4 (named refs): `onMsg` and `onLoad` are const function references —
 *   NOT inline closures at addEventListener call sites. removeEventListener
 *   requires the SAME reference to actually detach the listener.
 *
 * Layer 2 (defensive dispose): on cleanup, the dispose() closure also sends a
 *   {method:'removeEventListener', value:'play'} postMessage to the iframe so
 *   Vimeo stops firing events at us BEFORE Svelte unmounts the iframe element
 *   (which would tear down contentWindow asynchronously — race risk window).
 *
 * Sources:
 *   - https://developer.vimeo.com/player/sdk/embed (postMessage protocol)
 *   - https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters
 *
 * @param iframe   The iframe element (must already have a src; load event drives subscribe).
 * @param handlers Optional callbacks for ready, play, pause, error events.
 * @returns        A dispose closure to call from $effect cleanup (Layer 2).
 */

const ALLOWED_ORIGIN = 'https://player.vimeo.com';

export type VimeoHandlers = {
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (err: unknown) => void;
};

export function attachVimeo(iframe: HTMLIFrameElement, handlers: VimeoHandlers): () => void {
  let disposed = false;

  // Layer 4: named ref (NOT inline closure). Required for symmetric removeEventListener.
  const onMsg = (e: MessageEvent): void => {
    // Layer 5: origin allowlist.
    if (e.origin !== ALLOWED_ORIGIN) return;
    // Pitfall 4 RESEARCH: source check — drop messages from stale iframe.contentWindow refs.
    if (e.source !== iframe.contentWindow) return;
    let data: unknown;
    try {
      data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch {
      return; // malformed message — silently drop
    }
    if (typeof data !== 'object' || data === null) return;
    const event = (data as { event?: string }).event;
    if (event === 'ready') handlers.onReady?.();
    else if (event === 'play') handlers.onPlay?.();
    else if (event === 'pause') handlers.onPause?.();
    else if (event === 'error') handlers.onError?.(data);
  };

  // Layer 4: named ref.
  const onLoad = (): void => {
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: 'addEventListener', value: 'play' }),
      ALLOWED_ORIGIN
    );
    // Phase 5 D-07 / Finding 1: Vimeo requires explicit subscription per event
    // name; without this addEventListener post, the iframe NEVER sends 'pause'
    // events even though our onMsg switch already routes them to handlers.onPause.
    // WatchPlayer's chrome-fade-back-in (Plan 05-02) consumes this.
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: 'addEventListener', value: 'pause' }),
      ALLOWED_ORIGIN
    );
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: 'addEventListener', value: 'error' }),
      ALLOWED_ORIGIN
    );
  };

  window.addEventListener('message', onMsg);
  iframe.addEventListener('load', onLoad);

  // Layer 2: dispose closure.
  return function dispose(): void {
    if (disposed) return; // idempotent
    disposed = true;
    iframe.removeEventListener('load', onLoad);
    window.removeEventListener('message', onMsg);
    // Defensive: tell Vimeo to stop firing events at us before DOM removal.
    try {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ method: 'removeEventListener', value: 'play' }),
        ALLOWED_ORIGIN
      );
      // Phase 5 D-07 / Finding 1: symmetric Layer 2 removal of the 'pause'
      // subscription added in onLoad. Keeps 5-layer leak defense intact.
      iframe.contentWindow?.postMessage(
        JSON.stringify({ method: 'removeEventListener', value: 'pause' }),
        ALLOWED_ORIGIN
      );
    } catch {
      // iframe may already be detached — swallow
    }
  };
}
