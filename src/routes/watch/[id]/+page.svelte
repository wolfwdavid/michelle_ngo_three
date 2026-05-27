<!--
  /watch/[id] — Phase 5 Plan 05-02 Task 3. WATCH-01..04.

  Composes:
    1. Back-button (ABOVE player; part of the chrome-fade group via shared
       chromeFaded $state) — UI-SPEC §126 locks `← BACK` text+glyph.
    2. <WatchPlayer {video} bind:chromeFaded /> — Task 1's letterbox + D-07
       chrome-fade state machine. The $bindable chromeFaded prop is the load-
       bearing single source of truth; the below-player chrome region binds
       its opacity to the same getter.
    3. Below-player chrome region (h1 title + CategoryTag chip + uploader · year
       + optional description + ContinueReelRail) all sharing chromeFaded via
       chromeClass $derived. Per D-08: metadata BELOW player in normal flow;
       entire below-player region shares fade state.
    4. <ContinueReelRail {rail} category={video.category} {categorySlug} /> —
       Task 2's pure CSS scroll-snap-x rail of same-category siblings.
    5. <svelte:head> with <title>, <meta description>, VideoObject JSON-LD —
       Phase 7 POL-01 audits the shape.

  VideoObject JSON-LD payload (mirror _four/watch/[id]/+page.svelte:41-54):
    @context: 'https://schema.org', @type: 'VideoObject', name, description,
    thumbnailUrl, uploadDate, embedUrl, contentUrl. contentUrl branches on
    video.source — Vimeo: https://vimeo.com/{id}; YouTube:
    https://www.youtube.com/watch?v={id}.

  ESLint:
    - svelte/no-navigation-without-resolve disabled at config level (Plan 05-02
      Task 1 eslint.config.js update covers this file).
    - svelte/no-at-html-tags suppressed inline at the {@html ...} site: the JSON
      payload is build-time validated by Zod (Phase 2 D-15); no user input flows
      into the script tag.
-->
<script lang="ts">
  import { base } from '$app/paths';
  import WatchPlayer from '$lib/components/WatchPlayer.svelte';
  import ContinueReelRail from '$lib/components/ContinueReelRail.svelte';
  import CategoryTag from '$lib/components/CategoryTag.svelte';
  import { categoryToSlug } from '$lib/data';
  import { getPosterFor } from '$lib/data/posters';
  import { buildEmbedUrl } from '$lib/iframe/url';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const video = $derived(data.video);
  const rail = $derived(data.rail);
  const year = $derived(video.published.slice(0, 4));
  const categorySlug = $derived(categoryToSlug(video.category));
  const posterUrl = $derived(`${base}${getPosterFor(video)}`);

  // chromeFaded — shared between WatchPlayer (writer via $bindable) and the
  // below-player chrome region (reader). Single $state at the page level — both
  // consumers see the same value (D-08).
  let chromeFaded = $state(false);

  // VideoObject JSON-LD payload (mirror _four shape). Phase 7 POL-01 audits.
  const contentUrl = $derived(
    video.source === 'vimeo'
      ? `https://vimeo.com/${video.id}`
      : `https://www.youtube.com/watch?v=${video.id}`
  );
  const videoJsonLd = $derived({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description ?? `${video.title} — by Michelle Ngo`,
    thumbnailUrl: posterUrl,
    uploadDate: video.published,
    embedUrl: buildEmbedUrl(video, 'play'),
    contentUrl,
  });

  // Shared opacity class — D-08: the back-button + below-player chrome region
  // all consume this $derived. Pure CSS transition.
  const chromeClass = $derived(
    chromeFaded
      ? 'opacity-20 pointer-events-none motion-safe:transition-opacity duration-500'
      : 'opacity-100 pointer-events-auto motion-safe:transition-opacity duration-300'
  );
</script>

<svelte:head>
  <title>{video.title} — Michelle Ngo</title>
  <meta
    name="description"
    content={video.description?.slice(0, 150) ?? `${video.title} — by Michelle Ngo`}
  />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<script type="application/ld+json">${JSON.stringify(videoJsonLd)}<` + `/script>`}
</svelte:head>

<article aria-label={video.title} class="relative bg-black">
  <!-- Back-button — ABOVE player in document order, top-left absolute over the
       letterbox canvas. Part of the chrome-fade group. -->
  <div class="absolute top-4 left-4 z-10 {chromeClass}">
    <a
      href={`${base}/work`}
      data-sveltekit-preload-data="hover"
      class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 font-sans text-xs tracking-widest text-neutral-50 uppercase backdrop-blur hover:bg-neutral-50/10"
    >
      ← BACK
    </a>
  </div>

  <WatchPlayer {video} bind:chromeFaded />

  <!-- Below-player chrome — shares chromeFaded via chromeClass. Per D-08. -->
  <div class="mx-auto max-w-3xl px-6 py-8 {chromeClass}">
    <h1 class="font-display text-3xl leading-snug font-semibold text-neutral-50 md:text-4xl">
      {video.title}
    </h1>
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <CategoryTag category={video.category} href={`${base}/work/${categorySlug}`} />
      <p class="font-sans text-base text-neutral-300">{video.uploader} · {year}</p>
    </div>
    {#if video.description}
      <p
        class="mt-6 font-sans text-base leading-relaxed whitespace-pre-line text-neutral-300"
      >
        {video.description}
      </p>
    {/if}

    <ContinueReelRail {rail} category={video.category} {categorySlug} />
  </div>
</article>
