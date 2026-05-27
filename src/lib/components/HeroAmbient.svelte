<!--
  HeroAmbient — Phase 5 Plan 05-03. HERO-01 + HERO-02.

  Full-bleed 100svh z-stack with the producer reel (Vimeo 264677021) playing
  silently muted as the background. Always-mounted WHILE VISIBLE per D-02:
  own IntersectionObserver unmounts the iframe to poster when scrolled fully
  off-screen, preserving Phase 3 peak-3-iframe budget.

  D-03 deferred-load mechanism (via createHeroDefer factory from
  $lib/heroDefer.svelte): poster eager (LCP first paint); iframe mounts after
  whichever fires first — requestIdleCallback({timeout:1000}), setTimeout(1000),
  or first window pointerdown/wheel/touchstart/scroll.

  D-04 unified REEL-04 fallback codepath: prefers-reduced-motion OR cellular
  OR autoplay-failed-from-hero-loop → poster only, no iframe. Same gate shape
  as Phase 3 ReelSection — one $derived, one conditional render.

  Plan 05-01 pageVisibility rune subscription: when the mobile menu opens OR
  document.hidden flips true, the iframe unmounts (consistent with reel pause
  posture). HeroAmbient is a SIBLING of ReelStage on `/`, so it does NOT see
  ReelStage's setContext('reel:visibility', ...) broadcast. Instead it (a)
  reads the pageVisibility rune directly for its own gate, AND (b) sets its
  own `reel:visibility` context for its child PreviewLoop to consume — same
  shape so the Phase 3 PreviewLoop contract sees zero API change.

  z-stack:
    Layer 1: poster <img> (eager LCP)
    Layer 2: PreviewLoop iframe (gated on mountIframe $derived)
    Layer 3: gradient overlay (two-stop per D-05)
    Layer 4: content stack (wordmark + tagline + CTA)
    Layer 5: scroll-cue (↓ glyph, bottom-anchored)
-->
<script lang="ts">
  // svelte/no-navigation-without-resolve override lives at the config level
  // (eslint.config.js per-file block) — same pattern as TopNav/MobileMenu/
  // FilterPillBar. No in-file directive needed.
  import { setContext } from 'svelte';
  import { base } from '$app/paths';
  import { useIntersectionObserver } from 'runed';
  import { producerReelId, getById } from '$lib/data';
  import { getPosterFor } from '$lib/data/posters';
  import { motion } from '$lib/state/motion.svelte';
  import { network } from '$lib/state/network.svelte';
  import { pageVisibility } from '$lib/state/visibility.svelte';
  import { createHeroDefer } from '$lib/heroDefer.svelte';
  import PreviewLoop from './PreviewLoop.svelte';

  const video = getById(producerReelId);
  if (!video) {
    throw new Error(
      `HeroAmbient: producer reel video (id=${producerReelId}) missing from $lib/data`
    );
  }

  let heroEl = $state<HTMLElement | null>(null);
  // Optimistic — IO will correct on the first callback flush.
  let isOnScreen = $state(true);
  let autoplayFailedFromHero = $state(false);

  const defer = createHeroDefer();

  // D-04 unified REEL-04 fallback gate. When TRUE: poster only, no iframe.
  // Mirrors Phase 3 ReelSection.shouldShowPoster verbatim — same three triggers
  // collapse into one $derived. Latched: once autoplayFailedFromHero flips true
  // it stays true for the lifetime of this HeroAmbient instance (no retry).
  const shouldShowPoster = $derived(
    motion.prefersReducedMotion || network.isCellularLike || autoplayFailedFromHero
  );

  // Plan 05-01 visibility rune — pause iframe when mobile menu opens OR
  // document is hidden (consistent with reel pause posture). The rune
  // internally ORs document.hidden with menu.menuOpen.
  const pauseFromMenuOrVisibility = $derived(pageVisibility.documentHidden);

  // Final iframe-mount gate. ALL conditions must hold:
  const mountIframe = $derived(
    isOnScreen && defer.shouldMount && !shouldShowPoster && !pauseFromMenuOrVisibility
  );

  // Bridge the pageVisibility rune into the `reel:visibility` context shape
  // that PreviewLoop consumes. Without this, PreviewLoop crashes on its
  // getContext('reel:visibility').documentHidden read. The context shape is
  // identical to ReelStage's broadcast, so PreviewLoop sees zero API change.
  setContext('reel:visibility', {
    get documentHidden(): boolean {
      return pauseFromMenuOrVisibility;
    },
  });

  // D-03: start the defer race in $effect (only if not in fallback — no point
  // racing if we'll never mount the iframe anyway).
  $effect(() => {
    if (shouldShowPoster) return; // poster-only — never schedule the iframe
    defer.start();
    return () => defer.dispose();
  });

  // D-02 / Pitfall F: own IO with hysteresis threshold [0, 0.1]. The 0.1
  // buffer avoids mount/unmount churn at the boundary (Pitfall F).
  useIntersectionObserver(
    () => heroEl,
    (entries) => {
      isOnScreen = entries.some((e) => e.isIntersecting);
    },
    { threshold: [0, 0.1] }
  );

  const posterUrl = `${base}${getPosterFor(video)}`;
</script>

<svelte:head>
  <!-- LCP hint: preload the hero poster (POL-02 mechanism shipped here) -->
  <link rel="preload" as="image" href={posterUrl} fetchpriority="high" />
</svelte:head>

<section
  bind:this={heroEl}
  class="relative h-svh w-full overflow-hidden bg-neutral-950"
>
  <!-- Layer 1: poster (LCP first paint; persists as fallback under iframe). alt=""
       because the centered content stack carries the meaning (the page-level h1
       "MICHELLE NGO" is in Layer 4). -->
  <img
    src={posterUrl}
    alt=""
    loading="eager"
    fetchpriority="high"
    class="absolute inset-0 h-full w-full object-cover"
  />

  <!-- Layer 2: PreviewLoop iframe (deferred + gated on all conditions). The
       PreviewLoop child reads our setContext('reel:visibility') for its own
       Page Visibility pause posture; HeroAmbient also gates the mount on
       pauseFromMenuOrVisibility so the iframe DOM is removed entirely when
       hidden (saves the postMessage roundtrip + iframe decode cycle). -->
  {#if mountIframe}
    <div class="absolute inset-0">
      <PreviewLoop
        {video}
        onautoplayfailed={() => {
          autoplayFailedFromHero = true;
        }}
      />
    </div>
  {/if}

  <!-- Layer 3: D-05 two-stop gradient overlay (top + bottom darken; middle clear) -->
  <div
    class="pointer-events-none absolute inset-0"
    style="background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%);"
    aria-hidden="true"
  ></div>

  <!-- Layer 4: D-05 centered content stack — wordmark + tagline + CTA. The
       outer container is pointer-events-none so only the CTA captures clicks
       (the rest of the overlay should not eat scroll/swipe events headed for
       the underlying iframe surface). -->
  <div
    class="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center"
  >
    <h1
      class="font-display text-5xl font-semibold tracking-[0.2em] text-neutral-50 md:text-7xl"
    >
      MICHELLE NGO
    </h1>
    <p class="font-sans text-sm tracking-wide text-neutral-200 md:text-base">
      Filmmaker &amp; Producer
    </p>
    <a
      href={`${base}/watch/${producerReelId}`}
      data-sveltekit-preload-data="hover"
      class="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-neutral-50 px-6 py-3 font-sans text-sm font-medium tracking-widest uppercase text-neutral-50 motion-safe:transition-colors duration-200 hover:bg-neutral-50 hover:text-neutral-950"
    >
      ▷ PLAY REEL
    </a>
  </div>

  <!-- Layer 5: D-05 scroll cue (decorative — aria-hidden) -->
  <div
    class="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-50/60"
    aria-hidden="true"
  >
    <span class="text-2xl">↓</span>
  </div>
</section>
