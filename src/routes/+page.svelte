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
  import HeroAmbient from '$lib/components/HeroAmbient.svelte';
  import ReelStage from '$lib/components/ReelStage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Michelle Ngo</title>
  <meta name="description" content="Michelle Ngo — Filmmaker. Cinematic reel and select works." />
</svelte:head>

<HeroAmbient />
<ReelStage videos={data.videos} />
