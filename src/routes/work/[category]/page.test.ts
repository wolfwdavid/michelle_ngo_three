/**
 * /work/[category] +page.ts unit tests — FILT-03 / FILT-04 (Phase 4).
 *
 * Mirrors _four/src/routes/work/[category]/page.test.ts:
 *   - entries() returns 8 slugs (one per CATEGORIES value)
 *   - load() narrows slug → Category via slugToCategory + error(404) on unknown
 *   - Returned videos sorted featured-first then published date desc (D-25 carry)
 *   - +page.svelte mounts FilterPillBar + ReelStage with the narrowed videos
 *
 * The Phase 5 D-04 PBS cross-link tests at lines 91-129 of _four's file are
 * intentionally NOT mirrored — that lands in `_three`'s Phase 5.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock $app/state + $app/paths for any .svelte mount that reads them.
// Distinct identifier (`mockPageWk`) mirrors _four's pattern and avoids
// cross-file collision when both FilterPillBar and Page tests run together.
const { mockPageWk } = vi.hoisted(() => ({
  mockPageWk: {
    url: new URL('http://localhost/work/pbs-american-portrait'),
    route: { id: '/work/[category]' as string | null },
  },
}));
vi.mock('$app/state', () => ({ page: mockPageWk }));
vi.mock('$app/paths', () => ({ base: '' }));

import { load, entries } from './+page';
import type { PageData } from './$types';
import { mount, unmount } from 'svelte';
import Page from './+page.svelte';

// SvelteKit's PageLoad widens the awaited return; callLoad narrows back to
// PageData so result.category + result.videos are typed for the assertions.
async function callLoad(event: Parameters<typeof load>[0]): Promise<PageData> {
  const result = await load(event);
  if (!result) throw new Error('load() returned void');
  return result as PageData;
}

describe('/work/[category] +page.ts load — FILT-04 (Phase 4)', () => {
  it('valid slug returns matching category and full video set', async () => {
    const result = await callLoad({
      params: { category: 'pbs-american-portrait' },
    } as Parameters<typeof load>[0]);
    expect(result.category).toBe('PBS American Portrait');
    // PBS American Portrait has 18 videos per Phase 2 dataset.
    expect(result.videos.length).toBe(18);
  });

  it('all returned videos have category === result.category (Reel filter)', async () => {
    const result = await callLoad({
      params: { category: 'reel' },
    } as Parameters<typeof load>[0]);
    expect(result.category).toBe('Reel');
    for (const v of result.videos) {
      expect(v.category).toBe('Reel');
    }
  });

  it('unknown slug rejects with status 404 (Phase 4 D-16 — no empty-state UI)', async () => {
    // `async` signature on load is load-bearing: synchronous throw in a sync load
    // would crash the runner before .rejects could resolve. The +page.ts mirrors
    // _four's `export const load: PageLoad = async ({ params }) => { ... }`.
    await expect(
      load({ params: { category: 'does-not-exist' } } as Parameters<typeof load>[0])
    ).rejects.toMatchObject({ status: 404 });
  });

  it('videos sorted featured-first then published date desc (D-25 carry from _four)', async () => {
    const result = await callLoad({
      params: { category: 'pbs-american-portrait' },
    } as Parameters<typeof load>[0]);
    const nonFeatured = result.videos.filter((v) => !v.featured);
    for (let i = 1; i < nonFeatured.length; i++) {
      const a = nonFeatured[i - 1]!;
      const b = nonFeatured[i]!;
      expect(a.published.localeCompare(b.published)).toBeGreaterThanOrEqual(0);
    }
    // Featured (if any) precede non-featured.
    let sawNonFeatured = false;
    for (const v of result.videos) {
      if (!v.featured) sawNonFeatured = true;
      else expect(sawNonFeatured).toBe(false);
    }
  });
});

describe('/work/[category] +page.ts entries — prerender enumeration (FILT-04)', () => {
  it('returns exactly 8 entries (one per CATEGORIES value)', () => {
    const list = entries() as Array<{ category: string }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(8);
  });

  it('every entry slug matches /^[a-z0-9-]+$/ (categoryToSlug shape)', () => {
    const list = entries() as Array<{ category: string }>;
    for (const e of list) {
      expect(typeof e.category).toBe('string');
      expect(e.category.length).toBeGreaterThan(0);
      expect(e.category).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('entries include "pbs-american-portrait" and "reel"', () => {
    const slugs = (entries() as Array<{ category: string }>).map((e) => e.category);
    expect(slugs).toContain('pbs-american-portrait');
    expect(slugs).toContain('reel');
  });
});

// ---------------------------------------------------------------------------
// /work/[category]/+page.svelte mount assertions: FilterPillBar + ReelStage
// both mount on the filtered page (Task 3 verify). IntersectionObserver is
// mocked by vitest-setup-ui.ts (global stub class) so ReelStage's runed
// observer doesn't blow up in jsdom.
// ---------------------------------------------------------------------------

let host: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

beforeEach(() => {
  mockPageWk.url = new URL('http://localhost/work/pbs-american-portrait');
  mockPageWk.route = { id: '/work/[category]' };
});

afterEach(() => {
  if (component) {
    unmount(component);
    component = undefined;
  }
  host?.remove();
});

function makeHost(): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

describe('/work/[category]/+page.svelte — mounts FilterPillBar + ReelStage', () => {
  it('renders <nav aria-label="Filmography filters"> AND <div role="region" aria-label="Filmography reel">', async () => {
    const data = await callLoad({
      params: { category: 'pbs-american-portrait' },
    } as Parameters<typeof load>[0]);
    component = mount(Page, { target: makeHost(), props: { data } });
    expect(host.querySelector('nav[aria-label="Filmography filters"]')).not.toBeNull();
    expect(host.querySelector('[role="region"][aria-label="Filmography reel"]')).not.toBeNull();
  });

  it('renders one <article> per video (PBS = 18 articles)', async () => {
    const data = await callLoad({
      params: { category: 'pbs-american-portrait' },
    } as Parameters<typeof load>[0]);
    component = mount(Page, { target: makeHost(), props: { data } });
    const articles = host.querySelectorAll('article');
    expect(articles.length).toBe(18);
  });
});
