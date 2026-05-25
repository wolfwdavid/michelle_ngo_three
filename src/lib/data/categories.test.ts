import { describe, expect, it } from 'vitest';
// Wave 0 used lazy `await import(...)` so this file would load before the module
// existed. Plan 02-01 created ./categories.ts and removed `.skip` from each
// describe block; the dynamic imports now resolve normally and the suite is GREEN.

describe('CATEGORIES array', () => {
  it('contains exactly 8 entries from _prep/04-categories.md', async () => {
    const { CATEGORIES } = await import('./categories');
    expect(CATEGORIES).toEqual([
      'PBS American Portrait',
      'Promos & Trailers',
      'Branded Content',
      'Documentary / Short Film',
      'Reel',
      'Personal / Tribute',
      'Educational / Nonprofit',
      'Other',
    ]);
  });
});

describe('categoryToSlug', () => {
  it('derives kebab-case slugs single-rule (D-03)', async () => {
    const { categoryToSlug } = await import('./categories');
    expect(categoryToSlug('PBS American Portrait')).toBe('pbs-american-portrait');
    expect(categoryToSlug('Promos & Trailers')).toBe('promos-trailers');
    expect(categoryToSlug('Branded Content')).toBe('branded-content');
    expect(categoryToSlug('Documentary / Short Film')).toBe('documentary-short-film');
    expect(categoryToSlug('Reel')).toBe('reel');
    expect(categoryToSlug('Personal / Tribute')).toBe('personal-tribute');
    expect(categoryToSlug('Educational / Nonprofit')).toBe('educational-nonprofit');
    expect(categoryToSlug('Other')).toBe('other');
  });

  it('produces unique slugs for all 8 categories (no collisions)', async () => {
    const { CATEGORIES, categoryToSlug } = await import('./categories');
    const slugs = CATEGORIES.map((c: (typeof CATEGORIES)[number]) => categoryToSlug(c));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('slugToCategory', () => {
  it('round-trips every category', async () => {
    const { CATEGORIES, categoryToSlug, slugToCategory } = await import('./categories');
    for (const cat of CATEGORIES) {
      expect(slugToCategory(categoryToSlug(cat))).toBe(cat);
    }
  });

  it('returns undefined for an unknown slug', async () => {
    const { slugToCategory } = await import('./categories');
    expect(slugToCategory('does-not-exist')).toBeUndefined();
  });
});
