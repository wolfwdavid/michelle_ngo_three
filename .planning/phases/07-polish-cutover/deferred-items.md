# Phase 07 — Deferred Items

Out-of-scope discoveries logged during execution. NOT fixed by the discovering plan.

## Plan 07-01

### Pre-existing lint error in `.lintstagedrc.cjs` (out of scope)

- **Discovered during:** Plan 07-01 Task 2 (`pnpm lint` gate)
- **Error:** `15:14 error A require() style import is forbidden @typescript-eslint/no-require-imports` — line 15 `const path = require('path');`
- **Why out of scope:** `.lintstagedrc.cjs` is unmodified in the working tree (last touched in Phase 3 commit `4e2b372`); the error is unrelated to Plan 07-01's metadata changes. Task 2's own files (`src/routes/+layout.svelte`, `src/routes/+page.svelte`) lint cleanly in isolation (`npx eslint` on them exits 0).
- **Note:** `eslint.config.js` does NOT ignore `.cjs` files, and the config applies `@typescript-eslint/no-require-imports` (from `tseslint.configs.recommended`) globally. A CommonJS `.cjs` file legitimately needs `require()`. Suggested fix (for a future plan): add a per-file override in `eslint.config.js` disabling `@typescript-eslint/no-require-imports` for `**/*.cjs`, OR add `.lintstagedrc.cjs` to the `ignores` list. Plan 07-03 (CI lint/axe gate) is the natural home for this cleanup.
- **Status:** DEFERRED — not fixed here.
