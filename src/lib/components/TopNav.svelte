<!--
  Phase 4 NAV-01: cinematic chrome TopNav — wordmark + 8 categories +
  About/Press/Contact + hamburger. Chrome fades DURING reel scroll on
  /work, /work/[category], /pbs-american-portrait per D-05 + D-06.
  Surfaces on scroll-stop (600ms), hover-near-top (80px), focus-within,
  and tap.

  Mirrors ../michelle_ngo_four/src/lib/components/TopNav.svelte shape
  (the endsWith active-state helper at lines 100-121 is copied VERBATIM
  including the PBS dual-route guard at lines 117-119 — load-bearing
  for NAV-01 "PBS link active on both /work/pbs-american-portrait/
  AND /pbs-american-portrait/" per PBS-03 forward-ship).

  Decisions implemented:
    D-05 — scroll-event driven chrome fade (NOT IO-driven; IO is
           Phase 3 viewport-windowing territory). 600ms scroll-stop debounce.
    D-06 — fade scope = reel routes only; page.route.id reactive read
           inside $effect. INVERTS _four's hero-transparent rule.
    D-07 — MobileMenu mirrors _four close to verbatim; opens via
           openMenu() rune write; closes via closeMenu().
    D-08 — opening MobileMenu writes menuOpen=true to $lib/state/menu;
           Plan 04-03 ORs that into ReelStage's documentHidden so the
           existing reel:visibility context broadcast (Phase 3 D-12)
           pauses iframes within 300ms. Bridge is dormant in this plan
           (rune exists; ReelStage edit lands in Plan 04-03).
    D-11 — skip-link target is the <main> wrapper in +layout.svelte;
           this component is mounted ABOVE <main> per +layout.svelte edit.
    D-13/D-15 — active-state endsWith + hover-prefetch.

  ESLint: svelte/no-navigation-without-resolve disabled for this file via
  the per-file override in eslint.config.js (Plan 04-01 pre-registered).
  Mirror of _four/TopNav.svelte:25-30 wording.

  Anti-pattern grep gates (enforced via this plan's verify block):
    - NO display:none / visibility:hidden on the <header> (would hide
      chrome from SR users per PROJECT.md a11y constraint — fade uses
      opacity-0 + pointer-events-none ONLY).
    - The fade trigger is page.route.id read inside $effect (NOT a
      top-level const — would break Pitfall 2 reactivity).
-->
<script lang="ts">
  import { page } from '$app/state';
  import { base } from '$app/paths';
  import { onDestroy } from 'svelte';
  import { getCategoriesInDisplayOrder, categoryToSlug } from '$lib/data';
  import { categoryAccent } from './categoryAccent';
  import { scrollIdle, initScrollIdle, teardownScrollIdle } from '$lib/state/scrollIdle.svelte';
  import { menu, openMenu } from '$lib/state/menu.svelte';
  import MobileMenu from './MobileMenu.svelte';

  const categories = getCategoriesInDisplayOrder();

  // D-05 chrome-fade local signals — only consumed when onReelRoute is true.
  let hoverNearTop = $state(false);
  let focusWithinChrome = $state(false);
  let recentlyTapped = $state(false);
  let tapResetHandle: ReturnType<typeof setTimeout> | undefined;
  let headerEl = $state<HTMLElement | null>(null);

  // D-06 — fade scope derives from page.route.id; read INSIDE $effect for reactivity (mirrors _four/TopNav.svelte:50 Pitfall 2 note).
  const REEL_ROUTE_IDS: ReadonlySet<string> = new Set([
    '/work',
    '/work/[category]',
    '/pbs-american-portrait',
  ]);

  $effect(() => {
    const onReelRoute = page.route.id !== null && REEL_ROUTE_IDS.has(page.route.id);
    if (!onReelRoute) {
      teardownScrollIdle();
      hoverNearTop = false;
      focusWithinChrome = false;
      recentlyTapped = false;
      return; // no listeners to clean up — early-return
    }

    // Attach scroll listener on the reel container (the [role="region"][aria-label="Filmography reel"]
    // owned by ReelStage). Fall back to window if the container is not yet queryable (mount-order timing).
    const reelContainer = document.querySelector(
      '[role="region"][aria-label="Filmography reel"]'
    ) as HTMLElement | null;
    initScrollIdle(reelContainer ?? window);

    // D-05: hover-near-top zone (top 80px). Use pointermove on document, filter by clientY.
    function onPointerMove(e: PointerEvent): void {
      hoverNearTop = e.clientY < 80;
    }
    // D-05: focus-within signal — focusin/focusout filtered to chrome element ref.
    function onFocusIn(e: FocusEvent): void {
      if (headerEl && e.target instanceof Node && headerEl.contains(e.target)) {
        focusWithinChrome = true;
      }
    }
    function onFocusOut(e: FocusEvent): void {
      // relatedTarget is the element gaining focus; if it's still inside the header, stay true.
      if (headerEl && e.relatedTarget instanceof Node && headerEl.contains(e.relatedTarget)) {
        return;
      }
      focusWithinChrome = false;
    }
    // D-05: tap anywhere → surface chrome for 800ms.
    function onPointerDown(): void {
      recentlyTapped = true;
      if (tapResetHandle !== undefined) clearTimeout(tapResetHandle);
      tapResetHandle = setTimeout(() => {
        recentlyTapped = false;
      }, 800);
    }
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      teardownScrollIdle();
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('pointerdown', onPointerDown);
      if (tapResetHandle !== undefined) clearTimeout(tapResetHandle);
    };
  });

  const baseClass =
    'sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-white/10 h-14 motion-safe:transition-opacity motion-safe:duration-300';
  const fadeClass = ' opacity-0 pointer-events-none';
  const chromeClass = $derived(
    page.route.id !== null &&
      REEL_ROUTE_IDS.has(page.route.id) &&
      scrollIdle.isScrolling &&
      !hoverNearTop &&
      !focusWithinChrome &&
      !recentlyTapped
      ? baseClass + fadeClass
      : baseClass
  );

  // isActive — VERBATIM copy of _four/TopNav.svelte:100-121 including the PBS guard.
  function isActive(slug: string): boolean {
    // Normalize trailing slash, then suffix-match the slug.
    const normalized = page.url.pathname.replace(/\/$/, '');
    if (normalized.endsWith(`/work/${slug}`)) return true;
    // PBS dual-route active-state — load-bearing for NAV-01 / PBS-03.
    if (slug === 'pbs-american-portrait' && normalized.endsWith('/pbs-american-portrait')) {
      return true;
    }
    return false;
  }

  onDestroy(() => {
    teardownScrollIdle();
    if (tapResetHandle !== undefined) clearTimeout(tapResetHandle);
  });
</script>

<header bind:this={headerEl} class={chromeClass}>
  <nav
    aria-label="Main navigation"
    class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between"
  >
    <a
      href={base || '/'}
      class="font-display text-sm font-bold uppercase tracking-widest text-neutral-50 hover:text-neutral-300"
      >Michelle Ngo</a
    >

    <!-- Desktop links (>=sm) -->
    <ul class="hidden sm:flex items-center gap-4 text-xs uppercase tracking-wider">
      {#each categories as category (category)}
        {@const slug = categoryToSlug(category)}
        <li>
          <a
            href={`${base}/work/${slug}`}
            data-sveltekit-preload-data="hover"
            aria-current={isActive(slug) ? 'page' : undefined}
            class={isActive(slug) ? categoryAccent(category) : 'text-neutral-300 hover:text-white'}
            >{category}</a
          >
        </li>
      {/each}
      <li class="ml-2 flex gap-3 text-neutral-500">
        <a href={`${base}/about`} data-sveltekit-preload-data="hover" class="hover:text-white"
          >About</a
        >
        <a href={`${base}/press`} data-sveltekit-preload-data="hover" class="hover:text-white"
          >Press</a
        >
        <a href={`${base}/contact`} data-sveltekit-preload-data="hover" class="hover:text-white"
          >Contact</a
        >
      </li>
    </ul>

    <!-- Hamburger (<sm) -->
    <button
      type="button"
      class="sm:hidden p-2 -mr-2"
      aria-label="Open menu"
      aria-expanded={menu.menuOpen}
      aria-controls="mobile-menu"
      onclick={openMenu}
    >
      <span class="block w-5 h-0.5 bg-white mb-1"></span>
      <span class="block w-5 h-0.5 bg-white mb-1"></span>
      <span class="block w-5 h-0.5 bg-white"></span>
    </button>
  </nav>
</header>

{#if menu.menuOpen}
  <MobileMenu />
{/if}
