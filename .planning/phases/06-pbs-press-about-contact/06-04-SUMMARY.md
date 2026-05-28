---
phase: 06-pbs-press-about-contact
plan: 04
subsystem: ui
tags: [svelte5, sveltekit, topnav, chrome-fade, scroll-idle, d-16, gap-closure, a11y, e2e]

# Dependency graph
requires:
  - phase: 04-wayfinding
    provides: "TopNav.svelte chrome-fade $effect + scrollIdle.svelte.ts rune (scroll-target attach + isScrolling signal)"
  - phase: 06-pbs-press-about-contact
    provides: "06-01 added /press to TopNav REEL_ROUTE_IDS (route-scope half of D-16); 06-02 shipped /press's bespoke `Press credits reel` scroll container"
provides:
  - "TopNav scroll-target querySelector is now a selector-list matching BOTH reel-surface labels ([aria-label='Filmography reel'] AND [aria-label='Press credits reel']) — D-16 chrome-fade fires on all four reel routes (/work, /work/[category], /pbs-american-portrait/, /press)"
affects: ["Phase 07 cutover (POL-04 real-device QA covers chrome-fade timing across all reel routes incl. /press)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS selector-list (comma-separated) in document.querySelector to resolve one-of-N mutually-exclusive container contracts per route — exactly one matches, so the result is unambiguous; avoids a data-attribute or a second initScrollIdle call"

key-files:
  created:
    - ".planning/phases/06-pbs-press-about-contact/06-04-SUMMARY.md"
  modified:
    - "src/lib/components/TopNav.svelte — querySelector broadened to selector-list ([aria-label='Filmography reel'], [aria-label='Press credits reel']); comment updated to name both reel surfaces; initScrollIdle(reelContainer ?? window) fallback preserved; a11y guard intact (opacity-0 pointer-events-none only)"

decisions:
  - "Honored the plan's hard scope boundary: ONLY src/lib/components/TopNav.svelte modified. press.spec.ts left unedited (run-only). Test C's emergent failure documented + deferred rather than fixed in-place, per success criterion #5."
  - "Forced a clean rebuild of build/ before e2e: the running preview server on :4183 was serving a STALE pre-edit bundle (reuseExistingServer:true). Verified the rebuilt TopNav chunk contains the selector-list before re-running — Rule 3 blocking-issue fix (environment, not code)."

metrics:
  duration_minutes: 55
  tasks: 2
  files_changed: 1
  completed: 2026-05-28
---

# Phase 6 Plan 04: D-16 /press Chrome-Fade Gap Closure Summary

**One-liner:** Broadened `TopNav.svelte`'s scroll-target `querySelector` to a CSS selector-list matching both reel-container labels (`Filmography reel` + `Press credits reel`), so the D-16 chrome-fade now attaches its scroll-idle listener to `/press`'s bespoke container and fires there — closing the sole Phase 6 verification gap (6/7 → 7/7 truths).

## What Shipped

A single-file, two-line edit inside the existing `$effect` in `src/lib/components/TopNav.svelte`:

**EDIT 1 — querySelector (was single-label, now selector-list):**

```ts
// BEFORE
const reelContainer = document.querySelector(
  '[role="region"][aria-label="Filmography reel"]'
) as HTMLElement | null;

// AFTER
const reelContainer = document.querySelector(
  '[role="region"][aria-label="Filmography reel"], [role="region"][aria-label="Press credits reel"]'
) as HTMLElement | null;
```

**EDIT 2 — the comment above it** updated to name both reel surfaces (ReelStage's `Filmography reel` for `/work`, `/work/[category]`, `/pbs-american-portrait/`; and `/press`'s bespoke `Press credits reel`), noting exactly one exists per route so the selector-list resolves unambiguously, and that the `?? window` fallback is a safe no-op for mount-order timing.

Line 83 — `initScrollIdle(reelContainer ?? window)` — left exactly as-is. `REEL_ROUTE_IDS`, the `$derived chromeClass`, the `fadeClass` literal, `isActive()`, the focus/hover/tap handlers, and the `<header>` markup were all untouched.

## Why This Closes the Gap

Root cause (confirmed against source + 06-VERIFICATION.md): the prior `querySelector` matched only ReelStage's `Filmography reel` container. `/press` renders its own scroll container labeled `Press credits reel` (it does NOT use ReelStage), so the query returned `null` on `/press`, and `TopNav` fell back to `initScrollIdle(window)`. But `/press` scrolls its inner `overflow-y-auto` container — not `window` — so the scroll event never fired, `scrollIdle.isScrolling` never flipped true, and the `$derived chromeClass` never appended `opacity-0 pointer-events-none`. Broadening the selector attaches the listener to whichever reel container exists on the current route.

## Verification

| Check | Command | Result |
| ----- | ------- | ------ |
| Type check | `pnpm check` | ✅ PASS — 639 files, 0 errors, 0 warnings |
| Unit tests | `pnpm test` | ✅ PASS — 39 files, 440 tests (matches 06-VERIFICATION.md baseline; no regression) |
| Task 1 grep gate | selector-list + a11y | ✅ Both labels present; `display:none`/`visibility:hidden` appear ONLY in the file's anti-pattern documentation comment (line 35), never as CSS — confirmed by stripping comments and re-testing (a11y guard intact) |
| Scope | `git diff --name-only` (source) | ✅ Only `src/lib/components/TopNav.svelte` |
| **e2e Test D (the gap)** | `npx playwright test tests/e2e/press.spec.ts` | ✅ **PASS on chromium + webkit + firefox** — header gains `opacity-0` + `pointer-events-none` within the ~220ms window. Previously failed on all 3. |
| e2e Tests A, B, E | (same run) | ✅ PASS on all 3 browsers (13 articles; prestige order; axe zero AA violations) |
| e2e Test C | (same run) | ⚠️ FAIL on webkit + firefox — see Deferred Issues. Product navigation is proven correct; this is a test-wait fragility surfaced (not caused) by the fix. |

Canonical e2e run (fresh build): **13 passed / 2 failed** — the 2 failures are Test C only (webkit + firefox). Test D (this plan's sole objective) is green everywhere.

### D-16 status: CLOSED

The sole Phase 6 gap — "TopNav fades on `/press` during scroll (D-16)" (6/7 → 7/7) — is now closed. The fade still fires on `/work`, `/work/[category]`, and `/pbs-american-portrait/` (the `Filmography reel` branch of the selector-list is preserved; verified by grep). No other file or route was touched.

## Deviations from Plan

### Rule 3 — Blocking issue (environment, not code): stale preview build

**Found during:** Task 2, first e2e run.
**Issue:** Test D still failed on all 3 browsers after the edit. Investigation showed a preview server was already listening on `:4183` and Playwright's `reuseExistingServer:true` (local) reused it — serving a STALE pre-edit bundle. The on-disk `build/_app/immutable/chunks/<TopNav>.js` still contained only `Filmography reel` (no `Press credits reel`).
**Fix:** Stopped the stale preview process (`pwsh` `Stop-Process` on the `:4183` listener), ran a clean `pnpm build`, and verified the rebuilt layout/TopNav chunk contained the selector-list (both labels + `querySelector` co-located) BEFORE re-running. No source change — purely an environment fix. After the clean rebuild, Test D passed on all 3 browsers.
**Commit:** N/A (no source change; verification-environment remediation).

## Deferred Issues

### tests/e2e/press.spec.ts Test C — weak wait condition races the trailing-slash 307 redirect (OUT OF SCOPE)

**Exact failing assertion (webkit + firefox):**
```
expect(received).toContain(expected)
  Expected substring: "/watch/"
  Received string:    "http://localhost:4183/press/"
  at tests/e2e/press.spec.ts:62
```

**This is NOT a product defect — navigation works.** A throwaway probe replacing `await page.waitForLoadState('networkidle')` (line 61) with `await page.waitForURL(/\/watch\//)` PASSES on chromium + webkit + firefox; final URL settles at `http://localhost:4183/watch/fvCB4gg7yS0/`. The ▷ Watch href renders as `../watch/fvCB4gg7yS0` (resolved relative form of `${base}/watch/<id>`), navigation completes, and `trailingSlash='always'` (Plan 06-01) issues a 307 → lands at `/watch/<id>/`.

**Root cause:** (1) `trailingSlash='always'` means the no-trailing-slash href redirects (307) to the trailing-slash form; the SPA navigation + redirect finishes a few ms after `networkidle` resolves, so `page.url()` is read at `/press/` too early. (2) Plan 06-04's fix activates the previously-dead `/press` scroll-idle listener — Playwright's click-auto-scroll now fires it, shifting navigation timing just enough to expose the weak wait. The listener activation is the CORRECT, intended D-16 behavior; it merely unmasked a latent test fragility that the prior no-op `window` listener happened to hide.

**Isolation proof (flake vs. cause):** Built the parent commit (`a530ff6~1`, pre-fix TopNav) and ran Test C serially → 3/3 PASS. Built HEAD (`a530ff6`, with the fix) and ran Test C serially → 3/3 FAIL. The timing shift is induced by the (correct) listener activation, not by any navigation regression.

**Why deferred, not fixed:** The plan's scope is explicit and measurable — "Only `src/lib/components/TopNav.svelte` is modified" (success criterion #5), and `tests/e2e/press.spec.ts` is designated "run-only; not edited" (Task 2). Editing the test would violate the gap-only scope boundary. The fix is a one-line, test-only, correct-Playwright-primitive change (line 61: `waitForLoadState('networkidle')` → `waitForURL(/\/watch\//)` — explicitly NOT a retry/sleep hack). Recommend a focused follow-up (Phase 7 polish, or an authorized one-line amendment) to apply it. Logged in `.planning/phases/06-pbs-press-about-contact/deferred-items.md`.

## Self-Check: PASSED

- FOUND: `.planning/phases/06-pbs-press-about-contact/06-04-SUMMARY.md`
- FOUND: `src/lib/components/TopNav.svelte` (selector-list contains both `Press credits reel` AND `Filmography reel`)
- FOUND: `.planning/phases/06-pbs-press-about-contact/deferred-items.md` (Test D marked RESOLVED; Test C logged as deferred)
- FOUND commit: `a530ff6` (fix(06-04): broaden TopNav scroll-target to both reel container labels)
