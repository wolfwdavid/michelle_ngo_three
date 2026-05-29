---
phase: 07-polish-cutover
plan: 03
subsystem: testing
tags: [axe-core, playwright, wcag, lighthouse, lcp, cls, scroll-snap, svh, performance, a11y]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "/-only axe smoke spec (tests/e2e/axe.spec.ts), playwright.config.ts preview on :4183, deploy.yml CI scaffold"
  - phase: 03-reel-system-core
    provides: "ReelSection/PosterImage/PreviewLoop shared aspect-video w-full zero-CLS container; ReelStage h-svh / calc(100svh) snap heights; poster->iframe swap"
  - phase: 04-wayfinding
    provides: "FilterPillBar aria-current pattern; text-neutral-50 contrast fixes; Footer landmark"
  - phase: 05-hero-watch
    provides: "HeroAmbient (LCP-bearing hero poster vimeo-264677021.jpg, loading=eager/fetchpriority=high); createHeroDefer 1s-idle iframe deferral"
  - phase: 06-pbs-press-about-contact
    provides: "/about reuse of HeroAmbient (wordmark='ABOUT'); 7 prerendered routes for the axe matrix"
provides:
  - "7-route axe WCAG 2A/AA gate (24 assertions across chromium/webkit/firefox) replacing the /-only smoke"
  - "POL-03 grep-audit evidence: 100svh-only in snap sections, zero 100vh/100dvh, shared aspect-video zero-CLS container"
  - "Real measured / LCP on simulated mobile Slow-4G committed to 07-LIGHTHOUSE.json (before+after history)"
  - "lighthouserc.json (warning-posture, mobile Slow-4G, 2500ms LCP) ready for Plan 07-04 to wire into CI + flip warn->error"
  - "Page-level hero-poster LCP preload pattern (hoisted out of the shared child component)"
affects: [07-04-perf-gate, 07-cutover, ci-deploy]

# Tech tracking
tech-stack:
  added: [lighthouse@12.6.1 (npx, measurement-only — not a committed dep), lighthouserc.json (LHCI config)]
  patterns:
    - "Parametrized axe route-loop: one test per (route x browser) over a ROUTES table"
    - "Page-level LCP preload: emit <link rel=preload as=image fetchpriority=high> from +page.svelte head (not a shared child component) so it precedes the child-head content; derive href from data helpers to avoid drift"

key-files:
  created:
    - lighthouserc.json
    - .planning/phases/07-polish-cutover/07-LIGHTHOUSE.json
  modified:
    - tests/e2e/axe.spec.ts
    - src/lib/components/Footer.svelte
    - src/routes/work/+page.svelte
    - src/routes/work/[category]/+page.svelte
    - src/routes/+page.svelte
    - src/routes/about/+page.svelte
    - src/lib/components/HeroAmbient.svelte

key-decisions:
  - "Poster-preload escalation (Task 4 user decision 'preload poster + re-measure') hoists the preload from HeroAmbient's child <svelte:head> to each route's page-level head; fetchpriority=high is the effective lever (SvelteKit always emits JS modulepreloads ahead of all <svelte:head> content, so page-vs-child placement does not reorder ahead of the JS manifest)"
  - "Residual LCP miss (2806ms vs 2500ms budget = +306ms) ACCEPTED under the warning-only posture; Plan 07-04 owns the warn->error pre-cutover flip and any further residual-reduction levers (AVIF poster, defer-timing, faster apex re-measure)"
  - "POL-03 is an audit-only gate (already structurally satisfied by Phase 3/4) — proven via grep + Lighthouse CLS, not refactored"

patterns-established:
  - "Pattern: axe gate is a parametrized loop over a ROUTES table — adding a route = one table entry, auto-multiplied across the 3 browser projects"
  - "Pattern: LCP-critical preloads belong in the page-level (+page.svelte) head with fetchpriority=high, derived from the same data source as the rendering component"

requirements-completed: [POL-03]  # POL-02 + POL-04 PARTIALLY advanced — final CI gating / real-device QA deferred to 07-04 + UAT (see below)

# Metrics
duration: ~95min (across original 07-03 agent + this continuation)
completed: 2026-05-29
---

# Phase 7 Plan 03: Polish Gates — axe 7-route + POL-03 audit + measured LCP Summary

**Hardened the accessibility gate from `/`-only to a 7-route / 24-assertion axe WCAG-AA matrix (fixing 3 surfaced violations), grep-proved the POL-03 100svh + zero-CLS contract, and measured the real `/` LCP on simulated Slow-4G (median 2806ms after a page-level poster-preload escalation — a 306ms warning-only miss carried to the 07-04 blocking flip).**

## Performance

- **Duration:** ~95 min total (Tasks 1-3 prior agent; Task 4 escalation + finalize this continuation)
- **Completed:** 2026-05-29
- **Tasks:** 4 (3 auto + 1 human-verify checkpoint, resolved)
- **Files modified:** 7 (+2 created: lighthouserc.json, 07-LIGHTHOUSE.json)

## Accomplishments

- **POL-04 (mechanical half):** `tests/e2e/axe.spec.ts` rewritten as a parametrized loop over 8 paths (7 routes + a representative `/work/[category]` + a `/watch/[id]`); **24 assertions green** across chromium/webkit/firefox. Surfaced + fixed 3 real WCAG-AA violations the `/`-only scan never exercised.
- **POL-03 (audit + proof):** grep-confirmed `100svh`/`h-svh` present and **zero** `100vh`/`100dvh` in snap-section heights; the shared `aspect-video w-full` zero-CLS container confirmed across ReelSection/PosterImage/PreviewLoop; Lighthouse CLS **0.0054** (<< 0.1) is the empirical confirmation.
- **POL-02 (D-17 measure-first):** `lighthouserc.json` (warning posture, mobile Slow-4G, no desktop preset, 2500ms LCP) + a **real** Lighthouse 12.6.1 measurement committed to `07-LIGHTHOUSE.json` (not a deferral placeholder).
- **Task 4 escalation:** applied the user-directed poster-first escalation (hoist preload to page-level head) and re-measured — median LCP **2859ms -> 2806ms** with run variance tightened from 296ms to 11ms and perf 0.91 -> 0.95.

## Task Commits

1. **Task 1: Harden axe to 7 routes + fix 3 WCAG-AA violations** - `6eb47b9` (fix)
   - Footer column headers `h3 -> h2` (heading-order); sr-only `<h1>` added to `/work` + `/work/[category]` (page-has-heading-one); 8-path parametrized loop. 24/24 green.
2. **Task 2: POL-03 grep audit** - (no commit — audit-only, as planned)
   - Evidence below. No source edits required (Phase 3/4 already structurally compliant).
3. **Task 3: Measure / LCP + lighthouserc.json** - `5d32bca` (feat)
   - Warning-posture LHCI config; 3-run Lighthouse 12.6.1 measurement; BEFORE median 2859ms / CLS 0.0055 / perf 0.91.
4. **Task 4 (checkpoint resolution): poster-preload escalation** - `578118b` (perf)
   - Hoisted the hero-poster preload from `HeroAmbient.svelte`'s child head to the page-level head of `/` and `/about`, de-duplicated, href derived from data helpers.
5. **Task 4 (re-measure + delta)** - `3e5adf9` (docs)
   - AFTER median 2806ms / CLS 0.0054 / perf 0.95; `07-LIGHTHOUSE.json` restructured to before/escalation/after/delta/verdict; deferred lint items logged.

**Plan metadata:** _(final docs commit — SUMMARY + STATE + ROADMAP)_

## POL-03 Audit Evidence (Task 2)

- `svh` in use (snap-section heights): present in `ReelStage.svelte` (`h-svh` / `calc(100svh - …)`), `HeroAmbient.svelte` (`h-svh`), plus per-route reel containers — grep `100svh|h-svh|svh` across `src/lib/components src/routes src/app.css` returns ≥ 1.
- `100vh` / `100dvh` in snap-section heights: **0 matches** (grep `100vh|100dvh|h-dvh|dvh` returns no snap-section height declarations).
- Shared zero-CLS container: `aspect-video` present in all three of `ReelSection.svelte`, `PosterImage.svelte`, `PreviewLoop.svelte` — the poster→iframe swap stays inside one fixed-aspect box, so swapping contributes no layout shift.
- Empirical confirmation: Lighthouse CLS **0.0054** (before 0.0055), << the 0.1 budget — POL-03 zero-CLS holds.

## LCP Measurement — Before / After (Task 3 + Task 4)

Methodology (identical across both): Lighthouse 12.6.1, mobile form factor, `throttling-method=simulate` (Slow-4G — "simulated 4G" per D-17), 3 runs against the local production-build preview served at root (`http://localhost:4183/`). The staging URL returned 404 at run time; the local root preview is the conservative stand-in for the apex artifact (apex BASE_PATH='' measures marginally faster).

| Metric            | BEFORE (Task 3) | AFTER (Task 4) | Delta            |
| ----------------- | --------------- | -------------- | ---------------- |
| Median LCP        | 2859 ms (2.9s)  | 2806 ms (2.8s) | **−53 ms** ✅ improved |
| Run spread        | 296 ms          | 11 ms          | much tighter      |
| Perf score (med)  | 0.91            | 0.95           | +0.04            |
| CLS               | 0.0055          | 0.0054         | PASS (<< 0.1)    |

**Verdict: LCP MISS — 2806 ms is 306 ms over the 2500 ms simulated-Slow-4G budget. ACCEPTED for this run (warning-only posture).** Per the Task 4 directive, this is acceptable: the gate is warning-only in `lighthouserc.json` and **Plan 07-04 owns the warn→error pre-cutover flip**. No further escalation loop was run.

**Honest technical finding (recorded in `07-LIGHTHOUSE.json`):** moving the preload from the child component head to the page-level head does **not** reorder it ahead of SvelteKit's JS modulepreloads — SvelteKit emits all `%sveltekit.head%` JS `modulepreload` `<link>`s at the top of `<head>`, and **all** user `<svelte:head>` content (page or child) follows. Reordering ahead of the JS manifest would require editing `app.html` to inject before `%sveltekit.head%` (out of scope, risky). The effective lever is `fetchpriority="high"`, which the browser's resource scheduler honors independent of DOM order — hence the gain is real but modest. Residual-reduction levers reserved for 07-04 if the blocking flip needs them: AVIF poster variant (PERF-V2-02, deferred), `createHeroDefer` timing tune, faster-apex re-measure, or the `_four` defer-to-telemetry branch.

## Files Created/Modified

- `tests/e2e/axe.spec.ts` — `/`-only smoke → parametrized 8-path × 3-browser WCAG-AA matrix (24 assertions).
- `src/lib/components/Footer.svelte` — column-header `h3 → h2` (heading-order fix).
- `src/routes/work/+page.svelte`, `src/routes/work/[category]/+page.svelte` — sr-only `<h1>` (page-has-heading-one fix; reel section titles are `h2`).
- `lighthouserc.json` — LHCI config: warning posture, mobile Slow-4G default, no desktop preset, 2500ms LCP + 0.1 CLS assertions.
- `.planning/phases/07-polish-cutover/07-LIGHTHOUSE.json` — real measurement, restructured to before/escalation/after/delta/verdict.
- `src/routes/+page.svelte` — page-level hero-poster preload (`fetchpriority=high`, href from `base + getPosterFor(getById(producerReelId))`).
- `src/routes/about/+page.svelte` — equivalent page-level preload (same hero poster is `/about`'s LCP element).
- `src/lib/components/HeroAmbient.svelte` — removed the now-redundant child-head preload (relocated to page level); explanatory comment retained.

## Decisions Made

- **Page-level preload over child-component preload (Task 4 escalation):** the directive's "preload poster + re-measure" — but the preload already existed in `HeroAmbient`'s child head, buried below the JS modulepreloads. Hoisting to `+page.svelte` (and `/about/+page.svelte`) is the canonical placement; the measurable win comes from `fetchpriority="high"`, documented honestly.
- **Accept the 306ms residual miss:** warning-only posture; 07-04 owns the blocking flip. Did not loop on AVIF/defer-timing escalations (out of scope here, reserved for 07-04).
- **POL-03 proven, not refactored:** Phase 3/4 already satisfy it; this plan pins it with grep + CLS evidence.

## Deviations from Plan

### Auto-fixed / scope-adjacent items

**1. [Rule 2 - Missing Critical] Added page-level preload to `/about` to prevent an LCP regression**
- **Found during:** Task 4 (poster-preload escalation)
- **Issue:** The directive targeted `/` (`src/routes/+page.svelte`). But the preload was being **removed** from the shared `HeroAmbient.svelte`, and `/about` also uses `HeroAmbient` with the same hero poster as its LCP element — so removing it from the component without adding a page-level equivalent to `/about` would have silently dropped that route's LCP hint.
- **Fix:** Added the equivalent page-level preload to `src/routes/about/+page.svelte`, derived from the same data helpers.
- **Files modified:** `src/routes/about/+page.svelte`
- **Verification:** Prerendered `build/about/index.html` head contains exactly one poster preload; `/about` axe still green; `pnpm check` green.
- **Committed in:** `578118b`

---

**Total deviations:** 1 (Rule 2 — necessary to avoid a peer-route LCP regression introduced by the directed escalation). No scope creep.

## Issues Encountered

- **Stale preview server on :4183 + port conflict.** A prior preview process still held port 4183, so `pnpm preview --strictPort` failed to bind. Resolved by reusing the existing server — confirmed it serves the freshly-rebuilt `build/` (exactly one page-level poster preload in the served HTML) before measuring. Same URL/methodology as the prior agent.
- **Two pre-existing `pnpm lint` errors** in `.lintstagedrc.cjs` and `scripts/build-assets.mjs` (NEUTRAL_500 unused). Both are out of scope (neither file touched by 07-03; the three 07-03-edited files lint clean in isolation, exit 0). Logged to `deferred-items.md`, not fixed (SCOPE BOUNDARY). The lint-staged pre-commit hook runs only on staged files, so both commits passed cleanly.

## Requirements Coverage

- **POL-03 — COMPLETE.** 100svh-only snap heights, zero 100vh/100dvh, shared aspect-video zero-CLS container, CLS 0.0054 empirically. Marked complete in REQUIREMENTS.md.
- **POL-02 — PARTIAL (not marked complete).** D-17 measure-first done; `lighthouserc.json` ready. But the requirement text includes "Lighthouse CI gates this in CI... blocking pre-cutover" AND the measured LCP currently MISSES (2806 > 2500). The CI wiring + warn→error blocking flip is **Plan 07-04**. Do not mark POL-02 complete until 07-04 lands the gate and the LCP either passes on the faster apex or a documented exception is accepted.
- **POL-04 — PARTIAL (not marked complete).** axe mechanical half done (7 routes / 24 assertions green in CI-runnable form). The requirement also mandates a manual real-device QA matrix sign-off before cutover — deferred to UAT (`03-HUMAN-UAT.md`). Do not mark POL-04 complete until the device matrix signs off.

## Next Phase Readiness

- **07-04 (perf gate / pre-cutover):** `lighthouserc.json` is ready to wire into `deploy.yml`; the warn→error flip is the cutover-readiness step. The 306ms residual LCP miss is the known input — re-measure on the faster apex (BASE_PATH='') and/or apply a reserved poster-first lever before flipping to blocking.
- **Cutover blockers still open (from STATE):** real-device QA matrix (POL-04), EU GDPR posture, A/B traffic-split mechanism — all must close before the Phase 7 cutover regardless of this plan.

## Self-Check: PASSED

- Files verified present: `lighthouserc.json`, `07-LIGHTHOUSE.json`, `07-03-SUMMARY.md`, `tests/e2e/axe.spec.ts`, `src/routes/+page.svelte`, `src/routes/about/+page.svelte`, `src/lib/components/HeroAmbient.svelte`.
- Commits verified present: `6eb47b9` (Task 1), `5d32bca` (Task 3), `578118b` (Task 4 escalation), `3e5adf9` (Task 4 re-measure).
- Quality gates: `pnpm check` 0 errors / 0 warnings; `pnpm test:e2e axe.spec.ts` 24/24 passed (chromium/webkit/firefox); `pnpm build` green.

---
*Phase: 07-polish-cutover*
*Completed: 2026-05-29*
