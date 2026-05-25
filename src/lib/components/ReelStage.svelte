<!--
  ReelStage — scroll-snap container with ONE IntersectionObserver per mount
  observing N sections (REEL-01, REEL-03, REEL-05).

  Locked decisions:
    REEL-01  — section height uses the small viewport height unit (Pitfall 2
                locked; see RESEARCH §scroll-snap on iOS Safari 16/17.0/17.1)
              — snap-y snap-proximity (Pitfall 7: avoid mandatory — it interacts
                badly with the postMessage handshake)
              — overscroll-y-contain + touch-pan-y (Pitfall 1 mitigation
                iOS Safari 16/17.0/17.1)
    REEL-03  — ONE runed useIntersectionObserver, array target (runed 0.37.1
                source-verified to accept HTMLElement[]; auto-cleanup via internal
                $effect.root — sidesteps Svelte #12731)
              — rootMargin '100% 0%' (D-11 eager-mount: one viewport above + below)
              — threshold [0, 0.5, 1] (D-10 — 0.5 is the activeIdx discriminator)
              — mountedIds Set never exceeds 3 (current ± 1, capped at boundaries)
    REEL-07  — single document.visibilitychange subscription broadcast via context
                (D-12; pause-not-unmount means iframes stay in DOM; Plan 03-02's
                PreviewLoop consumes documentHidden via reel:visibility context)
    NAV-03   — each section is <article aria-label="Video N of M: [title]">
                forward-ship of NAV-03 (Pitfall 8 — ARTICLE not SECTION).
    Pitfall 12 — URL hash write on snap settle (history.replaceState, 300ms
                 debounce) so Phase 5 WATCH-05 back-nav scroll restoration
                 lands the producer on the section they came from.

  Anti-pattern grep gates (enforced in this file via documentation grep):
    - Use h-svh only (small viewport height); avoid the dynamic / large units.
    - Use snap-proximity only; avoid mandatory.
    - Use the runed wrapper for IntersectionObserver; no module-scope IO construction.
-->
<script lang="ts">
  import { setContext, onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { base } from '$app/paths';
  import { useIntersectionObserver } from 'runed';
  import type { Video } from '$lib/data';
  import ReelSection from './ReelSection.svelte';

  let { videos }: { videos: readonly Video[] } = $props();

  // Section element refs registered via bind:this. Length tracked via $derived
  // so a future videos-prop change (e.g., Phase 4 /work/[category] filter
  // narrowing) re-shapes the refs array reactively. runed observes the array
  // via the getter below.
  let sectionRefs = $state<(HTMLElement | null)[]>([]);
  $effect(() => {
    if (sectionRefs.length !== videos.length) {
      sectionRefs = Array(videos.length).fill(null);
    }
  });

  // ±1 viewport-windowed mount set (REEL-03). Capped at 3 by construction.
  // SvelteSet is already reactive (svelte/no-unnecessary-state-wrap rules out
  // wrapping in $state). Mutations (clear/add) propagate to consumers via the
  // setContext('reel:stage').mountedIds getter; ReelSection.$derived gates
  // off the same instance reference.
  const mountedIds = new SvelteSet<string>();

  // Current section index (D-10 — only set when intersectionRatio ≥ 0.5).
  let activeIdx = $state(-1);

  // Document Page Visibility (REEL-07 / D-12 broadcast)
  let documentHidden = $state(false);

  // Pitfall 12: debounce timer for the URL hash write on snap settle.
  // history.replaceState fires ~300ms after activeIdx changes so we don't
  // thrash the URL bar during fast scroll. Cleared on the next change.
  let hashTimer: number | null = null;

  setContext('reel:stage', {
    get mountedIds() {
      return mountedIds;
    },
    get activeIdx() {
      return activeIdx;
    },
    get videoCount(): number {
      return videos.length;
    },
  });

  setContext('reel:visibility', {
    get documentHidden() {
      return documentHidden;
    },
  });

  // ONE observer for all N targets (REEL-03). runed wraps in $effect.root,
  // calls observer.disconnect() in cleanup automatically (RESEARCH §Pattern 2
  // verified against installed runed@0.37.1 source).
  useIntersectionObserver(
    () => sectionRefs.filter((el): el is HTMLElement => el !== null),
    (entries) => {
      // Find the entry with the highest intersectionRatio.
      let bestIdx = -1;
      let bestRatio = 0;
      for (const entry of entries) {
        const idx = sectionRefs.indexOf(entry.target as HTMLElement);
        if (idx >= 0 && entry.intersectionRatio > bestRatio) {
          bestRatio = entry.intersectionRatio;
          bestIdx = idx;
        }
      }
      if (bestIdx < 0) return;

      // D-10: only count as "current" if ≥ 50% visible.
      if (bestRatio >= 0.5 && bestIdx !== activeIdx) {
        activeIdx = bestIdx;
        // Pitfall 12: write the current section's id to the URL hash so the browser
        // back-button native scroll restoration (Phase 5 WATCH-05) lands the producer
        // on the section they came from. Debounced ~300ms to avoid history-thrash
        // during fast scroll. Use replaceState (NOT pushState) so we don't pollute
        // the back stack on every snap settle.
        if (typeof window !== 'undefined') {
          if (hashTimer !== null) clearTimeout(hashTimer);
          const currentId = videos[bestIdx]?.id;
          if (currentId) {
            hashTimer = window.setTimeout(() => {
              history.replaceState(null, '', `${base}/work#video=${currentId}`);
            }, 300);
          }
        }
      }

      // D-11: eager-mount the ±1 window regardless of the 0.5 gate.
      // Compute the next window then diff against the live SvelteSet so we
      // only emit add/delete mutations that actually change membership —
      // SvelteSet broadcasts on every mutation; needless churn would force
      // every ReelSection.$derived to re-evaluate on every scroll tick.
      // (Plain `new Set` would trip svelte/prefer-svelte-reactivity; an array
      // is the smallest "membership scratch" type the linter accepts.)
      const nextIds: string[] = [];
      for (let i = Math.max(0, bestIdx - 1); i <= Math.min(videos.length - 1, bestIdx + 1); i++) {
        const v = videos[i];
        if (v) nextIds.push(v.id);
      }
      for (const existing of mountedIds) {
        if (!nextIds.includes(existing)) mountedIds.delete(existing);
      }
      for (const id of nextIds) {
        if (!mountedIds.has(id)) mountedIds.add(id);
      }
    },
    { threshold: [0, 0.5, 1], rootMargin: '100% 0%' }
  );

  // REEL-07 / D-12 — single visibilitychange subscription broadcast via context.
  // PreviewLoop instances (Plan 03-02) read documentHidden via reel:visibility
  // getContext and postMessage 'pause'/'play' to their iframes (300ms budget).
  onMount(() => {
    const onVis = (): void => {
      documentHidden = document.hidden;
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  });
</script>

<div
  class="h-svh snap-y snap-proximity overflow-y-scroll overscroll-y-contain touch-pan-y"
  role="region"
  aria-label="Filmography reel"
>
  {#each videos as video, i (video.id)}
    <article
      bind:this={sectionRefs[i]}
      class="relative h-svh snap-start"
      aria-label={`Video ${i + 1} of ${videos.length}: ${video.title}`}
    >
      <ReelSection {video} index={i} total={videos.length} />
    </article>
  {/each}
</div>
