<script lang="ts">
  /**
   * Static poster fallback for the cinematic reel.
   *
   * Renders for any of the 5 REEL-04 fallback triggers via ReelSection's
   * unified $derived gate:
   *   1. prefers-reduced-motion: reduce
   *   2. cellular (Chromium with effectiveType in slow-2g/2g/3g OR saveData OR downlink<1.5)
   *   3. iOS Low Power Mode play() rejection (via PreviewLoop's 800ms D-07 timeout)
   *   4. embed-disabled-by-owner (via same 800ms timeout)
   *   5. EU autoplay restrictions (via same 800ms timeout)
   *
   * Consumes:
   * - src/lib/data/posters.ts getPosterFor(video) -> string (path; 03-01 D-02 deterministic fallback)
   *
   * Aspect-ratio container is load-bearing for POL-03 (no CLS on poster->iframe swap).
   * Title typography + gradient overlay match ReelSection's PreviewLoop variant exactly
   * so the swap is layout-stable (REEL-05 + Pitfall 20).
   *
   * Category tag is inlined (same pattern 03-01 ReelSection uses) — no extracted
   * <CategoryTag /> component exists in Phase 3; extraction may land in Phase 4+.
   *
   * IMPORTANT: Uses plain <img> (not <enhanced:img>) because @sveltejs/enhanced-img
   * Vite plugin requires build-time static asset imports (e.g., `src="./photo.jpg"`)
   * to generate picture sources. Our poster paths are RUNTIME strings driven by the
   * sidecar (Plan 03-01 D-02 contract: getPosterFor returns a runtime string), so
   * enhanced-img's build-time variant generation does not apply. The static/posters/
   * JPEGs are pre-optimized by scripts/check-embeds.ts (Task 3); loading="lazy" +
   * fetchpriority="low" + decoding="async" provide the runtime perf gates instead.
   */
  import { base } from '$app/paths';
  import type { Video } from '$lib/data/schema';
  import type { Category } from '$lib/data/categories';
  import { getPosterFor } from '$lib/data/posters';

  interface Props {
    video: Video;
    /**
     * 1-indexed position in the reel (e.g., 12 of 56). Part of the public
     * contract for caller composition; ReelSection already renders the
     * "01 / 56" caption itself, so PosterImage accepts but currently does
     * not surface index/total. Future polish phases may surface here too.
     */
    index?: number;
    /** Total video count — same use as index */
    total?: number;
    /**
     * Legacy prop from Plan 03-01 stub — the new PosterImage ALWAYS renders
     * the PLAY-WITH-SOUND anchor (REEL-05 + Pitfall 3 LPM gate require it on
     * every fallback render). Accepted-and-ignored so ReelSection (currently
     * still passes it) compiles until Task 2 of this plan removes the prop
     * pass-through at the call site.
     */
    showPlayCta?: boolean;
  }

  // Props are destructured but index/total/showPlayCta stay caller-supplied;
  // we don't read them in the template. Svelte 5's state_referenced_locally
  // warning does NOT fire when a prop is destructured-but-never-read.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { video, index: _index, total: _total, showPlayCta: _showPlayCta }: Props = $props();

  // 03-01 D-02 returns a deterministic string path (with fallback) — never null.
  // $derived so future prop swaps (Phase 4 filter narrowing) re-read the sidecar.
  const posterPath = $derived(getPosterFor(video));

  // Inline category-tag token mapping — mirrors 03-01 ReelSection pattern (full
  // Category enum names from categories.ts -> short --color-cat-* token suffix).
  const categoryToTokenName: Record<Category, string> = {
    'PBS American Portrait': 'pbs',
    'Promos & Trailers': 'promos',
    'Branded Content': 'branded',
    'Documentary / Short Film': 'docshort',
    Reel: 'reel',
    'Personal / Tribute': 'personal',
    'Educational / Nonprofit': 'edunon',
    Other: 'other',
  };
  const catToken = $derived(categoryToTokenName[video.category]);
</script>

<div class="poster-container" data-stub="poster-image" data-video-id={video.id}>
  <img
    src={`${base}${posterPath}`}
    alt={video.title}
    loading="lazy"
    fetchpriority="low"
    decoding="async"
    class="poster-img"
  />

  <!-- Two-stop gradient overlay (Pitfall 20 legibility) -->
  <div class="gradient-overlay" aria-hidden="true"></div>

  <!-- REEL-05 overlay: category tag top-right (inline span, no extracted CategoryTag.svelte) -->
  <div class="category-tag-position" aria-hidden="true">
    <span
      class="category-tag"
      style:--cat-color={`var(--color-cat-${catToken})`}
      data-category={video.category}
    >
      {video.category}
    </span>
  </div>

  <!-- REEL-05 CTA: full-bleed anchor wrapping the title + PLAY-WITH-SOUND caption.
       aria-label uses ASCII straight double-quotes around the title so the test
       regex matches trivially. -->
  <a
    href={`${base}/watch/${video.id}`}
    class="play-with-sound"
    aria-label={`Play "${video.title}" with sound`}
  >
    <span class="title">{video.title}</span>
    <span class="play-cta">▷ PLAY WITH SOUND</span>
  </a>
</div>

<style>
  .poster-container {
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 16 / 9;
    background-color: var(--color-neutral-950);
    overflow: hidden;
  }
  .poster-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .gradient-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.6) 0%,
      transparent 30%,
      transparent 70%,
      rgba(0, 0, 0, 0.6) 100%
    );
    pointer-events: none;
  }
  .category-tag-position {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    pointer-events: none;
  }
  .category-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    background-color: var(--cat-color);
    color: var(--color-neutral-950);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .play-with-sound {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 2rem;
    gap: 1rem;
    color: var(--color-neutral-50);
    text-decoration: none;
  }
  .title {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    line-height: 1.2;
    font-weight: 600;
  }
  .play-cta {
    font-family: var(--font-display);
    font-size: 0.875rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    align-self: flex-start;
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-neutral-50);
    border-radius: 9999px;
  }
</style>
