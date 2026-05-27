/**
 * ContinueReelRail.svelte.test.ts — Phase 5 Plan 05-02 Task 2.
 *
 * Pins WATCH-03:
 *   - hide-when-empty (D-13)
 *   - section[aria-labelledby="rail-heading"] + h2#rail-heading with heading-is-link (D-12)
 *   - heading text "More in {category} →" + href to /work/{slug}
 *   - card count = rail length; each card href = /watch/{id}
 *   - card poster src uses getPosterFor result with base prefix
 *   - card title + uploader · year overlay
 *   - scroll-snap-x mandatory + overflow-x-auto on ul container
 *   - per-card snap-start + fractional-peek widths (w-[70vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw])
 *
 * Mirrors FilterPillBar.test.ts vi.hoisted + vi.mock('$app/paths') pattern.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('$app/paths', () => ({ base: '' }));

import { mount, unmount } from 'svelte';
import ContinueReelRail from './ContinueReelRail.svelte';
import type { Video, Category } from '$lib/data';

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    source: 'vimeo',
    id: 'rail-v1',
    title: 'Rail Video 1',
    uploader: 'Michelle Ngo',
    published: '2024-04-15',
    thumbnail: 'https://example.com/t.jpg',
    embed: 'https://player.vimeo.com/video/rail-v1',
    category: 'Reel',
    featured: false,
    hidden: false,
    tags: [],
    ...overrides,
  } as Video;
}

let host: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

afterEach(() => {
  if (component) {
    unmount(component);
    component = undefined;
  }
  host?.remove();
  vi.restoreAllMocks();
});

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
});

describe('ContinueReelRail — hide-when-empty (D-13)', () => {
  test('renders nothing when rail is empty', () => {
    component = mount(ContinueReelRail, {
      target: host,
      props: { rail: [], category: 'Reel' as Category, categorySlug: 'reel' },
    });
    expect(host.querySelector('section')).toBeNull();
    expect(host.textContent?.trim()).toBe('');
  });
});

describe('ContinueReelRail — landmark + heading (D-12)', () => {
  test('renders section[aria-labelledby="rail-heading"] when rail has 1+ items', () => {
    component = mount(ContinueReelRail, {
      target: host,
      props: {
        rail: [makeVideo()],
        category: 'PBS American Portrait' as Category,
        categorySlug: 'pbs-american-portrait',
      },
    });
    const section = host.querySelector('section[aria-labelledby="rail-heading"]');
    expect(section).not.toBeNull();
    const heading = host.querySelector('h2#rail-heading');
    expect(heading).not.toBeNull();
  });

  test('heading is an anchor with href=/work/{slug} + preload-data="hover"', () => {
    component = mount(ContinueReelRail, {
      target: host,
      props: {
        rail: [makeVideo()],
        category: 'Reel' as Category,
        categorySlug: 'reel',
      },
    });
    const anchor = host.querySelector('h2#rail-heading a') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('/work/reel');
    expect(anchor!.getAttribute('data-sveltekit-preload-data')).toBe('hover');
    // Literal Unicode RIGHTWARDS ARROW U+2192
    expect(anchor!.textContent?.trim()).toContain('More in Reel →');
  });
});

describe('ContinueReelRail — cards (D-11 fractional-peek + card content)', () => {
  test('card count matches rail length', () => {
    const rail = [makeVideo({ id: 'a' }), makeVideo({ id: 'b' }), makeVideo({ id: 'c' })];
    component = mount(ContinueReelRail, {
      target: host,
      props: { rail, category: 'Reel' as Category, categorySlug: 'reel' },
    });
    const items = host.querySelectorAll('ul > li');
    expect(items.length).toBe(3);
  });

  test('each card is an anchor to /watch/{id} with preload-data="hover"', () => {
    const rail = [makeVideo({ id: '264677021' })];
    component = mount(ContinueReelRail, {
      target: host,
      props: { rail, category: 'Reel' as Category, categorySlug: 'reel' },
    });
    const cardAnchor = host.querySelector('ul > li a') as HTMLAnchorElement | null;
    expect(cardAnchor).not.toBeNull();
    expect(cardAnchor!.getAttribute('href')).toBe('/watch/264677021');
    expect(cardAnchor!.getAttribute('data-sveltekit-preload-data')).toBe('hover');
  });

  test('card poster src uses getPosterFor result with base prefix', () => {
    const v = makeVideo({ source: 'vimeo', id: '264677021' });
    component = mount(ContinueReelRail, {
      target: host,
      props: { rail: [v], category: 'Reel' as Category, categorySlug: 'reel' },
    });
    const img = host.querySelector('ul > li img') as HTMLImageElement | null;
    expect(img).not.toBeNull();
    // base mocked to '' — getPosterFor returns "/posters/vimeo-264677021.jpg" fallback OR the
    // sidecar's actual path. Either way the src includes the source-id combo.
    expect(img!.getAttribute('src')).toContain('vimeo-264677021');
    expect(img!.getAttribute('loading')).toBe('lazy');
    expect(img!.getAttribute('decoding')).toBe('async');
  });

  test('card displays title and uploader · year overlay', () => {
    const v = makeVideo({
      title: 'My Cinematic Test',
      uploader: 'Test Uploader',
      published: '2023-04-15',
    });
    component = mount(ContinueReelRail, {
      target: host,
      props: { rail: [v], category: 'Reel' as Category, categorySlug: 'reel' },
    });
    const card = host.querySelector('ul > li');
    expect(card?.textContent).toContain('My Cinematic Test');
    expect(card?.textContent).toContain('Test Uploader');
    // Year is sliced to first 4 chars of published
    expect(card?.textContent).toContain('2023');
  });
});

describe('ContinueReelRail — scroll-snap-x markup (D-10)', () => {
  test('ul container has snap-x snap-mandatory + overflow-x-auto + scrollbar-hide', () => {
    component = mount(ContinueReelRail, {
      target: host,
      props: { rail: [makeVideo()], category: 'Reel' as Category, categorySlug: 'reel' },
    });
    const ul = host.querySelector('ul');
    expect(ul).not.toBeNull();
    expect(ul!.className).toContain('snap-x');
    expect(ul!.className).toContain('snap-mandatory');
    expect(ul!.className).toContain('overflow-x-auto');
    expect(ul!.className).toContain('scrollbar-hide');
  });

  test('each li has snap-start + fractional-peek widths (mobile/sm/md/lg)', () => {
    component = mount(ContinueReelRail, {
      target: host,
      props: { rail: [makeVideo()], category: 'Reel' as Category, categorySlug: 'reel' },
    });
    const li = host.querySelector('ul > li') as HTMLElement | null;
    expect(li).not.toBeNull();
    expect(li!.className).toContain('snap-start');
    expect(li!.className).toContain('w-[70vw]');
    expect(li!.className).toContain('sm:w-[40vw]');
    expect(li!.className).toContain('md:w-[28vw]');
    expect(li!.className).toContain('lg:w-[22vw]');
  });
});
