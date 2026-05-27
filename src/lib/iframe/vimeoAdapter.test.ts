import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { attachVimeo } from './vimeoAdapter';

/**
 * Vimeo postMessage adapter tests — 5-layer leak defense Layers 2 + 4 + 5.
 *
 * Layer 5: origin allowlist hardcoded to https://player.vimeo.com — messages
 *          from any other origin dropped silently.
 * Layer 4: named const function references (NOT inline closures) so
 *          removeEventListener detaches the listener symmetrically.
 * Layer 2: defensive {method:'removeEventListener', value:'play'} postMessage
 *          to iframe BEFORE Svelte unmounts the iframe DOM node.
 */

const ALLOWED_ORIGIN = 'https://player.vimeo.com';

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
  // jsdom's iframe.contentWindow has a real postMessage; spy on it to capture
  // outgoing calls without actually crossing the origin boundary.
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

describe('attachVimeo — return shape', () => {
  test('returns a dispose function', () => {
    const dispose = attachVimeo(iframe, {});
    expect(typeof dispose).toBe('function');
    dispose();
  });
});

describe('attachVimeo — listener registration', () => {
  test("addEventListener('message', ...) is called on window", () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const dispose = attachVimeo(iframe, {});
    const messageCalls = addSpy.mock.calls.filter((c) => c[0] === 'message');
    expect(messageCalls.length).toBe(1);
    dispose();
  });

  test("iframe.addEventListener('load', ...) is called", () => {
    const addSpy = vi.spyOn(iframe, 'addEventListener');
    const dispose = attachVimeo(iframe, {});
    const loadCalls = addSpy.mock.calls.filter((c) => c[0] === 'load');
    expect(loadCalls.length).toBe(1);
    dispose();
  });
});

describe('attachVimeo — origin allowlist (Layer 5)', () => {
  test('rejects messages from non-allowlist origin', () => {
    const onPlay = vi.fn();
    const dispose = attachVimeo(iframe, { onPlay });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.com',
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'play' }),
      })
    );
    expect(onPlay).not.toHaveBeenCalled();
    dispose();
  });

  test('rejects messages from allowlist origin but wrong source', () => {
    const onPlay = vi.fn();
    const dispose = attachVimeo(iframe, { onPlay });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: window, // wrong source
        data: JSON.stringify({ event: 'play' }),
      })
    );
    expect(onPlay).not.toHaveBeenCalled();
    dispose();
  });

  test('accepts message from correct origin + correct source — onPlay called', () => {
    const onPlay = vi.fn();
    const dispose = attachVimeo(iframe, { onPlay });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'play' }),
      })
    );
    expect(onPlay).toHaveBeenCalledTimes(1);
    dispose();
  });
});

describe('attachVimeo — JSON robustness', () => {
  test('swallows JSON.parse failures silently', () => {
    const onPlay = vi.fn();
    const dispose = attachVimeo(iframe, { onPlay });
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

describe('attachVimeo — event mapping', () => {
  test("onReady fires on event:'ready'", () => {
    const onReady = vi.fn();
    const dispose = attachVimeo(iframe, { onReady });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'ready' }),
      })
    );
    expect(onReady).toHaveBeenCalledTimes(1);
    dispose();
  });

  test("onPause fires on event:'pause'", () => {
    const onPause = vi.fn();
    const dispose = attachVimeo(iframe, { onPause });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'pause' }),
      })
    );
    expect(onPause).toHaveBeenCalledTimes(1);
    dispose();
  });

  test("onError fires on event:'error' with parsed payload", () => {
    const onError = vi.fn();
    const dispose = attachVimeo(iframe, { onError });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'error', name: 'BLOCKED', message: 'autoplay rejected' }),
      })
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toMatchObject({ event: 'error', name: 'BLOCKED' });
    dispose();
  });
});

describe('attachVimeo — load handshake (subscribe to play + pause + error)', () => {
  test('iframe.load triggers 3 postMessage calls (play + pause + error subscription)', () => {
    const dispose = attachVimeo(iframe, {});
    iframe.dispatchEvent(new Event('load'));
    // Phase 5 D-07 / Finding 1: 3 subscribes on load — play + pause + error.
    expect(postMessageSpy).toHaveBeenCalledTimes(3);
    const playCall = postMessageSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('"value":"play"')
    );
    const pauseCall = postMessageSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('"value":"pause"')
    );
    const errorCall = postMessageSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('"value":"error"')
    );
    expect(playCall).toBeTruthy();
    expect(pauseCall).toBeTruthy();
    expect(errorCall).toBeTruthy();
    expect(playCall?.[1]).toBe(ALLOWED_ORIGIN);
    expect(pauseCall?.[1]).toBe(ALLOWED_ORIGIN);
    expect(errorCall?.[1]).toBe(ALLOWED_ORIGIN);
    // Phase 5 D-07 / Finding 1: pause subscription is the load-bearing addition
    // — WatchPlayer (Plan 05-02) chrome-fade-back-in consumes this event.
    expect(pauseCall?.[0]).toContain('"method":"addEventListener"');
    dispose();
  });

  test('attachVimeo onLoad subscribes to pause event (Finding 1)', () => {
    const onPause = vi.fn();
    const dispose = attachVimeo(iframe, { onPause });
    iframe.dispatchEvent(new Event('load'));
    const pauseSubscribe = postMessageSpy.mock.calls.find(
      (c) =>
        typeof c[0] === 'string' &&
        c[0].includes('"method":"addEventListener"') &&
        c[0].includes('"value":"pause"')
    );
    expect(pauseSubscribe).toBeTruthy();
    expect(pauseSubscribe?.[1]).toBe(ALLOWED_ORIGIN);
    dispose();
  });

  test('pause postMessage from ALLOWED_ORIGIN invokes handlers.onPause (routing regression)', () => {
    const onPause = vi.fn();
    const dispose = attachVimeo(iframe, { onPause });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: ALLOWED_ORIGIN,
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'pause' }),
      })
    );
    expect(onPause).toHaveBeenCalledTimes(1);
    dispose();
  });

  test('pause postMessage from foreign origin is ignored (Layer 5 regression)', () => {
    const onPause = vi.fn();
    const dispose = attachVimeo(iframe, { onPause });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example.com',
        source: iframe.contentWindow,
        data: JSON.stringify({ event: 'pause' }),
      })
    );
    expect(onPause).not.toHaveBeenCalled();
    dispose();
  });
});

describe('attachVimeo — dispose (Layer 2 + Layer 4 symmetry)', () => {
  test('dispose() removes both event listeners by SAME reference', () => {
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');
    const iframeRemoveSpy = vi.spyOn(iframe, 'removeEventListener');
    const dispose = attachVimeo(iframe, {});
    dispose();
    const winMsgCalls = windowRemoveSpy.mock.calls.filter((c) => c[0] === 'message');
    const iframeLoadCalls = iframeRemoveSpy.mock.calls.filter((c) => c[0] === 'load');
    expect(winMsgCalls.length).toBe(1);
    expect(iframeLoadCalls.length).toBe(1);
    // Both refs must be FUNCTIONS (not undefined / not inline closures).
    expect(typeof winMsgCalls[0]?.[1]).toBe('function');
    expect(typeof iframeLoadCalls[0]?.[1]).toBe('function');
  });

  test('dispose() sends defensive {method:removeEventListener, value:play} postMessage', () => {
    const dispose = attachVimeo(iframe, {});
    postMessageSpy.mockClear();
    dispose();
    const defensiveCall = postMessageSpy.mock.calls.find(
      (c) =>
        typeof c[0] === 'string' &&
        c[0].includes('"method":"removeEventListener"') &&
        c[0].includes('"value":"play"')
    );
    expect(defensiveCall).toBeTruthy();
    expect(defensiveCall?.[1]).toBe(ALLOWED_ORIGIN);
  });

  test('dispose() sends symmetric {method:removeEventListener, value:pause} postMessage (Finding 1)', () => {
    const dispose = attachVimeo(iframe, {});
    postMessageSpy.mockClear();
    dispose();
    const pauseUnsubscribe = postMessageSpy.mock.calls.find(
      (c) =>
        typeof c[0] === 'string' &&
        c[0].includes('"method":"removeEventListener"') &&
        c[0].includes('"value":"pause"')
    );
    expect(pauseUnsubscribe).toBeTruthy();
    expect(pauseUnsubscribe?.[1]).toBe(ALLOWED_ORIGIN);
  });

  test('dispose() is idempotent — second call is no-op', () => {
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');
    const dispose = attachVimeo(iframe, {});
    dispose();
    dispose();
    dispose();
    const winMsgCalls = windowRemoveSpy.mock.calls.filter((c) => c[0] === 'message');
    expect(winMsgCalls.length).toBe(1); // only the FIRST dispose touches listeners
  });

  test('dispose() does NOT throw when iframe.contentWindow is null', () => {
    const dispose = attachVimeo(iframe, {});
    iframe.remove();
    // After remove, contentWindow may still be present in jsdom but the
    // postMessage spy could be cleared; force the path by replacing with null.
    Object.defineProperty(iframe, 'contentWindow', { configurable: true, value: null });
    expect(() => dispose()).not.toThrow();
  });
});
