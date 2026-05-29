# Phase 07 — Deferred Items

Out-of-scope discoveries logged during execution. NOT fixed by the discovering plan.

## Plan 07-01

### Pre-existing lint error in `.lintstagedrc.cjs` (out of scope)

- **Discovered during:** Plan 07-01 Task 2 (`pnpm lint` gate)
- **Error:** `15:14 error A require() style import is forbidden @typescript-eslint/no-require-imports` — line 15 `const path = require('path');`
- **Why out of scope:** `.lintstagedrc.cjs` is unmodified in the working tree (last touched in Phase 3 commit `4e2b372`); the error is unrelated to Plan 07-01's metadata changes. Task 2's own files (`src/routes/+layout.svelte`, `src/routes/+page.svelte`) lint cleanly in isolation (`npx eslint` on them exits 0).
- **Note:** `eslint.config.js` does NOT ignore `.cjs` files, and the config applies `@typescript-eslint/no-require-imports` (from `tseslint.configs.recommended`) globally. A CommonJS `.cjs` file legitimately needs `require()`. Suggested fix (for a future plan): add a per-file override in `eslint.config.js` disabling `@typescript-eslint/no-require-imports` for `**/*.cjs`, OR add `.lintstagedrc.cjs` to the `ignores` list. Plan 07-03 (CI lint/axe gate) is the natural home for this cleanup.
- **Status:** DEFERRED — not fixed here. (Plan 07-03 scope was axe-7-routes + POL-03 grep + LCP measure/escalation only; the eslint-config cleanup is the wider CI lint-gate task and remains for 07-04 or a quick-fix.)

## Plan 07-03

### Two pre-existing `pnpm lint` errors (out of scope — not caused by 07-03)

- **Discovered during:** Plan 07-03 Task 4 (`pnpm lint` gate before committing the poster-preload escalation)
- **Errors:**
  - `.lintstagedrc.cjs:15:14 error A require() style import is forbidden @typescript-eslint/no-require-imports` (same pre-existing item logged under Plan 07-01 above).
  - `scripts/build-assets.mjs:81:7 error 'NEUTRAL_500' is assigned a value but never used @typescript-eslint/no-unused-vars` (introduced by Plan 07-02's asset-build script).
- **Why out of scope:** Neither file is modified by Plan 07-03. The three files 07-03 touched (`src/routes/+page.svelte`, `src/routes/about/+page.svelte`, `src/lib/components/HeroAmbient.svelte`) lint clean in isolation (`npx eslint` on them exits 0). `pnpm check` (svelte-check/tsc) is fully green. Per the SCOPE BOUNDARY rule these are logged, not fixed.
- **Suggested fix:** `build-assets.mjs` — delete the unused `NEUTRAL_500` const (one line). `.lintstagedrc.cjs` — per-file eslint override as noted above.
- **Status:** DEFERRED — not fixed here.
