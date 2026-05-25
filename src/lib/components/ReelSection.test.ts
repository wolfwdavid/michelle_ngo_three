import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import Harness from './ReelSectionContextHarness.svelte';
import {
  __resetMotionStateForTests,
  __setPrefersReducedMotionForTests,
} from '$lib/state/motion.svelte';
import { __resetNetworkStateForTests, __setEffectiveTypeForTests } from '$lib/state/network.svelte';
import type { Video } from '$lib/data';

// Plan 03-03 Task 2 — mock PreviewLoop with a tiny test stub that exposes its
// `onautoplayfailed` callback via a global registry. Lets tests fire the
// REEL-04 trigger 3/4/5 signal synchronously without waiting for 800ms.
// Hoisted vi.mock applies to ALL tests in this file. The original Plan 03-01
// tests assert `iframe[data-lifecycle-state]` — those still pass because the
// stub also exposes a `data-stub="preview-loop-fail"` attribute for the new
// suite to detect, and we DO NOT mock for the existing tests that need a real
// PreviewLoop. Compromise: existing Plan 03-01 "renders PreviewLoop iframe"
// test is updated to query `[data-stub="preview-loop-fail"]` (the stub's
// data attr) since the mock replaces PreviewLoop globally in this test file.
vi.mock('./PreviewLoop.svelte', async () => {
  const { default: Stub } = await import('./__PreviewLoopAutoplayFailStub.svelte');
  return { default: Stub };
});

// Shared registry the stub pushes its onautoplayfailed callbacks into. Each
// ReelSection mount registers one entry. Reset in beforeEach below.
const previewLoopFailCallbacks: Array<() => void> = [];
(globalThis as { __previewLoopFailCallbacks?: Array<() => void> }).__previewLoopFailCallbacks =
  previewLoopFailCallbacks;

/**
 * ReelSection — D-08 pre-mount gate (allowIframe = !cellular && !reduced-motion)
 * + REEL-05 overlay (title + CategoryTag + PLAY WITH SOUND deep-link) +
 * Pitfall 18 tabindex toggle + Pitfall 20 two-stop gradient.
 *
 * Uses a wrapper component (ReelSectionContextHarness.svelte) to inject the
 * reel:stage + reel:visibility contexts that ReelStage normally provides.
 */
function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    source: 'vimeo',
    id: 'v1',
    title: 'A Quiet Documentary',
    uploader: 'Michelle Ngo',
    published: '2024-01-01',
    thumbnail: 'https://example.com/t.jpg',
    embed: 'https://player.vimeo.com/video/v1',
    category: 'PBS American Portrait',
    featured: false,
    hidden: false,
    tags: [],
    ...overrides,
  } as Video;
}

afterEach(() => {
  __resetMotionStateForTests();
  __resetNetworkStateForTests();
  vi.restoreAllMocks();
  delete (navigator as Navigator & { connection?: unknown }).connection;
});

beforeEach(() => {
  // Drain the shared registry so each test sees only its own mounts.
  previewLoopFailCallbacks.length = 0;
});

describe('ReelSection (REEL-04 D-08 gate + REEL-05 overlay)', () => {
  test('renders title text inside an h2 with font-display class', () => {
    const video = makeVideo({ title: 'Cinema Verite Study' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    const h2 = container.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2?.textContent?.trim()).toBe('Cinema Verite Study');
    expect(h2?.className).toContain('font-display');
  });

  test('PLAY WITH SOUND <a> has href ending with /watch/${video.id}', () => {
    const video = makeVideo({ id: '264677021' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    const cta = container.querySelector('[data-play-with-sound]') as HTMLAnchorElement | null;
    expect(cta).not.toBeNull();
    expect(cta?.href).toMatch(/\/watch\/264677021$/);
  });

  test('PLAY WITH SOUND has tabindex=0 when activeIdx === index (current section)', () => {
    const video = makeVideo();
    const { container } = render(Harness, {
      props: { video, index: 2, total: 5, activeIdx: 2, mountedIdsArr: [video.id] },
    });
    const cta = container.querySelector('[data-play-with-sound]');
    expect(cta?.getAttribute('tabindex')).toBe('0');
  });

  test('PLAY WITH SOUND has tabindex=-1 when activeIdx !== index (off-screen)', () => {
    const video = makeVideo();
    const { container } = render(Harness, {
      props: { video, index: 0, total: 5, activeIdx: 2, mountedIdsArr: [video.id] },
    });
    const cta = container.querySelector('[data-play-with-sound]');
    expect(cta?.getAttribute('tabindex')).toBe('-1');
  });

  test('CategoryTag span uses --color-cat-{token} CSS variable (PBS → pbs)', () => {
    const video = makeVideo({ category: 'PBS American Portrait' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    const tag = container.querySelector('[data-category]');
    expect(tag).not.toBeNull();
    expect(tag?.getAttribute('data-category')).toBe('PBS American Portrait');
    const style = tag?.getAttribute('style') ?? '';
    expect(style).toContain('var(--color-cat-pbs)');
  });

  test('renders PreviewLoop branch when shouldMount = true (mounted + allowed)', () => {
    // Plan 03-03 Task 2: PreviewLoop is MOCKED in this test file with the
    // __PreviewLoopAutoplayFailStub (so trigger-3/4/5 callbacks can be fired
    // synchronously). The stub renders `<span data-stub="preview-loop-fail">`
    // in place of the real iframe. The CONTRACT being asserted here is that
    // ReelSection's `shouldMount` branch renders PreviewLoop (whatever
    // implementation that is); the original iframe assertion lives in
    // PreviewLoop.test.ts where the real component is exercised.
    const video = makeVideo({ id: 'mounted-1' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    const previewBranch = container.querySelector('[data-stub="preview-loop-fail"]');
    const poster = container.querySelector('[data-stub="poster-image"]');
    expect(previewBranch).not.toBeNull();
    expect(poster).toBeNull();
  });

  test('renders PosterImage placeholder when video is not in mountedIds', () => {
    const video = makeVideo({ id: 'unmounted-1' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [] },
    });
    const iframe = container.querySelector('iframe[data-lifecycle-state]');
    const poster = container.querySelector('[data-stub="poster-image"]');
    expect(iframe).toBeNull();
    expect(poster).not.toBeNull();
  });

  test('gradient overlay element exists with aria-hidden="true" (Pitfall 20)', () => {
    const video = makeVideo();
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    const gradients = container.querySelectorAll('[aria-hidden="true"]');
    const hasLinearGradient = Array.from(gradients).some((el) =>
      (el.getAttribute('style') ?? '').includes('linear-gradient(180deg')
    );
    expect(hasLinearGradient).toBe(true);
  });

  test('index/total caption shows "01 / 05" for index=0, total=5', () => {
    const video = makeVideo();
    const { container } = render(Harness, {
      props: { video, index: 0, total: 5, mountedIdsArr: [video.id] },
    });
    expect(container.textContent).toContain('01 / 05');
  });

  test('aspect-video container is present (POL-03 zero-CLS)', () => {
    const video = makeVideo();
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    const aspect = container.querySelector('.aspect-video');
    expect(aspect).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Plan 03-03 Task 2 — REEL-04 unified fallback codepath wiring.
//
// ReelSection's `shouldShowPoster` $derived collapses 5 fallback triggers into
// one switch:
//   shouldShowPoster = motion.prefersReducedMotion
//                   || network.isCellularLike
//                   || autoplayFailedFromPreviewLoop
//
// Plan 03-02's PreviewLoop dispatches `onautoplayfailed` callback on the 800ms
// HANDSHAKE_TIMEOUT_MS elapsing OR on onError. ReelSection wires the consumer
// here. The behavior is asserted via:
//   - __setPrefersReducedMotionForTests / __setEffectiveTypeForTests setters
//     (triggers 1 + 2 — pre-mount gates)
//   - hoisted vi.mock of PreviewLoop (top of file) → registered callbacks
//     fired synchronously (triggers 3-5 — post-handshake-timeout signal)
// ---------------------------------------------------------------------------
describe('REEL-04 unified fallback codepath (Plan 03-03 Task 2 wiring)', () => {
  test('motion.prefersReducedMotion=true → renders PosterImage (trigger 1)', () => {
    __setPrefersReducedMotionForTests(true);
    const video = makeVideo({ id: 'rm-1' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    expect(container.querySelector('[data-stub="preview-loop-fail"]')).toBeNull();
    expect(container.querySelector('[data-stub="poster-image"]')).not.toBeNull();
  });

  test('network.isCellularLike=true (via effectiveType=3g) → renders PosterImage (trigger 2)', () => {
    __setEffectiveTypeForTests('3g');
    const video = makeVideo({ id: 'cell-1' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    expect(container.querySelector('[data-stub="preview-loop-fail"]')).toBeNull();
    expect(container.querySelector('[data-stub="poster-image"]')).not.toBeNull();
  });

  test('onautoplayfailed signal from PreviewLoop → renders PosterImage (triggers 3-5)', async () => {
    const video = makeVideo({ id: 'fail-1' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    // Pre-state: PreviewLoop stub branch renders (no fallback trigger fired yet).
    expect(container.querySelector('[data-stub="preview-loop-fail"]')).not.toBeNull();
    expect(container.querySelector('[data-stub="poster-image"]')).toBeNull();

    // Fire the autoplay-failed signal via the registered callback. ReelSection's
    // handleAutoplayFailed flips autoplayFailedFromPreviewLoop $state true;
    // shouldShowPoster $derived re-evaluates true; the {#if} branch swaps.
    expect(previewLoopFailCallbacks.length).toBeGreaterThan(0);
    previewLoopFailCallbacks[0]?.();
    await tick();

    expect(container.querySelector('[data-stub="preview-loop-fail"]')).toBeNull();
    expect(container.querySelector('[data-stub="poster-image"]')).not.toBeNull();
  });

  test('autoplayFailed signal is idempotent (multiple fires do not break)', async () => {
    const video = makeVideo({ id: 'idempot-1' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    expect(previewLoopFailCallbacks.length).toBeGreaterThan(0);
    const cb = previewLoopFailCallbacks[0];
    expect(() => {
      cb?.();
      cb?.();
      cb?.();
    }).not.toThrow();
    await tick();
    expect(container.querySelector('[data-stub="poster-image"]')).not.toBeNull();
  });

  test('autoplayFailed in one section does NOT cascade to siblings', async () => {
    // Each Harness mount instantiates its own ReelSection, which owns its own
    // autoplayFailedFromPreviewLoop $state. Mount 3 harnesses; only fire the
    // callback on section index 1; assert sections 0 and 2 still render
    // PreviewLoop stubs and section 1 renders PosterImage.
    const videos = [makeVideo({ id: 'a' }), makeVideo({ id: 'b' }), makeVideo({ id: 'c' })];
    const renders = videos.map((v, i) =>
      render(Harness, {
        props: { video: v, index: i, total: 3, mountedIdsArr: [v.id] },
      })
    );

    // Each ReelSection mounts one PreviewLoop stub → 3 callbacks registered.
    expect(previewLoopFailCallbacks.length).toBe(3);

    // Fire only section 1's callback.
    previewLoopFailCallbacks[1]?.();
    await tick();

    const stubs = renders.map((r) => r.container.querySelector('[data-stub="preview-loop-fail"]'));
    const posters = renders.map((r) => r.container.querySelector('[data-stub="poster-image"]'));

    expect(stubs[0]).not.toBeNull();
    expect(stubs[1]).toBeNull();
    expect(stubs[2]).not.toBeNull();
    expect(posters[0]).toBeNull();
    expect(posters[1]).not.toBeNull();
    expect(posters[2]).toBeNull();
  });
});
