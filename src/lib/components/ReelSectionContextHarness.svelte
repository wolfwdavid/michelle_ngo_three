<!--
  Test-only harness — sets the reel:stage + reel:visibility contexts then mounts
  ReelSection. Used by ReelSection.test.ts to inject mountedIds + activeIdx
  without spinning up the full ReelStage scroll-snap container.
-->
<script lang="ts">
  import { setContext } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import type { Video } from '$lib/data';
  import ReelSection from './ReelSection.svelte';

  let {
    video,
    index = 0,
    total = 1,
    mountedIdsArr = [],
    activeIdx = -1,
    documentHidden = false,
    pbsCollectionUrl,
  }: {
    video: Video;
    index?: number;
    total?: number;
    mountedIdsArr?: string[];
    activeIdx?: number;
    documentHidden?: boolean;
    pbsCollectionUrl?: string;
  } = $props();

  // Static snapshot at mount — the harness only ships one props value per test
  // render; mountedIdsArr is a fixture, not a reactive input. Captured via a
  // function returning the prop so Svelte 5 rune scoping is satisfied.
  const initialIds = (() => mountedIdsArr)();
  const mountedIds = new SvelteSet<string>(initialIds);

  setContext('reel:stage', {
    get mountedIds() {
      return mountedIds;
    },
    get activeIdx() {
      return activeIdx;
    },
    get videoCount(): number {
      return total;
    },
  });

  setContext('reel:visibility', {
    get documentHidden() {
      return documentHidden;
    },
  });
</script>

<ReelSection {video} {index} {total} {pbsCollectionUrl} />
