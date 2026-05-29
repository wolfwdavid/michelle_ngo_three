<!--
  /work — fullscreen scroll-snap reel of all 56 videos.

  Phase 3 shipped this naked (no TopNav, no FilterPillBar).
  Phase 4 (Plan 04-01) adds FilterPillBar above ReelStage so the producer can
  switch to any /work/[category] filter from this canonical unfiltered surface.
  Plan 04-02 adds TopNav. Plan 04-03 adjusts the reel-container height math so
  the reel doesn't sit underneath the chrome.
-->
<script lang="ts">
  import ReelStage from '$lib/components/ReelStage.svelte';
  import FilterPillBar from '$lib/components/FilterPillBar.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Work — Michelle Ngo</title>
  <meta name="description" content="Filmmaker reel — 56 videos in scroll-snap cinema mode." />
</svelte:head>

<!-- sr-only landmark h1 — the reel section titles are <h2>, so axe's
     page-has-heading-one (best-practice) needs a top-level heading. Visible
     wayfinding is the FilterPillBar; this heading names the page for SR/SEO. -->
<h1 class="sr-only">Work — Filmography</h1>

<FilterPillBar />
<ReelStage videos={data.videos} />
