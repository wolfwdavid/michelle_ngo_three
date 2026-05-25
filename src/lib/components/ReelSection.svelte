<!--
  ReelSection — single video section. Renders PreviewLoop OR PosterImage based on
  reel:stage context + module-scope state runes.

  Locked decisions:
    REEL-04 (D-08) — pre-mount gate: allowIframe = !cellular && !reduced-motion.
                     Cellular-on-Chromium + reduced-motion never attach iframes
                     (saves the 800ms timeout cycle in Plan 03-02). The other 3
                     fallback triggers (LPM, autoplay-block, embed-disabled) are
                     caught by Plan 03-02's PreviewLoop 800ms timeout (D-07).
    REEL-05      — title (bottom-left, font-display) + CategoryTag (top-right) +
                     PLAY WITH SOUND deep-link to /watch/[id]
    POL-03 / Pitfall 2 — aspect-video container → zero-CLS poster→iframe swap.
    Pitfall 20   — two-stop gradient overlay for title legibility on bright frames.
    Pitfall 18   — tabindex toggle on PLAY-WITH-SOUND link (Plan 03-02 extends
                     to iframe focus management).

  Anti-pattern grep gates:
    - Never wrap an individual video in a SECTION element (uppercased here so
      the grep gate stays clean; parent ReelStage uses ARTICLE; an extra
      landmark would explode the SR count per Pitfall 8).
-->
<script lang="ts">
  import { getContext } from 'svelte';
  import { base } from '$app/paths';
  import type { Video, Category } from '$lib/data';
  import { network } from '$lib/state/network.svelte';
  import { motion } from '$lib/state/motion.svelte';
  import PreviewLoop from './PreviewLoop.svelte';
  import PosterImage from './PosterImage.svelte';

  let { video, index, total }: { video: Video; index: number; total: number } = $props();

  interface ReelStageContext {
    readonly mountedIds: ReadonlySet<string>;
    readonly activeIdx: number;
    readonly videoCount: number;
  }
  const stage = getContext<ReelStageContext>('reel:stage');

  // D-08 pre-mount gate (REEL-04 triggers 1 + 2).
  const allowIframe = $derived(!network.isCellularLike && !motion.prefersReducedMotion);
  const shouldMount = $derived(allowIframe && stage.mountedIds.has(video.id));
  const isCurrent = $derived(stage.activeIdx === index);

  // CategoryTag inline placeholder — consumes --color-cat-* tokens directly.
  // Plan 03-03 may restyle with a full extracted CategoryTag.svelte component
  // (carry-forward from ../michelle_ngo_four/src/lib/components/CategoryTag.svelte).
  // Note: Category enum values are the long display names ("PBS American
  // Portrait", "Promos & Trailers", ...) per Phase 2 D-01 / categories.ts;
  // the categoryToToken map translates them to the short --color-cat-* token
  // suffixes that live in src/app.css (Phase 1 D-12 — 8 OKLCH accents).
  const categoryToToken: Record<Category, string> = {
    'PBS American Portrait': 'pbs',
    'Promos & Trailers': 'promos',
    'Branded Content': 'branded',
    'Documentary / Short Film': 'docshort',
    Reel: 'reel',
    'Personal / Tribute': 'personal',
    'Educational / Nonprofit': 'edunon',
    Other: 'other',
  };
  const tokenName = $derived(categoryToToken[video.category]);
</script>

<!-- Aspect-ratio container (Pitfall 2 / POL-03): identical dimensions between
     PreviewLoop iframe and PosterImage <img> → zero-CLS swap. -->
<div class="relative h-full w-full bg-neutral-950">
  <div class="absolute inset-0 flex items-center justify-center">
    <div class="aspect-video w-full">
      {#if shouldMount}
        <PreviewLoop {video} />
      {:else}
        <PosterImage {video} showPlayCta={!allowIframe || !stage.mountedIds.has(video.id)} />
      {/if}
    </div>
  </div>

  <!-- Pitfall 20 — two-stop gradient for top + bottom legibility. -->
  <div
    class="pointer-events-none absolute inset-0"
    style="background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%);"
    aria-hidden="true"
  ></div>

  <!-- REEL-05 CategoryTag (top-right) — consumes --color-cat-{token} -->
  <div class="pointer-events-none absolute top-6 right-6 z-10">
    <span
      class="pointer-events-auto inline-block rounded-full border px-3 py-1 font-mono text-xs tracking-wider text-neutral-50 uppercase"
      style={`border-color: var(--color-cat-${tokenName}); color: var(--color-cat-${tokenName});`}
      data-category={video.category}
    >
      {video.category}
    </span>
  </div>

  <!-- REEL-05 title (bottom-left, font-display) + PLAY WITH SOUND CTA -->
  <div class="pointer-events-none absolute bottom-8 left-6 z-10 max-w-xl">
    <h2
      class="font-display pointer-events-auto text-3xl font-semibold text-neutral-50 drop-shadow-lg md:text-5xl"
    >
      {video.title}
    </h2>
    <!-- REEL-05 deep-link to /watch/[id]. Phase 5 (WATCH-01) creates the
         route; until then, $app/paths resolve() rejects the typed route
         argument because the literal isn't yet in the generated route table.
         We use the deprecated `${base}/...` form; eslint.config.js silences
         svelte/no-navigation-without-resolve for this file. Migrate to
         resolve('/watch/[id]', { id: video.id }) in Phase 5. -->
    <a
      href={`${base}/watch/${video.id}`}
      class="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-50/10 px-5 py-2 font-sans text-sm font-medium text-neutral-50 backdrop-blur-sm hover:bg-neutral-50/20 motion-safe:transition-colors"
      tabindex={isCurrent ? 0 : -1}
      data-play-with-sound
    >
      <span aria-hidden="true">▷</span> PLAY WITH SOUND
    </a>
  </div>

  <!-- Index/total mono caption (Pitfall 20 belt — discoverability cue) -->
  <div
    class="pointer-events-none absolute right-6 bottom-6 z-10 font-mono text-xs text-neutral-50/70"
  >
    {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
  </div>
</div>
