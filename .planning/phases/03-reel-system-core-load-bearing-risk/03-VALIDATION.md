---
phase: 3
slug: reel-system-core-load-bearing-risk
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-25
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Sourced from `03-RESEARCH.md` §Validation Architecture (lines 1202-1330).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `vitest@4.1.5` (data + ui project split) + `@playwright/test@1.60.0` (e2e) + `@axe-core/playwright@4.11.3` (a11y) |
| **Config file** | `vite.config.ts` (Vitest two-project split: `data` = node, `ui` = jsdom) + `playwright.config.ts` (locked Phase 1) |
| **Quick run command** | `pnpm test` (Vitest only — typical < 30s) |
| **Full suite command** | `pnpm test && pnpm test:e2e` |
| **Estimated runtime** | ~30s Vitest + ~3-5min Playwright (WebKit + Chromium + Firefox) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test` (Vitest unit + component)
- **After every plan wave:** Run `pnpm test && pnpm test:e2e` (Vitest + Playwright local cross-browser)
- **Before `/gsd:verify-work`:** Full suite green + BrowserStack matrix evidence committed (iOS 16 / 17.0 / 17.1 / 17.2+, Chrome Android) + manual iPhone 5-min thermal QA screenshot committed
- **Max feedback latency:** 30 seconds (Vitest); 5 minutes (full Playwright)

---

## Per-Task Verification Map

> Task IDs filled by `gsd-planner` once plan decomposition lands. Mapping below is per-requirement; planner assigns tasks.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 03-01 | TBD | REEL-01 | unit (ui) | `pnpm test src/lib/components/ReelStage.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 03-03 | TBD | REEL-01 | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "fast-flick"` | ❌ W0 | ⬜ pending |
| TBD | 03-02 | TBD | REEL-02 | unit (data) | `pnpm test src/lib/iframe/url.test.ts` (Vimeo + YouTube param snapshot) | ❌ W0 | ⬜ pending |
| TBD | 03-03 | TBD | REEL-03 | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "windowed-mount"` (iframe count ≤ 3 invariant) | ❌ W0 | ⬜ pending |
| TBD | 03-01 | TBD | REEL-03 | unit (ui) | `pnpm test src/lib/components/ReelStage.test.ts -t "single observer"` | ❌ W0 | ⬜ pending |
| TBD | 03-01 | TBD | REEL-04 | unit (data) | `pnpm test src/lib/state/network.test.ts` (Chromium-only progressive enhancement) | ❌ W0 | ⬜ pending |
| TBD | 03-01 | TBD | REEL-04 | unit (ui) | `pnpm test src/lib/state/motion.test.ts` (matchMedia reactivity) | ❌ W0 | ⬜ pending |
| TBD | 03-03 | TBD | REEL-04 | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "reduced-motion"` | ❌ W0 | ⬜ pending |
| TBD | 03-02 | TBD | REEL-04 | unit (ui) | `pnpm test src/lib/components/PreviewLoop.test.ts -t "800ms"` (timeout → PosterImage swap) | ❌ W0 | ⬜ pending |
| TBD | 03-01 | TBD | REEL-05 | unit (ui) | `pnpm test src/lib/components/ReelSection.test.ts` (title + CategoryTag + PLAY-WITH-SOUND deep-link) | ❌ W0 | ⬜ pending |
| TBD | 03-03 | TBD | REEL-06 | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "leak"` (no detached iframes after full scroll + return) | ❌ W0 | ⬜ pending |
| TBD | 03-02 | TBD | REEL-06 | unit (ui) | `pnpm test src/lib/components/PreviewLoop.test.ts -t "dispose order"` | ❌ W0 | ⬜ pending |
| TBD | 03-02 | TBD | REEL-06 | unit (data) | `pnpm test src/lib/iframe/vimeoAdapter.test.ts -t "origin"` (postMessage origin allowlist) | ❌ W0 | ⬜ pending |
| TBD | 03-03 | TBD | REEL-07 | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "page-visibility"` (pause < 300ms) | ❌ W0 | ⬜ pending |
| TBD | 03-03 | TBD | NAV-03 fwd-ship | e2e | `pnpm test:e2e tests/e2e/reel.spec.ts -g "axe"` (`@axe-core/playwright` WCAG AA scan) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Files that DO NOT exist yet but Phase 3 requires (sourced from RESEARCH.md §Wave 0 Gaps, lines 1240-1267):

**Reel components:**
- [ ] `src/lib/components/ReelStage.svelte` — covers REEL-01, REEL-03
- [ ] `src/lib/components/ReelStage.test.ts` — covers REEL-01 + REEL-03 unit assertions
- [ ] `src/lib/components/ReelSection.svelte` — covers REEL-05
- [ ] `src/lib/components/ReelSection.test.ts` — covers REEL-05 unit assertions
- [ ] `src/lib/components/PreviewLoop.svelte` — covers REEL-02, REEL-06, REEL-07
- [ ] `src/lib/components/PreviewLoop.test.ts` — covers REEL-02 + REEL-06 + REEL-07 unit assertions
- [ ] `src/lib/components/PosterImage.svelte` — covers REEL-04
- [ ] `src/lib/components/PosterImage.test.ts` — covers REEL-04 unit assertions

**iframe infrastructure:**
- [ ] `src/lib/iframe/url.ts` — covers REEL-02 (pure function, testable in node)
- [ ] `src/lib/iframe/url.test.ts` — URL snapshot tests for all 56 videos
- [ ] `src/lib/iframe/vimeoAdapter.ts` — covers REEL-06 (named-ref postMessage adapter)
- [ ] `src/lib/iframe/vimeoAdapter.test.ts` — covers REEL-06 + origin filter
- [ ] `src/lib/iframe/youtubeAdapter.ts` — covers REEL-06 (named-ref postMessage adapter)
- [ ] `src/lib/iframe/youtubeAdapter.test.ts` — covers REEL-06 + `listening` handshake

**Module-scope state runes:**
- [ ] `src/lib/state/network.svelte.ts` — covers REEL-04 (Chromium-only)
- [ ] `src/lib/state/network.test.ts` — covers REEL-04 + D-05 progressive enhancement
- [ ] `src/lib/state/motion.svelte.ts` — covers REEL-04 (reduced-motion)
- [ ] `src/lib/state/motion.test.ts` — covers REEL-04 + matchMedia change reactivity

**Data layer extension:**
- [ ] `src/lib/data/posters.ts` — `getPosterFor(video)` helper consuming sidecar
- [ ] `src/lib/data/posters.test.ts` — covers sidecar shape contract
- [ ] `src/lib/data/posters.json` — build-emitted sidecar (D-02)

**Route + e2e harness:**
- [ ] `src/routes/work/+page.ts` + `src/routes/work/+page.svelte` — Phase 3 wires `/work`
- [ ] `tests/e2e/reel.spec.ts` — Playwright 4-pillar suite (Pillars 1-4)

**Committed artifacts:**
- [ ] `static/posters/*.{webp,avif,jpg}` — populated by extended `scripts/check-embeds.ts`

**Framework install:** NONE — all deps already in `node_modules` from Phase 1.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-device scroll-snap on iOS Safari 16 | REEL-01, SC #1, Pitfall 1 (`playsinline` scroll-freeze regression on pre-17.2) | Playwright WebKit ≠ real iOS Safari 16; the scroll-freeze bug requires Apple silicon | BrowserStack manual session: iPhone 12 mini iOS 16.x → load `/work` → fast-flick from section 1 to section 40 → must not get trapped on iframe section. Record video; commit screenshot. |
| iOS Low Power Mode `play()` rejection | REEL-04 trigger 3, Pitfall 3 | LPM is a hardware mode; Playwright cannot simulate | Physical iPhone (user's) → enable Low Power Mode in Settings → reload `/work` → confirm every section shows `<PosterImage>` + `▷ TAP TO PLAY` (no iframe attached). Screenshot committed. |
| 5-min thermal QA (all-3-play decision validation) | D-09, D-16 | Battery thermal throttling is hardware-side; no automation | Physical iPhone (user's) → reload `/work` → start battery monitor (Settings → Battery) → continuously scroll the reel for 5 min → record battery % before + after → if drop > 8%, escalate per D-16 (drop quality cap on ±1 sections to 360p, then if still > 8%, fall back to current-only-plays). Screenshot + numeric reading committed to `03-VERIFICATION.md`. |
| EU GDPR no-CMP posture | REEL-04 trigger 5, D-06, Pitfall 13 | EU IP / geolocation; storage panel inspection | BrowserStack EU IP session → load `/work` → open DevTools Application/Storage → confirm no `yt-remote-device-id` / Vimeo trackers BEFORE first user interaction. Screenshot committed. |
| Embed-disabled-by-owner runtime fallback | REEL-04 trigger 4, Pitfall 6 | Cannot intentionally break a real Vimeo/YouTube video; test via a known-disabled fixture | Plan 03-03 ships a test fixture video with embedding disabled → mount in isolation → confirm 800ms timeout fires → confirm swap to `<PosterImage>` with TAP TO PLAY. Component test sufficient (Playwright would require monkey-patching). |
| BrowserStack matrix run | D-13, D-14, SC #1 | Real-device cross-version validation (iOS 16/17.0/17.1/17.2+, Chrome Android, Firefox desktop, Safari macOS) | BrowserStack subscription active → manual session per OS/version → run the 4 Playwright pillars against the staging URL (`wolfwdavid.github.io/michelle_ngo_three/`) → capture pass/fail per pillar per OS → matrix committed to `03-VERIFICATION.md`. |
| VoiceOver screen-reader pass on `/work` | NAV-03 forward-ship, Pitfall 8 | SR behavior cannot be automated reliably | Physical iPhone (user's) → enable VoiceOver in Settings → load `/work` → rotor (`VO + U`) → Landmarks → confirm: ONE `<main>` + ONE filmography landmark + N `<article aria-label="Video N of M: ...">` per scrolled view (NOT 56-region landmark explosion). Screenshot/note committed. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (24 Wave 0 entries above)
- [ ] No watch-mode flags in commands (`pnpm test` runs non-watch)
- [ ] Feedback latency < 30s (Vitest); < 5min (full Playwright)
- [ ] BrowserStack subscription confirmed active before Plan 03-03 verification (D-14 prerequisite)
- [ ] `nyquist_compliant: true` set in frontmatter (flip after planner fills Task IDs)

**Approval:** pending — `gsd-planner` will fill Task ID column in Plan 03-01 / 03-02 / 03-03 outputs; flip `nyquist_compliant: true` once all Task IDs map cleanly.

---

## Dimension Coverage (Nyquist 8-dimension gate)

| Dimension | Coverage | Source |
|-----------|----------|--------|
| 1. Functional | Unit (ReelStage IO callback, mountedIds boundary, URL builder snapshot, Page Visibility dispatch, PLAY-WITH-SOUND deep-link) | RESEARCH §Dim 1 |
| 2. Integration | Component context (ReelStage → ReelSection → PreviewLoop / PosterImage); state runes → ReelSection $derived; adapter attach/dispose order; sidecar JSON → PosterImage src | RESEARCH §Dim 2 |
| 3. Performance / Resource | Playwright Pillar 2 (iframe count invariant) + Pillar 3 (leak defense) + manual thermal QA + BrowserStack 540p quality cap verification + CLS DevTools panel | RESEARCH §Dim 3 |
| 4. Accessibility | Playwright Pillar 4 (`@axe-core/playwright`) + `<article aria-label>` markup test + `tabindex` toggle + manual VoiceOver pass + focus token consumption | RESEARCH §Dim 4 |
| 5. Compatibility | Playwright WebKit + Chromium + Firefox + BrowserStack iOS 16/17.0/17.1/17.2+ + Chrome Android + manual physical iPhone | RESEARCH §Dim 5 |
| 6. Security / Privacy | postMessage origin allowlist (Layer 5) + spoofed origin rejection test + `referrerpolicy` + Vimeo `dnt=1` + YouTube `nocookie` + EU storage-panel check | RESEARCH §Dim 6 |
| 7. Failure Modes (5 fallback triggers) | Playwright reduced-motion + jsdom Chromium-cellular mock + manual LPM + manual embed-disabled fixture + BrowserStack EU IP | RESEARCH §Dim 7 |
| 8. Verification (per-REQ-ID Nyquist gate) | REEL-01..07 all bound to specific automated tests + manual gates (see RESEARCH §Dim 8) | RESEARCH §Dim 8 |
