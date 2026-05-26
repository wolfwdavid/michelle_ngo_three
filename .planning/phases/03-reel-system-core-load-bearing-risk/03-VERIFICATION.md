---
phase: 03-reel-system-core-load-bearing-risk
type: verification
status: human_needed
created: 2026-05-25
updated: 2026-05-25
verified: 2026-05-25T22:00:00Z
verifier: Claude (gsd-verifier)
score: 7/7 truths verified at code level; 2 deferred real-device gates pending UAT
re_verification: false
deferred_decision_date: 2026-05-26
deferred_decision_by: user
deferred_until: "before Phase 7 cutover (per CONTEXT D-13 / D-14 / D-16)"

human_verification:
  - test: "BrowserStack real-device matrix (Task 8, D-13/D-14)"
    expected: |
      All 28 cells (7 OS rows × 4 pillars) PASS:
        - P1 fast-flick (REEL-01 / SC#1): scroll-snap proximity never traps
        - P2 windowed-mount (REEL-03 / SC#2): at most 3 iframes attached at any moment
        - P3 leak defense (REEL-06 / SC#4): 0 detached iframes after full scroll + return
        - P4 axe-core WCAG AA (NAV-03 fwd-ship / SC#6): 0 violations
      iOS Safari 16/17.0/17.1 specifically must not trip Pitfall 1 (playsinline
      scroll-freeze) or Pitfall 3 (LPM play() rejection — should be caught by
      the 800ms HANDSHAKE_TIMEOUT_MS from src/lib/iframe/url.ts).
    why_human: |
      BrowserStack real-device cloud + manual session runs required. Playwright's
      WebKit driver runs the desktop-class engine, NOT the iOS embed. iOS Safari
      16/17.0/17.1 are the load-bearing versions (Pitfall 1 scroll-freeze +
      Pitfall 3 LPM rejection target these). Cannot be automated without a
      subscription + human-driven session. Blocks Phase 7 cutover (not Phase 4-6).
    tracking: ".planning/phases/03-reel-system-core-load-bearing-risk/03-HUMAN-UAT.md test #1; blocked_by: third-party"
  - test: "Manual iPhone 5-min thermal QA (Task 9, D-16)"
    expected: |
      Physical iPhone, 5-min continuous reel scroll on /work:
        - Battery delta ≤ 8% in 5 min (PASS)
        - No audible fan within 60s
        - No visible scroll-snap stutter
      If delta > 8%: Escalation Branch A (drop ±1 to 360p) then re-run; if still
      > 8%, Branch B (reverse CONTEXT D-09 to current-only-plays). Both branches
      pre-sketched in this file's "Thermal QA" section.
    why_human: |
      Battery thermal throttling is hardware-side. Cannot be automated. Requires
      the user's physical iPhone with battery monitor. Validates the D-09
      "all-3-play" design bet against real iOS thermal envelope. Blocks Phase 7
      cutover.
    tracking: ".planning/phases/03-reel-system-core-load-bearing-risk/03-HUMAN-UAT.md test #2; blocked_by: physical-device"
---

# Phase 3 — Verification Report

**Phase Goal:** Ship the load-bearing reel system — scroll-snap cinematic stage
with viewport-windowed iframe mounting, 4-state iframe lifecycle with 5-layer
leak defense, REEL-04 unified poster-fallback codepath across 5 triggers,
Vimeo+YouTube postMessage adapters with origin allowlists, Page Visibility
broadcast for pause-not-unmount, build-time poster pipeline, Playwright e2e
gates. The /work route demonstrates all 56 videos in the scroll-snap reel.

**Verified:** 2026-05-25T22:00:00Z
**Status:** `human_needed` (code-level gates all green; 2 real-device gates
deferred to UAT per user decision 2026-05-26, blocking Phase 7 cutover but NOT
Phase 4/5/6)
**Re-verification:** No — initial verification

---

## DEFERRAL NOTE (2026-05-26)

**Tasks 8 + 9 of Plan 03-03 are DEFERRED as a UAT item.** The user explicitly
elected to skip the BrowserStack matrix run and the physical-iPhone thermal QA
during Plan 03-03 execution and finalize the plan against the green code-level
gates documented below (commit `9207d45`).

**Why deferred:** the all-3-play decision (CONTEXT D-09) is a design bet whose
load-bearing fallback path (PreviewLoop's 800ms handshake → unified PosterImage
codepath via `onautoplayfailed`) is already proven at the component and e2e
level in headless browsers. The real-device matrix exists to validate the bet
against iOS Safari 16/17.0/17.1 hardware quirks (Pitfall 1 scroll-freeze,
Pitfall 3 LPM rejection) and thermal envelope. These are validation gates,
not implementation gates — the code shipping in this plan does not change
depending on the matrix outcome (only the D-16 escalation branches below
would, IF the thermal test fails).

**Deferred-until milestone (BLOCKING):** these gates **MUST be closed before
Phase 7 cutover.** Per CONTEXT §Phase 3 done-criteria:

- D-13 — full POL-04 real-device matrix during Phase 3 (now deferred to a
  pre-Phase-7 UAT window).
- D-14 — BrowserStack subscription must be active when the matrix is run.
- D-16 — manual iPhone thermal QA with the documented escalation branches
  (A: drop ±1 to 360p; B: reverse D-09 to current-only-plays) standing by
  if the budget is exceeded.

**Tracking:** see `03-HUMAN-UAT.md` in this directory — two test entries
(BrowserStack matrix + iPhone thermal) status `[pending]`. `/gsd:audit-uat`
and `/gsd:progress` pick up the deferral via the UAT file's `partial` status.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/work` renders 56 fullscreen scroll-snap sections (REEL-01) | ✓ VERIFIED | `src/routes/work/+page.svelte` mounts `<ReelStage videos={data.videos} />`; ReelStage uses `h-svh snap-y snap-proximity overscroll-y-contain touch-pan-y`; `each videos as video` loop renders 56 `<article>` landmarks. Build emits `build/work.html` prerendered (adapter-static). |
| 2 | Silent muted preview loops via raw iframe URL params (REEL-02; no @vimeo/player) | ✓ VERIFIED | `src/lib/iframe/url.ts` `buildEmbedUrl()` produces Vimeo `?autoplay=1&dnt=1&muted=1&loop=1&background=1&quality=540p&playsinline=1` + YouTube `?autoplay=1&mute=1&loop=1&playlist={id}&playsinline=1&modestbranding=1&vq=medium&iv_load_policy=3&enablejsapi=1&controls=0` on `youtube-nocookie.com`. `grep @vimeo/player src/` returns EMPTY. `grep lite-(vimeo\|youtube)-embed src/` returns EMPTY. |
| 3 | Viewport-windowed mounting — ONE IO per stage, ±1 window (REEL-03) | ✓ VERIFIED | `src/lib/components/ReelStage.svelte` calls `useIntersectionObserver` exactly once with array target getter; threshold `[0, 0.5, 1]`, rootMargin `'100% 0%'`. `mountedIds` SvelteSet is capped at 3 by construction (loop `Math.max(0, bestIdx - 1)` to `Math.min(videos.length - 1, bestIdx + 1)`). Playwright Pillar 2 e2e asserts `iframe.count() ≤ 3` during full scroll. |
| 4 | REEL-04 unified codepath — 5 triggers collapse through ONE `$derived` in ReelSection | ✓ VERIFIED | `src/lib/components/ReelSection.svelte:65` literal: `const shouldShowPoster = $derived(motion.prefersReducedMotion \|\| network.isCellularLike \|\| autoplayFailedFromPreviewLoop);` — three input layers, one switch. Triggers 3-5 (LPM, autoplay-block, embed-disabled, EU) all collapse through `onautoplayfailed` callback fired by PreviewLoop's 800ms HANDSHAKE_TIMEOUT_MS OR `onError` handler. Single `<PosterImage>` renderer for all 5 triggers. **This is the highest-leverage architectural decision in Phase 3 made concrete.** |
| 5 | REEL-05 overlay (title + category tag + PLAY WITH SOUND deep-link) | ✓ VERIFIED | `src/lib/components/ReelSection.svelte` renders `<h2 class="font-display">{video.title}</h2>` bottom-left, `<span>` category tag top-right with `var(--color-cat-{token})` accent, `<a href={`${base}/watch/${video.id}`}>` PLAY WITH SOUND deep-link with `tabindex={isCurrent ? 0 : -1}`. Pitfall 20 two-stop gradient overlay present. PosterImage repeats the same REEL-05 overlay structure (POL-03 zero-CLS swap). |
| 6 | 4-state iframe lifecycle + 5-layer leak defense (REEL-06) | ✓ VERIFIED | `src/lib/components/PreviewLoop.svelte` ships `LifecycleState = 'unmounted' \| 'mounted-loading' \| 'mounted-playing' \| 'unmounting'`. L1 Svelte `{#if}` teardown; L2 adapter `dispose()` in `$effect` cleanup (sends defensive `{method:'removeEventListener', value:'play'}` to Vimeo before DOM removal); L3 `useIntersectionObserver` auto-disconnect via runed; L4 named function refs (`onMsg`, `onLoad` const declarations in vimeoAdapter.ts + youtubeAdapter.ts); L5 origin allowlist (`https://player.vimeo.com` and `https://www.youtube-nocookie.com` hardcoded; `e.source !== iframe.contentWindow` check). |
| 7 | Page Visibility broadcast — pause-not-unmount within 300ms (REEL-07) | ✓ VERIFIED | `src/lib/components/ReelStage.svelte:151-157` `onMount` attaches `visibilitychange` listener, sets `documentHidden = document.hidden`, broadcasts via `setContext('reel:visibility')`. `src/lib/components/PreviewLoop.svelte:122-150` `$effect` reads `visibility.documentHidden` (gated on `lifecycle === 'mounted-playing'`); sends Vimeo `{method:'pause'}` OR YouTube `{event:'command', func:'pauseVideo'}` postMessage on hidden=true. Resume on hidden→visible TRANSITION (gated by `wasHidden` flag to avoid spurious play on initial render). Iframes stay mounted (D-12). |

**Score:** 7/7 truths verified at code level

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/components/ReelStage.svelte` | Scroll-snap container + ONE runed IO + Page Visibility broadcast | ✓ VERIFIED | 175 LOC; `useIntersectionObserver` count = 1; rootMargin `'100% 0%'`; threshold `[0, 0.5, 1]`; setContext `reel:stage` + `reel:visibility`; `<article aria-label="Video N of M: [title]">` landmark; URL hash write via `history.replaceState` debounced 300ms (Pitfall 12); `grep -E "100vh\|100dvh\|h-screen\|h-dvh\|snap-mandatory" src/lib/components/Reel*.svelte` returns EMPTY |
| `src/lib/components/ReelSection.svelte` | `<article>` content + REEL-05 overlay + REEL-04 unified $derived gate | ✓ VERIFIED | 163 LOC; consumes `getContext('reel:stage')`; `shouldShowPoster = $derived(motion.prefersReducedMotion \|\| network.isCellularLike \|\| autoplayFailedFromPreviewLoop)`; `shouldMount = $derived(!shouldShowPoster && stage.mountedIds.has(video.id))`; renders PreviewLoop OR PosterImage; PLAY WITH SOUND `<a>` with `tabindex={isCurrent ? 0 : -1}` |
| `src/lib/components/PreviewLoop.svelte` | 4-state lifecycle + 5-layer leak defense + 800ms timeout + Page Visibility | ✓ VERIFIED | 175 LOC; lifecycle state machine (unmounted → mounted-loading → mounted-playing → unmounting); HANDSHAKE_TIMEOUT_MS=800 imported (not inlined); `onPlay` → mounted-playing; `onError`/timeout → unmounting + `onautoplayfailed?.()`; `$effect` cleanup: `clearTimeout` → `dispose()`; iframe attrs: `allow="autoplay; fullscreen; picture-in-picture"`, `referrerpolicy="strict-origin-when-cross-origin"`, `aria-hidden="true"`, `loading="lazy"`; Page Visibility postMessage `pause`/`play` gated on `mounted-playing` + `wasHidden` transition |
| `src/lib/components/PosterImage.svelte` | Sidecar consumer + aspect-ratio container + PLAY WITH SOUND CTA | ✓ VERIFIED | 192 LOC; `getPosterFor(video)` from sidecar; `aspect-ratio: 16 / 9` (POL-03 zero-CLS); `loading="lazy"` + `fetchpriority="low"` + `decoding="async"`; two-stop gradient overlay (Pitfall 20); PLAY WITH SOUND anchor `href={`${base}/watch/${video.id}`}` always rendered; inline category tag (no extracted CategoryTag.svelte). Uses plain `<img>` (not `<enhanced:img>` — runtime sidecar paths preclude build-time variant generation per documented note). |
| `src/lib/iframe/url.ts` | Pure buildEmbedUrl + HANDSHAKE_TIMEOUT_MS export | ✓ VERIFIED | 82 LOC; pure (no DOM/window); Vimeo preview URL contains ALL 7 locked params; YouTube preview URL contains ALL 10 locked params on `youtube-nocookie.com` host; `HANDSHAKE_TIMEOUT_MS = 800 as const` exported |
| `src/lib/iframe/vimeoAdapter.ts` | Origin allowlist + named refs + defensive dispose | ✓ VERIFIED | 89 LOC; `ALLOWED_ORIGIN = 'https://player.vimeo.com'`; `const onMsg`, `const onLoad` named refs; `e.origin !== ALLOWED_ORIGIN` + `e.source !== iframe.contentWindow` checks; `dispose()` sends defensive `{method:'removeEventListener', value:'play'}` then removes both listeners by SAME ref; `disposed = true` idempotent guard |
| `src/lib/iframe/youtubeAdapter.ts` | Origin allowlist + listening handshake + state-change mapping | ✓ VERIFIED | 81 LOC; `ALLOWED_ORIGIN = 'https://www.youtube-nocookie.com'`; one-shot listening postMessage on iframe load with `id: iframe.id \|\| 'reel-yt'`; `YT_STATE_PLAYING = 1` → onPlay; `YT_STATE_PAUSED = 2` → onPause; `onError`; named refs; idempotent dispose; no defensive postMessage (YouTube has no clean unsubscribe; documented) |
| `src/lib/state/network.svelte.ts` | Module-scope rune; SSR-safe; D-05 Chromium-only progressive enhancement | ✓ VERIFIED | 96 LOC; `network.isCellularLike` getter returns false when `navigator.connection` undefined (Safari/Firefox); true when saveData OR effectiveType ∈ {slow-2g, 2g, 3g} OR downlink < 1.5; `initNetworkState()` is idempotent + `__isBrowser()`-guarded; no `$effect.root` wrap (correct module-scope pattern per RESEARCH §Pattern 3) |
| `src/lib/state/motion.svelte.ts` | Module-scope rune; SSR-safe; matchMedia reactive | ✓ VERIFIED | 57 LOC; `motion.prefersReducedMotion` getter; SSR-safe default false; `initMotionState()` idempotent + browser-guarded; reads `matchMedia('(prefers-reduced-motion: reduce)')` + flips reactively on 'change' event |
| `src/lib/data/posters.ts` | `getPosterFor(video)` helper | ✓ VERIFIED | 32 LOC; static import of `posters.json`; returns sidecar entry if present, deterministic fallback `/posters/{source}-{id}.jpg` otherwise (non-null contract per D-02) |
| `src/lib/data/posters.json` | 56-entry sidecar | ✓ VERIFIED | `Object.keys(posters).length === 56`; all values are STRINGS starting with `/posters/`; key pattern `/^(vimeo\|youtube)-[A-Za-z0-9_-]+$/` |
| `static/posters/*.jpg` | 56 committed JPEGs | ✓ VERIFIED | `find static/posters/ -name "*.jpg" \| wc -l` → 56 (42 Vimeo + 14 YouTube — note: SUMMARY claims 43+13 but actual corpus is 42+14, total still 56) |
| `src/routes/work/+page.ts` | Universal load + prerender | ✓ VERIFIED | `export const prerender = true`; `import { videos } from '$lib/data'`; load returns `{ videos }` |
| `src/routes/work/+page.svelte` | Mounts ReelStage | ✓ VERIFIED | Imports ReelStage; renders `<ReelStage videos={data.videos} />`; svelte:head sets title/meta. Build emits `build/work.html` (adapter-static). |
| `src/routes/+layout.svelte` | Init state runes in onMount | ✓ VERIFIED | Imports `initMotionState` + `initNetworkState`; calls both in `onMount(() => { ... })`; browser-only (SSR-safe per __isBrowser guards) |
| `scripts/check-embeds.ts` | `--posters-only` flag + poster fetch | ✓ VERIFIED | Parses `--posters-only` flag; reuses Vimeo oEmbed `thumbnail_url`; YouTube tries `maxresdefault.jpg` then falls back to `hqdefault.jpg` (Pitfall 16); D-15 per-host concurrency limit (6) preserved |
| `vite.config.ts` | validatePostersPlugin between tailwindcss + sveltekit | ✓ VERIFIED | `validatePostersPlugin()` defined; `plugins: [tailwindcss(), validateVideosPlugin(), validatePostersPlugin(), sveltekit()]`; buildStart hook fails on missing posters with ::error:: annotation + literal fix command |
| `tests/e2e/reel.spec.ts` | 4-pillar suite + reduced-motion + page-visibility | ✓ VERIFIED | 259 LOC; ships Pillar 1 (fast-flick / REEL-01), Pillar 2 (windowed-mount / REEL-03), Pillar 3 (leak defense / REEL-06), Pillar 4 (axe-core WCAG AA / NAV-03 fwd-ship), reduced-motion fallback (REEL-04 trigger 1), Page Visibility pause (REEL-07). Headless Page Visibility caveat documented inline + 3 skips. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/routes/+layout.svelte` | `motion.svelte.ts` + `network.svelte.ts` | `onMount → initMotionState() + initNetworkState()` | ✓ WIRED | Both imports present; both called in onMount |
| `ReelStage.svelte` | runed `useIntersectionObserver` | single call with array target getter | ✓ WIRED | One call; threshold [0,0.5,1]; rootMargin '100% 0%' |
| `ReelStage.svelte` | `document.visibilitychange` | onMount addEventListener + cleanup | ✓ WIRED | Listener attached + removed; broadcasts via `setContext('reel:visibility')` |
| `ReelSection.svelte` | `network.svelte.ts` + `motion.svelte.ts` | `$derived` gate computing shouldShowPoster | ✓ WIRED | Three-term OR: `motion.prefersReducedMotion \|\| network.isCellularLike \|\| autoplayFailedFromPreviewLoop` |
| `ReelSection.svelte` | `ReelStage.svelte` | `getContext('reel:stage')` | ✓ WIRED | Reads mountedIds + activeIdx + videoCount |
| `ReelSection.svelte` | `PreviewLoop.svelte` | `<PreviewLoop {video} onautoplayfailed={handleAutoplayFailed} />` | ✓ WIRED | Callback flips per-section autoplayFailedFromPreviewLoop; tested for no-cascade across siblings |
| `PreviewLoop.svelte` | `url.ts` | `buildEmbedUrl(video, 'preview')` in iframe src | ✓ WIRED | iframe `src={buildEmbedUrl(video, 'preview')}` |
| `PreviewLoop.svelte` | `vimeoAdapter.ts` + `youtubeAdapter.ts` | $effect attach + cleanup dispose | ✓ WIRED | `video.source === 'vimeo' ? attachVimeo(...) : attachYouTube(...)`; dispose returned in cleanup before iframe DOM removal |
| `PreviewLoop.svelte` | `reel:visibility` context | getContext + $effect on documentHidden | ✓ WIRED | Sends pause/play postMessage gated on lifecycle='mounted-playing' + wasHidden transition |
| `vimeoAdapter.ts` | `https://player.vimeo.com` | MessageEvent.origin allowlist | ✓ WIRED | Hardcoded ALLOWED_ORIGIN; e.source check; defensive removeEventListener postMessage on dispose |
| `youtubeAdapter.ts` | `https://www.youtube-nocookie.com` | MessageEvent.origin allowlist + iframe host | ✓ WIRED | Hardcoded ALLOWED_ORIGIN; matches url.ts iframe host |
| `PosterImage.svelte` | `posters.ts` → `posters.json` | `getPosterFor(video)` | ✓ WIRED | $derived(getPosterFor(video)) for prop-swap reactivity |
| `vite.config.ts` validatePostersPlugin | `videos.json` + `posters.json` + `static/posters/` | buildStart hook | ✓ WIRED | Plugin slotted between validateVideosPlugin and sveltekit (mirrors Phase 2 D-03 pattern) |
| `scripts/check-embeds.ts` | Vimeo oEmbed + i.ytimg.com | `--posters-only` flag fetches thumbnails | ✓ WIRED | Vimeo `thumbnail_url` reused from oEmbed; YouTube `maxresdefault.jpg` with `hqdefault.jpg` fallback per Pitfall 16 |
| `tests/e2e/reel.spec.ts` | `@axe-core/playwright` | `AxeBuilder({ page }).withTags(['wcag2a', ...]).analyze()` | ✓ WIRED | Pillar 4 axe-core WCAG AA scan asserts 0 violations |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REEL-01 | 03-01 | `/work` 56 fullscreen scroll-snap sections; 100svh + scroll-snap-type: y proximity | ✓ SATISFIED | ReelStage container uses `h-svh snap-y snap-proximity`; 56 `<article>` landmarks; build emits `build/work.html`; Playwright Pillar 1 fast-flick green |
| REEL-02 | 03-02 | Silent muted autoplay loops via raw iframe URL params | ✓ SATISFIED | `src/lib/iframe/url.ts` buildEmbedUrl ships exact Vimeo + YouTube param contracts; no @vimeo/player dep; URL builder tested against all 56 videos |
| REEL-03 | 03-01 + 03-02 | Viewport-windowed ±1 mounting; ONE IO per stage | ✓ SATISFIED | ReelStage uses ONE useIntersectionObserver with array target; mountedIds capped at 3 by loop bounds; Playwright Pillar 2 e2e asserts iframe count ≤ 3 |
| REEL-04 | 03-01 + 03-02 + 03-03 | Unified 5-trigger fallback codepath | ✓ SATISFIED | ReelSection.svelte:65 `shouldShowPoster = $derived(motion.prefersReducedMotion \|\| network.isCellularLike \|\| autoplayFailedFromPreviewLoop)` — 5 triggers collapse via 3 input layers (triggers 3-5 funnel through PreviewLoop's 800ms timeout → `onautoplayfailed` callback); ONE PosterImage renderer for all 5 |
| REEL-05 | 03-01 + 03-03 | Title + category tag + PLAY WITH SOUND deep-link | ✓ SATISFIED | Both ReelSection and PosterImage render `<h2 class="font-display">{video.title}</h2>` + inline category tag with `var(--color-cat-{token})` + `<a href={`${base}/watch/${video.id}`}>` PLAY WITH SOUND anchor |
| REEL-06 | 03-02 | 4-state lifecycle + 5-layer leak defense | ✓ SATISFIED | PreviewLoop ships full state machine (unmounted → mounted-loading → mounted-playing → unmounting); all 5 layers wired (L1 Svelte teardown, L2 adapter dispose with defensive postMessage, L3 IO disconnect via runed, L4 named function refs in adapters, L5 origin allowlist + e.source check); Playwright Pillar 3 leak defense asserts no detached iframes after full scroll + return |
| REEL-07 | 03-01 + 03-02 | Page Visibility pause within 300ms; pause-not-unmount | ✓ SATISFIED | ReelStage attaches visibilitychange listener in onMount; broadcasts via `reel:visibility` context; PreviewLoop's Page Visibility $effect sends provider-specific pause postMessage on hidden=true (gated on lifecycle='mounted-playing'); resume on hidden→visible TRANSITION (wasHidden guard); iframes stay mounted (D-12) |

**All 7 phase requirements satisfied at the code level.** No orphaned requirements
in REQUIREMENTS.md for Phase 3 (REEL-01 through REEL-07 only; all accounted for
in plan frontmatter across 03-01, 03-02, 03-03).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None | — | All 7 anti-pattern grep gates clean per SUMMARY commit `9207d45` |

**Verified anti-pattern grep gates (all EMPTY in production source):**

- `@vimeo/player` import — EMPTY (raw iframe + raw postMessage locked per RESEARCH)
- `lite-vimeo-embed` / `lite-youtube-embed` — EMPTY (custom-element clash with Svelte reconciler)
- `100vh` / `100dvh` / `h-screen` / `h-dvh` in `Reel*.svelte` — EMPTY (Pitfall 2 locked; uses `h-svh`)
- `snap-mandatory` / `snap-y-mandatory` — EMPTY (Pitfall 7 locked; uses `snap-proximity`)
- `new IntersectionObserver(...)` in `Reel*.svelte` — EMPTY (uses runed wrapper)
- `vumbnail` (unofficial Vimeo CDN) — EMPTY (Pitfall 16 mitigation)
- `https://www.youtube.com/embed` (cookie host) — EMPTY (D-06 EU posture; nocookie host always)

**Note on grep matches in test files:** the only matches for `h-screen` / `h-dvh` / `snap-mandatory`
strings appear in `src/lib/components/ReelStage.test.ts` as NEGATIVE assertions
(`expect(classes).not.toContain('h-screen')` etc.) — these are the gate guards
themselves, not anti-pattern leakage.

### Code-Level Gate Baseline (Plan 03-03 Task 7)

- ✓ `pnpm test` — **165 / 165 unit + component tests pass** (verified live during verification)
- ✓ `pnpm check` — **0 errors, 0 warnings** (TS strict + noUncheckedIndexedAccess + noImplicitOverride; 563 files; verified live during verification)
- ✓ `pnpm build` — **green** (adapter-static + validateVideosPlugin + validatePostersPlugin all pass; `build/work.html` prerendered)
- ✓ `pnpm test:e2e` — **21 passed, 3 skipped** (Page Visibility headless caveat documented) across chromium + webkit + firefox

### Human Verification Required

Two real-device gates remain pending per user decision 2026-05-26. **These do
NOT block Phase 4/5/6 progress; they block Phase 7 production cutover.**

#### 1. BrowserStack Real-Device Matrix (D-13 / D-14)

**Test:** Manual BrowserStack sessions per OS row.
- **Staging URL:** `https://wolfwdavid.github.io/michelle_ngo_three/work`
- **OS matrix:** iOS Safari 16.x, 17.0, 17.1, 17.2+; Chrome Android latest; Firefox desktop latest; Safari macOS latest
- **Pillars per OS:** P1 fast-flick (REEL-01 / SC#1) + P2 windowed-mount (REEL-03 / SC#2) + P3 leak defense (REEL-06 / SC#4) + P4 axe-core WCAG AA (NAV-03 / SC#6)

**Expected:** All 28 cells PASS. No iOS 16/17.0/17.1 P1 FAILs (Pitfall 1 mitigation). No P3 FAILs (REEL-06 non-negotiable).

**Why human:** Playwright WebKit ≠ real iOS Safari 16/17.0/17.1. Pitfall 1
`playsinline` scroll-freeze + Pitfall 3 LPM `play()` rejection target the
iOS embed, not desktop WebKit. BrowserStack subscription + manual sessions
required.

**Tracking:** `03-HUMAN-UAT.md` test #1; status: `[pending]`; blocked_by: `third-party`.

#### 2. Manual iPhone 5-Min Thermal QA (D-16)

**Test:** Physical iPhone, 5-min continuous reel scroll on `/work`.
- Open Settings → Battery; note %
- Navigate to `https://wolfwdavid.github.io/michelle_ngo_three/work`
- Scroll continuously for 5 min (timer-tracked)
- Re-check Settings → Battery; record delta
- Subjective: fan audible? scroll-snap stutter? perceived warmth?

**Expected:** Battery delta ≤ 8% in 5 min. No audible fan within 60s. No visible scroll-snap stutter.

**Escalation Branch A** (if delta > 8%): Drop ±1 quality to 360p (keep 540p for
current section). Extend `buildEmbedUrl` signature with optional `quality` opt;
extend `reel:stage` context with `getSectionQuality(idx)`; re-run.

**Escalation Branch B** (if Branch A still > 8%): Reverse CONTEXT D-09 (all-3-play).
Narrow play instruction to current-only-plays via `playingId` context flag.
Document the D-09 reversal explicitly under "D-09 reversal (escalation B)".

**Why human:** Battery thermal throttling is hardware-side. Cannot be automated.
Requires user's physical iPhone with battery monitor. Validates D-09 design bet
against real iOS thermal envelope.

**Tracking:** `03-HUMAN-UAT.md` test #2; status: `[pending]`; blocked_by: `physical-device`.

---

## BrowserStack Real-Device Matrix (D-13 / D-14)

**Status:** 🟡 DEFERRED — tracked as UAT (see `03-HUMAN-UAT.md`); must close before Phase 7 cutover
**Deferral decision date:** 2026-05-26
**Run date:** _YYYY-MM-DD (to be filled when the matrix is actually run)_
**BrowserStack subscription:** _confirmed active before run / link to billing dashboard_
**Staging URL:** `https://wolfwdavid.github.io/michelle_ngo_three/work`
**BrowserStack session links:** _paste links per row when sessions complete_

### Pillar Definitions (matches `tests/e2e/reel.spec.ts`)

- **P1 fast-flick** — REEL-01 / SC#1: scroll-snap proximity does NOT trap; fast wheel/swipe from section 1 to section ~30 lands cleanly
- **P2 windowed-mount** — REEL-03 / SC#2: at most 3 iframes attached at any moment during scroll (DevTools Elements → search `iframe`)
- **P3 leak defense** — REEL-06 / SC#4: scroll all 56 sections forward + back; Memory snapshot shows 0 detached iframe nodes
- **P4 axe-core WCAG AA** — NAV-03 fwd-ship / SC#6: axe DevTools extension reports 0 violations on `wcag2aa` tag

### Matrix

| OS / Browser | Device | P1 fast-flick | P2 windowed-mount | P3 leak defense | P4 axe WCAG AA | Notes |
|--------------|--------|---------------|-------------------|-----------------|----------------|-------|
| iOS Safari 16.x | iPhone 12 (real) | ⬜ | ⬜ | ⬜ | ⬜ | Pitfall 1 `playsinline` scroll-freeze regression target |
| iOS Safari 17.0 | iPhone 13 (real) | ⬜ | ⬜ | ⬜ | ⬜ | Pitfall 1 + Pitfall 3 LPM rejection |
| iOS Safari 17.1 | iPhone 14 (real) | ⬜ | ⬜ | ⬜ | ⬜ | Pitfall 1 last-affected version |
| iOS Safari 17.2+ | iPhone 15 (real) | ⬜ | ⬜ | ⬜ | ⬜ | Post-fix baseline |
| Chrome Android | Latest Galaxy (real) | ⬜ | ⬜ | ⬜ | ⬜ | Non-iOS mobile baseline |
| Firefox desktop | macOS Sonoma+ | ⬜ | ⬜ | ⬜ | ⬜ | Desktop non-Chromium |
| Safari macOS | macOS Sonoma+ | ⬜ | ⬜ | ⬜ | ⬜ | Desktop WebKit (≠ iOS WebKit) |

**Legend:** ⬜ pending, ✅ PASS, ❌ FAIL, ⚪ N/A (test inapplicable to platform)

### Failure Triage Reference

If any cell becomes ❌ FAIL, add a notes-column entry naming the bug + linking to the BrowserStack session.

- **Pitfall 1 trap on iOS 16/17.0/17.1:** confirm `touch-action: pan-y` is set on the scroll container (Plan 03-01 ReelStage — already present in `src/lib/components/ReelStage.svelte`). Add visible "next ↓ / prev ↑" affordance if needed. Document workaround.
- **Pitfall 3 LPM bug:** should be caught by the 800ms HANDSHAKE_TIMEOUT_MS from Plan 03-02 D-07. If `onautoplayfailed` isn't firing, debug PreviewLoop's postMessage handshake on real iOS hardware (BrowserStack's DevTools attach is the only way).
- **Pitfall 4 bandwidth cost:** BrowserStack DevTools Network panel → confirm Vimeo URLs show `quality=540p` in request URLs; YouTube URLs show `youtube-nocookie.com` host.
- **Pitfall 5 leak:** if Memory snapshot shows detached iframes, PreviewLoop adapter `dispose()` ordering is wrong; debug Plan 03-02 `vimeoAdapter.ts` / `youtubeAdapter.ts`.
- **Pitfall 13 EU GDPR:** BrowserStack EU IP option → confirm no `yt-remote-device-id` in DevTools Application/Storage before user interaction.

### Phase 3 Close Gates (BLOCKING)

- If ANY P3 leak defense is ❌ FAIL → Phase 3 close BLOCKED until the leak is fixed (REEL-06 SC#4 is non-negotiable).
- If ANY iOS Safari 16/17.0/17.1 P1 fast-flick is ❌ FAIL → Phase 3 close BLOCKED until Pitfall 1 mitigation lands (mandatory `touch-action: pan-y` verification + escape affordance).

---

## Thermal QA (D-16 — physical iPhone 5-min reel scroll)

**Status:** 🟡 DEFERRED — tracked as UAT (see `03-HUMAN-UAT.md`); must close before Phase 7 cutover
**Deferral decision date:** 2026-05-26
**Run date:** _YYYY-MM-DD_
**Device:** _iPhone model, iOS version_
**Network:** _Wi-Fi / cellular type_
**Battery before:** _N%_
**Battery after:** _M%_
**Delta:** _N-M% in 5 min_
**Result:** _PASS if ≤ 8% / ESCALATE if > 8%_
**Subjective notes:** _fan audible? scroll-snap stutter? perceived warmth?_

### Manual Run Script

1. Open Settings → Battery; note current battery percentage (e.g., 87%).
2. Open Safari; navigate to `https://wolfwdavid.github.io/michelle_ngo_three/work`.
3. Wait for reel to render (first poster paint).
4. Continuously scroll the reel for **5 minutes** (use a timer; finger-scroll the full reel; repeat as needed).
5. After 5 min, stop scrolling; lock the phone (don't power-off).
6. Open Settings → Battery again; note current battery percentage (e.g., 81%).
7. Calculate delta: 87% - 81% = **6%** drop in 5 min.
8. Record above. If delta > 8%, follow the escalation branches.

### Escalation Branch A — Delta > 8% in 5 min

Drop ±1 quality to 360p (keep 540p for current section only). Modify:

1. **`src/lib/iframe/url.ts`** — extend `buildEmbedUrl` signature with optional `quality` opt:
   ```ts
   export function buildEmbedUrl(
     video: Video,
     mode: 'preview' | 'play',
     opts?: { quality?: '360p' | '540p' }
   ): string {
     const quality = opts?.quality ?? '540p';
     // Vimeo: params.set('quality', quality);
     // YouTube: params.set('vq', quality === '360p' ? 'small' : 'medium');
   }
   ```
2. **`src/lib/components/ReelStage.svelte`** — extend `reel:stage` context with `getSectionQuality(idx)`:
   ```ts
   function getSectionQuality(idx: number): '360p' | '540p' {
     return idx === activeIdx ? '540p' : '360p';
   }
   setContext('reel:stage', { ..., getSectionQuality });
   ```
3. **`src/lib/components/PreviewLoop.svelte`** — read from context and pass to URL builder.
4. Re-run 5-min thermal test. Record new delta. If still > 8%, proceed to Branch B.

### Escalation Branch B — After Branch A, delta STILL > 8% in 5 min

Reverse CONTEXT D-09 (all-3-play). Modify ReelStage to pause N-1 and N+1 immediately after mount; only N plays.

1. **`src/lib/components/ReelStage.svelte`** — narrow the play instruction in the IO callback:
   ```ts
   // expose playingId via context; only the matching PreviewLoop calls play(),
   // others stay paused after mount.
   setContext('reel:stage', { ..., playingId });
   ```
2. **`src/lib/components/PreviewLoop.svelte`** — react to playingId via $effect; call adapter.pause() if not the playing section.
3. Document the D-09 reversal explicitly in this file under `### D-09 reversal (escalation B)`:

   ```markdown
   ### D-09 reversal (escalation B)

   After Branch A 360p ±1 quality cap did not meet the thermal budget, reversed
   CONTEXT D-09: N-1 and N+1 mounted but PAUSED; only N plays. Battery delta now:
   _NEW_DELTA_% in 5 min.

   This is a deviation from CONTEXT D-09 (locked decision "all 3 within window
   play simultaneously"). Future phases (4/5) inherit the current-only-plays
   posture.
   ```

---

## Gaps Summary

**No code-level gaps.** All 7 observable truths verified; all 18 artifacts pass
existence + substantive + wired checks; all 15 key links verified; all 7 phase
requirements satisfied; all 7 anti-pattern grep gates clean; 165/165 vitest +
0/0 svelte-check + green build + 21-passed e2e.

**Two human-only verifications remain pending** — both deferred per explicit
user decision 2026-05-26 with documented rationale, escalation branches, and
Phase 7 cutover blocking obligation. These are validation gates (the D-09
"all-3-play" design bet against real iOS thermal + Pitfall 1/3 hardware
quirks), not implementation gates — the code shipping in Phase 3 does not
change depending on the matrix outcome (only the D-16 escalation branches A/B
would, IF the thermal test fails).

---

## Sign-off

**Code-level gates (Plan 03-03 — CLOSED 2026-05-26 at commit `9207d45`):**

- [x] `pnpm test` green (165 / 165 unit + component tests; verified live by gsd-verifier 2026-05-25)
- [x] `pnpm check` clean (0 TS errors, 0 svelte warnings; verified live)
- [x] `pnpm build` clean (validateVideosPlugin + validatePostersPlugin both green; `build/work.html` prerendered; verified live)
- [x] `pnpm test:e2e` 21 passed / 3 skipped (chromium + webkit + firefox; Page Visibility skips are a documented headless caveat — see `03-03-SUMMARY.md`)
- [x] All 7 anti-pattern grep gates clean (negative-assertion test refs + comment refs documented)
- [x] All 7 phase requirements (REEL-01..07) satisfied at the code level
- [x] REEL-04 unified codepath observable in code: ONE `$derived` in ReelSection collapses 5 triggers (not 5 separate branches)

**Real-device gates (DEFERRED 2026-05-26 — tracked in `03-HUMAN-UAT.md`):**

- [ ] BrowserStack matrix populated for all 7 OS rows × 4 pillar columns (28 cells)
- [ ] Thermal QA delta ≤ 8% in 5 min (after any escalations)
- [ ] If D-09 reversed: explicit deviation block above with NEW_DELTA recorded
- [ ] No P3 ❌ FAIL cells remaining (REEL-06 SC#4 is non-negotiable)
- [ ] No iOS Safari 16/17.0/17.1 P1 ❌ FAIL cells remaining (Pitfall 1 mitigation verified)

**Cutover blocker:** all 5 unchecked items above must be ✅ before Phase 7
cutover (production deploy to `michellengo.net`). Phase 4 / 5 / 6 may proceed
on top of the code-level gates without the real-device evidence; the matrix
exists to validate the D-09 design bet, not to gate downstream feature work.

**Verifier note:** `/gsd:verify-work` reads this file in addition to
`03-03-SUMMARY.md` and `03-HUMAN-UAT.md` for the formal Phase 3 close decision.
The current decision posture is **"code-complete, real-device-evidence pending."**

---

_Verified: 2026-05-25T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
