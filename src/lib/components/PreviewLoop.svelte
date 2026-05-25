<!--
  STUB — Plan 03-02 replaces this with the full 4-state iframe lifecycle
  (`unmounted → mounted-loading → mounted-playing → unmounting`) consuming
  buildEmbedUrl from $lib/iframe/url + attachVimeo/attachYouTube postMessage
  adapters + the 800ms D-07 handshake timeout + the D-12 Page Visibility
  pause/resume via reel:visibility context.

  Plan 03-01 ships this stub so ReelStage + ReelSection compile and render
  a placeholder marker while the lifecycle work is decomposed in 03-02.
-->
<script lang="ts">
  import type { Video } from '$lib/data';
  let { video }: { video: Video } = $props();
</script>

<div
  class="absolute inset-0 flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-100"
  data-stub="preview-loop"
  data-video-id={video.id}
  data-video-source={video.source}
>
  <span class="font-mono text-xs opacity-60">[PreviewLoop placeholder — Plan 03-02]</span>
</div>
