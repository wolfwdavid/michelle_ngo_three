---
phase: 02-data-layer
verified: 2026-05-25T19:17:00Z
status: passed
score: 16/16 must-haves verified
re_verification:
  is_re_verification: false
requirements_verified:
  - DATA-01
  - DATA-02
  - DATA-03
  - DATA-04
---

# Phase 2: Data Layer Verification Report

**Phase Goal:** `src/lib/data/videos.json` is byte-identical to `_four`'s and stays that way under CI; the `$lib/data` loader surface, Zod schema, and Vite build-fail plugin are drop-in compatible with `_four`; an oEmbed health-check catches videos whose embeds have been disabled before they ship as runtime black boxes.

**Verified:** 2026-05-25T19:17:00Z
**Status:** passed (all 16 must-haves verified, 4 of 4 requirement IDs satisfied)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria + PLAN frontmatter)

| #   | Truth                                                                                                                                                                  | Status     | Evidence                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/lib/data/videos.json` is byte-for-byte identical to `../michelle_ngo_four/src/lib/data/videos.json` (SC #1 / DATA-01)                                              | VERIFIED   | `cmp -s` exit 0; sha256 of both files = `fd15e0568425ef8a8472b8bae856bc43a5a85810e4fb1a8f9d0cff771d8ef91c`                                             |
| 2   | Intentionally breaking a video record fails `pnpm build` with a clear Zod error pointing at the violating record (SC #2 / DATA-02)                                      | VERIFIED   | `vite.config.ts:20-52` defines `validateVideosPlugin()` with `buildStart` calling `VideoArraySchema.safeParse` + `(source,id)` uniqueness loop + `z.prettifyError`; SUMMARY documents smoke-test exit 1 with literal error string. `pnpm build` clean today. |
| 3   | The `$lib/data` typed exports match `_four`'s 11-name public surface (SC #3 / DATA-03)                                                                                  | VERIFIED   | `src/lib/data/index.ts` re-exports 4 statements covering `Video`, `Category`, `CATEGORIES`, `categoryToSlug`, `slugToCategory`, `videos`, `producerReelId`, `getById`, `getByCategory`, `getCategoriesInDisplayOrder`, `getCategoriesWithCounts`. `pnpm check` clean: 534 files, 0 errors, 0 warnings. |
| 4   | CI cross-repo diff check runs on every PR and fails the build with a clear message if `_three`'s `videos.json` drifts from `_four`'s (SC #4 / DATA-04 / Trap A)        | VERIFIED   | `.github/workflows/deploy.yml:108-180` defines `drift-check` sibling job; `on:` block has both `push: branches: [main]` and `pull_request: branches: [main]`; D-12 wording present; D-07 force-push handler present; sidecar sha256 consistency step present. |
| 5   | The Vite build-fail plugin hits the Vimeo/YouTube oEmbed endpoint for every video at build time and fails with a clear message if any video is no longer embeddable (SC #5 / Pitfall 6) | VERIFIED (scoped per D-13) | Implemented as standalone `scripts/check-embeds.ts` + nightly `.github/workflows/oembed-check.yml` cron + `pnpm check:embeds` (D-13 decision: NOT on every `pnpm build` — caller is local opt-in, nightly cron, and Phase 7 deploy-gate). Script reads videos.json, classifies 401/403→embed_disabled, 404/410→removed, 5xx/network→transient (warn). Nightly workflow auto-opens/comments embed-check issue on failure. |
| 6   | `src/lib/data/.videos-source-sha` exists with three lines pinning _four commit + content hash + sync date                                                                | VERIFIED   | File present at `src/lib/data/.videos-source-sha` (162 bytes). Lines: `four_commit_sha=07667658ee2fd16a3d56b66bbe832d08fc3badd5`, `videos_json_sha256=fd15e0568425ef8a8472b8bae856bc43a5a85810e4fb1a8f9d0cff771d8ef91c`, `synced_at=2026-05-25`. _four SHA reachable via `git -C ../michelle_ngo_four cat-file -e`. Sidecar sha matches actual file sha. |
| 7   | `pnpm test` passes both `data` (node env) and `ui` (jsdom env) Vitest projects                                                                                          | VERIFIED   | `pnpm vitest run --reporter=verbose`: 7 files, 49 tests passed. `|data|` prefix: 35 tests across categories.test.ts, schema.test.ts, videos.test.ts, videos.json.test.ts. `|ui|` prefix: 14 tests across storage.test.ts, smoke-page.test.ts, intersectionVisibility.svelte.test.ts. |
| 8   | `pnpm check` (svelte-check) passes cleanly with TS strict + noUncheckedIndexedAccess                                                                                    | VERIFIED   | `pnpm check` output: `534 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`                                                                            |
| 9   | `pnpm build` succeeds clean with `validateVideosPlugin` registered and run                                                                                              | VERIFIED   | `pnpm build` exit 0; built in 2.24s; adapter-static wrote site to `build/`. Plugin's `name: 'validate-videos'` is part of Rollup pipeline.            |
| 10  | `pnpm check:embeds` is a script entry in `package.json` that runs the standalone script                                                                                 | VERIFIED   | `package.json` scripts: `"check:embeds": "node --experimental-strip-types scripts/check-embeds.ts"`; `pnpm run` lists `check:embeds`.                  |
| 11  | `.embed-check-report.json` gitignored (D-20)                                                                                                                            | VERIFIED   | `.gitignore` line 23: `.embed-check-report.json` under "Phase 2 D-20" comment header. No report file present in tree.                                  |
| 12  | Nightly cron workflow runs `pnpm check:embeds` and auto-opens/comments embed-check issue on failure                                                                     | VERIFIED   | `.github/workflows/oembed-check.yml`: `cron: '0 6 * * *'` + `workflow_dispatch:`, `permissions: { contents: read, issues: write }`, `pnpm check:embeds` step, `gh issue list --label embed-check --state open` detect-existing logic, `gh issue comment` + `gh issue create` branches, `gh label create embed-check --force` idempotent label. |

**Score:** 12 / 12 truths verified

### Required Artifacts

| Artifact                                              | Expected                                                                    | Status   | Details                                                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/data/videos.json`                            | 56-video catalog byte-identical to _four (DATA-01)                          | VERIFIED | 56 records, sources ∈ {vimeo, youtube}; sha256 match `fd15e056…` with _four                                                       |
| `src/lib/data/categories.ts`                          | 8-category CATEGORIES const + categoryToSlug + slugToCategory               | VERIFIED | 8 entries in CATEGORIES tuple, `categoryToSlug` + `slugToCategory` functions present, `Category` type derived                       |
| `src/lib/data/schema.ts`                              | VideoSchema + VideoArraySchema using Zod 4 idioms                           | VERIFIED | `z.strictObject` (2× — one per source branch), `z.discriminatedUnion('source', [...])`, `z.iso.date()` all present                  |
| `src/lib/data/videos.ts`                              | Typed loader with producerReelId='264677021' + getters                      | VERIFIED | Line 51: `export const producerReelId = '264677021' as const;`; all 6 exports present                                              |
| `src/lib/data/index.ts`                               | Public surface re-exporting 11 names (D-24)                                 | VERIFIED | 4 `export` statements covering 11 names (2 type re-exports + 2 value re-exports)                                                   |
| `src/lib/data/.videos-source-sha`                     | 3-line sidecar pinning _four commit SHA + sha256 + date                     | VERIFIED | 3 lines, all match regex contract; recorded sha matches actual file sha; recorded SHA reachable in _four                            |
| `vite.config.ts`                                      | validateVideosPlugin wired between tailwindcss() and sveltekit()            | VERIFIED | Line 59: `plugins: [tailwindcss(), validateVideosPlugin(), sveltekit()]` AND in both Vitest projects (lines 68, 77)                |
| `src/lib/data/categories.test.ts`                     | Slug round-trip tests                                                       | VERIFIED | 5 tests passing in `data` project                                                                                                  |
| `src/lib/data/schema.test.ts`                         | Zod parsing + strict-object + discriminated-union                           | VERIFIED | 10 tests passing in `data` project                                                                                                 |
| `src/lib/data/videos.test.ts`                         | Loader behavior + display order + featured slice                            | VERIFIED | 16 tests passing in `data` project                                                                                                 |
| `src/lib/data/videos.json.test.ts`                    | Cross-row uniqueness + 56-count + category counts                           | VERIFIED | 5 tests passing in `data` project                                                                                                  |
| `.github/workflows/deploy.yml` (modified)             | drift-check job on PR + push; D-12 + D-07 + sidecar-sha annotations         | VERIFIED | drift-check sibling job (lines 108-180); `pull_request: branches: [main]` added (line 6-7); all 3 annotation strings present; build/deploy jobs untouched (D-17 grep gate still at line 46) |
| `scripts/check-embeds.ts`                             | Standalone Node 22 oEmbed script                                            | VERIFIED | 235 lines, zero new deps, uses Node stdlib + native fetch; constants `PER_HOST_CONCURRENCY=6`, `MAX_RETRIES=3`, `BACKOFF_MS=[1000,2000,4000]`; 3 exit paths (0/1/2) |
| `package.json` (modified)                             | `check:embeds` script entry                                                 | VERIFIED | Scripts: `"check:embeds": "node --experimental-strip-types scripts/check-embeds.ts"`                                              |
| `.gitignore` (modified)                               | `.embed-check-report.json` gitignored                                       | VERIFIED | Line 23, under explicit "Phase 2 D-20" comment header                                                                              |
| `.github/workflows/oembed-check.yml`                  | Nightly cron + workflow_dispatch + auto-Issue handler                       | VERIFIED | cron `0 6 * * *`, `workflow_dispatch`, `issues: write`, `gh issue list/comment/create`, `gh label create embed-check --force`; 4 failure-handler steps |

All 16 artifacts present, substantive, and wired.

### Key Link Verification

| From                                                        | To                                                              | Via                                                            | Status | Details                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `vite.config.ts` `validateVideosPlugin()`                   | `src/lib/data/videos.json`                                      | `buildStart` → JSON.parse + `VideoArraySchema.safeParse` + uniqueness loop | WIRED  | `vite.config.ts:24-50` implements full chain; `pnpm build` runs cleanly proving plugin executes                |
| `src/lib/data/videos.ts`                                    | `src/lib/data/videos.json`                                      | `import rawVideos from './videos.json'` + `VideoArraySchema.parse(rawVideos)` | WIRED | Line 28 import, line 34 parse                                                                            |
| `src/lib/data/index.ts`                                     | `src/lib/data/videos.ts + schema.ts + categories.ts`            | re-export of 11 names                                          | WIRED  | 4 `export` statements; `pnpm check` confirms all referents resolve                                          |
| `.github/workflows/deploy.yml drift-check job`              | `src/lib/data/.videos-source-sha`                               | shell read of `four_commit_sha=` line                          | WIRED  | Line 127: `grep '^four_commit_sha=' "$SIDECAR" | cut -d= -f2`                                            |
| drift-check `actions/checkout` step                         | `wolfwdavid/michelle_ngo_four@<sha>`                            | second `actions/checkout@v4` with repository + ref + path      | WIRED  | Lines 138-143; `repository: wolfwdavid/michelle_ngo_four`, `ref: ${{ steps.pin.outputs.four_sha }}`, `path: __four`  |
| drift-check byte-compare step                               | `__four/src/lib/data/videos.json` vs `src/lib/data/videos.json` | `cmp -s`                                                       | WIRED  | Line 160: `if cmp -s "$FOUR_FILE" "$THREE_FILE"`                                                          |
| `scripts/check-embeds.ts`                                   | `src/lib/data/videos.json`                                      | `readFile(VIDEOS_JSON, 'utf-8')` + JSON.parse + map of 56 records | WIRED  | Lines 35, 161-169                                                                                        |
| `scripts/check-embeds.ts`                                   | Vimeo/YouTube oEmbed endpoints                                  | `fetch()` per video with retry/backoff/classify                | WIRED  | `oembedUrl()` lines 64-71; `fetchOnce()` lines 84-100; `probe()` lines 102-136                            |
| `.github/workflows/oembed-check.yml`                        | `scripts/check-embeds.ts`                                       | `pnpm check:embeds`                                            | WIRED  | Line 46: `run: pnpm check:embeds`                                                                        |
| oembed-check failure handler                                | GitHub Issues (label: embed-check)                              | `gh issue list/comment/create` with `GITHUB_TOKEN`             | WIRED  | Lines 106-119; existing-issue detection + comment OR create branches; label idempotent via `gh label create --force` |

All 10 key links wired correctly.

### Requirements Coverage

| Requirement | Source Plan(s)                  | Description                                                                                                                       | Status    | Evidence                                                                                                            |
| ----------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| DATA-01     | 02-01-PLAN                      | `src/lib/data/videos.json` byte-identical to `../michelle_ngo_four/src/lib/data/videos.json` (source-of-truth reuse)               | SATISFIED | `cmp -s` exit 0; matching sha256 `fd15e056…`                                                                         |
| DATA-02     | 02-01-PLAN                      | Same Zod schema + Vite build-fail plugin from `_four` validates `videos.json` at build time; breaking a record fails the build    | SATISFIED | `validateVideosPlugin()` defined in `vite.config.ts:20-52` + wired in plugins arrays; SUMMARY documents smoke-test (exit 1 on `[0].source="tiktok"` with literal `z.prettifyError` output) |
| DATA-03     | 02-01-PLAN                      | Same `$lib/data` typed loader surface as `_four` (11 names) is drop-in compatible                                                  | SATISFIED | All 11 named exports present in `src/lib/data/index.ts`; `pnpm check` (534 files, 0 errors) confirms surface resolves cleanly |
| DATA-04     | 02-02-PLAN                      | Cross-repo byte-diff CI check fails the build if `_three`'s `videos.json` drifts from `_four`'s (A/B integrity — Trap A mitigation) | SATISFIED | `drift-check` sibling job in `deploy.yml`; runs on `push:` + `pull_request:` to main; reads pinned SHA from sidecar; clones _four; `cmp -s` byte-compare; D-12 + D-07 + sidecar-sha annotations on failure paths |

**Coverage check:** Phase 2 traceability in REQUIREMENTS.md maps DATA-01..DATA-04 to Phase 2. All 4 are claimed across plans 02-01 (DATA-01..03) and 02-02 (DATA-04). Plan 02-03 has empty `requirements: []` — correct because Pitfall 6 / oEmbed health-check is a goal Success Criterion (SC #5) but is not assigned its own DATA-* requirement ID. **Zero orphans.**

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |

**None.** Grep across `src/lib/data/` and `scripts/` for TODO/FIXME/XXX/HACK/PLACEHOLDER/placeholder/coming soon/not yet implemented returned zero matches. No stub implementations. No empty `return null`/`return []` placeholders unbacked by data flow. All exports are concrete, all functions have real bodies, all CI jobs have real failure paths.

### Human Verification Required

**None mandatory.** All automated checks pass. Two operational items, not blockers, are inherently non-local:

1. **First CI drift-check run on a real PR** — Local dry-run (SUMMARY 02-02) confirms shell logic and YAML structure; only an actual PR will exercise `actions/checkout@v4` pulling `wolfwdavid/michelle_ngo_four@07667658…` via the runner. Expected: green on no-drift, red with D-12 wording on a sanity-edit PR.
2. **First nightly oembed-check workflow run** — Local smoke-test (SUMMARY 02-03) confirmed exit 0 on happy path (56/56 embeddable) and exit 1 + report file on forced failure. The auto-Issue creation (label `embed-check`, comment-vs-create branch) will be exercised by GitHub the first night a real video is embed-disabled.

Neither blocks declaring Phase 2 complete: both surfaces are operational gates that fire on the appropriate triggers (PR / nightly cron); their first real-world run is observability, not implementation.

### Gaps Summary

**No gaps.** Phase 2 goal achieved end-to-end:

- **Byte-identity:** `videos.json` matches `_four` at sha256 `fd15e056…`; sidecar pins the source commit `07667658…`.
- **Build-time guard:** `validateVideosPlugin` runs in `buildStart`, parses with Zod, enforces `(source,id)` uniqueness; smoke-tested to fail loud on corruption.
- **Drop-in surface:** 11-name `$lib/data` public API matches `_four`; downstream Phase 3+ imports will compile unchanged.
- **CI drift guard:** `drift-check` job on every PR and main push, with three failure modes (drift / unreachable SHA / local-edit-without-sidecar-refresh) and D-12/D-07/sidecar-mismatch error wording.
- **Operational embed health:** standalone script + nightly cron + auto-Issue tracker catches owner-disabled embeds within ≤24h, before they ship as runtime black boxes.
- **Tooling green:** `pnpm check` (534 files, 0 errors, 0 warnings), `pnpm test` (49 tests across 7 files, both data and ui projects), `pnpm build` (exit 0, adapter-static wrote to `build/`).

Phase 2 is ready to proceed to Phase 3 (Reel System Core). All four phase requirements (DATA-01, DATA-02, DATA-03, DATA-04) are satisfied with concrete code-level evidence.

---

*Verified: 2026-05-25T19:17:00Z*
*Verifier: Claude (gsd-verifier)*
