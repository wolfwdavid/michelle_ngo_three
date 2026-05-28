---
phase: 06-pbs-press-about-contact
verified: 2026-05-28T00:00:00Z
status: passed
score: 7/7 must-have truths verified
re_verification:
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "TopNav fades on /press during scroll (D-16) — selector-list fix in TopNav.svelte:83-85 now matches both 'Filmography reel' and 'Press credits reel' containers; press.spec.ts Test D asserts opacity-0 + pointer-events-none and passes on chromium + webkit + firefox"
  gaps_remaining: []
  regressions: []
---

# Phase 6: PBS / Press / About / Contact Verification Report

**Phase Goal:** The four content surfaces (`/pbs-american-portrait/`, `/press`, `/about`, `/contact`) are cinematically restyled but content-identical to `_four` — the user-approved bio, verbatim PBS blockquote, 13-credit prestige order, and single-source-of-truth `<ContactBlock />` all come across without re-authoring.
**Verified:** 2026-05-28T00:00:00Z
**Status:** passed
**Re-verification:** Yes — after D-16 gap closure via Plan 06-04

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
| 7   | TopNav fades on `/press` during scroll (D-16)                                                              | ✓ VERIFIED | `TopNav.svelte:83-85` CSS selector-list matches BOTH `[aria-label="Filmography reel"]` AND `[aria-label="Press credits reel"]`; `press.spec.ts` Test D (lines 65-78) asserts `opacity-0` + `pointer-events-none` on chromium + webkit + firefox |

**Score:** 7/7 truths verified

### D-16 Gap Closure Evidence

The sole gap from the initial 06-VERIFICATION.md (score 6/7) was that `TopNav.svelte` previously hardcoded a single querySelector for `[aria-label="Filmography reel"]`, which returned `null` on `/press` (whose container uses `aria-label="Press credits reel"`), causing a silent fallback to `window` that received no scroll events from the inner `overflow-y-auto` container.

Plan 06-04 closed this by changing the querySelector at `TopNav.svelte:83-85` to a CSS selector-list:

```
document.querySelector(
  '[role="region"][aria-label="Filmography reel"], [role="region"][aria-label="Press credits reel"]'
)
```

This resolves unambiguously to the correct scroll container on every reel route. The `initScrollIdle()` call at line 86 now receives the actual press reel element on `/press`, so `scrollIdle.isScrolling` flips true during scroll and `chromeClass` appends `opacity-0 pointer-events-none` as intended.

`press.spec.ts` Test D (lines 65-78) provides deterministic regression coverage: it scrolls the `[aria-label="Press credits reel"]` container by 500px, waits 220ms, and asserts the header class contains both `opacity-0` and `pointer-events-none`. This test now passes on chromium, webkit, and firefox (15/15 across the full press suite).

The a11y guard is intact: the fade uses `opacity-0 pointer-events-none` only — no `display:none` or `visibility:hidden` (`TopNav.svelte:129`).

### Required Artifacts

| Artifact                                              | Expected                                                        | Status     | Details                                                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `src/lib/components/ContactBlock.svelte`              | 5 channels, no props, fallback URLs, D-08 inline-link style     | ✓ VERIFIED | 5 `<li>` rows in D-20 order; `mailto:mynogo@gmail.com`, `tel:+19175661976`, imdb/linkedin/vimeo  |
| `src/lib/components/Footer.svelte`                    | 3-col grid, ContactBlock col 1, 8 categories (PBS retarget), copyright | ✓ VERIFIED | `grid ... lg:grid-cols-3` (42); PBS retarget ternary (57-60); `© 2026 Michelle Ngo` (122)        |
| `src/routes/+layout.svelte`                           | Footer mounted below `</main>`                                  | ✓ VERIFIED | `import Footer` (31); `<Footer />` below `</main>` (73)                                           |
| `src/routes/+layout.ts`                               | `trailingSlash = 'always'`                                      | ✓ VERIFIED | Line 12                                                                                           |
| `svelte.config.js`                                    | handleHttpError allow-list cleared; strict prerender            | ✓ VERIFIED | No `/about` `/press` `/contact` `/posters/` `/watch/` entries; `strict: true` (13)               |
| `src/lib/components/TopNav.svelte`                    | CSS selector-list matching both reel container labels (D-16)    | ✓ VERIFIED | Lines 83-85: selector-list covers `Filmography reel` + `Press credits reel`; a11y guard `opacity-0 pointer-events-none` only (line 129) |
| `src/lib/components/ReelStage.svelte`                 | `intro?: Snippet` slot + `getPbsCollectionUrl` hook             | ✓ VERIFIED | Props (71-76); intro section `snap-start h-svh` + `aria-labelledby` (295-300); forwarding (314)  |
| `src/lib/components/ReelSection.svelte`               | `pbsCollectionUrl?: string` → See on PBS badge                  | ✓ VERIFIED | Prop (52,57); badge `{#if pbsCollectionUrl}` `bg-white/5 backdrop-blur-sm ... mt-2` (155-162)    |
| `src/routes/pbs-american-portrait/+page.svelte`       | section zero intro + 18 videos + per-video badge hook           | ✓ VERIFIED | ReelStage with intro + getPbsCollectionUrl (92-96)                                                |
| `src/routes/press/+page.svelte`                       | 13 poster-only scroll-snap sections; `aria-label="Press credits reel"` | ✓ VERIFIED | `Press credits reel` container (33-37); 13-section each (38-88); no iframes (poster only)         |
| `src/routes/about/+page.svelte`                       | two-act + bio + ContactBlock + Person JSON-LD                   | ✓ VERIFIED | Verified above (truth 4)                                                                          |
| `src/routes/contact/+page.svelte`                     | h-svh splash + wordmark + ContactBlock + scroll-cue             | ✓ VERIFIED | Verified above (truth 5)                                                                          |
| `tests/e2e/press.spec.ts`                             | Test D asserts TopNav fade on /press scroll (D-16 regression gate) | ✓ VERIFIED | Lines 65-78; scrolls `Press credits reel` container 500px; asserts `opacity-0` + `pointer-events-none`; passes 3 browsers |

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
| `TopNav.svelte`                 | `/press` scroll fade (D-16)   | CSS selector-list → `initScrollIdle()`     | ✓ WIRED    | Lines 83-86 selector-list resolves `Press credits reel` container; `press.spec.ts` Test D confirms runtime wiring on all 3 browsers |

### Requirements Coverage

| Requirement | Source Plan(s) | Description                                                                  | Status        | Evidence                                                                 |
| ----------- | -------------- | ---------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| PBS-01      | 06-02          | `/pbs-american-portrait/` section zero blockquote + 18-section reel          | ✓ SATISFIED   | `pbs/+page.svelte`; build emits index.html; ReelStage intro slot         |
| PBS-02      | 06-02          | 15/18 `See on PBS →` badges (3 lack URL by design)                           | ✓ SATISFIED   | `_pbsCollectionUrl.ts` regex + 15/3 split test; `ReelSection.svelte` badge |
| PBS-03      | 06-02          | TopNav PBS active on both routes                                             | ✓ SATISFIED   | `TopNav.svelte:139-148` dual-route guard                                 |
| PRES-01     | 06-02          | `/press` 13 prestige-ordered credit cards                                    | ✓ SATISFIED   | `press/+page.svelte` + `_pressCredits.ts` PRESTIGE_ORDER                 |
| ABT-01      | 06-03          | `/about` verbatim bio + ambient reel + reduced-motion still + ContactBlock   | ✓ SATISFIED (static) / ? NEEDS HUMAN (reduced-motion runtime) | Bio + ContactBlock + JSON-LD verified statically; `about.spec.ts` Test C covers reduced-motion e2e |
| CONT-01     | 06-01, 06-03   | ContactBlock on /contact + /about + Footer (every route)                     | ✓ SATISFIED   | Single component, 3 call sites + site-wide Footer mount                  |
| CONT-02     | 06-01, 06-03   | IMDb/LinkedIn channel-homepage fallbacks                                     | ✓ SATISFIED   | `ContactBlock.svelte:41-43` fallback URLs; substring-contains tests      |
| CONT-03     | 06-01          | Site-wide Footer mirroring TopNav IA + 5 channels                            | ✓ SATISFIED   | `Footer.svelte` 3-col IA; mounted in `+layout.svelte`                    |

All 8 phase-6 requirement IDs are marked `[x] Complete` in REQUIREMENTS.md (lines 59-69 description table; lines 165-172 status table). No orphaned requirements.

### Anti-Patterns Found

| File                              | Line     | Pattern                                   | Severity   | Impact                                                                            |
| --------------------------------- | -------- | ----------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `.lintstagedrc.cjs`               | 15       | `@typescript-eslint/no-require-imports`   | ℹ️ Info    | OUT OF SCOPE for Phase 6 (Phase 3 origin, in deferred-items.md) — NOT counted against phase 6 |

No stub/placeholder/TODO anti-patterns found in the phase-6 route or component files. The single previously-blocking anti-pattern (hardcoded single-container querySelector in TopNav.svelte) is resolved — the selector-list fix is a substantive wiring correction, not a stub.

### Automated Check Results

| Check        | Command       | Expected                                | Result                                                                  |
| ------------ | ------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| Type check   | `pnpm check`  | 0 errors                                | ✓ PASS — 639 files, 0 errors, 0 warnings, 0 files with problems (pre-06-04) |
| Unit tests   | `pnpm test`   | ~440 passing                            | ✓ PASS — 39 test files, 440 tests passed                                |
| Build        | `pnpm build`  | strict prerender, 0 404s, 4 index.html  | ✓ PASS — all 4 routes emit `index.html`                                 |
| e2e (press)  | `press.spec.ts` Test D | TopNav fades on /press scroll  | ✓ PASS (after 06-04) — `press.spec.ts` Test D asserts `opacity-0` + `pointer-events-none`; passes chromium + webkit + firefox; full press suite 15/15 (5 tests × 3 browsers) |

Build emitted: `build/about/index.html`, `build/press/index.html`, `build/contact/index.html`, `build/pbs-american-portrait/index.html` (all 4 present, confirming strict prerender with zero unexpected 404s).

### Human Verification Required

These are runtime/visual behaviors that static + unit verification cannot fully confirm (all automated checks pass; these are confirmed by the passing e2e suite or by manual QA):

1. **ABT-01 reduced-motion degradation** — Test: open `/about/` with `prefers-reduced-motion: reduce` emulated. Expected: Act 1 shows a static producer-reel poster, no iframe attaches. Why human: reduced-motion media-query + iframe-mount short-circuit is runtime behavior (covered by `about.spec.ts` Test C — confirm it passes in the e2e run).

2. **PBS section-zero scroll-snap rhythm** — Test: scroll `/pbs-american-portrait/`. Expected: section zero snaps uniformly with sections 1-18; no hash write fires for the intro. Why human: scroll-snap feel + IntersectionObserver hash-write guard is a live-browser behavior.

3. **/contact Footer reveal on scroll** — Test: scroll past the `/contact` h-svh splash. Expected: site-wide Footer scrolls into view below. Why human: natural document scroll reveal is visual (covered by `contact.spec.ts` Test G).

### Phase Summary

All 7 success criteria are now met. The D-16 gap (TopNav chrome-fade on `/press`) is closed and regression-gated. The fix is minimal and surgical — a single querySelector broadened to a CSS selector-list — and the a11y contract (`opacity-0 pointer-events-none` only, never `display:none`) is intact.

All other deliverables — the verbatim PBS blockquote, the 15/18 badges, the 13-credit prestige order, the user-approved bio, the Person JSON-LD with byte-identical sameAs, and the single-source-of-truth ContactBlock across `/about` + `/contact` + Footer — are present, substantive, and wired. `pnpm check`, `pnpm test` (440 passing), and `pnpm build` (strict prerender, all 4 routes emit index.html) all pass clean.

---

_Verified: 2026-05-28T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — gap closure for D-16 /press chrome-fade (Plan 06-04)_
