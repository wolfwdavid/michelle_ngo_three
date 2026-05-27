<!--
  CategoryTag — Phase 5 Plan 05-02 Task 3 (extracted as a tiny reusable
  component for /watch/[id]'s metadata block).

  Mirrors the inline chip pattern from ReelSection.svelte (Phase 3 REEL-05 —
  border + text in category accent color via --color-cat-* CSS vars). When
  `href` is provided, renders as an <a> (interactive — clicks to /work/{slug}
  per D-08 watch-metadata content contract); without href, renders as <span>
  (decorative chip).

  Color: the accent class is composed from Phase 4 categoryAccent.ts helpers
  (text-cat-{slug} + ring-cat-{slug}/40 + bg-cat-{slug}/15) so Tailwind v4's
  scanner picks up the literal class strings at build time (Pitfall 7
  scanner contract — dynamic template strings would not be scanned).

  Typography: font-mono + tracking-wider + uppercase + text-xs — the
  cinematic label register from UI-SPEC §Typography (Label row).
-->
<script lang="ts">
  import type { Category } from '$lib/data';
  import { categoryAccent, categoryAccentBg, categoryAccentRing } from './categoryAccent';

  let {
    category,
    href,
  }: {
    category: Category;
    href?: string;
  } = $props();

  const textClass = $derived(categoryAccent(category));
  const bgClass = $derived(categoryAccentBg(category));
  const ringClass = $derived(categoryAccentRing(category));
</script>

{#if href}
  <a
    {href}
    data-sveltekit-preload-data="hover"
    class="inline-block rounded-full border px-3 py-1 font-mono text-xs tracking-wider uppercase ring-1 transition-colors hover:bg-opacity-30 {textClass} {bgClass} {ringClass}"
    data-category={category}
  >
    {category}
  </a>
{:else}
  <span
    class="inline-block rounded-full border px-3 py-1 font-mono text-xs tracking-wider uppercase ring-1 {textClass} {bgClass} {ringClass}"
    data-category={category}
  >
    {category}
  </span>
{/if}
