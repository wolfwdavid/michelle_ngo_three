<!--
  ContinueReelRail — Phase 5 Plan 05-02 Task 2. WATCH-03.

  Pure CSS scroll-snap-x mandatory horizontal rail of same-category sibling
  videos (replaces _four's grid rail). Cards are poster-only <a> links — no
  nested iframes (rail is browse signal, not preview per D-10 commentary; this
  preserves Phase 3's peak-3-iframe budget).

  D-10 — pure CSS scroll-snap-x mandatory + flex row. NO embla. Native iOS
         momentum scroll comes for free; touch drag works for free; keyboard
         arrow scroll works for free.
  D-11 — fractional-peek widths: 1.4 / 2.4 / 3.4 / 4.4 cards visible at
         mobile/sm/md/lg breakpoints via vw classes. Always partial card on
         right edge as affordance to scroll.
  D-12 — heading-is-link (mirror _four D-36): <h2><a href={base}/work/{slug}>
         More in {category} →</a></h2>. One element does two jobs — heading
         AND filter entry-point. A/B parity at IA level.
  D-13 — hide entirely when rail.length === 0 (mirror _four D-38). Edge case
         is defensive — the 56-video corpus has no singleton categories — but
         keeps the component forward-safe.

  scrollbar-hide @utility added to src/app.css in Plan 05-02 Task 1.

  Accessibility:
   - <section aria-labelledby="rail-heading"> (NOT <nav>) per UI-SPEC §256 —
     the rail is CONTENT (browse signal), not site navigation.
   - alt="" on poster images — they are decorative; the card title text below
     is the accessible label, and the card anchor's accessible name comes
     from its visible text.
   - Card minimum tap target ≥ 44px achieved by w-[70vw] aspect-video on
     mobile = >300px × >168px.

  ESLint:
   - svelte/no-navigation-without-resolve disabled at config level for this
     file (Plan 05-02 Task 1 eslint.config.js update) — `${base}/work/{slug}`
     and `${base}/watch/{id}` are deprecated-typed-route literals until Plan
     07-x migrates to SvelteKit 2.27+ resolve('/watch/[id]', { id }).
-->
<script lang="ts">
  import { base } from '$app/paths';
  import { getPosterFor } from '$lib/data/posters';
  import type { Video, Category } from '$lib/data';

  let {
    rail,
    category,
    categorySlug,
  }: {
    rail: readonly Video[];
    category: Category;
    categorySlug: string;
  } = $props();
</script>

{#if rail.length > 0}
  <section aria-labelledby="rail-heading" class="mx-auto mt-12 px-4 sm:px-6 lg:px-8">
    <h2
      id="rail-heading"
      class="font-display mb-4 text-xl font-semibold text-neutral-50"
    >
      <a
        href={`${base}/work/${categorySlug}`}
        data-sveltekit-preload-data="hover"
        class="hover:underline"
      >
        More in {category} →
      </a>
    </h2>

    <ul class="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
      {#each rail as v (v.id)}
        <li class="w-[70vw] flex-none snap-start sm:w-[40vw] md:w-[28vw] lg:w-[22vw]">
          <a
            href={`${base}/watch/${v.id}`}
            data-sveltekit-preload-data="hover"
            class="relative block aspect-video overflow-hidden bg-neutral-950 focus-visible:outline-none"
          >
            <img
              src={`${base}${getPosterFor(v)}`}
              alt=""
              loading="lazy"
              decoding="async"
              class="absolute inset-0 h-full w-full object-cover"
            />
            <div
              class="pointer-events-none absolute inset-0"
              style="background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.7) 100%);"
              aria-hidden="true"
            ></div>
            <div class="absolute right-2 bottom-2 left-2 text-neutral-50">
              <p class="font-display line-clamp-2 text-sm font-semibold">{v.title}</p>
              <p class="font-mono text-xs text-neutral-300">
                {v.uploader} · {v.published.slice(0, 4)}
              </p>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  </section>
{/if}
