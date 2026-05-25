<!--
  TEMPORARY STUB — Plan 03-01 Task 4 needs ReelSection.svelte to exist for
  ReelStage to compile and be testable. Task 5 replaces this with the full
  REEL-05 overlay implementation. Do not flesh out further here.
-->
<script lang="ts">
  import type { Video } from '$lib/data';
  let { video, index, total }: { video: Video; index: number; total: number } = $props();
</script>

<div data-stub="reel-section" data-video-id={video.id} data-index={index} data-total={total}>
  [ReelSection placeholder — Task 5 fills]
</div>
