# Architecture Research

**Domain:** Cinematic-immersive filmmaker portfolio (scroll-snapped fullscreen video reels, viewport-windowed iframe mounting, persistent URL-routed filter, 7 prerendered SvelteKit routes)
**Researched:** 2026-05-19
**Confidence:** HIGH (sibling `michelle_ngo_four` is shipped v1.0 and read line-by-line; iframe lifecycle pattern verified against Vimeo Player SDK docs + IntersectionObserver native semantics)

---

## Standard Architecture

### System Overview

```
+----------------------------------------------------------------------+
| BUILD TIME (Vite + adapter-static)                                   |
|----------------------------------------------------------------------|
|  videos.json                                                         |
|    -> validate-videos plugin (buildStart)  [REUSED from _four]       |
|       -> Zod parse + (source,id) uniqueness                          |
|    -> $lib/data loader (parse, hidden-filter, derived display order) |
|       -> +page.ts loaders (per-route projection / sort)              |
|          -> +page.svelte (Svelte 5 components)                       |
|             -> 7 prerendered routes + sitemap.xml                    |
+----------------------------------------------------------------------+
                                |
                                v
+----------------------------------------------------------------------+
| RUNTIME (client only — no server)                                    |
|----------------------------------------------------------------------|
|  +layout.svelte                                                      |
|    +- TopNav (chrome-fade $effect IO)         [state: heroVisible,   |
|    +- {@render children()}                     reelScrollDir]        |
|    +- Footer                                                         |
|                                                                      |
|  /work, /work/[cat], /pbs-american-portrait, /                       |
|    +- HeroAmbient (only `/`)                                         |
|    +- FilterPillBar (URL-driven, sticky)                             |
|    +- ReelStage (scroll-snap container, owns IO + windowed mount)    |
|        +- ReelSection [i-1]  -> PreviewLoop OR PosterImage           |
|        +- ReelSection [i  ]  -> PreviewLoop (current)                |
|        +- ReelSection [i+1]  -> PreviewLoop OR PosterImage           |
|        +- ReelSection [...]  -> PosterImage (off-window)             |
|                                                                      |
|  /watch/[id]                                                         |
|    +- WatchPlayer (full-bleed letterboxed iframe, chrome-fade)       |
|    +- ContinueReelRail (same-category horizontal carousel)           |
+----------------------------------------------------------------------+
                                |
                                v
+----------------------------------------------------------------------+
| GLOBAL CLIENT STATE (Svelte 5 runes in module scope)                 |
|----------------------------------------------------------------------|
|  $lib/state/connection.svelte.ts   -> effectiveType + saveData       |
|  $lib/state/motion.svelte.ts       -> reduced-motion preference      |
|  (everything else lives in components or URL — see State section)    |
+----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Single-line responsibility | Implementation notes |
|-----------|---------------------------|----------------------|
| `HeroAmbient.svelte` | Renders `/` full-bleed ambient muted reel-bg + name overlay + `PLAY REEL` CTA + scroll-cue + `#hero-sentinel`. | Replaces `_four`'s `HeroPoster` poster-only model. Owns ONE always-mounted muted iframe pointing at `producerReelId` (the same `264677021` literal from `$lib/data`). Iframe is **always mounted while `/` route is active** (it's the LCP-budget exception per POL-02). |
| `ReelStage.svelte` | Owns the scroll-snap container (`scroll-snap-type: y mandatory`), enumerates `ReelSection`s, runs the IntersectionObserver, and decides which sections mount `PreviewLoop` vs `PosterImage`. | Single source of truth for "active reel index". Holds the `Map<videoId, IntersectionObserverEntry>` and exposes a `$derived` `mountedIds: Set<string>` to children via `setContext`. |
| `ReelSection.svelte` | One fullscreen `min-h-dvh snap-start` section per video; conditionally renders `PreviewLoop` OR `PosterImage` based on context flag from `ReelStage`. | Title (bottom-left), `<CategoryTag />` (top-right, reused from `_four`), `PLAY WITH SOUND` deep-link to `/watch/[id]`. Aspect-ratio container locks dimensions so poster->iframe swap causes no CLS (POL-03). |
| `PreviewLoop.svelte` | The muted autoplay iframe for one video; lifecycle-managed (mount on enter window, unmount on exit). | Builds `?autoplay=1&muted=1&loop=1&background=1` (Vimeo) or `?autoplay=1&mute=1&loop=1&playlist=<id>&controls=0` (YouTube) URL from `video.embed`. Listens for Vimeo `ready` postMessage before considering itself "loaded" (used by `PosterImage` fade-out). |
| `PosterImage.svelte` | Static fallback shown when section is off-window OR on cellular OR reduced-motion. | Renders `<img src={video.thumbnail}>` with same aspect-ratio container as `PreviewLoop`. Holds the play affordance (`▷ PLAY WITH SOUND`) for cellular/no-motion paths. |
| `FilterPillBar.svelte` | Sticky horizontal pill row above the reel; reads active filter from URL, renders 8 category links (display order) + "All". | URL is source of truth (`/work` = "All", `/work/[category]` = filtered). Each pill is a plain `<a href>` — no client state. PBS pill points at `/pbs-american-portrait/` per `_four`'s D-03 parity. Pulled out of `TopNav` because `_three`'s cinematic nav is chrome-light; the pill bar carries the wayfinding load. |
| `TopNav.svelte` | Cinematic minimal top chrome — wordmark + About/Press/Contact + hamburger. Fades to transparent during reel scroll. | Diverges from `_four`'s 8-category TopNav (those move to `FilterPillBar`). Uses the same `$effect`+IO pattern as `_four`'s TopNav.svelte:58-89 but observes BOTH `#hero-sentinel` AND a `reel-scrolling` flag from `ReelStage` via `setContext`/`getContext`. |
| `MobileMenu.svelte` | Full-screen mobile overlay menu (hamburger trigger). Forks lightly from `_four`'s `MobileMenu.svelte`. | Same idiom; restyled cinema-dark. |
| `WatchPlayer.svelte` | `/watch/[id]` full-bleed letterboxed iframe (max comfortable letterbox), chrome (back, title, meta) fades to opacity-30 on `play` postMessage event. | Mounts ONE iframe at route entry. Uses `vimeo/player.js` SDK (already a Vimeo-listed API) to subscribe to `play`/`pause` events for chrome-fade. For YouTube, uses raw postMessage with the IFrame API protocol. |
| `ContinueReelRail.svelte` | Horizontal-scroll same-category carousel below `WatchPlayer`. | Replaces `_four`'s `VideoCard` 2/3/4 grid (`_four` `watch/[id]/+page.svelte:108-122`) with a single-row horizontally-snapping carousel (`scroll-snap-type: x mandatory`). Each card uses the SAME `PosterImage` + thumbnail (no iframes — rail is browse signal, not preview). |
| `ContactBlock.svelte` | Single source-of-truth for email/phone/IMDb/LinkedIn/Vimeo links. | **REUSED VERBATIM** from `_four/src/lib/components/ContactBlock.svelte` (same hardcoded literals, same v1.0 channel-homepage fallback for IMDb/LinkedIn). CONT-01 + CONT-02 satisfied by construction. |
| `Footer.svelte` | Site-wide footer below routed content. | Reuses the contract from `_four/src/lib/components/Footer.svelte` (3-column grid: ContactBlock + 8 categories + secondary nav + copyright strip). Restyled for cinema dark — typography larger, more breathing room, but DOM structure unchanged so the existing tests port across. |
| `CategoryTag.svelte` | Per-category type label (interactive when `href` passed, static `<span>` otherwise). | **REUSED VERBATIM** from `_four`. Identical contract; used by `ReelSection` (top-right tag) and `WatchPlayer` (metadata strip). |
| `categoryAccent.ts` | Static `Record<Category, string>` of Tailwind classes (Tailwind-scanner-safe literal map). | **REUSED VERBATIM** from `_four/src/lib/components/categoryAccent.ts:19-28`. Cinema palette may *override* the CSS variables in `app.css` to a more muted cinematic set, but the class-name map stays byte-identical. |

---

## Recommended Project Structure

```
michelle_ngo_three/
├── src/
│   ├── app.css                      # Tailwind v4 + --color-cat-* vars (cinema palette)
│   ├── app.html                     # Standard SvelteKit shell + dark base
│   ├── lib/
│   │   ├── assets/                  # hero-poster.webp etc. (cinema-restyled)
│   │   ├── components/
│   │   │   # === Reel system (NEW in _three) ===
│   │   │   ├── ReelStage.svelte
│   │   │   ├── ReelSection.svelte
│   │   │   ├── PreviewLoop.svelte
│   │   │   ├── PosterImage.svelte
│   │   │   ├── FilterPillBar.svelte
│   │   │   # === Adapted from _four ===
│   │   │   ├── HeroAmbient.svelte       (was HeroPoster, now reel-bg)
│   │   │   ├── TopNav.svelte            (forked; chrome-light)
│   │   │   ├── MobileMenu.svelte        (forked; restyled)
│   │   │   ├── WatchPlayer.svelte       (new — replaces inline /watch markup)
│   │   │   ├── ContinueReelRail.svelte  (was the /watch grid rail)
│   │   │   # === Verbatim from _four ===
│   │   │   ├── ContactBlock.svelte
│   │   │   ├── Footer.svelte
│   │   │   ├── CategoryTag.svelte
│   │   │   └── categoryAccent.ts
│   │   ├── data/                    # VERBATIM REUSE — DATA-01/02/03
│   │   │   ├── videos.json          (byte-identical to _four)
│   │   │   ├── schema.ts            (Zod + discriminatedUnion)
│   │   │   ├── categories.ts        (8 categories + slug rules)
│   │   │   ├── videos.ts            (loader: parse + getById + getByCategory etc.)
│   │   │   └── index.ts             (public $lib/data surface)
│   │   ├── state/                   # NEW — module-scope runes for cross-component state
│   │   │   ├── connection.svelte.ts (effectiveType + saveData)
│   │   │   └── motion.svelte.ts     (reduced-motion preference)
│   │   └── iframe/                  # NEW — embed URL builders + postMessage adapters
│   │       ├── buildEmbedUrl.ts     (preview vs play URL per source)
│   │       ├── vimeoAdapter.ts      (postMessage send/listen wrappers)
│   │       └── youtubeAdapter.ts    (postMessage send/listen wrappers)
│   └── routes/
│       ├── +layout.svelte           (TopNav + children + Footer)
│       ├── +layout.ts               (prerender=true, trailingSlash='always')
│       ├── +page.svelte             (HeroAmbient + scroll-into-reel)
│       ├── +page.ts                 (loads featured/producer-reel id)
│       ├── work/
│       │   ├── +page.svelte         (FilterPillBar + ReelStage with all 56)
│       │   ├── +page.ts             (load all videos sorted)
│       │   └── [category]/
│       │       ├── +page.svelte     (FilterPillBar + ReelStage filtered)
│       │       └── +page.ts         (entries() + slugToCategory narrowing)
│       ├── watch/[id]/
│       │   ├── +page.svelte         (WatchPlayer + ContinueReelRail)
│       │   └── +page.ts             (entries() + getById + rail)
│       ├── pbs-american-portrait/
│       │   ├── +page.svelte         (PBS title + blockquote + ReelStage of 18)
│       │   ├── +page.ts             (PBS-only filtered videos)
│       │   └── _pbsCollectionUrl.ts (REUSE from _four)
│       ├── press/
│       │   ├── +page.svelte         (cinematic prestige order, dark editorial)
│       │   ├── +page.ts             (REUSE _pressCredits shape)
│       │   └── _pressCredits.ts     (REUSE from _four — same prestige order)
│       ├── about/+page.svelte       (bio verbatim + ContactBlock; ambient bg)
│       ├── contact/+page.svelte     (h1 + ContactBlock — minimal)
│       └── sitemap.xml/+server.ts   (REUSE shape from _four — 70 URLs)
├── scripts/
│   ├── test-build-fails.mjs         (REUSE from _four — schema-violation smoke test)
│   └── test-prerender-coverage.mjs  (FORK — same counts, plus assert no cellular-only fallback paths regress)
├── vite.config.ts                   (REUSE validate-videos plugin from _four/vite.config.ts:33-65)
├── svelte.config.js                 (REUSE — adapter-static, BASE_PATH)
└── ...
```

### Structure Rationale

- **`src/lib/components/` flat (no subfolders):** mirrors `_four`'s convention. The reel system (`ReelStage`/`ReelSection`/`PreviewLoop`/`PosterImage`/`FilterPillBar`) is conceptually a feature, but at 5 files it's still grep-able. Subfoldering would diverge from `_four` for no gain.
- **`src/lib/data/` byte-identical to `_four`:** DATA-01/02/03 mandate. Reauthoring would invalidate the A/B comparison.
- **`src/lib/state/` is NEW:** `_four` had no cross-component reactive state. `_three`'s connection-effectiveType (REEL-04) + reduced-motion gate the entire reel UX globally — they belong in module-scope `$state` runes (Svelte 5 idiom), not page data. Keeping them in their own folder makes ownership explicit.
- **`src/lib/iframe/` is NEW:** the embed-URL builder + postMessage adapters are the load-bearing novel surface. Isolating them in `$lib/iframe` makes the `vimeoAdapter` / `youtubeAdapter` independently testable in vitest (`environment: 'node'`) without dragging in jsdom or the reel components.
- **Routes mirror `_four` 1:1:** same 7 surfaces, same prerender topology (1 + 1 + 8 + 56 + 1 + 1 + 1 + 1 = 70 URLs in sitemap, identical to `_four`). The A/B is "design language only" by construction.

---

## Architectural Patterns

### Pattern 1: Viewport-Windowed Iframe Mounting (the load-bearing decision)

**What:** `ReelStage` runs ONE `IntersectionObserver` against all `ReelSection` children. The observer maintains an ordered list of section indexes by viewport visibility. The active section index plus ±1 (configurable buffer = 1 per REEL-03) determines `mountedIds`. Each `ReelSection` reads `mountedIds` via Svelte context and conditionally renders `<PreviewLoop>` (if id is in the set) or `<PosterImage>` (otherwise). The swap is reactive: when the user scrolls past, the section's iframe is **removed from the DOM entirely** (`{#if}` block evaluates to false → Svelte unmounts → iframe element destroyed → browser tears down the video stream).

**When to use:** Always, for the reel routes (`/work`, `/work/[category]`, `/pbs-american-portrait/`). Mounting 56 iframes simultaneously would melt mobile browsers (each Vimeo embed is ~150-300 KB of script + a video decoder + a network connection). ±1 buffer keeps perceived performance buttery — the next section's preview is already warm when the user scroll-snaps to it.

**Trade-offs:**
- (+) Bounded memory: only 3 iframes mounted at any time, regardless of catalog size.
- (+) Bounded bandwidth: only 3 simultaneous video streams.
- (-) First scroll into a NEW section shows poster for ~200-800ms while the iframe boots and Vimeo's `ready` postMessage fires. Mitigated by the ±1 buffer (next section is already loaded).
- (-) Requires careful unmount cleanup (listeners + observer) — see Anti-Pattern 1.

**Example (ReelStage.svelte sketch — Svelte 5 runes):**
```svelte
<script lang="ts">
  import { setContext, onMount } from 'svelte';
  import type { Video } from '$lib/data';
  import { connection } from '$lib/state/connection.svelte';
  import { motion } from '$lib/state/motion.svelte';
  import ReelSection from './ReelSection.svelte';

  let { videos }: { videos: readonly Video[] } = $props();

  // The set of video ids that should currently have iframes mounted.
  // Driven by IntersectionObserver below; consumed by ReelSection via context.
  let mountedIds = $state(new Set<string>());

  // Cellular OR reduced-motion = NO iframes at all, just posters.
  // $derived so changes to connection/motion at runtime (rare but possible —
  // user toggles "save data") immediately tear down preview loops.
  const allowPreviews = $derived(
    !connection.isCellular && !motion.reduced
  );

  // setContext exposes the read-only set to children. ReelSection reads it.
  setContext('reel:mountedIds', {
    get current() { return mountedIds; },
    get allowPreviews() { return allowPreviews; }
  });

  let containerEl = $state<HTMLElement>();
  let sectionRefs: Array<HTMLElement | null> = $state([]);

  onMount(() => {
    if (!allowPreviews) return; // cellular path: no observer, no mounts

    // ONE observer for all sections — cheaper than N observers.
    // rootMargin '0px' + threshold 0.5 = section counts as "active" once
    // half of it is in the viewport. Robust to scroll-snap edge cases where
    // two sections briefly co-occupy the viewport during snap animation.
    const io = new IntersectionObserver(
      (entries) => {
        // Find the index with the highest intersectionRatio.
        let activeIdx = -1;
        let bestRatio = 0;
        entries.forEach((e) => {
          const idx = sectionRefs.indexOf(e.target as HTMLElement);
          if (e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            activeIdx = idx;
          }
        });
        if (activeIdx < 0) return;

        // Window = activeIdx-1, activeIdx, activeIdx+1, clamped to bounds.
        const next = new Set<string>();
        for (let i = Math.max(0, activeIdx - 1);
             i <= Math.min(videos.length - 1, activeIdx + 1);
             i++) {
          const v = videos[i];
          if (v) next.add(v.id);
        }
        mountedIds = next; // single $state write triggers reactive re-render
      },
      { threshold: [0, 0.5, 1.0] }
    );

    sectionRefs.forEach((el) => el && io.observe(el));

    // CRITICAL cleanup — see Anti-Pattern 1.
    return () => io.disconnect();
  });
</script>

<div bind:this={containerEl}
     class="h-dvh overflow-y-scroll snap-y snap-mandatory">
  {#each videos as video, i (video.id)}
    <ReelSection
      {video}
      bind:el={sectionRefs[i]}
    />
  {/each}
</div>
```

### Pattern 2: URL-as-Filter-State (single source of truth)

**What:** The active category filter lives in the URL pathname (`/work` = "All", `/work/[category]` = filtered). FilterPillBar reads `$app/state` `page.url.pathname` reactively — no Svelte store, no derived state, no client-side filter mutation. Filtering happens at **build time** in `+page.ts` `load()` (just like `_four/src/routes/work/[category]/+page.ts:28-38`). The /work/[category] route is prerendered (8 HTML files).

**When to use:** Whenever filter state is deep-linkable, share-able, or part of the IA. Anti-pattern is storing filter state in a Svelte store separate from URL — they will desync the moment a user uses browser back/forward.

**Trade-offs:**
- (+) Refresh, paste-URL, back/forward, share-link all work without code.
- (+) Filter state survives server-rendering / prerendering (it IS the route).
- (-) Tapping a pill is a navigation, not a state update — the browser fetches the prerendered HTML for `/work/[category]/index.html`. Mitigated by `data-sveltekit-preload-data="hover"` (already a `_four` pattern in TopNav.svelte:139). Preload makes the click feel instant.

**Example (FilterPillBar.svelte sketch):**
```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { base } from '$app/paths';
  import { getCategoriesInDisplayOrder, categoryToSlug } from '$lib/data';

  const categories = getCategoriesInDisplayOrder();

  function isActive(slug: string | null): boolean {
    // slug=null means the "All" pill.
    const normalized = page.url.pathname.replace(/\/$/, '');
    if (slug === null) return normalized.endsWith('/work');
    if (slug === 'pbs-american-portrait') {
      return normalized.endsWith('/pbs-american-portrait')
          || normalized.endsWith(`/work/${slug}`);
    }
    return normalized.endsWith(`/work/${slug}`);
  }
</script>

<nav class="sticky top-14 z-20 bg-black/80 backdrop-blur ...">
  <a href={`${base}/work`}
     data-sveltekit-preload-data="hover"
     class={isActive(null) ? 'pill-active' : 'pill'}>All</a>
  {#each categories as cat}
    {@const slug = categoryToSlug(cat)}
    {@const href = slug === 'pbs-american-portrait'
       ? `${base}/pbs-american-portrait/`
       : `${base}/work/${slug}`}
    <a {href}
       data-sveltekit-preload-data="hover"
       class={isActive(slug) ? 'pill-active' : 'pill'}>{cat}</a>
  {/each}
</nav>
```

### Pattern 3: Reactive Environment Sensors as Module-Scope Runes

**What:** `connection.effectiveType` and `prefers-reduced-motion` are environmental signals consumed by multiple components (`ReelStage`, `PreviewLoop`, `HeroAmbient`). They live as `$state` runes in module scope (`$lib/state/connection.svelte.ts`, `$lib/state/motion.svelte.ts`), initialized lazily on the client, never on the server.

**When to use:** Any cross-cutting environmental signal whose changes must reactively update multiple unrelated components. NOT for filter state (URL owns that) and NOT for component-local state (component owns that).

**Trade-offs:**
- (+) Single source of truth — `connection.isCellular` reads the same value in every component.
- (+) Zero prop-drilling.
- (+) SSR-safe — the `.svelte.ts` file initializes the `$state` with a server-safe default (`isCellular = false`), then mutates on `onMount` in a small init helper.
- (-) Module-scope state is global. Tests need to reset it between cases. Acceptable for these two well-bounded signals.

**Example (`$lib/state/connection.svelte.ts`):**
```typescript
// Module-scope state — Svelte 5 runes in a .svelte.ts file (NOT .ts).
// The .svelte.ts extension tells the compiler to enable runes outside a component.

type EffectiveType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

// Server-safe default. Initialized on client via initConnectionState().
let _effectiveType = $state<EffectiveType>('4g');
let _saveData = $state(false);

export const connection = {
  get effectiveType() { return _effectiveType; },
  get saveData() { return _saveData; },
  get isCellular() {
    return _saveData
        || _effectiveType === '2g'
        || _effectiveType === '3g'
        || _effectiveType === 'slow-2g';
  }
};

/**
 * Call from a root layout or page onMount. Idempotent.
 * navigator.connection is non-standard but available in Chrome/Edge/Opera/Samsung.
 * Safari/Firefox = undefined → we default to non-cellular (allow previews).
 * That's the right default: bandwidth-ethics fallback should only trigger
 * when we have evidence of cellular, not on lack of evidence.
 */
export function initConnectionState() {
  if (typeof navigator === 'undefined') return;
  const c = (navigator as any).connection;
  if (!c) return;
  const apply = () => {
    _effectiveType = c.effectiveType ?? '4g';
    _saveData = c.saveData ?? false;
  };
  apply();
  c.addEventListener?.('change', apply);
}
```

### Pattern 4: Iframe Lifecycle — Build, Mount, Listen, Unmount

**What:** A four-phase contract for every iframe (`PreviewLoop` and `WatchPlayer`):

1. **Build URL.** `$lib/iframe/buildEmbedUrl.ts` takes a `Video` + a "mode" (`'preview' | 'play'`) and returns the parameterized embed URL. Preview mode = `autoplay=1&muted=1&loop=1&background=1` (Vimeo) / `autoplay=1&mute=1&loop=1&playlist=<id>&controls=0` (YouTube). Play mode = `autoplay=1` only (sound on, user navigated here intentionally).
2. **Mount.** Svelte's `{#if mountedIds.has(video.id)}<iframe src={url}>{/if}` is the entire mount. No `dom.appendChild`, no manual iframe creation.
3. **Listen.** A small adapter (`vimeoAdapter.ts` / `youtubeAdapter.ts`) subscribes to `postMessage` events from the iframe's `contentWindow`. The Vimeo adapter posts `{method: 'addEventListener', value: 'play'}` after `ready`; the YouTube adapter posts the equivalent `listening` handshake. **Listener is bound inside Svelte's `onMount`** with a cleanup return that calls `removeEventListener('message', ...)` AND posts `{method: 'unload'}` (Vimeo) / `removeEventListener` (YouTube) to the iframe BEFORE Svelte unmounts it.
4. **Unmount.** Svelte unmounts the iframe element (the `{#if}` evaluates to false). The browser tears down the contentWindow, the video stream, the decoder. Our cleanup ran in step 3, so no listener leaks.

**When to use:** Every iframe. No exceptions. This is the only correct lifecycle on a 56-video reel — anything less leaks memory and accumulated event listeners until the tab dies.

**Trade-offs:**
- (+) Memory-bounded. Tab can stay open for hours without OOM.
- (+) postMessage events are typed at the adapter boundary, not sprinkled through components.
- (-) Adapter code has to handle Vimeo's "wait for ready before sending methods" gotcha (verified at [Vimeo Player SDK docs](https://developer.vimeo.com/player/sdk/reference)).

**Example (`$lib/iframe/buildEmbedUrl.ts`):**
```typescript
import type { Video } from '$lib/data';

export type EmbedMode = 'preview' | 'play';

/**
 * Builds the iframe `src` URL for a video in the given mode.
 *
 * Preview mode = silent ambient loop (autoplay + muted + loop + no chrome).
 * Play mode    = user-initiated playback (autoplay + sound; default controls).
 *
 * Both Vimeo and YouTube require muted=1 for autoplay to succeed without
 * gesture — browsers block sound-on autoplay site-wide. We use the muted
 * flag for preview and let the /watch/[id] navigation count as the gesture
 * for play mode (autoplay-with-sound is allowed in the click handler chain).
 *
 * Vimeo's `background=1` removes ALL chrome (no controls, no title, no play
 * button). Combined with autoplay+muted+loop it's the canonical "ambient
 * looping background video" pattern documented by Vimeo.
 *
 * YouTube needs `playlist=<id>` alongside `loop=1` or loop won't work
 * (YouTube-IFrame-API gotcha — `loop=1` alone loops nothing; the playlist
 * param tells YT what to loop).
 */
export function buildEmbedUrl(video: Video, mode: EmbedMode): string {
  const base = video.embed; // already a https://player.vimeo.com/video/... or .../embed/<id>
  const sep = base.includes('?') ? '&' : '?';
  if (video.source === 'vimeo') {
    return mode === 'preview'
      ? `${base}${sep}autoplay=1&muted=1&loop=1&background=1`
      : `${base}${sep}autoplay=1`;
  }
  // youtube
  return mode === 'preview'
    ? `${base}${sep}autoplay=1&mute=1&loop=1&playlist=${video.id}&controls=0&modestbranding=1`
    : `${base}${sep}autoplay=1`;
}
```

---

## Data Flow

### Build-Time Flow (no client involvement)

```
src/lib/data/videos.json  (byte-identical to _four)
    |
    v
[ Vite plugin: validate-videos buildStart hook ]   (REUSE _four/vite.config.ts:33-65)
    |  -> Zod parse + (source,id) uniqueness check
    |  -> fails build on schema violation
    v
src/lib/data/videos.ts                              (REUSE _four/src/lib/data/videos.ts)
    |  -> VideoArraySchema.parse(rawVideos)         (materializes D-08 defaults)
    |  -> exports videos, allVideos, producerReelId, getById, getByCategory,
    |     getCategoriesInDisplayOrder, getCategoriesWithCounts
    v
src/lib/data/index.ts (public $lib/data surface)    (REUSE verbatim)
    |
    v
+page.ts loaders                                     (per route — narrow + sort)
    |  -> /+page.ts             : { producerReelId } (HeroAmbient needs it)
    |  -> /work/+page.ts        : all 56 videos sorted (featured-first, date-desc)
    |  -> /work/[category]/+page.ts : slugToCategory → getByCategory, sorted
    |  -> /watch/[id]/+page.ts  : getById + same-category rail
    |  -> /pbs-american-portrait/+page.ts : getByCategory('PBS ...'), sorted
    |  -> /press/+page.ts       : getPressCredits() from _pressCredits.ts (REUSE)
    v
+page.svelte                                         (Svelte 5 components)
    |  -> ReelStage receives data.videos
    |     -> ReelSection receives one Video each
    |        -> PreviewLoop / PosterImage receive one Video each
    v
[ adapter-static prerender ] → 70 static HTML files in build/
```

**Reuse fidelity:** `$lib/data` surface is IDENTICAL to `_four`. The build-time validation plugin is COPIED VERBATIM (vite.config.ts:33-65). No new build-time work is needed for cinematic — Vimeo and YouTube already serve thumbnails at known URLs (`videos.json` carries `thumbnail` per-record). No per-video poster generation is required.

### Runtime Flow — Reel Scroll (the load-bearing client path)

```
User scrolls vertically on /work
    |
    v
Browser fires scroll events → scroll-snap snaps to nearest ReelSection
    |
    v
IntersectionObserver in ReelStage fires entries
    |
    v
ReelStage computes activeIdx (highest intersectionRatio)
    |
    v
ReelStage updates mountedIds: $state = new Set([prev, active, next])
    |
    v
Svelte reactive system re-evaluates {#if mountedIds.has(video.id)} per ReelSection
    |
    +-- mountedIds NOW HAS this id, but section's currently showing PosterImage:
    |     -> PreviewLoop mounts → onMount runs → buildEmbedUrl + iframe src
    |     -> Vimeo iframe POSTs `ready` → adapter listens → fade poster out
    |
    +-- mountedIds NO LONGER has this id, but section's currently showing PreviewLoop:
    |     -> PreviewLoop's cleanup runs (removeEventListener, unload postMessage)
    |     -> Svelte unmounts iframe element → browser tears down stream
    |     -> PosterImage renders
    |
    +-- mountedIds membership unchanged → no work
```

### Runtime Flow — Filter Change

```
User taps a FilterPillBar pill
    |
    v
Browser navigates to /work/[category] (preloaded by data-sveltekit-preload-data="hover")
    |
    v
SvelteKit routes to the prerendered /work/[category]/index.html
    |
    v
+page.ts load() returned filtered video list AT BUILD TIME (already in HTML)
    |
    v
+page.svelte mounts a NEW ReelStage with the filtered videos prop
    |
    v
Old ReelStage's onMount cleanup ran → IntersectionObserver disconnected
    Old PreviewLoops cleanup ran → all iframes unmounted, all listeners removed
    |
    v
New ReelStage's onMount runs → new IntersectionObserver → starts fresh
```

**Critical correctness point:** Each route is a fresh `ReelStage` mount. There is NO shared reel state across category navigations. Old iframes are guaranteed-torn-down by Svelte's component unmount lifecycle. This is the SAME pattern as `_four`'s nav scroll-aware effect (`TopNav.svelte:58-89` reattaches per route).

### State Management — Authoritative Ownership Table

| State | Owner | Mechanism | Why here |
|-------|-------|-----------|----------|
| Active reel section index | `ReelStage` (component-local) | `$state` + IntersectionObserver callback | Only `ReelStage` needs to know "which is active"; children read `mountedIds` (set), not the index. Scope = one component. |
| `mountedIds: Set<string>` | `ReelStage` (component-local, exposed via Svelte context) | `$state(new Set())`; `setContext('reel:mountedIds', ...)` | Children (`ReelSection`) need read access; parent (`ReelStage`) owns writes. Context is the Svelte idiom for parent→descendant prop-tunneling without prop-drilling. |
| `connection.effectiveType` / `isCellular` | `$lib/state/connection.svelte.ts` (module-scope rune) | `$state` in `.svelte.ts`, getter exports | Read by `ReelStage` AND `PreviewLoop` AND `HeroAmbient`. Module-scope rune is the Svelte 5 idiom for shared reactive sensor state. |
| Reduced-motion preference | `$lib/state/motion.svelte.ts` (module-scope rune) | `$state` + `matchMedia` listener init | Same reasoning as connection state. |
| Active category filter | URL (`page.url.pathname`) | `$app/state` `page` rune (reactive in Svelte 5) | Single source of truth. Reload/share/back-forward work without code. NEVER duplicate this in a store — they will desync (see Anti-Pattern 2). |
| TopNav chrome visibility (hero-mode) | `TopNav.svelte` (component-local) | `$state` + `$effect` + IntersectionObserver on `#hero-sentinel` | Same pattern as `_four/src/lib/components/TopNav.svelte:56-89`. Strictly local to TopNav. |
| TopNav chrome visibility (reel-scroll fade) | `TopNav.svelte` (component-local) | `$state` + scroll-direction detection from `ReelStage` (via context flag `reel:scrollDir`) | The reel scroll fade is a NEW divergence from `_four`. `ReelStage` publishes `scrollDir` via `setContext`; `TopNav` reads it via `getContext` and derives `chromeVisible`. |
| Mobile menu open/closed | `TopNav.svelte` (component-local) | `$state(false)` (already the `_four` pattern at TopNav.svelte:38) | Strictly local. |
| Image-loaded fade-in flag | `VideoCard`-style components (component-local) | `$state(false)` + `onload` (same as `_four/src/lib/components/VideoCard.svelte:39`) | Strictly local. |
| `/watch/[id]` chrome fade-on-play | `WatchPlayer.svelte` (component-local) | `$state` + vimeoAdapter `play` event subscription | Strictly local. |

**Anti-pattern guard:** No Svelte writable stores anywhere. No localStorage-persisted filter state. No URL-mirroring derived stores. URL is canonical when it exists; module runes for environment sensors only; component-local runes for everything else.

---

## Route Structure (Confirmed — 7 Surfaces, 70 Prerendered URLs)

| Route | +page.ts load() | Prerender | entries() needed? | Notes |
|-------|----------------|-----------|-------------------|-------|
| `/` | `{ producerReelId: '264677021' }` (and optionally featured ids for sections-revealed-on-scroll) | yes | no | HeroAmbient mounts ONE always-on muted iframe. HERO-02 says scrolling `/` reveals the first sections of the reel — implementation: `/` page composes `<HeroAmbient />` followed by `<ReelStage videos={featuredVideos} />`. Two ReelStages are fine — they're independently mounted/unmounted. |
| `/work` | `{ videos }` — all 56 sorted featured-first then date-desc | yes | no | FilterPillBar's "All" target. ReelStage with full catalog. |
| `/work/[category]` | `{ category, videos }` — narrowed via `slugToCategory()`, throws 404 on unknown slug, sorted | yes | **YES** — same pattern as `_four/src/routes/work/[category]/+page.ts:19-21` | 8 HTML files prerendered. |
| `/watch/[id]` | `{ video, rail }` — `getById()` → 404 on unknown, plus same-category rail | yes | **YES** — same pattern as `_four/src/routes/watch/[id]/+page.ts:22` | 56 HTML files prerendered. WatchPlayer mounts ONE iframe. ContinueReelRail uses PosterImage thumbnails (no preview iframes — rail is browse signal). |
| `/pbs-american-portrait/` | `{ videos }` — `getByCategory('PBS American Portrait')`, sorted | yes | no (parameterless) | Title + verbatim blockquote + ReelStage of 18 PBS videos. Each ReelSection carries the optional "See on PBS →" link (15 of 18 — same `_pbsCollectionUrl.ts` parser as `_four`). |
| `/press` | `{ groups }` — `getPressCredits()` reused verbatim from `_four/src/routes/press/_pressCredits.ts` | yes | no | Cinematic restyle: dark editorial typography, prestige order unchanged. Reuse the data layer, swap the visual layer. |
| `/about` | (none — static content) | yes | no | Bio verbatim from `_four`. ABT-01 says "over an ambient still or muted reel loop" — recommend: ambient still (a `<HeroAmbient>` clone running the producer reel feels too noisy under bio text; static cinema still is more A24). Decision delegated to UI-SPEC. |
| `/contact` | (none — static content) | yes | no | h1 + ContactBlock. |
| `/sitemap.xml` | `+server.ts` GET — emits 6 static + 8 categories + 56 watch = 70 URLs | yes | no | REUSE shape from `_four/src/routes/sitemap.xml/+server.ts`. |

**Layout structure:** Single root `+layout.svelte` (TopNav + children + Footer). No nested layouts. `+layout.ts` exports `prerender = true` and `trailingSlash = 'always'` — IDENTICAL to `_four/src/routes/+layout.ts`. The `/watch/[id]` route inherits prerender from layout (no per-route override needed).

**No new entries() generators** — only `/work/[category]` and `/watch/[id]` need them, same as `_four`.

---

## Iframe Lifecycle Architecture (most concrete decision)

### Lifecycle State Machine (per iframe)

```
              [unmounted]
                  |
                  | mountedIds.has(id) becomes true (ReelStage IO callback)
                  v
            [mounted-loading]   <-- iframe is in DOM; src is set
                  |
                  | postMessage 'ready' received from iframe
                  v
            [mounted-playing]   <-- preview loop running; PosterImage faded out
                  |
                  | mountedIds.has(id) becomes false (user scrolled away)
                  v
            [unmounting]        <-- Svelte cleanup phase
                  |
                  | adapter.dispose() sends 'unload' postMessage + removes listeners
                  | Svelte removes <iframe> element from DOM
                  v
              [unmounted]
```

### Concrete Decisions

1. **When does an iframe mount?** When the section's video id enters `mountedIds`. `mountedIds` is recomputed every time the IntersectionObserver fires (= every time a section crosses the 50% visibility threshold). For a hard scroll-snap container, that fires once per snap-stop transition, plus once during the snap animation. So practical iframe mounts ≈ once per user-initiated scroll-snap step.

2. **When does an iframe unmount?** When the section's video id leaves `mountedIds`. With ±1 buffer, this happens when the user has scroll-snapped TWO sections away from this video.

3. **How is "current ± 1" determined?**
   - One `IntersectionObserver` in `ReelStage`, observing all section elements.
   - `threshold: [0, 0.5, 1.0]` — fires at 0% (just entered), 50% (active), 100% (fully visible).
   - On every callback, scan entries → pick the entry with the highest `intersectionRatio` → that's `activeIdx`.
   - `mountedIds = new Set([videos[activeIdx-1].id, videos[activeIdx].id, videos[activeIdx+1].id])` (bound-clamped).
   - `rootMargin: '0px'` — viewport is the root. No special tuning needed because `min-h-dvh` sections + scroll-snap force exactly one section to occupy the viewport at rest.

4. **How are postMessage events handled?**
   - `$lib/iframe/vimeoAdapter.ts` exposes `attach(iframe, handlers): dispose` where `handlers` is `{ onReady?, onPlay?, onPause?, onError? }`.
   - Internally: `window.addEventListener('message', ...)` filtered by `event.source === iframe.contentWindow` AND `event.origin === 'https://player.vimeo.com'`. Origin filtering is mandatory — without it, any iframe on the page could spoof events.
   - The adapter handshake: after iframe load, post `{method: 'addEventListener', value: 'play'}`, then on `event.data.event === 'ready'` post the addEventListener messages for each handler.
   - `dispose()` removes the message listener AND posts `{method: 'removeEventListener', value: 'play'}` to the iframe (defensive — the iframe is about to be torn down anyway).
   - YouTube adapter is analogous but uses the YouTube IFrame API protocol (`event === 'listening'` handshake, `func` instead of `method`).

5. **How does iframe-mount interact with category-filter changes?**
   - Filter change = route navigation = new `ReelStage` component instance = old `ReelStage`'s `onMount` cleanup runs (`io.disconnect()`) = all `PreviewLoop` children unmount (Svelte unmounts entire subtree) = each `PreviewLoop`'s cleanup runs (adapter `dispose()`).
   - This is automatic by Svelte's component lifecycle. We do NOT need a manual "filter change tear-down" — the route boundary is the tear-down.
   - On cellular: `allowPreviews` derived computes false → `mountedIds` stays empty (the `onMount` early-returns) → ReelStage never instantiates iframes. Sections render `PosterImage` with `▷ PLAY WITH SOUND` deep-link only.

6. **Memory leak prevention strategy** (defense in depth):
   - **L1:** Svelte's reactive `{#if}` removes the iframe element from the DOM on unmount. Browser tears down the contentWindow.
   - **L2:** Every `PreviewLoop` `onMount` returns a cleanup that calls `adapter.dispose()` BEFORE the element is removed.
   - **L3:** `ReelStage`'s `onMount` returns a cleanup that calls `io.disconnect()`. This catches the case where a route change happens mid-scroll — even if `mountedIds` updates didn't fire in the natural sequence, the observer is dead before the next component mounts.
   - **L4:** All adapter listeners are bound to `window` with named function references (NOT inline closures held only by the iframe). The cleanup removes them by reference. This is the standard fix for the [WebKit ResizeObserver / IntersectionObserver detached-element memory leak](https://bugs.webkit.org/show_bug.cgi?id=227194) family of bugs.
   - **L5:** Origin filtering in the message listener (`event.origin === 'https://player.vimeo.com'`) keeps the listener cheap — if 100 stale messages arrive during a teardown race, they're ignored without invoking handlers.

---

## Build-Time Architecture

- **REUSE:** `validateVideosPlugin` from `_four/vite.config.ts:33-65` — byte-identical paste. Same Zod schema (`_four/src/lib/data/schema.ts`), same (source, id) uniqueness check, same `this.error()` failure mode, same DATA-02/DATA-03 satisfaction.
- **REUSE:** vitest `projects: [{ name: 'data', environment: 'node' }, { name: 'ui', environment: 'jsdom' }]` two-project split from `_four/vite.config.ts:73-121`. Same data tests run in node, same component tests run in jsdom.
- **REUSE:** `test-prerender-coverage.mjs` from `_four/scripts/test-prerender-coverage.mjs` — same 70-URL expectation. Fork lightly to add: assert that `build/work/index.html` includes at least one `<iframe` tag OR a `data-poster-fallback` attribute (defends against an empty `/work` regression — same defensive idea as `_four`'s sitemap-URL-count check).
- **REUSE:** `test-build-fails.mjs` from `_four/scripts/test-build-fails.mjs` — smoke test that schema-violating videos.json fails the build with the right error message.
- **NEW (small):** No per-video poster generation. Vimeo and YouTube already serve thumbnails at known canonical URLs and `videos.json` carries `thumbnail` per record. POL-03 (no CLS on poster→iframe swap) is satisfied by aspect-ratio container in `ReelSection.svelte`, not by poster pre-generation.
- **NEW (optional, low-priority):** If we want to preload the first section's iframe URL into the HTML head, a tiny build-time step in `+page.ts` could emit a `<link rel="preconnect" href="https://player.vimeo.com">`. This is `_four`'s D-07 preload pattern (`_four/src/lib/components/HeroPoster.svelte:27-29`) applied to embeds. Defer to UI-SPEC if budget research demands it.

---

## Suggested Build Order (Phase Dependency Graph)

Suggested phase sequencing — each row is a phase, with rationale for why it MUST land before later phases.

| Phase | Builds | Why this order |
|-------|--------|---------------|
| **Phase 1: Foundation** | SvelteKit 2 + Svelte 5 + TS strict + Tailwind v4 scaffold, GH Pages staging workflow, base path wiring, `+layout.svelte` shell (TopNav placeholder + children + Footer placeholder). | Everything else imports `$lib`, `$app/paths`, `$app/state`. Without the scaffold and BASE_PATH wiring, no component file is testable. Mirror `_four`'s Phase 1 exactly. |
| **Phase 2: Data Layer** | Copy `videos.json` verbatim, copy `schema.ts`/`categories.ts`/`videos.ts`/`index.ts` verbatim, copy the Vite plugin from `_four/vite.config.ts:33-65`. Run `_four`'s data tests against this project. | DATA-01/02/03 mandate. Every route's `+page.ts` and every component imports `$lib/data`. Must land before any route work. |
| **Phase 3: Reel System Core** | `ReelStage` + `ReelSection` + `PreviewLoop` + `PosterImage` + `$lib/iframe/buildEmbedUrl.ts` + `$lib/iframe/vimeoAdapter.ts` + `$lib/iframe/youtubeAdapter.ts` + `$lib/state/connection.svelte.ts` + `$lib/state/motion.svelte.ts`. Wire up `/work` route consuming all 56 videos. | **This is the load-bearing risk.** Build the reel system in isolation (`/work` only) first. Prove viewport-windowed mounting works on real Vimeo + YouTube embeds across Safari iOS / Chrome / Firefox. If this phase fails, the entire project pivots — no point building HeroAmbient or WatchPlayer on top of an unproven foundation. |
| **Phase 4: Wayfinding** | `FilterPillBar.svelte` + `TopNav.svelte` (cinematic minimal, forked from `_four`) + `MobileMenu.svelte` (restyled) + `/work/[category]/+page.ts` with `entries()` + 8 prerendered category routes. | Depends on Phase 3 (ReelStage must accept a filtered videos prop). Depends on Phase 2 (slug → category narrowing). Establishes the URL-as-filter-state pattern that the rest of the routes assume. |
| **Phase 5: Hero & Watch** | `HeroAmbient.svelte` (replaces `_four`'s HeroPoster — always-mounted muted ambient iframe of `producerReelId`), `/+page.svelte` reel-led home, `WatchPlayer.svelte`, `ContinueReelRail.svelte`, `/watch/[id]/+page.ts` with `entries()` + 56 prerendered routes. | Depends on Phase 3 (iframe lifecycle + adapter is proven). Depends on Phase 4 (TopNav's hero-mode IO behavior is finalized — HeroAmbient owns the `#hero-sentinel`). |
| **Phase 6: PBS, Press, About, Contact** | `/pbs-american-portrait/` (title + blockquote + `ReelStage` of 18 PBS videos, PBS badges), `/press/` (cinematic restyle, reuse `_pressCredits.ts` from `_four`), `/about/` (bio verbatim + ContactBlock), `/contact/` (h1 + ContactBlock). Drop in verbatim `ContactBlock.svelte` + restyled `Footer.svelte`. | Depends on Phase 3 (ReelStage for PBS), Phase 2 (`getByCategory`), and reused components from `_four`. Independent of Phase 5. Could parallelize with Phase 5 in practice — listed sequentially for one-engineer-at-a-time GSD sequencing. |
| **Phase 7: Polish & Cutover** | `<title>` + meta per route, OG/Twitter cards, Person JSON-LD on /about, VideoObject JSON-LD on every /watch/[id], `sitemap.xml/+server.ts` (reuse from `_four`), favicons + og-image, performance budget verification (POL-02 LCP < 2.5s on 4G), `static/CNAME`, `deploy-production.yml`, Launch Runbook. | Depends on EVERY route existing. Mirrors `_four`'s Phase 7 verbatim where possible. |

### Critical Dependency Edges (must-precede)

- `Phase 2 (Data Layer)` → `Phase 3 (Reel)` → `Phase 4 (Wayfinding)` → `Phase 5 (Hero/Watch)` → `Phase 6 (PBS/Press/About/Contact)` → `Phase 7 (Polish)`
- `Phase 1 (Foundation)` → all others
- `Phase 3 (Reel)` BLOCKS everything that follows — if iframe lifecycle is unsound, the project pivots. Front-load the risk.
- `ContactBlock.svelte` (verbatim from `_four`) is a Phase 6 import but is so cheap to drop in that it can land in Phase 1 alongside `Footer.svelte`'s placeholder. Recommend: copy in Phase 1, restyle in Phase 6.

---

## Test Architecture

Mirror `_four`'s two-project vitest split (`_four/vite.config.ts:82-112`):

| Project | Environment | Targets | Examples |
|---------|-------------|---------|----------|
| `data` | `node` | `src/lib/data/**/*.{test,spec}.{ts}` + `src/lib/iframe/**/*.{test,spec}.{ts}` | `buildEmbedUrl.test.ts` (pure function, perfect for node), `schema.test.ts` (REUSE verbatim from `_four`), `videos.json.test.ts` (REUSE), `videos.test.ts` (REUSE). |
| `ui` | `jsdom` (with `browser` resolve condition for Svelte 5 `mount()`) | `src/lib/components/**/*.{test,spec}.{ts}` + `src/routes/**/*.{test,spec}.{ts}` | `ReelStage.test.ts` (mock IntersectionObserver, assert mountedIds transitions), `PreviewLoop.test.ts` (mock `window.postMessage`, assert listener cleanup), `FilterPillBar.test.ts` (assert isActive() under each route), all `_four` component tests forked to match restyles. |

**Prerender-coverage script:** Fork `_four/scripts/test-prerender-coverage.mjs`. Same 70-URL assertion. ADD: open `build/work/index.html`, assert it contains at least one `data-reel-section` attribute (defends against an empty-ReelStage regression). ADD: open one `build/watch/<id>/index.html`, assert it contains an `<iframe` tag pointing at `player.vimeo.com` or `youtube.com` (defends against a WatchPlayer regression to placeholder).

**Build-fails smoke test:** REUSE `_four/scripts/test-build-fails.mjs` verbatim. Same DATA-02 schema-violation contract.

**Playwright:** Recommend skipping. Vitest + jsdom + a mocked IntersectionObserver cover the reel logic. Playwright would catch real-iframe cross-origin postMessage behavior, but that's an integration concern best tested by HUMAN-UAT (Phase 7) on the staging URL with real Vimeo + YouTube. Adding a Playwright pipeline for ONE flaky cross-origin test isn't worth the CI cost. Defer to v2 if A/B leaves us with budget.

---

## Scaling Considerations

This is a portfolio site with 56 videos, single-engineer cadence, no server, no users-at-scale problem. Scaling considerations are about **content scaling** and **bandwidth scaling**, not traffic scaling.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 56 videos (current) | Current architecture — viewport-windowed iframes (±1) is more than enough. Reel scrolls buttery on iOS Safari 16 (verified by similar implementations in the wild). |
| 200 videos | No architecture change. ReelStage's IntersectionObserver handles N sections in O(1) per fire — only the matched entries cost. mountedIds set never grows past 3. Add lazy `entries()` enumeration (it already iterates all videos at build time, but that's a build-time cost — milliseconds). |
| 1000 videos | Add virtualization (only render the DOM for sections within N viewports of the active section). This is a real refactor — `ReelStage` becomes a virtual-scroller (like react-window). DEFER to v2. |
| 100k traffic / day | No change. Static export on GH Pages handles arbitrary traffic — pages are HTML files served from a CDN. |

### Scaling Priorities

1. **First bottleneck:** Initial bundle size if iframe adapter code grows. Mitigation: keep `vimeoAdapter.ts` + `youtubeAdapter.ts` lean and tree-shakeable (no `vimeo/player.js` SDK if we can avoid it — raw postMessage is ~50 LOC per adapter).
2. **Second bottleneck:** Mobile browsers throttling background iframes once the tab loses focus. Browsers already handle this — no work needed.
3. **Third bottleneck:** Unmount race when the user scrolls fast through many sections. Mitigation: the IntersectionObserver is debounced by the browser's own throttling (≥ ~16ms between callbacks per spec). The `mountedIds = new Set(...)` write is atomic. Cleanups run synchronously on unmount.

---

## Anti-Patterns

### Anti-Pattern 1: Mounting all 56 iframes "for performance" (preloading)

**What people do:** Reason "if we pre-mount all iframes hidden, the user never sees a load delay." Render all 56 ReelSections with all 56 iframes from the start.
**Why it's wrong:** Each Vimeo embed is ~150-300 KB of JS + a decoder + an active network connection. Mobile browsers will OOM, throttle, or refuse to load the 30th+ iframe. Battery drains. Bandwidth-ethics fails the spirit of REEL-04.
**Do this instead:** Viewport-windowed mounting (Pattern 1). The ±1 buffer is the load delay budget — small enough to feel instant on scroll-snap, bounded enough that memory stays flat.

### Anti-Pattern 2: Duplicating filter state in a Svelte store

**What people do:** Create `const activeCategory = writable<Category | null>(null)`, sync it from URL on navigation, and read it from `FilterPillBar`. Reasoning: "stores are reactive, URL parsing is verbose."
**Why it's wrong:** URL and store will desync — browser back/forward, paste-URL, share-link, and SSR all hit code paths where the URL changes without the store knowing (or vice versa). You'll spend a week debugging "the filter visually shows All but the reel is filtered to PBS" bugs.
**Do this instead:** URL is the source of truth (Pattern 2). FilterPillBar reads `$app/state` `page.url.pathname`. The `+page.ts` load function reads `params.category` and filters at build time. No store, no sync code, no bugs.

### Anti-Pattern 3: Storing the IntersectionObserver instance in a module variable

**What people do:** Declare `let observer: IntersectionObserver` at module scope, instantiate it once, share it across `ReelStage` instances "for efficiency."
**Why it's wrong:** Multiple `ReelStage` instances exist over a single session (one per route navigation). The shared observer accumulates references to detached DOM elements (sections from old routes that Svelte unmounted). This is the [WebKit detached-element memory leak](https://bugs.webkit.org/show_bug.cgi?id=227194) family.
**Do this instead:** Instantiate the observer inside `onMount`. Return a cleanup that calls `observer.disconnect()`. One observer instance per ReelStage lifetime, guaranteed-disposed on route change. (This is what `_four/src/lib/components/TopNav.svelte:77-89` does for its scroll observer — same pattern.)

### Anti-Pattern 4: Subscribing to Vimeo events with inline closures

**What people do:** `window.addEventListener('message', (e) => { if (e.source === iframe.contentWindow) { ... } })`. Cleanup tries `window.removeEventListener('message', (e) => ...)` with a DIFFERENT inline closure.
**Why it's wrong:** `removeEventListener` requires the SAME function reference passed to `addEventListener`. Two inline closures = two different references. The listener never gets removed. Leaks forever.
**Do this instead:** Named function reference. `const onMsg = (e) => {...}; window.addEventListener('message', onMsg); return () => window.removeEventListener('message', onMsg);`. This is in the adapter contract — the component never sees the listener function.

### Anti-Pattern 5: Putting the active reel section index in a module-scope rune

**What people do:** "Active section is cross-cutting state, put it in `$lib/state/reel.svelte.ts` next to connection state."
**Why it's wrong:** Multiple ReelStage instances exist over a session (one per route nav). They'd share the same `activeIdx` rune. When the user navigates from `/work` (active index 7) to `/work/promos-trailers` (which has fewer videos, indexes 0-3), the global `activeIdx = 7` is invalid. Defensive bounds-checking everywhere.
**Do this instead:** Component-local `$state`. `ReelStage` instantiates fresh state per route. No cross-route bleeding.

### Anti-Pattern 6: Per-section IntersectionObservers

**What people do:** Each `ReelSection` has its own `onMount` IO observing itself. "More encapsulated."
**Why it's wrong:** 56 observers is 56 callbacks per scroll event. They fire independently with no shared view of "which section is active." Computing `activeIdx` requires collating across all 56. The single-observer pattern (ReelStage owns one IO observing all sections) sees all entries in one callback and picks the winner in O(N) per callback (N = visible-now sections, typically 1-3).
**Do this instead:** ONE observer in `ReelStage`, registering all `ReelSection` element refs. (See Pattern 1 example code.)

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Vimeo player iframe | Embed URL with player parameters (`autoplay=1&muted=1&loop=1&background=1` for preview, `autoplay=1` for play); postMessage via `vimeoAdapter.ts` | Must wait for `ready` event before sending `addEventListener` methods (Vimeo SDK gotcha). Origin filter `https://player.vimeo.com` mandatory. |
| YouTube IFrame | Embed URL with player parameters (`autoplay=1&mute=1&loop=1&playlist=<id>&controls=0` for preview); postMessage via `youtubeAdapter.ts` | `loop=1` alone does not loop; needs `playlist=<id>`. Origin filter `https://www.youtube.com` mandatory. |
| GitHub Pages | Static deploy via `_four`-style GH Actions workflow | Identical to `_four/D-05` override. BASE_PATH=`/michelle_ngo_three` at staging, empty at prod. |
| `michellengo.net` apex | Static CNAME file + DNS cutover (only if A/B winner) | `static/CNAME` + production deploy workflow inherited from `_four`'s POL-04. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `ReelStage` ↔ `ReelSection` | parent props + `setContext('reel:mountedIds')` | Section reads context to decide PreviewLoop vs PosterImage. No event emission upward — sections are read-only consumers. |
| `ReelSection` ↔ `PreviewLoop` / `PosterImage` | conditional render based on context | Mutually exclusive; never both at once. |
| `PreviewLoop` ↔ `vimeoAdapter` / `youtubeAdapter` | function call `adapter.attach(iframe, handlers): dispose` | Adapter encapsulates postMessage protocol. Component sees only typed handlers. |
| `TopNav` ↔ `ReelStage` | `setContext('reel:scrollDir')` from ReelStage; `getContext` in TopNav | One-way data flow for chrome-fade behavior. Optional — chrome-fade is a polish feature. |
| `$lib/state/connection` ↔ all consumers | module-import + reactive getter | Direct read. No prop drilling. |

---

## Open Questions Flagged for UI-SPEC / Phase 3 RESEARCH

1. **Vimeo Player SDK vs raw postMessage:** Using the official `@vimeo/player` SDK is ~6 KB gzipped and handles the `ready` handshake automatically. Raw postMessage is ~50 LOC per adapter and zero deps. Trade-off: SDK is safer (matches future Vimeo API changes), raw is leaner. Recommendation: **raw postMessage** — the adapter surface is small (4 handlers) and bundle size matters for cinema-first LCP target. Defer to Phase 3 RESEARCH if reality differs.
2. **iOS Safari 16 scroll-snap quirks:** iOS Safari has historically had issues with `scroll-snap-type: y mandatory` and IntersectionObserver firing during snap animation. Phase 3 should real-device-verify before declaring REEL-01 complete.
3. **/about ambient still vs reel loop:** ABT-01 says "ambient still or muted reel loop." Recommendation: ambient still (less visual noise under bio text). Decision delegated to UI-SPEC.
4. **HeroAmbient autoplay on cellular:** REEL-04 covers the reel; HERO-01 doesn't explicitly. Recommendation: HeroAmbient ALSO respects `connection.isCellular` and falls back to a hero poster image with PLAY REEL CTA. Consistent bandwidth ethics across the site.

---

## Sources

- Sibling repo (read line-by-line): `C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\Websites\michelle_ngo_four\` — specifically:
  - `src/routes/+layout.svelte` (root layout pattern)
  - `src/routes/+layout.ts` (`prerender = true`, `trailingSlash = 'always'`)
  - `src/lib/data/index.ts`, `schema.ts`, `categories.ts`, `videos.ts` (data surface)
  - `src/routes/work/[category]/+page.ts:19-21` (entries() pattern)
  - `src/routes/watch/[id]/+page.ts:22` (56-route entries() pattern)
  - `src/lib/components/TopNav.svelte:56-89` (scroll-aware IO + $effect cleanup pattern)
  - `src/lib/components/HeroPoster.svelte:71-73` (#hero-sentinel pattern)
  - `src/lib/components/VideoCard.svelte:39-57` (image fade-in $state pattern)
  - `src/lib/components/ContactBlock.svelte` (verbatim-reuse target)
  - `src/lib/components/Footer.svelte` (reuse contract)
  - `src/lib/components/categoryAccent.ts:19-28` (Tailwind-scanner-safe static map)
  - `vite.config.ts:33-65` (validate-videos plugin)
  - `vite.config.ts:82-112` (two-project vitest split)
  - `scripts/test-prerender-coverage.mjs` (build-artifact coverage shape)
- [Vimeo Player SDK Reference](https://developer.vimeo.com/player/sdk/reference) — postMessage protocol, `ready` event ordering, parameter list (HIGH confidence — official).
- [Vimeo: Player Parameters](https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters) — `background=1` removes chrome; `autoplay=1` requires `muted=1` for unblocked autoplay (HIGH confidence — official).
- [Vimeo: How to add autoplay and loop parameters](https://help.vimeo.com/hc/en-us/articles/12426486963857-How-to-add-autoplay-and-loop-parameters-to-my-video-s-embed-code) — canonical query string for ambient loops (HIGH confidence — official).
- [vimeo/player.js GitHub](https://github.com/vimeo/player.js/) — reference implementation if we choose SDK over raw postMessage (MEDIUM — open question for Phase 3).
- [WebKit Bug 227194: ResizeObserver/IntersectionObserver memory leak on detached elements](https://bugs.webkit.org/show_bug.cgi?id=227194) — informs Anti-Pattern 3 (don't share observers across instances) and L4 of memory-leak prevention (HIGH — Apple WebKit bug tracker).
- [Mastering the Intersection Observer API 2026](https://future.forem.com/sherry_walker_bba406fb339/mastering-the-intersection-observer-api-2026-a-complete-guide-561k) — corroborates the `unobserve()` / `disconnect()` cleanup pattern (MEDIUM — community article, but consistent with MDN).

---

*Architecture research for: cinematic-immersive filmmaker portfolio (SvelteKit 2 + Svelte 5, viewport-windowed iframe reel)*
*Researched: 2026-05-19*
