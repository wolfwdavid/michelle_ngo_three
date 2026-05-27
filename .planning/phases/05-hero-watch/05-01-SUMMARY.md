---
phase: 05-hero-watch
plan: 01
subsystem: foundation-extensions
tags: [vimeo-adapter, ios-safari, page-visibility, scroll-restoration, svelte-runes, foundation]
requires:
  - .planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md (D-09 peak-3-iframe budget; D-12 reel:visibility broadcast; Pitfall 12 hash-write)
  - .planning/phases/04-wayfinding/04-CONTEXT.md (D-08 menu-pause bridge; D-13 URL-canonical)
  - .planning/phases/05-hero-watch/05-CONTEXT.md (D-07, D-14, D-15, D-16, D-17)
  - .planning/phases/05-hero-watch/05-RESEARCH.md (Finding 1, Finding 10 option a, Finding 11, Pitfall B, Pitfall C)
provides:
  - "vimeoAdapter.attachVimeo onLoad now subscribes to pause postMessage; dispose symmetric"
  - "buildEmbedUrl(video, 'play') sets playsinline=1 for both Vimeo + YouTube (iOS Safari in-document)"
  - "$lib/state/visibility.svelte.ts pageVisibility rune (documentHidden = pageHidden OR menu.menuOpen) registered once via initVisibilityListener in +layout.svelte"
  - "ReelStage consumes the pageVisibility rune (writer removed) and ships the D-15 hash-restoration $effect"
affects:
  - "Plan 05-02 (WatchPlayer): attachVimeo onPause now actually fires; buildEmbedUrl 'play' already includes playsinline=1 — no call-site additions needed"
  - "Plan 05-03 (HeroAmbient): import pageVisibility, gate iframe mount on !pageVisibility.documentHidden"
  - "Phase 3 PreviewLoop: ZERO regressions (reel:visibility setContext shape unchanged)"
tech-stack:
  added: []
  patterns:
    - "Module-scope rune + initFn idempotency + __resetForTests test hook (mirrors menu.svelte.ts and motion.svelte.ts shape)"
    - "$effect (NOT onMount) for refs-bound DOM consumers — sectionRefs[] is populated after first paint flush"
    - "restoredFromHash single-fire guard pattern for one-time-per-mount $effects whose deps include reactive collection lengths"
key-files:
  created:
    - "src/lib/state/visibility.svelte.ts"
    - "src/lib/state/visibility.svelte.test.ts"
    - ".planning/phases/05-hero-watch/deferred-items.md"
  modified:
    - "src/lib/iframe/vimeoAdapter.ts"
    - "src/lib/iframe/vimeoAdapter.test.ts"
    - "src/lib/iframe/url.ts"
    - "src/lib/iframe/url.test.ts"
    - "src/lib/components/ReelStage.svelte"
    - "src/lib/components/ReelStage.test.ts"
    - "src/routes/+layout.svelte"
decisions:
  - "vimeoAdapter onLoad subscribes 'play' + 'pause' + 'error' (in that order); dispose removes 'play' + 'pause' (Finding 1)"
  - "playsinline=1 in buildEmbedUrl is now UNCONDITIONAL for both Vimeo + YouTube (Finding 11 / Pitfall B)"
  - "pageVisibility rune is the single source-of-truth for documentHidden (Finding 10 option a). Phase 3 D-12 setContext shape preserved verbatim for PreviewLoop"
  - "Hash-restoration $effect uses restoredFromHash $state guard for single-fire-per-mount; behavior:'auto' per D-15 (NOT 'smooth')"
  - "Idempotent initVisibilityListener registered from +layout.svelte onMount alongside initMotionState + initNetworkState"
metrics:
  duration_min: 16
  started: "2026-05-27T13:23:15Z"
  completed: "2026-05-27T13:38:42Z"
  tasks: 3
  files_changed: 8
  commits: 9
  tests_added: 14
  test_count_total: 281
---

# Phase 5 Plan 01: Foundation Extensions Summary

JWT-style foundation enablement for Wave 2 — three precise extensions that unblock WatchPlayer's chrome-fade-on-pause, iOS Safari tap-to-play in-document, and a single source-of-truth visibility rune subscribed by every Phase 5 cinematic surface.

## What Shipped

### Task 1 — vimeoAdapter pause subscription (commits 839ac59 + a151489)

The `onMsg` switch already routed `event:'pause'` to `handlers.onPause` — Vimeo just never SENT pause events because the parent had not explicitly subscribed via `{method:'addEventListener',value:'pause'}`. Added the subscribe call between the existing `'play'` and `'error'` subscriptions in `onLoad`; added the symmetric `removeEventListener:'pause'` in `dispose()` to keep Layer 2 of the 5-layer leak defense balanced.

**Test count change:** +3 tests (subscribe-pause, dispose-unsubscribe-pause, foreign-origin guard) + 1 existing test updated to expect 3 postMessage calls instead of 2. vimeoAdapter.test.ts now 19/19 green.

### Task 2 — playsinline=1 unconditional in buildEmbedUrl (commits 936cdd4 + bbb93e1)

Moved `params.set('playsinline','1')` out of the `if (mode === 'preview')` block for BOTH Vimeo and YouTube branches. Phase 5 `play` mode now ships `playsinline=1` alongside `autoplay=1` + `dnt=1` (Vimeo) / `enablejsapi=1` + `modestbranding=1` (YouTube). Preview-mode behavior unchanged — `playsinline=1` was already there.

**Why it matters:** Without `playsinline=1`, iOS Safari 16/17 tap-to-play detaches the embed to native fullscreen. The WatchPlayer chrome-fade postMessage flow (D-07) requires the iframe to stay in-document; native fullscreen kills the message bridge.

**Test count change:** +2 new tests (Vimeo + YouTube play-mode playsinline=1) + 2 existing test expectations flipped (`.not.toContain('playsinline=')` → `.toContain('playsinline=1')`). url.test.ts now 12/12 green.

### Task 3 — pageVisibility rune + ReelStage migration + hash restore (commits 630a637 + d329ca6 + cfda21c + 96eaf74 + e9940d8)

Three coupled pieces:

1. **New `src/lib/state/visibility.svelte.ts`** — module-scope rune mirroring `menu.svelte.ts` shape. `pageVisibility.documentHidden` getter ORs internal `_pageHidden` with `menu.menuOpen`; `initVisibilityListener()` registers ONE `document.visibilitychange` listener at app boot (idempotent, SSR-guarded by `typeof document`). Seeds `_pageHidden` from `document.hidden` at registration so a page hydrated while already backgrounded sees the correct initial state. `__resetVisibilityForTests` exposed for fresh per-test runs.

2. **`ReelStage.svelte` refactor** — removed the inline `let pageHidden = $state(false)` declaration AND the `onMount` block that registered the visibilitychange listener. The `documentHidden = $derived(...)` now reads `pageVisibility.documentHidden` (which already ORs the menu state internally). The `setContext('reel:visibility', { documentHidden })` broadcast keeps its exact shape — PreviewLoop consumers see ZERO API change.

3. **`ReelStage.svelte` hash-restore `$effect`** — Phase 3 already WRITES `${base}/work#video=<id>` on snap-settle; this $effect READS the hash on mount. Pitfall C is the load-bearing reason for `$effect` (not `onMount`): `sectionRefs[]` is populated by `bind:this` AFTER the first paint flush — `onMount` runs too early. The effect waits until `sectionRefs.length === videos.length`, parses `#video=<id>`, calls `target.scrollIntoView({block:'start', behavior:'auto'})` (D-15 specifies `'auto'` — NOT `'smooth'` — to avoid animated-scroll noise on cinema entry). A `restoredFromHash` $state guard makes the effect single-fire per mount so Phase 4 `/work/[category]` filter narrowing (which mutates `videos.length`) does not re-scroll on every change.

4. **`+layout.svelte` wiring** — `onMount` now calls `initVisibilityListener()` alongside the existing `initMotionState()` + `initNetworkState()` calls.

**Test count change:** +7 new tests in `visibility.svelte.test.ts` (default false, document.hidden flip, menu flip, OR semantics, idempotent init, initial-state seeding, pageHidden vs documentHidden surface split); +7 new tests in `ReelStage.test.ts` (rune-ownership flip, 5 hash-restoration cases, 2 cross-cutting rune-subscription cases); 1 existing test flipped (visibilitychange-listener-on-mount inverted — now asserts ReelStage MUST NOT register its own listener).

## Verification

- `pnpm check` exits 0 — zero TypeScript / svelte-check errors across 587 files
- `pnpm test` exits 0 — 281/281 tests across 25 files green (Phase 1 + 2 + 3 + 4 + 5-01)
- `pnpm build` exits 0 — clean static export to `build/`; `@sveltejs/adapter-static` emits all prerendered routes
- `pnpm lint` — 1 pre-existing error in `.lintstagedrc.cjs` (Phase 3 commit `4e2b372`) logged to `deferred-items.md`; NOT introduced by this plan

**Self-check grep contracts (Plan 05-01 success criteria):**
- `grep -c "addEventListener.*pause" src/lib/iframe/vimeoAdapter.ts` ≥ 1 ✓
- `grep -c "removeEventListener.*pause" src/lib/iframe/vimeoAdapter.ts` ≥ 1 ✓
- `grep -c "playsinline" src/lib/iframe/url.ts` ≥ 2 (got 7) ✓
- `grep -c "pageVisibility" src/lib/components/ReelStage.svelte` ≥ 1 (got 3) ✓
- `grep -c "scrollIntoView" src/lib/components/ReelStage.svelte` ≥ 1 (got 3) ✓
- `grep -c "let pageHidden" src/lib/components/ReelStage.svelte` === 0 ✓
- `grep -c "document.addEventListener.*visibilitychange" src/lib/components/ReelStage.svelte` === 0 ✓
- `grep -c "initVisibilityListener" src/routes/+layout.svelte` === 2 (import + call) ✓

## Decisions Made

- **vimeoAdapter onLoad order** — chose `play` → `pause` → `error` for chronological clarity in the postMessage stream (matches the order events naturally fire on a typical playback session). YouTube adapter UNCHANGED (its `onStateChange` event 2 already routes via the existing switch).
- **playsinline=1 placement** — moved OUTSIDE the `if (mode === 'preview')` block rather than duplicating inside the `'play'` branch. Cleaner; the param is now provider-locked rather than mode-locked, which matches the iOS Safari requirement (the iframe should ALWAYS stay in-document regardless of mode).
- **pageVisibility shape** — exposed both `documentHidden` (composite getter, the consumer surface) AND `pageHidden` (raw document.hidden, for diagnostic + test introspection). Mirrors how `motion.svelte.ts` exposes only what's needed but `pageHidden` is cheap to add and prevents downstream consumers from having to spy on internals.
- **Hash-restore single-fire mechanism** — `restoredFromHash` $state guard chosen over computing a derived "does videos.length match sectionRefs.length AND has it just become true". The boolean guard is simpler, deterministically single-fire, and survives Phase 4 filter-narrowing without surprise re-scroll.
- **jsdom guard for `scrollIntoView`** — mirrors the Phase 4 Plan 04-01 keyboard-handler guard pattern (Rule 1 deviation). Defensive `typeof target.scrollIntoView === 'function'` keeps unit tests stable on older jsdom versions.

## Deviations from Plan

**None.** Plan executed exactly as written. The only divergence from the plan's literal action steps is cosmetic: the existing ReelStage test file is `ReelStage.test.ts` (not `ReelStage.svelte.test.ts` as the plan template anticipated) — kept the existing filename because runed-based components without rune-importing TS test bodies don't require the `.svelte.test.ts` extension. The Phase 3 STATE rule applies to `.svelte.ts` rune modules; ReelStage tests use `render()` from `@testing-library/svelte` which bypasses the rule.

## Authentication Gates

None — no external auth required.

## Known Stubs

None. Every code path in this plan has a real implementation. No hardcoded empty values flow to UI, no placeholder text, no TODO/FIXME markers.

## Carry-Forward Notes

### For Plan 05-02 (WatchPlayer + ContinueReelRail)

- `attachVimeo(iframe, { onPause })` now actually delivers pause events. Wire `onPause: () => { isPlaying = false; fadeIn(); }` directly — no inline workaround needed.
- `buildEmbedUrl(video, 'play')` returns `playsinline=1` automatically. Do NOT append it at the call site — the param contract is owned by `url.ts`.
- Import the visibility rune for the player's "pause when menu open" posture:
  ```typescript
  import { pageVisibility } from '$lib/state/visibility.svelte';
  // …
  $effect(() => {
    if (pageVisibility.documentHidden) iframe?.contentWindow?.postMessage({ method: 'pause' }, ALLOWED_ORIGIN);
  });
  ```

### For Plan 05-03 (HeroAmbient + /+page.svelte)

- Import `pageVisibility` and gate the iframe mount on `!pageVisibility.documentHidden` so opening the mobile menu pauses the hero (consistent with the reel posture).
- Use the same $effect-with-typeof-document-guard pattern as ReelStage's hash-restore for any DOM-refs-dependent mount logic.
- The Phase 3 `'reel:visibility'` setContext broadcast is reel-route-scoped — HeroAmbient lives on `/` which DOES include a ReelStage below the hero, so the context IS available IF the hero is rendered inside the reel container. If the hero is rendered as a sibling (above ReelStage) the context is NOT in scope — read `pageVisibility.documentHidden` directly in that case.

### For Phase 7 cutover

- The hash-restore $effect lands the producer at the right section on back-nav from `/watch/[id]`. If Playwright e2e flake reveals the 300ms hash-write debounce in ReelStage (Phase 3 lines 119-132) drops its pending write when the producer clicks `▷ PLAY WITH SOUND` before the timer fires, escalate as a fast-follow task that flushes the debounce on outbound nav (deferred from Plan 05-01 per Pitfall D).

## Self-Check: PASSED

Files verified to exist on disk:
- `src/lib/state/visibility.svelte.ts` — FOUND
- `src/lib/state/visibility.svelte.test.ts` — FOUND
- `src/lib/iframe/vimeoAdapter.ts` (modified) — FOUND with `addEventListener.*pause` + `removeEventListener.*pause`
- `src/lib/iframe/url.ts` (modified) — FOUND with playsinline param-set above the `if (mode === 'preview')` block for both providers
- `src/lib/components/ReelStage.svelte` (modified) — FOUND with `pageVisibility` import + hash-restore `$effect` + zero `let pageHidden`
- `src/routes/+layout.svelte` (modified) — FOUND with `initVisibilityListener` import + onMount call
- `.planning/phases/05-hero-watch/deferred-items.md` — FOUND

Commits verified on disk:
- `839ac59` test(05-01) vimeoAdapter pause subscription RED — FOUND
- `a151489` feat(05-01) vimeoAdapter pause subscription GREEN — FOUND
- `936cdd4` test(05-01) playsinline=1 'play' mode RED — FOUND
- `bbb93e1` feat(05-01) playsinline=1 unconditional GREEN — FOUND
- `630a637` test(05-01) pageVisibility rune RED — FOUND
- `d329ca6` feat(05-01) pageVisibility rune GREEN — FOUND
- `cfda21c` test(05-01) ReelStage hash-restore + rune RED — FOUND
- `96eaf74` feat(05-01) ReelStage rune + hash-restore GREEN — FOUND
- `e9940d8` feat(05-01) +layout initVisibilityListener — FOUND
