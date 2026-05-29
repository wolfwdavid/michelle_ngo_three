---
phase: 07-polish-cutover
verified: 2026-05-29T00:00:00Z
status: human_needed
score: 6/6 success criteria verified (automated); 1 criterion intentionally deferred to UAT
requirements:
  FOUND-03: satisfied
  POL-01: satisfied
  POL-02: satisfied (warning-only posture — correct for current A/B phase)
  POL-03: satisfied
  POL-04: partial — axe-core CI half satisfied; real-device QA matrix intentionally deferred to UAT
  POL-05: satisfied
human_verification:
  - test: "BrowserStack 28-cell reel matrix (7 OS x 4 pillars): iOS Safari 16/17.0/17.1/17.2+, Chrome Android, Firefox desktop, Safari macOS"
    expected: "All 28 cells GREEN (P1 fast-flick, P2 windowed-mount, P3 leak-defense, P4 axe WCAG AA)"
    why_human: "Real-device Playwright cannot exercise Vimeo postMessage on BrowserStack; IntersectionObserver real-device behavior differs from headless emulation; P3 memory leak only detectable via DevTools snapshot on real hardware"
  - test: "iPhone 5-min thermal test: scroll /work continuously 5 min, measure battery delta"
    expected: "Battery delta <= 8% in 5 min (no thermal escalation required)"
    why_human: "Battery/thermal behavior is real-hardware-only; not measurable in any automated environment"
  - test: "7 Phase 5 surface UAT items (07-QA-MATRIX.md § 7 Phase 5 surface UAT items)"
    expected: "Hero iframe attach/play, hero unmount-to-poster, watch chrome-fade on real Vimeo, HERO-03 sound-on, WATCH-05 back-nav restore, cross-route rail restore, axe staging spot-check all pass"
    why_human: "Real Vimeo postMessage playback events, sound-on activation, and hash-restore scroll position require real-device/real-network conditions"
  - test: "21-cell responsive sweep (7 routes x 3 breakpoints) in Chrome DevTools + real-iOS spot-check from BrowserStack session"
    expected: "All cells pass or every punch-list item resolved and accepted"
    why_human: "Visual layout correctness at all breakpoints requires human review; DevTools emulation is the primary pass per D-08"
  - test: "Pre-cutover checklist rows: Lighthouse warn->error flip + LCP remediation; CONT-02 IMDb/LinkedIn URL decision; OG wordmark font decision"
    expected: "All blocking checklist rows in 07-QA-MATRIX.md flipped to GREEN before DNS flip"
    why_human: "Lighthouse blocking posture change requires a cutover-day decision; CONT-02 and OG font are explicit user decisions, not code-verifiable"
  - test: "A/B winner declaration: user declares _three the winner and executes the 9-step Launch Runbook"
    expected: "DNS points to GH Pages, michellengo.net serves the SvelteKit site, HTTPS enforced, noindex flipped atomically"
    why_human: "The A/B winner decision is a human judgment; the DNS flip and cutover are irreversible user actions"
---

# Phase 7: Polish & Cutover — Verification Report

**Phase Goal:** The site is production-ready and A/B-eligible. Per-page SEO + JSON-LD + sitemap + Lighthouse CI + axe-core CI all gate; real-device QA matrix signs off; the 5 A/B integrity traps (videos.json drift, OG asymmetry, sitemap canonical, shared localStorage, divergent entry routes) are all mitigated explicitly; production cutover infrastructure (static/CNAME, deploy-production.yml, atomic noindex flip, 9-step Launch Runbook) is ready to fire IF AND ONLY IF _three wins the A/B vs _four.

**Verified:** 2026-05-29
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every route has per-page `<title>` + meta description; OG/Twitter cards work; Person JSON-LD on /about; VideoObject JSON-LD on every /watch/[id]; build-time sitemap.xml enumerates 70 URLs (POL-01) | VERIFIED | See artifact + wiring checks below |
| 2 | Lighthouse CI gates / LCP < 2.5s at WARNING posture (initial CI posture = warning-only; pre-cutover = blocking); measured LCP ~2806ms is a 306ms miss accepted under warning posture (POL-02) | VERIFIED | `lighthouserc.json` uses `["warn",...]` assertions; lhci never exits non-zero; 07-LIGHTHOUSE.json records median 2806ms; warn->error flip documented in 07-QA-MATRIX.md |
| 3 | Poster->iframe swap zero measurable CLS; 100svh (not vh/dvh) on every scroll-snap section (POL-03) | VERIFIED | grep confirms `h-svh`/`100svh` in ReelStage, HeroAmbient, press, contact, pbs routes; zero `100vh`/`100dvh`/`h-dvh` in snap heights; measured CLS 0.0054 << 0.1 |
| 4 | axe-core CI catches WCAG AA on every PR (automated half); real-device QA matrix deferred to UAT (POL-04) | VERIFIED (automated half) | `tests/e2e/axe.spec.ts`: 8 paths × 3 browsers = 24 assertions, all green; device-QA intentionally tracked in 07-QA-MATRIX.md as pending |
| 5 | All localStorage keys namespaced `mnp_three_*` (Trap D); OG image dimensions 1200x630 byte-parity to _four's (Trap B) (POL-05) | VERIFIED | `STORAGE_PREFIX = 'mnp_three_'` in `$lib/storage.ts`; D-17 grep gate in deploy.yml enforces no raw localStorage outside helper; `static/og-image.jpg` = 23443 bytes at exactly 1200x630; meta-tag and binary dimension gates wired in CI |
| 6 | Production cutover infra (static/CNAME=michellengo.net, deploy-production.yml workflow_dispatch-only, atomic noindex flip prepared-not-landed, 9-step Launch Runbook) committed and ready; cutover fires only after A/B winner declared; reversible (FOUND-03) | VERIFIED | All four invariants confirmed in code: noindex still present (layout.svelte:52), deploy-production.yml `on: workflow_dispatch:` only (line 11), CNAME=`michellengo.net`, no DNS fired |

**Score:** 6/6 success criteria verified (all automated/code-verifiable work passes; POL-04 real-device sign-off intentionally deferred to UAT)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/routes/sitemap.xml/+server.ts` | Prerendered 70-URL sitemap endpoint | VERIFIED | `export const prerender = true`; imports `videos`, `getCategoriesInDisplayOrder`, `categoryToSlug`; 6+8+56=70 URLs hardcoded to `https://michellengo.net` |
| `scripts/test-prerender-coverage.mjs` | Build-count gate (70 URLs + required static assets) | VERIFIED | Present; contains `sitemapUrlCount`; wired as `test:prerender` in package.json; wired in deploy.yml CI step |
| `src/routes/+layout.svelte` | Sitewide favicon + OG/Twitter head block + noindex preserved | VERIFIED | Contains `og:image:width`, `og:image:height`, `twitter:card`, 6 favicon links, `import { base }`, `noindex` meta at line 52 |
| `static/og-image.jpg` | 1200x630 cinematic-dark OG image (Trap B) | VERIFIED | 23443 bytes, confirmed 1200x630 by JPEG SOF probe; within 3x filesize band of _four's 15386 bytes (ratio 1.52) |
| `static/favicon.ico` + `favicon-{16,32,192,512}.png` + `apple-touch-icon.png` | 6-file favicon set | VERIFIED | All 7 files present in `static/` |
| `static/.nojekyll` | GH Pages Jekyll guard | VERIFIED | Present (prevents Jekyll from stripping `_app/` immutable assets) |
| `static/CNAME` | `michellengo.net` | VERIFIED | Exact content: `michellengo.net` + trailing newline |
| `.github/workflows/deploy-production.yml` | Manual-dispatch apex deploy (workflow_dispatch only) | VERIFIED | `on: workflow_dispatch:` is the sole trigger; BASE_PATH=''; Verify-CNAME guard; shared `concurrency.group: pages` |
| `lighthouserc.json` | Warning-posture Lighthouse CI config | VERIFIED | `["warn", { "maxNumericValue": 2500 }]` for LCP; mobile Slow-4G; no desktop preset |
| `src/lib/data/.four-route-manifest` | Pinned _four route-shape snapshot (Trap E baseline) | VERIFIED | 8 normalized `<shape>\t<count>` lines; pinned at SHA `07667658ee2fd16a3d56b66bbe832d08fc3badd5` |
| `.planning/phases/07-polish-cutover/07-QA-MATRIX.md` | Consolidated go/no-go cutover gate | VERIFIED | Present; all 4 matrix sections (BrowserStack, thermal, surface UAT, responsive sweep) populated with pending cells; pre-cutover checklist accurate |
| `tests/e2e/axe.spec.ts` | 8-route parametrized axe WCAG-AA matrix | VERIFIED | 8 ROUTES × 3 browsers = 24 assertions; `withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'])` |
| `.planning/phases/07-polish-cutover/07-LIGHTHOUSE.json` | Real Lighthouse measurement (before + after) | VERIFIED | 3 before-runs + 3 after-runs recorded; median LCP 2806ms; CLS 0.0054; perf 0.95 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `sitemap.xml/+server.ts` | `$lib/data` | `import { videos, getCategoriesInDisplayOrder, categoryToSlug }` | WIRED | Line 21 of +server.ts |
| `+layout.svelte` | `$app/paths` | `import { base }` | WIRED | Line 26 of +layout.svelte; used in favicon hrefs |
| `deploy.yml` build job | `scripts/test-prerender-coverage.mjs` | `node scripts/test-prerender-coverage.mjs` post-build step | WIRED | Line 99 of deploy.yml |
| `deploy.yml` drift-check job | `__four/` pinned-SHA checkout | Trap A cmp + Trap B SOF probe | WIRED | Checkout at line 200; byte-compare at line 216; Trap B probe at line 257 |
| `deploy.yml` lighthouse job | `lighthouserc.json` | `npx @lhci/cli@0.15.1 autorun` | WIRED | Line 327; lhci reads lighthouserc.json automatically |
| `deploy.yml` D-17 grep gate | `$lib/storage.ts` | grep exclusion of `storage.ts` | WIRED | Lines 47-61; gate enforces `mnp_three_` namespace |
| `deploy-production.yml` build | `static/CNAME` | `CNAME` copied by adapter-static into `build/`; verified by "Verify CNAME in build artifact" step | WIRED | Lines 54-57 |
| `/about/+page.svelte` | Person JSON-LD | `@type: 'Person'` in `<svelte:head>` | WIRED | Grep confirms at routes/about/+page.svelte:46 |
| `/watch/[id]/+page.svelte` | VideoObject JSON-LD | `@type: 'VideoObject'` in `<svelte:head>` | WIRED | Grep confirms at routes/watch/[id]/+page.svelte:63 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FOUND-03 | 07-05 | Production cutover infra ready; fires only if _three wins A/B | SATISFIED | `static/CNAME`=`michellengo.net`; deploy-production.yml workflow_dispatch-only; noindex still in +layout.svelte:52; robots.txt `Disallow: /`; 9-step Launch Runbook in 07-05-SUMMARY.md; no cutover fired |
| POL-01 | 07-01 | Per-page `<title>` + meta description; OG/Twitter; Person/VideoObject JSON-LD; 70-URL sitemap | SATISFIED | sitemap endpoint 70 URLs; all 8 route files have `<meta name="description">`; +layout.svelte has OG/Twitter block; Person JSON-LD on /about; VideoObject JSON-LD on /watch/[id] |
| POL-02 | 07-03, 07-04 | Lighthouse CI gates / LCP < 2.5s; warning-only initial posture; blocking pre-cutover | SATISFIED (initial posture) | `lighthouserc.json` `["warn",...]` assertions; lhci job wired in deploy.yml; measured median LCP 2806ms (306ms miss accepted under warning posture); warn->error flip documented as pre-cutover step in 07-QA-MATRIX.md |
| POL-03 | 07-03 | Zero CLS on poster->iframe swap; 100svh (not vh/dvh) on snap sections | SATISFIED | Grep: `h-svh`/`100svh` in ReelStage.svelte:281,297,306; HeroAmbient.svelte:143; press, contact, pbs routes; zero `100vh`/`100dvh` in snap heights; measured CLS 0.0054 |
| POL-04 | 07-03, 07-04, 07-05 | axe-core CI WCAG AA on every PR (done); manual real-device QA matrix sign-off (deferred to UAT) | PARTIAL (by design) | `axe.spec.ts` 8-route 24-assertion matrix wired in deploy.yml e2e step; real-device QA matrix rows in 07-QA-MATRIX.md all marked `?` (pending); REQUIREMENTS.md marks POL-04 as "PARTIAL — device-QA sign-off deferred to UAT" |
| POL-05 | 07-02, 07-04 | `mnp_three_*` localStorage namespace (Trap D); OG 1200x630 parity with _four (Trap B) | SATISFIED | `STORAGE_PREFIX = 'mnp_three_'`; D-17 grep gate enforces namespace in deploy.yml; og-image.jpg = 23443B at exactly 1200x630; Trap B dimension+ratio CI gate in drift-check job |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/build-assets.mjs` | — | `NEUTRAL_500` unused variable (pre-existing, noted in deferred-items.md) | Info | Pre-existing lint warning; does not affect build or runtime; logged in deferred-items.md and not introduced by Phase 7 |
| `.lintstagedrc.cjs` | 15 | `@typescript-eslint/no-require-imports` on `require('path')` (pre-existing, noted in deferred-items.md) | Info | Pre-existing; file unmodified since Phase 3; lint-staged hook only runs on staged files so commits are unaffected |

No blockers or warnings introduced by Phase 7. Both items are pre-existing, scoped out, and tracked.

---

### Cutover Safety Invariants (Critical — Verify as PASS Conditions)

All four hard invariants confirmed in code:

| Invariant | Check | Result |
|-----------|-------|--------|
| noindex still in place (D-12 flip NOT landed) | `grep -c noindex src/routes/+layout.svelte` | **1** (line 52: `<meta name="robots" content="noindex, nofollow" />`) |
| `static/robots.txt` still `Disallow: /` | `cat static/robots.txt` | `User-agent: *\nDisallow: /` — D-12 flip NOT landed |
| `deploy-production.yml` `on:` is `workflow_dispatch:` only | grep `^on:` then inspect children | Line 10: `on:`, line 11: `workflow_dispatch:` — NO `push:` or `pull_request:` trigger |
| `static/CNAME` = `michellengo.net` | `cat static/CNAME` | `michellengo.net` (+ trailing newline) — exact match |

---

### Human Verification Required

These items represent the intentionally human-gated portion of Phase 7. All automated/code-verifiable work passes. These items MUST be completed before the DNS cutover fires; the verification verdict is `human_needed` not `gaps_found` because all code deliverables are confirmed present and correct.

#### 1. BrowserStack 28-cell Reel Matrix (D-06 — blocks cutover)

**Test:** Run 07-QA-MATRIX.md § BrowserStack matrix against `https://wolfwdavid.github.io/michelle_ngo_three/work` on 7 real OS/browser combinations.
**Expected:** All 28 cells GREEN (P1 fast-flick, P2 windowed-mount, P3 leak-defense, P4 axe). Any P3 failure is non-negotiable; iOS 16/17.0/17.1 P1 failure triggers thermal escalation branches A or B.
**Why human:** Vimeo postMessage playback events, IntersectionObserver real-device behavior, and iframe memory leak detection require real hardware and DevTools snapshots.

#### 2. iPhone 5-min Thermal Test (D-06 — blocks cutover)

**Test:** Navigate to `/work` on a real iPhone and scroll continuously for 5 min; measure battery delta before/after.
**Expected:** Battery delta <= 8% in 5 min.
**Why human:** Battery/thermal measurement is real-hardware-only; not measurable in any automated CI environment.

#### 3. 7 Phase 5 Surface UAT Items (D-07 — blocks cutover)

**Test:** Run the 7 items in 07-QA-MATRIX.md § 7 Phase 5 surface UAT items during iOS BrowserStack sessions.
**Expected:** Hero attach/play, hero unmount-to-poster, watch chrome-fade on real Vimeo, HERO-03 sound-on, WATCH-05 back-nav restore, cross-route rail restore, axe staging spot-check all pass.
**Why human:** Real Vimeo postMessage events and sound-on autoplay activation after user gesture cannot be tested headlessly; hash-restore scroll fidelity requires visual inspection.

#### 4. 21-cell Responsive Sweep (D-08 — blocks cutover)

**Test:** Chrome DevTools mobile emulation sweep of all 7 routes at 3 breakpoints (mobile/tablet/desktop), plus real-iOS spot-checks from BrowserStack sessions.
**Expected:** All 21 cells pass or every punch-list item resolved.
**Why human:** Visual layout correctness requires human review; automated snapshot tests are out of scope for this phase.

#### 5. Pre-cutover Checklist Blocking Rows (blocks cutover)

**Test:** Review and resolve all open rows in 07-QA-MATRIX.md § Pre-cutover checklist before firing the Launch Runbook.
**Expected:** All rows GREEN:
- Lighthouse warn->error flip in `lighthouserc.json` + LCP budget cleared (or a lever applied per the documented options in 07-QA-MATRIX.md and 07-LIGHTHOUSE.json)
- CONT-02 IMDb/LinkedIn personalized-URL decision (swap or explicit accept)
- OG wordmark font decision (accept system-serif fallback or regenerate after fontconfig registration)
- All 5 trap CI gates green on the final pre-cutover commit
**Why human:** The warn->error flip requires a cutover-day gate decision; CONT-02 and OG font are explicit user decisions.

#### 6. A/B Winner Declaration + Launch Runbook Execution (D-09 — hard gate)

**Test:** Declare `_three` the A/B winner, then execute the 9-step Launch Runbook in `07-05-SUMMARY.md`.
**Expected:** DNS points to GH Pages; `michellengo.net` serves the SvelteKit site over HTTPS; noindex removed atomically in Step 6; sitemap discoverable; rollback confirmed feasible via Step 9 verification.
**Why human:** A/B winner declaration is a human judgment; the DNS swap and noindex flip are irreversible user actions that must be explicitly authorized.

---

### Gaps Summary

No gaps (gaps_found status was not assigned). All six success criteria have been verified against the actual codebase:

1. **POL-01 (SEO/sitemap/JSON-LD):** Fully wired. 70-URL sitemap endpoint prerendered, all routes have titles and descriptions, Person/VideoObject JSON-LD present, OG/Twitter head block sitewide.
2. **POL-02 (Lighthouse CI, warning posture):** Correctly implemented at warning posture. Measured LCP of 2806ms is a 306ms miss against the 2500ms budget, which is explicitly accepted under the warning-only initial posture. The CI gate surfaces the number without failing builds. The warn->error flip + LCP remediation are documented pre-cutover items.
3. **POL-03 (CLS + svh):** All scroll-snap sections use `h-svh`/`100svh`; no `100vh`/`100dvh` in snap heights; measured CLS 0.0054 is well within the 0.1 budget.
4. **POL-04 (axe CI done; real-device QA deferred):** The automated axe-core CI half (8 routes, 24 assertions, 3 browsers) is complete and wired. The real-device QA matrix is intentionally deferred — this is the correct project posture for the A/B phase.
5. **POL-05 (localStorage namespace + OG parity):** `mnp_three_` namespace enforced by code + CI gate. OG image at exactly 1200x630, 23443 bytes, within Trap B filesize band.
6. **FOUND-03 (cutover infra):** All four cutover-safety invariants hold. Infrastructure is staged and reversible; no cutover has fired.

The only outstanding work is intentionally human-gated: real-device QA, A/B winner declaration, and cutover execution. These are the correct Phase 7 terminal deliverables — the phase delivers READINESS, not live cutover.

---

_Verified: 2026-05-29_
_Verifier: Claude (gsd-verifier)_
