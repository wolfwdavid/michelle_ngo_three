/**
 * /watch/[id] page.test.ts — Phase 5 Plan 05-02 Task 3.
 *
 * Mirrors _four/src/routes/watch/[id]/page.test.ts test scaffold (5 core
 * assertions) + adds 2 _three-specific regression checks (rail length =
 * getByCategory.count - 1; entries() includes producer reel).
 *
 * Lives under src/routes/watch/[id]/page.test.ts so the Vitest ui project's
 * routes glob picks it up (verified in vite.config.ts:147). The route-load
 * function runs in jsdom (ui) env — the data project intentionally excludes
 * the routes glob from its own include list.
 */
import { describe, expect, it } from 'vitest';
import { load, entries } from './+page';
import { videos, getByCategory, producerReelId } from '$lib/data';
import type { Video } from '$lib/data';

// Narrow the PageLoad result type — SvelteKit's PageLoad generic widens the
// awaited return to `void | (... & Record<string, any>)` which blocks direct
// property access. Mirror the helper from _four's page.test.ts.
async function callLoad(
  event: Parameters<typeof load>[0]
): Promise<{ video: Video; rail: Video[] }> {
  const result = await load(event);
  if (!result) throw new Error('load() returned void');
  return result as { video: Video; rail: Video[] };
}

describe('/watch/[id] +page.ts entries — WATCH-04 prerender enumeration', () => {
  it('returns one entry per video — count matches videos.length (56)', () => {
    const list = entries() as Array<{ id: string }>;
    expect(list.length).toBe(56);
    expect(list.length).toBe(videos.length);
  });

  it('every entry has shape { id: string }', () => {
    const list = entries() as Array<{ id: string }>;
    for (const e of list) {
      expect(typeof e.id).toBe('string');
      expect(e.id.length).toBeGreaterThan(0);
    }
  });

  it('entries() contains the producer reel id (Vimeo 264677021)', () => {
    const list = entries() as Array<{ id: string }>;
    const ids = list.map((e) => e.id);
    expect(ids).toContain('264677021');
    expect(ids).toContain(producerReelId);
  });
});

describe('/watch/[id] +page.ts load — WATCH-04 valid + 404', () => {
  it('valid id returns { video, rail } with matching video.id', async () => {
    const result = await callLoad({
      params: { id: '264677021' },
    } as Parameters<typeof load>[0]);
    expect(result.video.id).toBe('264677021');
    expect(Array.isArray(result.rail)).toBe(true);
  });

  it('unknown id rejects with status: 404 (async signature load-bearing)', async () => {
    await expect(
      load({ params: { id: 'does-not-exist-xyz' } } as Parameters<typeof load>[0])
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('/watch/[id] +page.ts load — rail derivation (WATCH-03)', () => {
  it('rail contains only same-category siblings and excludes current id', async () => {
    // Pick a PBS video — PBS has 18 in the corpus, plenty of siblings.
    const pbs = videos.find((v) => v.category === 'PBS American Portrait');
    if (!pbs) throw new Error('test fixture missing: any PBS video');
    const result = await callLoad({
      params: { id: pbs.id },
    } as Parameters<typeof load>[0]);
    for (const v of result.rail) {
      expect(v.category).toBe('PBS American Portrait');
      expect(v.id).not.toBe(pbs.id);
    }
  });

  it('rail is sorted featured-first then published.localeCompare desc', async () => {
    const pbs = videos.find((v) => v.category === 'PBS American Portrait');
    if (!pbs) throw new Error('test fixture missing');
    const result = await callLoad({
      params: { id: pbs.id },
    } as Parameters<typeof load>[0]);
    // Walk the rail: featured-first means no `false → true` transition once
    // we've seen any `false`.
    let sawNonFeatured = false;
    for (const v of result.rail) {
      if (!v.featured) sawNonFeatured = true;
      if (sawNonFeatured) expect(v.featured).toBe(false);
    }
    // Within the non-featured tail, published desc.
    const nonFeatured = result.rail.filter((v) => !v.featured);
    for (let i = 1; i < nonFeatured.length; i++) {
      const prev = nonFeatured[i - 1]!;
      const curr = nonFeatured[i]!;
      expect(prev.published.localeCompare(curr.published)).toBeGreaterThanOrEqual(0);
    }
  });

  it('rail length === getByCategory(cat).length - 1 (current excluded exactly once)', async () => {
    const pbs = videos.find((v) => v.category === 'PBS American Portrait');
    if (!pbs) throw new Error('test fixture missing');
    const result = await callLoad({
      params: { id: pbs.id },
    } as Parameters<typeof load>[0]);
    expect(result.rail.length).toBe(getByCategory(pbs.category).length - 1);
  });

  it('Reel category: producer reel id rail = 3 (4 reel videos - 1)', async () => {
    const result = await callLoad({
      params: { id: '264677021' },
    } as Parameters<typeof load>[0]);
    expect(result.rail.length).toBe(getByCategory('Reel').length - 1);
    expect(result.rail.length).toBe(3);
  });
});
