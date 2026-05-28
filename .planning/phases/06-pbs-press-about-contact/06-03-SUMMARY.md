---
phase: 06-pbs-press-about-contact
plan: 03
subsystem: ui
tags: [svelte5, sveltekit, hero-ambient, about, contact, json-ld, scroll-snap, prerender, a11y]

# Dependency graph
requires:
  - phase: 05-hero-watch
    provides: "HeroAmbient.svelte (5-layer z-stack + createHeroDefer factory + REEL-04 unified fallback) reused on /about Act 1"
  - phase: 06-pbs-press-about-contact
    provides: "06-01 shared chrome — ContactBlock.svelte (single source of truth), Footer site-wide mount, trailingSlash='always', strict prerender posture"
provides:
  - "HeroAmbient extended with optional { wordmark?, tagline? } props — backward-compatible defaults preserve / invocation; /about passes wordmark='ABOUT' tagline={undefined}"
  - "/about/+page.svelte — two-act layout (Act 1 ambient ABOUT hero + Act 2 dark-canvas verbatim bio + ContactBlock) + inline Person JSON-LD"
  - "/contact/+page.svelte — h-svh poster-bg splash (STATIC, no iframe) + MICHELLE NGO wordmark + centered ContactBlock + scroll-cue; Footer reveals below"
  - "Person JSON-LD duplication-with-sync-warning pattern (sameAs byte-identical to ContactBlock literals)"
  - "tests/e2e/about.spec.ts + tests/e2e/contact.spec.ts — Playwright 3-browser + reduced-motion emulation + axe a11y + cross-surface ContactBlock count"
affects: ["Phase 07 cutover (POL-01 audits Person JSON-LD + per-page SEO; POL-04 real-device QA covers /about ambient hero)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Svelte 5 sentinel key-presence prop pattern: rest-props + `'key' in rest` $derived to distinguish 'prop absent' (use default) from 'prop={undefined}' (suppress) — resolves the Svelte default-on-undefined semantics conflict"
    - "Inline Person JSON-LD via {@html} string-split script tag in <svelte:head> (no user input → safe), sameAs duplicated from ContactBlock with sync-warning comment"
    - "Two-act content surface mirroring / (ambient HeroAmbient Act 1 + dark-canvas Act 2)"
    - "Decorative display wordmark + sr-only landmark h1 split for axe-clean heading semantics"

key-files:
  created:
    - "src/routes/about/+page.svelte"
    - "src/routes/about/page.test.ts"
    - "src/routes/contact/+page.svelte"
    - "src/routes/contact/page.test.ts"
    - "tests/e2e/about.spec.ts"
    - "tests/e2e/contact.spec.ts"
  modified:
    - "src/lib/components/HeroAmbient.svelte — added optional wordmark? + tagline? props (sentinel key-presence derivation) + UI-SPEC typography (h1 text-6xl single-size, CTA font-semibold)"
    - "src/lib/components/HeroAmbient.svelte.test.ts — 5 new tests (custom wordmark, undefined-tagline suppression, text-6xl ramp, font-semibold CTA, CTA href preserved)"
    - "eslint.config.js — added /contact/+page.svelte to svelte/no-navigation-without-resolve per-file override"
    - ".planning/phases/06-pbs-press-about-contact/deferred-items.md — logged out-of-scope press.spec.ts Test D failure"

key-decisions:
  - "HeroAmbient tagline suppression resolved via Svelte 5 sentinel key-presence ('tagline' in rest props) — Svelte applies a destructuring default whenever the value is undefined and cannot tell key-absent from tagline={undefined}; the sentinel keeps / showing 'Filmmaker & Producer' while /about's tagline={undefined} renders no tagline (Rule 1 bug fix vs the plan's literal default + suppression contract)"
  - "Bio embedded with STRAIGHT apostrophes (I'm, U2's) to match the user-approved _four-shipped source byte-for-byte — the plan's code-template comment claiming 'curly apostrophes' was incorrect; verified against _four/src/routes/about/+page.svelte and the approved checkpoint text"
  - "Person JSON-LD sameAs = [https://www.imdb.com/, https://www.linkedin.com/, https://vimeo.com/user2149742] — byte-identical to ContactBlock.svelte literals (D-21 single-source-of-truth duplication with sync-warning comment block)"
  - "/about needs NO eslint per-file override (no ${base}/... nav hrefs — only imports + inline JSON-LD {@html}); /contact DOES (the ${base}${getPosterFor(...)} poster src)"

patterns-established:
  - "Sentinel key-presence prop pattern for optional-with-default props that must also support explicit-undefined suppression in Svelte 5"
  - "Person JSON-LD inline-in-head with sameAs duplicated from ContactBlock + sync-warning (carries forward to Phase 7 POL-01 audit)"

requirements-completed: [ABT-01, CONT-01, CONT-02]

# Metrics
duration: ~21min
completed: 2026-05-28
---

# Phase 6 Plan 06-03: About + Contact Splash Surfaces Summary

**Shipped /about (two-act ambient ABOUT hero + verbatim user-approved bio + ContactBlock + inline Person JSON-LD) and /contact (static poster-bg splash + MICHELLE NGO wordmark + centered ContactBlock + scroll-cue revealing Footer), extending HeroAmbient with backward-compatible wordmark/tagline props. Phase 6 now closes with zero prerender 404s.**

## Performance

- **Duration:** ~21 min
- **Started:** 2026-05-28T02:29:53Z
- **Completed:** 2026-05-28T02:51Z
- **Tasks:** 6 (Task 1 checkpoint resolved by user before this continuation; Tasks 2-6 executed)
- **Files modified:** 8 (6 created, 2 modified component/config + 1 deferred-items log)
- **Tests added:** 23 unit/route (5 HeroAmbient + 9 about + 9 contact) + 10 e2e (×3 browsers = 30 runs)

## Accomplishments

- **Task 1 (checkpoint):** Bio approved VERBATIM by user. The approved text (the _four-shipped, already-approved-on-sibling bio) is the source of truth embedded byte-for-byte on /about Act 2.
- **HeroAmbient extension (Task 2):** Added optional `{ wordmark?: string; tagline?: string | undefined }` props. Defaults (`'MICHELLE NGO'` + `'Filmmaker & Producer'`) preserve the `/` invocation byte-identically; `/about` passes `wordmark="ABOUT" tagline={undefined}` for a clean Act 1. Typography aligned to UI-SPEC consolidated ramp (h1 single `text-6xl`, no `md:text-7xl`; CTA `font-semibold`). All 21 HeroAmbient tests green (16 regression + 5 new).
- **/about (Task 3):** Two-act layout (D-09) — Act 1 ambient HeroAmbient ABOUT hero, Act 2 dark canvas (`bg-neutral-950`) with sr-only landmark `<h1>About Michelle Ngo</h1>` + verbatim approved bio in `max-w-2xl` + `<ContactBlock />` at `mt-12` (D-10). Inline Person JSON-LD in `<svelte:head>` with `sameAs` byte-identical to ContactBlock channel literals (D-21). 9 route tests green.
- **/contact (Task 4):** `h-svh` poster-bg splash (D-11/D-12) — STATIC producer-reel poster (NO iframe) + two-stop gradient + MICHELLE NGO display wordmark + sr-only landmark `<h1>Contact Michelle Ngo</h1>` + centered `<ContactBlock />` + `↓` scroll-cue. Footer scrolls into view below via the 06-01 site-wide mount. 9 route tests green.
- **e2e (Task 5):** `about.spec.ts` (5 tests) + `contact.spec.ts` (5 tests) across chromium + webkit + firefox — 30/30 passing. Covers Act 1 wordmark + scroll-cue, Act 2 bio + ContactBlock, reduced-motion poster-only (zero iframe — REEL-04 codepath verified end-to-end), Person JSON-LD parse + sameAs domains, Footer reveal (CONT-03), cross-surface ContactBlock count (/contact=2, /about=2, /work=1 — CONT-01), CONT-02 fallback-domain hrefs, and axe WCAG AA scans (zero violations on both surfaces).
- **Full-suite verification (Task 6):** `pnpm test` 440/440, `pnpm check` 0 errors / 639 files, `pnpm build` strict prerender succeeds with ZERO 404s — all 4 Phase 6 routes (`/about/`, `/contact/`, `/pbs-american-portrait/`, `/press/`) emit `index.html`. Phase 6 closes the prerender gap that 06-01 deliberately opened.

## Task Commits

Each task committed atomically with NORMAL `git commit` (pre-commit hooks ran on each):

1. **Task 2: HeroAmbient wordmark + tagline props** — `59b1e37` (feat) — test + impl together (extension to existing component)
2. **Task 3: /about two-act layout + bio + Person JSON-LD** — `1e05214` (feat)
3. **Task 4: /contact poster-bg splash** — `925b74f` (feat) — + eslint.config.js override
4. **Task 5: /about + /contact e2e specs** — `3fbadcb` (test)

**Plan metadata:** (this SUMMARY commit forthcoming — includes deferred-items.md update + STATE.md + ROADMAP.md + REQUIREMENTS.md)

## Files Created/Modified

### Created
- `src/routes/about/+page.svelte` (94 lines) — two-act ABOUT layout + verbatim bio + Person JSON-LD
- `src/routes/about/page.test.ts` (9 tests) — Act 1 wordmark, no tagline, sr-only h1, verbatim bio, 5 channel links, mt-12 wrapper, title, JSON-LD parse, sameAs domains
- `src/routes/contact/+page.svelte` (78 lines) — h-svh splash, static poster, wordmark, centered ContactBlock, scroll-cue
- `src/routes/contact/page.test.ts` (9 tests) — title, poster src, sr-only h1, wordmark, 5 channel links, scroll-cue, gradient, h-svh, zero iframes
- `tests/e2e/about.spec.ts` (5 tests) — Act 1/2, reduced-motion, JSON-LD, axe
- `tests/e2e/contact.spec.ts` (5 tests) — splash, Footer reveal, cross-surface count, CONT-02, axe

### Modified
- `src/lib/components/HeroAmbient.svelte` — optional `wordmark?`/`tagline?` props (sentinel key-presence derivation) + UI-SPEC typography (h1 `text-6xl`, CTA `font-semibold`)
- `src/lib/components/HeroAmbient.svelte.test.ts` — 5 new tests
- `eslint.config.js` — `/contact/+page.svelte` added to per-file override
- `.planning/phases/06-pbs-press-about-contact/deferred-items.md` — logged the out-of-scope press.spec.ts Test D failure

## Decisions Made

1. **HeroAmbient tagline suppression via Svelte 5 sentinel key-presence.** Svelte applies a destructuring default whenever the resolved prop value is `undefined`, so it cannot distinguish "key absent" (the `/` no-props invocation) from "`tagline={undefined}`" (the `/about` invocation) — both would have shown the default. Captured the rest props and used `$derived('tagline' in rest)` so an absent key falls back to `'Filmmaker & Producer'` while an explicit `tagline={undefined}` suppresses the tagline `<p>`. This honors BOTH the plan's grep-able default-value acceptance criterion AND the `tagline={undefined}` suppression behavior. (See Deviations — Rule 1.)
2. **Bio embedded with STRAIGHT apostrophes.** The plan's Task 3 code-template comment claimed "curly apostrophes are intentional," but the authoritative sources — the `<approved>` checkpoint text AND `_four`'s shipped, already-user-approved bio — both use straight apostrophes (`I'm`, `U2's`). Verified against `_four/src/routes/about/+page.svelte` byte-for-byte. Used straight apostrophes to keep the bio truly verbatim.
3. **Person JSON-LD `sameAs` byte-identical to ContactBlock literals** (`https://www.imdb.com/`, `https://www.linkedin.com/`, `https://vimeo.com/user2149742`) with a sync-warning comment block (D-21). Carries forward to Phase 7 POL-01.
4. **/about needs no eslint override; /contact does.** `/about` has no `${base}/...` navigation hrefs (only component imports + inline JSON-LD), so it stays clean; `/contact` builds `${base}${getPosterFor(...)}` so it joins the established per-file override.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] HeroAmbient tagline default vs explicit-undefined suppression**
- **Found during:** Task 2 (HeroAmbient extension — GREEN run)
- **Issue:** The plan specified a destructuring default `tagline = 'Filmmaker & Producer'` AND that `<HeroAmbient wordmark="ABOUT" tagline={undefined} />` must render no tagline. Under Svelte 5 semantics these conflict: a destructuring default resolves whenever the value is `undefined`, so `tagline={undefined}` still triggered the default and the tagline rendered (test failed).
- **Fix:** Switched to a sentinel key-presence pattern — `let { wordmark = 'MICHELLE NGO', ...rest } = $props()` + `const tagline = $derived('tagline' in rest ? rest.tagline : 'Filmmaker & Producer')`. Absent key → default; explicit `tagline={undefined}` → suppressed.
- **Files modified:** `src/lib/components/HeroAmbient.svelte`
- **Verification:** All 21 HeroAmbient tests green (including the "omit tagline renders 0 paragraphs" test); `/about` e2e "Act 1 has no Filmmaker & Producer tagline" passes on 3 browsers; `pnpm check` 0 errors.
- **Committed in:** `59b1e37` (Task 2 commit)

**2. [Rule 3 — Blocking] Added /contact/+page.svelte to eslint per-file override**
- **Found during:** Task 4 (/contact creation)
- **Issue:** `/contact` builds a `${base}${getPosterFor(...)}` literal img src — `svelte/no-navigation-without-resolve` flags it (same as /press, Footer, etc.).
- **Fix:** Added `'src/routes/contact/+page.svelte'` to the config-level per-file override block (established `_three` pattern — not an inline directive).
- **Files modified:** `eslint.config.js`
- **Verification:** `npx eslint src/routes/contact/+page.svelte eslint.config.js` exits 0.
- **Committed in:** `925b74f` (Task 4 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking).
**Impact on plan:** Minimal. The Rule 1 fix is required for correctness (the plan's literal contract was internally inconsistent with Svelte semantics; the sentinel preserves both stated behaviors). The Rule 3 fix follows the established codebase ESLint pattern. No scope creep.

## Issues Encountered

**`pnpm lint` — pre-existing `.lintstagedrc.cjs:15` error (OUT OF SCOPE).** `@typescript-eslint/no-require-imports`, traced to Phase 3 Plan 03-01 (`4e2b372`). Already documented in 06-01 + 06-02 SUMMARYs and `deferred-items.md`. All 06-03-modified files lint clean (verified via targeted `npx eslint`). Not a regression from this plan.

**`tests/e2e/press.spec.ts` Test D — TopNav fade does not trigger on /press scroll (OUT OF SCOPE).** The full e2e run surfaced 3 failures (chromium + webkit + firefox) in 06-02's press chrome-fade regression test: after scrolling the /press reel 500px, the TopNav never gains `opacity-0`/`pointer-events-none`. Verified via `git diff 925b74f~3..HEAD` that NONE of the four 06-03 commits touch `TopNav.svelte`, `src/routes/press/*`, the scroll-idle rune, or the D-16 fade scope — so this is NOT caused by 06-03's changes. It is a 06-02 deliverable whose e2e was explicitly DEFERRED to "after both waves complete" (06-02-SUMMARY) and is running for the first time now. Likely cause: the TopNav scroll-idle listener attaches to the /work reel container (`aria-label="Filmography reel"`) but not /press's (`aria-label="Press credits reel"`), or the runtime fade-scope predicate doesn't include the `/press` route id. Logged to `deferred-items.md` with full diagnosis + recommended 06-02/Phase-7 repair. All 30 /about + /contact e2e tests (this plan's deliverable) pass on all 3 browsers.

## Verification Recap

| Check | Status | Notes |
|-------|--------|-------|
| `pnpm test` | PASS 440/440 | +23 vs 06-02's 417 (5 HeroAmbient + 9 about + 9 contact) |
| `pnpm check` | PASS 0 errors | 639 files / 0 warnings |
| `pnpm lint` | PRE-EXISTING FAIL | Only `.lintstagedrc.cjs:15` (Phase 3 origin, out of scope, deferred). All 06-03 files clean. |
| `pnpm build` | PASS, ZERO 404s | All 4 Phase 6 routes emit index.html; strict prerender posture honored end-to-end |
| `pnpm test:e2e` (about + contact) | PASS 30/30 | chromium + webkit + firefox; reduced-motion + JSON-LD + cross-surface + axe |
| `pnpm test:e2e` (regression: hero + pbs) | PASS | hero.spec.ts + pbs-landing.spec.ts green (HeroAmbient typography change non-breaking) |
| `pnpm test:e2e` (press Test D) | OUT-OF-SCOPE FAIL | 06-02 chrome-fade timing; not caused by 06-03; deferred |

## Open Question Resolution

- **RESEARCH Open Question 3 (HeroAmbient wordmark parameterization):** Resolved → 2 optional props (`wordmark?` + `tagline?`) with defaults matching current values, plus a sentinel key-presence derivation so `tagline={undefined}` suppresses the tagline. Backward-compatible with `/`.
- **Bio approval (D-19 / checkpoint):** User approved the seed bio VERBATIM (the _four-shipped, already-approved text). No edits. Embedded byte-for-byte with straight apostrophes between BEGIN/END approved-bio markers.

## Phase 6 Completion

All 8 Phase 6 requirement IDs CLOSED:
- 06-01: CONT-01 (partial), CONT-02, CONT-03 (Footer)
- 06-02: PBS-01, PBS-02, PBS-03, PRES-01
- 06-03: **ABT-01, CONT-01 (full — ContactBlock now on /about + /contact + Footer), CONT-02 (verified end-to-end)**

Site is fully reachable via strict prerender: 7 routes + 8 work/[category] + 56 watch/[id] + 4 new content routes, ZERO 404s. Ready for Phase 7 (Polish & Cutover — POL-01 SEO audit, POL-02 LCP gate, POL-04 cutover infra).

## Known Stubs

None. All shipped artifacts are complete per the plan's contract. IMDb + LinkedIn channel-homepage fallbacks (D-21) are an intentional, documented v1.0 launch state (not a stub) — tracked as a pre-cutover swap in HUMAN-UAT / CONT-02; substring-contains assertions survive the future personalized-URL swap.

## Self-Check: PASSED

**Files verified (existence on disk):**
- src/routes/about/+page.svelte: FOUND
- src/routes/about/page.test.ts: FOUND
- src/routes/contact/+page.svelte: FOUND
- src/routes/contact/page.test.ts: FOUND
- tests/e2e/about.spec.ts: FOUND
- tests/e2e/contact.spec.ts: FOUND
- src/lib/components/HeroAmbient.svelte (modified): FOUND

**Commits verified (all 4 in git log):**
- `59b1e37` feat(06-03): extend HeroAmbient with optional wordmark + tagline props
- `1e05214` feat(06-03): ship /about two-act layout with verbatim bio + Person JSON-LD
- `925b74f` feat(06-03): ship /contact poster-bg splash with centered ContactBlock
- `3fbadcb` test(06-03): add /about + /contact Playwright e2e

---
*Phase: 06-pbs-press-about-contact*
*Completed: 2026-05-28*
