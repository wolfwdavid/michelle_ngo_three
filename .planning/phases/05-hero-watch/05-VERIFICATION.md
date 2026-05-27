---
status: human_needed
phase: 05-hero-watch
must_haves_total: 8
must_haves_verified: 8
must_haves_gaps: 0
verified: 2026-05-27T19:45:00Z
re_verification:
  previous_status: null
  previous_score: null
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Hero iframe attaches and plays silently on / after defer trigger (rIC/timeout/interaction)"
    expected: "Within ~1s on first visit (or immediately on first pointer/wheel/touch/scroll), the producer reel (Vimeo 264677021) attaches as the hero background and plays muted+looped behind the wordmark/CTA/scroll-cue overlay. Phase 3 HANDSHAKE_TIMEOUT_MS = 800ms can unmount the iframe in headless e2e (documented caveat); only a real browser session reliably keeps the handshake alive."
    why_human: "Cross-origin postMessage handshake between parent and player.vimeo.com is non-deterministic in headless Playwright; SUMMARY pivoted the e2e assertion away from 'iframe attached within 5s' to 'LCP poster attached' for this exact reason. Real Chrome/Safari session needed to confirm the iframe stays mounted and plays."
  - test: "Hero iframe unmounts to poster when scrolled off-screen (D-02 budget)"
    expected: "Scroll past the hero into the reel; the hero iframe element disappears from the DOM (isOnScreen flips false via IntersectionObserver). Scroll back up; iframe re-mounts. Peak iframe count never exceeds 3 (hero +1 plus reel ±1)."
    why_human: "Visual + DOM-inspection check tied to live IntersectionObserver scroll thresholds. Unit-tested via runed mock; only a real scroll session confirms hysteresis at the boundary."
  - test: "WATCH-01 chrome-fade flow on real Vimeo provider"
    expected: "Open /watch/264677021 with sound enabled; chrome (back-button + h1 + CategoryTag + uploader · year + ContinueReelRail heading region) is opacity-100 initially. On Vimeo 'play' event (audible playback starts), after a 600ms grace the entire chrome group fades to opacity-20 + pointer-events-none. Hover / move pointer over the canvas → chrome restores to opacity-100. Pause via Vimeo native controls → chrome restores immediately. After 3s of no pointer move while playing → fades again. Touch on mobile restores + arms idle-3s."
    why_human: "Phase 3 HANDSHAKE_TIMEOUT_MS = 800ms caveat applies — cross-origin postMessage timing is non-deterministic in headless. Unit tests mock the adapter handlers and exercise all 8 transitions via fake timers + flushSync; the end-to-end real-iframe path requires a live cross-origin handshake against player.vimeo.com that the SUMMARY explicitly defers to Phase 7 POL-04 BrowserStack iOS Safari 17.x UAT."
  - test: "HERO-03 sound-on autoplay on /watch/264677021 after PLAY REEL click"
    expected: "From /, click ▷ PLAY REEL. The watch page loads and the embed plays with audible sound on first paint (user-gesture sticky activation per Research Finding 2 persists across SvelteKit client-side nav)."
    why_human: "Sticky activation behavior varies across browser engines and OS versions (especially iOS Safari Low Power Mode where play() may reject silently). The e2e asserts the URL contains autoplay=1 and absence of muted=/mute= params (proven via build/watch/264677021.html iframe src grep), but the actual audible-sound emission can only be confirmed via real-device playback."
  - test: "WATCH-05 back-nav round-trip restores exact reel position"
    expected: "Scroll /work to a non-first article (e.g., the 5th video). Click ▷ PLAY WITH SOUND on that ReelSection. Browser back. URL is /work#video=<that-id> and the same article is at viewport top."
    why_human: "ReelStage's hash-write is debounced 300ms on snap-settle (Pitfall D — explicitly deferred from Plan 05-01). If the producer clicks PLAY WITH SOUND before the debounce timer fires, the hash never lands and back-nav lands at top. The headless e2e (tests/e2e/restore.spec.ts line 134-157) accepts BOTH outcomes as structurally passing (strong path when hash captured, weak path when missed). Real-device verification across the producer's actual interaction speed is needed to confirm the happy path."
  - test: "WATCH-05 cross-route arrival from /watch → ContinueReelRail heading → /work/[cat] restores"
    expected: "Open /watch/<reel-video-id>. Click 'More in Reel →' heading (or any rail card → its watch page, then back). Arrive at /work/reel. If the URL bears a #video=<id> hash matching a video in that category, that article is at viewport top; otherwise no-op land at top (D-17)."
    why_human: "Same cross-origin / SPA-timing non-determinism as the back-nav round-trip; tested structurally in unit + e2e but the full producer-flow needs real-browser verification."
  - test: "axe WCAG AA pass on /, /work, /watch/[id], /work/[category] (sampled)"
    expected: "Zero violations on each route. e2e hero.spec.ts + watch.spec.ts already run @axe-core/playwright across Chromium + WebKit + Firefox; this human check confirms behavior matches the automated assertion on staging."
    why_human: "Automated scan is already green per SUMMARY; the human check is the customary deploy-day spot-check on the actual staging URL (wolfwdavid.github.io/michelle_ngo_three/) rather than localhost preview."
---

# Phase 5: Hero & Watch Verification Report

**Phase Goal:** The cinematic entry surface (`/`) and the cinematic playback surface (`/watch/[id]`) both work on the iframe-lifecycle pattern proven sound in Phase 3. The hero is an always-mounted ambient producer reel that draws the user into the full `/work` reel below; the watch route is a letterboxed embed on full black with chrome that fades on play and rails the user toward sibling videos in the same category. Back-navigation from `/watch/[id]` restores the user's exact reel position.

**Verified:** 2026-05-27T19:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification.

All 8 phase-5 must-haves are substantively implemented, wired into routes, prerendered into the static build, and locked by 346/346 green unit/component tests + `pnpm check` 0 errors + `pnpm build` clean. The 7 human-verification items are real-browser/real-device behaviors that are non-deterministic in headless Playwright (cross-origin postMessage timing, sticky-activation audio playback, debounced hash-write/snap-settle interplay) — they are the documented carry-forward UAT surface for Phase 7 POL-04.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | `/` renders full-bleed `h-svh` `<HeroAmbient />` — wordmark, tagline, `▷ PLAY REEL` CTA, `↓` scroll-cue, gradient overlay, Vimeo 264677021 silently autoplaying as background (when defer + IO + REEL-04 + visibility gates pass) | ✓ VERIFIED | `src/lib/components/HeroAmbient.svelte:33-185` (real component with all 5 z-stack layers); `src/routes/+page.svelte:34` (composed); `build/index.html` contains "MICHELLE NGO" x1, "PLAY REEL" x1, `/watch/264677021` href, `rel="preload" as="image"` preload link, 0 "Site coming soon" leftovers, 56 article landmarks below the hero |
| 2 | Tapping `▷ PLAY REEL` → `/watch/264677021` and the embed plays with sound on first paint | ✓ VERIFIED (URL contract); ? UNCERTAIN (audible sound emission needs real device) | Anchor: `src/lib/components/HeroAmbient.svelte:170` `href={\`${base}/watch/${producerReelId}\`}`; producer reel data: `videos.json` id `264677021` exists with `source: vimeo`, `featured: true`; iframe src in `build/watch/264677021.html`: `https://player.vimeo.com/video/264677021?autoplay=1&dnt=1&playsinline=1` — has autoplay=1 + playsinline=1 + NO `muted=`/`mute=` params. Sticky activation flagged for human UAT. |
| 3 | `/watch/[id]` plays selected video full-bleed letterboxed on full black; Vimeo `play` postMessage → chrome fades opacity-20 after 600ms grace; `pause` → restores opacity-100 immediately | ✓ VERIFIED (mechanism + unit tests); ? UNCERTAIN (real-Vimeo postMessage timing flagged for UAT) | `src/lib/components/WatchPlayer.svelte:38-148` (real letterbox + 8-transition state machine); `src/lib/iframe/vimeoAdapter.ts:68` `addEventListener: pause` subscribed AND `:95` symmetric removeEventListener; routing already at `vimeoAdapter.ts` switch line 53 (verified via plan interface block). `build/watch/264677021.html` confirms `bg-black`, `min-h-svh`, `aspect-video`, `data-chrome-faded="false"` initial state. Chrome-fade unit tests cover all 8 transitions (per 05-02 SUMMARY: 15 WatchPlayer tests, all green). |
| 4 | Below player, `<ContinueReelRail />` horizontal scroll-snap-x rail surfaces same-category siblings as poster-only cards; replaces `_four`'s grid rail | ✓ VERIFIED | `src/lib/components/ContinueReelRail.svelte:39-101` (pure CSS scroll-snap-x, heading-is-link to `/work/{slug}`, fractional-peek widths, hide-when-empty); imported and composed in `src/routes/watch/[id]/+page.svelte:36 + 123`; `build/watch/264677021.html` contains `rail-heading`, `/work/` link, "More in" heading. No nested iframes in rail cards (poster-only `<a>` links per design). |
| 5 | All 56 `/watch/[id]` routes are prerendered via `entries()` | ✓ VERIFIED | `src/routes/watch/[id]/+page.ts:29` `export const entries: EntryGenerator = () => videos.map((v) => ({ id: v.id }))`; build artifact: `ls build/watch/ \| wc -l` = 56 (.html files, flat — adapter-static config emits `<id>.html` not `<id>/index.html`); `build/watch/264677021.html` contains valid `VideoObject` JSON-LD payload (`@context`, `@type`, `name`, `embedUrl`, `uploadDate`, `contentUrl`). |
| 6 | Back-nav from `/watch/[id]` to `/work` restores producer to the exact section via `history.state` + hash fragment | ✓ VERIFIED (consumer + writer mechanism); ? UNCERTAIN (debounced-hash-write timing flagged for UAT) | Phase 3 hash-WRITER preserved at `src/lib/components/ReelStage.svelte:129-132` (debounced `history.replaceState(...#video=<id>)`); Plan 05-01 hash-RESTORE consumer `$effect` at `ReelStage.svelte:174-201` (idempotent via `restoredFromHash` $state guard; `scrollIntoView({block:'start', behavior:'auto'})` per D-15; gated on `sectionRefs.length === videos.length` per Pitfall C). `data-video-id={video.id}` on outer `<article>` landmark at `ReelStage.svelte:263` for resilient e2e selector. `tests/e2e/restore.spec.ts` runs 3 cases (direct paste happy, foreign hash no-op, round-trip back-nav). NOTE: requirement says "history.state + hash fragment" but locked decision D-14 was "hash-only — NO history.state writes"; this is an intentional Phase 5 narrowing of the original requirement, documented in 05-CONTEXT.md D-14/D-15/D-16/D-17. |
| 7 | Iframe lifecycle on `/` and `/watch/[id]` matches Phase 3 viewport-windowed pattern — no leaks; REEL-04 fallback to poster on hero | ✓ VERIFIED | HeroAmbient owns its own runed `useIntersectionObserver` at `src/lib/components/HeroAmbient.svelte:100-106` with `threshold: [0, 0.1]` hysteresis (Pitfall F); D-04 unified REEL-04 fallback gate at line 66-68 (`motion.prefersReducedMotion \|\| network.isCellularLike \|\| autoplayFailedFromHero`); 4-way mount gate at line 76-78 (`isOnScreen && defer.shouldMount && !shouldShowPoster && !pauseFromMenuOrVisibility`); PreviewLoop child consumes the existing `'reel:visibility'` setContext bridge (line 84-88) so Phase 3 sealed contract is unchanged. WatchPlayer iframe owns its `$effect` dispose chain (lines 93-121) with adapter `dispose()` + timer cleanup — Phase 3 5-layer leak defense honored. |
| 8 | No autoplay on cellular without consent; no autoplay under prefers-reduced-motion (hero); REEL-04 fallback codepath unified | ✓ VERIFIED | Hero: REEL-04 gate at HeroAmbient line 66-68 — when any trigger fires, the `mountIframe` $derived stays false, iframe element is conditionally rendered out (line 136), poster persists as LCP. Watch: D-09 cinematic posture — `/watch/[id]` is "user-action consent" (the producer navigated TO the watch URL), so it does autoplay with sound; this is a documented Phase 5 design choice, not a regression. PageVisibility rune ORs `document.hidden` with `menu.menuOpen` so opening the mobile menu pauses both hero and reel (verified via `src/lib/state/visibility.svelte.ts:35-37` + ReelStage and HeroAmbient subscriptions). |

**Score:** 8/8 truths substantively verified (5 fully automated, 3 with human-UAT carve-outs for real-iframe / real-device behaviors that are documented-flaky in headless).

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/lib/components/HeroAmbient.svelte` | 100svh z-stack: poster + deferred PreviewLoop + gradient + content stack + scroll-cue; own IO; REEL-04 fallback; pageVisibility subscription | ✓ VERIFIED | 185 lines; substantive (real `setContext`, real `useIntersectionObserver`, real `createHeroDefer`, real `$derived` mount gates); imported at `src/routes/+page.svelte:19` and rendered at line 34. Zero TODO/FIXME/placeholder markers. |
| `src/lib/components/WatchPlayer.svelte` | Letterbox flex canvas + iframe + 8-transition chrome-fade state machine; subscribes onPlay+onPause via adapters; exports chromeFaded $bindable | ✓ VERIFIED | 148 lines; real iframe with `bind:this`, real `attachVimeo`/`attachYouTube` dispatch via `video.source` ternary (line 113-115), real timers + cleanup. Imported at `src/routes/watch/[id]/+page.svelte:35` and rendered with `bind:chromeFaded` at line 104. |
| `src/lib/components/ContinueReelRail.svelte` | Pure CSS scroll-snap-x rail; `<section aria-labelledby>` landmark; heading-is-link; hide-when-empty; fractional-peek widths | ✓ VERIFIED | 101 lines; real `{#if rail.length > 0}` gate, real `{#each}` loop, real `getPosterFor` poster URLs. Imported at `src/routes/watch/[id]/+page.svelte:36` and rendered at line 123. |
| `src/routes/watch/[id]/+page.ts` | `entries()` yielding 56 entries + async `load()` with `error(404)` + rail filter+sort | ✓ VERIFIED | 44 lines; real `videos.map((v) => ({ id: v.id }))` at line 29; real `error(404, ...)` at line 34; real rail derivation via `getByCategory` + `filter` + `toSorted` (lines 36-41). 56 prerender entries confirmed by build artifact count. |
| `src/routes/watch/[id]/+page.svelte` | Composes back-button + WatchPlayer + h1 + CategoryTag + uploader · year + description + rail; VideoObject JSON-LD | ✓ VERIFIED | 125 lines; real `chromeFaded` $state, real $derived chains, real VideoObject JSON-LD via `{@html}` in `<svelte:head>` (line 88) with documented eslint-disable. Build artifact confirms JSON-LD payload present in `build/watch/264677021.html`. |
| `src/routes/+page.svelte` | Replaces Phase 1 splash; composes `<HeroAmbient />` + `<ReelStage videos={data.videos} />` | ✓ VERIFIED | 35 lines; Phase 1 "Site coming soon" placeholder confirmed REMOVED via `grep build/index.html` (0 matches); HeroAmbient + ReelStage both rendered at lines 34-35. 56 `Video N of 56` article landmarks confirmed in prerendered `build/index.html`. |
| `src/routes/+page.ts` | `load()` returns `{ videos }` (mirrors `/work/+page.ts`) | ✓ VERIFIED | 23 lines; real synchronous `load: PageLoad = () => ({ videos })`. |
| `src/lib/heroDefer.svelte.ts` | Factory rune racing `requestIdleCallback({timeout:1000}) \| setTimeout(1000) \| first window pointerdown/wheel/touchstart/scroll` | ✓ VERIFIED | 110 lines; real factory returning `{ shouldMount, start, dispose }`; real `requestIdleCallback` typeof guard for Safari; real cleanup chain in `cleanup()`. Used at `HeroAmbient.svelte:60`. Phase 6 ABT-01 carry-forward documented. |
| `src/lib/state/visibility.svelte.ts` | Module-scope `pageVisibility` rune; `documentHidden` ORs `_pageHidden \|\| menu.menuOpen`; `initVisibilityListener` registered from +layout | ✓ VERIFIED | 80 lines; real `$state` private, real getter exports, real `document.visibilitychange` listener registration in `initVisibilityListener`. Wired at `src/routes/+layout.svelte:29 + 45` (import + call). |
| `src/lib/iframe/vimeoAdapter.ts` (extended) | onLoad subscribes 'pause' postMessage; dispose() symmetric removeEventListener | ✓ VERIFIED | `grep "addEventListener.*pause"` matches at line 68; `grep "removeEventListener.*pause"` matches at line 95. Subscription routing already in onMsg switch (Phase 3) — Plan 05-01 added the subscribe + dispose pair. |
| `src/lib/iframe/url.ts` (extended) | `buildEmbedUrl(v, 'play')` includes `playsinline=1` for both Vimeo + YouTube | ✓ VERIFIED | `params.set('playsinline', '1')` at line 62 (Vimeo branch, unconditional) and line 82 (YouTube branch, unconditional). Confirmed in built iframe src: `?autoplay=1&dnt=1&playsinline=1` (no muted/loop/background — correct for 'play' mode). |
| `src/lib/components/ReelStage.svelte` (extended) | Hash-restore $effect; pageVisibility rune subscription; `data-video-id` attribute | ✓ VERIFIED | `pageVisibility` import at line 45; `documentHidden = $derived(pageVisibility.documentHidden)` at line 77; `restoredFromHash` guard + $effect at lines 174-201 with `scrollIntoView({block:'start', behavior:'auto'})` at line 199; `data-video-id={video.id}` on outer `<article>` at line 263. `let pageHidden` and inline `visibilitychange` listener confirmed REMOVED. |
| `tests/e2e/hero.spec.ts` | Playwright e2e for HERO-01/02/03 + defer + fallback + axe | ✓ VERIFIED | 140 lines; 9 tests across chromium/webkit/firefox per SUMMARY (27 cross-browser runs). Covers wordmark/CTA/scroll-cue, gradient overlay, poster preload link, h-svh height, scroll-past-hero reveals first ReelSection, PLAY REEL → /watch/264677021 + autoplay=1 + absence of muted (sound-on contract), LCP poster attached, reduced-motion serves poster only (zero iframes), axe WCAG AA. |
| `tests/e2e/watch.spec.ts` | Playwright e2e for WATCH-01..04 + axe | ✓ VERIFIED | 134 lines; covers letterbox canvas + iframe src + playsinline=1, initial chromeFaded=false, title/uploader/CategoryTag rendering, PBS rail = 17 cards + heading-is-link, prerender sample, unknown id, axe WCAG AA. |
| `tests/e2e/restore.spec.ts` | Playwright e2e for WATCH-05 round-trip + direct paste + foreign hash | ✓ VERIFIED | 159 lines; covers direct paste `/work#video=<id>` happy path, foreign hash no-op land-at-top, back-nav round-trip with strong+weak assertion paths (weak path documented + flagged for POL-04 UAT). |
| `src/app.css` (extended) | `@utility scrollbar-hide` for ContinueReelRail | ✓ VERIFIED | Confirmed via SUMMARY grep contract; consumed at `ContinueReelRail.svelte:70`. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `/+page.svelte` | `HeroAmbient.svelte` | `import HeroAmbient from '$lib/components/HeroAmbient.svelte'` | ✓ WIRED | `src/routes/+page.svelte:19` import, line 34 render |
| `/+page.svelte` | `ReelStage.svelte` | `<ReelStage videos={data.videos} />` | ✓ WIRED | `src/routes/+page.svelte:20` import, line 35 render |
| `HeroAmbient.svelte` | `createHeroDefer` | `const defer = createHeroDefer(); $effect(() => { defer.start(); return () => defer.dispose(); })` | ✓ WIRED | `HeroAmbient.svelte:45` import, line 60 instantiate, lines 92-96 lifecycle |
| `HeroAmbient.svelte` | `pageVisibility` rune | `const pauseFromMenuOrVisibility = $derived(pageVisibility.documentHidden)` + setContext bridge | ✓ WIRED | `HeroAmbient.svelte:44` import, line 73 derivation, lines 84-88 setContext bridge for PreviewLoop child |
| `HeroAmbient.svelte` | `runed useIntersectionObserver` | `useIntersectionObserver(() => heroEl, ..., { threshold: [0, 0.1] })` | ✓ WIRED | `HeroAmbient.svelte:39` import, lines 100-106 invocation |
| `HeroAmbient.svelte` CTA | `/watch/<producerReelId>` | `<a href={\`${base}/watch/${producerReelId}\`} data-sveltekit-preload-data="hover">▷ PLAY REEL</a>` | ✓ WIRED | `HeroAmbient.svelte:170-175`; build artifact confirms `/watch/264677021` href present in `build/index.html` |
| `/watch/[id]/+page.svelte` | `WatchPlayer.svelte` | `<WatchPlayer {video} bind:chromeFaded />` | ✓ WIRED | line 35 import, line 104 render with $bindable |
| `/watch/[id]/+page.svelte` | `ContinueReelRail.svelte` | `<ContinueReelRail {rail} category={video.category} {categorySlug} />` | ✓ WIRED | line 36 import, line 123 render |
| `WatchPlayer.svelte` | `attachVimeo`/`attachYouTube` | `video.source === 'vimeo' ? attachVimeo(iframeEl, handlers) : attachYouTube(iframeEl, handlers)` | ✓ WIRED | lines 41-42 imports, lines 113-115 dispatch inside `$effect` |
| `WatchPlayer.svelte` iframe | `buildEmbedUrl(video, 'play')` | `<iframe src={buildEmbedUrl(video, 'play')} ...>` | ✓ WIRED | line 40 import, line 139 src binding |
| `/watch/[id]/+page.ts entries` | `$lib/data videos` | `videos.map((v) => ({ id: v.id }))` | ✓ WIRED | line 27 import, line 29 entries body; build artifact: 56 prerendered files |
| `/watch/[id]/+page.ts load` | `getById` + `error(404)` | `if (!video) error(404, 'Video not found')` | ✓ WIRED | line 34 error throw |
| `ReelStage.svelte` snap-write | `/work#video=<id>` (Phase 3 carry-forward) | `history.replaceState(null, '', \`${base}/work#video=${currentId}\`)` | ✓ WIRED | `ReelStage.svelte:129-132` (debounced 300ms — Pitfall D deferred) |
| `ReelStage.svelte` hash-read | `sectionRefs[idx].scrollIntoView` | `$effect` reads `window.location.hash`, finds idx, `target.scrollIntoView({block:'start', behavior:'auto'})` | ✓ WIRED | `ReelStage.svelte:174-201` |
| `+layout.svelte` | `initVisibilityListener` | `onMount(() => { initVisibilityListener(); ... })` | ✓ WIRED | `+layout.svelte:29` import, line 45 call |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| HERO-01 | 05-01, 05-03 | `/` renders `<HeroAmbient />` — producer reel as silent muted hero bg + wordmark + tagline + PLAY REEL CTA | ✓ SATISFIED | HeroAmbient.svelte:33-185; build/index.html contains MICHELLE NGO/PLAY REEL/preload link/56-article reel below |
| HERO-02 | 05-03 | `↓` scroll-cue invites entry; scrolling reveals first ReelSection below | ✓ SATISFIED | HeroAmbient.svelte:179-184 (scroll-cue at bottom-10 left-1/2); /+page.svelte renders ReelStage BELOW HeroAmbient (sibling order); e2e hero.spec.ts test "scrolling past hero reveals the first ReelSection" |
| HERO-03 | 05-03 | `▷ PLAY REEL` navigates to /watch/264677021; embed plays with sound | ✓ SATISFIED (URL contract); ? UNCERTAIN (real-device audible sound) | href confirmed; iframe URL params autoplay=1 + playsinline=1, no muted=. Sticky-activation real-device verification flagged for UAT. |
| WATCH-01 | 05-01, 05-02 | /watch/[id] full-bleed letterboxed on black; chrome fades on Vimeo play + restores on hover/pause via postMessage | ✓ SATISFIED (mechanism + unit-tested); ? UNCERTAIN (real-Vimeo postMessage timing flagged for UAT) | WatchPlayer.svelte:38-148 (8-transition state machine); vimeoAdapter.ts pause subscription line 68 + dispose line 95; 15 unit tests green covering all 8 transitions via fake timers |
| WATCH-02 | 05-02 | Title + uploader + category + year metadata fade in on idle, out on play | ✓ SATISFIED | /watch/[id]/+page.svelte:107-121 (below-player chrome region shares chromeClass $derived with the back-button; chromeFaded is the single $bindable source-of-truth) |
| WATCH-03 | 05-02 | `<ContinueReelRail />` horizontal carousel surfaces same-category siblings beneath player | ✓ SATISFIED | ContinueReelRail.svelte:39-101 (pure CSS scroll-snap-x); rendered at /watch/[id]/+page.svelte:123; rail derivation in +page.ts:36-41; 9 unit tests + e2e PBS sample (17 cards) |
| WATCH-04 | 05-02 | 56 /watch/[id] slug routes prerender via entries() | ✓ SATISFIED | +page.ts:29 entries body; build artifact: 56 `.html` files in build/watch/; each contains VideoObject JSON-LD |
| WATCH-05 | 05-01, 05-02 | Back-nav from /watch/[id] restores user to the same section (via history.state + hash fragment on entry) | ✓ SATISFIED (mechanism + unit/e2e coverage); ? UNCERTAIN (real-device debounce-timing) | ReelStage.svelte:174-201 hash-restore $effect (consumer side); Phase 3 carry-forward writer at lines 129-132; data-video-id at line 263; restore.spec.ts e2e suite (direct paste, foreign hash, round-trip with weak fallback). NOTE: Phase 5 D-14 narrowed the original "history.state + hash" requirement to "hash-only" — documented and approved in 05-CONTEXT.md. |

**Orphaned requirements:** None. All 8 phase-5 IDs (HERO-01/02/03 + WATCH-01..05) are claimed by at least one plan in this phase's `requirements:` frontmatter, and REQUIREMENTS.md traceability table marks all 8 Complete under Phase 5.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |

Zero blocker anti-patterns. Zero TODO/FIXME/placeholder/coming-soon markers in production code (verified via grep across `src/lib/components/HeroAmbient.svelte`, `WatchPlayer.svelte`, `ContinueReelRail.svelte`, and `src/routes/watch/`). Test-only stubs (`__HeroPreviewLoopStub.svelte`, `__PageHeroAmbientStub.svelte`, `__PageReelStageStub.svelte`) are NOT imported by any production codepath (confirmed by `grep -rn 'Stub' src/routes` returning only `src/routes/page.test.ts` mock-target references).

One pre-existing lint failure in `.lintstagedrc.cjs` from Phase 3 commit `4e2b372` documented in `deferred-items.md` — NOT introduced by Phase 5, NOT blocking.

### Verification Commands Run

| Command | Result |
| ------- | ------ |
| `pnpm check` | 0 errors, 0 warnings, 610 files |
| `pnpm test` | 346/346 green across 31 files |
| `ls build/watch/ \| wc -l` | 56 (all WATCH-04 prerenders present) |
| `grep -c "MICHELLE NGO" build/index.html` | 1 (HERO-01 wordmark rendered) |
| `grep -c "PLAY REEL" build/index.html` | 1 (HERO-01 CTA rendered) |
| `grep -c "/watch/264677021" build/index.html` | 1 (HERO-03 CTA target) |
| `grep -c "Site coming soon" build/index.html` | 0 (Phase 1 splash REMOVED) |
| `grep -o "Video [0-9]* of 56" build/index.html \| wc -l` | 56 (full reel rendered below hero — HERO-02) |
| `grep -c "VideoObject" build/watch/264677021.html` | 1 (POL-01 carry-forward present per-route) |
| iframe src in build/watch/264677021.html | `https://player.vimeo.com/video/264677021?autoplay=1&dnt=1&playsinline=1` (HERO-03 sound-on URL contract + WATCH-01 + Plan 05-01 Finding 11 playsinline) |
| `grep -c "data-video-id=" build/work.html` | 112 (56 articles × 2 SSR — WATCH-05 selector hook landed) |
| `grep -c "addEventListener.*pause" src/lib/iframe/vimeoAdapter.ts` | 1 (Plan 05-01 Finding 1 fix) |
| `grep -c "removeEventListener.*pause" src/lib/iframe/vimeoAdapter.ts` | 1 (symmetric dispose) |
| `grep -c "playsinline" src/lib/iframe/url.ts` | 5 (Plan 05-01 Finding 11 unconditional) |
| `grep -c "initVisibilityListener" src/routes/+layout.svelte` | 2 (import + call) |

## Human Verification

See `human_verification:` block in frontmatter. Seven items requiring real-browser / real-device testing — all are documented carry-forward UAT for Phase 7 POL-04 (BrowserStack iOS Safari 16/17.x matrix), and all have substantive automated coverage (unit tests deterministically lock the state machines; e2e tests verify the URL contracts and DOM-attribute initial states). The flaky-in-headless items are explicitly called out in the SUMMARYs with explanation (Phase 3 HANDSHAKE_TIMEOUT_MS = 800ms cross-origin postMessage timing; debounced hash-write interplay with snap-settle).

**Suggested UAT routing:** add these 7 items as rows to `.planning/phases/03-reel-system-core-load-bearing-risk/03-HUMAN-UAT.md` (per Plan 05-03 carry-forward note in 05-03-SUMMARY.md §"For Phase 7 POL-04 real-device QA"), or persist as a new `05-HUMAN-UAT.md` in this phase directory for the orchestrator to fold into the Phase 7 polish gate.

## Gaps Summary

None. Every must-have has a real implementation, a working wire, and either automated or human-verification coverage. The status is `human_needed` rather than `passed` only because the cross-origin-postMessage and sticky-activation behaviors that the goal claims ("plays with sound on first paint", "chrome fades on play and back in on pause", "back-navigation restores exact reel position") have non-deterministic headless e2e coverage — they need a real browser session to fully verify the goal narrative, even though the mechanism is provably correct in code + unit tests + build artifacts.

---

_Verified: 2026-05-27T19:45:00Z_
_Verifier: Claude (gsd-verifier)_
