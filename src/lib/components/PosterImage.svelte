<!--
  STUB — Plan 03-03 replaces this with the full sidecar-backed PosterImage:
  reads $lib/data/posters.ts getPosterFor(video), renders an <img loading="lazy"
  fetchpriority="low" decoding="async"> with the deterministic poster path, and
  conditionally renders a `▷ TAP TO PLAY` CTA when showPlayCta=true (D-07).

  Plan 03-01 ships this stub so ReelSection's $derived gate compiles and the
  REEL-05 overlay layering works against a known placeholder.
-->
<script lang="ts">
  import type { Video } from '$lib/data';
  import { getPosterFor } from '$lib/data/posters';
  import { base } from '$app/paths';
  let { video, showPlayCta = false }: { video: Video; showPlayCta?: boolean } = $props();
  // $derived so a future video-prop swap (e.g., Phase 4 filter narrowing
  // re-renders the same section index against a new Video) re-reads the
  // poster sidecar correctly. Pure read; no side effects.
  const posterPath = $derived(getPosterFor(video));
</script>

<div
  class="absolute inset-0 h-full w-full bg-neutral-950"
  data-stub="poster-image"
  data-video-id={video.id}
>
  <img
    src={`${base}${posterPath}`}
    alt={`Poster for ${video.title}`}
    class="h-full w-full object-cover opacity-40"
    loading="lazy"
    fetchpriority="low"
    decoding="async"
  />
  {#if showPlayCta}
    <div
      class="absolute inset-0 flex items-center justify-center font-mono text-xs text-neutral-100/60"
    >
      [TAP TO PLAY placeholder — Plan 03-03]
    </div>
  {/if}
</div>
