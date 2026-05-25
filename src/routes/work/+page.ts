/**
 * /work route — prerendered static reel listing all 56 videos.
 *
 * SSG-only: adapter-static + GH Pages serves the prerendered HTML; client
 * hydration takes over for IntersectionObserver + scroll-snap interactivity.
 *
 * Phase 4 adds /work/[category] dynamic filter routes (FILT-04) that prerender
 * 8 category slugs via entries(). This Phase 3 route is the unfiltered all-56
 * canonical reel.
 */
import { videos } from '$lib/data';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = () => {
  return { videos };
};
