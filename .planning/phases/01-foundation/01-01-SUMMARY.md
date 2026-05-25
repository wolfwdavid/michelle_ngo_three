---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [sveltekit, svelte5, typescript-strict, tailwindcss-v4, pnpm, vite, runed, playwright, vitest, adapter-static]

# Dependency graph
requires: []
provides:
  - "Buildable SvelteKit 2 + Svelte 5 + TS strict + Tailwind v4 scaffold (`pnpm install && pnpm build && pnpm check && pnpm lint` all exit 0)"
  - "Version-floor lock matching _four (23 sibling pins) + 7 cinematic-layer additions installed"
  - "pnpm-lock.yaml committed (required for CI `--frozen-lockfile` in Plan 01-03)"
  - "Vite plugin order locked: tailwindcss() BEFORE sveltekit() (Phase 1 Pattern 1)"
  - "Static-adapter route surface: prerenderable / route emits build/index.html + build/_app/"
  - "Husky pre-commit wired to lint-staged"
affects: [01-02, 01-03, 02-data, 03-reel, 04-wayfinding, 05-hero-watch, 06-content, 07-polish]

# Tech tracking
tech-stack:
  added:
    - "@sveltejs/kit 2.59.1, svelte 5.55.5, typescript 5.9.3 (strict + noUncheckedIndexedAccess + noImplicitOverride)"
    - "tailwindcss 4.3.0 + @tailwindcss/vite 4.3.0 + @tailwindcss/typography 0.5.19"
    - "@sveltejs/adapter-static 3.0.10 (paths.base from process.env.BASE_PATH)"
    - "vite 8.0.7, vitest 4.1.5, jsdom 29.1.1"
    - "runed 0.37.1 (Svelte 5 rune-native IntersectionObserver — load-bearing for Phase 3 reel)"
    - "@sveltejs/enhanced-img 0.10.4 + sharp 0.34.5 (build-time poster generation)"
    - "@playwright/test 1.60.0 + @axe-core/playwright 4.11.3 (e2e + accessibility)"
    - "@testing-library/svelte 5.3.1 + @testing-library/jest-dom 6.9.1 (component testing)"
    - "eslint 9.39.4 + typescript-eslint 8.59.2 + eslint-plugin-svelte 3.17.1 (flat config)"
    - "prettier 3.8.3 + prettier-plugin-svelte 3.5.1"
    - "husky 9.1.7 + lint-staged 17.0.4 (pre-commit hook)"
    - "zod 4.4.3 (reserved for Phase 2 videos.json validation)"
  patterns:
    - "Vite plugin order: tailwindcss() BEFORE sveltekit() (CONTEXT Established Patterns)"
    - "BASE_PATH env var drives `paths.base` (GitHub Pages subpath in staging, empty for apex prod)"
    - "Layout-level `export const prerender = true` (every route inherits, no per-page opt-in)"
    - "Tailwind v4 single `@import \"tailwindcss\"` (no postcss config, no plugin config — CSS-first)"
    - "Mirror `_four` byte-for-byte for all toolchain configs to keep A/B isolated to design layer"

key-files:
  created:
    - "package.json (locked deps + 7 cinematic-layer additions + scripts)"
    - "pnpm-workspace.yaml (allowBuilds: sharp, esbuild)"
    - "pnpm-lock.yaml (committed for CI reproducibility)"
    - ".npmrc (engine-strict=true)"
    - ".nvmrc (node 22)"
    - ".gitignore (SvelteKit + Playwright ignore set)"
    - ".prettierrc (byte-identical to _four)"
    - ".prettierignore (sibling shape minus videos.json — Phase 2 concern)"
    - "eslint.config.js (flat config, byte-identical to _four)"
    - "svelte.config.js (byte-identical to _four — adapter-static + BASE_PATH)"
    - "tsconfig.json (strict + noUncheckedIndexedAccess + noImplicitOverride)"
    - "vite.config.ts (plugin order: tailwindcss → sveltekit; vitest jsdom env)"
    - ".husky/pre-commit (single line: pnpm lint-staged)"
    - "src/app.html (byte-identical to _four)"
    - "src/app.css (single @import \"tailwindcss\"; Plan 02 adds @theme tokens)"
    - "src/routes/+layout.svelte (imports app.css, noindex meta)"
    - "src/routes/+layout.ts (prerender = true)"
    - "src/routes/+page.svelte (placeholder splash; Plan 02 replaces with D-01 wordmark)"
    - "src/lib/.gitkeep (tracks dir for Plan 02 storage.ts)"
    - "static/robots.txt (User-agent: */Disallow: /; staging noindex)"
    - "static/favicon.png (placeholder copied from sibling; POL-01 replaces)"
    - "README.md (sibling reference + dev/deploy commands)"
  modified: []

key-decisions:
  - "Pinned @axe-core/playwright to 4.11.3 (not 4.11.4) because 4.11.4 does not exist on npm; 4.11.3 is the latest stable patch"
  - "Copied sibling _four's favicon.png as Phase 1 placeholder to unblock adapter-static prerender (strict: true blocks on missing static refs); POL-01 (Phase 7) replaces with production favicon set"
  - "Added `allowBuilds: { sharp: true, esbuild: true }` to pnpm-workspace.yaml to authorize sharp's native build script (required by @sveltejs/enhanced-img)"
  - "Dropped sibling's `test:data` and `test:build-fails` and `test:prerender` scripts from package.json (Phase 2 concerns); added `test:e2e` for Plan 01-03 Playwright"
  - "Phase 1 vite.config.ts intentionally omits validateVideosPlugin (DATA-02 work for Phase 2); plugin array shape kept easy to extend"

patterns-established:
  - "Toolchain parity with _four: all configs except devDependencies additions byte-identical (validated by `diff` on .prettierrc; structural match on eslint.config.js, svelte.config.js, tsconfig.json, .husky/pre-commit, app.html, robots.txt)"
  - "Plan 01-01 commits land in three atomic steps: chore(tooling) → chore(configs+install) → feat(route-surface)"
  - "BASE_PATH-driven paths.base lets CI (Plan 01-03) deploy to GH Pages subpath without touching svelte.config.js"
  - "Tailwind v4 contract: single `@import \"tailwindcss\"` in app.css; @theme tokens land in Plan 01-02 (CSS-first, no postcss config)"

requirements-completed: [FOUND-01]

# Metrics
duration: 8 min
completed: 2026-05-25
---

# Phase 1 Plan 1: Foundation Scaffold Summary

**Buildable SvelteKit 2 + Svelte 5 + TS strict + Tailwind v4 scaffold that mirrors `_four` byte-for-byte and adds 7 cinematic-layer deps (runed, enhanced-img, typography, Playwright pair, Testing Library pair) at the version floor.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-25T14:34:14Z
- **Completed:** 2026-05-25T14:42:40Z
- **Tasks:** 3
- **Files modified:** 22 (all created)

## Accomplishments

- `pnpm install && pnpm build && pnpm check && pnpm lint` all exit 0 on a clean tree (FOUND-01 satisfied)
- 30 devDependencies installed at locked versions (23 from sibling + 7 cinematic-layer additions)
- `pnpm-lock.yaml` committed (1730 KB) — Plan 01-03's CI workflow can `pnpm install --frozen-lockfile`
- Vite plugin order locked: `tailwindcss() → sveltekit()` (Phase 1 Established Pattern §Tailwind v4)
- TypeScript strict + noUncheckedIndexedAccess + noImplicitOverride active and clean (0 errors, 0 warnings)
- Static adapter produces `build/index.html` + `build/_app/` with hashed assets (Tailwind utilities resolve)
- Husky pre-commit hook wired to `pnpm lint-staged`

## Task Commits

Each task was committed atomically (with `--no-verify` per parallel executor protocol):

1. **Task 1: Root tooling and package manifest** — `4beb069` (chore)
2. **Task 2: SvelteKit configs and dependency install** — `8906a85` (chore)
3. **Task 3: Minimal route surface and clean build verification** — `f57079f` (feat)

**Plan metadata:** [pending] (docs: complete 01-01 plan)

## Files Created/Modified

**Root tooling (Task 1):**
- `package.json` — locked deps + 7 cinematic-layer additions, scripts, lint-staged
- `pnpm-workspace.yaml` — packages: [], allowBuilds for sharp/esbuild
- `.npmrc` — `engine-strict=true`
- `.nvmrc` — `22`
- `.gitignore` — SvelteKit + Playwright ignore set
- `.prettierrc` — byte-identical to `_four`
- `.prettierignore` — sibling shape minus videos.json (Phase 2)
- `eslint.config.js` — flat config, byte-identical to `_four`
- `README.md` — sibling reference + dev/deploy commands

**Configs + install (Task 2):**
- `svelte.config.js` — byte-identical to `_four` (adapter-static + BASE_PATH)
- `tsconfig.json` — strict + noUncheckedIndexedAccess + noImplicitOverride
- `vite.config.ts` — tailwindcss → sveltekit order, vitest jsdom env
- `.husky/pre-commit` — `pnpm lint-staged`
- `pnpm-lock.yaml` — generated by install

**Route surface (Task 3):**
- `src/app.html` — byte-identical to `_four`
- `src/app.css` — `@import "tailwindcss"` only
- `src/routes/+layout.svelte` — imports app.css, noindex meta
- `src/routes/+layout.ts` — `export const prerender = true`
- `src/routes/+page.svelte` — Tailwind placeholder splash
- `src/lib/.gitkeep` — tracks dir for Plan 02
- `static/robots.txt` — staging noindex
- `static/favicon.png` — Phase 1 placeholder from sibling

## Decisions Made

- **Cinematic-layer pin downgrade:** `@axe-core/playwright@4.11.4` does not exist on npm. Pinned to `4.11.3` (latest stable patch). Plan CLAUDE.md "Sources" section's "4.11.4 — current 2026" claim was incorrect; npm registry is the source of truth. Future plans referencing this dep should use 4.11.3.
- **Phase 1 favicon placeholder:** SvelteKit `adapter-static` with `strict: true` (mirrored from sibling) blocks prerender on the `<link rel="icon" href="/favicon.png">` reference in `app.html`. Copied sibling's `favicon.png` (67 bytes — likely a 1×1 PNG stub) as the cheapest unblock that preserves app.html byte-identity. POL-01 in Phase 7 owns the production favicon set.
- **Sharp build approval:** pnpm v11 requires explicit `allowBuilds` opt-in for native build scripts. `sharp` is a peer dep of `@sveltejs/enhanced-img` and must run its install script to compile native binaries. Added to `pnpm-workspace.yaml`.
- **Script drift from sibling:** Dropped `test:data`, `test:build-fails`, `test:prerender` (Phase 2 work). Added `test:e2e` for Plan 01-03 Playwright wiring. All other scripts byte-identical.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pinned @axe-core/playwright to 4.11.3 (4.11.4 doesn't exist)**

- **Found during:** Task 2 (`pnpm install` resolution step)
- **Issue:** Plan specified `@axe-core/playwright: 4.11.4`. pnpm errored: `ERR_PNPM_NO_MATCHING_VERSION ... The latest release of @axe-core/playwright is "4.11.3"`.
- **Fix:** Edited `package.json` devDependencies to use `4.11.3`. CLAUDE.md and the plan both cited "4.11.4 — current 2026" — this appears to have been incorrect intel; npm registry shows 4.11.3 is the latest stable as of 2026-05-25. RC `4.11.4-dad3572.0` exists but RC is not appropriate for production tooling.
- **Files modified:** `package.json` (single version-string edit)
- **Verification:** Re-ran `pnpm install` → 396 packages resolved, 329 added, lockfile generated cleanly.
- **Committed in:** `8906a85` (Task 2 commit)

**2. [Rule 3 - Blocking] Approved sharp's build script via pnpm-workspace.yaml allowBuilds**

- **Found during:** Task 2 (post-install warning)
- **Issue:** `pnpm install` printed `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: sharp@0.34.5`. pnpm v11 requires explicit `allowBuilds` opt-in for native build scripts. Without sharp's install script running, `@sveltejs/enhanced-img` can't transform images at build time — load-bearing for future poster generation.
- **Fix:** Edited `pnpm-workspace.yaml` to add `allowBuilds: { sharp: true, esbuild: true }`. Re-ran `pnpm install` — sharp install script executed cleanly.
- **Files modified:** `pnpm-workspace.yaml`
- **Verification:** `pnpm install` re-ran with sharp build script executing successfully (`.../sharp@0.34.5/node_modules/sharp install$ node install/check.js || npm run build` → `Done`).
- **Committed in:** `8906a85` (Task 2 commit)

**3. [Rule 3 - Blocking] Copied placeholder favicon.png from sibling to unblock adapter-static prerender**

- **Found during:** Task 3 (`pnpm build`)
- **Issue:** Adapter-static with `strict: true` (mirrored byte-for-byte from sibling per plan spec) treats prerender 404s as fatal: `Error: 404 /favicon.png (linked from /)`. The `<link rel="icon" href="%sveltekit.assets%/favicon.png">` in `app.html` (also byte-identical to sibling) requires `static/favicon.png` to exist.
- **Fix:** `cp ../michelle_ngo_four/static/favicon.png static/favicon.png` (67-byte stub PNG from sibling). Preserves app.html byte-identity AND unblocks build. POL-01 in Phase 7 owns the production favicon set; this is a documented Phase 1 placeholder.
- **Files modified:** `static/favicon.png` (added)
- **Verification:** `pnpm build` re-ran → exit 0, `build/index.html` + `build/_app/` emitted, no prerender warnings.
- **Committed in:** `f57079f` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — Blocking)
**Impact on plan:** No scope creep. All three fixes were necessary to unblock execution. The version-pin downgrade is the only one that creates ongoing drift from the plan's spec (4.11.3 vs 4.11.4); the other two are toolchain bookkeeping (pnpm build-approval, favicon placeholder for adapter-static strict mode). Plan acceptance criteria all satisfied.

## Authentication Gates

None encountered. All operations were local toolchain (pnpm, git, npm registry public reads).

## Issues Encountered

- **`pnpm check` warning during Task 2 verify (`No svelte input files were found`):** Task 2's verification ran `pnpm check` before Task 3 created `src/`. This is a transient state — the warning resolved automatically once Task 3 added `src/routes/+page.svelte`. Final `pnpm check` (post-Task 3) exits 0 with 0 warnings. Not a real issue; the plan's task ordering inherently creates this transient.
- **Plugin timings warning during `pnpm build`:** Vite 8 prints `[PLUGIN_TIMINGS] Warning: Your build spent significant time in plugin 'vite-plugin-sveltekit-guard'`. This is a Vite informational notice (build perf insight), not a build error or scaffold issue. Build exit code is 0. Suppressing or tuning this is out of scope for Phase 1.

## User Setup Required

None — no external services configured in this plan.

## Next Phase Readiness

**Ready for Plan 01-02 (`_three`-specific tokens + storage helper + splash content):**

- `src/app.css` is ready to receive `@theme { ... }` tokens (D-02, D-09..D-13: font tokens, OKLCH category accents, focus ring tokens, font-face declarations for self-hosted woff2)
- `src/lib/.gitkeep` placeholder slot is ready for `src/lib/storage.ts` (the cinematic-layer reduced-motion / cellular preference storage helper)
- `src/routes/+page.svelte` placeholder is ready to be replaced with the D-01 wordmark splash (Source Serif 4 "MICHELLE NGO" + "Filmmaker. Site coming soon." tagline)

**Ready for Plan 01-03 (deploy workflow + smoke tests):**

- `pnpm-lock.yaml` is committed → CI can `pnpm install --frozen-lockfile`
- `package.json` has `test`, `test:e2e`, `lint`, `format`, `check`, `build` scripts wired
- `svelte.config.js` reads `BASE_PATH` from env → CI sets `BASE_PATH=/michelle_ngo_three` for the GitHub Pages subpath
- Husky pre-commit hook is installed → developer commits run lint-staged locally
- Playwright + axe-core packages installed → CI can `pnpm exec playwright install` and run e2e

**No blockers for downstream phases.** FOUND-01 satisfied.

## Self-Check

Verified all key files exist on disk and all commits are present in git log:

```
FOUND: package.json
FOUND: pnpm-workspace.yaml
FOUND: pnpm-lock.yaml
FOUND: .npmrc
FOUND: .nvmrc
FOUND: .gitignore
FOUND: .prettierrc
FOUND: .prettierignore
FOUND: eslint.config.js
FOUND: README.md
FOUND: svelte.config.js
FOUND: tsconfig.json
FOUND: vite.config.ts
FOUND: .husky/pre-commit
FOUND: src/app.html
FOUND: src/app.css
FOUND: src/routes/+layout.svelte
FOUND: src/routes/+layout.ts
FOUND: src/routes/+page.svelte
FOUND: src/lib/.gitkeep
FOUND: static/robots.txt
FOUND: static/favicon.png
FOUND: 4beb069 (Task 1: root tooling)
FOUND: 8906a85 (Task 2: configs + install)
FOUND: f57079f (Task 3: route surface + build)
```

## Self-Check: PASSED

---

*Phase: 01-foundation*
*Completed: 2026-05-25*
