<!--
  Phase 4 D-07: full-screen mobile overlay menu. Mirrors
  ../michelle_ngo_four/src/lib/components/MobileMenu.svelte close to verbatim.

  Decisions implemented:
    D-07  — instant overlay (no transition); sidesteps reduced-motion handling.
    D-08  — on mount, the menu rune ALREADY has menuOpen=true (TopNav's
            hamburger called openMenu() before rendering this component).
            Plan 04-03 wires ReelStage to OR menu.menuOpen into its
            documentHidden $state so the existing reel:visibility broadcast
            pauses iframes within 300ms.
    D-12  — Escape closes menu (modal pattern); document keydown listener
            attached in $effect with cleanup on unmount.
    D-15  — data-sveltekit-preload-data="hover" on every link.

  ESLint: svelte/no-navigation-without-resolve disabled via per-file
  override in eslint.config.js (Plan 04-01 pre-registered).
-->
<script lang="ts">
  import { base } from '$app/paths';
  import { getCategoriesInDisplayOrder, categoryToSlug } from '$lib/data';
  import { closeMenu } from '$lib/state/menu.svelte';

  const categories = getCategoriesInDisplayOrder();

  // D-12 Escape: close menu on document keydown Escape.
  $effect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        closeMenu();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
</script>

<div
  id="mobile-menu"
  class="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col"
  role="dialog"
  aria-modal="true"
  aria-label="Mobile navigation"
>
  <div class="flex items-center justify-between px-4 h-14 border-b border-white/10">
    <a
      href={base || '/'}
      onclick={closeMenu}
      class="font-display text-sm font-bold uppercase tracking-widest text-neutral-50 hover:text-neutral-300"
    >
      Michelle Ngo
    </a>
    <button type="button" class="p-2 -mr-2" aria-label="Close menu" onclick={closeMenu}>
      <span class="block w-5 h-px bg-white rotate-45 translate-y-px"></span>
      <span class="block w-5 h-px bg-white -rotate-45 -translate-y-px"></span>
    </button>
  </div>

  <nav aria-label="Mobile menu" class="flex-1 overflow-y-auto px-4 py-6">
    <ul class="space-y-4 text-base uppercase tracking-wider">
      {#each categories as category (category)}
        <li>
          <a
            href={`${base}/work/${categoryToSlug(category)}`}
            data-sveltekit-preload-data="hover"
            onclick={closeMenu}
            class="block hover:underline"
          >
            {category}
          </a>
        </li>
      {/each}
    </ul>

    <hr class="my-6 border-white/10" />

    <ul class="space-y-3 text-sm uppercase tracking-wider text-neutral-400">
      <li>
        <a
          href={`${base}/about`}
          data-sveltekit-preload-data="hover"
          onclick={closeMenu}
          class="block hover:text-white">About</a
        >
      </li>
      <li>
        <a
          href={`${base}/press`}
          data-sveltekit-preload-data="hover"
          onclick={closeMenu}
          class="block hover:text-white">Press</a
        >
      </li>
      <li>
        <a
          href={`${base}/contact`}
          data-sveltekit-preload-data="hover"
          onclick={closeMenu}
          class="block hover:text-white">Contact</a
        >
      </li>
    </ul>
  </nav>
</div>
