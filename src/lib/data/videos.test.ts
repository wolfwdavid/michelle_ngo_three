import { describe, expect, it } from 'vitest';
// NOTE: imports for ./videos are lazy (`await import(...)`) inside each `it()` body
// so this file loads cleanly in Wave 0 even though the loader doesn't exist yet.
// Plan 02-03 creates ./videos.ts and removes `.skip` to turn each suite GREEN.

describe('loader: videos array', () => {
  it('videos array length is 56 (no hidden in v1 per D-12)', async () => {
    const { videos } = await import('./videos');
    expect(videos.length).toBe(56);
  });

  it('hidden videos filtered (D-14) — none in v1, but loader path exists', async () => {
    // D-12: zero hidden in v1; D-14: loader filters hidden=true.
    // Smoke test: every video in the public array has hidden===false after parse.
    const { videos } = await import('./videos');
    for (const v of videos) {
      expect(v.hidden).toBe(false);
    }
  });
});

describe('loader: producerReelId (D-09)', () => {
  it('producerReelId is the literal "264677021"', async () => {
    const { producerReelId } = await import('./videos');
    expect(producerReelId).toBe('264677021');
  });

  it('producerReelId resolves to a real video in the public array (D-11)', async () => {
    const { videos, producerReelId } = await import('./videos');
    const reel = videos.find(
      (v: { source: string; id: string }) => v.source === 'vimeo' && v.id === producerReelId
    );
    expect(reel).toBeDefined();
    expect(reel?.category).toBe('Reel');
  });
});

describe('loader: getById', () => {
  it('returns the matching video', async () => {
    const { getById } = await import('./videos');
    const v = getById('264677021');
    expect(v).toBeDefined();
    expect(v?.title.toLowerCase()).toContain('reel');
  });

  it('returns undefined for an unknown id (noUncheckedIndexedAccess narrowing)', async () => {
    const { getById } = await import('./videos');
    expect(getById('does-not-exist')).toBeUndefined();
  });
});

describe('loader: getByCategory', () => {
  it('returns all 18 PBS videos', async () => {
    const { getByCategory } = await import('./videos');
    expect(getByCategory('PBS American Portrait').length).toBe(18);
  });

  it('returns empty array for a category with zero matches (none in v1, smoke check on Reel=4)', async () => {
    const { getByCategory } = await import('./videos');
    expect(getByCategory('Reel').length).toBe(4);
  });
});

describe('loader: display order (D-04)', () => {
  it('display order: first category is PBS American Portrait (18 videos, count desc)', async () => {
    const { getCategoriesInDisplayOrder } = await import('./videos');
    expect(getCategoriesInDisplayOrder()[0]).toBe('PBS American Portrait');
  });

  it('display order: ties broken alphabetically (Educational / Nonprofit, Other, Personal / Tribute all =3)', async () => {
    const { getCategoriesInDisplayOrder } = await import('./videos');
    const order: readonly string[] = getCategoriesInDisplayOrder();
    const threeWayTie = order.filter(
      (c: string) => c === 'Educational / Nonprofit' || c === 'Other' || c === 'Personal / Tribute'
    );
    expect(threeWayTie).toEqual(['Educational / Nonprofit', 'Other', 'Personal / Tribute']);
  });

  it('display order: full sequence per D-04', async () => {
    const { getCategoriesInDisplayOrder } = await import('./videos');
    expect(getCategoriesInDisplayOrder()).toEqual([
      'PBS American Portrait',
      'Promos & Trailers',
      'Branded Content',
      'Documentary / Short Film',
      'Reel',
      'Educational / Nonprofit',
      'Other',
      'Personal / Tribute',
    ]);
  });
});

describe('loader: getCategoriesWithCounts', () => {
  it('returns category + slug + count for all 8', async () => {
    const { getCategoriesWithCounts } = await import('./videos');
    const arr = getCategoriesWithCounts();
    expect(arr.length).toBe(8);
    const pbs = arr.find(
      (c: { category: string; slug: string; count: number }) =>
        c.category === 'PBS American Portrait'
    );
    expect(pbs?.slug).toBe('pbs-american-portrait');
    expect(pbs?.count).toBe(18);
  });
});

// ---------------------------------------------------------------------------
// Phase 4 D-23 / D-24 / D-26: featured slice curation contract.
// RED-by-skip in Wave 0; Plan 04-03 turns these green AFTER flipping `featured: true`
// on the 8 chosen rows in videos.json.
// ---------------------------------------------------------------------------
describe('Phase 4 featured slice — D-23 / D-24 / D-26', () => {
  it('8 featured: exactly 8 videos have featured===true after flips', async () => {
    const { videos } = await import('./videos');
    const featured = videos.filter((v) => v.featured);
    expect(featured.length).toBe(8);
  });

  it('featured includes reel: producerReelId appears in the featured slice (D-23 Reel x1, Pitfall 8)', async () => {
    const { videos, producerReelId } = await import('./videos');
    const featured = videos.filter((v) => v.featured);
    const reel = featured.find((v) => v.id === producerReelId);
    expect(reel).toBeDefined();
    expect(reel?.category).toBe('Reel');
  });

  it('featured quota: 2 PBS, 2 Promos, 2 Branded, 1 Doc, 1 Reel (D-23)', async () => {
    const { videos } = await import('./videos');
    const featured = videos.filter((v) => v.featured);
    const counts = new Map<string, number>();
    for (const v of featured) {
      counts.set(v.category, (counts.get(v.category) ?? 0) + 1);
    }
    expect(counts.get('PBS American Portrait')).toBe(2);
    expect(counts.get('Promos & Trailers')).toBe(2);
    expect(counts.get('Branded Content')).toBe(2);
    expect(counts.get('Documentary / Short Film')).toBe(1);
    expect(counts.get('Reel')).toBe(1);
    // No featured cards from the other three categories (Personal / Educational / Other).
    expect(counts.get('Personal / Tribute')).toBeUndefined();
    expect(counts.get('Educational / Nonprofit')).toBeUndefined();
    expect(counts.get('Other')).toBeUndefined();
  });
});
