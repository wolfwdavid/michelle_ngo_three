<!--
  Phase 6 Plan 06-02 — /pbs-american-portrait/ flagship landing.

  D-01 — Section zero bg = producer reel poster (Vimeo 264677021)
  D-02 — Subtitle eyebrow + h1 + blockquote + attribution + outbound + scroll-cue
  D-03 — Per-PBS-section "See on PBS →" badge in top-right (stacks below CategoryTag)
         via ReelSection pbsCollectionUrl prop (forwarded from ReelStage's per-video
         getPbsCollectionUrl hook)
  D-04 — Section zero IS first scroll-snap section (snap-start h-svh, uniform with 1-18);
         rendered by ReelStage's `intro` snippet slot (Task 1 extension)
  D-17 — Blockquote text verbatim Candidate C (Phase 6 D-17 — carry-forward from _four
         05-01 user-approved). DO NOT EDIT THE BLOCKQUOTE TEXT.

  ESLint: svelte/no-navigation-without-resolve disabled via the config-level
  per-file override in eslint.config.js (mirror of TopNav/FilterPillBar/Footer
  pattern — internal hrefs from $app/paths base).
-->
<script lang="ts">
  import type { PageData } from './$types';
  import { base } from '$app/paths';
  import { producerReelId, getById } from '$lib/data';
  import { getPosterFor } from '$lib/data/posters';
  import ReelStage from '$lib/components/ReelStage.svelte';
  import { pbsCollectionUrl } from './_pbsCollectionUrl';

  let { data }: { data: PageData } = $props();

  const producerReel = getById(producerReelId);
  if (!producerReel) throw new Error('PBS landing: producer reel video missing');
  const heroPosterUrl = `${base}${getPosterFor(producerReel)}`;
</script>

<svelte:head>
  <title>PBS American Portrait — Michelle Ngo</title>
  <meta
    name="description"
    content="18 stories produced by Michelle Ngo for PBS American Portrait — short documentaries on American life."
  />
</svelte:head>

{#snippet pbsIntro()}
  <!-- Layer 1: poster bg -->
  <img
    src={heroPosterUrl}
    alt=""
    loading="eager"
    fetchpriority="high"
    class="absolute inset-0 h-full w-full object-cover"
  />
  <!-- Layer 2 (D-01): two-stop gradient overlay -->
  <div
    class="pointer-events-none absolute inset-0"
    style="background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%);"
    aria-hidden="true"
  ></div>
  <!-- Layer 3: D-02 vertical content stack -->
  <div class="relative z-10 mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-6 px-4 sm:px-6 lg:px-8 text-center">
    <p class="font-sans text-sm font-semibold uppercase tracking-wider text-neutral-300">
      18 STORIES PRODUCED BY MICHELLE NGO
    </p>
    <h1
      id="reel-intro-heading"
      class="font-display text-6xl font-semibold leading-tight tracking-wide text-[var(--color-cat-pbs)]"
    >
      PBS American Portrait
    </h1>
    <blockquote class="font-display text-base font-normal leading-relaxed text-neutral-50">
      <!-- D-17 VERBATIM Candidate C — DO NOT EDIT. Re-fetch from _four if drift suspected. -->
      Whether it's joy or sorrow, triumph or hardship, family traditions followed for decades or just
      the chaos of the morning school run, PBS American Portrait put together a picture of life as
      it's really lived. The show gives a glimpse into American life, and a chance for everyday
      Americans to be heard.
    </blockquote>
    <p class="font-sans text-sm font-normal text-neutral-500">
      Description from pbs.org/american-portrait
    </p>
    <a
      href="https://www.pbs.org/american-portrait/"
      target="_blank"
      rel="noopener"
      class="font-sans text-sm font-semibold uppercase tracking-widest text-neutral-50 hover:underline underline-offset-2"
    >
      Visit pbs.org/american-portrait →
    </a>
  </div>
  <!-- Layer 4: scroll-cue -->
  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-50/60" aria-hidden="true">
    <span class="text-2xl">↓</span>
  </div>
{/snippet}

<ReelStage
  videos={data.videos}
  intro={pbsIntro}
  getPbsCollectionUrl={(v) => pbsCollectionUrl(v.description ?? '') ?? undefined}
/>
