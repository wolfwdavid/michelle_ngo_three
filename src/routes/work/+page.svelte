<!--
  /work — fullscreen scroll-snap reel of all 56 videos.

  Phase 3 ships this naked (no TopNav, no FilterPillBar — those are Phase 4).
  Phase 4 adds /work/[category] filter routes that reuse ReelStage with
  getByCategory()-narrowed data.
-->
<script lang="ts">
  import ReelStage from '$lib/components/ReelStage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Work — Michelle Ngo</title>
  <meta name="description" content="Filmmaker reel — 56 videos in scroll-snap cinema mode." />
</svelte:head>

<ReelStage videos={data.videos} />
