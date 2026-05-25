import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { attachYouTube } from './youtubeAdapter';

/**
 * YouTube postMessage adapter tests — 5-layer leak defense Layers 4 + 5.
 *
 * Notable contrasts vs Vimeo:
 *   - YouTube has no clean unsubscribe; dispose() does NOT send a defensive
 *     postMessage (relies on Layer 1 — Svelte iframe DOM teardown).
 *   - Parent must post {event:'listening', id:'<iframe-id>'} on iframe load to
 *     start receiving onReady / onStateChange / onError events.
 */

const ALLOWED_ORIGIN = 'https://www.youtube-nocookie.com';

function makeIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.src = 'about:blank';
  document.body.appendChild(iframe);
  return iframe;
}

let iframe: HTMLIFrameElement;
let postMessageSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  iframe = makeIframe();
  postMessageSpy = vi.fn();
  Object.defineProperty(iframe.contentWindow, 'postMessage', {
    configurable: true,
    value: postMessageSpy,
  });
});

afterEach(() => {
  iframe.remove();
  vi.restoreAllMocks();
});

describe('attachYouTube — origin allowlist (Layer 5; D-06 nocookie host)', () => {
  test('rejects messages from cookie host https://www.youtube.com', () => {
    const onReady = vi.fn();
    const dispose = attachYouTube(iframe, { onReady });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://www.youtube.com',
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'onReady' }),
      })
    );
    expect(onReady).not.toHaveBeenCalled();
    dispose();
  });

  test('accepts message from nocookie host with correct source — onReady fires', () => {
    const onReady = vi.fn();
    const dispose = attachYouTube(iframe, { onReady });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'onReady' }),
      })
    );
    expect(onReady).toHaveBeenCalledTimes(1);
    dispose();
  });

  test('rejects allowlist origin with wrong source', () => {
    const onReady = vi.fn();
    const dispose = attachYouTube(iframe, { onReady });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: window,
        data: JSON.stringify({ event: 'onReady' }),
      })
    );
    expect(onReady).not.toHaveBeenCalled();
    dispose();
  });
});

describe('attachYouTube — onStateChange info codes', () => {
  test('onStateChange info=1 (PLAYING) → onPlay called', () => {
    const onPlay = vi.fn();
    const dispose = attachYouTube(iframe, { onPlay });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'onStateChange', info: 1 }),
      })
    );
    expect(onPlay).toHaveBeenCalledTimes(1);
    dispose();
  });

  test('onStateChange info=2 (PAUSED) → onPause called', () => {
    const onPause = vi.fn();
    const dispose = attachYouTube(iframe, { onPause });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'onStateChange', info: 2 }),
      })
    );
    expect(onPause).toHaveBeenCalledTimes(1);
    dispose();
  });

  test('onStateChange info=0 (ENDED) → neither onPlay nor onPause called', () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const dispose = attachYouTube(iframe, { onPlay, onPause });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'onStateChange', info: 0 }),
      })
    );
    expect(onPlay).not.toHaveBeenCalled();
    expect(onPause).not.toHaveBeenCalled();
    dispose();
  });
});

describe('attachYouTube — onError and infoDelivery', () => {
  test('onError fires on event:onError with info payload', () => {
    const onError = vi.fn();
    const dispose = attachYouTube(iframe, { onError });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'onError', info: 150 }),
      })
    );
    expect(onError).toHaveBeenCalledWith(150);
    dispose();
  });

  test('infoDelivery event is ignored', () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const onError = vi.fn();
    const dispose = attachYouTube(iframe, { onPlay, onPause, onError });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'infoDelivery', info: { currentTime: 1.2 } }),
      })
    );
    expect(onPlay).not.toHaveBeenCalled();
    expect(onPause).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    dispose();
  });
});

describe('attachYouTube — load handshake', () => {
  test('iframe.load dispatches ONE-SHOT listening postMessage with iframe.id', () => {
    iframe.id = 'test-yt-1';
    const dispose = attachYouTube(iframe, {});
    iframe.dispatchEvent(new Event('load'));
    expect(postMessageSpy).toHaveBeenCalledTimes(1);
    const [payload, origin] = postMessageSpy.mock.calls[0] ?? [];
    expect(typeof payload).toBe('string');
    const parsed = JSON.parse(payload as string);
    expect(parsed).toEqual({ event: 'listening', id: 'test-yt-1' });
    expect(origin).toBe(ALLOWED_ORIGIN);
    dispose();
  });

  test("uses 'reel-yt' fallback id when iframe.id is empty", () => {
    iframe.id = '';
    const dispose = attachYouTube(iframe, {});
    iframe.dispatchEvent(new Event('load'));
    const [payload] = postMessageSpy.mock.calls[0] ?? [];
    const parsed = JSON.parse(payload as string);
    expect(parsed.id).toBe('reel-yt');
    dispose();
  });
});

describe('attachYouTube — dispose', () => {
  test('dispose() removes both listeners by SAME reference', () => {
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');
    const iframeRemoveSpy = vi.spyOn(iframe, 'removeEventListener');
    const dispose = attachYouTube(iframe, {});
    dispose();
    const winMsgCalls = windowRemoveSpy.mock.calls.filter((c) => c[0] === 'message');
    const iframeLoadCalls = iframeRemoveSpy.mock.calls.filter((c) => c[0] === 'load');
    expect(winMsgCalls.length).toBe(1);
    expect(iframeLoadCalls.length).toBe(1);
    expect(typeof winMsgCalls[0]?.[1]).toBe('function');
    expect(typeof iframeLoadCalls[0]?.[1]).toBe('function');
  });

  test('dispose() does NOT send a defensive postMessage (YouTube has no clean unsubscribe)', () => {
    const dispose = attachYouTube(iframe, {});
    postMessageSpy.mockClear();
    dispose();
    expect(postMessageSpy).not.toHaveBeenCalled();
  });

  test('dispose() is idempotent — second call is a no-op', () => {
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');
    const dispose = attachYouTube(iframe, {});
    dispose();
    dispose();
    dispose();
    const winMsgCalls = windowRemoveSpy.mock.calls.filter((c) => c[0] === 'message');
    expect(winMsgCalls.length).toBe(1);
  });
});

describe('attachYouTube — JSON robustness', () => {
  test('swallows JSON.parse failures silently', () => {
    const onPlay = vi.fn();
    const dispose = attachYouTube(iframe, { onPlay });
    expect(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: ALLOWED_ORIGIN,
          source: iframe.contentWindow,
          data: 'not-json{',
        })
      );
    }).not.toThrow();
    expect(onPlay).not.toHaveBeenCalled();
    dispose();
  });
});
