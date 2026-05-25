import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Harness from './PreviewLoopContextHarness.svelte';
import { tick } from 'svelte';
import type { Video } from '$lib/data';

/**
 * PreviewLoop — 4-state iframe lifecycle (REEL-06) + 5-layer leak defense +
 * 800ms HANDSHAKE_TIMEOUT_MS (D-07) + Page Visibility pause-not-unmount (D-12).
 *
 * Adapter modules are mocked so the test can drive the lifecycle via the
 * captured handlers (simulates Vimeo/YouTube postMessage events).
 */

// Capture handlers and dispose spies per attach call.
const vimeoAttaches: Array<{
  handlers: Record<string, unknown>;
  dispose: ReturnType<typeof vi.fn>;
}> = [];
const youtubeAttaches: Array<{
  handlers: Record<string, unknown>;
  dispose: ReturnType<typeof vi.fn>;
}> = [];

vi.mock('$lib/iframe/vimeoAdapter', () => ({
  attachVimeo: vi.fn((_iframe: HTMLIFrameElement, handlers: Record<string, unknown>) => {
    const dispose = vi.fn();
    vimeoAttaches.push({ handlers, dispose });
    return dispose;
  }),
}));

vi.mock('$lib/iframe/youtubeAdapter', () => ({
  attachYouTube: vi.fn((_iframe: HTMLIFrameElement, handlers: Record<string, unknown>) => {
    const dispose = vi.fn();
    youtubeAttaches.push({ handlers, dispose });
    return dispose;
  }),
}));

function makeVimeoVideo(overrides: Partial<Video> = {}): Video {
  return {
    source: 'vimeo',
    id: '264677021',
    title: 'A Quiet Documentary',
    uploader: 'Michelle Ngo',
    published: '2024-01-01',
    thumbnail: 'https://example.com/t.jpg',
    embed: 'https://player.vimeo.com/video/264677021',
    category: 'PBS American Portrait',
    featured: false,
    hidden: false,
    tags: [],
    ...overrides,
  } as Video;
}

function makeYouTubeVideo(overrides: Partial<Video> = {}): Video {
  return {
    source: 'youtube',
    id: 'yt123',
    title: 'A YouTube Reel',
    uploader: 'Michelle Ngo',
    published: '2024-01-01',
    thumbnail: 'https://example.com/t.jpg',
    embed: 'https://www.youtube-nocookie.com/embed/yt123',
    category: 'Branded Content',
    featured: false,
    hidden: false,
    tags: [],
    ...overrides,
  } as Video;
}

beforeEach(() => {
  vi.useFakeTimers();
  vimeoAttaches.length = 0;
  youtubeAttaches.length = 0;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('PreviewLoop — iframe attributes (REEL-06 / Pitfall 7)', () => {
  test('renders an iframe with src from buildEmbedUrl preview mode (Vimeo)', () => {
    const video = makeVimeoVideo({ id: '264677021' });
    const { container } = render(Harness, { props: { video } });
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    const src = iframe?.getAttribute('src') ?? '';
    expect(src).toContain('https://player.vimeo.com/video/264677021');
    expect(src).toContain('background=1');
  });

  test('YouTube video produces nocookie-host iframe src', () => {
    const video = makeYouTubeVideo({ id: 'abc123' });
    const { container } = render(Harness, { props: { video } });
    const iframe = container.querySelector('iframe');
    const src = iframe?.getAttribute('src') ?? '';
    expect(src).toContain('https://www.youtube-nocookie.com/embed/abc123');
  });

  test("iframe carries referrerpolicy='strict-origin-when-cross-origin' (Pitfall 7)", () => {
    const video = makeVimeoVideo();
    const { container } = render(Harness, { props: { video } });
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
  });

  test("iframe carries allow='autoplay; fullscreen; picture-in-picture'", () => {
    const video = makeVimeoVideo();
    const { container } = render(Harness, { props: { video } });
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('allow')).toBe('autoplay; fullscreen; picture-in-picture');
  });

  test("iframe carries loading='lazy' and aria-hidden='true'", () => {
    const video = makeVimeoVideo();
    const { container } = render(Harness, { props: { video } });
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('loading')).toBe('lazy');
    expect(iframe?.getAttribute('aria-hidden')).toBe('true');
  });

  test("initial state data-lifecycle-state is 'mounted-loading'", () => {
    const video = makeVimeoVideo();
    const { container } = render(Harness, { props: { video } });
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('data-lifecycle-state')).toBe('mounted-loading');
  });
});

describe('PreviewLoop — adapter wiring', () => {
  test('Vimeo source: attachVimeo called, attachYouTube NOT called', () => {
    const video = makeVimeoVideo();
    render(Harness, { props: { video } });
    expect(vimeoAttaches.length).toBe(1);
    expect(youtubeAttaches.length).toBe(0);
  });

  test('YouTube source: attachYouTube called, attachVimeo NOT called', () => {
    const video = makeYouTubeVideo();
    render(Harness, { props: { video } });
    expect(youtubeAttaches.length).toBe(1);
    expect(vimeoAttaches.length).toBe(0);
  });
});

describe('PreviewLoop — state transitions', () => {
  test("captured onPlay handler transitions data-lifecycle-state to 'mounted-playing'", async () => {
    const video = makeVimeoVideo();
    const { container } = render(Harness, { props: { video } });
    // Drive the lifecycle: simulate Vimeo postMessage 'play' arriving.
    const handlers = vimeoAttaches[0]?.handlers as { onPlay?: () => void };
    handlers.onPlay?.();
    await tick();
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('data-lifecycle-state')).toBe('mounted-playing');
  });

  test("captured onError handler transitions state to 'unmounting' AND iframe removed", async () => {
    const video = makeVimeoVideo();
    const { container } = render(Harness, { props: { video } });
    const handlers = vimeoAttaches[0]?.handlers as { onError?: (e: unknown) => void };
    handlers.onError?.({ event: 'error' });
    await tick();
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeNull();
  });

  test("HANDSHAKE_TIMEOUT_MS (800ms) elapse with no onPlay → state 'unmounting' + iframe removed", async () => {
    const video = makeVimeoVideo();
    const { container } = render(Harness, { props: { video } });
    expect(container.querySelector('iframe')).not.toBeNull();
    vi.advanceTimersByTime(800);
    await tick();
    expect(container.querySelector('iframe')).toBeNull();
  });

  test('onPlay BEFORE 800ms cancels the timeout → iframe stays mounted after 800ms', async () => {
    const video = makeVimeoVideo();
    const { container } = render(Harness, { props: { video } });
    vi.advanceTimersByTime(100);
    const handlers = vimeoAttaches[0]?.handlers as { onPlay?: () => void };
    handlers.onPlay?.();
    await tick();
    vi.advanceTimersByTime(1000);
    await tick();
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('data-lifecycle-state')).toBe('mounted-playing');
  });
});

describe('PreviewLoop — dispose (Layer 2 ordering)', () => {
  test('dispose() is called when component unmounts', () => {
    const video = makeVimeoVideo();
    const { unmount } = render(Harness, { props: { video } });
    const captured = vimeoAttaches[0];
    expect(captured?.dispose).not.toBeUndefined();
    unmount();
    // dispose() runs as part of $effect cleanup chain. The Layer 2 guarantee
    // about "before iframe DOM removal" is enforced by the adapter's
    // try/catch around the defensive postMessage (iframe may already be
    // detached). Here we only assert dispose was invoked exactly once at
    // teardown.
    expect(captured?.dispose).toHaveBeenCalledTimes(1);
  });

  test('dispose() also runs when iframeEl unbinds (state → unmounting)', async () => {
    const video = makeVimeoVideo();
    render(Harness, { props: { video } });
    const captured = vimeoAttaches[0];
    expect(captured?.dispose).toHaveBeenCalledTimes(0);
    // Force the state transition that drops the iframe from the DOM.
    vi.advanceTimersByTime(800);
    await tick();
    // Effect re-runs because iframeEl changed (bound to null when {#if} false).
    // Cleanup of the prior effect run invokes dispose().
    expect(captured?.dispose).toHaveBeenCalledTimes(1);
  });
});

describe('PreviewLoop — Page Visibility (D-12 / REEL-07)', () => {
  test("hidden=true while state='mounted-playing' triggers postMessage 'pause' (Vimeo)", async () => {
    const video = makeVimeoVideo();
    const { container, rerender } = render(Harness, {
      props: { video, documentHidden: false },
    });
    // Reach mounted-playing.
    const handlers = vimeoAttaches[0]?.handlers as { onPlay?: () => void };
    handlers.onPlay?.();
    await tick();
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const pmSpy = vi.fn();
    Object.defineProperty(iframe.contentWindow, 'postMessage', {
      configurable: true,
      value: pmSpy,
    });
    // Now flip visibility → hidden.
    await rerender({ video, documentHidden: true });
    await tick();
    const pauseCall = pmSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('"method":"pause"')
    );
    expect(pauseCall).toBeTruthy();
    expect(pauseCall?.[1]).toBe('https://player.vimeo.com');
  });

  test("hidden=true while state='mounted-loading' does NOT trigger postMessage (Pitfall 5 gate)", async () => {
    const video = makeVimeoVideo();
    const { container, rerender } = render(Harness, {
      props: { video, documentHidden: false },
    });
    // Do NOT call onPlay — stay in 'mounted-loading'.
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const pmSpy = vi.fn();
    Object.defineProperty(iframe.contentWindow, 'postMessage', {
      configurable: true,
      value: pmSpy,
    });
    await rerender({ video, documentHidden: true });
    await tick();
    expect(pmSpy).not.toHaveBeenCalled();
  });

  test("hidden=false resume triggers postMessage 'play' ONLY on hidden→visible transition (Vimeo)", async () => {
    const video = makeVimeoVideo();
    const { container, rerender } = render(Harness, {
      props: { video, documentHidden: false },
    });
    const handlers = vimeoAttaches[0]?.handlers as { onPlay?: () => void };
    handlers.onPlay?.();
    await tick();
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const pmSpy = vi.fn();
    Object.defineProperty(iframe.contentWindow, 'postMessage', {
      configurable: true,
      value: pmSpy,
    });
    // First flip → hidden (sets wasHidden=true)
    await rerender({ video, documentHidden: true });
    await tick();
    pmSpy.mockClear();
    // Second flip → visible (the transition that should send 'play')
    await rerender({ video, documentHidden: false });
    await tick();
    const playCall = pmSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('"method":"play"')
    );
    expect(playCall).toBeTruthy();
    expect(playCall?.[1]).toBe('https://player.vimeo.com');
  });

  test('initial render with documentHidden=false does NOT trigger spurious play postMessage', async () => {
    const video = makeVimeoVideo();
    const { container } = render(Harness, {
      props: { video, documentHidden: false },
    });
    const handlers = vimeoAttaches[0]?.handlers as { onPlay?: () => void };
    handlers.onPlay?.();
    await tick();
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const pmSpy = vi.fn();
    Object.defineProperty(iframe.contentWindow, 'postMessage', {
      configurable: true,
      value: pmSpy,
    });
    // Wait a tick — the visibility effect should NOT fire a play postMessage
    // because wasHidden is still false (no hidden→visible transition has occurred).
    await tick();
    const playCalls = pmSpy.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('"method":"play"')
    );
    expect(playCalls.length).toBe(0);
  });

  test('YouTube pause uses {event:command, func:pauseVideo} → nocookie origin', async () => {
    const video = makeYouTubeVideo();
    const { container, rerender } = render(Harness, {
      props: { video, documentHidden: false },
    });
    const handlers = youtubeAttaches[0]?.handlers as { onPlay?: () => void };
    handlers.onPlay?.();
    await tick();
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const pmSpy = vi.fn();
    Object.defineProperty(iframe.contentWindow, 'postMessage', {
      configurable: true,
      value: pmSpy,
    });
    await rerender({ video, documentHidden: true });
    await tick();
    const pauseCall = pmSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('"func":"pauseVideo"')
    );
    expect(pauseCall).toBeTruthy();
    expect(pauseCall?.[1]).toBe('https://www.youtube-nocookie.com');
  });
});

describe('PreviewLoop — onautoplayfailed callback (REEL-04 fallback signal)', () => {
  test('onautoplayfailed fires when 800ms HANDSHAKE_TIMEOUT_MS elapses in mounted-loading', async () => {
    const video = makeVimeoVideo();
    const onautoplayfailed = vi.fn();
    render(Harness, { props: { video, onautoplayfailed } });
    vi.advanceTimersByTime(800);
    await tick();
    expect(onautoplayfailed).toHaveBeenCalledTimes(1);
  });

  test('onautoplayfailed fires when onError handler is invoked', async () => {
    const video = makeVimeoVideo();
    const onautoplayfailed = vi.fn();
    render(Harness, { props: { video, onautoplayfailed } });
    const handlers = vimeoAttaches[0]?.handlers as { onError?: (e: unknown) => void };
    handlers.onError?.({ event: 'error' });
    await tick();
    expect(onautoplayfailed).toHaveBeenCalledTimes(1);
  });

  test('onautoplayfailed is NOT called when onPlay arrives before 800ms', async () => {
    const video = makeVimeoVideo();
    const onautoplayfailed = vi.fn();
    render(Harness, { props: { video, onautoplayfailed } });
    vi.advanceTimersByTime(100);
    const handlers = vimeoAttaches[0]?.handlers as { onPlay?: () => void };
    handlers.onPlay?.();
    await tick();
    vi.advanceTimersByTime(1000);
    await tick();
    expect(onautoplayfailed).not.toHaveBeenCalled();
  });

  test('onautoplayfailed is optional — PreviewLoop mounted without it does not throw', async () => {
    const video = makeVimeoVideo();
    expect(() => render(Harness, { props: { video } })).not.toThrow();
    const handlers = vimeoAttaches[0]?.handlers as { onError?: (e: unknown) => void };
    expect(() => handlers.onError?.({ event: 'error' })).not.toThrow();
  });
});
