# Phase 5: Hero & Watch - Research

**Researched:** 2026-05-27
**Domain:** Iframe-lifecycle reuse for hero ambient bg + watch surface; chrome-fade postMessage state machine; static prerender of 56 dynamic routes; back-nav scroll restoration via URL hash.
**Confidence:** HIGH (every load-bearing decision is verified against either Phase 3 shipped code, Phase 4 carry-forward, sibling `_four` implementation, or a primary spec source). Two MEDIUM-confidence items are flagged in Pitfalls — they are not blockers but require Plan-time decisions.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hero composition on `/`:**
- **D-01:** `/` composes `<HeroAmbient />` + `<ReelStage videos={data.videos} />` below. Phase 1 splash is replaced entirely.
- **D-02:** Hero is always-mounted **while visible**; unmounts to poster when scrolled fully off-screen via a **dedicated IntersectionObserver inside `<HeroAmbient>`** (NOT shared with ReelStage). Preserves Phase 3 peak-3-iframe budget — hero counts +1 only while visible.
- **D-03:** Phase 5 ships the deferred-load mechanism in `<HeroAmbient>`. Poster mounts eagerly (`<img loading="eager" fetchpriority="high">`); iframe swaps in after **whichever fires first**: `requestIdleCallback({ timeout: 1000 })` OR `setTimeout(1000)` (Safari lacks rIC) OR first pointer interaction (`pointerdown` / `wheel` / `touchstart` / `scroll`). POL-02 LCP < 2.5s is satisfied by the eager poster; iframe is best-effort.
- **D-04:** Hero fallback: poster + `▷ PLAY REEL` CTA only. Unified Phase 3 REEL-04 codepath verbatim — `motion.prefersReducedMotion || network.isCellularLike || autoplayFailedFromHeroLoop` collapses to ONE poster render. No separate `▷ START AMBIENT` toggle.
- **D-05:** Hero overlay: centered MICHELLE NGO (display-serif `--font-display`) + tagline (sans) + pill-button `▷ PLAY REEL` CTA (Phase 1 D-05 focus token via global `:focus-visible`) + bottom-center `↓` chevron scroll-cue. Two-stop gradient overlay: `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%)` — protects top + bottom for text contrast while keeping center video uncovered.

**Watch player surface (`/watch/[id]`):**
- **D-06:** Letterbox = edge-to-edge `100vw` player; outer `<div class="bg-black min-h-svh">`; player container is `aspect-video w-full max-h-svh` centered via flex. Black bars top/bottom only when viewport is taller than `width × 9/16`.
- **D-07:** Chrome-fade postMessage rules — `play` postMessage → fade OUT after **600ms grace**; `pause` postMessage OR pointer-leave-canvas OR idle-3s-while-playing → fade IN immediately. State machine: `'idle' → ('play' + 600ms timer) → 'playing-chrome-faded' → ('pause' OR pointer-leave OR idle-3s) → 'idle'`. Single fade controller; back button + metadata + ContinueReelRail heading all subscribe to ONE opacity getter.
- **D-08:** Metadata BELOW player in normal flow; entire below-player region shares fade state. Mirror `_four/watch/[id]/+page.svelte` content shape verbatim — `<h1>{title}</h1>` + `<CategoryTag category href={base}/work/{slug}>` + `<p>{uploader} · {year}</p>` + optional `<p whitespace-pre-line>{description}</p>` — restyled for cinematic palette. Pure CSS transition.
- **D-09:** Watch route uses `buildEmbedUrl(video, 'play')` from Phase 3 — autoplay with sound. **Cellular policy: bypassed when user explicitly clicks `▷ PLAY REEL` / `▷ PLAY WITH SOUND` OR types/pastes the URL.** Click = consent. iOS LPM still relies on provider's native ▷ overlay (acceptable degradation). NO cellular gate on `/watch/[id]`.

**Continue-the-reel rail (WATCH-03):**
- **D-10:** **Pure CSS `scroll-snap-x mandatory` + `flex` row.** `flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-hide` outer; each `<a>` card is `snap-start`. **NO `embla-carousel-svelte` dep** — embla's drag-on-desktop + dot-indicators not load-bearing; ~10KB cost not justified.
- **D-11:** Card sizing — fractional peek: mobile 1.4, sm 2.4, md 3.4, lg 4.4 cards visible. Aspect-video (16:9) cards via `getPosterFor()`. Sizing: `w-[70vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw]`. Always partial-card on right edge as scroll affordance.
- **D-12:** Heading-is-link (mirror `_four` D-36): `<h2><a href={`${base}/work/${slug}`} data-sveltekit-preload-data="hover">More in {category} →</a></h2>`. ESLint per-file override `svelte/no-navigation-without-resolve`.
- **D-13:** Hide rail when `rail.length === 0` (mirror `_four` D-38). `{#if rail.length > 0}<section>…</section>{/if}`.

**Back-nav scroll restoration (WATCH-05):**
- **D-14:** **Hash-only mechanism — Phase 3's `/work#video={id}` hash write IS the entire state.** NO `history.state` object, NO `mnp_three_*` storage. URL is canonical (consistent with Phase 4 D-13).
- **D-15:** Restoration trigger: `<ReelStage>` `onMount` reads `window.location.hash`, matches video id, calls `scrollIntoView({ block: 'start', behavior: 'auto' })`. **`behavior: 'auto'` NOT `'smooth'`** — instant first paint, no animated scroll noise. If hash absent OR doesn't match a video in current filtered set, no-op and land at top.
- **D-16:** Direct URL paste (`/work#video=1007027015`) behaves identically — hash is source of truth regardless of arrival mode.
- **D-17:** Cross-route arrival also restores when hash matches a video in current filtered set. Hash-matches-in-current-set → restore; else → top.

### Claude's Discretion

- File split for `<WatchPlayer>` vs `<WatchChrome>` vs inline in `/watch/[id]/+page.svelte` — planner's call based on test surface.
- Whether deferred-load mechanism lives inside `<HeroAmbient>` or extracted to `$lib/heroDefer.svelte.ts` rune (Phase 6 ABT-01 ambient bg reuse).
- Hero IntersectionObserver — `runed`'s `useIntersectionObserver` (matches ReelStage pattern) vs inline DIY.
- Gradient stop math (D-05 specifies shape; exact alpha tunable).
- Idle timer impl — `setTimeout` reset on each `pointermove` vs `setInterval` polling. Reset-on-move conventional.
- Pointer-leave detection bounds — player's bounding rect vs whole `<main>`. Bounding rect recommended (more focused trigger).
- WatchPlayer autoplay-blocked recovery — provider's native ▷ overlay (no custom synth).
- VideoObject JSON-LD payload exact shape — mirror `_four/watch/[id]/+page.svelte:41-54`. Phase 7 POL-01 audits.
- Mobile pointer-leave handling — touch devices don't emit `pointerleave` on lift; chrome-fade should also trigger on `touchend` + idle-3s on mobile.
- Back-button label visible "BACK" vs icon-only `←` — palette consistency with Phase 4 chrome.
- Rail cards: `<a>` element (recommended for prefetch/back-nav) vs `<button>` + `goto()`.
- ContinueReelRail accessibility: `<nav>` vs `<section aria-labelledby>` — `<section>` more semantically accurate.

### Deferred Ideas (OUT OF SCOPE for Phase 5)

- `embla-carousel-svelte` dep for the rail (D-10 went pure CSS; reopen if drag-on-desktop becomes a producer complaint).
- Custom share modal beyond `mailto:` (FEAT-V2-03 if `_three` wins).
- `history.state` payload for back-nav (D-14 chose hash-only; reopen if scroll-within-section needed).
- `mnp_three_*` storage for last-viewed video (D-14 rejected; reopen for cross-session resume).
- `▷ START AMBIENT` separate toggle (D-04 single-CTA; reopen if user-testing demands).
- `/about` ambient-loop reuse of `<HeroAmbient>` (Phase 6 ABT-01).
- `/watch/[id]` skeleton loader during iframe mount (poster → iframe is fast enough; reopen on real-device flash).
- In-video deep-link timestamps `?t=<sec>` / `?start=<sec>` — Phase 3 deferred; remains deferred.
- "Up Next" auto-advance on `/watch/[id]` — `_four` doesn't have it; out of scope.
- Hover-to-preview on rail cards — rail is browse signal, not preview.
- `prefers-reduced-data` Chromium-only — deferred.
- Reduced-motion handling on `/watch/[id]` — autoplay is playback not motion-decoration; WCAG 2.3.3 doesn't trigger.
- Back-button gesture for iOS Safari edge-swipe — native browser back; no custom handler.
- Cellular gate on `/watch/[id]` — D-09 rejected; click = consent.
- Skeleton/blur-up placeholder on rail card load — posters are static + content-hashed.
- Sharing-with-timestamp deep-link param — out of scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **HERO-01** | `/` renders `<HeroAmbient />` — Vimeo 264677021 silently muted bg, gradient overlay, name + tagline + `▷ PLAY REEL` centered. Iframe always-mounted-while-visible (D-02 windowing). | Reuses Phase 3 `PreviewLoop` lifecycle + `buildEmbedUrl(video, 'preview')` + `PosterImage` fallback (REEL-04 unified codepath). HeroAmbient owns its OWN IO (D-02). Recipe §1 + §4. |
| **HERO-02** | `↓` scroll-cue invites entry; scrolling past hero reveals first ReelSection of `/work` reel below. | Hero + ReelStage are siblings inside `+page.svelte`; hero occupies `100svh`, ReelStage `100svh - chrome` follows in normal flow. Recipe §2. |
| **HERO-03** | `▷ PLAY REEL` → `/watch/264677021` plays with sound. | User-gesture **sticky activation** persists across SvelteKit client-side navigation (same document); `buildEmbedUrl(video, 'play')` strips muted/loop/background. Pitfall 2 / Finding 2. |
| **WATCH-01** | `/watch/[id]` plays video full-bleed letterboxed on black. Chrome fades on `play` postMessage; back on hover/`pause`. | Existing Vimeo+YouTube adapters route `onPlay`/`onPause` callbacks — BUT current `vimeoAdapter.ts:60-67` only subscribes to `'play'`+`'error'`, NOT `'pause'`. **Phase 5 must extend vimeoAdapter** to also send `addEventListener('pause')`. Recipe §3 + §5. Pitfall 1. |
| **WATCH-02** | Title + uploader + category + year fade in on idle, out on play. | Same opacity controller as D-07 chrome fade. Pure CSS transition on a single `$state` boolean. Recipe §3. |
| **WATCH-03** | `<ContinueReelRail />` horizontal carousel of same-category siblings as poster-only cards. | Pure CSS `scroll-snap-x mandatory` (D-10 — NO embla). Cards consume `getPosterFor(video)`. Recipe §6. |
| **WATCH-04** | 56 `/watch/[id]` routes prerendered via `entries()`. | SvelteKit `EntryGenerator` from `./$types`; `entries = () => videos.map(v => ({ id: v.id }))`. `prerender = true` inherited from `+layout.ts`. Recipe §7. |
| **WATCH-05** | Back-nav from `/watch/[id]` restores reel section. | **Hash-only mechanism (D-14 overrides REQUIREMENTS phrasing)** — Phase 3 ReelStage already writes `${base}/work#video={id}` on snap settle (300ms debounce, `history.replaceState`). Phase 5 ships consumer in ReelStage `onMount`. Recipe §8. Pitfall 3. |

**Note on WATCH-05 wording divergence:** REQUIREMENTS.md and ROADMAP.md both phrase WATCH-05 as "via `history.state` + hash fragment". CONTEXT.md D-14 explicitly chose **hash-only**, no `history.state` payload (consistent with Phase 4 D-13 URL-as-canonical-state principle). The CONTEXT lock is binding; the planner should not introduce `history.state` writes.

</phase_requirements>

---

## Phase Summary

Phase 5 lays the cinematic entry (`/`) and cinematic playback (`/watch/[id]`) surfaces on top of three already-shipped substrates: (a) the Phase 3 iframe-lifecycle pattern (`PreviewLoop` 4-state machine + 5-layer leak defense + `buildEmbedUrl(video, 'preview' | 'play')` + Vimeo/YouTube postMessage adapters), (b) the Phase 3 ReelStage hash-write-on-snap-settle (`${base}/work#video={id}` via `history.replaceState`, 300ms debounce — already live in `ReelStage.svelte:127-130`), and (c) the sibling `_four/src/routes/watch/[id]/{+page.ts,+page.svelte,page.test.ts}` content contract (`entries()` enumerating all 56 ids, `error(404)` on unknown, rail derivation via `getByCategory + filter + toSorted(featured-first, published-desc)`, VideoObject JSON-LD in `<svelte:head>`).

The phase is high-leverage on existing code. Three new components ship (`HeroAmbient.svelte`, `WatchPlayer.svelte`, `ContinueReelRail.svelte`), the splash `+page.svelte` is rewritten, and two new route files mirror `_four` near-verbatim with cinematic restyle. **Two adapter gaps surface during research** and must be addressed in the plan: (i) `vimeoAdapter.ts:60-67` `onLoad` subscribes only to `'play'`+`'error'` — for the watch surface's chrome-fade-on-pause (D-07) to work, the adapter must also send `addEventListener('pause')`; (ii) `buildEmbedUrl(video, 'play')` omits `playsinline=1` (only set in 'preview' mode) — iOS Safari may force full-screen takeover on tap-to-play without it.

**Primary recommendation:** Plan three waves — (1) `/watch/[id]/+page.{ts,svelte,test.ts}` mirroring `_four` near-verbatim + restyle + the two adapter extensions above, (2) `<WatchPlayer>` letterbox + chrome-fade state machine + `<ContinueReelRail />` pure-CSS rail, (3) `<HeroAmbient />` + `/+page.{ts,svelte}` rewrite + ReelStage `onMount` hash-restore consumer (D-15) + e2e suite covering HERO-01..03 + WATCH-01..05 + axe a11y. Tests-first per Phase 3/4 pattern; route load tests in `ui` Vitest project (jsdom env) under the route directory.

---

## Key Findings

### Finding 1 — Vimeo postMessage 'pause' is NOT currently subscribed in the adapter (gap)

**Confidence:** HIGH

**Evidence:**
- `src/lib/iframe/vimeoAdapter.ts:58-67` `onLoad` posts only `{method:'addEventListener',value:'play'}` and `{method:'addEventListener',value:'error'}` — `'pause'` is NOT subscribed.
- `vimeoAdapter.ts:53` `onMsg` switch DOES branch on `event === 'pause'` and call `handlers.onPause?.()` — so the routing is in place; only the subscription is missing.
- Vimeo's raw postMessage protocol requires explicit `addEventListener` subscription per event name; no events fire by default beyond `ready`. Sources: [Vimeo Player API Demo with postMessage](https://codepen.io/jimfu/pen/MwpYmB), [Vimeo Player SDK reference](https://developer.vimeo.com/player/sdk/reference).

**Implication for Phase 5:** WatchPlayer's D-07 fade controller subscribes to `onPause` (fade back IN on pause). If we don't extend the adapter, the `onPause` handler will never fire on Vimeo videos — chrome will fade out on play and never fade back in unless the user moves the pointer or idle-3s elapses (the OTHER fade-in triggers). The bug is silent: testers without long pause-and-wait sequences won't catch it.

**Recommended fix:** Plan a small task in Wave 1 to extend `vimeoAdapter.ts` `onLoad` with two more posts: `{method:'addEventListener',value:'pause'}` and the matching `{method:'removeEventListener',value:'pause'}` in `dispose()`. YouTube's adapter already handles state-change events (`onStateChange info=2` maps to pause) — no YouTube adapter change needed. Add a unit test asserting both `addEventListener` posts fire on iframe `load`.

---

### Finding 2 — User-gesture sticky activation persists across SvelteKit client-side navigation (HERO-03)

**Confidence:** HIGH (spec-level for sticky activation; HIGH at protocol level for Vimeo/YouTube autoplay-with-sound after click)

**Evidence:**
- HTML spec defines two user-activation states: **transient activation** (~5s after each gesture) and **sticky activation** (one-way flag: false → true on first gesture, stays true until page unload). Source: [MDN UserActivation](https://developer.mozilla.org/en-US/docs/Web/API/UserActivation), [HTML Living Standard §UserActivation](https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation).
- Chrome's autoplay policy: "Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)" Source: [Chrome autoplay blog](https://developer.chrome.com/blog/autoplay/).
- Mozilla's gecko-internal note: "Once the page has been activated by user gestures, then we would not block any autoplay anymore. That's why it's called `sticky`, because the activation would keep until a user refreshes the page or leaves the page." Source: [Mozilla Media/block-autoplay](https://wiki.mozilla.org/Media/block-autoplay).
- SvelteKit client-side navigation (`<a href>` with default prefetch, or `goto()`) does NOT reload the page — it patches the DOM in place. The document object is unchanged; sticky activation flag stays true.
- Chrome 124 March 2026 update tightened policy to require **direct unbroken user gesture** for sound. The `▷ PLAY REEL` `<a>` click IS that gesture; the navigation patches the watch page DOM and the new iframe is appended in the same task as the gesture's microtask queue.

**Implication for Phase 5:** HERO-03 ✓ works as designed. When user clicks `▷ PLAY REEL` on `/` → SvelteKit transitions to `/watch/264677021` → `<WatchPlayer>` mounts iframe with `buildEmbedUrl(video, 'play')` (autoplay=1, NO mute) → Vimeo/YouTube autoplay-with-sound succeeds because user-gesture sticky activation is set on the document.

**Caveats (PITFALL):**
- **Direct URL paste** to `/watch/264677021` (no prior click on origin) creates a fresh page load with NO sticky activation. Vimeo/YouTube will block autoplay-with-sound and overlay their native ▷ button. D-09 explicitly accepts this degradation ("Direct URL paste to `/watch/[id]` (no click) ALSO autoplays — the URL itself is the action"). The recovery UX is the provider's native overlay — Plan does NOT synthesize custom controls.
- **iOS Low Power Mode** can override even valid user-gesture autoplay (`play()` rejection at the WebKit layer). D-09 accepts this; provider native ▷ overlay is the recovery.

---

### Finding 3 — Hash-only restoration (D-14) overrides REQUIREMENTS phrasing

**Confidence:** HIGH

**Evidence:**
- `.planning/REQUIREMENTS.md:55` phrases WATCH-05 as "Back-nav from `/watch/[id]` restores the user to the same section they came from (via `history.state` + hash fragment on entry)".
- `.planning/phases/05-hero-watch/05-CONTEXT.md` D-14 explicitly rejects `history.state`: "**Hash-only mechanism — Phase 3's `/work#video={id}` hash write IS the entire state.** No `history.state` object, no `mnp_three_*` storage."
- Phase 3 already implements the hash write in `src/lib/components/ReelStage.svelte:127-130`: `history.replaceState(null, '', \`${base}/work#video=${currentId}\`)` debounced 300ms on snap settle.
- Phase 4 D-13 (Wayfinding): "URL is canonical source of state, no parallel store" — D-14 extends this principle. Adding `history.state` would create a parallel state surface that drifts from the URL.

**Implication for Phase 5:** The planner MUST follow D-14 (hash-only). Do NOT write to `history.state` from `▷ PLAY WITH SOUND` clicks or from the `<WatchPlayer>` mount. The Phase 3 hash-write is the sole producer; Phase 5 ships only the consumer in `<ReelStage>` `onMount`.

**Caveat on restoration timing:** ReelStage's `sectionRefs` array binds via `bind:this` per-`<article>` in the `{#each}` block — refs populate **after** the first paint. The naive `onMount(() => { ...scrollIntoView })` runs before refs are populated. Two safe patterns:
- (a) `onMount(async () => { await tick(); ...read hash, scrollIntoView })` — `tick()` waits for one Svelte microtask flush so refs bind.
- (b) `$effect(() => { if (sectionRefs.length === videos.length && !restoredOnce) { ...; restoredOnce = true; } })` — fires once refs are fully bound.

CONTEXT.md D-15 flags this: "may need a `tick()` await or a `$effect` that fires once `sectionRefs.length === videos.length`". Recommend pattern (b) — the `$effect` automatically re-runs once refs are bound and is robust against future filter-narrowing (Phase 4 /work/[category]).

---

### Finding 4 — `entries()` for 56-route prerender is fully supported under adapter-static

**Confidence:** HIGH

**Evidence:**
- SvelteKit docs ([Page options — entries](https://svelte.dev/docs/kit/page-options#entries)): `EntryGenerator` is `() => Promise<Array<Record<string, any>>> | Array<Record<string, any>>`. Each entry object's keys must match the dynamic route parameter names.
- The exact pattern is already shipped in `_three` for `/work/[category]/+page.ts:26-27`: `export const entries: EntryGenerator = () => CATEGORIES.map((c) => ({ category: categoryToSlug(c) }));` — confirmed live in production.
- Sibling `_four/src/routes/watch/[id]/+page.ts:22` ships the verbatim target: `export const entries: EntryGenerator = () => videos.map((v) => ({ id: v.id }));`.
- `prerender = true` is inherited from `_three/src/routes/+layout.ts:3` — `/watch/[id]/+page.ts` does NOT need to redeclare it. (Phase 2 carry-forward; matches `_four`'s pattern.)
- `adapter-static` with `strict: true` (sibling config) fails the build if any reachable route is not prerenderable — `entries()` is mandatory for `/watch/[id]/...`.
- 56 entries map to 56 prerendered HTML files: `build/watch/<id>/index.html`.

**Implication for Phase 5:** Copy `_four/src/routes/watch/[id]/+page.ts` near-verbatim. The only differences should be: `import { base } from '$app/paths'` is not needed at the route level (it's a `+page.svelte` import). Comments adapt for `_three`'s Phase 5 D-31/D-32/D-36 IDs (which match `_four`'s same IDs by structural parity).

**Build-time only:** `entries()` runs during prerender (build time). In dev, SvelteKit serves dynamic routes via on-demand SSR; `entries()` is consulted only when crawler reaches the route. No runtime cost.

---

### Finding 5 — SSR-safe iframe pattern: the `+page.svelte` is safe to prerender because the iframe is wrapped in a Svelte 5 component whose `$effect` runs only in the browser

**Confidence:** HIGH

**Evidence:**
- Phase 3's `PreviewLoop.svelte` is prerendered safely on `/work` and `/work/[category]` — the iframe markup is emitted as static HTML, the `$effect` block (which attaches postMessage listeners, manages handshake timeout) runs only at hydration in the browser. Already verified in production.
- The shipped pattern (PreviewLoop.svelte:158-170): `{#if lifecycle === 'mounted-loading' || lifecycle === 'mounted-playing'}<iframe src={buildEmbedUrl(video, 'preview')} … />{/if}` — `lifecycle` starts at `'mounted-loading'` so the iframe IS emitted in prerendered HTML. The iframe `src` is a pure string from `buildEmbedUrl()` — no DOM, no window.
- SvelteKit guidance: "Time-sensitive or browser-only logic is deferred using `onMount` … modules that depend on browser-only globals (e.g., `window`, `document`) can break SSR builds if not properly guarded." `$effect` is the runes-era equivalent — runs only after client hydration.
- The `<iframe src="https://player.vimeo.com/video/...">` HTML element itself is pure markup; the browser only initiates the iframe request when it parses the HTML at hydration. Prerender just emits the string.

**Implication for Phase 5:** Both `<HeroAmbient>` (which wraps `<PreviewLoop>` or replicates its lifecycle) and `<WatchPlayer>` (which mounts a direct iframe with postMessage handlers) are safe to prerender. The iframe `src` will be in the prerendered HTML; the postMessage listeners only attach at hydration time via `$effect`. Zero SSR risk.

**One nuance:** if `<HeroAmbient>` uses the deferred-load mechanism (D-03 — poster first, iframe after rIC/timer/interaction), the **prerendered HTML contains only the poster**. The iframe is appended client-side. This is correct and load-bearing for POL-02 LCP — the prerendered HTML is poster-only, so first paint is poster-only.

---

### Finding 6 — Pure CSS scroll-snap-x is locked over Embla (D-10); horizontal pattern is fully supported in all target browsers

**Confidence:** HIGH

**Evidence:**
- CONTEXT.md D-10 explicitly rejects `embla-carousel-svelte`: "embla's drag-on-desktop + dot-indicator features aren't load-bearing for a sibling-discovery rail; the ~10KB cost isn't justified."
- Pure CSS `scroll-snap-x` is universally supported in target browsers (iOS Safari 16+, Chrome/Edge/Firefox current per PROJECT.md). Same primitive as the vertical reel snap, rotated 90°.
- `flex flex-row overflow-x-auto snap-x snap-mandatory` outer + `flex-none snap-start` per card is the canonical Tailwind v4 idiom. Native iOS momentum scroll comes for free; touch drag works for free; keyboard arrow-key scroll works for free (browser native).
- `scrollbar-hide` utility (Tailwind v4 native via `@theme` keyword or a one-liner CSS plugin) hides the visual scrollbar on Chrome/Firefox; iOS Safari shows it briefly during scroll then auto-hides per platform default.

**Implication for Phase 5:** Plan ships `<ContinueReelRail>` with zero new dependencies. No `embla-carousel-svelte` import. Card sizing per D-11: `w-[70vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw]` produces the fractional-peek (1.4/2.4/3.4/4.4 cards visible) effect via viewport-percentage widths.

**Note on objective phrasing:** The initial-prompt objective mentions "Embla 8.6 for horizontal carousel (ContinueReelRail's the canonical use case)" — this contradicts CONTEXT.md D-10. CONTEXT.md is the lock; the planner does NOT install Embla in Phase 5.

---

### Finding 7 — `100svh` is the locked viewport unit for hero (already proven in ReelStage)

**Confidence:** HIGH

**Evidence:**
- Phase 3 `ReelStage.svelte:218,228` already uses `h-[calc(100svh-…)]` for both the outer container and per-section heights. POL-03 verified zero CLS on poster→iframe swap.
- `100svh` (small viewport height) = viewport with browser chrome **visible**. Stays stable as iOS Safari address bar collapses on scroll → scroll-snap doesn't recalculate → no jank.
- `100vh` overflows by ~80px on iOS Safari first-paint (chrome shown but `vh` reports chrome-hidden), causing layout shift on first scroll. **Avoid for hero.**
- `100dvh` (dynamic) resizes constantly as the address bar animates — fights scroll-snap timing. **Avoid for hero.**
- Source verified: [WebKit bug 261185 `svh`/`dvh` behavior](https://bugs.webkit.org/show_bug.cgi?id=261185); CLAUDE.md research dossier table.

**Implication for Phase 5:** `<HeroAmbient>` uses `min-h-svh` (or `h-svh`). Watch route outer `<div class="bg-black min-h-svh">` per D-06 follows same rule. The hero overlay text + CTA fits inside the safe area; on iOS Safari with browser chrome visible the entire hero is visible without scroll.

---

### Finding 8 — Letterbox math: `aspect-video w-full max-h-svh` centered via flex inside `bg-black`

**Confidence:** HIGH

**Evidence:**
- HTML `<iframe>` has NO `object-fit` (the property only applies to replaced elements like `<img>` and `<video>`). MDN [object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) confirms.
- Standard letterbox technique: aspect-ratio container clamped by both width AND height; flex centering on outer black canvas. Tailwind v4 utilities: `aspect-video` (16:9 built-in per Tailwind v4 release notes), `w-full max-h-svh`, outer `flex items-center justify-center bg-black min-h-svh`.

**Recipe:** Exact class string in Recipe §3.

**Behavior:**
- Wide viewports (W > H × 16/9): aspect-video container hits `max-h-svh` first → player is `height=100svh width=H×16/9`. Black bars left+right? No — `w-full` on a wider-than-16:9 container would force overflow; but with `max-h-svh` the height clamp wins. To get vertical letterbox bars on tall viewports as D-06 specifies: this works correctly because `aspect-video` with `w-full` sizes to width, then `max-h-svh` shrinks to fit height if needed. On portrait phones (W < H × 16/9), the player fills the width and bars appear ABOVE/BELOW (black `flex items-center justify-content` parent fills the remaining height with `bg-black`).
- On wide monitors (W > H × 16/9), the `w-full` would overflow vertically without `max-h-svh`; with `max-h-svh` the player shrinks proportionally and small black bars appear LEFT+RIGHT inside the flex container.

D-06 reads ambiguously between "letterbox top/bottom" and "pillarbox left/right". The technique handles both axes correctly — on tall viewports the natural orientation is letterbox (bars top/bottom); on wide viewports it's pillarbox (bars left/right). Both are visually "letterbox-on-black".

---

### Finding 9 — Hero IntersectionObserver: dedicated to HeroAmbient, NOT shared with ReelStage

**Confidence:** HIGH

**Evidence:**
- CONTEXT.md D-02 explicitly: "A dedicated IntersectionObserver inside `<HeroAmbient>` (NOT shared with the ReelStage observer below — they own separate viewports + different windowing rules)".
- ReelStage's IO watches `sectionRefs[]` (56 articles) with `rootMargin: '100% 0%'` and `threshold: [0, 0.5, 1]` — designed for the ±1 windowing.
- Hero's IO watches a single element (the hero section root) with simpler config: `threshold: [0, 0.1]` (Claude's discretion). When `intersectionRatio === 0`, hero unmounts iframe to poster (preserving Phase 3 peak-3 budget).
- `runed`'s `useIntersectionObserver` (already used in ReelStage) is the recommended impl. Single-element + single-observer is the simplest case; the runed wrapper handles `$effect.root` cleanup automatically.

**Implication for Phase 5:** `<HeroAmbient>` imports `useIntersectionObserver` from `runed` independently. Two separate observers in the DOM at the same time on `/` — one for hero, one for the reel below. No shared state; no context bridge needed.

---

### Finding 10 — Hero + Watch iframes must consume the menu-pause bridge (Phase 4 D-08 plumbing)

**Confidence:** MEDIUM-HIGH

**Evidence:**
- Phase 4 D-08 bridge: `documentHidden = pageHidden || menu.menuOpen` $derived in ReelStage. Opening mobile menu pauses every within-window PreviewLoop via `reel:visibility` context.
- CONTEXT.md `<code_context>`: "Phase 4 D-08 bridge: `menu.menuOpen` getter; Hero + Watch iframes should pause when this flips true (consistent with reel pause). Planner verifies the wiring extends — likely via the same `documentHidden = pageHidden || menu.menuOpen` `$derived` already in `ReelStage`, surfaced into HeroAmbient + WatchPlayer."
- The current `reel:visibility` context is set BY `<ReelStage>` and consumed by `<PreviewLoop>`. `<HeroAmbient>` is a SIBLING of `<ReelStage>` on `/` (not a child) — it won't see the context.
- `<WatchPlayer>` lives on `/watch/[id]` which has NO `<ReelStage>` — context is missing entirely.

**Implication for Phase 5:** Two options:
1. **Hoist the visibility broadcast to the layout level.** Add a top-level `pageVisibility` rune (`$lib/state/visibility.svelte.ts`) that combines `document.hidden` + `menu.menuOpen`. Both ReelStage AND HeroAmbient AND WatchPlayer subscribe to the same source-of-truth rune. ReelStage's existing `setContext('reel:visibility', …)` is preserved for PreviewLoop consumers but its writer migrates to the rune.
2. **Per-component IO + Page Visibility listener.** Each of HeroAmbient + WatchPlayer attaches its own `visibilitychange` listener + reads `menu.menuOpen`. Simple but duplicates code.

Recommend option 1 — single rune subscribed by all video iframes. Aligns with the Phase 3/4 module-scope-rune pattern (`motion`, `network`, `scrollIdle`, `menu`).

This is MEDIUM-confidence because the planner has discretion (CONTEXT.md flags this as "Planner verifies the wiring extends"). Either option is correct; option 1 is cleaner.

---

### Finding 11 — `buildEmbedUrl(video, 'play')` correctly produces autoplay-with-sound URL but lacks `playsinline=1`

**Confidence:** HIGH

**Evidence:**
- `src/lib/iframe/url.ts:50-80`: `'play'` mode for Vimeo emits `https://player.vimeo.com/video/{id}?autoplay=1&dnt=1` — no `muted`, no `loop`, no `background`. Correct for sound-on playback.
- `'play'` mode for YouTube emits `https://www.youtube-nocookie.com/embed/{id}?autoplay=1&modestbranding=1&iv_load_policy=3&enablejsapi=1` — no `mute`, no `loop`, no `playlist`. Correct for sound-on playback.
- **`playsinline=1` is set ONLY in `'preview'` mode** (Vimeo line 61; YouTube line 76). The 'play' mode omits it.
- iOS Safari 16/17.0/17.1 historically required `playsinline=1` to prevent the video from taking over the full screen on tap-to-play. This is documented in CLAUDE.md as Pitfall 1 mitigation in the reel context.
- For the `/watch/[id]` use case (D-06 letterbox on full black), a full-screen takeover is arguably DESIRED on tap-to-play — the user explicitly wants to watch the video. But the iframe-driven postMessage chrome-fade depends on the iframe staying in the document; if iOS Safari opens a new full-screen player, postMessage events may not reach the parent window.

**Implication for Phase 5 (MEDIUM-confidence question):** Should `'play'` mode also include `playsinline=1`?
- If YES: the iframe stays in-document; chrome-fade postMessage works on iOS; users tap into the embed and watch within the letterboxed canvas. **Recommended.**
- If NO: iOS Safari may detach to fullscreen on play; the chrome-fade controller never receives postMessage events because the iframe is no longer the active window; but the cinematic immersion is automatic.

The watch-page UX (full-bleed letterboxed embed with chrome-fade) is incompatible with iOS Safari fullscreen takeover. **Recommend adding `playsinline=1` to 'play' mode in `url.ts`.** This is a small modification to a Phase 3-locked file — flag clearly to the planner.

Counter-evidence: Vimeo's docs note `playsinline=1` only matters on iOS; on desktop/Android it's a no-op. Adding it is low-risk.

---

## Validation Architecture

> Included per `.planning/config.json` `workflow.nyquist_validation: true`. Inherits Phase 3/4 test infrastructure verbatim.

### Test Framework

| Property | Value |
|----------|-------|
| **Framework** | `vitest@4.1.5` (data + ui project split) + `@playwright/test@1.60.0` (e2e, 3 browsers: Chromium/WebKit/Firefox) + `@axe-core/playwright@4.11.3` (a11y) + `@testing-library/svelte@5.3.1` (component query helpers) |
| **Config file** | `vite.config.ts` (Vitest two-project split, established Phase 1/2) + `playwright.config.ts` (locked Phase 1) |
| **Quick run command** | `pnpm test` (Vitest only — typical < 30s) |
| **Full suite command** | `pnpm test && pnpm test:e2e` |
| **Estimated runtime** | ~30s Vitest + ~3-5min Playwright (3-browser cross-check) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HERO-01 | HeroAmbient renders poster + iframe (after defer) + overlay | unit (ui) | `pnpm test src/lib/components/HeroAmbient.svelte.test.ts -t "renders overlay"` | ❌ W0 |
| HERO-01 | HeroAmbient fallback codepath under reduced-motion | unit (ui) | `pnpm test src/lib/components/HeroAmbient.svelte.test.ts -t "fallback"` | ❌ W0 |
| HERO-01 | HeroAmbient unmounts iframe when scrolled off-screen (D-02) | unit (ui) | `pnpm test src/lib/components/HeroAmbient.svelte.test.ts -t "unmount off-screen"` | ❌ W0 |
| HERO-01 | Deferred-load mechanism (D-03 rIC + timer + pointer) | unit (ui) | `pnpm test src/lib/components/HeroAmbient.svelte.test.ts -t "defer mount"` | ❌ W0 |
| HERO-01,02 | `/` composes hero + reel; first ReelSection visible on scroll | e2e | `pnpm test:e2e tests/e2e/hero.spec.ts -g "scroll past hero"` | ❌ W0 |
| HERO-03 | `▷ PLAY REEL` navigates to `/watch/264677021` | e2e | `pnpm test:e2e tests/e2e/hero.spec.ts -g "PLAY REEL"` | ❌ W0 |
| HERO-03 | Sound-on autoplay on `/watch/264677021` after click (sticky activation) | e2e (Chromium only — Vimeo embed acks `play` postMessage observable) | `pnpm test:e2e tests/e2e/hero.spec.ts -g "sound after navigation"` | ❌ W0 |
| WATCH-01 | Player letterbox math: 16:9 inside bg-black | unit (ui) | `pnpm test src/lib/components/WatchPlayer.svelte.test.ts -t "letterbox"` | ❌ W0 |
| WATCH-01 | Chrome fades 600ms after `play` postMessage (D-07) | unit (ui) | `pnpm test src/lib/components/WatchPlayer.svelte.test.ts -t "fade on play"` | ❌ W0 |
| WATCH-01 | Chrome fades back in on `pause` postMessage | unit (ui) | `pnpm test src/lib/components/WatchPlayer.svelte.test.ts -t "fade on pause"` | ❌ W0 |
| WATCH-01 | Vimeo adapter subscribes to `pause` event (gap fix from Finding 1) | unit (data) | `pnpm test src/lib/iframe/vimeoAdapter.test.ts -t "pause subscription"` | ❌ W0 |
| WATCH-01 | Chrome fades in on idle-3s while playing | unit (ui) | `pnpm test src/lib/components/WatchPlayer.svelte.test.ts -t "idle-3s"` | ❌ W0 |
| WATCH-01 | Chrome fades in on pointer-leave | unit (ui) | `pnpm test src/lib/components/WatchPlayer.svelte.test.ts -t "pointer leave"` | ❌ W0 |
| WATCH-01,02 | Full chrome-fade flow on real provider | e2e | `pnpm test:e2e tests/e2e/watch.spec.ts -g "chrome fade"` | ❌ W0 |
| WATCH-02 | Metadata (h1, CategoryTag, uploader · year, description) renders | unit (ui) | `pnpm test src/routes/watch/[id]/page.test.ts -t "metadata"` | ❌ W0 |
| WATCH-03 | ContinueReelRail scroll-snap-x markup contract | unit (ui) | `pnpm test src/lib/components/ContinueReelRail.svelte.test.ts -t "scroll-snap"` | ❌ W0 |
| WATCH-03 | Rail heading-is-link with categoryToSlug href (D-12) | unit (ui) | `pnpm test src/lib/components/ContinueReelRail.svelte.test.ts -t "heading link"` | ❌ W0 |
| WATCH-03 | Rail hidden when empty (D-13) | unit (ui) | `pnpm test src/lib/components/ContinueReelRail.svelte.test.ts -t "hide empty"` | ❌ W0 |
| WATCH-03 | Rail scrolls horizontally; cards link to /watch/[id] | e2e | `pnpm test:e2e tests/e2e/watch.spec.ts -g "rail"` | ❌ W0 |
| WATCH-04 | `entries()` returns 56 entries (matches `_four` test verbatim) | unit (data — route project glob) | `pnpm test src/routes/watch/[id]/page.test.ts -t "entries"` | ❌ W0 |
| WATCH-04 | `load()` returns video + rail for valid id | unit (data) | `pnpm test src/routes/watch/[id]/page.test.ts -t "valid id"` | ❌ W0 |
| WATCH-04 | `load()` throws 404 for unknown id (async signature load-bearing) | unit (data) | `pnpm test src/routes/watch/[id]/page.test.ts -t "unknown id"` | ❌ W0 |
| WATCH-04 | Rail filter + sort (featured-first, published-desc, current id excluded) | unit (data) | `pnpm test src/routes/watch/[id]/page.test.ts -t "rail"` | ❌ W0 |
| WATCH-04 | Sample of prerendered routes builds: 264677021 + 3 others | e2e (after `pnpm build`) | `pnpm test:e2e tests/e2e/watch.spec.ts -g "prerender"` | ❌ W0 |
| WATCH-05 | Hash write on snap settle (Phase 3 — already shipped, regression test) | e2e | `pnpm test:e2e tests/e2e/restore.spec.ts -g "hash write"` | ⚠️ partial — Phase 3 has unit, e2e missing |
| WATCH-05 | Back-nav from /watch/[id] restores scroll position | e2e | `pnpm test:e2e tests/e2e/restore.spec.ts -g "back nav"` | ❌ W0 |
| WATCH-05 | Direct paste with hash restores position | e2e | `pnpm test:e2e tests/e2e/restore.spec.ts -g "direct paste"` | ❌ W0 |
| WATCH-05 | Cross-route hash carry-over (/watch → "More in" → /work/[cat]) | e2e | `pnpm test:e2e tests/e2e/restore.spec.ts -g "cross route"` | ❌ W0 |
| WATCH-05 | Hash-not-in-set ignore (graceful fall-back to top) | e2e | `pnpm test:e2e tests/e2e/restore.spec.ts -g "ignore foreign hash"` | ❌ W0 |
| (NAV-03 fwd-ship) | axe-core WCAG AA pass on `/` and `/watch/[id]` | e2e | `pnpm test:e2e tests/e2e/hero.spec.ts -g "axe"` + `tests/e2e/watch.spec.ts -g "axe"` | ❌ W0 |

### Sampling Rate

- **Per task commit:** `pnpm test` (Vitest unit + component, < 30s)
- **Per wave merge:** `pnpm test && pnpm test:e2e` (3-browser cross-check, ~3-5min)
- **Phase gate (`/gsd:verify-work`):** full suite green; staging build deployed; axe-core 0 violations on `/` and `/watch/[id]` (sampled across all 56 prerendered routes)

### Wave 0 Gaps

**Components to be built (no existing file):**
- [ ] `src/lib/components/HeroAmbient.svelte` — covers HERO-01, HERO-02 (composition)
- [ ] `src/lib/components/HeroAmbient.svelte.test.ts` — covers HERO-01 + defer + fallback + unmount-off-screen
- [ ] `src/lib/components/WatchPlayer.svelte` — covers WATCH-01, WATCH-02
- [ ] `src/lib/components/WatchPlayer.svelte.test.ts` — covers WATCH-01 + WATCH-02 + fade state machine
- [ ] `src/lib/components/ContinueReelRail.svelte` — covers WATCH-03
- [ ] `src/lib/components/ContinueReelRail.svelte.test.ts` — covers WATCH-03 + scroll-snap + heading-link + hide-empty

**Routes to be built:**
- [ ] `src/routes/+page.ts` — load returns `{ videos }` from `$lib/data` (mirror `/work/+page.ts:11-18`)
- [ ] `src/routes/+page.svelte` (REWRITE) — composes `<HeroAmbient />` + `<ReelStage videos={data.videos} />`
- [ ] `src/routes/watch/[id]/+page.ts` — near-verbatim from `_four`; `entries()` + load() + rail derivation
- [ ] `src/routes/watch/[id]/+page.svelte` — composes `<WatchPlayer video={data.video} />` + metadata + `<ContinueReelRail rail={data.rail} category={data.video.category} />`; VideoObject JSON-LD in `<svelte:head>`
- [ ] `src/routes/watch/[id]/page.test.ts` — copy `_four`'s entries() + load() tests verbatim (5 tests)

**Existing file extensions:**
- [ ] `src/lib/iframe/vimeoAdapter.ts` — extend `onLoad` to also send `addEventListener('pause')` (Finding 1)
- [ ] `src/lib/iframe/vimeoAdapter.test.ts` — assert pause subscription posts on iframe load
- [ ] `src/lib/iframe/url.ts` — add `playsinline=1` to `'play'` mode for both Vimeo and YouTube (Finding 11; MEDIUM-confidence, surface for plan decision)
- [ ] `src/lib/iframe/url.test.ts` — update 'play' mode snapshot tests
- [ ] `src/lib/components/ReelStage.svelte` — extend with `$effect` for D-15 hash-restoration (consumer side)
- [ ] `src/lib/components/ReelStage.test.ts` — add hash-restore restoration test

**Optional (Claude's discretion per CONTEXT):**
- [ ] `src/lib/heroDefer.svelte.ts` — extract D-03 defer mechanism into shared rune (if Phase 6 ABT-01 will reuse)
- [ ] `src/lib/state/visibility.svelte.ts` — lift menu-pause bridge to layout-scope rune (Finding 10, option 1)

**E2E test files:**
- [ ] `tests/e2e/hero.spec.ts` — HERO-01..03, defer-load mechanism, fallback codepath, axe
- [ ] `tests/e2e/watch.spec.ts` — WATCH-01..05, chrome-fade flow, prerender sample, axe
- [ ] `tests/e2e/restore.spec.ts` — hash write/read, back-nav, cross-route, direct paste, ignore foreign hash

**Framework install:** NONE — all deps in `node_modules` from Phase 1 (CONTEXT.md D-10 locks out `embla-carousel-svelte`).

---

## Implementation Recipes

### Recipe §1 — HeroAmbient skeleton (HERO-01)

```svelte
<!-- src/lib/components/HeroAmbient.svelte -->
<script lang="ts">
  /* eslint-disable svelte/no-navigation-without-resolve */
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { useIntersectionObserver } from 'runed';
  import { producerReelId, getById } from '$lib/data';
  import { motion } from '$lib/state/motion.svelte';
  import { network } from '$lib/state/network.svelte';
  import PreviewLoop from './PreviewLoop.svelte';
  import PosterImage from './PosterImage.svelte';
  import { getPosterFor } from '$lib/data/posters';

  const video = getById(producerReelId);
  if (!video) throw new Error('producer reel video missing from $lib/data');

  // D-02: own IO for this single element, INDEPENDENT of ReelStage.
  let heroEl = $state<HTMLElement | null>(null);
  let isOnScreen = $state(true);

  // D-04: REEL-04 unified codepath (same triggers, same gate).
  let autoplayFailedFromHero = $state(false);
  const shouldShowPoster = $derived(
    motion.prefersReducedMotion || network.isCellularLike || autoplayFailedFromHero
  );

  // D-03: deferred-load — poster first; iframe after whichever fires first:
  //   requestIdleCallback({ timeout: 1000 }) | setTimeout(1000) | first pointer interaction
  let shouldMountIframe = $state(false);

  onMount(() => {
    if (shouldShowPoster) return; // poster-only — never schedule the iframe
    const triggers: Array<() => void> = [];
    let fired = false;
    const fire = (): void => { if (fired) return; fired = true; shouldMountIframe = true; triggers.forEach(t => t()); };
    // rIC + setTimeout (Safari fallback)
    const ricId = typeof requestIdleCallback === 'function'
      ? requestIdleCallback(() => fire(), { timeout: 1000 })
      : null;
    const tId = setTimeout(fire, 1000);
    triggers.push(() => { if (ricId !== null) cancelIdleCallback(ricId); clearTimeout(tId); });
    // Pointer interaction triggers — first event fires the mount.
    const handler = (): void => fire();
    for (const ev of ['pointerdown', 'wheel', 'touchstart', 'scroll'] as const) {
      window.addEventListener(ev, handler, { passive: true, once: true });
      triggers.push(() => window.removeEventListener(ev, handler));
    }
    return () => triggers.forEach(t => t());
  });

  // D-02: when hero scrolls fully off-screen (intersectionRatio === 0), unmount iframe.
  useIntersectionObserver(
    () => heroEl,
    (entries) => { isOnScreen = entries.some(e => e.isIntersecting); },
    { threshold: [0, 0.1] }
  );

  // Compose final gate: iframe mounts only when (on-screen AND defer-fired AND no fallback).
  const mountIframe = $derived(isOnScreen && shouldMountIframe && !shouldShowPoster);

  const posterUrl = `${base}${getPosterFor(video)}`;
</script>

<svelte:head>
  <link rel="preload" as="image" href={posterUrl} fetchpriority="high" />
</svelte:head>

<section bind:this={heroEl} class="relative h-svh w-full overflow-hidden bg-neutral-950">
  <!-- Layer 1: poster (LCP first paint) -->
  <img
    src={posterUrl}
    alt=""
    loading="eager"
    fetchpriority="high"
    class="absolute inset-0 h-full w-full object-cover"
  />

  <!-- Layer 2: iframe (deferred; only when mountIframe is true) -->
  {#if mountIframe}
    <div class="absolute inset-0">
      <PreviewLoop {video} onautoplayfailed={() => { autoplayFailedFromHero = true; }} />
    </div>
  {/if}

  <!-- Layer 3: D-05 two-stop gradient overlay (top + bottom darken; center clear) -->
  <div
    class="pointer-events-none absolute inset-0"
    style="background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%);"
    aria-hidden="true"
  ></div>

  <!-- Layer 4: content stack — centered MICHELLE NGO + tagline + PLAY REEL CTA -->
  <div class="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
    <h1 class="font-display text-5xl font-semibold tracking-[0.2em] text-neutral-50 md:text-7xl">
      MICHELLE NGO
    </h1>
    <p class="font-sans text-sm tracking-wide text-neutral-200 md:text-base">
      Filmmaker &amp; Producer
    </p>
    <a
      href={`${base}/watch/${producerReelId}`}
      data-sveltekit-preload-data="hover"
      class="inline-flex items-center gap-2 rounded-full border border-neutral-50 px-6 py-3 font-sans text-sm tracking-widest uppercase text-neutral-50 hover:bg-neutral-50 hover:text-neutral-950 motion-safe:transition-colors"
    >
      ▷ PLAY REEL
    </a>
  </div>

  <!-- Layer 5: D-05 scroll cue -->
  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-50/60" aria-hidden="true">
    <span class="text-2xl">↓</span>
  </div>
</section>
```

---

### Recipe §2 — `+page.ts` and `+page.svelte` composition (HERO-01, HERO-02)

```ts
// src/routes/+page.ts
import { videos } from '$lib/data';
import type { PageLoad } from './$types';

// prerender = true inherited from src/routes/+layout.ts:3
export const load: PageLoad = () => ({ videos });
```

```svelte
<!-- src/routes/+page.svelte — REPLACES Phase 1 splash entirely (D-01) -->
<script lang="ts">
  import HeroAmbient from '$lib/components/HeroAmbient.svelte';
  import ReelStage from '$lib/components/ReelStage.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Michelle Ngo — Filmmaker</title>
  <meta name="description" content="Michelle Ngo — Filmmaker. Cinematic reel and select works." />
</svelte:head>

<HeroAmbient />
<ReelStage videos={data.videos} />
```

---

### Recipe §3 — WatchPlayer letterbox + chrome-fade state machine (WATCH-01, WATCH-02)

```svelte
<!-- src/lib/components/WatchPlayer.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Video } from '$lib/data';
  import { buildEmbedUrl } from '$lib/iframe/url';
  import { attachVimeo, type VimeoHandlers } from '$lib/iframe/vimeoAdapter';
  import { attachYouTube, type YouTubeHandlers } from '$lib/iframe/youtubeAdapter';

  let { video }: { video: Video } = $props();

  let iframeEl = $state<HTMLIFrameElement | null>(null);
  let canvasEl = $state<HTMLElement | null>(null);

  // D-07 fade state machine: 'idle' → 'playing' (after play + 600ms grace) → 'idle' (pause/leave/idle-3s)
  let isPlaying = $state(false);
  let chromeFaded = $state(false);
  let playGraceTimer: ReturnType<typeof setTimeout> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const FADE_GRACE_MS = 600; // D-07
  const IDLE_FADE_MS = 3000; // D-07

  function fadeOut(): void {
    clearTimeout(playGraceTimer);
    playGraceTimer = setTimeout(() => { chromeFaded = true; }, FADE_GRACE_MS);
  }
  function fadeIn(): void {
    clearTimeout(playGraceTimer);
    chromeFaded = false;
    resetIdleTimer();
  }
  function resetIdleTimer(): void {
    clearTimeout(idleTimer);
    if (isPlaying) {
      idleTimer = setTimeout(() => { chromeFaded = true; }, IDLE_FADE_MS);
    }
  }

  // Pointer-leave detection on the canvas bounding rect (D-07).
  function onPointerMove(): void { fadeIn(); }
  function onPointerLeave(): void { if (isPlaying) chromeFaded = true; }
  function onTouchEnd(): void { fadeIn(); /* mobile: re-arm idle timer */ }

  $effect(() => {
    if (!iframeEl) return;
    const handlers: VimeoHandlers & YouTubeHandlers = {
      onReady: () => { /* no-op — autoplay-with-sound is the URL contract */ },
      onPlay: () => { isPlaying = true; fadeOut(); resetIdleTimer(); },
      onPause: () => { isPlaying = false; fadeIn(); },
      onError: () => { /* provider will overlay its native ▷ — no synth */ },
    };
    const dispose =
      video.source === 'vimeo'
        ? attachVimeo(iframeEl, handlers)
        : attachYouTube(iframeEl, handlers);
    return () => { clearTimeout(playGraceTimer); clearTimeout(idleTimer); dispose(); };
  });

  // Exported derived class string consumed by the route's metadata + back-button + rail heading.
  // Pure CSS transition — no JS animation.
  export const chromeClass = (faded: boolean): string =>
    faded
      ? 'opacity-20 pointer-events-none motion-safe:transition-opacity duration-500'
      : 'opacity-100 pointer-events-auto motion-safe:transition-opacity duration-300';
</script>

<!-- D-06 letterbox: outer bg-black min-h-svh; player aspect-video w-full max-h-svh centered via flex -->
<div
  bind:this={canvasEl}
  class="relative flex min-h-svh items-center justify-center bg-black"
  onpointermove={onPointerMove}
  onpointerleave={onPointerLeave}
  ontouchend={onTouchEnd}
  role="presentation"
>
  <div class="aspect-video w-full max-h-svh">
    <iframe
      bind:this={iframeEl}
      src={buildEmbedUrl(video, 'play')}
      title={video.title}
      allow="autoplay; fullscreen; picture-in-picture"
      referrerpolicy="strict-origin-when-cross-origin"
      loading="lazy"
      class="h-full w-full border-0"
      data-chrome-faded={chromeFaded}
    ></iframe>
  </div>
</div>

<!-- The route's +page.svelte composes back-button + metadata block + ContinueReelRail
     BELOW this WatchPlayer; those elements consume the same `chromeFaded` state via
     a Svelte 5 $bindable export or context. -->
```

**Composition in route page (sketch):**

```svelte
<!-- src/routes/watch/[id]/+page.svelte (illustrative) -->
<script lang="ts">
  /* eslint-disable svelte/no-navigation-without-resolve */
  import { base } from '$app/paths';
  import WatchPlayer from '$lib/components/WatchPlayer.svelte';
  import ContinueReelRail from '$lib/components/ContinueReelRail.svelte';
  import { categoryToSlug } from '$lib/data';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const video = $derived(data.video);
  const rail = $derived(data.rail);
  const year = $derived(video.published.slice(0, 4));
  const categorySlug = $derived(categoryToSlug(video.category));

  // Fade state shared across the page (back-button, metadata, rail heading subscribe here).
  let chromeFaded = $state(false);
  // … VideoObject JSON-LD (mirror _four:41-54) …
</script>

<svelte:head>
  <title>{video.title} — Michelle Ngo</title>
  <meta name="description" content={video.description?.slice(0, 150) ?? `${video.title} — by Michelle Ngo`} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<script type="application/ld+json">${JSON.stringify(videoJsonLd)}<` + `/script>`}
</svelte:head>

<article aria-label={video.title}>
  <WatchPlayer {video} bind:chromeFaded />

  <!-- Below-player chrome (D-08) — opacity binds to chromeFaded -->
  <div class={chromeFaded ? 'opacity-20 pointer-events-none motion-safe:transition-opacity duration-500' : 'opacity-100 pointer-events-auto motion-safe:transition-opacity duration-300'}>
    <a href={`${base}/work`} data-sveltekit-preload-data="hover" class="...">← Back to reel</a>
    <h1 class="font-display ...">{video.title}</h1>
    <CategoryTag category={video.category} href={`${base}/work/${categorySlug}`} />
    <p>{video.uploader} · {year}</p>
    {#if video.description}<p class="whitespace-pre-line">{video.description}</p>{/if}
    <ContinueReelRail {rail} category={video.category} {categorySlug} />
  </div>
</article>
```

---

### Recipe §4 — Vimeo postMessage 'pause' subscription extension (Finding 1 fix)

```ts
// src/lib/iframe/vimeoAdapter.ts — modify onLoad
const onLoad = (): void => {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ method: 'addEventListener', value: 'play' }),
    ALLOWED_ORIGIN
  );
  // NEW — Phase 5 D-07 requires pause events for the chrome-fade-back-in trigger.
  iframe.contentWindow?.postMessage(
    JSON.stringify({ method: 'addEventListener', value: 'pause' }),
    ALLOWED_ORIGIN
  );
  iframe.contentWindow?.postMessage(
    JSON.stringify({ method: 'addEventListener', value: 'error' }),
    ALLOWED_ORIGIN
  );
};

// In dispose() — Layer 2 defensive removal:
return function dispose(): void {
  if (disposed) return;
  disposed = true;
  iframe.removeEventListener('load', onLoad);
  window.removeEventListener('message', onMsg);
  try {
    iframe.contentWindow?.postMessage(JSON.stringify({ method: 'removeEventListener', value: 'play' }), ALLOWED_ORIGIN);
    // NEW
    iframe.contentWindow?.postMessage(JSON.stringify({ method: 'removeEventListener', value: 'pause' }), ALLOWED_ORIGIN);
  } catch { /* swallow */ }
};
```

YouTube adapter requires NO change — `onStateChange info=2` (paused) already routes to `handlers.onPause?.()` via the existing `youtubeAdapter.ts:53-56` switch.

---

### Recipe §5 — `entries()` for 56 prerendered routes (WATCH-04)

```ts
// src/routes/watch/[id]/+page.ts — near-verbatim from _four
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';
import { getById, getByCategory, videos } from '$lib/data';

export const entries: EntryGenerator = () => videos.map((v) => ({ id: v.id }));

// prerender = true inherited from src/routes/+layout.ts:3 — do NOT redeclare.

// `async` is load-bearing for the .rejects.toMatchObject({ status: 404 }) test contract.
export const load: PageLoad = async ({ params }) => {
  const video = getById(params.id);
  if (!video) error(404, 'Video not found');

  const rail = [...getByCategory(video.category)]
    .filter((v) => v.id !== video.id)
    .toSorted((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.published.localeCompare(a.published);
    });

  return { video, rail };
};
```

**Build output:** `pnpm build` emits `build/watch/<id>/index.html` × 56 (one per video). `svelte.config.js` already has `prerender.handleHttpError` allow-list for `/watch/*` (STATE.md line 105 — "prerender.handleHttpError allow-list for /posters/* + /watch/* during Plan 03-01 → Plan 03-03 / Phase 5 rollout window") — this can be removed once Phase 5 ships.

---

### Recipe §6 — ContinueReelRail pure CSS scroll-snap-x (WATCH-03)

```svelte
<!-- src/lib/components/ContinueReelRail.svelte -->
<script lang="ts">
  /* eslint-disable svelte/no-navigation-without-resolve */
  import { base } from '$app/paths';
  import { getPosterFor } from '$lib/data/posters';
  import type { Video, Category } from '$lib/data';

  let { rail, category, categorySlug }: {
    rail: readonly Video[];
    category: Category;
    categorySlug: string;
  } = $props();
</script>

<!-- D-13: hide entirely when empty -->
{#if rail.length > 0}
  <section aria-labelledby="rail-heading" class="mx-auto mt-12 px-4 sm:px-6 lg:px-8">
    <h2 id="rail-heading" class="font-display mb-4 text-xl text-neutral-50">
      <!-- D-12 heading-is-link -->
      <a
        href={`${base}/work/${categorySlug}`}
        data-sveltekit-preload-data="hover"
        class="hover:underline"
      >
        More in {category} →
      </a>
    </h2>

    <!-- D-10: pure CSS scroll-snap-x mandatory; D-11: fractional-peek sizing -->
    <ul class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {#each rail as v (v.id)}
        <li class="snap-start flex-none w-[70vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw]">
          <a
            href={`${base}/watch/${v.id}`}
            data-sveltekit-preload-data="hover"
            class="block relative aspect-video overflow-hidden bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-50"
          >
            <img
              src={`${base}${getPosterFor(v)}`}
              alt=""
              loading="lazy"
              decoding="async"
              class="absolute inset-0 h-full w-full object-cover"
            />
            <div
              class="pointer-events-none absolute inset-0"
              style="background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.7) 100%);"
              aria-hidden="true"
            ></div>
            <div class="absolute bottom-2 left-2 right-2 text-neutral-50">
              <p class="font-display text-sm font-semibold line-clamp-2">{v.title}</p>
              <p class="font-mono text-xs text-neutral-300">{v.uploader} · {v.published.slice(0, 4)}</p>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  </section>
{/if}
```

**Scrollbar-hide utility:** Tailwind v4 doesn't ship `scrollbar-hide` as a built-in. Add a one-liner in `app.css`:

```css
@utility scrollbar-hide {
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
```

---

### Recipe §7 — ReelStage hash-restoration consumer (D-15)

```ts
// Extension to src/lib/components/ReelStage.svelte
// Add inside <script lang="ts"> after sectionRefs declaration.

let restoredFromHash = $state(false);

// D-15: hash restoration. Fires once sectionRefs is fully bound.
$effect(() => {
  if (restoredFromHash) return;
  if (typeof window === 'undefined') return;
  if (sectionRefs.length !== videos.length) return;
  // All refs are now bound (or filled with null for not-yet-rendered).
  const hash = window.location.hash; // e.g., "#video=1007027015"
  if (!hash.startsWith('#video=')) { restoredFromHash = true; return; }
  const id = hash.slice('#video='.length);
  const idx = videos.findIndex((v) => v.id === id);
  if (idx < 0) { restoredFromHash = true; return; }
  const target = sectionRefs[idx];
  if (!target) { restoredFromHash = true; return; }
  // D-15: behavior 'auto' (instant) — NOT 'smooth'.
  if (typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  restoredFromHash = true;
});
```

**Why `$effect` not `onMount`:** `sectionRefs` array binds via `bind:this` per-`{#each}` iteration; refs populate **after** the first paint, not before `onMount` completes. The `$effect` re-runs once the `sectionRefs.length === videos.length` condition matches, guaranteeing all refs are present before `scrollIntoView`.

---

### Recipe §8 — `playsinline=1` extension for 'play' mode (Finding 11 — MEDIUM-confidence)

```ts
// src/lib/iframe/url.ts — modify the 'play' fall-through branches
// VIMEO:
if (mode === 'play') {
  params.set('playsinline', '1'); // NEW — Pitfall 1 iOS Safari fullscreen-takeover prevention
}
// YOUTUBE:
if (mode === 'play') {
  params.set('playsinline', '1'); // NEW — same rationale
}
```

**Test update:** `src/lib/iframe/url.test.ts` should add a snapshot assertion that `'play'` mode URLs for at least one Vimeo + one YouTube video contain `playsinline=1`. Then verify on iOS Safari 17 real device during phase verification that tap-to-play does NOT trigger the full-screen takeover.

**Caveat:** This is the one MEDIUM-confidence Phase 5 modification — flag clearly to the planner as a question for plan-time decision. If the planner chooses NOT to ship this (preferring iOS fullscreen on tap-to-play), then D-07 chrome-fade on iOS becomes a no-op once the user taps in (because the iframe loses focus to the platform player). That's acceptable degradation — the cinematic chrome-fade lands on desktop and on Android.

---

## Open Questions / Decisions Surfaced

These are NOT in CONTEXT.md's `<decisions>` block (locked) — they surfaced during research and require planner judgement:

1. **`playsinline=1` for 'play' mode in `url.ts`?** (Finding 11) — MEDIUM-confidence recommendation: YES, add it, so the iframe stays in-document on iOS Safari tap-to-play and the chrome-fade works. Alternative: ship without it, accept that iOS users get fullscreen takeover and chrome-fade is desktop-only.
2. **Visibility broadcast architecture (Finding 10)** — two options:
   - (a) Lift to a module-scope rune `$lib/state/visibility.svelte.ts` consumed by ReelStage + HeroAmbient + WatchPlayer. Cleanest.
   - (b) Duplicate per-component `visibilitychange` listeners + `menu.menuOpen` reads. Simpler PR diff.
   Recommend (a).
3. **`heroDefer.svelte.ts` extraction** — CONTEXT.md explicitly lists this as Claude's discretion. Recommend extracting now, since Phase 6 ABT-01 will reuse the same ambient bg pattern on `/about`.
4. **WatchPlayer `chromeFaded` exposure** — bindable prop (`bind:chromeFaded`) vs writable context vs URL-level `$state`. Recipe §3 sketches `bind:`; planner picks based on test surface.
5. **Back button placement on `/watch/[id]`** — D-08 says "metadata BELOW player". A back button (← Back to reel) is part of the chrome that fades. Placement: ABOVE the player (NOT in TopNav, which stays solid per Phase 4 D-06) OR inline with the metadata below. Recommend ABOVE for natural reading order; alternative is inline with metadata.
6. **Should `/watch/[id]` also write the hash to URL on entry?** Phase 3 writes `/work#video={id}` on snap settle. When user clicks `▷ PLAY WITH SOUND` on a section, the hash is on `/work`; navigating to `/watch/[id]` drops the hash from the URL bar (new page = new URL). Browser back returns to `/work#video={id}` because that WAS the previous URL — confirmed working by browser native back behavior. **No additional Phase 5 work needed for this case.**

---

## Pitfalls

### Pitfall A (HIGH confidence) — Vimeo 'pause' postMessage not subscribed
**Mapped to:** Finding 1 (above). ROADMAP doesn't enumerate this; surfaced during research.
**What goes wrong:** WatchPlayer's chrome-fade-back-in on Vimeo pause never fires. Fade only restores via pointer-leave OR idle-3s — a silent UX bug.
**How to detect:** Vitest unit test asserts `attachVimeo` `onLoad` callback posts the `addEventListener('pause')` message. E2E test: play a Vimeo video, press the native pause button, assert chrome opacity returns to 1 within 100ms.
**Fix:** Recipe §4.

### Pitfall B (MEDIUM-HIGH) — iOS Safari fullscreen takeover on `/watch/[id]` without `playsinline=1`
**Mapped to:** Finding 11.
**What goes wrong:** User taps the iframe to start playback on iPhone; iOS Safari opens the native fullscreen player; chrome-fade controller never receives postMessage events because the iframe is no longer the active surface; the page chrome (back button, metadata, rail) remains visible behind the platform player.
**How to detect:** Real-device QA on iPhone iOS 17.x. Tap into the embed; if the screen takes over to native player, the bug is live.
**Fix:** Recipe §8 — add `playsinline=1` to 'play' mode.

### Pitfall C (HIGH) — ReelStage `onMount` runs before `sectionRefs[]` is bound
**Mapped to:** Finding 3 + Recipe §7.
**What goes wrong:** Naive `onMount(() => { const target = sectionRefs[idx]; target.scrollIntoView(...) })` reads `sectionRefs[idx]` while it's still `null` (`bind:this` populates after Svelte's first paint flush). The restoration is a no-op; user lands at top despite hash being present. Silent bug — only visible in the WATCH-05 back-nav test.
**How to detect:** E2E test in `tests/e2e/restore.spec.ts` — visit `/work#video=1007027015`, assert that after first paint, the video with id 1007027015 is the first `<article>` whose top is at the viewport top.
**Fix:** Use `$effect` that fires once `sectionRefs.length === videos.length` (Recipe §7), or `await tick()` inside `onMount`.

### Pitfall D (MEDIUM — Phase 3 carry-forward) — hash write debounce can lose final position on fast unload
**Mapped to:** Pitfall 12 in ROADMAP / Phase 3 D-09 hash write.
**What goes wrong:** Phase 3 debounces the hash write 300ms. If the user clicks `▷ PLAY WITH SOUND` within 300ms of the last snap settle, the URL hash may still reflect the PREVIOUS section, not the current one. Back-nav restores to the wrong section.
**How to detect:** E2E test — fast-scroll, then immediately click `▷ PLAY WITH SOUND`; assert the hash in the previous-page URL matches the clicked section's id.
**Fix:** Two options:
- (a) Flush the debounce immediately on `▷ PLAY WITH SOUND` click. ReelSection or PosterImage adds a click handler that runs `clearTimeout(hashTimer); history.replaceState(...)` synchronously before the navigation.
- (b) Tighten the debounce to 100ms (less safety margin against thrash but tighter UX).
Recommend (a) — explicit flush. Phase 3 ReelStage exposes the writer via context if needed.

### Pitfall E (LOW — defensive) — Provider native ▷ overlay flicker on direct URL paste
**What goes wrong:** Direct paste to `/watch/[id]` has no sticky activation; Vimeo/YouTube blocks autoplay-with-sound and overlays its native ▷ button. User clicks the native ▷; embed plays. The chrome-fade controller fires `onPlay` AFTER the user's click on the native overlay — this is fine.
**No bug.** Documented per D-09: "iOS Low Power Mode may still block autoplay-with-sound; that's the provider's own UI (a native ▷ overlay button) and is acceptable degradation."

### Pitfall F (LOW) — Hero IO threshold tuning
**What goes wrong:** D-02 specifies "intersectionRatio === 0" as the unmount trigger. With `threshold: [0]`, the IO fires the boundary callback once the hero is 0% intersecting — fine. But if the user scrolls slowly, the iframe might toggle mount/unmount around the boundary, causing churn.
**Fix:** Use `threshold: [0, 0.1]` and add hysteresis (mount when ratio > 0.1, unmount when ratio === 0). Or use rootMargin to expand the "still visible" zone.

### Pitfall G (MEDIUM) — Phase 4 D-08 menu pause doesn't reach Hero/Watch iframes by default
**Mapped to:** Finding 10.
**What goes wrong:** `reel:visibility` context is set BY ReelStage; HeroAmbient is a sibling (not child), WatchPlayer lives on a different route entirely. Opening mobile menu pauses the reel but NOT the hero/watch iframe — battery/thermal posture inconsistent.
**Fix:** Hoist visibility to a module-scope rune (Recipe is option (a) from Finding 10). Update HeroAmbient + WatchPlayer to subscribe directly.

---

## Sources

### Primary (HIGH confidence)
- **Existing repo code (already-shipped patterns):**
  - `src/lib/iframe/url.ts:50-80` — buildEmbedUrl 'preview' vs 'play' contract
  - `src/lib/iframe/vimeoAdapter.ts:34-88` — postMessage adapter + Layer 2 dispose pattern
  - `src/lib/iframe/youtubeAdapter.ts:34-80` — YouTube postMessage adapter
  - `src/lib/components/PreviewLoop.svelte:32-156` — 4-state lifecycle reference
  - `src/lib/components/ReelStage.svelte:117-132` — Phase 3 hash-write-on-snap-settle (D-15 producer side)
  - `src/lib/components/ReelStage.svelte:80-96` — `setContext('reel:stage')` + `setContext('reel:visibility')` patterns
  - `src/lib/components/PosterImage.svelte:36-191` — fallback poster contract
  - `src/lib/components/ReelSection.svelte:65-93` — REEL-04 unified codepath gate
  - `src/lib/data/index.ts:9-19` — 11-name public surface (`videos`, `producerReelId`, `getById`, `getByCategory`, `categoryToSlug`)
  - `src/lib/data/posters.ts:25-31` — `getPosterFor()` helper
  - `src/lib/state/menu.svelte.ts:14-33` — menu open rune
  - `src/lib/state/motion.svelte.ts` + `network.svelte.ts` + `scrollIdle.svelte.ts` — module-scope rune pattern
  - `src/routes/work/+page.ts:11-18` — load() returning videos pattern
  - `src/routes/work/[category]/+page.ts:22-44` — entries() + load() + 404 pattern
  - `src/routes/+layout.ts:3` — prerender = true inheritance
  - `src/routes/+layout.svelte:31-65` — skip-link + `<main id="main" tabindex="-1">` chrome
- **Sibling `_four` (verbatim-copy targets):**
  - `../michelle_ngo_four/src/routes/watch/[id]/+page.ts` — entries() + load() + rail derivation
  - `../michelle_ngo_four/src/routes/watch/[id]/+page.svelte:73-122` — content shape contract (h1, CategoryTag, uploader · year, optional description, VideoObject JSON-LD)
  - `../michelle_ngo_four/src/routes/watch/[id]/page.test.ts:33-109` — load() + entries() test contract (5 tests)
  - `../michelle_ngo_four/src/lib/components/HeroPoster.svelte:30-74` — hero poster eager-load pattern
- **Phase 3/4 carry-forward:**
  - `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` — D-05/D-06/D-07/D-08 unified fallback codepath, D-09/D-10/D-11/D-12 peak-3 budget + ±1 windowing, hash-write decision
  - `.planning/phases/04-wayfinding/04-CONTEXT.md` — D-05/D-06 TopNav fade scope (reel-routes only), D-08 menu-pause bridge, D-13 URL-as-canonical-state
- **External spec / docs:**
  - [MDN: UserActivation](https://developer.mozilla.org/en-US/docs/Web/API/UserActivation) — sticky activation persistence
  - [HTML Living Standard §UserActivation](https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation) — definitive spec
  - [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay/) — sound-on autoplay requirements
  - [Mozilla Media/block-autoplay](https://wiki.mozilla.org/Media/block-autoplay) — sticky activation semantics ("would keep until a user refreshes the page or leaves the page")
  - [SvelteKit $app/navigation docs](https://svelte.dev/docs/kit/$app-navigation) — pushState/replaceState (not used in Phase 5 per D-14; documented for completeness)
  - [SvelteKit shallow routing docs](https://svelte.dev/docs/kit/shallow-routing) — App.PageState typing (not used in Phase 5)
  - [SvelteKit page options — entries](https://svelte.dev/docs/kit/page-options#entries) — EntryGenerator signature
  - [SvelteKit adapter-static docs](https://svelte.dev/docs/kit/adapter-static) — strict mode + entries() requirement
  - [Vimeo Help: Player Parameters](https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters) — autoplay/muted/loop/background contract
  - [Vimeo Help: Embedding background videos](https://help.vimeo.com/hc/en-us/articles/12426285089681) — background=1 implications
  - [Vimeo Player SDK reference](https://developer.vimeo.com/player/sdk/reference) — postMessage event names
  - [YouTube IFrame API reference](https://developers.google.com/youtube/iframe_api_reference) — onStateChange state codes
  - [MDN: object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) — confirms `<iframe>` has no object-fit (letterbox math justification)
  - [WebKit bug 261185 svh/dvh behavior](https://bugs.webkit.org/show_bug.cgi?id=261185) — `svh` recommendation
  - [Tailwind v4 release post](https://tailwindcss.com/blog/tailwindcss-v4) — built-in `aspect-video`, container queries

### Secondary (MEDIUM confidence)
- [Vimeo Player API Demo with postMessage (CodePen)](https://codepen.io/jimfu/pen/MwpYmB) — raw postMessage usage example
- [Mindful Chase: Advanced Troubleshooting in SvelteKit](https://www.mindfulchase.com/explore/troubleshooting-tips/front-end-frameworks/advanced-troubleshooting-in-sveltekit-fixing-ssr,-routing,-and-hydration-challenges.html) — iframe + prerender pattern
- [SvelteKit issue #8726: popstate triggers afterNavigate for hash changes](https://github.com/sveltejs/kit/issues/8726) — hash + back-nav behavior

### Tertiary (LOW confidence — informational only)
- [embla-carousel-svelte npm](https://www.npmjs.com/package/embla-carousel-svelte) — explicitly REJECTED by CONTEXT D-10; documented for completeness
- [Embla docs — Svelte get-started](https://www.embla-carousel.com/get-started/svelte/) — same

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dep already shipped in Phase 1/3; no new installs; CLAUDE.md research dossier validated.
- Architecture: HIGH — all patterns (component composition, $effect lifecycle, runed IO, $derived gates) are already proven in Phase 3/4 code; Phase 5 reuses verbatim.
- Pitfalls: HIGH for Pitfalls A/C/D/G (shipped code reveals the gaps directly); MEDIUM for Pitfall B (depends on iOS Safari real-device behavior — flagged for plan-time decision).
- Validation Architecture: HIGH — Wave 0 gaps enumerated; test commands mirror Phase 3/4 patterns; no new framework needed.

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (30 days — stable; Phase 3/4 substrate is stable; only browser autoplay policy could shift, and Finding 2 is bedrock spec-level)

---

## RESEARCH COMPLETE

**Phase:** 5 — Hero & Watch
**Confidence:** HIGH

### Key Findings
- **Vimeo adapter pause-subscription gap (Finding 1):** existing `vimeoAdapter.ts:60-67` subscribes only to `'play'`+`'error'`; D-07 chrome-fade-on-pause requires extending `onLoad` to also send `addEventListener('pause')`. Small, well-bounded fix.
- **Sticky user activation persists across SvelteKit client-side navigation (Finding 2):** HERO-03's sound-on autoplay on `/watch/264677021` after `▷ PLAY REEL` click is supported by HTML spec sticky-activation semantics. Direct URL paste relies on provider native ▷ overlay as documented degradation.
- **D-14 hash-only overrides REQUIREMENTS phrasing (Finding 3):** WATCH-05 ships with NO `history.state` writes. Phase 3 ReelStage already produces `${base}/work#video={id}`; Phase 5 ships only the consumer.
- **`entries()` for 56-route prerender is shipped pattern (Finding 4):** copy `_four/src/routes/watch/[id]/+page.ts` near-verbatim; `prerender = true` inherited from layout.
- **`playsinline=1` should be added to 'play' mode in `url.ts` (Finding 11):** MEDIUM-confidence recommendation surfaced for plan-time decision. Adding it preserves chrome-fade postMessage flow on iOS Safari.

### File Created
`C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\Websites\michelle_ngo_three\.planning\phases\05-hero-watch\05-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All deps shipped in Phase 1/3; zero new installs; CONTEXT D-10 explicitly rejects embla. |
| Architecture | HIGH | Reuses Phase 3/4 patterns verbatim (PreviewLoop, postMessage adapters, runed IO, module-scope runes, hash-write-on-snap-settle). |
| Pitfalls | HIGH (Pitfalls A/C/D/G) / MEDIUM (Pitfall B) | A/C/D/G surface directly from shipped code review; B depends on iOS Safari real-device behavior. |
| Validation Architecture | HIGH | Wave 0 gaps fully enumerated; commands mirror Phase 3/4; no new framework. |

### Open Questions (handed to planner)
1. Add `playsinline=1` to 'play' mode in `url.ts` (Finding 11) — recommended YES.
2. Visibility broadcast architecture (Finding 10) — lift to module-scope rune (option a) vs per-component listeners (option b). Recommended option a.
3. Whether to extract `$lib/heroDefer.svelte.ts` rune now (Phase 6 ABT-01 reuse) or keep inline.
4. WatchPlayer `chromeFaded` exposure — bindable prop vs context vs page-level $state.
5. Back-button placement on `/watch/[id]` — ABOVE the player vs inline with metadata. Recommended ABOVE.
6. Phase 3 hash-write-debounce flush on `▷ PLAY WITH SOUND` click (Pitfall D mitigation).

### Ready for Planning
Research complete. Planner can now decompose Phase 5 into 3 waves with mapped tests, Wave 0 gaps, and the two adapter-extension tasks flagged inside Wave 1.
