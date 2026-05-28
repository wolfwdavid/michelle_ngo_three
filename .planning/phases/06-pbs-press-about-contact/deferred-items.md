# Phase 6 Deferred Items

Out-of-scope discoveries surfaced during Plan 06-01 execution but NOT auto-fixed
(per executor scope boundary: only fix issues directly caused by current task's
changes).

## .lintstagedrc.cjs — `@typescript-eslint/no-require-imports` violation

**File:** `.lintstagedrc.cjs:15`
**Rule:** `@typescript-eslint/no-require-imports`
**Severity:** Error
**Introduced:** Phase 3 Plan 03-01 (commit `4e2b372` — pre-existing on master before Plan 06-01)
**Scope:** Repository tooling config — unrelated to Plan 06-01's files
**Discovered:** Plan 06-01 Task 3 `pnpm lint` run
**Recommendation:** Address in a separate maintenance commit. Options: (a) add `.lintstagedrc.cjs` to eslint ignores; (b) convert require → ESM import + use `.mjs` extension; (c) add per-file override allowing CommonJS in lint-staged config.
**Out of scope:** Plan 06-01's contract is shared chrome (ContactBlock + Footer + layout). Touching `.lintstagedrc.cjs` would expand scope beyond the plan boundary.

## tests/e2e/press.spec.ts Test D — TopNav fade does not trigger on /press scroll [RESOLVED by Plan 06-04]

**Status:** ✅ RESOLVED 2026-05-28 by Plan 06-04 (commit `a530ff6`). The D-16 /press chrome-fade now fires on chromium + webkit + firefox. Root cause and fix were exactly as diagnosed below: `TopNav.svelte`'s scroll-target querySelector matched only `[aria-label="Filmography reel"]`; broadening it to a selector-list also matching `[aria-label="Press credits reel"]` attaches the scroll-idle listener to /press's bespoke container so `scrollIdle.isScrolling` flips true and the `$derived chromeClass` appends `opacity-0 pointer-events-none`. Test D verified green across all 3 browsers.

_Original entry (for history):_

**File:** `tests/e2e/press.spec.ts:65` (Test D — "TopNav fades during scroll on /press")
**Symptom:** After scrolling the /press reel container 500px and waiting 220ms, the TopNav header class never gains `opacity-0` / `pointer-events-none`. Observed class stays `sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-white/10 h-14 motion-safe:transition-opacity motion-safe:duration-300` (solid). Fails on chromium + webkit + firefox (3 runs).
**Severity:** e2e regression assertion failure (the other 4 press tests + all 6 pbs-landing tests pass; 57/60 of the pbs+press+hero batch pass).
**Introduced:** Plan 06-02 (TopNav `/press` REEL_ROUTE_IDS fade-scope wiring shipped in 06-01; /press route + this e2e spec shipped in 06-02). 06-02 explicitly DEFERRED running its e2e specs ("Run as part of Task 4 full-suite verification AFTER 06-03 lands... Orchestrator validates after both waves complete" — 06-02-SUMMARY §Verification Recap). This is the first time the spec has actually run.
**Likely cause:** The TopNav scroll-idle rune listens to a scroll target (Phase 4: reel container `[role=region][aria-label="Filmography reel"]`) that does not match /press's container (`[role=region][aria-label="Press credits reel"]`), OR the `page.route.id` fade-scope match for `/press` resolves differently than the `endsWith` active-state match. Needs investigation in the TopNav scroll-target/fade-scope logic — i.e., does the scroll-idle listener attach to the /press scroll container, and does the D-16 fade-scope predicate include the `/press` route id at runtime.
**Discovered:** Plan 06-03 Task 6 full-suite e2e verification.
**Out of scope for 06-03:** Plan 06-03's contract is /about + /contact + the HeroAmbient `wordmark?`/`tagline?` extension. Verified via `git diff 925b74f~3..HEAD` that none of the four 06-03 task commits touch `TopNav.svelte`, `src/routes/press/*`, the scroll-idle rune, or the chrome-fade scope — so this failure is NOT caused by 06-03's changes. Fixing it would require editing TopNav's scroll-target/fade-scope logic (06-02/Phase-4 domain). Recommend a follow-up 06-02 repair (or Phase 7 polish) that wires the TopNav scroll-idle listener + D-16 fade-scope predicate to the /press reel container. All 30 /about + /contact e2e tests (this plan's deliverable) pass on all 3 browsers.

## tests/e2e/press.spec.ts Test C — weak wait condition races the trailing-slash 307 redirect [RESOLVED in Plan 06-04]

**Status:** ✅ RESOLVED 2026-05-28 (authorized one-line 06-04 amendment). Applied the test-only fix at `tests/e2e/press.spec.ts:61` — `await page.waitForLoadState('networkidle')` → `await page.waitForURL(/\/watch\//)` (the correct Playwright primitive for SPA navigation; not a retry/sleep hack). Full `press.spec.ts` re-run is green: 15/15 (5 tests × chromium + webkit + firefox), Test C and Test D both passing on all three browsers. No product code changed.

_Original entry (for history):_

**File:** `tests/e2e/press.spec.ts:52-63` (Test C — "clicking ▷ Watch on article 1 navigates to /watch/<id>")
**Symptom:** After `firstWatchLink.click()` followed by `page.waitForLoadState('networkidle')`, `expect(page.url()).toContain('/watch/')` fails with `Received string: "http://localhost:4183/press/"` on webkit + firefox (and intermittently chromium under serial isolation). The URL is read at `/press/` before SPA navigation completes.
**Severity:** e2e test-fragility — NOT a product defect. The ▷ Watch deep-link is correct and navigation DOES work (see proof below). This is an out-of-scope test-only issue.
**Product behavior is correct (proven):** A throwaway probe replacing `waitForLoadState('networkidle')` with `page.waitForURL(/\/watch\//)` PASSES on chromium + webkit + firefox; final URL settles at `http://localhost:4183/watch/fvCB4gg7yS0/`. The rendered href is `../watch/fvCB4gg7yS0` (resolved relative form of `${base}/watch/<id>`), navigation completes, and `trailingSlash='always'` (Plan 06-01) issues a 307 → lands at `/watch/fvCB4gg7yS0/`.
**Root cause:** Two interacting facts. (1) `trailingSlash='always'` means the no-trailing-slash href `/watch/<id>` redirects (307) to `/watch/<id>/`; the SPA client navigation + redirect completes a few ms after `networkidle` resolves, so `page.url()` is read too early. (2) Plan 06-04's TopNav fix activates the previously-dead `/press` scroll-idle listener — when Playwright auto-scrolls the link into view during `.click()`, that scroll now fires the listener and shifts navigation timing just enough to expose the weak wait. The listener activation is the CORRECT, intended D-16 behavior; it merely unmasked a latent test-wait fragility that the prior no-op window listener happened to hide.
**Why it was green before 06-04:** With the pre-fix TopNav, `/press` fell back to a `window` scroll listener that received no events, so the click-auto-scroll caused no rune state change and the `networkidle`-then-`page.url()` race did not trip. Verified: building the parent commit (`a530ff6~1`) and running Test C serially passes 3/3; building HEAD (`a530ff6`) and running Test C serially fails 3/3 — confirming the timing shift is induced by the (correct) listener activation, not by a navigation regression.
**Discovered:** Plan 06-04 Task 2 full /press e2e run.
**Out of scope for 06-04:** The plan's scope boundary is explicit — "Only `src/lib/components/TopNav.svelte` is modified" and `tests/e2e/press.spec.ts` is "run-only; not edited." Fixing Test C is a one-line test change: `await page.waitForLoadState('networkidle')` → `await page.waitForURL(/\/watch\//)` on line 61 (the correct Playwright primitive for SPA navigation; NOT a retry/sleep hack). Recommend a focused follow-up (Phase 7 polish, or an authorized one-line 06-04 amendment) to apply that wait fix. Do NOT widen 06-04 scope to touch the test file.
