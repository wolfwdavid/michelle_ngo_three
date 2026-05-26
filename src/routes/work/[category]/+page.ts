/**
 * /work/[category] — Phase 4 FILT-04 prerendered filter route.
 *
 * Near-verbatim mirror of _four/src/routes/work/[category]/+page.ts (D-29/D-30).
 * Adapted comments to reference _three Phase 4 D-13 (URL canonical state),
 * D-14 (no visual transition), D-16 (no empty-state UI — malformed slug 404s).
 *
 * entries(): mandatory under adapter-static strict: true. Returns one entry
 *   per CATEGORIES value, derived from the single source of truth.
 *   Prerenders exactly 8 HTML files (build/work/<slug>/index.html).
 *
 * load(): narrows params.category via slugToCategory(). On unknown slug throws
 *   error(404). The `error()` helper from @sveltejs/kit returns `never` so
 *   TypeScript narrows `category` from `Category | undefined` → `Category`
 *   (Phase 1 D-14 / noUncheckedIndexedAccess).
 *
 * Sort: featured-first, then published date desc (D-25 carry from _four).
 *
 * `prerender = true` is INHERITED from src/routes/+layout.ts so this file
 * does NOT redeclare it (Phase 2 carry-forward; matches _four's pattern).
 */
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';
import { CATEGORIES, categoryToSlug, slugToCategory, getByCategory } from '$lib/data';

export const entries: EntryGenerator = () =>
  CATEGORIES.map((c) => ({ category: categoryToSlug(c) }));

// `async` (rather than a sync signature) is load-bearing for the upstream
// test's `.rejects.toMatchObject({ status: 404 })` resolution. A synchronous
// throw in a sync load would bubble before the `await expect(load(...))` and
// crash the test runner. Zero functional change at runtime — adapter-static
// awaits load() anyway.
export const load: PageLoad = async ({ params }) => {
  const category = slugToCategory(params.category);
  if (!category) error(404, 'Category not found');

  const filtered = [...getByCategory(category)].toSorted((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.published.localeCompare(a.published);
  });

  return { category, videos: filtered };
};
