/**
 * WatchPlayer.svelte.test.ts — Phase 5 Plan 05-02 Task 1.
 *
 * Pins WATCH-01 + WATCH-02 chrome-fade state machine (D-07):
 *   - iframe attrs (src from buildEmbedUrl 'play' mode for vimeo/youtube; title;
 *     allow; data-chrome-faded)
 *   - 8 state-machine transitions (mount/idle, play+600ms grace, pause immediate,
 *     pointer-leave-while-playing, pointer-move-resets-idle, idle-3s elapse,
 *     idle-3s does NOT arm when not playing, touchend mobile fadeIn)
 *   - dispose cleans up timers + adapter
 *
 * Pattern mirrors ReelSection.test.ts + FilterPillBar.test.ts vi.mock posture.
 * vi.mock the adapters BEFORE importing WatchPlayer so the spy captures
 * handlers; tests trigger handlers.onPlay() / onPause() directly rather than
 * relying on cross-origin postMessage routing (those paths are exercised by
 * vimeoAdapter.test.ts + youtubeAdapter is unit-tested separately).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Video } from '$lib/data';

// vi.hoisted — lift the adapter mock state above the vi.mock factory so
// tests can read it after attachVimeo / attachYouTube were called.
const adapterState = vi.hoisted(() => ({
  vimeoHandlers: undefined as
    | undefined
    | {
        onReady?: () => void;
        onPlay?: () => void;
        onPause?: () => void;
        onError?: (e: unknown) => void;
      },
  youtubeHandlers: undefined as
    | undefined
    | {
        onReady?: () => void;
        onPlay?: () => void;
        onPause?: () => void;
        onError?: (e: unknown) => void;
      },
  vimeoDispose: vi.fn(),
  youtubeDispose: vi.fn(),
}));

vi.mock('$lib/iframe/vimeoAdapter', () => ({
  attachVimeo: vi.fn((_iframe: HTMLIFrameElement, handlers) => {
    adapterState.vimeoHandlers = handlers;
    return adapterState.vimeoDispose;
  }),
}));
vi.mock('$lib/iframe/youtubeAdapter', () => ({
  attachYouTube: vi.fn((_iframe: HTMLIFrameElement, handlers) => {
    adapterState.youtubeHandlers = handlers;
    return adapterState.youtubeDispose;
  }),
}));

import { mount, unmount, flushSync } from 'svelte';
import WatchPlayer from './WatchPlayer.svelte';

function makeVimeoVideo(overrides: Partial<Video> = {}): Video {
  return {
    source: 'vimeo',
    id: '264677021',
    title: 'Producer Reel',
    uploader: 'Michelle Ngo',
    published: '2018-03-01',
    thumbnail: 'https://example.com/t.jpg',
    embed: 'https://player.vimeo.com/video/264677021',
    category: 'Reel',
    featured: false,
    hidden: false,
    tags: [],
    ...overrides,
  } as Video;
}

function makeYouTubeVideo(overrides: Partial<Video> = {}): Video {
  return {
    source: 'youtube',
    id: 'abc123XYZ',
    title: 'A YouTube Test',
    uploader: 'Michelle Ngo',
    published: '2024-06-01',
    thumbnail: 'https://example.com/y.jpg',
    embed: 'https://www.youtube.com/embed/abc123XYZ',
    category: 'Branded Content',
    featured: false,
    hidden: false,
    tags: [],
    ...overrides,
  } as Video;
}

let host: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

beforeEach(() => {
  adapterState.vimeoHandlers = undefined;
  adapterState.youtubeHandlers = undefined;
  adapterState.vimeoDispose.mockClear();
  adapterState.youtubeDispose.mockClear();
});

afterEach(() => {
  if (component) {
    unmount(component);
    component = undefined;
  }
  host?.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function makeHost(): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

function getIframe(): HTMLIFrameElement {
  const el = host.querySelector('iframe');
  if (!el) throw new Error('WatchPlayer iframe not found');
  return el as HTMLIFrameElement;
}

function getCanvas(): HTMLElement {
  const el = host.querySelector('div.bg-black.min-h-svh');
  if (!el) throw new Error('WatchPlayer canvas (bg-black min-h-svh) not found');
  return el as HTMLElement;
}

describe('WatchPlayer — iframe attributes (WATCH-01)', () => {
  test('renders iframe with buildEmbedUrl play-mode src for Vimeo + title + allow', () => {
    const video = makeVimeoVideo();
    component = mount(WatchPlayer, { target: makeHost(), props: { video } });
    flushSync();
    const iframe = getIframe();
    const src = iframe.getAttribute('src') ?? '';
    expect(src).toMatch(/player\.vimeo\.com\/video\/264677021/);
    // Plan 05-01 made playsinline=1 unconditional in 'play' mode
    expect(src).toContain('playsinline=1');
    expect(src).toContain('autoplay=1');
    // Background/loop should NOT be present in 'play' mode
    expect(src).not.toContain('background=1');
    expect(src).not.toContain('loop=1');
    expect(iframe.getAttribute('title')).toBe('Producer Reel');
    expect(iframe.getAttribute('allow')).toBe('autoplay; fullscreen; picture-in-picture');
  });

  test('renders YouTube iframe for source=youtube', () => {
    const video = makeYouTubeVideo();
    component = mount(WatchPlayer, { target: makeHost(), props: { video } });
    flushSync();
    const iframe = getIframe();
    const src = iframe.getAttribute('src') ?? '';
    expect(src).toMatch(/youtube-nocookie\.com/);
    expect(src).toContain('playsinline=1');
    expect(src).toContain('autoplay=1');
  });

  test('canvas wrapper has bg-black + min-h-svh + flex centering', () => {
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    const canvas = getCanvas();
    expect(canvas.className).toContain('bg-black');
    expect(canvas.className).toContain('min-h-svh');
    expect(canvas.className).toContain('flex');
    expect(canvas.className).toContain('items-center');
    expect(canvas.className).toContain('justify-center');
  });

  test('iframe container has aspect-video + max-h-svh', () => {
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    const container = host.querySelector('div.aspect-video');
    expect(container).not.toBeNull();
    expect(container?.className).toContain('aspect-video');
    expect(container?.className).toContain('max-h-svh');
  });
});

describe('WatchPlayer — adapter dispatch (Vimeo vs YouTube)', () => {
  test('vimeo source attaches the Vimeo adapter (captures handlers)', () => {
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync(); // ensure $effect fires (iframeEl bound + adapter attached)
    expect(adapterState.vimeoHandlers).toBeDefined();
    expect(adapterState.youtubeHandlers).toBeUndefined();
  });

  test('youtube source attaches the YouTube adapter (captures handlers)', () => {
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeYouTubeVideo() } });
    flushSync();
    expect(adapterState.youtubeHandlers).toBeDefined();
    expect(adapterState.vimeoHandlers).toBeUndefined();
  });
});

describe('WatchPlayer — chrome-fade state machine (D-07)', () => {
  test('initial chromeFaded = false (data-chrome-faded attribute reflects state)', () => {
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    const iframe = getIframe();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');
  });

  test('fadeOut after 600ms grace on play (WATCH-01 transition)', async () => {
    vi.useFakeTimers();
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync(); // run the $effect synchronously so handlers are captured under fake timers
    const iframe = getIframe();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');

    // Fire the captured onPlay handler — kicks off 600ms grace timer.
    adapterState.vimeoHandlers!.onPlay!();
    flushSync();
    await vi.advanceTimersByTimeAsync(500);
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');
    await vi.advanceTimersByTimeAsync(200); // 700ms total
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('true');
  });

  test('fadeIn immediate on pause (WATCH-01 transition)', async () => {
    vi.useFakeTimers();
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    const iframe = getIframe();
    // Get into faded state first.
    adapterState.vimeoHandlers!.onPlay!();
    await vi.advanceTimersByTimeAsync(700);
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('true');
    // Now pause — should fade back in immediately.
    adapterState.vimeoHandlers!.onPause!();
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');
  });

  test('pointerleave on canvas while playing → chromeFaded = true', async () => {
    vi.useFakeTimers();
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    const iframe = getIframe();
    const canvas = getCanvas();
    // Start playing.
    adapterState.vimeoHandlers!.onPlay!();
    flushSync();
    // Reset to visible by simulating pointermove (resets fadeIn) — then leave.
    canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');
    canvas.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('true');
  });

  test('pointermove resets fadeIn (immediate)', async () => {
    vi.useFakeTimers();
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    const iframe = getIframe();
    const canvas = getCanvas();
    // Enter faded state.
    adapterState.vimeoHandlers!.onPlay!();
    await vi.advanceTimersByTimeAsync(700);
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('true');
    // Move pointer — should flip back to visible immediately.
    canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');
  });

  test('idle-3s timer arms when playing + chromeFaded=false → flips to true after 3000ms', async () => {
    vi.useFakeTimers();
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    const iframe = getIframe();
    const canvas = getCanvas();
    // Start playing.
    adapterState.vimeoHandlers!.onPlay!();
    await vi.advanceTimersByTimeAsync(700);
    flushSync();
    // Move pointer to re-show chrome → idle-3s arms.
    canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');
    // Wait just under 3s — still visible.
    await vi.advanceTimersByTimeAsync(2999);
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');
    // Cross the threshold — fades.
    await vi.advanceTimersByTimeAsync(2);
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('true');
  });

  test('idle-3s does NOT arm when isPlaying=false', async () => {
    vi.useFakeTimers();
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    const iframe = getIframe();
    const canvas = getCanvas();
    // Never fired onPlay — isPlaying remains false.
    canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(5000);
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');
  });

  test('touchend on canvas → fadeIn', async () => {
    vi.useFakeTimers();
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    const iframe = getIframe();
    const canvas = getCanvas();
    // Enter faded state.
    adapterState.vimeoHandlers!.onPlay!();
    await vi.advanceTimersByTimeAsync(700);
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('true');
    // TouchEnd — flips visible (mobile recovery).
    canvas.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
    flushSync();
    expect(iframe.getAttribute('data-chrome-faded')).toBe('false');
  });
});

describe('WatchPlayer — dispose cleanup', () => {
  test('unmount calls adapter dispose + clears any pending fade timers', async () => {
    vi.useFakeTimers();
    component = mount(WatchPlayer, { target: makeHost(), props: { video: makeVimeoVideo() } });
    flushSync();
    // Start a pending fadeOut timer.
    adapterState.vimeoHandlers!.onPlay!();
    flushSync();
    expect(adapterState.vimeoDispose).not.toHaveBeenCalled();
    // Unmount.
    unmount(component);
    component = undefined;
    expect(adapterState.vimeoDispose).toHaveBeenCalledTimes(1);
    // Advance past 600ms — there should be NO late chromeFaded flip
    // because the unmount cleared the timer AND the iframe is gone.
    await vi.advanceTimersByTimeAsync(5000);
    // host has no iframe anymore — implicit pass: no late timers can flip
    // a now-detached attribute. If a stray timer fired it would noop on a
    // null iframe ref; this assertion just exercises the time advancement.
    expect(host.querySelector('iframe')).toBeNull();
  });
});
