---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [tailwind-v4, oklch, source-serif-4, jetbrains-mono, inter, woff2, localStorage, focus-visible, ssr-safe, vitest, jsdom, svelte5]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Plan 01-01 scaffold (vite.config.ts with jsdom env, empty src/app.css with @import tailwindcss, stub +page.svelte, src/lib/.gitkeep, .gitignore allowing .env.example)"
provides:
  - "@theme token surface: --font-display, --font-mono, --font-sans, --ring-focus, --ring-focus-inner, --ring-focus-offset, 8-stop neutrals ramp (50-950), 8 OKLCH category accents (--color-cat-{pbs,promos,branded,docshort,reel,personal,edunon,other})"
  - "Self-hosted woff2 fonts in static/fonts/ (Source Serif 4 400/600/700, JetBrains Mono 400, Inter 400/500/600) — Latin subset, font-display: swap, zero cross-origin handshakes"
  - "Global :focus-visible double-ring rule (outline + box-shadow) inherited by every focusable element"
  - "$lib/storage typed helper with mnp_three_ auto-prefix, SSR-safe no-op, JSON-parse try/catch, foreign-key-preserving clear()"
  - "PUBLIC_SITE_URL env documented in committed .env.example (staging value active, production cutover line commented)"
  - "D-01 wordmark splash on / with Source Serif 4 + dark canvas + verbatim 'Filmmaker. Site coming soon.' tagline"
affects: [phase 01-03 (consumes app.css for axe contrast scan + uses storage namespace for grep CI gate), phase 03 (CategoryTag consumes --color-cat-* accents), phase 04 (NAV-02 keyboard nav consumes global focus-visible), phase 05 (HeroAmbient consumes --font-display + bg-neutral-950), phase 06 (/about + /press consume --font-display + neutrals ramp), phase 07 (POL-01 SEO consumes PUBLIC_SITE_URL)]

# Tech tracking
tech-stack:
  added: [Source Serif 4 (SIL OFL), JetBrains Mono (Apache 2.0), Inter (SIL OFL) — self-hosted Latin-subset woff2]
  patterns: ["@theme CSS-first tokens (Tailwind v4)", "OKLCH color space for all palette tokens", "global :focus-visible (no per-component opt-in)", "namespaced localStorage via typed helper (Trap D mitigation)", "exported __isBrowser predicate for stable SSR test simulation via vi.stubGlobal"]

key-files:
  created:
    - "src/lib/storage.ts (typed mnp_three_ localStorage helper)"
    - "src/lib/storage.test.ts (9 tests covering D-14/D-15/D-16)"
    - "static/fonts/source-serif-4-latin-{400,600,700}.woff2"
    - "static/fonts/jetbrains-mono-latin-400.woff2"
    - "static/fonts/inter-latin-{400,500,600}.woff2"
    - ".env.example (PUBLIC_SITE_URL documented)"
  modified:
    - "src/app.css (added @font-face × 7, @theme tokens, :focus-visible rule)"
    - "src/routes/+page.svelte (replaced Plan 01-01 stub with D-01 splash)"

key-decisions:
  - "Cream ring landed at oklch(0.98 0.02 80); inner ring at oklch(0.16 0 0) matching --color-neutral-950 for visual rhyme (D-06 target met; CONTEXT Claude-discretion bullet resolved)"
  - "Neutrals ramp landed as 8 OKLCH stops: 50/100/300/500/700/800/900/950 = 0.98/0.94/0.82/0.62/0.40/0.30/0.22/0.16 (zero chroma, zero hue — pure greys)"
  - "PUBLIC_SITE_URL strategy: committed .env.example (not gitignored .env) — SvelteKit reads PUBLIC_* from process.env at build time, so Phase 01-03 GH Actions workflow sets it in env: block; .env.example serves as documentation + local-dev fallback"
  - "Storage SSR-safety pattern: exported __isBrowser predicate + vi.stubGlobal('window', undefined) — explicitly rejected the ?ssr-test import-query module-cache trick (unstable across vitest run vs bundler)"
  - "Storage clear() iterates window.localStorage and only removes keys with mnp_three_ prefix (Trap D: sibling _four app on same wolfwdavid.github.io origin must be preserved; verified by Test 6 seeding mnp_four_b and asserting survival)"
  - "Double-ring focus implemented as outline (outer cream 2px) + box-shadow (inner dark 4px total = 2px + offset) — chosen over Tailwind ring utilities because :focus-visible needs zero per-component opt-in and outline auto-elevates above any child z-stack"
  - "Wordmark sized text-5xl/md:text-7xl with tracking-[0.2em] and font-semibold (weight 600 — uses source-serif-4-latin-600.woff2); Phase 5 HeroAmbient replaces"

patterns-established:
  - "Pattern: All design tokens live in src/app.css @theme block. Tailwind v4 synthesizes utilities from CSS vars — no tailwind.config.js exists or will exist."
  - "Pattern: All localStorage access goes through $lib/storage.ts. Phase 01-03 will add a CI grep gate (D-17) that fails the build if any file outside this helper imports localStorage. The grep `grep -r 'mnp_three_' src/routes/ src/app.css` returning zero matches today is the structural proof the convention is mechanical, not aspirational."
  - "Pattern: Use min-h-svh for full-viewport sections (NOT min-h-screen or min-h-dvh). iOS Safari address-bar collapse breaks 100vh layouts and resizes 100dvh constantly; svh is the only scroll-snap-compatible viewport unit per CLAUDE.md What-NOT-to-Use."
  - "Pattern: SSR-test predicates are exported from the module under test (e.g., __isBrowser). Tests call vi.stubGlobal + vi.unstubAllGlobals in afterEach. Avoid Vite module-cache tricks (query-string suffixes) — they're not stable across runners."

requirements-completed: [FOUND-01]

# Metrics
duration: 7min
completed: 2026-05-25
---

# Phase 01 Plan 02: Day-One Design Tokens, Storage Helper, Splash Summary

**Locked Tailwind v4 @theme token surface (fonts, focus, neutrals, 8 OKLCH category accents), self-hosted woff2 trio (Source Serif 4 / JetBrains Mono / Inter, Latin-subset 7 files, font-display: swap), typed mnp_three_-prefixed localStorage helper with SSR-safe no-ops and 9 passing tests, global :focus-visible double-ring rule, PUBLIC_SITE_URL env in .env.example, and the D-01 MICHELLE NGO wordmark splash — all before any feature code lands.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-25T14:49:19Z
- **Completed:** 2026-05-25T14:56:06Z
- **Tasks:** 3
- **Files modified:** 11 (2 created in src/lib, 7 fonts, 1 .env.example, app.css and +page.svelte rewritten)

## Accomplishments

- **Typed `$lib/storage.ts` helper** with `mnp_three_` auto-prefix, SSR-safe no-ops (via exported `__isBrowser` predicate), JSON-parse try/catch returning `null` on corrupt values, and a `clear()` that preserves foreign-namespace keys (Trap D mitigation — sibling `_four` on the shared `wolfwdavid.github.io` origin survives intact). 9 unit tests passing under jsdom + Vitest 4.1.5.
- **7 self-hosted woff2 fonts** staged under `static/fonts/` (Source Serif 4 400/600/700, JetBrains Mono 400, Inter 400/500/600), Latin subset, 20–25 KB each, `wOF2` magic verified, copied to `build/fonts/` on `pnpm build` and referenced from the immutable CSS bundle.
- **`src/app.css` rewritten end-to-end:** 7 `@font-face` declarations with `font-display: swap`, `@theme` block defining all locked tokens (fonts, focus, neutrals, 8 OKLCH category accents copied verbatim from `_four`), global `:focus-visible` rule producing a double-ring (outer cream `oklch(0.98 0.02 80)` + inner dark `oklch(0.16 0 0)`) inherited by every interactive element, plus a `:focus:not(:focus-visible)` mouse-suppression rule.
- **D-01 splash live on `/`** — centered `MICHELLE NGO` wordmark in Source Serif 4 (weight 600, tracking 0.2em, text-5xl/md:text-7xl) over `bg-neutral-950`, tagline `"Filmmaker. Site coming soon."` matches `_four` D-09/D-10 verbatim. Prerendered by `adapter-static`; both strings appear in `build/index.html`.
- **`.env.example` committed** with `PUBLIC_SITE_URL=https://wolfwdavid.github.io/michelle_ngo_three` active and the `michellengo.net` production-cutover value commented for Phase 7 — satisfies Phase 1 ROADMAP SC #3 grep verifiability for the env piece.

## Task Commits

Each task was committed atomically (Wave 2 parallel agent; `--no-verify` per orchestrator instruction to avoid pre-commit hook contention with 01-03):

1. **Task 1 RED: failing tests for storage helper** — `83ba837` (test)
2. **Task 1 GREEN: implement typed mnp_three_ storage helper** — `e6a5dcc` (feat)
3. **Task 2: lock day-one design tokens, self-host fonts, global focus-visible** — `f9a6d40` (feat)
4. **Task 3: add D-01 wordmark splash + PUBLIC_SITE_URL env** — `163ef08` (feat)

**Plan metadata:** _captured in the final docs commit at orchestrator wrap_

_Note: Task 1 followed TDD; Tasks 2 and 3 did not require RED/GREEN split (no behavior contract beyond "exist with these tokens / strings")._

## Font File Inventory

| Font | Weight | Bytes | Path |
|------|--------|-------|------|
| Source Serif 4 | 400 | 20,088 | `static/fonts/source-serif-4-latin-400.woff2` |
| Source Serif 4 | 600 | 21,532 | `static/fonts/source-serif-4-latin-600.woff2` |
| Source Serif 4 | 700 | 21,716 | `static/fonts/source-serif-4-latin-700.woff2` |
| JetBrains Mono | 400 | 21,168 | `static/fonts/jetbrains-mono-latin-400.woff2` |
| Inter | 400 | 23,664 | `static/fonts/inter-latin-400.woff2` |
| Inter | 500 | 24,272 | `static/fonts/inter-latin-500.woff2` |
| Inter | 600 | 24,452 | `static/fonts/inter-latin-600.woff2` |

**Total font payload:** 156,892 B (~153 KB) across all 7 files. Comfortably below any reasonable budget and well within the spirit of D-13 (subsetted, swap-loaded). Source: Fontsource CDN (pre-subsetted Latin builds).

## Token Surface Landed

| Token | Value | Decision |
|-------|-------|----------|
| `--font-display` | `'Source Serif 4', ui-serif, Georgia, serif` | D-09 |
| `--font-mono` | `'JetBrains Mono', ui-monospace, ...` | D-10 |
| `--font-sans` | `'Inter', ui-sans-serif, system-ui, ...` | D-11 |
| `--ring-focus` | `oklch(0.98 0.02 80)` | D-06 (cream/warm-white, target met) |
| `--ring-focus-inner` | `oklch(0.16 0 0)` | Claude-discretion (matches neutral-950 — visual rhyme) |
| `--ring-focus-offset` | `2px` | D-07 |
| `--color-neutral-50` | `oklch(0.98 0 0)` | Claude-discretion ramp |
| `--color-neutral-100` | `oklch(0.94 0 0)` | Claude-discretion ramp |
| `--color-neutral-300` | `oklch(0.82 0 0)` | Claude-discretion ramp |
| `--color-neutral-500` | `oklch(0.62 0 0)` | Claude-discretion ramp |
| `--color-neutral-700` | `oklch(0.40 0 0)` | Claude-discretion ramp |
| `--color-neutral-800` | `oklch(0.30 0 0)` | Claude-discretion ramp |
| `--color-neutral-900` | `oklch(0.22 0 0)` | Claude-discretion ramp |
| `--color-neutral-950` | `oklch(0.16 0 0)` | **D-02 canonical dark canvas** |
| `--color-cat-pbs` | `oklch(0.72 0.21 25)` | D-12 verbatim from `_four` |
| `--color-cat-promos` | `oklch(0.78 0.18 60)` | D-12 verbatim from `_four` |
| `--color-cat-branded` | `oklch(0.72 0.18 180)` | D-12 verbatim from `_four` |
| `--color-cat-docshort` | `oklch(0.78 0.18 130)` | D-12 verbatim from `_four` |
| `--color-cat-reel` | `oklch(0.78 0.18 280)` | D-12 verbatim from `_four` |
| `--color-cat-personal` | `oklch(0.78 0.18 330)` | D-12 verbatim from `_four` |
| `--color-cat-edunon` | `oklch(0.78 0.18 90)` | D-12 verbatim from `_four` |
| `--color-cat-other` | `oklch(0.78 0.05 250)` | D-12 verbatim from `_four` |

## Storage Helper Test Coverage

9 tests in `src/lib/storage.test.ts` — all passing:

| # | Test | Decision Covered |
|---|------|------------------|
| 1 | `STORAGE_PREFIX is the locked mnp_three_ string` | D-14 namespace literal |
| 2 | `set() auto-prefixes the key with mnp_three_` | D-14 — write path |
| 3 | `get() round-trips a set value with type inference` | D-15 — typed API + JSON round-trip |
| 4 | `get() returns null for an unset key` | D-15 — null fallback contract |
| 5 | `remove() deletes the prefixed key` | D-15 |
| 6 | `clear() only removes mnp_three_ keys, not foreign keys (Trap D)` | D-14 + Trap D mitigation |
| 7 | `get() returns null when stored value is corrupt JSON` | D-15 try/catch contract |
| 8 | `__isBrowser() returns false and all methods no-op when window is undefined` | D-15 SSR safety (vi.stubGlobal pattern) |
| 9 | `__isBrowser() returns true when window is defined (sanity)` | D-15 SSR safety positive case |

**Pattern documentation:** SSR-safety is asserted via `vi.stubGlobal('window', undefined)` + the exported `__isBrowser()` predicate, with `vi.unstubAllGlobals()` in `afterEach` to restore the jsdom window for subsequent tests. The unstable `?ssr-test` import-query module-cache trick was explicitly rejected (Vite resolution behavior differs between `vitest run` and bundler passes).

## Success Criteria #3 Verification

Phase 1 ROADMAP Success Criteria #3 says: _"focus token, `mnp_three_*` localStorage namespace, and `PUBLIC_SITE_URL` env are defined before any feature code lands — verifiable by grep — `mnp_three_` does not appear in any feature commits because the convention is already in place"._

| Check | Command | Result |
|-------|---------|--------|
| Focus token defined | `grep ':focus-visible' src/app.css` | 2 hits (the rule + the mouse-suppression rule) |
| Storage namespace defined | `grep 'mnp_three_' src/lib/storage.ts` | 4 hits (STORAGE_PREFIX literal + comments) |
| `PUBLIC_SITE_URL` env defined | `grep 'PUBLIC_SITE_URL' .env.example` | 3 hits (comment header + active line + production-commented line) |
| Namespace NOT leaked into feature code | `grep -r 'mnp_three_' src/routes/ src/app.css` | **0 hits — PASS** |

The structural guarantee holds: the namespace lives in the helper, not sprinkled. Phase 01-03 will add the CI grep gate (D-17) that mechanically enforces the helper-only path on every push.

## Files Created/Modified

- `src/lib/storage.ts` — typed `mnp_three_` localStorage wrapper (`storage.get/set/remove/clear`); exports `STORAGE_PREFIX` and `__isBrowser`; SSR-safe; JSON parse/stringify with corrupt-value tolerance.
- `src/lib/storage.test.ts` — 9 vitest tests covering write-prefix, round-trip, null fallback, remove, foreign-key-preserving clear, corrupt-JSON tolerance, SSR no-op, and `__isBrowser` sanity.
- `static/fonts/source-serif-4-latin-{400,600,700}.woff2` — display serif (D-09).
- `static/fonts/jetbrains-mono-latin-400.woff2` — mono (D-10).
- `static/fonts/inter-latin-{400,500,600}.woff2` — sans (D-11).
- `src/app.css` — 7 `@font-face` blocks, `@theme` token surface (typography, focus, neutrals, 8 category accents), global `:focus-visible` rule with double-ring (outline + box-shadow), `:focus:not(:focus-visible)` mouse-suppression. Replaces Plan 01-01's placeholder comment.
- `src/routes/+page.svelte` — D-01 splash (`MICHELLE NGO` wordmark + `Filmmaker. Site coming soon.` tagline over `bg-neutral-950`). Replaces Plan 01-01's `bg-black` stub.
- `.env.example` — `PUBLIC_SITE_URL` documented with active staging value and commented production cutover line.

## Decisions Made

All decisions follow the plan's pre-baked Claude-discretion guidance. Key resolutions:

- **Cream ring exact coordinates:** `oklch(0.98 0.02 80)` (the D-06 stated target).
- **Inner ring color:** `oklch(0.16 0 0)` matching `--color-neutral-950` for visual rhyme (per CONTEXT bullet).
- **Latin subset only** for v1 (Latin Extended deferred to Phase 6 if `/about` or `/press` body copy needs it — flagged in plan, not pursued here).
- **Neutrals ramp:** 8 zero-chroma OKLCH stops from `oklch(0.98 0 0)` to `oklch(0.16 0 0)` — sensible dark-mode ramp.
- **Wordmark sizing:** `text-5xl md:text-7xl tracking-[0.2em] font-semibold` (weight 600 — directly consumes the 600 weight from `source-serif-4-latin-600.woff2`).
- **Storage corrupt-value fallback:** `return null` (JS-norm, least surprising — chosen over throw or default-value).
- **PUBLIC_SITE_URL strategy:** committed `.env.example` (not gitignored `.env`). SvelteKit reads `PUBLIC_*` from `process.env` at build time; Phase 01-03's deploy workflow will set it in the `env:` block. `.env.example` serves as documentation + local-dev fallback.

## Deviations from Plan

None — plan executed exactly as written. Every acceptance criterion in all three tasks is met. No bugs found, no missing critical functionality, no blocking issues, no architectural questions raised.

## Issues Encountered

- **`pnpm check` reports errors in `src/lib/intersectionVisibility.svelte.ts` and `src/lib/smoke-page.test.ts`.** These files are untracked and belong to the **parallel Wave 2 agent executing Plan 01-03** (per the orchestrator's `<parallel_execution>` notice). They are out of scope for this plan (deviation rules — scope boundary). My own files (`src/lib/storage.ts`, `src/lib/storage.test.ts`) compile cleanly under `tsc --noEmit --strict` in isolation, and `pnpm test src/lib/storage.test.ts` passes 9/9. The orchestrator validates the joined working tree after both parallel agents complete.

## User Setup Required

None — no external service configuration required for this plan. Font files are bundled in-repo; `.env.example` is documentation only (no real secrets); the splash page renders entirely from the static build.

## Next Phase Readiness

- **Phase 01-03 (parallel Wave 2)** can consume:
  - `src/app.css` for the axe-core contrast scan (focus ring + bg-neutral-950 + text-neutral-100 combo).
  - `STORAGE_PREFIX` from `src/lib/storage.ts` if its CI grep gate (D-17) wants to reference the canonical literal rather than hard-coding `mnp_three_` in the workflow YAML.
  - The 7 fonts under `static/fonts/` will be in the build output by the time 01-03 runs e2e tests; no font 404s expected.
- **Phase 02 (Data Layer)** has no dependency on this plan beyond a clean `pnpm build` (still passing).
- **Phase 03+ feature code** never needs to retrofit: focus token, namespace, env, fonts, and category accents are all defined. The grep verification (`mnp_three_` zero hits in `src/routes/`) proves the convention is mechanical.

## Self-Check: PASSED

All 13 expected files exist on disk. All 4 task commits (`83ba837`, `e6a5dcc`, `f9a6d40`, `163ef08`) exist in git history. SUMMARY.md present at the phase-dir path.

---

*Phase: 01-foundation*
*Completed: 2026-05-25*
