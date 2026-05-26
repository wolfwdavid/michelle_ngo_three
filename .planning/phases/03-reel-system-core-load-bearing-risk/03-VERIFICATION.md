---
phase: 03-reel-system-core-load-bearing-risk
type: verification
status: partial
created: 2026-05-25
updated: 2026-05-26
deferred_decision_date: 2026-05-26
deferred_decision_by: user
deferred_until: "before Phase 7 cutover (per CONTEXT D-13 / D-14 / D-16)"
---

# Phase 3 — Real-Device Verification Evidence

This file collects evidence for the two manual gates that close Phase 3:
1. **BrowserStack real-device matrix** (Task 8, D-13/D-14) — cross-version OS/browser validation
2. **Manual iPhone thermal QA** (Task 9, D-16) — 5-minute reel scroll on physical hardware

The verifier (`/gsd:verify-work`) consumes this file as the load-bearing
real-device evidence before signing off Phase 3.

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

**Status downgrade:** frontmatter `status: partial` (was
`pending-real-device-runs`) so the verifier flags this as outstanding rather
than complete.

---

## Local Suite Baseline (Plan 03-03 Task 7)

Before the real-device runs below were performed, the following local gates were green:

- [x] `pnpm test` — 165 / 165 unit + component tests (3 plans × accumulated suites)
- [x] `pnpm check` — 0 errors, 0 warnings (TS strict + noUncheckedIndexedAccess)
- [x] `pnpm build` — adapter-static + validateVideosPlugin + validatePostersPlugin all green
- [x] `pnpm test:e2e` — 21 passed, 3 skipped (Page Visibility — documented headless caveat) across chromium + webkit + firefox
- [x] All 7 anti-pattern grep gates clean (negative-assertion test refs + comment refs documented)

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

## Sign-off

**Code-level gates (Plan 03-03 — CLOSED 2026-05-26 at commit `9207d45`):**

- [x] `pnpm test` green (165 / 165 unit + component tests)
- [x] `pnpm check` clean (0 TS errors, 0 svelte warnings)
- [x] `pnpm build` clean (validateVideosPlugin + validatePostersPlugin both green)
- [x] `pnpm test:e2e` 21 passed / 3 skipped (chromium + webkit + firefox; Page Visibility skips are a documented headless caveat — see `03-03-SUMMARY.md`)
- [x] All 7 anti-pattern grep gates clean

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
The current decision posture is "code-complete, real-device-evidence pending."
