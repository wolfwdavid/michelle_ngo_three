<!--
  /work/[category] — Phase 4 FILT-04 prerendered filter route.

  Mirrors /work/+page.svelte shape but narrows the ReelStage videos prop to the
  category-filtered set produced by +page.ts's load. FilterPillBar mounts above
  so producers can re-filter without leaving the reel surface (D-13: filter tap
  = full SvelteKit navigation; D-14: no visual transition between filter routes).

  Per-page title + meta description use data.category + data.videos.length so
  the prerendered HTML has accurate metadata in every of the 8 build/work/<slug>/
  index.html files. Phase 7 (POL-01) extends this with OG/Twitter cards.
-->
<script lang="ts">
  import ReelStage from '$lib/components/ReelStage.svelte';
  import FilterPillBar from '$lib/components/FilterPillBar.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.category} — Michelle Ngo</title>
  <meta
    name="description"
    content={`${data.videos.length} videos by Michelle Ngo in ${data.category}.`}
  />
</svelte:head>

<FilterPillBar />
<ReelStage videos={data.videos} />
