import { describe, test, expect, afterEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Harness from './ReelSectionContextHarness.svelte';
import { __resetMotionStateForTests } from '$lib/state/motion.svelte';
import { __resetNetworkStateForTests } from '$lib/state/network.svelte';
import type { Video } from '$lib/data';

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

  test('renders PreviewLoop iframe when shouldMount = true (mounted + allowed)', () => {
    // Plan 03-02 replaced the PreviewLoop stub with the real 4-state iframe
    // lifecycle. ReelSection's `shouldMount` branch now renders a real
    // <iframe data-lifecycle-state="mounted-loading"> instead of a
    // [data-stub="preview-loop"] placeholder. PosterImage is still a stub
    // (Plan 03-03 wires enhanced-img + responsive sources).
    const video = makeVideo({ id: 'mounted-1' });
    const { container } = render(Harness, {
      props: { video, index: 0, total: 1, mountedIdsArr: [video.id] },
    });
    const iframe = container.querySelector('iframe[data-lifecycle-state]');
    const poster = container.querySelector('[data-stub="poster-image"]');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('data-lifecycle-state')).toBe('mounted-loading');
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
