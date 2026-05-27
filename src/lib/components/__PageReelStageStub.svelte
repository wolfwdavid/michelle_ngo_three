<!--
  Test-only stub for ReelStage.svelte. Used by page.test.ts to verify the
  /+page.svelte composition. Exposes the received videos.length via the
  data-video-count attribute so the test can assert the prop passes through
  unfiltered.
-->
<script lang="ts">
  import type { Video } from '$lib/data';
  let { videos }: { videos: readonly Video[] } = $props();
</script>

<div data-stub="reel-stage" data-video-count={videos.length}></div>
