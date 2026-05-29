---
status: partial
phase: 07-polish-cutover
source: [07-VERIFICATION.md]
authoritative_gate: 07-QA-MATRIX.md
started: 2026-05-29T12:10:00Z
updated: 2026-05-29T12:10:00Z
---

## Current Test

[awaiting human testing — these are the pre-cutover go/no-go items]

> **Authoritative source:** `07-QA-MATRIX.md` is the consolidated go/no-go gate for this phase
> (per D-05). This file exists so the items surface in `/gsd:progress` and `/gsd:audit-uat`;
> execute and record results against `07-QA-MATRIX.md`, not here. All 6/6 automated/code-verifiable
> success criteria already PASSED (see `07-VERIFICATION.md`). The live cutover is hard-gated on
> these items + the user's explicit "_three wins the A/B" declaration (D-09).

## Tests

### 1. BrowserStack 28-cell reel matrix (D-06)
expected: 7 OS/browser targets (iOS Safari 16, 17.0, 17.1, 17.2+, Chrome Android, Firefox desktop, Safari macOS) × 4 reel pillars (scroll-snap fluidity, iframe lifecycle leak-defense, poster-fallback degradation, chrome-fade) all pass. The Phase 3 P3 leak-defense is non-negotiable.
result: [pending]

### 2. iPhone 5-minute thermal test
expected: A real iPhone scrolls the 56-section reel for 5 minutes with battery delta ≤ 8% and no thermal throttling / runaway iframe accumulation (peak iframe count never exceeds 3).
result: [pending]

### 3. Phase 5 surface UAT — hero / watch / back-nav on real Vimeo (7 items)
expected: The 7 deferred Phase 5 human-verify items in `05-HUMAN-UAT.md` (hero iframe attach+silent-play, off-screen unmount, WATCH-01 chrome-fade, HERO-03 sound-on autoplay, WATCH-05 back-nav restore, cross-route arrival restore, axe spot-check on staging) all pass on real devices.
result: [pending]

### 4. Phase 3 real-device QA (03-HUMAN-UAT.md)
expected: The deferred Phase 3 reel-system real-device matrix (iOS 16/17.0/17.1 BrowserStack + iPhone thermal QA) signs off — the load-bearing iframe-lifecycle phase.
result: [pending]

### 5. 21-cell responsive sweep (D-08)
expected: 7 routes × 3 breakpoints (mobile / tablet / desktop) render correctly — no layout breaks, no overflow, chrome/filter behavior correct at each width.
result: [pending]

### 6. Pre-cutover checklist + A/B-winner declaration (D-09 hard gate)
expected: Lighthouse warn→error flip applied (after LCP remediation — currently 2806ms vs 2500ms budget); CONT-02 decision recorded; OG-font fallback decision recorded (07-02 Source-Serif-4 fontconfig limitation); user explicitly declares `_three` the A/B winner; then the 9-step Launch Runbook (in `07-05-SUMMARY.md`) executes against a GREEN `07-QA-MATRIX.md`.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
