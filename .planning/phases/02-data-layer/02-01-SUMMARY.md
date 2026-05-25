---
phase: 02-data-layer
plan: 01
subsystem: data

tags: [zod, vite-plugin, sveltekit, vitest, byte-identity, schema-validation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "SvelteKit + TS strict + Vite + Vitest + tailwindcss() before sveltekit() plugin order; existing src/lib/*.test.ts Phase 1 tests live in vite.config.ts test.include"
provides:
  - "src/lib/data/videos.json byte-identical to ../michelle_ngo_four (sha256 fd15e0568425ef8a8472b8bae856bc43a5a85810e4fb1a8f9d0cff771d8ef91c)"
  - "11-name public surface at $lib/data (CATEGORIES, categoryToSlug, slugToCategory, videos, producerReelId, getById, getByCategory, getCategoriesInDisplayOrder, getCategoriesWithCounts, Video, Category)"
  - "VideoArraySchema + VideoSchema + CategorySchema Zod 4 idioms (z.strictObject + z.discriminatedUnion('source', ...) + z.iso.date())"
  - "validateVideosPlugin() wired into vite.config.ts top-level + both Vitest projects (data + ui)"
  - "Vitest data/ui project split: data=node env (4 files, 35 tests), ui=jsdom env (3 files, 14 tests)"
  - ".videos-source-sha sidecar pinning _four@07667658 commit + content hash + sync date"
affects:
  - "03-reel-system-core: imports videos + getByCategory + getById; Phase 3 will add a reel-helpers.ts file for viewport-windowing (D-22 deferred)"
  - "04-wayfinding: imports getByCategory, categoryToSlug, slugToCategory, getCategoriesWithCounts for prerendered /work/[category] routes"
  - "05-hero-and-watch: imports getById + producerReelId for HeroAmbient + /watch/[id]"
  - "02-02 drift-check CI: reads .videos-source-sha to pin _four checkout SHA"
  - "02-03 oembed health-check: imports videos to iterate 56 records"

# Tech tracking
tech-stack:
  added:
    - "zod (already in package.json from Phase 1 lock; now actually consumed at build time)"
    - "Vitest projects API (replaces single jsdom test block)"
  patterns:
    - "Vite plugin buildStart hook for fail-fast pre-bundle data validation"
    - "Sidecar provenance file (plain key=value text, dotfile prefix) for cross-repo source tracking"
    - "Verbatim mirror discipline: copy files byte-for-byte from sibling; resist _three-specific edits per D-21"

key-files:
  created:
    - "src/lib/data/videos.json (56-video catalog, byte-identical to _four)"
    - "src/lib/data/categories.ts (8-category CATEGORIES + slug round-trip)"
    - "src/lib/data/schema.ts (Zod 4 VideoSchema + VideoArraySchema)"
    - "src/lib/data/videos.ts (loader: videos, producerReelId, getById, getByCategory, getCategoriesInDisplayOrder, getCategoriesWithCounts)"
    - "src/lib/data/index.ts (11-name public surface)"
    - "src/lib/data/categories.test.ts (slug round-trip)"
    - "src/lib/data/schema.test.ts (Zod parsing + strict-object + discriminated-union)"
    - "src/lib/data/videos.test.ts (loader behavior + hidden filter + display order + featured slice)"
    - "src/lib/data/videos.json.test.ts (cross-row (source,id) uniqueness + 56-count + category counts)"
    - "src/lib/data/.videos-source-sha (provenance sidecar)"
  modified:
    - "vite.config.ts (added validateVideosPlugin + data/ui Vitest project split + browser conditions moved into ui project)"

key-decisions:
  - "Verbatim mirror over rewrite — copied 9 files from ../michelle_ngo_four byte-for-byte per D-21; docstrings citing _four's D-numbers preserved as correct historical provenance"
  - "ui project include widened to src/lib/**/*.{test,spec}.{js,ts} (Claude's discretion per D-21) to catch Phase 1 tests at src/lib/storage.test.ts, src/lib/intersectionVisibility.svelte.test.ts, src/lib/smoke-page.test.ts; exclude src/lib/data/** keeps data tests in node-env data project"
  - "Smoke-test corruption used: changed [0].source from 'vimeo' to 'tiktok' (discriminated-union violation); produced exit 1 with 'videos.json failed schema validation: Invalid discriminator value. Expected youtube | vimeo at [0].source' via [plugin validate-videos] rolldown error"
  - "Sidecar pinned _four@07667658ee2fd16a3d56b66bbe832d08fc3badd5 (current main HEAD at sync time per D-05)"

patterns-established:
  - "Vite plugin order: tailwindcss() → validateVideosPlugin() → sveltekit() (top-level AND in each Vitest project's plugins array)"
  - "Per-project resolve.conditions: the ui project owns the browser-conditions Svelte 5 mount() requires; data project stays pure node (no conditions override) to keep src/lib/data imports fast"
  - "Cross-repo provenance sidecar: 3 lines, key=value plain text, co-located with the file it documents"

requirements-completed: [DATA-01, DATA-02, DATA-03]

# Metrics
duration: 6min
completed: 2026-05-25
---

# Phase 2 Plan 1: Mirror _four Data Layer Summary

**56-video catalog + Zod schema + 11-name $lib/data surface mirrored byte-for-byte from `../michelle_ngo_four`, with `validateVideosPlugin()` wired into `vite.config.ts` so `pnpm build` fails loud on any schema or `(source, id)` uniqueness drift.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-25T18:47:55Z
- **Completed:** 2026-05-25T18:54:00Z
- **Tasks:** 3 (all type=auto, no checkpoints)
- **Files modified:** 11 (10 new + 1 rewritten)

## Accomplishments

- **DATA-01 met:** `src/lib/data/videos.json` is byte-identical to `../michelle_ngo_four/src/lib/data/videos.json` — `cmp -s` exit 0; sha256 `fd15e0568425ef8a8472b8bae856bc43a5a85810e4fb1a8f9d0cff771d8ef91c` matches on both sides.
- **DATA-02 met:** `validateVideosPlugin()` mirrored verbatim from `_four/vite.config.ts`; runs in Rollup `buildStart` hook; calls `VideoArraySchema.safeParse()` and `(source, id)` Set-uniqueness loop; emits `z.prettifyError()` via `this.error()` on failure. Smoke-test confirmed: corrupting `[0].source = "tiktok"` aborted `pnpm build` with exit 1 and message `videos.json failed schema validation: Invalid discriminator value. Expected 'youtube' | 'vimeo' → at [0].source`. Post-restore build green.
- **DATA-03 met:** 11-name public surface exported from `src/lib/data/index.ts` — `Video`, `Category`, `CATEGORIES`, `categoryToSlug`, `slugToCategory`, `videos`, `producerReelId`, `getById`, `getByCategory`, `getCategoriesInDisplayOrder`, `getCategoriesWithCounts`. `pnpm check` clean (TS strict + `noUncheckedIndexedAccess`).
- **Vitest data/ui split active:** 49 tests pass across 7 files — data project (4 files, 35 tests, node env) + ui project (3 files, 14 tests, jsdom env). Phase 1 tests (`storage.test.ts`, `intersectionVisibility.svelte.test.ts`, `smoke-page.test.ts`) caught by widened `src/lib/**/*.{test,spec}.{js,ts}` include with `exclude: ['src/lib/data/**']`.
- **Sidecar created:** `src/lib/data/.videos-source-sha` records `four_commit_sha=07667658…`, `videos_json_sha256=fd15e056…`, `synced_at=2026-05-25` in the exact D-06 3-line key=value format. `_four` commit reachable via `git -C ../michelle_ngo_four cat-file -e`.

## Task Commits

1. **Task 1: Mirror videos.json + 4 loader source files + 4 test files verbatim from `_four`** — `ca70afc` (feat)
2. **Task 2: Wire `validateVideosPlugin()` into `vite.config.ts` (top-level + both Vitest projects) and adopt the data/ui project split** — `c9950b0` (feat)
3. **Task 3: Create `.videos-source-sha` sidecar + smoke-test the build-fail behavior** — `70e3877` (feat)

**Plan metadata commit:** pending (final docs commit covers SUMMARY + STATE + ROADMAP).

## Files Created/Modified

### Created (10)

- `src/lib/data/videos.json` — 56-video catalog (43 Vimeo + 14 YouTube; PBS=18, Promos=12, Branded=8, Doc=5, Reel=4, Personal=3, Edu=3, Other=3 per D-04)
- `src/lib/data/categories.ts` — `CATEGORIES` tuple + `categoryToSlug()` rule + `slugToCategory` memoized lookup + `Category` type
- `src/lib/data/schema.ts` — `CategorySchema` + `VideoSchema` (Zod 4: `z.strictObject` + `z.discriminatedUnion('source', [...])` + `z.iso.date()`) + `VideoArraySchema` + `Video` type
- `src/lib/data/videos.ts` — `videos: readonly Video[]` (56 records, hidden-filter ready), `allVideos` (not re-exported), `producerReelId = '264677021'`, `getById`, `getByCategory`, `getCategoriesInDisplayOrder` (count-desc, ties-alpha), `getCategoriesWithCounts`
- `src/lib/data/index.ts` — 4 export statements covering 11 public names per D-24
- `src/lib/data/categories.test.ts` — slug round-trip + display-order tests
- `src/lib/data/schema.test.ts` — Zod parsing + strict-object + discriminated-union + unknown-category/empty-title/unknown-source rejections
- `src/lib/data/videos.test.ts` — loader behavior + producerReelId resolves + getByCategory PBS=18 + display order full sequence + Phase 4 featured slice (8 featured, quota 2/2/2/1/1)
- `src/lib/data/videos.json.test.ts` — 56-count + unique (source, id) + producer reel present + D-04 category counts
- `src/lib/data/.videos-source-sha` — provenance sidecar (3 lines, key=value plain text)

### Modified (1)

- `vite.config.ts` — added `validateVideosPlugin()` function + `import { VideoArraySchema }` + wired plugin into top-level `plugins:` between `tailwindcss()` and `sveltekit()` + replaced single `test:` block with `projects: [data, ui]` two-project split; moved `resolve.conditions: ['browser']` from top-level into `ui` project only.

## Decisions Made

- **Mirror, don't rewrite (D-21).** All 9 source files copied byte-for-byte. Docstrings citing `_four`'s D-numbers are correct historical provenance, not stale references. Zero `_three`-specific helpers (D-22).
- **Smoke-test via discriminated-union (D-14 source-side).** Corruption choice: change `[0].source` from `"vimeo"` to `"tiktok"`. Chosen over deleting `title` or duplicating `(source, id)` because the discriminator violation is the load-bearing schema check and produces the most pointed `z.prettifyError` output.
- **ui project include widened (Claude's discretion per D-21).** `_four`'s ui include only captures `src/lib/components/**` and `src/routes/**`. `_three`'s Phase 1 tests live at `src/lib/storage.test.ts`, `src/lib/intersectionVisibility.svelte.test.ts`, and `src/lib/smoke-page.test.ts` — added `src/lib/**/*.{test,spec}.{js,ts}` to the ui include and `exclude: ['src/lib/data/**']` to keep data tests in the data project. All 49 tests pass.
- **`_four` commit pinned to current main HEAD (D-05).** `07667658ee2fd16a3d56b66bbe832d08fc3badd5` is `_four`'s main at sync time. Not frozen to kickoff; if `_four` advanced during Phase 1 (it did), we pull forward at Phase 2 sync.

## Deviations from Plan

None — plan executed exactly as written. The only Claude's-discretion call (widening the `ui` project's `include` glob) was explicitly authorized by D-21 §"Any minor vitest.config adjustments needed if `_four`'s test file paths or `$lib` alias resolution differ slightly in `_three`'s setup."

## Issues Encountered

None. Three potential blockers existed in advance but did not bite:

- **TS strict + `noUncheckedIndexedAccess` strict mode** — `svelte-check` reported `534 FILES 0 ERRORS 0 WARNINGS` after mirroring. The mirrored loader's narrowing patterns honor the strict flag.
- **Vitest projects API in v4.1.5** — replacement of single `test:` block with `projects: [...]` accepted on first try; tests ran with `|data|` and `|ui|` labels visible.
- **Sidecar format ambiguity** — D-06 spec is unambiguous (3 lines, `key=value`, no JSON/YAML). Created via Write tool with literal computed values.

## User Setup Required

None. No external service configuration. The `_four` checkout for cross-repo source SHA pull was local-only via `git -C ../michelle_ngo_four rev-parse HEAD`.

## Smoke-Test Detail (DATA-02 verification record)

| Field | Value |
|---|---|
| Corruption | `videos.json` `[0].source` changed from `"vimeo"` to `"tiktok"` |
| Exit code | 1 (ELIFECYCLE) |
| Plugin invoked | `[plugin validate-videos]` (rolldown error format) |
| Literal error string | `videos.json failed schema validation:\n✖ Invalid discriminator value. Expected 'youtube' \| 'vimeo'\n  → at [0].source` |
| Restoration | `mv -f videos.json.bak videos.json`; `cmp -s` against `_four` exits 0 post-restore |
| Post-restore build | Exit 0; built in 2.28s; adapter-static wrote site to `build/` |

## Sidecar Detail

| Field | Value |
|---|---|
| Path | `src/lib/data/.videos-source-sha` |
| `four_commit_sha` | `07667658ee2fd16a3d56b66bbe832d08fc3badd5` |
| `videos_json_sha256` | `fd15e0568425ef8a8472b8bae856bc43a5a85810e4fb1a8f9d0cff771d8ef91c` |
| `synced_at` | `2026-05-25` |
| `_four` SHA reachable | Yes (`git -C ../michelle_ngo_four cat-file -e <sha>` exits 0) |
| Local sha matches recorded | Yes (`sha256sum src/lib/data/videos.json` equals the recorded value) |

## Vitest Project Breakdown

| Project | Env | Files | Tests | Paths |
|---|---|---|---|---|
| `data` | `node` | 4 | 35 | `src/lib/data/categories.test.ts`, `schema.test.ts`, `videos.test.ts`, `videos.json.test.ts` |
| `ui` | `jsdom` | 3 | 14 | `src/lib/storage.test.ts`, `src/lib/intersectionVisibility.svelte.test.ts`, `src/lib/smoke-page.test.ts` |
| **Total** | — | **7** | **49** | — |

## Next Phase Readiness

- **Plan 02-02 (cross-repo drift CI):** `.videos-source-sha` is in place at `src/lib/data/.videos-source-sha` — the drift-check job can read `four_commit_sha=` and `videos_json_sha256=` from it, pass the SHA to `actions/checkout@v4`'s `ref:`, byte-compare against `__four/src/lib/data/videos.json`, and surface the D-12 error annotation on mismatch.
- **Plan 02-03 (oEmbed health-check):** `src/lib/data/videos.json` is the source the standalone `scripts/check-embeds.ts` will iterate (56 records, source ∈ {`vimeo`, `youtube`}, id present per Zod schema). Drop-in compat verified.
- **Phase 3 (Reel System Core):** `import { videos, getByCategory, getById, producerReelId } from '$lib/data'` compiles unchanged. Phase 3 will add `reel-helpers.ts` (NEW file — keeps the mirrored 11-name surface stable per D-24).
- **No blockers introduced.** Phase 2 carry-forward concerns from STATE.md (REEL-04 Chromium-only ambiguity, GDPR posture, A/B traffic-split) all remain Phase 3+ / Phase 7 concerns and are unaffected by this plan.

## Self-Check

Verifying claims from this SUMMARY against the working tree and git history.

### Files Created
- FOUND: `src/lib/data/videos.json`
- FOUND: `src/lib/data/categories.ts`
- FOUND: `src/lib/data/schema.ts`
- FOUND: `src/lib/data/videos.ts`
- FOUND: `src/lib/data/index.ts`
- FOUND: `src/lib/data/categories.test.ts`
- FOUND: `src/lib/data/schema.test.ts`
- FOUND: `src/lib/data/videos.test.ts`
- FOUND: `src/lib/data/videos.json.test.ts`
- FOUND: `src/lib/data/.videos-source-sha`

### Files Modified
- FOUND: `vite.config.ts` (rewrite — validateVideosPlugin + projects)

### Commits
- FOUND: `ca70afc` Task 1 (data file mirror)
- FOUND: `c9950b0` Task 2 (vite.config.ts rewrite)
- FOUND: `70e3877` Task 3 (sidecar + smoke test)

## Self-Check: PASSED

---

*Phase: 02-data-layer*
*Plan: 01*
*Completed: 2026-05-25*
