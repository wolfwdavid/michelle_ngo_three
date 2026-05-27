---
phase: 5
slug: hero-watch
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-27
approved: 2026-05-27
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Inherits Phase 3/4 test infrastructure verbatim. Sourced from `05-RESEARCH.md` §Validation Architecture (lines 301-390).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `vitest@4.1.5` (data + ui project split) + `@playwright/test@1.60.0` (e2e, 3 browsers: Chromium/WebKit/Firefox) + `@axe-core/playwright@4.11.3` (a11y) + `@testing-library/svelte@5.3.1` (component query helpers) |
| **Config file** | `vite.config.ts` (Vitest two-project split, established Phase 1/2) + `playwright.config.ts` (locked Phase 1) |
| **Quick run command** | `pnpm test` (Vitest unit + component only — typical < 30s) |
| **Full suite command** | `pnpm test && pnpm test:e2e` |
| **Estimated runtime** | ~30s Vitest + ~3-5min Playwright (3-browser cross-check) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test` (Vitest unit + component, < 30s)
- **After every plan wave:** Run `pnpm test && pnpm test:e2e` (3-browser cross-check, ~3-5min)
- **Before `/gsd:verify-work`:** Full suite must be green; staging build deployed; axe-core 0 violations on `/` and `/watch/[id]` (sampled across all 56 prerendered routes)
- **Max feedback latency:** 30 seconds (Vitest); 300 seconds (full e2e cross-browser)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | WATCH-01 | unit (ui) | `pnpm test --project ui src/lib/iframe/vimeoAdapter.test.ts` | ✅ extends existing | ⬜ pending |
| 05-01-02 | 01 | 1 | WATCH-01 | unit (data) | `pnpm test --project data src/lib/iframe/url.test.ts` | ✅ extends existing | ⬜ pending |
| 05-01-03a | 01 | 1 | HERO-01, WATCH-05 | unit (ui) | `pnpm test --project ui src/lib/state/visibility.svelte.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03b | 01 | 1 | WATCH-05 | unit (ui) | `pnpm test --project ui src/lib/components/ReelStage.svelte.test.ts` | ✅ extends existing | ⬜ pending |
| 05-02-01 | 02 | 2 | WATCH-01, WATCH-02 | unit (ui) | `pnpm test --project ui src/lib/components/WatchPlayer.svelte.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | WATCH-03 | unit (ui) | `pnpm test --project ui src/lib/components/ContinueReelRail.svelte.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-03a | 02 | 2 | WATCH-04 | unit (data — route glob) | `pnpm test --project ui src/routes/watch/[id]/page.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-03b | 02 | 2 | WATCH-01..04 | e2e | `pnpm test:e2e tests/e2e/watch.spec.ts` | ❌ W0 | ⬜ pending |
| 05-02-03c | 02 | 2 | WATCH-05 | e2e | `pnpm test:e2e tests/e2e/restore.spec.ts` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | HERO-01 | unit (ui) | `pnpm test --project ui src/lib/heroDefer.svelte.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | HERO-01 | unit (ui) | `pnpm test --project ui src/lib/components/HeroAmbient.svelte.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-03a | 03 | 2 | HERO-01, HERO-02 | unit (ui — route glob) | `pnpm test --project ui src/routes/page.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-03b | 03 | 2 | HERO-01..03 | e2e | `pnpm test:e2e tests/e2e/hero.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### Requirement-level test breakdown

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
| WATCH-01 | Vimeo adapter subscribes to `pause` event (gap fix from Finding 1) | unit (data) | `pnpm test src/lib/iframe/vimeoAdapter.test.ts -t "pause subscription"` | ✅ extends existing |
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

---

## Wave 0 Requirements

**Components to be built (no existing file — must scaffold before any task can be marked green):**
- [ ] `src/lib/components/HeroAmbient.svelte` — covers HERO-01, HERO-02 (composition)
- [ ] `src/lib/components/HeroAmbient.svelte.test.ts` — covers HERO-01 + defer + fallback + unmount-off-screen
- [ ] `src/lib/components/WatchPlayer.svelte` — covers WATCH-01, WATCH-02
- [ ] `src/lib/components/WatchPlayer.svelte.test.ts` — covers WATCH-01 + WATCH-02 + fade state machine
- [ ] `src/lib/components/ContinueReelRail.svelte` — covers WATCH-03
- [ ] `src/lib/components/ContinueReelRail.svelte.test.ts` — covers WATCH-03 + scroll-snap + heading-link + hide-empty

**Routes to be built:**
- [ ] `src/routes/+page.ts` — load returns `{ videos }` from `$lib/data` (mirror `/work/+page.ts:11-18`)
- [ ] `src/routes/+page.svelte` (REWRITE) — composes `<HeroAmbient />` + `<ReelStage videos={data.videos} />`
- [ ] `src/routes/+page.test.ts` — load shape + composition assertions
- [ ] `src/routes/watch/[id]/+page.ts` — near-verbatim from `_four`; `entries()` + load() + rail derivation
- [ ] `src/routes/watch/[id]/+page.svelte` — composes `<WatchPlayer video={data.video} />` + metadata + `<ContinueReelRail rail={data.rail} category={data.video.category} />`; VideoObject JSON-LD in `<svelte:head>`
- [ ] `src/routes/watch/[id]/page.test.ts` — copy `_four`'s entries() + load() tests verbatim (5 tests) + 2 `_three`-specific assertions

**Module-scope runes to be built:**
- [ ] `src/lib/state/visibility.svelte.ts` — pageVisibility rune (Plan 05-01 Task 3)
- [ ] `src/lib/state/visibility.svelte.test.ts` — 5 assertions
- [ ] `src/lib/heroDefer.svelte.ts` — createHeroDefer() factory (Plan 05-03 Task 1)
- [ ] `src/lib/heroDefer.svelte.test.ts` — 11 assertions (defaults, timer, 4 event types, dispose, idempotency, SSR, factory independence)

**Existing file extensions (Plan 05-01 — Wave 1 enables all downstream tests):**
- [ ] `src/lib/iframe/vimeoAdapter.ts` — extend `onLoad` to also send `addEventListener('pause')` (Finding 1)
- [ ] `src/lib/iframe/vimeoAdapter.test.ts` — assert pause subscription posts on iframe load (4 new assertions)
- [ ] `src/lib/iframe/url.ts` — add `playsinline=1` to `'play'` mode for both Vimeo and YouTube (Finding 11)
- [ ] `src/lib/iframe/url.test.ts` — update 'play' mode snapshot tests (4 new/updated assertions)
- [ ] `src/lib/components/ReelStage.svelte` — extend with `$effect` for D-15 hash-restoration (consumer side) + swap inline `pageHidden` to pageVisibility rune
- [ ] `src/lib/components/ReelStage.svelte.test.ts` — add hash-restore + visibility-rune integration tests (4 new assertions)
- [ ] `src/routes/+layout.svelte` — call `initVisibilityListener()` in onMount

**E2E test files (Wave 0 must scaffold the empty spec files; Wave 2 fills them):**
- [ ] `tests/e2e/hero.spec.ts` — HERO-01..03, defer-load mechanism, fallback codepath, axe (9 tests)
- [ ] `tests/e2e/watch.spec.ts` — WATCH-01..05, chrome-fade flow, prerender sample, axe (6 tests)
- [ ] `tests/e2e/restore.spec.ts` — hash write/read, back-nav, cross-route, direct paste, ignore foreign hash (3+ tests)

**Framework install:** NONE — all deps in `node_modules` from Phase 1 (CONTEXT.md D-10 locks out `embla-carousel-svelte`).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chrome-fade postMessage flow on real iOS Safari 17.x | WATCH-01, WATCH-02 | Cross-origin postMessage timing is flaky to simulate in Playwright; real provider iframes deliver real `play`/`pause` events only on actual Safari/WebKit on real hardware | Open `/watch/264677021` on a real iPhone (iOS Safari 17.x), tap to play, observe back-button + below-chrome opacity drops to 20% after 600ms; pause via provider control, observe chrome restores to 100% immediately. Defer to Phase 7 POL-04 BrowserStack matrix. |
| Hero LCP < 2.5s on real 4G iPhone | HERO-01, POL-02 | Lighthouse CI bot uses simulated 4G; real-device thermal + cellular conditions vary | Run Lighthouse on an iPhone over actual 4G; LCP must be < 2.5s. Defer to Phase 7 POL-04 UAT. |
| Sound-on autoplay sticky activation across SvelteKit nav on iOS Low Power Mode | HERO-03 | iOS LPM blocks autoplay-with-sound; native provider ▷ overlay is the recovery UX | Tap `▷ PLAY REEL` with LPM enabled on a real iPhone; expect the provider's native ▷ overlay to render. Confirm the URL=action contract still navigates correctly. Defer to Phase 7 POL-04 UAT. |
| Real Vimeo iframe `pause` event delivery after Plan 05-01 adapter fix | WATCH-01 | Real Vimeo postMessage requires the actual provider iframe to ack the addEventListener subscription; Playwright cross-origin assertions can't simulate this deterministically | Open `/watch/264677021`, play, pause via provider control, observe WatchPlayer chrome fades back in immediately. Best-effort e2e assertion in `watch.spec.ts` is fallback; unit tests in `WatchPlayer.svelte.test.ts` lock the state machine deterministically. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (every `❌ W0` file is enumerated above)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (Vitest); < 300s (full e2e cross-browser)
- [x] `nyquist_compliant: true` set in frontmatter
- [x] `wave_0_complete: true` set in frontmatter
- [x] Manual-only verifications documented with deferral path (Phase 7 POL-04 UAT)

**Approval:** approved 2026-05-27
