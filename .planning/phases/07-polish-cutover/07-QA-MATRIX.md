---
status: pending
phase: 07-polish-cutover
plan: 07-05
gates_cutover: true
supersedes:
  - .planning/phases/03-reel-system-core-load-bearing-risk/03-HUMAN-UAT.md
  - .planning/phases/05-hero-watch/05-HUMAN-UAT.md
decisions: [D-05, D-06, D-07, D-08, D-09, D-12]
created: 2026-05-29
updated: 2026-05-29
---

# Phase 7 — Consolidated Go / No-Go Cutover Gate (07-QA-MATRIX)

**This is the SINGLE go/no-go gate for the `michellengo.net` production cutover (D-05).**
It supersedes the partial `03-HUMAN-UAT.md` (Phase 3 reel matrix + thermal) and
`05-HUMAN-UAT.md` (Phase 5 surface UAT) trackers — all outstanding manual QA folds
into the sections below. This document is **delivered** by Plan 07-05; the user
**executes** the QA runs against it during the pre-cutover window and flips each
`?`/`⬜` to `✅`/`❌` as runs complete.

**Hard cutover gates (both must be GREEN before the DNS flip — never autonomous):**

- **D-09 — A/B winner declared.** The user must explicitly declare `_three` the A/B
  winner. This is the hard gate that unlocks the Launch Runbook (in `07-05-SUMMARY.md`).
- **D-06 — GREEN BrowserStack matrix.** Every cell of the § BrowserStack matrix +
  the § iPhone thermal test must pass before the DNS flip fires.

Cutover delivers READINESS only. The live DNS flip is the user's cutover-day action,
gated on both of the above. Nothing in this phase fires the cutover.

---

## § BrowserStack 7-OS × 4-pillar reel matrix (D-06)

**Gate: ALL 28 cells GREEN before cutover.** Folds in `03-HUMAN-UAT.md` test #1 +
`03-VERIFICATION.md` § BrowserStack Real-Device Matrix.

**Staging URL under test:** `https://wolfwdavid.github.io/michelle_ngo_three/work`
**BrowserStack subscription:** _confirm active before run; link billing dashboard_
**Run date:** _YYYY-MM-DD (fill when run)_
**Session links:** _paste per row when sessions complete_

### Pillar definitions (match `tests/e2e/reel.spec.ts`)

- **P1 fast-flick** — REEL-01 / SC#1: scroll-snap proximity never traps on a fast
  wheel/swipe from section 1 → ~30.
- **P2 windowed-mount** — REEL-03 / SC#2: at most 3 iframes attached at any moment
  (DevTools Elements → search `iframe`).
- **P3 leak defense** — REEL-06 / SC#4: 0 detached iframe nodes after full forward +
  back scroll (Memory snapshot). **Non-negotiable — any P3 ❌ blocks cutover.**
- **P4 axe-core WCAG AA** — NAV-03 / SC#6: 0 violations on the `wcag2aa` tag.

| OS / Browser | Device | P1 fast-flick | P2 windowed-mount | P3 leak defense | P4 axe WCAG AA | Notes |
|--------------|--------|---------------|-------------------|-----------------|----------------|-------|
| iOS Safari 16.x | iPhone 12 (real) | ? | ? | ? | ? | Pitfall 1 `playsinline` scroll-freeze regression target |
| iOS Safari 17.0 | iPhone 13 (real) | ? | ? | ? | ? | Pitfall 1 + Pitfall 3 LPM `play()` rejection |
| iOS Safari 17.1 | iPhone 14 (real) | ? | ? | ? | ? | Pitfall 1 last-affected version |
| iOS Safari 17.2+ | iPhone 15 (real) | ? | ? | ? | ? | Post-fix baseline |
| Chrome Android | Latest Galaxy (real) | ? | ? | ? | ? | Non-iOS mobile baseline |
| Firefox desktop | macOS Sonoma+ | ? | ? | ? | ? | Desktop non-Chromium |
| Safari macOS | macOS Sonoma+ | ? | ? | ? | ? | Desktop WebKit (≠ iOS WebKit) |

**Legend:** `?` pending • `✅` PASS • `❌` FAIL (creates punch-list entry) • `⚪` N/A

### Escalation branches (from `03-VERIFICATION.md` § Thermal QA — pre-sketched, stand-by)

- **Branch A — 360p ±1 quality cap.** If the iPhone thermal delta > 8%, drop the ±1
  (N-1 / N+1) preview quality to **360p** (keep 540p for the current section only):
  extend `buildEmbedUrl` with an optional `quality` opt, expose `getSectionQuality(idx)`
  on the `reel:stage` context, read it in `PreviewLoop`, re-run.
- **Branch B — D-09 reversal to current-only-plays.** If Branch A still fails, reverse
  CONTEXT D-09 ("all 3 within window play simultaneously"): mount N-1 / N+1 but keep
  them PAUSED; only N plays. Expose `playingId` via context; `PreviewLoop` calls
  `adapter.pause()` when not the playing section. Document the D-09 reversal explicitly.

---

## § iPhone 5-min thermal test (D-06)

**Gate: battery delta ≤ 8% in 5 min.** Folds in `03-HUMAN-UAT.md` test #2.

**Device:** _iPhone model + iOS version_ • **Network:** _Wi-Fi / cellular_
**Battery before:** _N%_ • **Battery after:** _M%_ • **Delta:** _N-M%_
**Result:** `?` _PASS if ≤ 8% / ESCALATE (Branch A → B) if > 8%_

**Run script:** Settings → Battery (note %) → Safari to
`https://wolfwdavid.github.io/michelle_ngo_three/work` → scroll continuously 5 min
(timer-tracked) → lock phone → Settings → Battery (note %) → delta = before − after.

**Secondary subjective:** no audible fan within 60s; no visible scroll-snap stutter.
If delta > 8%: fire Escalation Branch A (360p ±1 cap), re-run; if still > 8%, Branch B
(D-09 reversal to current-only-plays). Both branches pre-documented above.

---

## § 7 Phase 5 surface UAT items (D-07)

**Gate: all 7 pass.** Folds in `05-HUMAN-UAT.md` (status was `partial`, 7 items pending).
These fold into the SAME BrowserStack / iPhone hardware pass — run them during the iOS
Safari 16/17.x sessions above. The headless-Playwright caveat (Phase 3
`HANDSHAKE_TIMEOUT_MS = 800ms` cross-origin postMessage non-determinism) is exactly why
these need real-device confirmation.

| # | Item | Route | Result |
|---|------|-------|--------|
| 1 | Hero iframe attaches + plays silently after defer trigger (rIC / 1s timeout / first interaction) | `/` | ? |
| 2 | Hero iframe unmounts to poster when scrolled off-screen; peak iframe count ≤ 3 (D-02 budget) | `/` → reel | ? |
| 3 | WATCH-01 chrome-fade flow on real Vimeo provider (play → 600ms grace → fade; hover/pause restores; idle-3s re-fades) | `/watch/264677021` | ? |
| 4 | HERO-03 sound-on autoplay after PLAY REEL click (sticky activation persists across SPA nav) | `/` → `/watch/264677021` | ? |
| 5 | WATCH-05 back-nav round-trip restores exact reel position (`#video=<id>` at viewport top; 300ms debounce caveat) | `/work` ⇄ `/watch/[id]` | ? |
| 6 | WATCH-05 cross-route arrival from `/watch` → ContinueReelRail heading → `/work/[cat]` restores | `/watch/[id]` → `/work/[cat]` | ? |
| 7 | axe WCAG AA spot-check on staging (`/`, `/work`, `/watch/[id]`, `/work/[category]`) — confirms the automated green on the live staging URL | sampled | ? |

---

## § 21-cell responsive sweep (D-08)

**Gate: all 21 cells pass OR every punch-list item resolved.** 7 routes × 3 breakpoints.

**Methodology (D-08):** Chrome DevTools mobile emulation is the PRIMARY pass (real-Android
is NOT required — DevTools emulation is the Android contract); the real-iPhone pass from
the BrowserStack / thermal sessions above is the iOS spot-check. Single audit pass →
numbered punch list → fix all OR explicitly accept.

### Per-cell check categories

- **F** — Functional bug (404, broken nav, missing image, content not rendered)
- **S** — Horizontal scroll (page overflows viewport width)
- **T** — Type legibility (line-clamp, no overflow, readable measure)
- **I** — Image quality (blur-up timing, aspect-ratio held, no pop-in, crisp thumbs)
- **X** — Tap targets ≥ 44px (mobile only — iOS accessibility floor)
- **C** — CLS during load (no layout shift on poster / iframe / image render)

| # | Route | Breakpoint | F | S | T | I | X | C | Status | Punch-list refs |
|---|-------|------------|---|---|---|---|---|---|--------|-----------------|
| 1 | `/` | Mobile ≤640 (393×852) | ? | ? | ? | ? | ? | ? | pending | — |
| 2 | `/` | Tablet ~768 (768×1024) | ? | ? | ? | ? | n/a | ? | pending | — |
| 3 | `/` | Desktop ≥1280 (1440×900) | ? | ? | ? | ? | n/a | ? | pending | — |
| 4 | `/work` | Mobile ≤640 | ? | ? | ? | ? | ? | ? | pending | — |
| 5 | `/work` | Tablet ~768 | ? | ? | ? | ? | n/a | ? | pending | — |
| 6 | `/work` | Desktop ≥1280 | ? | ? | ? | ? | n/a | ? | pending | — |
| 7 | `/work/pbs-american-portrait/` | Mobile ≤640 | ? | ? | ? | ? | ? | ? | pending | — |
| 8 | `/work/pbs-american-portrait/` | Tablet ~768 | ? | ? | ? | ? | n/a | ? | pending | — |
| 9 | `/work/pbs-american-portrait/` | Desktop ≥1280 | ? | ? | ? | ? | n/a | ? | pending | — |
| 10 | `/watch/264677021` | Mobile ≤640 | ? | ? | ? | ? | ? | ? | pending | — |
| 11 | `/watch/264677021` | Tablet ~768 | ? | ? | ? | ? | n/a | ? | pending | — |
| 12 | `/watch/264677021` | Desktop ≥1280 | ? | ? | ? | ? | n/a | ? | pending | — |
| 13 | `/pbs-american-portrait/` | Mobile ≤640 | ? | ? | ? | ? | ? | ? | pending | — |
| 14 | `/pbs-american-portrait/` | Tablet ~768 | ? | ? | ? | ? | n/a | ? | pending | — |
| 15 | `/pbs-american-portrait/` | Desktop ≥1280 | ? | ? | ? | ? | n/a | ? | pending | — |
| 16 | `/press` | Mobile ≤640 | ? | ? | ? | ? | ? | ? | pending | — |
| 17 | `/press` | Tablet ~768 | ? | ? | ? | ? | n/a | ? | pending | — |
| 18 | `/press` | Desktop ≥1280 | ? | ? | ? | ? | n/a | ? | pending | — |
| 19 | `/about` + `/contact` | Mobile ≤640 | ? | ? | ? | ? | ? | ? | pending | — |
| 20 | `/about` + `/contact` | Tablet ~768 | ? | ? | ? | ? | n/a | ? | pending | — |
| 21 | `/about` + `/contact` | Desktop ≥1280 | ? | ? | ? | ? | n/a | ? | pending | — |

**Cell legend:** `?` pending • `✓` pass • `✗` fail (creates punch-list entry) • `n/a` not applicable

### Real-iOS spot-check (the iOS half of D-08 — reuse the BrowserStack iPhone sessions)

| # | Route | iOS Safari result | Issues |
|---|-------|-------------------|--------|
| iOS-1 | `/` | ? | — |
| iOS-2 | `/work` | ? | — |
| iOS-3 | `/watch/264677021` | ? | — |
| iOS-4 | `/pbs-american-portrait/` | ? | — |

### Punch List

_Numbered list of every visible imperfection from the single audit pass (D-08). Each entry:
file:line OR component, problem description, fix plan._

_(empty — fill during the sweep)_

### Fix Log

_Per-item resolution: fixed (commit hash) OR explicitly accepted as ship-with deviation (rationale)._

_(empty — fill as punch-list items resolve)_

---

## § Pre-cutover checklist (go / no-go)

**Every row must be GREEN before the user fires the cutover (executes the Launch Runbook).**
These are the blocking rows; do NOT flip DNS until all are checked.

- [ ] **BrowserStack 28-cell matrix all green (D-06)** — no P3 ❌ (REEL-06 SC#4 non-negotiable); no iOS 16/17.0/17.1 P1 ❌ (Pitfall 1).
- [ ] **iPhone thermal delta ≤ 8% in 5 min (D-06)** — after any Branch A / Branch B escalation, with the D-09 reversal recorded if Branch B fired.
- [ ] **7 surface UAT items pass (D-07)** — hero attach/play, hero unmount-to-poster, watch chrome-fade on real Vimeo, HERO-03 sound-on, WATCH-05 back-nav restore, cross-route rail restore, axe staging spot-check.
- [ ] **21-cell responsive sweep (D-08)** — all cells pass OR all punch-list items resolved.
- [ ] **CONT-02 — IMDb / LinkedIn personalized URLs swapped** in `src/lib/components/ContactBlock.svelte` (`IMDB_URL` + `LINKEDIN_URL` are currently the channel homepages `https://www.imdb.com/` + `https://www.linkedin.com/`) **OR explicitly accepted as channel-homepage at launch** (the `_four` branch — functional, no 404s, passes the domain-contains tests). Also update the Person JSON-LD `sameAs` array on `/about` if swapped.
- [ ] **OG wordmark font (07-02 limitation) — launch-blocker decision.** The 1200×630 `static/og-image.jpg` wordmark renders with a **system-serif fallback** (`Georgia, 'Times New Roman', serif`) when Source Serif 4 is NOT fontconfig-registered at SVG-render time (librsvg reads the host fontconfig, not the project woff2). The card is real cinematic-dark art and regenerable: register `static/fonts/source-serif-4-*.woff2` with fontconfig and re-run `node scripts/build-assets.mjs` to bake the exact face. **Decide:** accept the system-serif fallback at launch (graceful — serif wordmark intent preserved) OR regenerate with the registered face before cutover. Not a hard blocker; a deliberate decision row.
- [ ] **Lighthouse `/` LCP gate flipped warn→error (D-12 blocking pre-cutover posture).** Plan 07-03 measured median `/` LCP at **~2806ms vs the 2500ms budget — a 306ms MISS** (accepted warning-only this phase). Before cutover, flip the gate in `lighthouserc.json` (`["warn", …]` → `["error", …]`) + the `lighthouse` job in `deploy.yml` to BLOCKING, and clear the residual via a 07-03 lever if needed: (a) AVIF poster variant, (b) tune `createHeroDefer` timing, (c) re-measure on the faster production apex (BASE_PATH='' — no subpath), or (d) the `_four` branch (defer to post-launch real-user telemetry).
- [ ] **All 5 trap CI gates green (A / B / C / D / E)** — Trap A (videos.json drift-check), Trap B (OG 1200×630 + filesize parity), Trap C, Trap D (no raw localStorage outside `$lib/storage.ts`), Trap E (route-manifest IA diff vs `_four`).
- [ ] **A/B winner declared by the user (D-09)** — the HARD gate that unlocks the Launch Runbook. Until `_three` is declared the A/B winner, the cutover does not fire regardless of the rows above.

**Note on D-12 (winner-only atomic flip):** the `noindex`→`index` flip (delete the
`<meta name="robots" content="noindex, nofollow" />` line from `src/routes/+layout.svelte`
+ flip `static/robots.txt` `Disallow: /` → `Allow: /` + `Sitemap:`) is PREPARED as ONE
atomic commit in the Launch Runbook but is **NOT landed** in this phase. It is the LAST
commit before the DNS flip, fired by the user on cutover day only after the A/B winner is
declared. The site STILL emits `noindex` until then.

---

## Outcome

_Status `pending` — this gate is filled in DURING the human cutover-prep window, not now.
Plan 07-05 DELIVERS this go/no-go document; the user executes the QA runs against it and
flips each row. When every § checklist row is GREEN AND the user declares `_three` the A/B
winner (D-09), the Launch Runbook in `07-05-SUMMARY.md` is unlocked for cutover-day execution._
