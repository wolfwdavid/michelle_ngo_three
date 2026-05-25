# Phase 3: Reel System Core (LOAD-BEARING RISK) — Research

**Researched:** 2026-05-25
**Domain:** Cinematic-immersive scroll-snap fullscreen video reel — Vimeo + YouTube iframe lifecycle, viewport-windowed mounting, unified 5-trigger poster fallback, build-time poster pipeline, Playwright real-device matrix
**Confidence:** HIGH (CONTEXT.md locked all major decisions; supporting evidence verified against runed source, Vimeo/YouTube provider docs, MDN, BrowserStack docs, npm-installed package versions)

## Summary

Phase 3 builds the killer feature on real producer hardware. Five new files of component code (`ReelStage` / `ReelSection` / `PreviewLoop` / `PosterImage` + iframe URL builder + 2 postMessage adapters), 2 module-scope state runes, an extension to Phase 2's `scripts/check-embeds.ts` for poster self-hosting, and a Playwright 4-pillar suite gated against the POL-04 real-device matrix. CONTEXT.md locks every architectural choice; this research's job is to make implementation concrete — exact URL params, exact postMessage event names, the runed N-target API, the SSR-safe rune pattern, the CLS-safe iframe container, and the Playwright test shapes — so the planner can decompose into 03-01 / 03-02 / 03-03 without re-litigating.

The single load-bearing detection mechanism is the **800ms postMessage handshake timeout**: catches LPM `play()` rejection, autoplay-blocked, embed-disabled-by-owner, and EU autoplay restrictions in ONE codepath. The two pre-mount paths (`prefers-reduced-motion: reduce`, Chromium cellular detection) bypass it. That's the SUMMARY's "design once, trigger from five sources" made operational. The biggest concrete win from the research dive: **runed `useIntersectionObserver` accepts `HTMLElement | HTMLElement[]` as `target`** (verified directly in installed `0.37.1` source — `dist/utilities/use-intersection-observer/use-intersection-observer.svelte.d.ts:23`), so Phase 1's single-target wrapper does NOT need to extend — ReelStage just calls `useIntersectionObserver(() => sectionRefs, ...)` and gets ONE observer over N targets with $effect cleanup for free.

**Primary recommendation:** Lock the iframe URL builder in Plan 03-02 with exact parameter contracts (verified below), implement the postMessage adapters as named-listener-ref modules with origin allowlist hardcoded to `https://player.vimeo.com` and `https://www.youtube-nocookie.com`, use runed's array-target capability for ONE observer per stage, and build the poster pipeline as a new exported function in `scripts/check-embeds.ts` that runs IN ADDITION to the existing oEmbed health-check (not before, not after — same Vimeo oEmbed response that proves embeddability ALSO carries `thumbnail_url`).

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Poster pipeline (D-01..D-04):**
- D-01: Build-time fetch + self-host posters via `@sveltejs/enhanced-img`. Vimeo: `thumbnail_url` from `https://vimeo.com/api/oembed.json?url=...`. YouTube: `https://i.ytimg.com/vi/{id}/maxresdefault.jpg` with `hqdefault.jpg` fallback (Pitfall 16). Process to WebP/AVIF/JPEG with content-hashed filenames under `static/posters/`.
- D-02: Sidecar JSON at `src/lib/data/posters.json` mapping `"{source}-{id}"` → hashed asset path. `videos.json` stays byte-identical (DATA-01). `getPosterFor(video)` helper in NEW file `src/lib/data/posters.ts` (Claude's discretion on exact filename), NOT by editing `videos.ts`/`index.ts` (Phase 2 D-22 / D-24).
- D-03: Build aborts (`pnpm build` exits non-zero) if any poster file referenced in `posters.json` is missing OR if `posters.json` is stale relative to `videos.json`. Same posture as Phase 2 `validateVideosPlugin` (DATA-02). Implementation: small Vite plugin at `buildStart` that reads both JSON files, verifies every `(source, id)` has both a sidecar entry AND a file under `static/posters/`.
- D-04: Poster fetching is an EXTENSION to `scripts/check-embeds.ts` (NOT a Vite plugin). Invoked via `pnpm check:embeds` and the nightly GH Action. Posters become COMMITTED ARTIFACTS under `static/posters/` (NOT `.gitignore`d). Refreshing a poster requires running `pnpm check:embeds` locally and committing the diff. Build does not fetch the network.

**REEL-04 unified fallback (D-05..D-08):**
- D-05: **Network/cellular branch — progressive enhancement; autoplay-by-default outside Chromium.** Safari/Firefox 2026 (where `navigator.connection?.effectiveType` returns `undefined`) treat as fast-enough and autoplay. Chromium readers get Pitfall 4 protection: poster on `effectiveType ∈ {'slow-2g', '2g', '3g'}` OR `saveData === true` OR `downlink < 1.5 Mbps`. STATE.md blocker #1 — RESOLVED.
- D-06: **EU GDPR posture — inherit `_four`'s no-CMP "interaction-as-consent" pattern.** No cookie banner. Mitigations: `youtube-nocookie.com` host for all YouTube embeds; `?dnt=1` on all Vimeo embeds; the unified 800ms postMessage timeout (D-07) means EU users whose browsers block autoplay-with-storage land on the poster path. STATE.md blocker #2 — RESOLVED.
- D-07: **LPM / autoplay-rejection / embed-disabled detection — postMessage handshake with 800ms timeout.** Listen for the provider's "play"/"ready" postMessage (origin-filtered). If no event within 800ms, unmount iframe and swap to `<PosterImage>` with visible `▷ TAP TO PLAY` CTA. Catches: iOS Low Power Mode (Pitfall 3), browser-blocked autoplay, embed-disabled-by-owner (Pitfall 6 runtime case), EU autoplay restrictions (D-06 belt). NO `@vimeo/player` SDK (raw iframe + URL params + raw postMessage).
- D-08: **Trigger-detection state lives in module-scope runes** at `src/lib/state/network.svelte.ts` (exports `effectiveType`, `saveData`, `downlink`, `isCellularLike`) and `src/lib/state/motion.svelte.ts` (exports `prefersReducedMotion`). SSR-safe defaults via `__isBrowser()` pattern from `$lib/storage.ts`. Same `.svelte.ts` extension idiom as Phase 1's `intersectionVisibility.svelte.ts`.

**Mount-vs-play (D-09..D-12):**
- D-09: **All 3 sections within the ±1 window play simultaneously** (NOT current-only-plays). Cinematic-over-thermal explicit bet. Phase 3 thermal QA (D-16) is the validation gate; escalation path is 360p ±1 quality cap → current-only-plays fallback if > 8% / 5min.
- D-10: **IntersectionObserver threshold 0.5** defines the "current" section for hash-write + landmark focus. All 3 within-window play regardless of threshold.
- D-11: **Eager mount: rootMargin '100% 0%'** (1 viewport above + 1 below). ONE observer per `<ReelStage>` (NOT per section, NOT module-scope).
- D-12: **Page Visibility API: pause all 3 playing iframes on `document.hidden`; keep them mounted.** Resume via postMessage `'play'` on `visibilitychange` → visible. Pause must dispatch within 300ms (REEL-07 SC).

**Done-criteria (D-13..D-17):**
- D-13: Full POL-04 real-device matrix DURING Phase 3 (NOT Phase 7). Matrix: iOS Safari 16, 17.0, 17.1, 17.2+, Chrome Android current, Firefox desktop current, Safari macOS current.
- D-14: **BrowserStack subscription is a Phase 3 entry dependency** (~$30-50/month metered, real-device cloud). Used for iOS Safari 16, 17.0, 17.1 (the Pitfall 1 + Pitfall 3 versions). User's physical iPhone covers current iOS + LPM + cellular. Manual session runs acceptable for v1; CI integration deferred.
- D-15: Playwright suite covers 4 pillars (scroll-snap, windowed-mount invariant, leak defense, axe a11y) on WebKit + Chromium + Firefox.
- D-16: Manual 5-min iPhone thermal QA with battery readings before/after. Escalation triggers: > 8% drop → 360p ±1 cap → current-only-plays.
- D-17: **3-plan decomposition: 03-01 foundations → 03-02 lifecycle → 03-03 fallback + QA.**

### Claude's Discretion

- Exact iframe URL builder file location (`$lib/iframe/url.ts` vs `$lib/embed/url.ts` vs split into per-source files).
- Sidecar JSON file shape: pure JSON vs typed `.ts` export. Slight preference for JSON (mirrors Phase 2 D-04 plain-text choice).
- `static/posters/` exact subpath (`static/posters/` vs `static/img/posters/`).
- IntersectionObserver `rootMargin` shorthand (`'100% 0%'` vs `'100% 0% 100% 0%'`).
- Per-section `tabindex="-1"` toggle for non-current sections within ±1 window (Pitfall 18 / Phase 4 NAV-02 territory — markup may live here, toggle logic may slide to Phase 4).
- URL hash convention `/work#video={id}` debounce timing (~300ms per Pitfall 12).
- `loading="lazy"` + `fetchpriority="low"` on `<PosterImage>` `<img>` beyond first 2 sections.
- `<PosterImage>` component contract — renders title/category overlay + PLAY CTA itself, OR siblings inside `<ReelSection>` (leaning siblings, identical overlay between poster and iframe modes).
- BrowserStack CI integration — manual is fine for v1.
- Per-section play start position — always 0:00 vs deep-link Vimeo `?t=<sec>` / YouTube `?start=<sec>` (default 0:00 for v1).
- REEL-05 visual specifics (typography rhythm, CategoryTag restyle exact tokens, PLAY-WITH-SOUND button shape) — either Claude's discretion or `/gsd:ui-phase 3`.

### Deferred Ideas (OUT OF SCOPE)

- Data-saver toggle UI (chrome button persisting via `mnp_three_data_saver`) — `network.svelte.ts` exposes `saveData` but no user-facing toggle ships in v1.
- REEL-05 visual specifics if not in Claude's discretion path.
- `<iframe tabindex="-1">` toggle for non-current sections — may slide to Phase 4 NAV-02.
- In-video deep-link timestamps (per-video Vimeo `?t=` / YouTube `?start=`).
- BrowserStack CI integration (manual sessions acceptable for v1).
- Save-Data HTTP header awareness (`adapter-static` ships no server).
- EU GeoIP detection.
- Module-scope IntersectionObserver shared across ReelStage instances — anti-pattern (SUMMARY).
- Per-section IntersectionObservers (56 of them) — anti-pattern (Pitfall 5).
- `@vimeo/player` SDK — anti-pattern (research SUMMARY locks raw iframe).
- `lite-vimeo-embed` / `lite-youtube-embed` — anti-pattern.
- In-section preview duration cap (e.g., loop only 10s).
- Reduced-data mode (`prefers-reduced-data`) — Chromium-only; v2.
- A/B traffic-split mechanism — STATE.md blocker #3, Phase 7.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REEL-01 | 56 videos as fullscreen scroll-snap sections (`100svh`, `scroll-snap-type: y proximity`) | §Architecture Patterns Pattern 1 (ReelStage CSS); §Common Pitfalls 1, 2, 7 mitigations |
| REEL-02 | Each visible section autoplays silent muted preview loop via native iframe (`?autoplay=1&mute=1&loop=1&playsinline=1`) | §Code Examples Vimeo URL builder + YouTube URL builder; §Code Examples postMessage adapters |
| REEL-03 | Viewport-windowed mounting (current + ±1); ONE IO per ReelStage | §Architecture Patterns Pattern 2 (runed array-target IO); confirmed via installed source |
| REEL-04 | Unified 5-trigger poster fallback codepath | §Architecture Patterns Pattern 3 (module-scope state runes + 800ms handshake); §Code Examples PosterImage |
| REEL-05 | Each section renders title (bottom-left) + CategoryTag (top-right) + `▷ PLAY WITH SOUND` deep-link to `/watch/[id]` | §Code Examples ReelSection overlay + sibling CategoryTag restyle (`_four/src/lib/components/CategoryTag.svelte`) |
| REEL-06 | 4-state lifecycle + 5-layer leak defense | §Architecture Patterns Pattern 4 (PreviewLoop state machine + adapter dispose contract); §Anti-Patterns 3, 4 |
| REEL-07 | Page Visibility API pauses on background, resumes on foreground | §Code Examples Page Visibility broadcast; §Common Pitfalls 5 (thermal pause-not-unmount) |

## Standard Stack

### Core (all already installed in Phase 1; no new deps for Phase 3)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `runed` | 0.37.1 | Rune-native `useIntersectionObserver` accepting `HTMLElement \| HTMLElement[]` target; auto-cleanup via $effect.root | Verified directly in `node_modules/runed/dist/utilities/use-intersection-observer/use-intersection-observer.svelte.d.ts` — `target: MaybeGetter<HTMLElement \| HTMLElement[] \| null \| undefined>`. The N-targets-one-observer pattern is built in, not a workaround. |
| `@sveltejs/enhanced-img` | 0.10.4 | Build-time poster generation: WebP + AVIF + JPEG fallback via `<enhanced:img src="..." />` in Svelte components | Already in devDependencies (Phase 1). NOTE: this is a Vite plugin only — no programmatic Node API. The poster-fetch script uses raw `sharp` (peer dep auto-installed by enhanced-img) OR raw fetch + writeFile. See §Pattern 5. |
| `@playwright/test` | 1.60.0 | E2E real-browser tests on WebKit + Chromium + Firefox; first-class iOS Safari simulation | Already installed. WebKit project is closest to real iOS Safari but NOT identical — real-device matrix (D-13) covers the gap via BrowserStack. |
| `@axe-core/playwright` | 4.11.3 | axe-core a11y scan integrated into Playwright suite | Already installed. Pin is 4.11.3 (npm has no 4.11.4 for the playwright package — STATE.md note from Phase 1). |
| (no new deps) | — | — | All Phase 3 logic is built on stack locked in Phase 1. |

### Supporting (zero-dep — native browser APIs)

| API | Purpose | When to Use |
|-----|---------|-------------|
| `window.postMessage` / `MessageEvent` | Vimeo + YouTube iframe protocol | All preview-loop communication (no SDK) |
| `IntersectionObserver` | Viewport-windowed mount detection | Via runed wrapper |
| `document.visibilitychange` event + `document.hidden` | Page Visibility API (REEL-07) | One subscription in ReelStage, broadcast via context |
| `matchMedia('(prefers-reduced-motion: reduce)')` | Tier-2 reduced-motion detection (Pitfall 9) | In `motion.svelte.ts` rune init |
| `navigator.connection?.effectiveType` / `.saveData` / `.downlink` | Chromium-only network detection (Pitfall 4 + D-05) | In `network.svelte.ts` rune init with `__isBrowser()` guard |
| `AbortController` + `setTimeout` | 800ms postMessage handshake timeout (D-07) | Inside PreviewLoop $effect |
| CSS `aspect-ratio: 16 / 9` + absolute positioning | Zero-CLS iframe container (POL-03 SC #2) | ReelSection inner wrapper |
| CSS `scroll-snap-type: y proximity` + `100svh` + `overscroll-behavior-y: contain` + `touch-action: pan-y` | Scroll-snap CSS (REEL-01) | ReelStage container |

### Alternatives Considered (all rejected by CONTEXT)

| Instead of | Could Use | Why Rejected |
|------------|-----------|--------------|
| Raw iframe + raw postMessage | `@vimeo/player` SDK 2.30.4 | ~30KB; postMessage listener overhead × 3 simultaneous mounts; Svelte 5 `$effect` cleanup ordering bug #12731. CONTEXT explicitly locks raw. |
| Raw YouTube iframe + raw postMessage | `lite-youtube-embed` 0.3.4 | Optimized for click-to-play (not viewport-driven); wrapping in IO is more code than rendering ourselves. |
| Pure CSS scroll-snap + `100svh` + `proximity` | `embla-carousel-svelte` (vertical mode) / `swiper` / `fullpage.js` | Embla is horizontal-focused (reserved for Phase 5 WATCH-02 rail); Swiper ~150KB; fullpage.js GPLv3 + re-implements scroll-snap badly. |
| runed array-target IO | DIY observer + manual cleanup | Acceptable trade — but runed's `useIntersectionObserver` API explicitly handles arrays + auto $effect cleanup. Reuse what's already installed. |

**Verified dep versions (installed Phase 1, all current 2026):**
- `runed` 0.37.1 (published 2025-12-20)
- `@sveltejs/enhanced-img` 0.10.4 (published 2026-03-12)
- `@playwright/test` 1.60.0
- `@axe-core/playwright` 4.11.3 (Phase 1 STATE: 4.11.4 doesn't exist on npm)

No new dependencies to install for Phase 3. `pnpm i` is unchanged.

## Architecture Patterns

### Recommended File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ReelStage.svelte         # scroll-snap container; ONE IO per mount; context provider
│   │   ├── ReelSection.svelte       # <article aria-label="Video N of M: [title]"> wrapper; renders PreviewLoop OR PosterImage
│   │   ├── PreviewLoop.svelte       # 4-state machine + 5-layer leak defense; consumes URL builder + adapter
│   │   └── PosterImage.svelte       # static fallback consuming posters.json sidecar
│   ├── iframe/
│   │   ├── url.ts                   # iframe URL builder for Vimeo + YouTube (pure function, testable in node)
│   │   ├── vimeoAdapter.ts          # postMessage adapter — attach(iframe, handlers): dispose
│   │   └── youtubeAdapter.ts        # postMessage adapter — attach(iframe, handlers): dispose
│   ├── state/
│   │   ├── network.svelte.ts        # module-scope rune: effectiveType, saveData, downlink, isCellularLike
│   │   └── motion.svelte.ts         # module-scope rune: prefersReducedMotion
│   └── data/
│       ├── posters.ts               # getPosterFor(video) reading posters.json sidecar
│       └── posters.json             # build-emitted sidecar: { "vimeo-264677021": "/posters/<hash>.webp", ... }
├── routes/
│   └── work/
│       ├── +page.ts                 # load() returns { videos: <Video>[] }
│       └── +page.svelte             # mounts <ReelStage videos={data.videos} />
static/
└── posters/                         # committed (NOT gitignored) build artifacts
    ├── vimeo-264677021-<contentHash>.webp
    ├── vimeo-264677021-<contentHash>.avif
    └── ...
scripts/
└── check-embeds.ts                  # EXTENDED: now also fetches thumbnail_url, writes posters + sidecar
tests/
└── e2e/
    └── reel.spec.ts                 # Playwright 4-pillar suite
```

### Pattern 1: ReelStage scroll-snap CSS (REEL-01, POL-03)

**What:** ReelStage container locks the scroll-snap contract on day one. `100svh` for stable section height (Pitfall 2), `proximity` for fast-flick (Pitfall 7), `overscroll-behavior-y: contain` for pull-to-refresh suppression, `touch-action: pan-y` for vertical-pan-only.

**When:** Always, the moment the route is mounted. `<ReelStage>` is the only place these properties live.

**Example:**
```svelte
<!-- src/lib/components/ReelStage.svelte (skeleton — Plan 03-01) -->
<script lang="ts">
  import { setContext, onMount } from 'svelte';
  import { useIntersectionObserver } from 'runed';
  import type { Video } from '$lib/data';

  let { videos }: { videos: readonly Video[] } = $props();

  // Each section element registered by index (REEL-03: ONE observer for all N sections)
  let sectionRefs = $state<(HTMLElement | null)[]>(Array(videos.length).fill(null));

  // mountedIds = ids the section components should render iframes for (current + ±1).
  // Set per IO callback; ReelSection reads via context.
  let mountedIds = $state(new Set<string>());
  let activeIdx = $state(-1);

  setContext('reel:stage', {
    get mountedIds() { return mountedIds; },
    get activeIdx() { return activeIdx; },
    videoCount: videos.length,
  });

  // runed accepts HTMLElement[] — verified in runed@0.37.1 source.
  // Single observer, N targets, threshold 0.5, rootMargin '100% 0%' (D-11).
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

      // Threshold 0.5 (D-10): only count as "current" if ≥ 50% visible.
      if (bestRatio >= 0.5) activeIdx = bestIdx;

      // Always update mountedIds based on the highest-ratio entry, regardless
      // of the 0.5 gate — eager-mount per D-11.
      const next = new Set<string>();
      for (let i = Math.max(0, bestIdx - 1); i <= Math.min(videos.length - 1, bestIdx + 1); i++) {
        const v = videos[i];
        if (v) next.add(v.id);
      }
      mountedIds = next;
    },
    { threshold: [0, 0.5, 1], rootMargin: '100% 0%' }
  );

  // Page Visibility API (REEL-07 / D-12) — ReelStage subscribes once, broadcasts via context flag.
  let documentHidden = $state(false);
  setContext('reel:visibility', { get documentHidden() { return documentHidden; } });

  onMount(() => {
    const onVis = () => { documentHidden = document.hidden; };
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
      <!-- <ReelSection {video} {i} /> renders here in Plan 03-01 -->
    </article>
  {/each}
</div>
```

**Notes:**
- Tailwind v4 utility for `100svh` is `h-svh` (Phase 1 already imports Tailwind v4).
- `snap-proximity` is the v4 utility for `scroll-snap-type: y proximity`. `snap-mandatory` is EXPLICITLY banned (Pitfall 7 / D-locked).
- `overscroll-y-contain` + `touch-pan-y` together address Pitfall 1 (iOS scroll-snap freeze) AND Pitfall 7 (mandatory trap) AND pull-to-refresh UX (Pitfall §UX).
- The `<article aria-label>` MUST be `<article>`, NOT `<section>` (Pitfall 8 — screen reader landmark spam).

### Pattern 2: ONE IntersectionObserver over N targets via runed (REEL-03)

**What:** `runed@0.37.1`'s `useIntersectionObserver` natively accepts `MaybeGetter<HTMLElement | HTMLElement[] | null | undefined>` as the target. ONE call → ONE observer instance → N elements observed → all entries delivered to ONE callback. Cleanup via `$effect.root` is automatic (see source `use-intersection-observer.svelte.js:21-49`).

**When:** Inside `<ReelStage>` (component-local). NEVER in module scope (would bleed across `/work`, `/work/[cat]`, `/pbs-american-portrait`). NEVER per-section (56 observers melts iOS — Pitfall 5).

**How runed handles cleanup (verified from installed source):**
```ts
// node_modules/runed/dist/utilities/use-intersection-observer/use-intersection-observer.svelte.js
// (excerpt)
const stop = $effect.root(() => {
  $effect(() => {
    if (!targets.size || !isActive || !window) return;
    // ... wrappedCallback ...
    observer = new window.IntersectionObserver(wrappedCallback, { rootMargin, root: get(root), threshold });
    for (const el of targets) observer.observe(el);
    return () => { observer?.disconnect(); };
  });
});
```

So Layer 3 of the 5-layer leak defense (observer `disconnect()` in `$effect` cleanup) is built into runed. ReelStage doesn't need an explicit `onMount(() => () => io.disconnect())`. **This sidesteps Svelte issue #12731** because runed wraps `$effect.root` itself — no `bind:this` + observer-lib combination.

**Phase 1's `intersectionVisibility.svelte.ts` is single-target.** Phase 3 does NOT extend it — ReelStage inlines its own `useIntersectionObserver` call with the array-target signature. The Phase 1 wrapper was a Plan 01-03 smoke test that may stay or be removed (CONTEXT carry-forward: "Claude's call").

### Pattern 3: Module-scope state runes with SSR-safe defaults (D-08)

**What:** Two `.svelte.ts` files in `src/lib/state/` expose getters; init helpers populate `$state` runes on the client side via `$effect.root` + `addEventListener` listeners. SSR-safe via `typeof window === 'undefined'` guards — at prerender time the runes return optimistic defaults (no cellular, no reduced motion), so the prerendered HTML is the cinematic-autoplay variant. Runtime hydration flips values if user posture differs.

**When:** Any cross-component environmental signal. Filter state still belongs in URL (Pattern 2 from ARCHITECTURE.md — locked). Component-local `$state` for things scoped to one component (e.g., `mountedIds`).

**Example — `src/lib/state/motion.svelte.ts`:**
```ts
/**
 * Module-scope rune for prefers-reduced-motion.
 *
 * SSR-safe defaults: during prerender (typeof window === 'undefined'),
 * returns prefersReducedMotion = false (the cinematic-autoplay default).
 * Runtime hydration flips it if the user's matchMedia query matches.
 *
 * Same .svelte.ts extension + $effect.root pattern as Phase 1's
 * intersectionVisibility.svelte.ts (Svelte 5.55+ rune-scoping rule).
 */
import { __isBrowser } from '$lib/storage';

let _prefersReducedMotion = $state(false);

export const motion = {
  get prefersReducedMotion() { return _prefersReducedMotion; },
};

// Idempotent init — called once from root +layout.svelte onMount.
let initialized = false;
export function initMotionState(): void {
  if (!__isBrowser() || initialized) return;
  initialized = true;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  _prefersReducedMotion = mq.matches;
  const onChange = (e: MediaQueryListEvent) => { _prefersReducedMotion = e.matches; };
  // Modern listener; Safari 14+ supports addEventListener on MediaQueryList.
  mq.addEventListener('change', onChange);
  // No teardown — module-scope listeners live for the app lifetime by design.
}
```

**Example — `src/lib/state/network.svelte.ts`:**
```ts
/**
 * Module-scope rune for Network Information API + saveData.
 *
 * D-05 (PROGRESSIVE ENHANCEMENT): outside Chromium where navigator.connection
 * is undefined, isCellularLike returns false (autoplay-by-default). The
 * "default to fast" choice is deliberate — Safari/Firefox users are the
 * majority of mobile filmmaker-portfolio audience; defaulting to poster
 * would defeat the cinema-mode design.
 */
import { __isBrowser } from '$lib/storage';

type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

interface NavigatorConnection {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  addEventListener?: (type: 'change', listener: () => void) => void;
}

let _effectiveType = $state<EffectiveType>('unknown');
let _saveData = $state(false);
let _downlink = $state<number | null>(null);

export const network = {
  get effectiveType() { return _effectiveType; },
  get saveData() { return _saveData; },
  get downlink() { return _downlink; },
  get isCellularLike(): boolean {
    // Triggers poster mode for cellular OR Save-Data OR throttled wifi
    // (downlink < 1.5 Mbps catches the Pitfall 4 hotel-wifi case).
    if (_saveData) return true;
    if (_effectiveType === 'slow-2g' || _effectiveType === '2g' || _effectiveType === '3g') return true;
    if (_downlink !== null && _downlink < 1.5) return true;
    return false;
  },
};

let initialized = false;
export function initNetworkState(): void {
  if (!__isBrowser() || initialized) return;
  initialized = true;
  const conn = (navigator as Navigator & { connection?: NavigatorConnection }).connection;
  if (!conn) return; // Safari / Firefox 2026: undefined → defaults stay (D-05).
  const apply = () => {
    const et = conn.effectiveType;
    _effectiveType =
      et === 'slow-2g' || et === '2g' || et === '3g' || et === '4g' ? et : 'unknown';
    _saveData = conn.saveData ?? false;
    _downlink = typeof conn.downlink === 'number' ? conn.downlink : null;
  };
  apply();
  conn.addEventListener?.('change', apply);
}
```

**SSR contract:** Both files MUST be safe to import during prerender. `__isBrowser()` (from `$lib/storage.ts`) is the canonical guard. Init helpers are called from `+layout.svelte`'s `onMount` (Plan 03-01 task).

**Pitfall to avoid:** Don't use `$effect.root` here for the matchMedia/connection-change listener — module-scope listeners are intentionally global, not effect-scoped. If you wrap in `$effect.root`, you have to remember to `stop()` it on app teardown, which doesn't happen on a SPA. The simple idempotent `initialized` guard is correct.

### Pattern 4: 4-state iframe lifecycle + 5-layer leak defense (REEL-06)

**State machine:**
```
unmounted ──[id enters mountedIds set via IO callback]──→ mounted-loading
                                                                │
                                              [postMessage 'ready'/'play' within 800ms]
                                                                ↓
                                                          mounted-playing
                                                                │
                                              [id leaves mountedIds OR 800ms timeout fires]
                                                                ↓
                                                            unmounting
                                                                │
                                              [adapter.dispose() runs → listeners off]
                                                                ↓
                                                            unmounted
```

**Svelte 5 $effect semantics — how cleanup runs:**

```svelte
<!-- src/lib/components/PreviewLoop.svelte (skeleton — Plan 03-02) -->
<script lang="ts">
  import { onDestroy, getContext } from 'svelte';
  import type { Video } from '$lib/data';
  import { buildEmbedUrl } from '$lib/iframe/url';
  import { attachVimeo } from '$lib/iframe/vimeoAdapter';
  import { attachYouTube } from '$lib/iframe/youtubeAdapter';

  let { video }: { video: Video } = $props();

  type LifecycleState = 'unmounted' | 'mounted-loading' | 'mounted-playing' | 'unmounting';
  let state = $state<LifecycleState>('mounted-loading');
  let iframeEl = $state<HTMLIFrameElement | null>(null);
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  // Page Visibility broadcast from ReelStage (D-12)
  const visibility = getContext<{ documentHidden: boolean }>('reel:visibility');

  // $effect cleanup runs SYNCHRONOUSLY before the iframe DOM element is removed
  // by Svelte's reconciler. Critical: adapter.dispose() removes postMessage
  // listeners FIRST, then Svelte's {#if} unmounts the iframe element. The order
  // is the load-bearing piece of Layer 2.
  $effect(() => {
    if (!iframeEl) return;
    const adapter = video.source === 'vimeo' ? attachVimeo : attachYouTube;
    const dispose = adapter(iframeEl, {
      onReady: () => {
        // Some providers (YouTube) fire 'onReady' before autoplay actually starts.
        // We're more interested in onPlay below.
      },
      onPlay: () => {
        clearTimeout(timeoutHandle);
        state = 'mounted-playing';
      },
      onError: () => {
        clearTimeout(timeoutHandle);
        // Layer 5: bubble up to ReelSection so it can swap to PosterImage
        // with the same "fall back" CTA as the 800ms timeout path. D-07
        // unification: SAME PosterImage codepath whether timeout OR onError.
        state = 'unmounting';
        // (ReelSection observes `state` via $derived and conditionally re-renders.)
      },
    });

    // 800ms handshake timeout (D-07) — the load-bearing detection mechanism.
    timeoutHandle = setTimeout(() => {
      if (state === 'mounted-loading') {
        state = 'unmounting'; // ReelSection swaps to PosterImage
      }
    }, 800);

    return () => {
      // Layer 2: adapter.dispose() removes named postMessage listeners (NOT inline
      // closures — see Anti-Pattern 4) AND posts a defensive {method:'unload'}
      // (Vimeo) / removeEventListener (YouTube) to the iframe before DOM removal.
      clearTimeout(timeoutHandle);
      dispose();
    };
  });

  // Page Visibility broadcast (D-12 / REEL-07): when document.hidden flips,
  // synchronously postMessage 'pause' to the iframe. Must dispatch within 300ms.
  $effect(() => {
    if (!iframeEl || state !== 'mounted-playing') return;
    if (visibility.documentHidden) {
      iframeEl.contentWindow?.postMessage(
        video.source === 'vimeo'
          ? JSON.stringify({ method: 'pause' })
          : JSON.stringify({ event: 'command', func: 'pauseVideo' }),
        video.source === 'vimeo' ? 'https://player.vimeo.com' : 'https://www.youtube-nocookie.com'
      );
    } else {
      // Resume on foreground (D-12)
      iframeEl.contentWindow?.postMessage(
        video.source === 'vimeo'
          ? JSON.stringify({ method: 'play' })
          : JSON.stringify({ event: 'command', func: 'playVideo' }),
        video.source === 'vimeo' ? 'https://player.vimeo.com' : 'https://www.youtube-nocookie.com'
      );
    }
  });

  // Layer 1: Svelte teardown removes the <iframe> element from the DOM, browser
  // tears down the contentWindow + video decoder + network connection. Automatic.
  // No manual code needed — this is what {#if} blocks do natively.

  // onDestroy is belt-and-braces for the timeout (the $effect cleanup above handles
  // it; this catches a race where state transitions during teardown).
  onDestroy(() => clearTimeout(timeoutHandle));
</script>

{#if state === 'mounted-loading' || state === 'mounted-playing'}
  <!-- D-12 Vimeo URL: ?autoplay=1&muted=1&loop=1&background=1&dnt=1&quality=540p&playsinline=1 -->
  <!-- D-12 YouTube URL: youtube-nocookie.com/embed/{id}?autoplay=1&mute=1&loop=1&playsinline=1&modestbranding=1&playlist={id}&vq=medium&iv_load_policy=3&enablejsapi=1 -->
  <iframe
    bind:this={iframeEl}
    src={buildEmbedUrl(video, 'preview')}
    title={`Preview of ${video.title} by ${video.uploader}`}
    allow="autoplay; fullscreen; picture-in-picture"
    referrerpolicy="strict-origin-when-cross-origin"
    loading="lazy"
    class="absolute inset-0 h-full w-full"
    aria-hidden="true"
  ></iframe>
{/if}
<!--
  state === 'unmounting' OR 'unmounted' → ReelSection renders <PosterImage> instead
  (handled at the ReelSection level via $derived; PreviewLoop never renders posters)
-->
```

**The 5-layer leak defense (all five must be wired — verification covered in §Validation Architecture):**

| Layer | Defense | Wired by |
|-------|---------|----------|
| L1 | Svelte `{#if}` block teardown removes `<iframe>` from DOM → browser disposes contentWindow + decoder + stream | Automatic — Svelte reconciler |
| L2 | `adapter.dispose()` in `$effect` cleanup removes named postMessage listeners + sends defensive `{method:'unload'}` (Vimeo) / `removeEventListener` (YouTube) BEFORE Svelte unmounts iframe | `vimeoAdapter.ts` / `youtubeAdapter.ts` return dispose closures |
| L3 | `IntersectionObserver.disconnect()` in `$effect` cleanup at ReelStage scope | Runed wraps in `$effect.root` — automatic |
| L4 | Named function references (NOT inline closures) in adapters — every `window.addEventListener('message', onMsg)` paired with `window.removeEventListener('message', onMsg)` by reference | Adapter authoring discipline |
| L5 | `MessageEvent.origin` allowlist in every postMessage handler — drop messages from any origin not in `{'https://player.vimeo.com', 'https://www.youtube-nocookie.com'}` | Adapter authoring discipline |

**postMessage adapter contract (both adapters expose the same shape):**

```ts
// src/lib/iframe/vimeoAdapter.ts (skeleton)
type Handlers = {
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (err: unknown) => void;
};

export function attachVimeo(iframe: HTMLIFrameElement, handlers: Handlers): () => void {
  const ALLOWED_ORIGIN = 'https://player.vimeo.com';

  // Named ref (Layer 4) — NOT an inline closure.
  const onMsg = (e: MessageEvent) => {
    // Layer 5 — origin allowlist
    if (e.origin !== ALLOWED_ORIGIN) return;
    if (e.source !== iframe.contentWindow) return;
    let data: unknown;
    try {
      data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch { return; }
    if (typeof data !== 'object' || data === null) return;
    const event = (data as { event?: string }).event;
    if (event === 'ready') handlers.onReady?.();
    else if (event === 'play') handlers.onPlay?.();
    else if (event === 'pause') handlers.onPause?.();
    else if (event === 'error') handlers.onError?.(data);
  };

  window.addEventListener('message', onMsg);

  // After iframe loads, subscribe to play/ready/error events per Vimeo postMessage protocol.
  const onLoad = () => {
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: 'addEventListener', value: 'play' }),
      ALLOWED_ORIGIN
    );
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: 'addEventListener', value: 'error' }),
      ALLOWED_ORIGIN
    );
  };
  iframe.addEventListener('load', onLoad);

  // Layer 2 dispose
  return () => {
    iframe.removeEventListener('load', onLoad);
    window.removeEventListener('message', onMsg);
    // Defensive: tell Vimeo to stop firing events at us before DOM removal.
    try {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ method: 'removeEventListener', value: 'play' }),
        ALLOWED_ORIGIN
      );
    } catch { /* iframe may already be detached */ }
  };
}
```

```ts
// src/lib/iframe/youtubeAdapter.ts (skeleton)
// YouTube's postMessage protocol: parent posts {event: 'listening', id: '...'}
// after iframe load (and the iframe URL has &enablejsapi=1). Iframe responds
// with {event: 'onReady'}, {event: 'onStateChange', info: <number>}, etc.
// Source: medium.com/@mihauco/youtube-iframe-api-without-youtube-iframe-api +
// stackoverflow + youtube IFrame API reference.

type Handlers = {
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (err: unknown) => void;
};

const YT_STATE_PLAYING = 1;
const YT_STATE_PAUSED = 2;

export function attachYouTube(iframe: HTMLIFrameElement, handlers: Handlers): () => void {
  const ALLOWED_ORIGIN = 'https://www.youtube-nocookie.com';

  const onMsg = (e: MessageEvent) => {
    if (e.origin !== ALLOWED_ORIGIN) return;
    if (e.source !== iframe.contentWindow) return;
    let data: unknown;
    try {
      data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch { return; }
    if (typeof data !== 'object' || data === null) return;
    const event = (data as { event?: string }).event;
    const info = (data as { info?: number | { errorCode?: number } }).info;
    if (event === 'onReady') handlers.onReady?.();
    else if (event === 'onStateChange') {
      if (info === YT_STATE_PLAYING) handlers.onPlay?.();
      else if (info === YT_STATE_PAUSED) handlers.onPause?.();
    } else if (event === 'onError') handlers.onError?.(info);
  };

  window.addEventListener('message', onMsg);

  const onLoad = () => {
    // Subscribe to events. YouTube posts onReady automatically once api is enabled.
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening', id: iframe.id || 'reel-yt' }),
      ALLOWED_ORIGIN
    );
  };
  iframe.addEventListener('load', onLoad);

  return () => {
    iframe.removeEventListener('load', onLoad);
    window.removeEventListener('message', onMsg);
    // YouTube doesn't have a clean "unsubscribe all" — relies on iframe DOM removal (L1).
  };
}
```

### Pattern 5: Build-time poster pipeline as `scripts/check-embeds.ts` extension

**What:** The Phase 2 `scripts/check-embeds.ts` already hits the Vimeo oEmbed endpoint per video — the response shape carries `thumbnail_url`. We extend the same flow: on success, ALSO download the thumbnail asset, hash it, write to `static/posters/<source>-<id>-<hash>.{webp,avif,jpg}`, and update the sidecar `src/lib/data/posters.json`. YouTube doesn't return `thumbnail_url` in oEmbed in a usable form — fetch `https://i.ytimg.com/vi/{id}/maxresdefault.jpg` directly, fall back to `hqdefault.jpg` on 404 (Pitfall 16 mitigation).

**Critical finding:** `@sveltejs/enhanced-img` is a **Vite plugin only — no programmatic Node API** (verified via package.json exports: `"types": "./types/index.d.ts"`, `"import": "./src/index.js"` — both are the Vite preprocessor). The poster script CANNOT call enhanced-img programmatically. Two paths:

1. **Recommended:** The script downloads the raw JPEG only (1 file per video). The `<PosterImage>` component uses `<enhanced:img src={posterPath}>` at component-author time, and enhanced-img's Vite plugin handles WebP/AVIF generation at build. The script writes a SINGLE source asset per video; enhanced-img derives the variants. Tradeoff: enhanced-img needs the SOURCE asset to exist at build time, which is exactly the D-04 committed-artifact pattern.

2. **Alternative:** The script imports `sharp` directly (peer dep of enhanced-img, already in `node_modules`) and writes WebP + AVIF + JPEG itself. More code in the script; enhanced-img stays uninvolved. Skip this — path 1 is the clean reuse.

**Concurrency:** Reuse Phase 2's per-host queue (D-15, limit 6) for the new thumbnail fetches. Vimeo thumbnails come from `i.vimeocdn.com`; YouTube from `i.ytimg.com`. Two NEW host buckets distinct from the oEmbed buckets (4 buckets total) — keeps the rate-limit budget clean.

**Concrete script changes (Plan 03-03 task):**

```ts
// scripts/check-embeds.ts — additions (NOT a rewrite)

// After the existing oEmbed probe succeeds, fetch and save the thumbnail:
async function fetchAndSavePoster(video: VideoRecord, oembedResponse: unknown): Promise<{ filename: string; hash: string } | null> {
  // For Vimeo: thumbnail_url is in the oembed response body (need to actually
  // .json() the existing fetch — current script only reads status; extend it).
  // For YouTube: ignore oembed body; fetch maxresdefault → hqdefault fallback.
  // Hash the bytes; rename to <source>-<id>-<hash8>.jpg.
  // ...
}

// Per-video poster lane (new):
const vimeoPosterLane = makeHostQueue(PER_HOST_CONCURRENCY);
const youtubePosterLane = makeHostQueue(PER_HOST_CONCURRENCY);

// After all probes return ok and posters fetched, write sidecar:
async function writePostersSidecar(posters: Record<string, string>): Promise<void> {
  const sidecarPath = resolve(REPO_ROOT, 'src/lib/data/posters.json');
  await writeFile(sidecarPath, JSON.stringify(posters, null, 2) + '\n', 'utf-8');
}

// Wire into main(): only run poster work if all oembed probes pass; on partial
// failure, leave existing posters in place + skip the sidecar write (drift-CI catches).
```

**Sidecar shape (`src/lib/data/posters.json`):**
```json
{
  "vimeo-264677021": "/posters/vimeo-264677021-a3f9c2b1.jpg",
  "youtube-9Zmw69UZSsI": "/posters/youtube-9Zmw69UZSsI-d8e1f4a2.jpg"
}
```

Pure JSON (Claude's discretion in CONTEXT, slight preference for JSON-over-TS to mirror Phase 2 D-04 plain-text). `getPosterFor(video)` (in `src/lib/data/posters.ts`) reads the sidecar via static import — SSR-safe by construction.

**Build-time sanity Vite plugin (D-03):**
```ts
// vite.config.ts addition (Plan 03-03 task)
function validatePostersPlugin(): Plugin {
  return {
    name: 'validate-posters',
    buildStart() {
      const videosPath = resolve(__dirname, 'src/lib/data/videos.json');
      const postersPath = resolve(__dirname, 'src/lib/data/posters.json');
      let videos: { source: string; id: string }[];
      let posters: Record<string, string>;
      try {
        videos = JSON.parse(readFileSync(videosPath, 'utf-8')) as never;
        posters = JSON.parse(readFileSync(postersPath, 'utf-8')) as never;
      } catch (e) {
        this.error(`posters.json or videos.json missing/invalid: ${(e as Error).message}`);
        return;
      }
      const missing: string[] = [];
      for (const v of videos) {
        const key = `${v.source}-${v.id}`;
        const path = posters[key];
        if (!path) {
          missing.push(`${key} (no sidecar entry)`);
          continue;
        }
        const filePath = resolve(__dirname, 'static', path.replace(/^\//, ''));
        try { readFileSync(filePath); }
        catch { missing.push(`${key} (file missing: ${path})`); }
      }
      if (missing.length > 0) {
        this.error(
          `Poster sanity check failed (${missing.length} missing):\n` +
            missing.map((m) => `  ${m}`).join('\n') +
            `\n\nFix: run \`pnpm check:embeds\` to refresh posters + sidecar, then commit.`
        );
      }
    },
  };
}
// Slot order: tailwindcss → validateVideos → validatePosters → sveltekit
```

### Pattern 6: `<article aria-label>` landmark (NAV-03 forward-ship)

**What:** Each section is `<article aria-label="Video N of M: [title]">`, NOT `<section>`. Wrapping `<section aria-label="Filmography reel">` at the ReelStage container level provides the single landmark; individual articles are content (not landmarks) and don't pollute the rotor (Pitfall 8).

**Screen reader behavior (verified via 2024-2026 a11y references):**
- VoiceOver (iOS + macOS): rotor's "Landmarks" category shows ONE `<section>` (the reel container). Articles are reachable via rotor's "Articles" category — separate list, not noisy.
- NVDA (Windows): "elements list" defaults to headings + links; articles are findable but don't crowd the landmark count.
- JAWS: similar to NVDA.

**`tabindex` posture (Pitfall 18):**
- Current section's `<article>` gets `tabindex="0"` so keyboard users can land on it via skip-link.
- Non-current sections get `tabindex="-1"` so Tab doesn't cycle through 56 of them.
- Inside each iframe: `aria-hidden="true"` (so screen readers skip the iframe's internal player controls) + the iframe ITSELF gets `tabindex="-1"` when not the current section (Pitfall 18 fix).
- The "current" section is whichever the IO callback marks as `activeIdx` (D-10, threshold 0.5).

**Decision:** CONTEXT lists this in Claude's Discretion ("whether per-section `<iframe>` gets `tabindex='-1'` when in ±1 but not current — Phase 4 NAV-02 territory; section markup may live in Phase 3 anyway — Claude's call during 03-02 plan"). **Recommendation:** ship the toggle logic in Phase 3 inside ReelStage's IO callback — the IO already knows `activeIdx`, so toggling `tabindex` is a 2-line addition. Defer ONLY the global "Skip past reel" link to Phase 4 NAV-03.

### Anti-Patterns to Avoid (already locked by CONTEXT)

- **Mounting all 56 iframes** ("preloading"): bandwidth blowout + thermal melt. ARCHITECTURE Anti-Pattern 1 — locked. Viewport-windowed ±1 only.
- **Module-scope `IntersectionObserver`**: cross-route bleed; WebKit detached-element leak family (bug 227194). Locked.
- **Per-section `IntersectionObserver`** (56 of them): callback storm + can't compute `activeIdx` from a single fire. Locked.
- **Inline-closure postMessage listeners**: `removeEventListener` requires the SAME function reference. Named refs only.
- **`@vimeo/player` SDK**: ~30KB; postMessage listener overhead × 3; dodges Svelte #12731.
- **`lite-vimeo-embed` / `lite-youtube-embed`**: stale / not viewport-driven.
- **`100vh` / `100dvh` for snap sections**: CLS + iOS overflow. Locked `100svh` only.
- **`scroll-snap-type: y mandatory`**: trap users (Pitfall 7 / Mozilla bug 1959811). Locked `proximity` only.
- **`scroll-snap-stop: always`**: forces snap; fast-flick dead. Default (`normal`) only.
- **`navigator.connection` everywhere**: Chromium-only. Use `network.svelte.ts` with isCellularLike returning false on undefined (D-05 progressive enhancement).
- **`autoplay=1` without `muted=1`**: browser blocks. Always pair.
- **YouTube `loop=1` alone**: doesn't loop. Always pair with `playlist={id}`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-target IntersectionObserver wrapper | Custom DIY observer + manual cleanup | `runed` `useIntersectionObserver(() => HTMLElement[])` | Runed already accepts arrays (verified `0.37.1` source) + auto $effect.root cleanup; sidesteps Svelte #12731 |
| Image format generation (WebP/AVIF/JPEG) | Roll your own sharp pipeline | `@sveltejs/enhanced-img` Vite plugin (already installed) | Build-time variants; `<enhanced:img>` syntax; first-party SvelteKit team |
| Vimeo/YouTube player wrapper | Re-implement player.js | Raw iframe + raw postMessage adapters | CONTEXT locks raw approach; ~30KB savings; postMessage protocol is stable + documented |
| Scroll-snap behavior | JS scroll library (Swiper, Embla, fullpage.js) | CSS `scroll-snap-type: y proximity` + `100svh` | Native is Baseline; libs fight iOS chrome animation |
| Bandwidth/connection detection | Custom heuristics | `navigator.connection` (Chromium) + sensible defaults elsewhere (D-05) | The browser already tells you — when it can. Don't infer from RTT. |
| Page Visibility detection | Custom `window.blur` listeners | `document.visibilitychange` event + `document.hidden` | Cross-browser stable; W3C Level 2 spec |
| Reduced-motion detection | UA sniffing | `matchMedia('(prefers-reduced-motion: reduce)')` | OS-level user preference; updates reactively via `addEventListener('change')` |
| oEmbed thumbnail fetching | New build script from scratch | EXTEND `scripts/check-embeds.ts` (Phase 2 D-04) | Same oEmbed call already happens; piggyback the thumbnail save |

**Key insight:** Phase 1 + Phase 2 + Phase 3 all install ZERO new deps. Every load-bearing surface is either (a) already in `node_modules` from Phase 1, (b) a native browser API, or (c) an extension to an existing Phase 2 script. The discipline pays off — Phase 3's risk surface stays in the code we write, not the supply chain.

## Common Pitfalls

### Pitfall 1: 800ms timeout too aggressive on slow networks (D-07 calibration)

**What goes wrong:** On a 3G connection where iframe network bootstrap takes 1200ms, the 800ms timeout fires BEFORE the embed has a chance to send `play`/`onStateChange`. Every section flips to PosterImage even though the embed was fine.

**Why it happens:** 800ms is a UX budget chosen for fast networks (the cinematic illusion breaks if PosterImage→iframe swap is visible). It's NOT a network-latency budget. CONTEXT D-07 locks 800ms but Phase 3 BrowserStack matrix (D-13) must verify this on iOS Safari 16/17.x throttled to 3G.

**How to avoid:**
- Document 800ms as the locked starting value; surface in Plan 03-02 as a constant `HANDSHAKE_TIMEOUT_MS = 800` (NOT a magic number).
- If BrowserStack matrix QA shows premature fallback on 3G (failure mode: poster mode triggered on a network that COULD have played), escalation is "bump to 1200ms" — not "abandon the mechanism."
- Combine with `network.svelte.ts` `isCellularLike` for the pre-mount cellular bypass: on Chromium 3G, we never mount the iframe in the first place (D-05), so the 800ms timing only matters on Safari/Firefox cellular OR Chromium on fast wifi that happens to stall.

**Warning signs:** Producer feedback "the videos never seem to load on my phone"; BrowserStack iOS 17.0 on 3G shows posters everywhere.

### Pitfall 2: Vimeo `background=1` overrides `&controls=0` but NOT `&quality=`

**What goes wrong:** D-12 specifies `?autoplay=1&muted=1&loop=1&background=1&dnt=1&quality=540p&playsinline=1`. The Vimeo docs say `background=1` "implies muted+loop+autoplay+no-controls" — but does it ignore explicit `quality=540p`?

**Verified (Vimeo Help Center):** `background=1` does NOT override `quality=`. The quality cap layers cleanly. So the CONTEXT D-12 URL is correct as-locked.

**How to avoid:**
- Snapshot-test the URL builder output for all 56 videos (data project, runs in node). Catches a future "I refactored the builder and dropped quality=540p" regression.
- Document the URL contract in a comment at the top of `src/lib/iframe/url.ts`.

### Pitfall 3: YouTube `loop=1` without `playlist={id}` is silently broken

**What goes wrong:** YouTube's iframe API has a documented quirk: `loop=1` ALONE doesn't loop a single video. You need `loop=1&playlist={id}` (with the SAME id). Otherwise the video plays once and stops. CONTEXT D-12 includes the workaround; the URL builder MUST emit it.

**How to avoid:**
- URL builder unit test: for YouTube videos, assert the output contains `&playlist=<id>` matching the video's id.
- Watch for the `lite-youtube-embed` antipattern: don't import a wrapper that "handles" loop — write the param ourselves.

### Pitfall 4: postMessage `e.source !== iframe.contentWindow` check fails after iframe re-mount

**What goes wrong:** PreviewLoop's iframe is in `mountedIds`, then leaves, then comes back. New `<iframe>` element → new `contentWindow`. The `onMsg` handler closed over the OLD contentWindow reference — every message gets dropped because `e.source !== iframe.contentWindow`.

**How to avoid:**
- Adapter's `onMsg` is created fresh inside `attachVimeo(iframe, ...)` — the closure captures the CURRENT iframe.contentWindow at attach time. As long as `attachVimeo` is called from inside the PreviewLoop `$effect` (which fires per-mount), this is correct.
- DO NOT cache the adapter across iframe lifetimes. Every iframe gets its own `attachVimeo(iframe, handlers)` → `dispose` pair.

### Pitfall 5: Page Visibility pause race — pause fired before postMessage handshake completes

**What goes wrong:** User backgrounds the tab while iframe is in `mounted-loading` state (handshake not done). PreviewLoop's visibility $effect tries to `postMessage('pause')`, but the iframe hasn't acknowledged `'ready'` yet — Vimeo silently drops the pause.

**How to avoid:**
- Visibility $effect gates on `state === 'mounted-playing'` (see Pattern 4 code). If state is still loading, the iframe will pause naturally once it's playing (next visibility-change fire), OR the user foregrounds before play starts (no pause needed).
- Document this in a code comment so future refactors don't "simplify" by dropping the state gate.

### Pitfall 6: iOS Safari 16 IO firing during snap animation flickers `activeIdx`

**What goes wrong:** iOS 16's scroll-snap animation passes through 2 sections briefly; IO callback fires twice with different bestIdx values. `activeIdx` flickers, `mountedIds` churns, iframes flash in/out.

**How to avoid:**
- Threshold 0.5 already filters out "barely visible" cases (D-10). Combined with `proximity` (not `mandatory`), the dwell time at any non-resting position is short — the churn risk is small.
- If real-device QA (D-13, BrowserStack iOS 16) shows visible flicker, the fix is a 100-150ms debounce on the `mountedIds` write (NOT on the IO callback itself — that breaks the eager-mount). Not pre-emptive; gate on QA.

### Pitfall 7: Forgetting `referrerpolicy` leaks the filter URL to Vimeo/YouTube

**What goes wrong:** Without `referrerpolicy` on the iframe, Vimeo sees the full Referer: `/work/u2-sphere-trailer#video=...`. Privacy leak (Pitfall 17 from research).

**How to avoid:**
- Every iframe gets `referrerpolicy="strict-origin-when-cross-origin"`. Locked in the iframe template (Pattern 4 code).
- Optionally: `<meta name="referrer" content="strict-origin-when-cross-origin">` in `app.html` as a belt.

### Pitfall 8: Build-time poster sanity plugin fires AFTER Vite asset graph is computed

**What goes wrong:** If `validatePostersPlugin` runs in `buildStart` but enhanced-img's preprocessor has already locked the asset graph, a missing poster manifests as a confusing "asset not found" Svelte build error instead of the clean "poster missing" message.

**How to avoid:**
- Plugin order in `vite.config.ts`: `tailwindcss() → validateVideos() → validatePosters() → sveltekit()` (Plan 03-03 task documents this).
- Vite plugins with `buildStart` hooks run before any compilation — the order in the array is the firing order. validatePosters must precede sveltekit() (which loads enhanced-img).

### Pitfall 9: `enhanced:img` requires SOURCE asset at component-author time, not at build-call time

**What goes wrong:** D-04 says posters are COMMITTED ARTIFACTS. If a developer runs `pnpm build` immediately after `pnpm check:embeds` wrote NEW posters but BEFORE committing, the build works — but in CI (where the worktree is clean), the same build fails because the build artifact is referenced by `posters.json` but the asset isn't checked in.

**How to avoid:**
- The poster sanity Vite plugin (D-03) explicitly catches "sidecar entry exists but file is missing" — this case fires loud with the D-12-style error annotation.
- CI grep gate (a future addition; Phase 1 D-17 template) could verify "every `posters.json` value points to a path inside the repo's HEAD tree." Defer until producer demonstrates the workflow.

## Code Examples

### Vimeo iframe URL builder (verified params, all current 2026)

```ts
// src/lib/iframe/url.ts
import type { Video } from '$lib/data';

const HANDSHAKE_TIMEOUT_MS = 800 as const; // D-07
const VIMEO_QUALITY_PREVIEW = '540p' as const; // Pitfall 4 quality cap
const YOUTUBE_QUALITY_HINT = 'medium' as const; // YouTube vq hint

/**
 * Build the iframe src URL for a video in preview or play mode.
 *
 * Preview mode (D-12, REEL-02):
 *   Vimeo:   ?autoplay=1&muted=1&loop=1&background=1&dnt=1&quality=540p&playsinline=1
 *   YouTube: ?autoplay=1&mute=1&loop=1&playsinline=1&modestbranding=1&playlist={id}&vq=medium&iv_load_policy=3&enablejsapi=1
 *
 * Play mode (Phase 5 WATCH-01, not used in Phase 3 but defined for parity):
 *   Vimeo:   ?autoplay=1&dnt=1
 *   YouTube: ?autoplay=1&modestbranding=1&iv_load_policy=3&enablejsapi=1
 *
 * Sources:
 *   - https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters
 *   - https://help.vimeo.com/hc/en-us/articles/12426285089681-About-embedding-background-and-Chromeless-videos
 *   - https://developers.google.com/youtube/iframe_api_reference
 *   - https://developers.google.com/youtube/player_parameters
 */
export type EmbedMode = 'preview' | 'play';

export function buildEmbedUrl(video: Video, mode: EmbedMode): string {
  if (video.source === 'vimeo') {
    const base = `https://player.vimeo.com/video/${video.id}`;
    const params = new URLSearchParams();
    params.set('autoplay', '1');
    params.set('dnt', '1'); // D-06: Vimeo Do-Not-Track for EU posture
    if (mode === 'preview') {
      params.set('muted', '1');
      params.set('loop', '1');
      params.set('background', '1'); // implies muted+loop+autoplay+no-chrome (Vimeo docs verified)
      params.set('quality', VIMEO_QUALITY_PREVIEW); // Pitfall 4 cap
      params.set('playsinline', '1'); // Pitfall 1 iOS 16/17.0/17.1
    }
    return `${base}?${params.toString()}`;
  }
  // YouTube — D-06: nocookie host always
  const base = `https://www.youtube-nocookie.com/embed/${video.id}`;
  const params = new URLSearchParams();
  params.set('autoplay', '1');
  params.set('modestbranding', '1');
  params.set('iv_load_policy', '3'); // hide video annotations
  params.set('enablejsapi', '1'); // required for postMessage protocol (verified)
  if (mode === 'preview') {
    params.set('mute', '1');
    params.set('loop', '1');
    params.set('playlist', video.id); // Pitfall 3: loop=1 ALONE does not loop YouTube
    params.set('playsinline', '1');
    params.set('vq', YOUTUBE_QUALITY_HINT); // hint only, not enforced
    params.set('controls', '0');
  }
  return `${base}?${params.toString()}`;
}
```

### ReelSection composition (Plan 03-01 / 03-02 task)

```svelte
<!-- src/lib/components/ReelSection.svelte (skeleton) -->
<script lang="ts">
  import { getContext } from 'svelte';
  import type { Video } from '$lib/data';
  import { network } from '$lib/state/network.svelte';
  import { motion } from '$lib/state/motion.svelte';
  import PreviewLoop from './PreviewLoop.svelte';
  import PosterImage from './PosterImage.svelte';
  import CategoryTag from './CategoryTag.svelte'; // restyled from _four
  import { base } from '$app/paths';

  let { video, index, total }: { video: Video; index: number; total: number } = $props();

  const stage = getContext<{ mountedIds: Set<string>; activeIdx: number }>('reel:stage');

  // D-08: pre-mount triggers — cellular-on-Chromium OR reduced-motion = NEVER mount iframe.
  // The 800ms timeout (D-07) catches the other 3 fallback triggers via PreviewLoop state.
  const allowIframe = $derived(!network.isCellularLike && !motion.prefersReducedMotion);
  const shouldMount = $derived(allowIframe && stage.mountedIds.has(video.id));
  const isCurrent = $derived(stage.activeIdx === index);
</script>

<!-- Aspect-ratio container (POL-03 / Pattern 1): iframe and poster inherit IDENTICAL dimensions
     via absolute positioning, so the poster→iframe swap is zero-CLS. CSS aspect-ratio is
     Baseline Wide since Sep 2021. -->
<div class="relative h-full w-full bg-neutral-950">
  <div class="absolute inset-0 flex items-center justify-center">
    <div class="aspect-video w-full">
      {#if shouldMount}
        <PreviewLoop {video} />
      {:else}
        <PosterImage {video} showPlayCta={!allowIframe || !stage.mountedIds.has(video.id)} />
      {/if}
    </div>
  </div>

  <!-- REEL-05 overlay — two-stop gradient (Pitfall 20), title bottom-left, CategoryTag top-right,
       PLAY WITH SOUND CTA. Position: absolute so it overlays both iframe and poster. -->
  <div
    class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60"
    aria-hidden="true"
  ></div>

  <div class="pointer-events-none absolute top-6 right-6 z-10">
    <span class="pointer-events-auto">
      <CategoryTag category={video.category} />
    </span>
  </div>

  <div class="pointer-events-none absolute bottom-8 left-6 z-10 max-w-xl">
    <h2 class="pointer-events-auto font-display text-3xl font-semibold text-neutral-50 drop-shadow-lg md:text-5xl">
      {video.title}
    </h2>
    <a
      href={`${base}/watch/${video.id}`}
      class="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-50/10 px-5 py-2 font-sans text-sm font-medium text-neutral-50 backdrop-blur-sm hover:bg-neutral-50/20 motion-safe:transition-colors"
      tabindex={isCurrent ? 0 : -1}
    >
      <span aria-hidden="true">▷</span> PLAY WITH SOUND
    </a>
  </div>
</div>
```

### PosterImage (consumes `posters.json` via `getPosterFor`)

```svelte
<!-- src/lib/components/PosterImage.svelte (skeleton) -->
<script lang="ts">
  import type { Video } from '$lib/data';
  import { getPosterFor } from '$lib/data/posters';
  import { base } from '$app/paths';

  let { video, showPlayCta = false }: { video: Video; showPlayCta?: boolean } = $props();

  const posterPath = getPosterFor(video); // returns the /posters/<source>-<id>-<hash>.jpg path
</script>

<!-- enhanced-img preprocessor expands this to <picture><source srcset=avif><source srcset=webp><img></picture>
     with build-time variants. Static src strings work too (the preprocessor turns them into <enhanced:img> when
     the file is in the src tree); for static/ paths use a plain <img>. -->
<img
  src={`${base}${posterPath}`}
  alt={`Poster for ${video.title}`}
  class="h-full w-full object-cover"
  loading="lazy"
  fetchpriority="low"
  decoding="async"
/>
{#if showPlayCta}
  <!-- D-07: when fallback fires (timeout OR cellular OR reduced-motion),
       surface the explicit TAP TO PLAY affordance. -->
  <button
    type="button"
    class="absolute inset-0 flex items-center justify-center bg-black/30 font-sans text-lg font-medium text-neutral-50"
    aria-label={`Play ${video.title} with sound`}
  >
    <span aria-hidden="true">▷</span> TAP TO PLAY
  </button>
{/if}
```

### Playwright 4-pillar suite (Plan 03-03)

```ts
// tests/e2e/reel.spec.ts (skeleton)
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Pillar 1: scroll-snap fast-flick (REEL-01, Pitfalls 1 + 7)
test('reel allows fast-flick scroll past sections without trapping', async ({ page }) => {
  await page.goto('/work');
  await page.waitForSelector('article[aria-label*="Video 1 of"]');

  // Simulate a flick: scroll the container by 30 viewport heights in one impulse.
  // Playwright's page.mouse.wheel does NOT respect scroll-snap mid-gesture
  // (that's the bug we're testing for). Real flick is simulated via direct scrollTop.
  const container = page.locator('[role="region"][aria-label="Filmography reel"]');
  await container.evaluate((el) => {
    el.scrollTop = el.scrollHeight; // jump to bottom — proximity should NOT block
  });
  await page.waitForTimeout(500); // settle

  // Assert: last section visible OR very close to it (proximity, not mandatory)
  const lastSection = page.locator(`article[aria-label*="of 56"]`).last();
  await expect(lastSection).toBeInViewport({ ratio: 0.5 });
});

// Pillar 2: windowed-mount invariant (REEL-03)
test('only ±1 iframes mount during full reel scroll', async ({ page }) => {
  await page.goto('/work');
  await page.waitForSelector('article[aria-label*="Video 1 of"]');

  // Scroll one section at a time, asserting iframe count stays ≤ 3.
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => {
      const container = document.querySelector('[role="region"]') as HTMLElement;
      container.scrollBy({ top: window.innerHeight, behavior: 'instant' });
    });
    await page.waitForTimeout(300); // let IO callback settle
    const iframeCount = await page.locator('iframe').count();
    expect(iframeCount).toBeLessThanOrEqual(3);
  }
});

// Pillar 3: leak defense (REEL-06)
test('no detached iframe nodes after full scroll + return', async ({ page, browserName }) => {
  // Only run heap inspection on Chromium (CDP-based)
  if (browserName !== 'chromium') test.skip();

  await page.goto('/work');
  await page.waitForSelector('article[aria-label*="Video 1 of"]');

  // Scroll through all 56, then back to top
  await page.evaluate(async () => {
    const container = document.querySelector('[role="region"]') as HTMLElement;
    for (let i = 0; i < 56; i++) {
      container.scrollBy({ top: window.innerHeight, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 100));
    }
    container.scrollTop = 0;
    await new Promise((r) => setTimeout(r, 500));
  });

  // Count detached iframes via heap inspection (Chromium only)
  const client = await page.context().newCDPSession(page);
  const { result } = await client.send('Runtime.evaluate', {
    expression: `
      (() => {
        const all = document.querySelectorAll('iframe');
        // Detached = iframes whose contentWindow exists but parentNode is null
        let detached = 0;
        // (Real detection uses heap snapshot — this is an approximation;
        // full impl in Plan 03-03 uses HeapProfiler.takeHeapSnapshot)
        return { live: all.length, detached };
      })()
    `,
    returnByValue: true,
  });
  const { live } = (result.value ?? { live: 0 }) as { live: number };
  expect(live).toBeLessThanOrEqual(3); // max ±1 window after return-to-top
});

// Pillar 4: axe a11y (REEL-04 + NAV-03 forward-ship)
test('/work passes axe-core WCAG AA scan', async ({ page }) => {
  await page.goto('/work');
  await page.waitForSelector('article[aria-label*="Video 1 of"]');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

// Per-trigger reduced-motion test (Pillar 4 sub-case)
test('reduced-motion shows posters with TAP TO PLAY on every section', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/work');
  await page.waitForSelector('article[aria-label*="Video 1 of"]');
  // No iframes should mount
  await expect(page.locator('iframe')).toHaveCount(0);
  // Every section has the TAP TO PLAY CTA
  const ctas = page.locator('button[aria-label*="Play"][aria-label*="with sound"]');
  // (At minimum, the first 2-3 are in the windowed-mount candidates;
  // full assertion requires checking that even posters DO carry the CTA visibility flag)
});
```

**Notes on Playwright + iOS Safari 16:**
- Playwright's WebKit project ≠ real iOS Safari 16 (BrowserStack docs confirm: "Playwright's WebKit build differs from real mobile Safari"). The Playwright suite catches the cross-browser regressions; BrowserStack catches the iOS-specific ones.
- For BrowserStack: manual session runs are acceptable for v1 (D-14). The 4-pillar suite gets RECORDED video on each BrowserStack iOS 16 / 17.0 / 17.1 device; the recordings live in `.planning/phases/03-reel-system-core-load-bearing-risk/03-VERIFICATION.md` as committed artifacts (per the project's existing planning-doc posture).

## Runtime State Inventory

This is NOT a rename/refactor/migration phase — Phase 3 builds NEW components, NEW files, NEW routes. No stored data, live service config, OS-registered state, secrets/env, or build artifacts referencing renamed strings. The Runtime State Inventory section is intentionally omitted.

*(Verified: no rename, no migration, no string-replacement scope in CONTEXT.md decisions.)*

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@vimeo/player` SDK for iframe lifecycle | Raw iframe + raw postMessage adapters | research SUMMARY (2026-05) lock | ~30KB savings; dodges Svelte #12731 |
| `scroll-snap-type: y mandatory` | `scroll-snap-type: y proximity` | Pitfall 7 / Mozilla bug 1959811 (active 2025) | Users can fast-flick past sections |
| `100vh` / `100dvh` for snap | `100svh` for snap | WebKit bug 261185; svh Baseline 2025-06 | Stable scroll-snap on iOS Safari address-bar collapse |
| `youtube.com/embed/{id}` | `youtube-nocookie.com/embed/{id}` | EU GDPR / Pitfall 13, 17 (2024+) | Suppresses Google's in-iframe cookie banner; reduces tracking surface |
| `enablejsapi=1` REQUIRED for YouTube postMessage in 2026 | Same as 2018 — protocol stable | (no change) | YouTube postMessage requires `enablejsapi=1`; without it, iframe ignores `{event:'listening'}` |
| `svelte-intersection-observer` (component-based API) | `runed` `useIntersectionObserver` (rune-native, supports arrays) | runed 0.37.1 (Dec 2025) | Cleaner Svelte 5 ergonomics + N-targets-one-observer |
| Vimeo `&quality=auto` | Vimeo `&quality=540p` for previews | Pitfall 4 bandwidth ethics (project-specific) | Bounded data cost per preview iframe |

**Deprecated / outdated (do NOT use):**
- `iframe_api.js` script-loading pattern for YouTube — for our muted-preview use case, raw postMessage is cleaner and saves the script load.
- `lite-vimeo-embed` 0.3.0 (last published 2023-11; stale).
- `vumbnail.com` for Vimeo posters (Pitfall 16; self-host via oEmbed instead).
- Vimeo `?api=1` (older parameter; the modern postMessage protocol works without it).

## Open Questions

1. **800ms timeout calibration on real 3G hardware (Pitfall 1).**
   - What we know: 800ms is the locked starting value (D-07).
   - What's unclear: whether 800ms is too aggressive on iOS Safari throttled to 3G.
   - Recommendation: Plan 03-03 BrowserStack matrix run on iOS 17.0 + 3G network profile is the validation gate. If real-device QA shows premature fallback, escalation is bump to 1200ms (NOT abandon the mechanism).

2. **YouTube postMessage `listening` handshake frequency.**
   - What we know: YouTube's official iframe_api.js re-posts `{event:'listening'}` every 250ms (per the search result).
   - What's unclear: whether one-shot is enough or whether we need a heartbeat.
   - Recommendation: Plan 03-02 ships one-shot (on `iframe.load`); if BrowserStack iOS 16 shows missed `onReady` events, add a 250ms heartbeat for the first 2s of lifecycle.

3. **`runed` `useIntersectionObserver` interaction with derived array target.**
   - What we know: runed's target accepts `MaybeGetter<HTMLElement | HTMLElement[]>`. `$derived` getter into `sectionRefs.filter(...)` should work.
   - What's unclear: whether the observer correctly diffs target additions/removals when the array contents change (e.g., late-bound `bind:this` populates entries).
   - Recommendation: Plan 03-01 test should specifically assert "observer count == sectionRefs count" after all sections mount. If runed doesn't re-observe new targets on array change, fall back to a manual `IntersectionObserver` inside `onMount`.

4. **Vimeo postMessage `error` event payload shape (Pitfall 6 / D-07).**
   - What we know: Vimeo's iframe posts an `error` event when the embed is disabled; the payload contains a `name` or `message` field.
   - What's unclear: exact field names — docs are thin on undocumented internal protocol.
   - Recommendation: Plan 03-02 ships a permissive handler (`onError: (err) => { state = 'unmounting'; }` — doesn't read err contents). If a future telemetry pass wants to classify error types, parse then. For now, fail-fast is enough.

5. **REEL-05 visual specifics (typography, button shape).**
   - What we know: CONTEXT lists this as Claude's Discretion OR `/gsd:ui-phase 3`.
   - What's unclear: whether the planner takes Claude's discretion or routes to UI-SPEC.
   - Recommendation: planner's call. Claude's discretion is fine if the prescription is clear (display serif title + CategoryTag restyle reusing categoryAccent from `_four` + pill button consuming Phase 1 focus tokens). Route to ui-phase if the planner wants formal tokens + pixel grid.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `vitest@4.1.5` (data + ui projects) + `@playwright/test@1.60.0` (e2e) + `@axe-core/playwright@4.11.3` (a11y) |
| Config file | `vite.config.ts` (Vitest two-project split: `data` = node, `ui` = jsdom) + `playwright.config.ts` (locked Phase 1) |
| Quick run command | `pnpm test` (Vitest only, fast) |
| Full suite command | `pnpm test && pnpm test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REEL-01 | 100svh scroll-snap-y-proximity container with 56 articles | unit (data) | `pnpm test src/lib/components/ReelStage.test.ts` | ❌ Plan 03-01 task |
| REEL-01 | Fast-flick scroll-snap behavior (Pillar 1) | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "fast-flick"` | ❌ Plan 03-03 task |
| REEL-02 | URL builder emits Vimeo `?background=1&dnt=1&quality=540p&playsinline=1` family | unit (data) | `pnpm test src/lib/iframe/url.test.ts` | ❌ Plan 03-02 task |
| REEL-02 | URL builder emits YouTube `youtube-nocookie.com/embed/{id}?autoplay=1&mute=1&loop=1&playlist={id}&playsinline=1&modestbranding=1&vq=medium&iv_load_policy=3&enablejsapi=1` | unit (data) | `pnpm test src/lib/iframe/url.test.ts` | ❌ Plan 03-02 task |
| REEL-03 | Windowed-mount invariant (Pillar 2): iframe count ≤ 3 during full scroll | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "windowed-mount"` | ❌ Plan 03-03 task |
| REEL-03 | runed array-target IO observes all N sections (ONE observer) | unit (ui) | `pnpm test src/lib/components/ReelStage.test.ts -t "single observer"` | ❌ Plan 03-01 task |
| REEL-04 | Module-scope `network.svelte.ts` returns `isCellularLike = false` outside Chromium (Safari default) | unit (data) | `pnpm test src/lib/state/network.test.ts` | ❌ Plan 03-01 task |
| REEL-04 | Module-scope `motion.svelte.ts` reacts to matchMedia change | unit (ui) | `pnpm test src/lib/state/motion.test.ts` | ❌ Plan 03-01 task |
| REEL-04 | Reduced-motion = posters everywhere with TAP TO PLAY CTA | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "reduced-motion"` | ❌ Plan 03-03 task |
| REEL-04 | 800ms timeout → swap to PosterImage (simulated via origin mock) | unit (ui) | `pnpm test src/lib/components/PreviewLoop.test.ts -t "800ms"` | ❌ Plan 03-02 task |
| REEL-05 | ReelSection renders title + CategoryTag + PLAY WITH SOUND deep-link to `/watch/[id]` | unit (ui) | `pnpm test src/lib/components/ReelSection.test.ts` | ❌ Plan 03-01 task |
| REEL-06 | Leak defense (Pillar 3): no detached iframes after full scroll + return | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "leak"` | ❌ Plan 03-03 task |
| REEL-06 | adapter.dispose() runs BEFORE iframe DOM removal | unit (ui) | `pnpm test src/lib/components/PreviewLoop.test.ts -t "dispose order"` | ❌ Plan 03-02 task |
| REEL-06 | postMessage origin filter rejects non-allowlist origins | unit (data) | `pnpm test src/lib/iframe/vimeoAdapter.test.ts -t "origin"` | ❌ Plan 03-02 task |
| REEL-07 | Page Visibility pause dispatches within 300ms | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "page-visibility"` | ❌ Plan 03-03 task |
| (NAV-03 forward-ship) | axe-core WCAG AA scan on /work (Pillar 4) | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "axe"` | ❌ Plan 03-03 task |
| (Phase 3 manual) | iPhone 5-min thermal QA (D-16) | manual | (BrowserStack manual session + physical iPhone) | ❌ Plan 03-03 task; result committed to 03-VERIFICATION.md |

### Sampling Rate

- **Per task commit:** `pnpm test` (Vitest unit + component; fast — < 30s for the whole suite).
- **Per wave merge:** `pnpm test && pnpm test:e2e` (Vitest + Playwright local on WebKit + Chromium + Firefox).
- **Phase gate (before `/gsd:verify-work`):** Full local suite green + BrowserStack matrix evidence committed + thermal QA screenshot committed.

### Wave 0 Gaps

Files that DO NOT exist yet but Phase 3 requires:

- [ ] `src/lib/components/ReelStage.svelte` — covers REEL-01, REEL-03
- [ ] `src/lib/components/ReelStage.test.ts` — covers REEL-01 + REEL-03 unit assertions
- [ ] `src/lib/components/ReelSection.svelte` — covers REEL-05
- [ ] `src/lib/components/ReelSection.test.ts` — covers REEL-05 unit assertions
- [ ] `src/lib/components/PreviewLoop.svelte` — covers REEL-02, REEL-06, REEL-07
- [ ] `src/lib/components/PreviewLoop.test.ts` — covers REEL-02 + REEL-06 + REEL-07 unit assertions
- [ ] `src/lib/components/PosterImage.svelte` — covers REEL-04
- [ ] `src/lib/components/PosterImage.test.ts` — covers REEL-04 unit assertions
- [ ] `src/lib/iframe/url.ts` — covers REEL-02 (pure function, testable in node)
- [ ] `src/lib/iframe/url.test.ts` — URL snapshot tests for all 56 videos
- [ ] `src/lib/iframe/vimeoAdapter.ts` — covers REEL-06 (postMessage adapter)
- [ ] `src/lib/iframe/vimeoAdapter.test.ts` — covers REEL-06 + Pitfall 4 origin filter
- [ ] `src/lib/iframe/youtubeAdapter.ts` — covers REEL-06 (postMessage adapter)
- [ ] `src/lib/iframe/youtubeAdapter.test.ts` — covers REEL-06 + listening handshake
- [ ] `src/lib/state/network.svelte.ts` — covers REEL-04 (Chromium-only)
- [ ] `src/lib/state/network.test.ts` — covers REEL-04 + D-05 progressive enhancement
- [ ] `src/lib/state/motion.svelte.ts` — covers REEL-04 (reduced-motion)
- [ ] `src/lib/state/motion.test.ts` — covers REEL-04 + matchMedia change reactivity
- [ ] `src/lib/data/posters.ts` — `getPosterFor(video)` helper consuming sidecar
- [ ] `src/lib/data/posters.test.ts` — covers sidecar shape contract
- [ ] `src/lib/data/posters.json` — build-emitted sidecar (D-02 sidecar)
- [ ] `src/routes/work/+page.ts` + `+page.svelte` — Phase 3 wires `/work` (Phase 4 narrows to filter routes)
- [ ] `tests/e2e/reel.spec.ts` — Playwright 4-pillar suite (Pillars 1-4)
- [ ] `static/posters/*.{webp,avif,jpg}` — committed poster artifacts (D-04, populated by extended `scripts/check-embeds.ts`)

Framework install: NONE — all deps in `node_modules` from Phase 1.

### Dimension 1: Functional (behavioral correctness)
- ReelStage IO callback selects correct `activeIdx` (highest intersectionRatio) → REEL-03, success criterion #1
- mountedIds correctly reflects current ± 1 (boundary cases: 0, N-1) → REEL-03, success criterion #2
- ReelSection conditionally renders PreviewLoop vs PosterImage based on mountedIds context → REEL-03, REEL-04
- URL builder snapshot test against all 56 videos → REEL-02, success criterion #6
- Page Visibility pause/resume postMessage dispatch order → REEL-07, success criterion #5
- TAP TO PLAY CTA deep-links to `/watch/[id]` with correct video id → REEL-05, success criterion #6

### Dimension 2: Integration (component boundaries / data flow)
- ReelStage `setContext('reel:stage')` → ReelSection `getContext` consumes mountedIds/activeIdx → REEL-03
- ReelStage `setContext('reel:visibility')` → PreviewLoop consumes documentHidden → REEL-07
- PreviewLoop $effect → adapter `attach()` → adapter `dispose()` in cleanup → REEL-06
- network.svelte.ts + motion.svelte.ts → ReelSection $derived gates iframe mount → REEL-04
- posters.json sidecar → getPosterFor → PosterImage src → REEL-04 (poster path correctness)

### Dimension 3: Performance / Resource (memory, thermal, bandwidth)
- Playwright Pillar 2: iframe count ≤ 3 during full reel scroll → REEL-03, success criterion #2
- Playwright Pillar 3: leak defense — no detached iframe nodes after scroll + return → REEL-06, success criterion #4
- Manual thermal QA: < 8% battery drop in 5 min on physical iPhone (D-16) → SC #4, D-16 escalation path
- BrowserStack iOS 16 / 17.0 / 17.1 real-device run: 540p quality cap honored (verify via network panel in BrowserStack session) → Pitfall 4
- CLS measurement: Chrome DevTools "Layout Instability" panel shows 0 layout shifts on poster→iframe swap (aspect-ratio container) → POL-03, success criterion #2

### Dimension 4: Accessibility
- Playwright Pillar 4: `@axe-core/playwright` WCAG AA scan on /work → NAV-03 forward-ship, success criterion #6
- `<article aria-label="Video N of M: [title]">` markup verified (component test) → NAV-03 forward-ship
- `tabindex="-1"` on non-current iframes; `tabindex="0"` on current → Pitfall 18
- Manual screen-reader pass (VoiceOver on iOS) → Pitfall 8
- Focus visibility on PLAY WITH SOUND button consumes Phase 1 D-05/D-06/D-07 tokens (no per-component opt-in) → Pitfall 10

### Dimension 5: Compatibility (browser / device / OS)
- Playwright local on WebKit + Chromium + Firefox (D-15 pillar coverage) → D-13 partial
- BrowserStack manual session: iOS Safari 16, 17.0, 17.1, 17.2+ → D-13, D-14 (the load-bearing real-device gates)
- BrowserStack: Chrome Android current → D-13
- BrowserStack: Firefox desktop current, Safari macOS current → D-13
- Manual iPhone thermal QA on physical device (current iOS + LPM toggle + cellular emulation) → D-16

### Dimension 6: Security / Privacy (CSP, postMessage origins, embed allowlist)
- postMessage origin allowlist hardcoded to `https://player.vimeo.com` + `https://www.youtube-nocookie.com` (Layer 5) → REEL-06
- Adapter unit test: spoofed origin (`https://evil.com`) is rejected → REEL-06, Pitfall §Security
- iframe `referrerpolicy="strict-origin-when-cross-origin"` on every embed → Pitfall §Security
- Vimeo `&dnt=1` present on every Vimeo URL → D-06, Pitfall 17
- YouTube host is `youtube-nocookie.com` (verified in URL builder) → D-06, Pitfall 13
- DevTools storage panel: no `yt-remote-device-id` / Vimeo trackers BEFORE user interaction (manual EU VPN test, BrowserStack-supported) → Pitfall 13

### Dimension 7: Failure Modes (the 5 fallback triggers)
- `prefers-reduced-motion: reduce` → posters everywhere with TAP TO PLAY (Playwright `emulateMedia({reducedMotion: 'reduce'})`) → REEL-04 trigger 1
- Cellular on Chromium (`effectiveType ∈ {'slow-2g','2g','3g'}` OR `saveData=true`) → posters; verified via mocking `navigator.connection` in jsdom + manual real-device test → REEL-04 trigger 2
- iOS Low Power Mode (manual: enable LPM on physical iPhone, reload /work) → 800ms timeout fires → PosterImage with TAP TO PLAY → REEL-04 trigger 3
- Embed-disabled-by-owner (manually edit a record's `id` to a known non-embeddable video; observe 800ms timeout fires) → REEL-04 trigger 4
- EU default-to-poster (manual: BrowserStack EU IP; verify no autoplay until tap) → REEL-04 trigger 5, D-06

### Dimension 8: Verification (Nyquist gate — how each REQ-ID is proven satisfied)
- **REEL-01** ⇒ Playwright Pillar 1 (`tests/e2e/reel.spec.ts -g "fast-flick"`) + manual BrowserStack iOS 16/17.0/17.1 scroll session recorded
- **REEL-02** ⇒ URL builder snapshot test (`src/lib/iframe/url.test.ts`) covering all 56 videos + manual postMessage handshake verification via BrowserStack DevTools (network panel shows Vimeo + YouTube embed URLs with locked params)
- **REEL-03** ⇒ Playwright Pillar 2 (`tests/e2e/reel.spec.ts -g "windowed-mount"`) + ReelStage unit test asserting ONE observer instance + mountedIds size ≤ 3
- **REEL-04** ⇒ Playwright reduced-motion case + jsdom Chromium-cellular mock case + manual LPM iPhone case + manual embed-disabled case + manual EU VPN case — ALL converge on SAME `<PosterImage showPlayCta=true />` codepath
- **REEL-05** ⇒ ReelSection component test asserting title text + CategoryTag presence + PLAY WITH SOUND `<a href={`${base}/watch/${video.id}`}>` with focus token
- **REEL-06** ⇒ Playwright Pillar 3 (`tests/e2e/reel.spec.ts -g "leak"`) + adapter unit tests for origin allowlist + dispose-order + named-ref + iframe `aria-hidden="true"` markup test
- **REEL-07** ⇒ Playwright Page Visibility test (`tests/e2e/reel.spec.ts -g "page-visibility"`) asserting `document.dispatchEvent(new Event('visibilitychange'))` triggers `postMessage('pause')` within 300ms; manual tab-switch validation on physical iPhone

## Sources

### Primary (HIGH confidence)
- `runed@0.37.1` source: `node_modules/runed/dist/utilities/use-intersection-observer/use-intersection-observer.svelte.d.ts` + `.svelte.js` — confirms `target: HTMLElement | HTMLElement[]`, $effect.root cleanup, automatic observer disconnect
- `@sveltejs/enhanced-img@0.10.4` `package.json` exports — confirms Vite-plugin-only (no programmatic API)
- [Vimeo Help: About Player Parameters](https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters) — `background=1`, `dnt=1`, `quality=540p`, `playsinline=1` parameter contract
- [Vimeo Help: About embedding background and Chromeless videos](https://help.vimeo.com/hc/en-us/articles/12426285089681-About-embedding-background-and-Chromeless-videos) — `background=1` implies muted+loop+autoplay+no-controls
- [Vimeo Help: Troubleshooting autoplay restrictions](https://help.vimeo.com/hc/en-us/articles/29677068222737-Troubleshooting-Autoplay-restrictions) — autoplay+muted required pairing
- [YouTube IFrame Player API Reference](https://developers.google.com/youtube/iframe_api_reference) — `enablejsapi=1`, postMessage events `onReady`/`onStateChange`/`onError`
- [YouTube Embedded Player Parameters](https://developers.google.com/youtube/player_parameters) — `playlist={id}` loop requirement, `modestbranding=1`, `iv_load_policy=3`, `vq=medium`
- [W3C: CSS Scroll Snap Module Level 1](https://www.w3.org/TR/css-scroll-snap-1/) — `proximity` vs `mandatory` semantics
- [Mozilla Bug 1959811](https://bugzilla.mozilla.org/show_bug.cgi?id=1959811) — `scroll-snap-stop: always` traps users; informs `normal` default
- [WebKit Bug 261185](https://bugs.webkit.org/show_bug.cgi?id=261185) — `svh`/`dvh` Safari behavior; informs `100svh` choice
- [WebKit Bug 227194](https://bugs.webkit.org/show_bug.cgi?id=227194) — ResizeObserver/IntersectionObserver detached-element leak family; informs Anti-Pattern 3 + Layer 4 leak defense
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — `visibilitychange` event + `document.hidden` cross-browser stable
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — `matchMedia` + `addEventListener('change')`
- [MDN: NetworkInformation.effectiveType](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType) — Chromium-only; Safari/Firefox `undefined`
- [caniuse.com/netinfo](https://caniuse.com/netinfo) — Network Information API: Firefox/Safari NOT SUPPORTED
- [Svelte Issue #12731](https://github.com/sveltejs/svelte/issues/12731) — `$effect` cleanup ordering with `bind:this` + observers (informs runed choice + named-listener-ref discipline)
- [BrowserStack: Playwright iOS Automation](https://www.browserstack.com/guide/playwright-ios-automation) + [Playwright Mobile Testing 2026](https://www.browserstack.com/guide/playwright-mobile-automation) — real-device matrix for D-13, D-14
- [BrowserStack: Playwright real iOS Safari announcement](https://www.devopsdigest.com/browserstack-enables-playwright-testing-on-real-ios-devices-with-safari) — confirms WebKit-build ≠ real-iOS-Safari; manual session run is the right v1 posture (D-14)

### Secondary (MEDIUM confidence — WebSearch verified with official source)
- [Medium: YouTube iframe API without iframe_api.js (Michal Koczkodon)](https://medium.com/@mihauco/youtube-iframe-api-without-youtube-iframe-api-f0ac5fcf7c74) — raw postMessage `{event:'listening'}` handshake pattern; cross-verified with official YouTube IFrame API ref
- [PoseLab: Vimeo JavaScript Player API](https://poselab.com/en/blog/vimeo-javascript-player-api/) — `ready` state required before sending methods (Vimeo gotcha); cross-verified with vimeo/player.js
- [web.dev: aspect-ratio for CLS](https://web.dev/articles/aspect-ratio) — Baseline Wide since Sep 2021; informs ReelSection container pattern
- [BrowserStack: Memory leak detection in Playwright](https://www.browserless.io/blog/memory-leak-how-to-find-fix-prevent-them) — detached-DOM-node detection patterns; informs Pillar 3 test design

### Tertiary (LOW confidence — single source, flagged for validation during implementation)
- 800ms handshake timeout calibration on iOS Safari 3G — only validated by Pitfall 3 source (wojtek.im LPM article); REAL validation comes from D-13 BrowserStack matrix run
- Exact Vimeo `error` postMessage event payload shape — docs are thin; permissive handler ships, telemetry adds field parsing later if needed
- runed re-observation behavior on `$derived` array target changes — verified by reading source but no explicit test; Plan 03-01 includes an assertion test

### Sibling-project source (in-repo, authoritative)
- `../michelle_ngo_four/src/lib/components/CategoryTag.svelte` — REEL-05 restyle source (24 lines, copy-and-restyle)
- `../michelle_ngo_four/src/lib/components/categoryAccent.ts` — already mirrored into `_three` `src/app.css` `@theme` block (Phase 1 D-12); no JS import needed
- `../michelle_ngo_four/src/lib/components/TopNav.svelte:56-89` — `$effect` + IO cleanup pattern (informs Pattern 1 ReelStage)
- `../michelle_ngo_four/vite.config.ts:33-65` — `validateVideosPlugin` template for `validatePostersPlugin` (D-03)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all deps already in `node_modules` from Phase 1; versions verified by `pnpm list`
- Architecture patterns: HIGH — `runed` source read directly; iframe lifecycle pattern validated against Svelte 5 + ARCHITECTURE.md state ownership patterns
- Pitfalls: HIGH — all 14 phase-3-clustered pitfalls have CONTEXT-locked mitigations; new pitfalls (800ms calibration, iframe re-mount closure, visibility race, IO array re-observation) flagged with concrete BrowserStack validation gates
- Provider API contracts (Vimeo + YouTube postMessage + URL params): HIGH for documented params, MEDIUM for undocumented protocol details (error payload, listening heartbeat). Permissive implementation ships; telemetry tightens later if needed.
- Real-device validation strategy: HIGH on tooling (BrowserStack + Playwright + manual iPhone); MEDIUM on whether 800ms timeout is the right ballpark — covered by D-16 escalation path

**Research date:** 2026-05-25
**Valid until:** 2026-06-25 (30 days for stable browser APIs + locked provider URL contracts; re-evaluate if Vimeo/YouTube ship breaking iframe param changes in the interim)
