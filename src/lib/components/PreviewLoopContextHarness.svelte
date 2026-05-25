<!--
  Test-only harness — sets the reel:visibility context then mounts PreviewLoop.
  Used by PreviewLoop.test.ts to inject the documentHidden broadcast that
  ReelStage normally provides. Supports reactively flipping documentHidden
  via the harness prop so Page Visibility transitions can be exercised.
-->
<script lang="ts">
  import { setContext } from 'svelte';
  import type { Video } from '$lib/data';
  import PreviewLoop from './PreviewLoop.svelte';

  let {
    video,
    documentHidden = false,
    onautoplayfailed,
  }: {
    video: Video;
    documentHidden?: boolean;
    onautoplayfailed?: () => void;
  } = $props();

  setContext('reel:visibility', {
    get documentHidden() {
      return documentHidden;
    },
  });
</script>

<PreviewLoop {video} {onautoplayfailed} />
