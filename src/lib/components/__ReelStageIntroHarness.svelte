<!--
  Test-only harness — mounts ReelStage with an `intro` snippet that renders a
  marker element including id="reel-intro-heading". Used by ReelStage.test.ts
  to verify Phase 6 Plan 06-02 D-04 (the optional non-video section-zero slot).
-->
<script lang="ts">
  import type { Video } from '$lib/data';
  import ReelStage from './ReelStage.svelte';

  let {
    videos,
    getPbsCollectionUrl,
  }: {
    videos: readonly Video[];
    getPbsCollectionUrl?: (video: Video) => string | undefined;
  } = $props();
</script>

{#snippet introSnippet()}
  <h1 id="reel-intro-heading" data-stub="intro-content">Intro Heading</h1>
{/snippet}

<ReelStage {videos} intro={introSnippet} {getPbsCollectionUrl} />
