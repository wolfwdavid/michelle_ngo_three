/**
 * /press — Phase 6 Plan 06-02 D-05..D-08 broadcast credits route.
 *
 * Parameterless prerendered route. `prerender = true` + `trailingSlash = 'always'`
 * inherited from src/routes/+layout.ts. No entries() needed (flat route).
 *
 * Load returns the flat-array `PressCredit[]` shape from _pressCredits.ts (D-08
 * divergence from _four — one section per credit, not grouped by network).
 */
import type { PageLoad } from './$types';
import { getPressCredits, type PressCredit } from './_pressCredits';

export const load: PageLoad<{ credits: PressCredit[] }> = () => {
  return { credits: getPressCredits() };
};
