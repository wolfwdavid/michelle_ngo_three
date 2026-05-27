import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { producerReelId } from '$lib/data';
import {
  __resetMotionStateForTests,
  __setPrefersReducedMotionForTests,
} from '$lib/state/motion.svelte';
import {
  __resetNetworkStateForTests,
  __setEffectiveTypeForTests,
} from '$lib/state/network.svelte';
import { __resetVisibilityForTests } from '$lib/state/visibility.svelte';
import { __resetMenuStateForTests, openMenu } from '$lib/state/menu.svelte';

/**
 * HeroAmbient — full-bleed 100svh z-stack (poster + deferred PreviewLoop +
 * gradient + content overlay + scroll-cue) with its own IO + Plan 05-01
 * pageVisibility subscription + REEL-04 unified fallback codepath.
 *
 * Strategy:
 *   - Replace runed's useIntersectionObserver with a spy that captures the
 *     callback so we can drive isOnScreen → true/false externally.
 *   - Mock PreviewLoop with a stub that exposes `data-stub="preview-loop"`
 *     and renders an <iframe> we can query without spinning up the full Vimeo
 *     adapter postMessage pipeline. The stub also receives onautoplayfailed
 *     via a global registry so a test can fire the REEL-04 trigger.
 *   - Mock $app/paths to make `base = ''` for stable href assertions.
 *
 * NOTE: $app/state is NOT used directly by HeroAmbient but `runed` may import
 * it transitively; we mock defensively.
 */

const ioInstances: Array<{
  cb: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void;
  options: unknown;
}> = [];

vi.mock('runed', () => ({
  useIntersectionObserver: vi.fn(
    (
      _target: () => HTMLElement | null,
      cb: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void,
      options?: unknown
    ) => {
      ioInstances.push({ cb, options });
    }
  ),
}));

vi.mock('$app/paths', () => ({ base: '' }));

// Shared registry the stub pushes its onautoplayfailed callbacks into.
const previewLoopFailCallbacks: Array<() => void> = [];
(globalThis as { __heroPreviewLoopFailCallbacks?: Array<() => void> }).__heroPreviewLoopFailCallbacks =
  previewLoopFailCallbacks;

vi.mock('./PreviewLoop.svelte', async () => {
  const { default: Stub } = await import('./__HeroPreviewLoopStub.svelte');
  return { default: Stub };
});

// Import HeroAmbient AFTER the mocks so the module sees the stubbed PreviewLoop.
import HeroAmbient from './HeroAmbient.svelte';

beforeEach(() => {
  vi.useFakeTimers();
  ioInstances.length = 0;
  previewLoopFailCallbacks.length = 0;
  __resetMotionStateForTests();
  __resetNetworkStateForTests();
  __resetVisibilityForTests();
  __resetMenuStateForTests();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  __resetMotionStateForTests();
  __resetNetworkStateForTests();
  __resetVisibilityForTests();
  __resetMenuStateForTests();
});

describe('HeroAmbient — D-05 overlay content (HERO-01)', () => {
  test('renders MICHELLE NGO wordmark in an <h1>', () => {
    const { container } = render(HeroAmbient);
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent?.trim()).toBe('MICHELLE NGO');
    expect(h1?.className).toContain('font-display');
    expect(h1?.className).toContain('tracking-[0.2em]');
  });

  test('renders the "Filmmaker & Producer" tagline', () => {
    const { container } = render(HeroAmbient);
    const p = container.querySelector('p');
    expect(p?.textContent?.trim()).toBe('Filmmaker & Producer');
  });

  test('renders the ▷ PLAY REEL anchor with href ending in /watch/<producerReelId>', () => {
    const { container } = render(HeroAmbient);
    const cta = Array.from(container.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('PLAY REEL')
    );
    expect(cta).toBeDefined();
    expect(cta?.getAttribute('href')).toBe(`/watch/${producerReelId}`);
    expect(cta?.getAttribute('data-sveltekit-preload-data')).toBe('hover');
    // Should contain the ▷ glyph
    expect(cta?.textContent ?? '').toContain('▷');
  });

  test('renders the ↓ scroll cue glyph (aria-hidden)', () => {
    const { container } = render(HeroAmbient);
    // Look for the scroll-cue container — aria-hidden + bottom-10 anchor.
    const cue = Array.from(container.querySelectorAll('[aria-hidden="true"]')).find((el) =>
      el.textContent?.includes('↓')
    );
    expect(cue).toBeDefined();
  });

  test('outer <section> wrapper uses h-svh class (Phase 3 svh lock)', () => {
    const { container } = render(HeroAmbient);
    const section = container.querySelector('section');
    expect(section).not.toBeNull();
    expect(section?.className).toContain('h-svh');
  });

  test('renders the two-stop gradient overlay (D-05 — rgba(0,0,0,0.55) stops)', () => {
    const { container } = render(HeroAmbient);
    const gradient = Array.from(container.querySelectorAll('div[style*="linear-gradient"]'));
    expect(gradient.length).toBeGreaterThanOrEqual(1);
    const style = gradient[0]?.getAttribute('style') ?? '';
    expect(style).toContain('rgba(0,0,0,0.55)');
    expect(gradient[0]?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('HeroAmbient — D-03 deferred-load + poster (HERO-01)', () => {
  test('renders the eager-loaded poster <img> as Layer 1', () => {
    const { container } = render(HeroAmbient);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('loading')).toBe('eager');
    expect(img?.getAttribute('fetchpriority')).toBe('high');
    // alt='' because the wordmark + content stack carry the meaning
    expect(img?.getAttribute('alt')).toBe('');
    // src includes the producer reel id
    expect(img?.getAttribute('src') ?? '').toContain(producerReelId);
  });

  test('PreviewLoop stub does NOT mount immediately (defer not fired)', () => {
    const { container } = render(HeroAmbient);
    // Stub renders `<div data-stub="preview-loop">` when mounted.
    const stub = container.querySelector('[data-stub="preview-loop"]');
    expect(stub).toBeNull();
  });

  test('PreviewLoop mounts after 1000ms timeout (D-03 trigger 2)', async () => {
    const { container } = render(HeroAmbient);
    vi.advanceTimersByTime(1001);
    await tick();
    const stub = container.querySelector('[data-stub="preview-loop"]');
    expect(stub).not.toBeNull();
  });

  test('PreviewLoop mounts on pointerdown before timeout (D-03 trigger 3)', async () => {
    const { container } = render(HeroAmbient);
    vi.advanceTimersByTime(200);
    window.dispatchEvent(new Event('pointerdown'));
    await tick();
    const stub = container.querySelector('[data-stub="preview-loop"]');
    expect(stub).not.toBeNull();
  });
});

describe('HeroAmbient — D-04 unified REEL-04 fallback (HERO-01)', () => {
  test('does NOT mount PreviewLoop under prefers-reduced-motion (trigger 1)', async () => {
    __setPrefersReducedMotionForTests(true);
    const { container } = render(HeroAmbient);
    vi.advanceTimersByTime(2000); // exceed the 1000ms timer to confirm no mount
    await tick();
    const stub = container.querySelector('[data-stub="preview-loop"]');
    expect(stub).toBeNull();
  });

  test('does NOT mount PreviewLoop under cellular network (trigger 2)', async () => {
    __setEffectiveTypeForTests('3g'); // cellular-like
    const { container } = render(HeroAmbient);
    vi.advanceTimersByTime(2000);
    await tick();
    const stub = container.querySelector('[data-stub="preview-loop"]');
    expect(stub).toBeNull();
  });

  test('PreviewLoop unmounts after autoplayFailed callback fires (REEL-04 trigger 3)', async () => {
    const { container } = render(HeroAmbient);
    vi.advanceTimersByTime(1001);
    await tick();
    expect(container.querySelector('[data-stub="preview-loop"]')).not.toBeNull();
    // Stub registered its onautoplayfailed via the global registry.
    expect(previewLoopFailCallbacks.length).toBeGreaterThanOrEqual(1);
    previewLoopFailCallbacks[0]?.();
    await tick();
    expect(container.querySelector('[data-stub="preview-loop"]')).toBeNull();
  });
});

describe('HeroAmbient — D-02 own IO (Pitfall F threshold [0,0.1])', () => {
  test('useIntersectionObserver registered with threshold [0, 0.1]', () => {
    render(HeroAmbient);
    expect(ioInstances.length).toBe(1);
    const opts = ioInstances[0]?.options as { threshold?: number[] } | undefined;
    expect(opts?.threshold).toEqual([0, 0.1]);
  });

  test('PreviewLoop unmounts when IO callback flips isOnScreen false', async () => {
    const { container } = render(HeroAmbient);
    vi.advanceTimersByTime(1001);
    await tick();
    expect(container.querySelector('[data-stub="preview-loop"]')).not.toBeNull();
    // Drive the IO callback with isIntersecting:false entries.
    const cb = ioInstances[0]?.cb;
    expect(cb).toBeDefined();
    cb?.([{ isIntersecting: false, target: document.body }]);
    await tick();
    expect(container.querySelector('[data-stub="preview-loop"]')).toBeNull();
  });
});

describe('HeroAmbient — Plan 05-01 pageVisibility subscription', () => {
  test('PreviewLoop unmounts when menu opens (pageVisibility.documentHidden true)', async () => {
    const { container } = render(HeroAmbient);
    vi.advanceTimersByTime(1001);
    await tick();
    expect(container.querySelector('[data-stub="preview-loop"]')).not.toBeNull();
    openMenu();
    await tick();
    expect(container.querySelector('[data-stub="preview-loop"]')).toBeNull();
  });
});
