---
phase: 06-pbs-press-about-contact
verified: 2026-05-27T23:10:00Z
status: gaps_found
score: 6/7 must-have truths verified (D-16 /press fade is the sole gap)
gaps:
  - truth: "TopNav fades on /press during scroll (D-16)"
    status: failed
    reason: >-
      Genuine wiring gap, not flaky. TopNav's $effect attaches the scroll-idle
      listener only to the /work reel container (`[role=region][aria-label="Filmography reel"]`).
      On /press that querySelector returns null because /press renders its own
      standalone scroll container labeled `aria-label="Press credits reel"` (it does
      NOT use ReelStage). TopNav then falls back to `initScrollIdle(window)`, but
      /press scrolls the inner `overflow-y-auto` container — not window — so the
      scroll event never fires, `scrollIdle.isScrolling` never flips true, and the
      chrome never gains `opacity-0 pointer-events-none`. The scrollIdle module's own
      doc comment (scrollIdle.svelte.ts:12-16) confirms the window fallback "produces
      zero scroll events during reel scroll — wrong target." /press IS correctly in
      REEL_ROUTE_IDS (the route-scope half of D-16 is wired); the scroll-TARGET half
      is not. The fade works on /work and /pbs-american-portrait/ because both render
      via ReelStage's "Filmography reel" container that the querySelector matches.
    artifacts:
      - path: src/lib/components/TopNav.svelte
        issue: >-
          Line 80-82 hardcodes `document.querySelector('[role="region"][aria-label="Filmography reel"]')`.
          This selector never matches /press's "Press credits reel" container, so the
          listener degrades to window (line 83) where no scroll events fire.
      - path: src/routes/press/+page.svelte
        issue: >-
          Line 34-35 scroll container uses `aria-label="Press credits reel"` (a bespoke
          container, NOT ReelStage). Nothing in the TopNav listener path knows about this label.
    missing:
      - >-
        Make TopNav's scroll-target resolution cover BOTH reel container labels
        (e.g., query a shared selector / data-attribute, or match both
        `[aria-label="Filmography reel"]` and `[aria-label="Press credits reel"]`),
        OR give /press the same container contract ReelStage emits so the existing
        querySelector matches.
      - >-
        After the fix, `tests/e2e/press.spec.ts` Test D ("TopNav fades during scroll
        on /press") must pass on chromium + webkit + firefox.
---

# Phase 6: PBS / Press / About / Contact Verification Report

**Phase Goal:** The four content surfaces (`/pbs-american-portrait/`, `/press`, `/about`, `/contact`) are cinematically restyled but content-identical to `_four` — the user-approved bio, verbatim PBS blockquote, 13-credit prestige order, and single-source-of-truth `<ContactBlock />` all come across without re-authoring.
**Verified:** 2026-05-27T23:10:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth (Success Criterion)                                                                                 | Status     | Evidence                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/pbs-american-portrait/` section zero verbatim blockquote over still + 18 scroll-snap sections; 15/18 `See on PBS →` badges (PBS-01/02) | ✓ VERIFIED | `pbs-american-portrait/+page.svelte:67-73` verbatim Candidate C blockquote; ReelStage `intro` slot (`+page.svelte:92-96`); badge via `ReelSection.svelte:155-162`; build emits `build/pbs-american-portrait/index.html` |
| 2   | TopNav PBS link active on both `/pbs-american-portrait/` AND `/work/pbs-american-portrait/` (PBS-03)       | ✓ VERIFIED | `TopNav.svelte:139-148` `isActive()` dual-route guard (verbatim `_four` copy, lines 143-146)                                                                            |
| 3   | `/press` 13 prestige-ordered fullscreen credit cards: poster bg + network wordmark + title + ▷ Watch CTA (PRES-01) | ✓ VERIFIED | `press/+page.svelte:33-89` 13-section `{#each}`, `_pressCredits.ts` PRESTIGE_ORDER, ▷ Watch → `/watch/${id}` (line 74); build emits `build/press/index.html`            |
| 4   | `/about` two-act: ambient HeroAmbient(wordmark=ABOUT) + verbatim bio + ContactBlock + reduced-motion still + Person JSON-LD (ABT-01) | ✓ VERIFIED | `about/+page.svelte:68` HeroAmbient ABOUT; bio verbatim (78-88); ContactBlock (91); Person JSON-LD (62) with sameAs byte-identical to ContactBlock literals             |
| 5   | `/contact` h-svh splash: poster bg + MICHELLE NGO wordmark + centered ContactBlock + scroll-cue + Footer below (CONT-01 home) | ✓ VERIFIED | `contact/+page.svelte:42` `h-svh`; wordmark (62); ContactBlock (69); scroll-cue (72-74); zero iframes; Footer via `+layout.svelte:73`                                    |
| 6   | Shared `<ContactBlock />` on `/contact` + `/about` + site-wide `<Footer />`; 5 channels with IMDb/LinkedIn fallbacks (CONT-01/02/03) | ✓ VERIFIED | Single `ContactBlock.svelte` (no props, 5 channels); imported by about, contact, Footer col 1 (`Footer.svelte:35,47`); Footer mounted site-wide (`+layout.svelte:73`)   |
| 7   | TopNav fades on `/press` during scroll (D-16)                                                              | ✗ FAILED   | TopNav listener targets `[aria-label="Filmography reel"]` only; /press uses `Press credits reel`; window fallback gets no scroll events. `press.spec.ts` Test D fails on all 3 browsers. |

**Score:** 6/7 truths verified

### Required Artifacts

| Artifact                                              | Expected                                                        | Status     | Details                                                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `src/lib/components/ContactBlock.svelte`              | 5 channels, no props, fallback URLs, D-08 inline-link style     | ✓ VERIFIED | 5 `<li>` rows in D-20 order; `mailto:mynogo@gmail.com`, `tel:+19175661976`, imdb/linkedin/vimeo  |
| `src/lib/components/Footer.svelte`                    | 3-col grid, ContactBlock col 1, 8 categories (PBS retarget), copyright | ✓ VERIFIED | `grid ... lg:grid-cols-3` (42); PBS retarget ternary (57-60); `© 2026 Michelle Ngo` (122)        |
| `src/routes/+layout.svelte`                           | Footer mounted below `</main>`                                  | ✓ VERIFIED | `import Footer` (31); `<Footer />` below `</main>` (73)                                           |
| `src/routes/+layout.ts`                               | `trailingSlash = 'always'`                                      | ✓ VERIFIED | Line 12                                                                                           |
| `svelte.config.js`                                    | handleHttpError allow-list cleared; strict prerender            | ✓ VERIFIED | No `/about` `/press` `/contact` `/posters/` `/watch/` entries; `strict: true` (13)               |
| `src/lib/components/TopNav.svelte`                    | `/press` in REEL_ROUTE_IDS                                      | ⚠️ PARTIAL | `/press` IS in the Set (65), but scroll-target wiring (80-82) does not reach /press — see Gap    |
| `src/lib/components/ReelStage.svelte`                 | `intro?: Snippet` slot + `getPbsCollectionUrl` hook             | ✓ VERIFIED | Props (71-76); intro section `snap-start h-svh` + `aria-labelledby` (295-300); forwarding (314)  |
| `src/lib/components/ReelSection.svelte`               | `pbsCollectionUrl?: string` → See on PBS badge                  | ✓ VERIFIED | Prop (52,57); badge `{#if pbsCollectionUrl}` `bg-white/5 backdrop-blur-sm ... mt-2` (155-162)    |
| `src/routes/pbs-american-portrait/+page.svelte`       | section zero intro + 18 videos + per-video badge hook           | ✓ VERIFIED | ReelStage with intro + getPbsCollectionUrl (92-96)                                                |
| `src/routes/press/+page.svelte`                       | 13 poster-only scroll-snap sections                             | ✓ VERIFIED | `Press credits reel` container (33-37); 13-section each (38-88); no iframes (poster only)         |
| `src/routes/about/+page.svelte`                       | two-act + bio + ContactBlock + Person JSON-LD                   | ✓ VERIFIED | Verified above (truth 4)                                                                          |
| `src/routes/contact/+page.svelte`                     | h-svh splash + wordmark + ContactBlock + scroll-cue             | ✓ VERIFIED | Verified above (truth 5)                                                                          |

### Key Link Verification

| From                            | To                            | Via                                        | Status     | Details                                                              |
| ------------------------------- | ----------------------------- | ------------------------------------------ | ---------- | -------------------------------------------------------------------- |
| `+layout.svelte`                | `Footer.svelte`               | import + render below `{@render children}` | ✓ WIRED    | `+layout.svelte:31,73`                                               |
| `Footer.svelte`                 | `ContactBlock.svelte`         | import in column 1                         | ✓ WIRED    | `Footer.svelte:35,47`                                                |
| `Footer.svelte`                 | `$lib/data` categories        | PBS retarget ternary                       | ✓ WIRED    | `Footer.svelte:57-60` `slug === 'pbs-american-portrait'`             |
| `about/+page.svelte`            | `HeroAmbient.svelte`          | `wordmark="ABOUT" tagline={undefined}`     | ✓ WIRED    | `about/+page.svelte:68`                                              |
| `about/+page.svelte`            | Person JSON-LD                | `<svelte:head>` ld+json                    | ✓ WIRED    | `about/+page.svelte:62`; sameAs literals match ContactBlock (D-21)   |
| `contact/+page.svelte`          | `getPosterFor`                | splash bg                                  | ✓ WIRED    | `contact/+page.svelte:26,31`                                         |
| `pbs/+page.svelte`              | `_pbsCollectionUrl.ts`        | `getPbsCollectionUrl` hook → ReelSection   | ✓ WIRED    | `pbs/+page.svelte:24,95` → `ReelSection.svelte:155-162`              |
| `press/+page.svelte`            | `_pressCredits.ts`            | `data.credits` 13 sections                 | ✓ WIRED    | `press/+page.svelte:38`                                              |
| `TopNav.svelte`                 | `/press` scroll fade (D-16)   | REEL_ROUTE_IDS + scroll-idle listener      | ✗ NOT_WIRED | Route-scope half wired (`TopNav.svelte:65`); scroll-target half broken (80-83) |

### Requirements Coverage

| Requirement | Source Plan(s) | Description                                                                  | Status        | Evidence                                                                 |
| ----------- | -------------- | ---------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| PBS-01      | 06-02          | `/pbs-american-portrait/` section zero blockquote + 18-section reel          | ✓ SATISFIED   | `pbs/+page.svelte`; build emits index.html; ReelStage intro slot         |
| PBS-02      | 06-02          | 15/18 `See on PBS →` badges (3 lack URL by design)                           | ✓ SATISFIED   | `_pbsCollectionUrl.ts` regex + 15/3 split test; `ReelSection.svelte` badge |
| PBS-03      | 06-02          | TopNav PBS active on both routes                                             | ✓ SATISFIED   | `TopNav.svelte:139-148` dual-route guard                                 |
| PRES-01     | 06-02          | `/press` 13 prestige-ordered credit cards                                    | ✓ SATISFIED   | `press/+page.svelte` + `_pressCredits.ts` PRESTIGE_ORDER                 |
| ABT-01      | 06-03          | `/about` verbatim bio + ambient reel + reduced-motion still + ContactBlock   | ? NEEDS HUMAN (runtime) / ✓ static | Bio + ContactBlock + JSON-LD verified statically; reduced-motion degradation needs e2e/human confirm |
| CONT-01     | 06-01, 06-03   | ContactBlock on /contact + /about + Footer (every route)                     | ✓ SATISFIED   | Single component, 3 call sites + site-wide Footer mount                  |
| CONT-02     | 06-01, 06-03   | IMDb/LinkedIn channel-homepage fallbacks                                     | ✓ SATISFIED   | `ContactBlock.svelte:41-43` fallback URLs; substring-contains tests      |
| CONT-03     | 06-01          | Site-wide Footer mirroring TopNav IA + 5 channels                            | ✓ SATISFIED   | `Footer.svelte` 3-col IA; mounted in `+layout.svelte`                    |

No orphaned requirements: all 8 phase-6 IDs are claimed by a plan and marked `[x] Complete` in REQUIREMENTS.md (lines 165-172). The CONT-* and PBS/PRES/ABT IDs map cleanly to the plans that addressed them. NOTE: REQUIREMENTS.md marks all 8 "Complete" — D-16 is a sub-decision of the phase, not a standalone requirement ID, so the failing fade does not directly contradict a checked requirement row, but it DOES fail Success Criterion as a phase truth.

### Anti-Patterns Found

| File                              | Line     | Pattern                                   | Severity   | Impact                                                                            |
| --------------------------------- | -------- | ----------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `src/lib/components/TopNav.svelte` | 80-83    | Hardcoded single-container querySelector with window fallback | 🛑 Blocker | D-16 fade silently no-ops on /press (window fallback receives no inner-scroll events) |
| `.lintstagedrc.cjs`               | 15       | `@typescript-eslint/no-require-imports`   | ℹ️ Info    | OUT OF SCOPE for Phase 6 (Phase 3 origin, in deferred-items.md) — NOT counted against phase 6 |

No stub/placeholder/TODO anti-patterns found in the phase-6 route or component files. All artifacts are substantive and wired; the single gap is a runtime wiring mismatch, not a stub.

### Automated Check Results

| Check        | Command       | Expected                                | Result                                                                  |
| ------------ | ------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| Type check   | `pnpm check`  | 0 errors                                | ✓ PASS — 639 files, 0 errors, 0 warnings, 0 files with problems         |
| Unit tests   | `pnpm test`   | ~440 passing                            | ✓ PASS — 39 test files, 440 tests passed                                |
| Build        | `pnpm build`  | strict prerender, 0 404s, 4 index.html  | ✓ PASS — built in 5.83s, `✔ done`; all 4 routes emit `index.html`       |
| e2e (press)  | `press.spec.ts` Test D | TopNav fades on /press scroll  | ✗ FAIL — header class never gains `opacity-0`/`pointer-events-none` on chromium + webkit + firefox (the D-16 gap; other 4 press tests + 6 pbs tests pass) |

Build emitted: `build/about/index.html`, `build/press/index.html`, `build/contact/index.html`, `build/pbs-american-portrait/index.html` (all 4 present, confirming strict `strict: true` prerender with zero unexpected 404s).

### Explicit Verdict: press.spec.ts Test D / D-16 question

**Verdict: GENUINE GAP — not flaky/environmental.**

The 06-03 executor's diagnosis in `deferred-items.md` is correct and confirmed by source reading:

1. `TopNav.svelte:80-82` attaches the scroll-idle listener via
   `document.querySelector('[role="region"][aria-label="Filmography reel"]')` — the
   `/work` (ReelStage) container label ONLY.
2. `/press/+page.svelte:34-35` renders its own scroll container labeled
   `aria-label="Press credits reel"` (a bespoke container — /press does NOT use
   ReelStage). The TopNav querySelector therefore returns `null` on /press.
3. `TopNav.svelte:83` then calls `initScrollIdle(reelContainer ?? window)` → falls back
   to `window`.
4. `/press`'s scroll happens on the inner `overflow-y-auto snap-y` container
   (`press/+page.svelte:36`), NOT on `window`. The `scrollIdle.svelte.ts:12-16` module
   doc explicitly warns the window fallback "produces zero scroll events during reel
   scroll — wrong target." So `scrollIdle.isScrolling` never flips true, and the
   `$derived chromeClass` (TopNav.svelte:127-136) never appends the fade class.

Net effect: the **route-scope half** of D-16 is wired (`/press` IS in
`REEL_ROUTE_IDS`, line 65), but the **scroll-target half** is broken — the fade
demonstrably never fires on /press. This is reproducible and deterministic (fails all 3
browsers, every run), not flaky. D-16 was claimed complete by plan 06-01 at the
REEL_ROUTE_IDS membership level; the runtime behavior on /press does not match the
claim.

Contrast: the fade DOES work on `/work`, `/work/[category]`, and
`/pbs-american-portrait/` because all three render through ReelStage, whose container
carries the `Filmography reel` label that the querySelector matches
(`ReelStage.svelte:283`). The gap is isolated to `/press`.

This gap is logged in `deferred-items.md` and was correctly deferred out of 06-03's
scope (06-03 touched only /about + /contact + HeroAmbient — none of TopNav, /press, or
the scroll-idle rune). It belongs to the 06-02 / Phase-4 chrome-fade domain.

### Human Verification Required

These are runtime/visual behaviors that static + unit verification cannot fully confirm
(all automated unit + build checks pass; these would be confirmed by the passing e2e
suite minus Test D, or by manual QA):

1. **ABT-01 reduced-motion degradation** — Test: open `/about/` with
   `prefers-reduced-motion: reduce` emulated. Expected: Act 1 shows a static
   producer-reel poster, no iframe attaches. Why human: reduced-motion media-query +
   iframe-mount short-circuit is runtime behavior (covered by `about.spec.ts` Test C —
   confirm it passes in the e2e run).

2. **PBS section-zero scroll-snap rhythm** — Test: scroll `/pbs-american-portrait/`.
   Expected: section zero snaps uniformly with sections 1-18; no hash write fires for
   the intro. Why human: scroll-snap feel + IntersectionObserver hash-write guard is a
   live-browser behavior.

3. **/contact Footer reveal on scroll** — Test: scroll past the `/contact` h-svh splash.
   Expected: site-wide Footer scrolls into view below. Why human: natural document
   scroll reveal is visual (covered by `contact.spec.ts` Test G).

### Gaps Summary

The phase is one gap short of full goal achievement. Five of the five ROADMAP Success
Criteria are met as written, and the sixth contact-channel criterion is fully met — but
the D-16 sub-decision ("TopNav fades on /press during scroll"), which is part of the
phase's chrome-parity contract and is explicitly asserted by `press.spec.ts` Test D,
does not actually fire on /press. The root cause is a scroll-target selector mismatch in
`TopNav.svelte` (queries only `Filmography reel`, never `Press credits reel`), causing a
silent degrade to a `window` listener that receives no scroll events from /press's inner
scroll container.

All other deliverables — the verbatim PBS blockquote, the 15/18 badges, the 13-credit
prestige order, the user-approved bio, the Person JSON-LD with byte-identical sameAs, and
the single-source-of-truth ContactBlock across /about + /contact + Footer — are present,
substantive, and wired. `pnpm check`, `pnpm test` (440 passing), and `pnpm build` (strict
prerender, all 4 routes emit index.html) all pass clean.

Recommended next step: a focused 06-02 repair (or Phase 7 polish) that broadens TopNav's
scroll-target resolution to cover both reel container labels, then re-runs
`press.spec.ts` Test D to confirm the fade fires on /press across all 3 browsers.

---

_Verified: 2026-05-27T23:10:00Z_
_Verifier: Claude (gsd-verifier)_
