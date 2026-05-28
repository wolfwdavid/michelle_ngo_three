<!--
  Phase 6 Plan 06-02 — /press broadcast credits page.

  D-05 — Each section bg = poster of that credit's video (NO iframes)
  D-06 — Network identity = text wordmark (font-display, no logo assets)
  D-07 — Composition: network wordmark TOP + title caption CENTER + ▷ Watch CTA BOTTOM
  D-08 — Flat array, one scroll-snap section per credit (13 today)
  D-16 — Chrome-fade scope extends to /press (TopNav fades during scroll — wired in 06-01)
  D-18 — PRESTIGE_ORDER verbatim from _four/_pressCredits.ts:24-38

  ESLint: svelte/no-navigation-without-resolve disabled via the config-level
  per-file override in eslint.config.js (mirror of TopNav/FilterPillBar/Footer
  pattern — internal hrefs from $app/paths base).
-->
<script lang="ts">
  import type { PageData } from './$types';
  import { base } from '$app/paths';
  import { getPosterFor } from '$lib/data/posters';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Press — Michelle Ngo</title>
  <meta
    name="description"
    content="Broadcast credits across HBO Max, HBO, PBS, ABC News, Amazon News, and more."
  />
</svelte:head>

<h1 class="sr-only">Press</h1>

<div
  role="region"
  aria-label="Press credits reel"
  class="h-svh w-full overflow-y-auto snap-y snap-mandatory overscroll-y-contain touch-pan-y bg-neutral-950"
>
  {#each data.credits as credit, i (credit.video.id)}
    {@const posterUrl = `${base}${getPosterFor(credit.video)}`}
    <article
      aria-label={`Press credit: ${credit.video.title} on ${credit.network}`}
      class="snap-start relative h-svh w-full overflow-hidden"
    >
      <!-- Layer 1: poster bg (STATIC — no iframe per D-05) -->
      <img
        src={posterUrl}
        alt=""
        loading={i < 2 ? 'eager' : 'lazy'}
        fetchpriority={i === 0 ? 'high' : 'auto'}
        class="absolute inset-0 h-full w-full object-cover"
      />
      <!-- Layer 2: two-stop gradient overlay (matches Phase 5 D-05) -->
      <div
        class="pointer-events-none absolute inset-0"
        style="background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%);"
        aria-hidden="true"
      ></div>
      <!-- Layer 3: D-07 vertical composition — network wordmark top / title center / CTA bottom -->
      <div
        class="relative z-10 flex h-full flex-col items-center justify-between px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center"
      >
        <!-- TOP: network wordmark (D-06 text-only, D-07 TOP) -->
        <p
          class="font-display text-6xl font-semibold leading-tight tracking-tight text-neutral-50"
        >
          {credit.network}
        </p>
        <!-- CENTER: video title caption (D-07 CENTER) -->
        <p class="max-w-xl font-sans text-base font-normal leading-snug text-neutral-300">
          {credit.video.title}
        </p>
        <!-- BOTTOM: ▷ Watch pill CTA (matches HeroAmbient ▷ PLAY REEL — UI-SPEC §"▷ Watch CTA pill style") -->
        <a
          href={`${base}/watch/${credit.video.id}`}
          data-sveltekit-preload-data="hover"
          class="inline-flex items-center gap-2 rounded-full border border-neutral-50 px-6 py-3 font-sans text-sm font-semibold tracking-widest uppercase text-neutral-50 motion-safe:transition-colors duration-200 hover:bg-neutral-50 hover:text-neutral-950"
        >
          ▷ Watch
        </a>
      </div>
      <!-- Bottom-right index/total caption (matches ReelSection — text-sm font-mono per UI-SPEC) -->
      <p
        class="pointer-events-none absolute bottom-6 right-6 z-10 font-mono text-sm tracking-wider text-neutral-50/80"
      >
        {String(i + 1).padStart(2, '0')} / {String(data.credits.length).padStart(2, '0')}
      </p>
    </article>
  {/each}
</div>
