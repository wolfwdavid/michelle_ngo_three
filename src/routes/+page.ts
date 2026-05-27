/**
 * `/` route — Phase 5 Plan 05-03. HERO-01 + HERO-02.
 *
 * Replaces the Phase 1 splash placeholder (src/routes/+page.svelte). The
 * cinematic-immersive entry surface composes <HeroAmbient /> (Plan 05-03
 * Task 2) + <ReelStage videos={data.videos} /> (Phase 3 sealed contract) —
 * scrolling past the 100svh hero reveals the first ReelSection of the full
 * /work reel below.
 *
 * Load shape mirrors /work/+page.ts: synchronous, no awaits, returns the
 * same `videos` reference exported by $lib/data so the ReelStage below the
 * hero sees the unfiltered all-56 set.
 *
 * prerender = true inherited from src/routes/+layout.ts (adapter-static
 * requires every route to be prerenderable — set at the layout level so
 * every child route inherits without per-page opt-in).
 */
import { videos } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return { videos };
};
