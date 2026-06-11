---
phase: quick
plan: 260610-vu7
subsystem: performance / hero-LCP / CI-gate
tags: [POL-02, D-12, lighthouse, lcp, preload, hero-defer]
status: halted-at-task-1
requires: [07-03 (LCP measurement baseline), 07-04 (warn-posture lighthouse gate)]
provides: [hero-poster preload hoisted ahead of JS manifest, createHeroDefer 2.5s defer, scripts/check-preload-order.mjs, 260610-vu7 LCP measurement record]
affects: [src/app.html, src/lib/heroDefer.svelte.ts, lighthouserc.json (NOT flipped), deploy.yml (NOT flipped)]
tech-stack:
  added: []
  patterns: [app.html-injected-LCP-hint-before-head-token, defer-window-tuning-out-of-LCP-paint-window]
key-files:
  created:
    - scripts/check-preload-order.mjs
  modified:
    - src/app.html
    - src/routes/+page.svelte
    - src/routes/about/+page.svelte
    - src/lib/heroDefer.svelte.ts
    - src/lib/heroDefer.svelte.test.ts
    - src/lib/components/HeroAmbient.svelte.test.ts
    - .planning/phases/07-polish-cutover/07-LIGHTHOUSE.json
decisions:
  - "HALT-AT-TASK-1: measured median LCP 2866ms >= 2500ms, so the Lighthouse LCP gate was NOT flipped warn->error (Task 2 skipped per the plan's load-bearing gating condition)"
  - "app.html LCP-hint comment must not contain the SvelteKit head-token literal — SvelteKit substitutes that token textually even inside HTML comments"
metrics:
  duration: ~25 min
  completed_date: 2026-06-11
  tasks_completed: 1
  tasks_total: 2
---

# Quick 260610-vu7: LCP Remediation (D-12 warn->error flip) Summary

Hoisted the hero-poster preload ahead of SvelteKit's JS modulepreload manifest and pushed the hero-iframe defer window out of the LCP paint window — but the measured median LCP (2866ms) still missed the 2500ms Slow-4G budget, so the load-bearing gating condition halted the warn->error flip. Task 2 was deliberately NOT executed.

## Outcome

**HALTED at Task 1.** The fix landed cleanly and is correct (all 440 tests green, build green, structural preload-order proof passes), but it did not close the LCP budget miss on the local-root measurement environment. Per the plan's explicit gating condition — "do NOT flip the gate unless measured median LCP < 2500ms" — Task 2 (the `lighthouserc.json` + `deploy.yml` warn->error flip and the D-12 QA-MATRIX check-off) was **not run**. Flipping a still-failing gate would break every future deploy, which is exactly what the gating condition exists to prevent.

## What Was Done (Task 1)

1. **Hoisted the LCP hint into `src/app.html`** — injected `<link rel="preload" as="image" href="%sveltekit.assets%/posters/vimeo-264677021.jpg" fetchpriority="high">` immediately before the SvelteKit head token, so it precedes every JS modulepreload in DOM order. This is the higher-leverage lever 07-03 named but deferred.
2. **Removed the now-redundant page-level preloads** from `src/routes/+page.svelte` and `src/routes/about/+page.svelte` (and their unused imports/consts), so the `<link>` is emitted exactly once from one shared place covering both routes.
3. **Eased `createHeroDefer`** idle/timeout window from 1000ms to 2500ms (both the `requestIdleCallback({ timeout })` and `setTimeout` literals) so the competing `player.vimeo.com` iframe fetch no longer steals Slow-4G bandwidth during the poster paint. The first-interaction trigger is unchanged.
4. **Synced the timer-driven tests** — `heroDefer.svelte.test.ts` and `HeroAmbient.svelte.test.ts` advances were updated 1000ms->2500ms; suite stays green (440/440).
5. **Added `scripts/check-preload-order.mjs`** — reads `build/index.html` and asserts the hero-poster `rel="preload"` precedes the first `rel="modulepreload"`. PASSES.
6. **Recorded the measurement** in `07-LIGHTHOUSE.json` under a new `vu7_remediation` block (3 runs + median + network diagnostic + verdict + next levers).

## Verification

- `pnpm check` — 0 errors, 0 warnings (641 files)
- `pnpm test` — 440/440 passed (39 files)
- `pnpm build` — succeeded (adapter-static, wrote `build/`)
- `node scripts/check-preload-order.mjs` — OK (preload at index 773 precedes first modulepreload at index 917)
- Lighthouse 12.6.1, mobile Slow-4G simulate, 3 runs at `http://localhost:4183/`:
  - Run LCP: 2866 / 2864 / 2870 ms → **median 2866ms** (budget 2500ms → **MISS by 366ms**)
  - FCP ~2715ms, CLS 0.0055 (PASS), perf score 0.91, TBT 0ms

## The Diagnostic (why the hoist did not close the gap)

The preload hoist worked **perfectly at the network layer**: the `largest-contentful-paint-element` audit confirms the LCP element is the hero poster `<img>`, and the `network-requests` audit shows `vimeo-264677021.jpg` fetched **first** at `networkRequestTime=13ms`, `networkEndTime=18ms`, `priority=High`. The poster is on the wire and complete in the first ~18ms — there is no remaining download bottleneck to remove.

LCP nonetheless lands at ~2866ms because it tracks **FCP (~2715ms)** — the poster cannot paint until first paint, and first paint is render/main-thread bound, not download bound. **The preload-ordering lever is now fully exhausted.** The residual is an FCP/render problem the plan's chosen lever cannot touch.

Note: FCP read ~2715ms here vs the 07-03 record of ~1817ms — a ~900ms environment delta (different host/Chrome/headless flags than 07-03's run). The sound network timing (18ms) confirms the code is correct; part of the 2866ms reading is environment-inflated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SvelteKit substituted the head token inside the app.html comment**
- **Found during:** Task 1 step 5 (first `check-preload-order.mjs` run failed)
- **Issue:** The initial app.html comment text included the literal `%sveltekit.head%`. SvelteKit's token substitution is textual and replaced that occurrence *inside the HTML comment* with the entire ~25-link JS modulepreload manifest, pushing the real preload `<link>` after them — the exact opposite of the intent. First build verified the preload at index 3141, after the first modulepreload at index 348.
- **Fix:** Reworded the comment to avoid the head-token literal ("Placed AHEAD of the SvelteKit head token below…") and added an explicit warning note. Rebuilt; preload now at index 773, before the first modulepreload at index 917.
- **Files modified:** `src/app.html`
- **Commit:** 5c1fa98

**2. [Rule 1 - Bug] HeroAmbient.svelte.test.ts timer advances broke with the 2.5s defer**
- **Found during:** Task 1 step 4 (`pnpm test` — 4 failures)
- **Issue:** `HeroAmbient.svelte.test.ts` (not listed in the plan's files) consumes `createHeroDefer` and drove the timer with `advanceTimersByTime(1001)`, expecting the iframe stub to mount. With the window now at 2500ms, those 4 tests failed.
- **Fix:** Bumped the four `1001` advances to `2501`, renamed the "1000ms timeout" test to "2500ms", and updated the two "exceed the 1000ms timer" no-mount tests to advance 3000ms with corrected comments. Suite green.
- **Files modified:** `src/lib/components/HeroAmbient.svelte.test.ts`
- **Commit:** 5c1fa98

## Next Levers (for a follow-up flip decision)

Ranked by the network diagnostic:

1. **Re-measure on a like-for-like baseline** — on the faster production apex (`BASE_PATH=''`, no subpath) and/or on the 07-03 reference host, before deciding the flip. The ~900ms FCP delta vs 07-03 strongly suggests this 2866ms reading is environment-inflated; a like-for-like read may land under budget on the strength of the hoist + defer alone.
2. **Attack FCP directly** (the real bottleneck) — inline critical CSS, trim the JS the first paint waits on, or profile why first paint sits at ~2.7s. Preload ordering cannot move FCP.
3. **AVIF poster `<picture>` variant** (PERF-V2-02) — shaves decode but not the dominant FCP cost; lower priority given the diagnostic.
4. **`_four` branch** — accept warning-only and defer the blocking flip to post-launch real-user telemetry.

## Files Touched

- Created: `scripts/check-preload-order.mjs`
- Modified: `src/app.html`, `src/routes/+page.svelte`, `src/routes/about/+page.svelte`, `src/lib/heroDefer.svelte.ts`, `src/lib/heroDefer.svelte.test.ts`, `src/lib/components/HeroAmbient.svelte.test.ts`, `.planning/phases/07-polish-cutover/07-LIGHTHOUSE.json`
- **NOT touched (Task 2 halted):** `lighthouserc.json`, `.github/workflows/deploy.yml`, `07-QA-MATRIX.md` — the gate remains at WARNING posture and D-12 stays unchecked.

## Requirements

- **POL-02** — NOT marked complete. The remediation work landed but the budget is still missed and the blocking gate was not flipped; POL-02 stays PARTIAL pending a passing measurement or a follow-up lever decision.

## Self-Check: PASSED

- `scripts/check-preload-order.mjs` — FOUND
- `src/app.html` — FOUND
- `260610-vu7-SUMMARY.md` — FOUND
- Commit `5c1fa98` — FOUND
- `lighthouserc.json` LCP assertion still `["warn", ...]` (correctly NOT flipped — Task 2 halted)
