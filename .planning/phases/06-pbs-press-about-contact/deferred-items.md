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

## tests/e2e/press.spec.ts Test D — TopNav fade does not trigger on /press scroll

**File:** `tests/e2e/press.spec.ts:65` (Test D — "TopNav fades during scroll on /press")
**Symptom:** After scrolling the /press reel container 500px and waiting 220ms, the TopNav header class never gains `opacity-0` / `pointer-events-none`. Observed class stays `sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-white/10 h-14 motion-safe:transition-opacity motion-safe:duration-300` (solid). Fails on chromium + webkit + firefox (3 runs).
**Severity:** e2e regression assertion failure (the other 4 press tests + all 6 pbs-landing tests pass; 57/60 of the pbs+press+hero batch pass).
**Introduced:** Plan 06-02 (TopNav `/press` REEL_ROUTE_IDS fade-scope wiring shipped in 06-01; /press route + this e2e spec shipped in 06-02). 06-02 explicitly DEFERRED running its e2e specs ("Run as part of Task 4 full-suite verification AFTER 06-03 lands... Orchestrator validates after both waves complete" — 06-02-SUMMARY §Verification Recap). This is the first time the spec has actually run.
**Likely cause:** The TopNav scroll-idle rune listens to a scroll target (Phase 4: reel container `[role=region][aria-label="Filmography reel"]`) that does not match /press's container (`[role=region][aria-label="Press credits reel"]`), OR the `page.route.id` fade-scope match for `/press` resolves differently than the `endsWith` active-state match. Needs investigation in the TopNav scroll-target/fade-scope logic — i.e., does the scroll-idle listener attach to the /press scroll container, and does the D-16 fade-scope predicate include the `/press` route id at runtime.
**Discovered:** Plan 06-03 Task 6 full-suite e2e verification.
**Out of scope for 06-03:** Plan 06-03's contract is /about + /contact + the HeroAmbient `wordmark?`/`tagline?` extension. Verified via `git diff 925b74f~3..HEAD` that none of the four 06-03 task commits touch `TopNav.svelte`, `src/routes/press/*`, the scroll-idle rune, or the chrome-fade scope — so this failure is NOT caused by 06-03's changes. Fixing it would require editing TopNav's scroll-target/fade-scope logic (06-02/Phase-4 domain). Recommend a follow-up 06-02 repair (or Phase 7 polish) that wires the TopNav scroll-idle listener + D-16 fade-scope predicate to the /press reel container. All 30 /about + /contact e2e tests (this plan's deliverable) pass on all 3 browsers.
