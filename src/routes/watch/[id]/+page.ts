/**
 * /watch/[id] — Phase 5 Plan 05-02 Task 3. WATCH-04 prerender + content load.
 *
 * Mirrors _four/src/routes/watch/[id]/+page.ts near-verbatim. The async signature
 * on `load` is load-bearing — the unit test contract uses
 *   `await expect(load(...)).rejects.toMatchObject({ status: 404 })`
 * which requires the promise rejection. Even though no awaits are present today,
 * keep async.
 *
 * entries(): mandatory under adapter-static strict: true. Returns one entry per
 *   video, derived from $lib/data videos (already hidden-filtered per Phase 2
 *   D-14). Prerenders exactly 56 HTML files (build/watch/<id>/index.html).
 *
 * load(): narrows params.id via getById(). On unknown id throws error(404). The
 *   `error()` helper from @sveltejs/kit returns `never` so TypeScript narrows
 *   `video` from `Video | undefined` → `Video`.
 *
 * Rail: build-time computed — same-category videos minus the current one,
 *   sorted featured-first then published.localeCompare desc (Phase 2 D-25
 *   carry-forward). Returned alongside `video` so the prerendered HTML contains
 *   both. Zero client-side JS for the rail.
 *
 * prerender = true is INHERITED from src/routes/+layout.ts:3 — do NOT redeclare.
 */
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';
import { getById, getByCategory, videos } from '$lib/data';

export const entries: EntryGenerator = () => videos.map((v) => ({ id: v.id }));

// `async` is load-bearing for the .rejects.toMatchObject({ status: 404 }) test contract.
export const load: PageLoad = async ({ params }) => {
  const video = getById(params.id);
  if (!video) error(404, 'Video not found');

  const rail = [...getByCategory(video.category)]
    .filter((v) => v.id !== video.id)
    .toSorted((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.published.localeCompare(a.published);
    });

  return { video, rail };
};
