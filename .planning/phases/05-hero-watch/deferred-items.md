# Phase 5 — Deferred Items

Out-of-scope discoveries logged during plan execution. Per GSD deviation rules,
items here are NOT auto-fixed in the plan that found them — they are recorded
for a future plan or fast-follow to address.

## From Plan 05-01

### `.lintstagedrc.cjs` lint failure (pre-existing)

- **Discovered:** Plan 05-01 final `pnpm lint` run (2026-05-27)
- **File:** `.lintstagedrc.cjs` line 15
- **Rule:** `@typescript-eslint/no-require-imports`
- **Message:** "A `require()` style import is forbidden"
- **Why deferred:** Pre-existing since commit `4e2b372` (Phase 3, Plan 03-01).
  Unrelated to Plan 05-01's surface (vimeoAdapter, url.ts, visibility rune,
  ReelStage hash-restore, +layout.svelte). Plan 05-01's `pnpm check` is green;
  `pnpm test` 281/281 green; `pnpm build` green. Only `pnpm lint` trips on
  this single pre-existing CJS file.
- **Recommended fix (future plan):** Either (a) rename to
  `.lintstagedrc.mjs` + convert to ESM `import`, or (b) add an eslint per-file
  override for `*.cjs` that disables `@typescript-eslint/no-require-imports`.
  Option (b) is minimal and matches the Phase 4 D-08 per-file-override pattern.
