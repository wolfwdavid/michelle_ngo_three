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
  import { setContext } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { base } from '$app/paths';
  import { useIntersectionObserver } from 'runed';
  import type { Video } from '$lib/data';
  import ReelSection from './ReelSection.svelte';
  import { motion } from '$lib/state/motion.svelte';
  // Phase 5 Finding 10 option (a): the documentHidden composition (pageHidden
  // OR menu.menuOpen) now lives in pageVisibility — a single module-scope rune
  // subscribed by ReelStage AND HeroAmbient (Plan 05-03) AND WatchPlayer
  // (Plan 05-02). The Phase 3 D-12 'reel:visibility' setContext broadcast is
  // preserved verbatim for PreviewLoop consumers; only the writer migrated.
  import { pageVisibility } from '$lib/state/visibility.svelte';

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

  // Plan 05-01 Finding 10 option (a): documentHidden now sources from the
  // pageVisibility rune which internally ORs document.hidden with
  // menu.menuOpen. The Phase 3 D-12 + Plan 04-03 D-08 semantics are preserved
  // verbatim — only the writer (visibilitychange listener) moved out of
  // ReelStage into the rune (registered ONCE at app boot from +layout.svelte's
  // initVisibilityListener call). The 'reel:visibility' setContext broadcast
  // below stays unchanged so PreviewLoop consumers see no API change.
  const documentHidden = $derived(pageVisibility.documentHidden);

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

  // Plan 05-01 D-15 hash-restoration consumer (WATCH-05). Phase 3 ReelStage
  // already WRITES `${base}/work#video=<id>` on snap-settle (the bestIdx
  // branch above); this $effect READS the hash on first paint AND on
  // cross-route arrival / direct paste / back-nav from /watch/[id], scrolling
  // the matching article to viewport top. Pitfall C: must use $effect NOT
  // onMount because sectionRefs[] is populated by bind:this AFTER the first
  // paint flush — onMount runs too early. The `restoredFromHash` guard makes
  // the effect single-fire per mount so Phase 4 /work/[category] filter
  // narrowing (which mutates videos.length → sectionRefs.length) does NOT
  // re-scroll on every change. D-15 specifies behavior:'auto' (instant) — NOT
  // 'smooth' — to avoid animated-scroll noise on cinema entry. D-16/D-17:
  // direct paste behaves identically; if hash id is not in the current
  // filtered videos prop, no-op land at top.
  let restoredFromHash = $state(false);
  $effect(() => {
    if (restoredFromHash) return;
    if (typeof window === 'undefined') return;
    if (sectionRefs.length !== videos.length) return;
    const hash = window.location.hash;
    if (!hash.startsWith('#video=')) {
      restoredFromHash = true;
      return;
    }
    const id = hash.slice('#video='.length);
    const idx = videos.findIndex((v) => v.id === id);
    if (idx < 0) {
      // D-17: id not in current filtered set — land at top, no-op.
      restoredFromHash = true;
      return;
    }
    const target = sectionRefs[idx];
    if (!target) {
      restoredFromHash = true;
      return;
    }
    // jsdom guard mirrors the keyboard-handler pattern above (Plan 04-01
    // Rule 1 deviation). scrollIntoView may be undefined in older test envs.
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
    restoredFromHash = true;
  });

  // D-09 keyboard handler — Arrow / PageDown / PageUp / Space / Home / End.
  // Handler attaches to the reel container (NOT global window) so future form
  // inputs in Phase 6 routes don't have their keys stolen. D-12: Escape is
  // intentionally NOT mapped — MobileMenu's document-level keydown owns it;
  // inside the reel Escape is a no-op (matches the producer's expectation of
  // "nothing happens on Escape on a static-feel page").
  //
  // Note: some headless browsers don't fire scrollIntoView smoothly inside
  // scroll-snap containers; smooth is a cinematic-only enhancement gated on
  // prefers-reduced-motion. The browser falls back to instant snap on engines
  // that don't honor the smooth option.
  function onKey(e: KeyboardEvent): void {
    type Nav = { delta: number; absolute?: 'first' | 'last' };
    let nav: Nav | null = null;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') nav = { delta: 1 };
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') nav = { delta: -1 };
    else if (e.key === ' ') nav = e.shiftKey ? { delta: -1 } : { delta: 1 };
    else if (e.key === 'Home') nav = { delta: 0, absolute: 'first' };
    else if (e.key === 'End') nav = { delta: 0, absolute: 'last' };
    if (nav === null) return;
    e.preventDefault();
    let targetIdx: number;
    if (nav.absolute === 'first') targetIdx = 0;
    else if (nav.absolute === 'last') targetIdx = videos.length - 1;
    else targetIdx = Math.max(0, Math.min(videos.length - 1, activeIdx + nav.delta));
    const target = sectionRefs[targetIdx];
    if (!target) return;
    // jsdom guard mirrors the FilterPillBar pattern (Plan 04-01 Rule 1 deviation).
    if (typeof target.scrollIntoView !== 'function') return;
    target.scrollIntoView({
      block: 'start',
      behavior: motion.prefersReducedMotion ? 'auto' : 'smooth',
    });
  }
</script>

<!--
  Plan 04-03 D-09: the reel container is intentionally focusable + keyboard-
  handled so Arrow/PageDown/PageUp/Space/Home/End map to section navigation.
  role="region" + aria-label makes it a meaningful landmark, but the Svelte
  a11y linter still flags tabindex + onkeydown on a non-button element. The
  contract requires both — the container is the scroll surface, not its
  children — so the warnings are intentionally silenced.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="h-[calc(100svh-var(--chrome-nav-height,0px)-var(--chrome-pill-height,0px))] snap-y snap-proximity overflow-y-scroll overscroll-y-contain touch-pan-y"
  role="region"
  aria-label="Filmography reel"
  tabindex="0"
  onkeydown={onKey}
  data-doc-hidden={documentHidden}
>
  {#each videos as video, i (video.id)}
    <article
      bind:this={sectionRefs[i]}
      class="relative h-[calc(100svh-var(--chrome-nav-height,0px)-var(--chrome-pill-height,0px))] snap-start"
      aria-label={`Video ${i + 1} of ${videos.length}: ${video.title}`}
    >
      <ReelSection {video} index={i} total={videos.length} />
    </article>
  {/each}
</div>
