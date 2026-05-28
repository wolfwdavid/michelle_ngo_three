/**
 * /pbs-american-portrait/ — Phase 6 Plan 06-02 D-01..D-04 flagship landing route.
 *
 * Parameterless prerendered route. `prerender = true` + `trailingSlash = 'always'`
 * inherited from src/routes/+layout.ts. No entries() needed (flat route).
 *
 * Load returns the 18 PBS videos sorted featured-first then date-desc,
 * mirroring /work/[category]/+page.ts shape (matches Phase 3 D-25 default sort).
 *
 * Verbatim port from `_four/src/routes/pbs-american-portrait/+page.ts` (only the
 * doc-comment phase reference changes).
 */
import type { PageLoad } from './$types';
import { getByCategory } from '$lib/data';

export const load: PageLoad = () => ({
  videos: [...getByCategory('PBS American Portrait')].toSorted((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.published.localeCompare(a.published);
  }),
});
