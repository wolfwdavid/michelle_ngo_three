# Phase 6 Deferred Items

Out-of-scope discoveries surfaced during Plan 06-01 execution but NOT auto-fixed
(per executor scope boundary: only fix issues directly caused by current task's
changes).

## .lintstagedrc.cjs — `@typescript-eslint/no-require-imports` violation

**File:** `.lintstagedrc.cjs:15`
**Rule:** `@typescript-eslint/no-require-imports`
**Severity:** Error
**Introduced:** Phase 3 Plan 03-01 (commit `4e2b372` — pre-existing on master before Plan 06-01)
**Scope:** Repository tooling config — unrelated to Plan 06-01's files
**Discovered:** Plan 06-01 Task 3 `pnpm lint` run
**Recommendation:** Address in a separate maintenance commit. Options: (a) add `.lintstagedrc.cjs` to eslint ignores; (b) convert require → ESM import + use `.mjs` extension; (c) add per-file override allowing CommonJS in lint-staged config.
**Out of scope:** Plan 06-01's contract is shared chrome (ContactBlock + Footer + layout). Touching `.lintstagedrc.cjs` would expand scope beyond the plan boundary.
