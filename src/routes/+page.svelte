<!--
  `/` — Phase 5 Plan 05-03. HERO-01 + HERO-02.

  Replaces the Phase 1 splash placeholder. Composes <HeroAmbient /> (Plan
  05-03 Task 2) + <ReelStage videos={data.videos} /> (Phase 3 sealed contract).
  Scrolling past the 100svh hero surface reveals the first ReelSection of the
  full /work reel.

  D-01 lock: cinematic-immersive entry — the producer reel plays silently
  muted as the hero background, NOT a separate poster grid like _four's
  hero. This IS the A/B differentiator vs the sibling project.

  HeroAmbient is a SIBLING of ReelStage on `/`, not a child. HeroAmbient owns
  its OWN IntersectionObserver (D-02) for unmount-when-off-screen; ReelStage's
  ±1 viewport-windowed mounting handles the reel below. Peak iframe budget:
  hero +1 (while visible) plus reel ±1 = 3 iframes max (D-09 carry-forward).
-->
<script lang="ts">
  import { base } from '$app/paths';
  import HeroAmbient from '$lib/components/HeroAmbient.svelte';
  import ReelStage from '$lib/components/ReelStage.svelte';
  import { producerReelId, getById } from '$lib/data';
  import { getPosterFor } from '$lib/data/posters';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // POL-02 (Plan 07-03 Task 4 escalation): the `/` LCP element is the hero
  // poster <img> (vimeo-264677021.jpg). The preload <link> previously lived in
  // HeroAmbient.svelte's <svelte:head>, where SvelteKit hoists CHILD-component
  // head content AFTER the page's ~25 JS modulepreload tags — so the LCP image
  // hint landed below the entire JS manifest and lost priority. Emitting it from
  // the PAGE-level head puts the hint ahead of those modulepreloads, letting the
  // browser fetch the LCP poster sooner. Derived from the same data helpers
  // HeroAmbient uses (zero literal/path drift). Plain static asset, so a static
  // preload resolves (NOT an @sveltejs/enhanced-img hashed asset).
  const heroPosterUrl = `${base}${getPosterFor(getById(producerReelId)!)}`;
</script>

<svelte:head>
  <title>Michelle Ngo</title>
  <meta name="description" content="Michelle Ngo — Filmmaker. Cinematic reel and select works." />
  <link rel="preload" as="image" href={heroPosterUrl} fetchpriority="high" />
</svelte:head>

<HeroAmbient />
<ReelStage videos={data.videos} />
