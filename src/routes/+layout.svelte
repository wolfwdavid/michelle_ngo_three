<!--
  Phase 4 NAV-01 + NAV-03 layout shell.

  Mounts (in DOM order):
    1. Skip-to-content link (sr-only, visible on focus) — D-11 / WCAG 2.4.1
    2. <TopNav /> — sticky chrome layer (D-05/D-06 chrome-fade on reel routes)
    3. <main id="main" tabindex="-1"> wrapping {@render children()} — D-11
       skip-target; the FilterPillBar (Plan 04-01) + ReelStage (Phase 3) on
       /work and /work/[category] render INSIDE this <main> via the page
       component, giving the SR rotor on /work a clean shape:
         <main>
           <nav aria-label="Main navigation">…TopNav…</nav>  (outside <main>)
           <nav aria-label="Filmography filters">…FilterPillBar…</nav>
           <div role="region" aria-label="Filmography reel">
             <article aria-label="Video 1 of 56: …">…</article>
             …56 articles total…
           </div>
         </main>
       — exactly one <main>, two <nav>s, one region, 56 articles. Pitfall 8
       landmark-explosion avoided (NAV-03).

  Phase 6 Plan 06-01 added <Footer /> below </main> (CONT-03).
-->
<script lang="ts">
  import '../app.css';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { initMotionState } from '$lib/state/motion.svelte';
  import { initNetworkState } from '$lib/state/network.svelte';
  import { initVisibilityListener } from '$lib/state/visibility.svelte';
  import TopNav from '$lib/components/TopNav.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let { children } = $props();

  // Hydrate the module-scope state runes (REEL-04 triggers 1 + 2; D-08; Plan
  // 05-01 Finding 10). All three init helpers are SSR-safe (typeof window /
  // typeof document guarded) and idempotent so HMR re-mounts can't double-
  // bind the matchMedia / navigator.connection / visibilitychange listeners.
  // Phase 5 Finding 10 option (a): pageVisibility rune is registered ONCE
  // here so ReelStage + HeroAmbient (Plan 05-03) + WatchPlayer (Plan 05-02)
  // all subscribe to the SAME source-of-truth without per-component listener
  // overhead.
  onMount(() => {
    initMotionState();
    initNetworkState();
    initVisibilityListener();
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
  <title>Michelle Ngo</title>

  <!-- D-13 Favicon set (multi-size: browser tabs + iOS + Android home-screen) -->
  <link rel="icon" type="image/x-icon" href="{base}/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="16x16" href="{base}/favicon-16.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="{base}/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="{base}/favicon-192.png" />
  <link rel="icon" type="image/png" sizes="512x512" href="{base}/favicon-512.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="{base}/apple-touch-icon.png" />

  <!-- D-02/D-13 Sitewide OG + Twitter card (summary_large_image, 1200x630). Per-route
       <title>/<meta description> overrides stay in each +page.svelte. -->
  <meta property="og:site_name" content="Michelle Ngo" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://michellengo.net{base}/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Michelle Ngo — Filmmaker & Producer" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://michellengo.net{base}/og-image.jpg" />
</svelte:head>

<!-- D-11 / WCAG 2.4.1 — skip-to-content link. sr-only by default; the
     focus:not-sr-only utility surfaces it as a positioned banner when
     keyboard-focused. Lands focus on <main id="main"> via its href fragment;
     <main tabindex="-1"> makes <main> programmatically focusable so the
     navigation actually moves focus (NOT just scrolls) per WCAG. -->
<a
  href="#main"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-neutral-50 focus:text-neutral-950 focus:px-4 focus:py-2 focus:rounded focus:font-sans focus:text-sm"
>
  Skip to content
</a>

<TopNav />

<main id="main" tabindex="-1" class="block">
  {@render children()}
</main>

<Footer />
