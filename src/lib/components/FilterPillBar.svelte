<!--
  FilterPillBar — Phase 4 sticky filter row (FILT-01, FILT-02; D-01..D-04, D-13..D-16).

  9 pills: leftmost All (neutral-active, links to /work) + 8 categories in
  getCategoriesInDisplayOrder() — count-desc, ties-alpha — each linking to
  /work/[slug] (the FILTER route per FILT-02; the dedicated /pbs-american-portrait
  landing is Phase 6 and is reached via TopNav, not this pill bar — see Phase 4
  CONTEXT deferred "PBS filter pill linking to /pbs-american-portrait/").

  Active state derivation: endsWith(`/work/${slug}`) on a trailing-slash-normalized
  page.url.pathname. Mirror of _four/TopNav.svelte:100-121 — same helper handles
  both the `/work/<slug>` (no trailing slash) and `/work/<slug>/` (trailing slash)
  pathname shapes. _three has NOT yet shipped trailingSlash='always' in
  src/routes/+layout.ts, so BOTH shapes appear in practice (server pre-render vs
  client-nav). The normalization makes this irrelevant to the active-state branch.

  TODO Plan 04-02 / 04-03: replace `top-0` with `top-[var(--chrome-nav-height,0px)]`
  once Plan 04-02's TopNav publishes the chrome height as a CSS variable on :root;
  Plan 04-03 then plumbs the combined chrome-nav-height + chrome-pill-height into
  the ReelStage h-svh literal so the reel doesn't sit underneath the chrome.

  ESLint contract: the per-file `svelte/no-navigation-without-resolve` override
  lives in eslint.config.js. The disable comment below is informational; the
  config-level override is the load-bearing silencer (the test asserts literal
  hrefs against a mocked base='', which resolve()-typed routes would not produce
  in the rendered output).
-->
<script lang="ts">
  // FilterPillBar (Phase 4 FILT-01) is the site's category-filter nav surface.
  // Hrefs are produced base-path-safely via `${base}/work/${slug}` template
  // literals — same pattern as _four/TopNav.svelte:30 and Phase 3
  // ReelSection.svelte. The eslint rule `svelte/no-navigation-without-resolve`
  // is silenced via a per-file override in eslint.config.js (pre-registered
  // alongside TopNav and MobileMenu for Plan 04-02). Reasons:
  //   (a) the unit tests assert literal `/work/pbs-american-portrait` hrefs
  //       against a mocked base='' — resolve() output would not match.
  //   (b) the existing static-typed entries() enumeration in
  //       /work/[category]/+page.ts already proves slug type-safety; resolve()
  //       here would just duplicate that contract.
  import { page } from '$app/state';
  import { base } from '$app/paths';
  import { tick } from 'svelte';
  import { getCategoriesInDisplayOrder, categoryToSlug } from '$lib/data';
  import { categoryAccent, categoryAccentBg, categoryAccentRing } from './categoryAccent';
  import { motion } from '$lib/state/motion.svelte';

  const categories = getCategoriesInDisplayOrder();
  let containerEl = $state<HTMLElement | null>(null);

  function isAllActive(): boolean {
    // D-03: All is active on /work (the unfiltered canonical reel) ONLY.
    // The trailing-slash strip lets a future trailingSlash='always' migration
    // (or current pre-render path of /work/) match the same branch.
    const normalized = page.url.pathname.replace(/\/$/, '');
    return normalized.endsWith('/work');
  }

  function isCategoryActive(slug: string): boolean {
    // D-02 active-state: endsWith suffix-match (mirror _four/TopNav.svelte:100-121).
    // Future categories with the same slug suffix would false-positive in a
    // naive contains() check; endsWith on the `/work/<slug>` prefix isolates
    // this surface to its filter route. The Phase 6 /pbs-american-portrait/
    // dedicated landing is NOT highlighted here by design — that surface is
    // TopNav's responsibility per the Phase 4 CONTEXT deferred-ideas section.
    const normalized = page.url.pathname.replace(/\/$/, '');
    return normalized.endsWith(`/work/${slug}`);
  }

  $effect(() => {
    // D-04 narrow-width mobile scroll: when the active pill changes (route
    // change), scroll it horizontally into view so the user sees the current
    // filter context. Reading page.url.pathname inside the effect body makes
    // the effect re-run on every navigation (Pitfall 2 carry-forward).
    if (!containerEl) return;
    void page.url.pathname;
    void tick().then(() => {
      const active = containerEl?.querySelector('[aria-current="page"]') as HTMLElement | null;
      if (!active) return;
      // jsdom (Vitest ui project) does not implement scrollIntoView; the guard
      // also covers any future SSR codepath that may evaluate this branch.
      if (typeof active.scrollIntoView !== 'function') return;
      active.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: motion.prefersReducedMotion ? 'auto' : 'smooth',
      });
    });
  });
</script>

<nav
  aria-label="Filmography filters"
  class="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur border-b border-white/10"
>
  <ul
    bind:this={containerEl}
    class="flex items-center gap-2 overflow-x-auto snap-x snap-proximity px-4 py-2 sm:px-6 lg:px-8 [scrollbar-width:none] [-ms-overflow-style:none]"
  >
    <li class="snap-start shrink-0">
      <a
        href={`${base}/work`}
        data-sveltekit-preload-data="hover"
        aria-current={isAllActive() ? 'page' : undefined}
        class={`inline-block rounded-full px-3 py-1 text-xs uppercase tracking-wider border border-white/15 ${
          isAllActive()
            ? 'bg-neutral-50 text-neutral-950 border-neutral-50'
            : 'text-neutral-300 hover:bg-white/5'
        }`}
      >
        All
      </a>
    </li>
    {#each categories as category (category)}
      {@const slug = categoryToSlug(category)}
      {@const active = isCategoryActive(slug)}
      <li class="snap-start shrink-0">
        <a
          href={`${base}/work/${slug}`}
          data-sveltekit-preload-data="hover"
          aria-current={active ? 'page' : undefined}
          data-category={category}
          class={`inline-block rounded-full px-3 py-1 text-xs uppercase tracking-wider border border-white/15 ${
            active
              ? `${categoryAccent(category)} ${categoryAccentBg(category)} ring-1 ${categoryAccentRing(category)} border-transparent`
              : 'text-neutral-300 hover:bg-white/5'
          }`}
        >
          {category}
        </a>
      </li>
    {/each}
  </ul>
</nav>
