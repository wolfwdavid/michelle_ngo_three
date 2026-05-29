---
phase: 07-polish-cutover
plan: 04
subsystem: infra
tags: [ci, github-actions, lighthouse, lhci, drift-check, mechanical-gate, a-b-parity, adapter-static]

# Dependency graph
requires:
  - phase: 07-polish-cutover (Plan 07-01)
    provides: scripts/test-prerender-coverage.mjs + the 70-URL sitemap (D-14 coverage gate this plan wires)
  - phase: 07-polish-cutover (Plan 07-02)
    provides: static/og-image.jpg @ 1200x630 (the Trap B subject) + favicon binaries (coverage-gate assets)
  - phase: 07-polish-cutover (Plan 07-03)
    provides: lighthouserc.json (warning-posture, mobile Slow-4G, 2500ms LCP) the Lighthouse job runs
  - phase: 02-data-layer
    provides: drift-check job + __four/ pinned-SHA checkout + .videos-source-sha (Trap A; reused by Trap B)
  - phase: 01-foundation
    provides: D-17 grep gate (Trap D) + the single-workflow deploy.yml mechanical-gate template
provides:
  - "deploy.yml prerender-coverage assertion (D-14) — fails build if sitemap < 70 URLs or a static asset is missing"
  - "deploy.yml Trap E route-manifest diff (D-04) — fails build if _three's prerendered route IA diverges from _four's pinned snapshot"
  - "deploy.yml Trap B OG-dimension + filesize-ratio parity (D-02/POL-05) — og-image must be 1200x630 within 3x filesize band of _four"
  - "deploy.yml lighthouse job (D-17/POL-02) — measures / LCP on mobile Slow-4G at WARNING posture against the 2500ms budget"
  - "src/lib/data/.four-route-manifest — committed pinned _four route-shape snapshot (Trap E baseline)"
affects: [07-05, cutover, ci, deploy]

# Tech tracking
tech-stack:
  added: ["@lhci/cli@0.15.1 (npx-pinned, not a package.json dep)"]
  patterns:
    - "Committed-snapshot mechanical gate (route manifest) mirroring the .videos-source-sha sync-discipline — diff build output vs a pinned sidecar, ::error:: + exit 1 on divergence"
    - "Dependency-free JPEG SOF-marker dimension probe in CI jobs that run no pnpm install (no sharp)"
    - "Warning-posture Lighthouse gate that surfaces a budget-missing metric without failing CI; warn->error flip deferred to a documented pre-cutover step"

key-files:
  created:
    - "src/lib/data/.four-route-manifest"
  modified:
    - ".github/workflows/deploy.yml"

key-decisions:
  - "Trap E uses the committed-snapshot approach (RESEARCH OQ3): diff build/ route shapes vs .four-route-manifest rather than building _four in CI — faster, sync-disciplined like the videos sidecar"
  - "Trap E manifest normalizes routes to <shape>\\t<count> lines (collapse /watch/<id> -> /watch/* count 56, /work/<slug> -> /work/* count 8); comment + blank lines stripped before diff for determinism"
  - "Trap B dimension probe is dependency-free JPEG SOF-marker parsing (drift-check job runs no pnpm install, so sharp is unavailable) — Rule 3 deviation from the plan's sharp one-liner"
  - "Trap B probes only _three's dimensions; _four's og-image.jpg is actually a WebP-in-.jpg (RIFF/WEBP magic), so dimension-parsing it would crash. _four is used solely as the format-agnostic statSync filesize reference (Rule 1)"
  - "Trap B split across two jobs: meta-tag grep in the build job (needs build/index.html), dimension+ratio in drift-check (needs __four/) — honours the plan's '__four/ reuse' intent for the half that needs it"
  - "Lighthouse gate wired at WARNING posture per POL-02 (lighthouserc.json uses ['warn',...]); 07-03 measured / median LCP ~2806ms (misses 2500ms by ~306ms) so a blocking gate WOULD fail CI — the warn->error flip is a 07-05 pre-cutover step (D-12), not this plan"
  - "No preset:desktop introduced for the LHCI run — the mobile Slow-4G default in lighthouserc.json is preserved (avoids the _four 07-04 trap)"

patterns-established:
  - "Pattern: committed pinned-sidecar + build-output-diff CI gate (Trap E), the route-IA sibling of the .videos-source-sha byte-compare (Trap A)"
  - "Pattern: dependency-free binary-format probe (JPEG SOF) for CI jobs without an install step"

requirements-completed: [POL-02, POL-04, POL-05]

# Metrics
duration: 15min
completed: 2026-05-29
---

# Phase 7 Plan 4: CI Mechanical-Gate Consolidation Summary

**Extended `deploy.yml` (single-owner edit) with four new mechanical A/B-integrity gates — prerender-coverage (D-14), Trap E route-manifest diff (D-04), Trap B OG-dimension parity (D-02/POL-05), and a warning-posture Lighthouse `/` LCP gate (D-17/POL-02) — plus the committed `.four-route-manifest` baseline, with Trap A/D left byte-for-byte unchanged.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-29T14:18:37Z
- **Completed:** 2026-05-29T14:33:52Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- **prerender-coverage assertion (D-14)** wired into the build job after Build — runs `scripts/test-prerender-coverage.mjs`, failing the build if the sitemap drops below 70 URLs or any required favicon/og-image asset is missing (catches the empty-`entries()` hole `adapter-static strict:true` cannot).
- **Trap E route-manifest diff (D-04)** wired into the build job — normalizes `build/` prerendered route shapes and diffs them against the committed `src/lib/data/.four-route-manifest`, emitting `::error::` + `exit 1` on any IA divergence between `_three` and `_four`.
- **`.four-route-manifest`** created as a pinned, sync-disciplined snapshot (8 normalized route shapes + counts) at the same `_four` SHA as `.videos-source-sha`.
- **Trap B OG-dimension parity (D-02/POL-05)** wired in two halves: a meta-tag grep in the build job (`build/index.html` advertises `og:image` 1200x630) and a dimension + filesize-ratio probe in the drift-check job (reusing the `__four/` checkout).
- **Lighthouse `/` LCP gate (D-17/POL-02)** added as a new `lighthouse` job (`needs: deploy`) running `npx @lhci/cli@0.15.1 autorun` at WARNING posture against the staging `/`, preserving the mobile Slow-4G default.
- **Trap A (videos.json cmp) and Trap D (localStorage grep) confirmed unchanged** — the full Task-2 diff against HEAD had zero deletions (pure additions).

## Task Commits

Each task was committed atomically:

1. **Task 1: .four-route-manifest + prerender-coverage + Trap E** - `80b74e9` (ci)
2. **Task 2: Trap B OG-dim + Lighthouse gate; Trap A/D verified** - `cefd3e3` (ci)

**Plan metadata:** see final docs commit (this SUMMARY + STATE + ROADMAP).

## Files Created/Modified

- `src/lib/data/.four-route-manifest` (created) - Pinned `_four` prerendered route-shape snapshot; Trap E baseline. 8 normalized `<shape>\t<count>` lines + a documented normalization header.
- `.github/workflows/deploy.yml` (modified) - +4 gates: build job gains prerender-coverage assertion, Trap E diff, and the Trap B meta-tag grep; drift-check job gains the Trap B og-image dimension+ratio probe; a new `lighthouse` job runs the warning-posture LCP gate.

## Decisions Made

- **Committed-snapshot Trap E** (RESEARCH OQ3) over building `_four` in CI — faster and sync-disciplined like the videos sidecar; the drift-check `__four/` checkout is not needed for Trap E.
- **Deterministic manifest format** `<route-shape>\t<count>` with `/watch/*`=56 and `/work/*`=8 collapses; comment/blank lines stripped before diff so the comparison is byte-stable across runs.
- **Lighthouse at warning posture** — wiring it as blocking would fail CI today (07-03 measured ~2806ms vs the 2500ms budget). The warn->error flip is explicitly a 07-05 pre-cutover runbook step.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Trap B dimension probe uses dependency-free JPEG SOF parse instead of the plan's `sharp` one-liner**
- **Found during:** Task 2 (Trap B wiring)
- **Issue:** The plan's suggested probe (`node -e "require('sharp')..."`) assumes `sharp` is on disk, but the `drift-check` job runs no `pnpm install`, so `sharp` is not available there. Adding a full install just for one metadata read would cost ~45s cold and contradicts the job's lightweight design.
- **Fix:** Implemented an inline dependency-free probe that parses the JPEG SOF (Start-of-Frame) marker to read width/height. Zero install cost, deterministic.
- **Files modified:** `.github/workflows/deploy.yml`
- **Verification:** Local probe against `static/og-image.jpg` returns exactly 1200x630, exit 0.
- **Committed in:** `cefd3e3`

**2. [Rule 1 - Bug] `_four`'s og-image.jpg is a WebP-in-`.jpg`; probe only `_three`'s dimensions, use byte-count ratio for the comparison**
- **Found during:** Task 2 (Trap B wiring)
- **Issue:** Inspecting magic bytes showed `__four/static/og-image.jpg` begins `RIFF...WEBP` (a WebP file with a `.jpg` extension), while `_three`'s is a genuine baseline JPEG (`FF D8`). A JPEG-marker (or naive sharp-then-assert) probe that tried to read `_four`'s dimensions would error. The plan only requires `_three`'s og-image to be 1200x630; `_four` is purely the filesize-ratio reference.
- **Fix:** The Trap B probe parses only `_three`'s dimensions and uses format-agnostic `statSync` byte counts for the 3x filesize-ratio band against `_four`.
- **Files modified:** `.github/workflows/deploy.yml`
- **Verification:** Local probe: `_three`=23443B / `_four`=15386B = ratio 1.52 (< 3x), exit 0.
- **Committed in:** `cefd3e3`

**3. [Rule 3 - Blocking] Trap B split across build + drift-check jobs**
- **Found during:** Task 2
- **Issue:** The plan placed all of Trap B in the drift-check job, but the meta-tag half asserts `build/index.html` content, which only exists in the build job (drift-check does no build).
- **Fix:** Meta-tag grep lives in the build job (after Trap E); the dimension+ratio probe lives in drift-check (reusing `__four/`, honouring the plan's reuse intent for the half that needs it).
- **Files modified:** `.github/workflows/deploy.yml`
- **Verification:** Meta-tag grep matches on a fresh build (width=1, height=1); YAML valid.
- **Committed in:** `cefd3e3`

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All three are mechanical adaptations to the real CI job topology and the actual on-disk asset formats. The gate truths the plan specified are fully satisfied; no scope creep, no requirement dropped.

## Issues Encountered

- None requiring escalation. The `_four` WebP-in-`.jpg` discovery (deviation 2) was handled inline. Both task commits passed the lint-staged pre-commit hook (prettier reformatted the YAML without breaking structure — re-validated with `python yaml.safe_load` post-commit).

## Known Stubs

None. All four gates are functional and pass locally:
- prerender-coverage: exit 0 (70 URLs + all assets)
- Trap E diff: zero divergence vs `.four-route-manifest`
- Trap B: dimensions 1200x630, ratio 1.52, meta-tags present
- Lighthouse: warning posture (intentionally non-failing; runs against the live staging deploy in CI)

## User Setup Required

None - no external service configuration required. The Lighthouse job runs against the existing staging URL already configured in `lighthouserc.json`.

## Next Phase Readiness

- All five A/B-integrity traps are now mechanically gated or verified: A (videos.json cmp, unchanged) + B (new OG-dim) + C (policy — confirmed in 07-05) + D (localStorage grep, unchanged) + E (new route-manifest diff).
- `deploy.yml` is single-owner-edited this phase — no parallel-write conflict; Wave-1 plans stayed file-isolated.
- **Carried to 07-05 (pre-cutover):** the Lighthouse warn->error flip (D-12) once the `/` LCP budget is met or the budget is formally re-accepted. The gate, posture, and the exact line to change are documented inline in the `lighthouse` job comments.

---
*Phase: 07-polish-cutover*
*Completed: 2026-05-29*

## Self-Check: PASSED

- FOUND: `src/lib/data/.four-route-manifest`
- FOUND: `.github/workflows/deploy.yml`
- FOUND: `.planning/phases/07-polish-cutover/07-04-SUMMARY.md`
- FOUND commit: `80b74e9` (Task 1)
- FOUND commit: `cefd3e3` (Task 2)
