---
phase: 06-pbs-press-about-contact
plan: 01
subsystem: ui
tags: [svelte5, sveltekit, tailwind-v4, footer, contact, chrome, routing, trailing-slash]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Double-ring focus token, neutral-950 palette, font-sans Inter, --font-display Source Serif 4, adapter-static strict prerender"
  - phase: 02-data-layer
    provides: "$lib/data 11-name public surface (getCategoriesInDisplayOrder, categoryToSlug)"
  - phase: 04-wayfinding
    provides: "TopNav.svelte D-05/D-06 chrome-fade infrastructure, REEL_ROUTE_IDS Set, +layout.svelte <main> wrapper"
provides:
  - "ContactBlock.svelte — 5-channel shared component (Email/Phone/IMDb/LinkedIn/Vimeo) — single source of truth for /about, /contact, Footer col 1"
  - "Footer.svelte — site-wide 3-column cinematic footer (D-13/D-14/D-15) mounted in +layout.svelte"
  - "trailingSlash='always' in +layout.ts — resolves D-13 PBS retarget URL form contract"
  - "TopNav.svelte REEL_ROUTE_IDS extended with /press (D-16 chrome-fade scope)"
  - "svelte.config.js handleHttpError allow-list cleared — strict prerender posture restored"
affects: ["06-02-PLAN", "06-03-PLAN", "Phase 07 cutover"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A/B parity at chrome layer: Footer IA mirrors _four verbatim (3-column structure, channel literals, prestige order); only visual canvas differs"
    - "Verbatim port discipline for shared chrome — _four's content + structure copied byte-for-byte where contract requires (D-13/D-20)"
    - "Mocked $app/state + $app/paths in component tests (Phase 5 pattern) for components that consume base path"

key-files:
  created:
    - "src/lib/components/ContactBlock.svelte"
    - "src/lib/components/ContactBlock.test.ts"
    - "src/lib/components/Footer.svelte"
    - "src/lib/components/Footer.test.ts"
    - ".planning/phases/06-pbs-press-about-contact/deferred-items.md"
  modified:
    - "src/routes/+layout.svelte"
    - "src/routes/+layout.ts"
    - "src/lib/components/TopNav.svelte"
    - "svelte.config.js"
    - "eslint.config.js"

key-decisions:
  - "Adopted trailingSlash='always' at +layout.ts (resolves D-13 PBS retarget URL form across all routes; matches _four exactly)"
  - "Typography ramp consolidated to text-sm for column headers + bottom strip (UI-SPEC Dim 4 — 4 sizes total, no text-xs; diverges from _four's text-xs)"
  - "View All Work → link uses /work form (no trailing slash) — matches _four D-29 verbatim despite trailingSlash='always' contract; SvelteKit normalizes on click"
  - "Dropped svelte.config.js handleHttpError allow-list entirely (no empty `prerender: {}` block) — strict default posture"
  - "Footer.svelte added to eslint per-file override (svelte/no-navigation-without-resolve) — mirror of TopNav/FilterPillBar pattern for ${base}/... literals"

patterns-established:
  - "ContactBlock single-source-of-truth — editing one component propagates to /about + /contact + Footer column 1 automatically (CONT-01 satisfied by construction)"
  - "Verbatim _four structural port for chrome (Footer) with byte-identical IA + channel literals + copyright literal"

requirements-completed: [CONT-01, CONT-02, CONT-03]

# Metrics
duration: ~22min
completed: 2026-05-27
---

# Phase 6 Plan 06-01: Shared Chrome Summary

**Shared chrome shipped: 5-channel ContactBlock + 3-column site-wide Footer (mounted in +layout.svelte) + trailingSlash='always' + /press chrome-fade extension + strict-prerender posture restored.**

## Performance

- **Duration:** ~22 min
- **Tasks:** 3
- **Files modified:** 8 (4 created, 4 modified, 1 deferred-items log)
- **Tests added:** 25 (8 ContactBlock + 17 Footer)

## Accomplishments

- `<ContactBlock />` shipped verbatim from `_four`: 5 channel rows (Email → Phone → IMDb → LinkedIn → Vimeo) in D-20 order with mailto/tel hrefs, target=_blank rel=noopener on socials, Phase 3 D-08 inline-link style — single source of truth for `/about`, `/contact`, Footer col 1 (CONT-01).
- IMDb + LinkedIn ship as channel-homepage fallbacks per D-21 (CONT-02 unblocks Phase 7 cutover; URLs swap to personalized in single-line edit post-launch).
- `<Footer />` shipped as 3-column desktop / 1-column mobile grid mirroring `_four`'s IA verbatim: ContactBlock col 1, 8 categories col 2 (PBS retargeted to `/pbs-american-portrait/`), 4 site links col 3 (About / Press / Contact / View All Work →), literal `© 2026 Michelle Ngo · Built with SvelteKit` bottom strip (CONT-03 / D-13).
- Footer mounted site-wide below `{@render children()}` in `+layout.svelte` — appears on every prerendered route automatically.
- `trailingSlash = 'always'` adopted in `+layout.ts` — resolves D-13 PBS retarget URL form (`/pbs-american-portrait/`) and matches `_four` exactly.
- TopNav `REEL_ROUTE_IDS` Set extended with `/press` — chrome-fade scope now covers all 4 reel surfaces (`/work`, `/work/[category]`, `/pbs-american-portrait`, `/press`) per D-16.
- `svelte.config.js` `handleHttpError` allow-list dropped entirely — strict prerender posture restored as the end-state.
- 371/371 unit tests green; svelte-check 0 errors / 614 files; lint clean on all Plan 06-01 files.

## Task Commits

Each task was committed atomically (TDD per task = test → feat):

1. **Task 1 (TDD): ContactBlock test (RED)** — `adbc8ef` (test)
2. **Task 1 (TDD): ContactBlock implementation (GREEN)** — `4337415` (feat)
3. **Task 2 (TDD): Footer test (RED)** — `97328fd` (test)
4. **Task 2 (TDD): Footer + layout mount + trailingSlash + D-16 + svelte.config cleanup (GREEN)** — `a17c25d` (feat)

**Plan metadata:** (this SUMMARY commit forthcoming)

## Files Created/Modified

### Created
- `src/lib/components/ContactBlock.svelte` (87 lines) — 5-row vertical channel list, 3 URL constants, no props (D-20 single source of truth)
- `src/lib/components/ContactBlock.test.ts` (102 lines) — 4 describe blocks / 8 it cases; raw mount/unmount; substring assertions robust to D-21 URL swap
- `src/lib/components/Footer.svelte` (124 lines) — 3-column grid, PBS retarget ternary, 4 site links, copyright bottom strip; data-footer-col="contact|work|site" test hooks
- `src/lib/components/Footer.test.ts` (207 lines) — 9 describe blocks / 17 it cases; mocks $app/state + $app/paths
- `.planning/phases/06-pbs-press-about-contact/deferred-items.md` — log of out-of-scope `.lintstagedrc.cjs` lint error (pre-existing from Phase 3)

### Modified
- `src/routes/+layout.svelte` — imported Footer, rendered `<Footer />` below `</main>`, updated header comment from "Phase 6 will add" → past-tense "Phase 6 Plan 06-01 added"
- `src/routes/+layout.ts` — added `export const trailingSlash = 'always'` with research-cite comment
- `src/lib/components/TopNav.svelte` — added `'/press'` to REEL_ROUTE_IDS Set (line 65) per D-16
- `svelte.config.js` — removed handleHttpError allow-list block entirely; strict prerender restored
- `eslint.config.js` — added `src/lib/components/Footer.svelte` to svelte/no-navigation-without-resolve per-file override

## Decisions Made

1. **trailingSlash='always' adopted at layout level** — resolves the D-13 PBS retarget URL form contract (`/pbs-american-portrait/` with trailing slash). Adapter-static emits `build/<route>/index.html` under both 'always' and 'never'; difference is canonical URL form in redirects + `<link rel=canonical>`. Existing TopNav.svelte:140 endsWith() guard already normalizes via `.replace(/\/$/, '')` so active-state logic survives.
2. **Typography consolidated to text-sm** for Footer column headers + bottom strip — diverges from `_four`'s text-xs because `_three`'s UI-SPEC Dim 4 specifies a 4-size ramp (text-sm/base/lg/xl) without text-xs. Applied uniformly to all 3 column h3 elements + the bottom-strip div.
3. **View All Work → link uses /work form (no trailing slash)** — matches `_four` D-29 verbatim despite trailingSlash='always' contract on every other internal link. SvelteKit normalizes on click; both forms reach the same prerendered HTML. Kept the divergence to honor the explicit "match _four verbatim" instruction in the plan.
4. **handleHttpError allow-list dropped entirely** — SvelteKit treats absent === default strict, so removing the prerender block is cleaner than leaving an empty `prerender: {}` block. Stricter posture is the correct end-state; 06-02 + 06-03 will produce the 4 missing route HTML.
5. **Footer.svelte added to eslint per-file override** — config-level (eslint.config.js) rather than per-file inline `/* eslint-disable */` comment, matching the established pattern (TopNav, FilterPillBar, etc.). Linter auto-fix removed an initial inline directive as redundant once the config-level override landed; the component still ships with the override active.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Added Footer.svelte to eslint.config.js per-file override**
- **Found during:** Task 2 (Footer.svelte creation)
- **Issue:** `svelte/no-navigation-without-resolve` ESLint rule rejects `${base}/...` literal hrefs in Footer (8 category links + 4 site links). Plan said to add inline disable directive at top of file, but the established `_three` pattern (Phase 4) is config-level per-file overrides at eslint.config.js for the same reason.
- **Fix:** Added `'src/lib/components/Footer.svelte'` to the existing files array in the second per-file override block (alongside FilterPillBar, TopNav, MobileMenu, WatchPlayer, etc.).
- **Files modified:** `eslint.config.js`
- **Verification:** `npx eslint src/lib/components/Footer.svelte` exits 0; `pnpm test` 371/371 green; `pnpm check` 0 errors.
- **Committed in:** `a17c25d` (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor — followed established `_three` ESLint override pattern rather than the inline directive the plan suggested. Outcome is identical (rule disabled for Footer.svelte); pattern is consistent with the rest of the codebase.

## Issues Encountered

**Pre-existing lint error in `.lintstagedrc.cjs`** — `pnpm lint` surfaced `@typescript-eslint/no-require-imports` violation in `.lintstagedrc.cjs:15`. Traced to commit `4e2b372` (Phase 3 Plan 03-01); pre-existing on master before Plan 06-01 began. **Out of scope** per executor scope-boundary rule (Plan 06-01's contract is shared chrome; touching `.lintstagedrc.cjs` would expand scope). Logged to `.planning/phases/06-pbs-press-about-contact/deferred-items.md` for future maintenance. All Plan 06-01-modified files lint clean (verified via targeted `npx eslint <files>`).

**`pnpm build` fails with 4 explicit 404s (EXPECTED)** — `/about`, `/press`, `/contact`, `/pbs-american-portrait/`. This is the documented "master-broken expectation" per the plan's `<done>` note: 06-01 cleans handleHttpError to restore strict prerender; 06-02 + 06-03 ship the 4 missing routes within this same phase. No rollback needed — the strict posture is the correct end-state. 06-02 + 06-03 close the gap before phase-end.

## Verification Recap

| Check | Status | Notes |
|-------|--------|-------|
| `pnpm test` | ✅ 371/371 | Footer.test.ts 17 cases + ContactBlock.test.ts 8 cases; zero regressions in Phase 1-5 tests |
| `pnpm check` | ✅ 0 errors | 614 files / 0 warnings |
| `pnpm lint` (targeted, Plan 06-01 files) | ✅ clean | Pre-existing .lintstagedrc.cjs error tracked separately |
| `pnpm build` | ❌ EXPECTED FAIL | 4 explicit 404s for the 4 new routes (06-02 + 06-03 close this) |

## Acceptance Criteria Verification

All criteria from the plan's `<acceptance_criteria>` and `<success_criteria>`:

- [x] `src/lib/components/ContactBlock.svelte` contains all 6 channel literals (mailto:mynogo@gmail.com, tel:+19175661976, "(917) 566-1976", imdb.com, linkedin.com, vimeo.com)
- [x] `src/lib/components/ContactBlock.svelte` contains class string `text-white hover:underline underline-offset-2`
- [x] `src/lib/components/ContactBlock.svelte` has zero `export let` / `$props()` declarations (D-20)
- [x] `src/lib/components/ContactBlock.test.ts` imports `mount, unmount from 'svelte'` (raw, not @testing-library)
- [x] `src/lib/components/ContactBlock.test.ts` contains substring assertions `toContain('imdb.com')`, `toContain('linkedin.com')`, `toContain('vimeo.com')` (D-21 robust)
- [x] `src/lib/components/Footer.svelte` contains literal `border-t border-white/10 bg-neutral-950 py-12 md:py-16` (D-15)
- [x] `src/lib/components/Footer.svelte` contains literal `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12` (D-13)
- [x] `src/lib/components/Footer.svelte` contains literal `slug === 'pbs-american-portrait'` and `/pbs-american-portrait/` (D-13 PBS retarget)
- [x] `src/lib/components/Footer.svelte` contains literal `© 2026 Michelle Ngo · Built with SvelteKit`
- [x] `src/lib/components/Footer.svelte` contains `<ContactBlock />` (col 1 reuse)
- [x] `src/lib/components/Footer.svelte` contains `data-footer-col="contact|work|site"` data attrs
- [x] `src/lib/components/Footer.svelte` contains `View All Work →` (col 3 link 4 with arrow)
- [x] `src/lib/components/Footer.test.ts` has 9+ test cases (17 actual)
- [x] `src/routes/+layout.svelte` imports Footer + renders `<Footer />` after `</main>`
- [x] `src/routes/+layout.ts` contains `export const trailingSlash = 'always'`
- [x] `src/lib/components/TopNav.svelte` REEL_ROUTE_IDS contains `'/press'`
- [x] `svelte.config.js` handleHttpError block does NOT contain `/about`, `/press`, `/contact`, `/posters/`, `/watch/` (block removed entirely)
- [x] `/posters/` reference audit completed — 56 posters present in static/posters; deterministic paths all resolve (no allow-list needed)
- [x] `pnpm test src/lib/components/Footer.test.ts` exits 0
- [x] `pnpm test src/lib/components/ContactBlock.test.ts` exits 0
- [x] `pnpm check` exits 0

## Known Stubs

None. All shipped artifacts are complete per the plan's contract. The 4 route 404s (`/about`, `/press`, `/contact`, `/pbs-american-portrait/`) are NOT stubs — they are intentionally-unbuilt routes scheduled to ship in 06-02 + 06-03 within the same phase, with the strict-prerender posture preserved as the correct end-state.

## Next Phase Readiness

**06-02 + 06-03 unblocked.** All shared chrome dependencies are in place:
- `<ContactBlock />` ready to import into `/about` (06-02) and `/contact` (06-03) — single component, no props
- `<Footer />` already mounts site-wide via +layout.svelte — appears below every new route 06-02/06-03 ships
- `trailingSlash='always'` ensures every new route under 06-02/06-03 prerenders to `build/<route>/index.html` under the canonical URL form
- TopNav `/press` chrome-fade scope ready — 06-02's e2e `tests/e2e/press.spec.ts` can assert fade behavior on scroll
- Strict prerender posture restored — 06-02 + 06-03 routes must prerender cleanly (no allow-list crutch); validates the routing contract end-to-end

**Master-broken status:** `pnpm build` currently fails with 4 explicit 404s. This is the documented expectation. Wave 2 (06-02 + 06-03) MUST land in the same working session to close the gap before phase-end.

## Self-Check: PASSED

**Files verified:** All 11 claimed files exist on disk (4 created components + 4 modified config/layout files + 1 deferred-items log + 1 SUMMARY + 1 eslint.config.js)

**Commits verified:** All 4 claimed task commits present in git history:
- `adbc8ef` test(06-01): ContactBlock RED
- `4337415` feat(06-01): ContactBlock GREEN
- `97328fd` test(06-01): Footer RED
- `a17c25d` feat(06-01): Footer + layout + trailingSlash + TopNav + svelte.config GREEN

---
*Phase: 06-pbs-press-about-contact*
*Completed: 2026-05-27*
