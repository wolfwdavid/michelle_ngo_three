---
phase: 07-polish-cutover
plan: 01
subsystem: infra
tags: [seo, sitemap, json-ld, open-graph, twitter-card, favicon, prerender, sveltekit, adapter-static]

# Dependency graph
requires:
  - phase: 02-data-layer
    provides: "$lib/data exports (videos, getCategoriesInDisplayOrder, categoryToSlug) consumed by the sitemap endpoint"
  - phase: 05-hero-watch
    provides: "VideoObject JSON-LD per /watch/[id] + per-route <title>/<meta description> (audited intact here)"
  - phase: 06-pbs-press-about-contact
    provides: "Person JSON-LD on /about; trailingSlash='always'; strict prerender posture; +layout.svelte mount points"
provides:
  - "Prerendered /sitemap.xml endpoint emitting exactly 70 absolute michellengo.net URLs (6 static + 8 category + 56 watch)"
  - "scripts/test-prerender-coverage.mjs build-count gate (D-14 70-URL pin + route HTML + favicon/og-image asset check), wired as pnpm test:prerender"
  - "Sitewide favicon set + OG/Twitter (summary_large_image, 1200x630) head block in +layout.svelte"
  - "Brand-only / <title> 'Michelle Ngo' (D-13)"
  - "Audit confirmation: 56 VideoObject + 1 Person JSON-LD valid; 7/7 routes carry meta descriptions (D-15)"
affects: [07-02-favicon-og-assets, 07-03-ci-gates, 07-04-trap-parity, 07-05-cutover]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-artifact coverage gate: a standalone .mjs script asserting prerendered HTML counts + sitemap URL count + required static binaries (adapter-static strict:true doesn't catch empty enumeration or missing static assets)"
    - "Absolute-host sitemap (https://michellengo.net hardcoded, NOT env-aware) — staging emits 'wrong' host but is noindex per D-03/Trap C"

key-files:
  created:
    - src/routes/sitemap.xml/+server.ts
    - scripts/test-prerender-coverage.mjs
    - .planning/phases/07-polish-cutover/deferred-items.md
  modified:
    - src/routes/+layout.svelte
    - src/routes/+page.svelte
    - package.json

key-decisions:
  - "Known-failing pnpm build accepted as Wave-1 end-state: the layout favicon <link> hrefs 404 under strict prerender until sibling Plan 07-02 lands the binaries — identical master-broken expectation as Plan 06-01"
  - "Did NOT author favicon/og-image binaries here — that is 07-02's checkpointed design work (_three's OWN cinematic art); used temporary _four copies for verification-only then removed them"
  - "Task 3 is a clean audit confirmation with ZERO JSON-LD gaps — no template edits, hence no Task 3 code commit"

patterns-established:
  - "Coverage-gate-before-asset pattern: the gate script is authored and proven (sitemap+route assertions) before the assets it also checks exist; the asset check is the proof those binaries landed in a later plan"

requirements-completed: [POL-01]

# Metrics
duration: 30min
completed: 2026-05-28
---

# Phase 7 Plan 01: SEO Metadata — Sitemap, OG/Favicon Head Block, JSON-LD Audit Summary

**Prerendered 70-URL sitemap.xml endpoint + sitewide favicon/OG-Twitter head block + brand-only / title, with a build-count coverage gate pinning the 70-URL count and an audit confirming the already-shipped 56 VideoObject + 1 Person JSON-LD intact.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-05-28T14:07:38Z
- **Completed:** 2026-05-28T14:37:53Z
- **Tasks:** 3 (2 code, 1 audit-only)
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- `/sitemap.xml` prerendered endpoint emits exactly **70** absolute `michellengo.net` URLs (6 static + 8 category + 56 watch), ported verbatim from `_four` (data exports identical).
- `scripts/test-prerender-coverage.mjs` build-count gate ported + wired as `pnpm test:prerender`; pins the D-14 70-URL assertion and gates on the favicon/og-image binaries that Plan 07-02 lands.
- Sitewide favicon set (6 sizes) + OG/Twitter `summary_large_image` card (1200x630) added to `+layout.svelte` head; `base` imported from `$app/paths` for favicon hrefs; noindex meta + brand title preserved.
- `/` title fixed to brand-only `Michelle Ngo` (D-13); old `— Filmmaker` suffix removed.
- **Audit (D-15):** all 56 `/watch/[id]` pages carry valid VideoObject JSON-LD (name + description + thumbnailUrl + uploadDate + embedUrl + the `_three` `contentUrl` bonus); `/about` carries Person JSON-LD (`name: "Michelle Ngo"`); all 7 routes still emit `<meta name="description">`. **Zero gaps — clean confirmation, no template edits.**

## Task Commits

Each task was committed atomically:

1. **Task 1: Port sitemap.xml endpoint + prerender-coverage script + wire npm script** — `657f420` (feat)
2. **Task 2: Sitewide favicon + OG/Twitter head block + brand-only / title** — `eb2d925` (feat)
3. **Task 3: Audit-confirm shipped JSON-LD + descriptions** — no code commit (clean audit, zero gaps). Tracking doc committed as `b1d2cb8` (docs — deferred-items.md).

## Files Created/Modified

- `src/routes/sitemap.xml/+server.ts` (created) - Prerendered sitemap GET emitting 70 absolute URLs; `export const prerender = true`; imports `videos`/`getCategoriesInDisplayOrder`/`categoryToSlug` from `$lib/data`.
- `scripts/test-prerender-coverage.mjs` (created) - Build-artifact gate: ≥8 category dirs, ≥56 watch dirs, 4 content-route index.html, sitemap ≥70 `<url>`, 7 required static binaries. Exit 2 if no build/, 1 on failure, 0 on PASS.
- `.planning/phases/07-polish-cutover/deferred-items.md` (created) - Logs the out-of-scope pre-existing `.lintstagedrc.cjs` lint error.
- `src/routes/+layout.svelte` (modified) - Added `import { base }`; appended favicon set + OG/Twitter head block (1200x630 `og:image:width/height`). Noindex + brand title kept.
- `src/routes/+page.svelte` (modified) - `/` title → brand-only `Michelle Ngo` (D-13).
- `package.json` (modified) - Added `"test:prerender": "node scripts/test-prerender-coverage.mjs"` after `check:embeds`.

## Decisions Made

- **Did not author favicon/og-image binaries.** Those are Plan 07-02's checkpointed deliverable (`_three`'s OWN cinematic-dark art, `autonomous: false` with a design checkpoint). I copied `_four`'s binaries into `static/` for **verification only**, confirmed the build + full coverage script + Task 3 audit all pass, then **removed them** so the tree is clean for 07-02 to author the real assets.
- **Accepted a known-failing `pnpm build` as the Wave-1 end-state.** With strict prerender (restored in Phase 6), the new favicon `<link href="{base}/favicon.ico">` etc. 404 because the binaries don't exist until 07-02. This is the identical "master-broken expectation" established by Plan 06-01 (documented in `svelte.config.js` and STATE.md). The build fails **exclusively** on the 6 missing favicon files — proving the layout block is otherwise correct (og-image references are absolute external URLs the crawler doesn't follow, so they don't 404).
- **Task 3 produced no code commit** — the audit found zero JSON-LD gaps, so the single `/watch/[id]` template needed no edit. The plan's `<done>` explicitly allows this ("gaps, if any, closed in the single template only").

## Deviations from Plan

### Out-of-scope discoveries (logged, NOT fixed)

**1. [Scope boundary] Pre-existing lint error in `.lintstagedrc.cjs`**
- **Found during:** Task 2 (`pnpm lint` gate)
- **Issue:** `@typescript-eslint/no-require-imports` fails on line 15 `const path = require('path');`. The file is a CommonJS `.cjs` that legitimately needs `require()`, but `eslint.config.js` applies the recommended rule globally without a `.cjs` override or ignore.
- **Why not fixed:** `.lintstagedrc.cjs` is unmodified in the working tree (last touched Phase 3, commit `4e2b372`) — unrelated to this plan's metadata changes. Task 2's own files lint cleanly in isolation (`npx eslint src/routes/+layout.svelte src/routes/+page.svelte` exits 0). Per the SCOPE BOUNDARY rule, only directly-caused issues are auto-fixed.
- **Disposition:** Logged to `deferred-items.md`; suggested fix (per-file `**/*.cjs` override or ignore) routed to Plan 07-03 (CI lint/axe gate).
- **Committed in:** `b1d2cb8` (deferred-items.md)

---

**Total deviations:** 0 auto-fixed; 1 out-of-scope item deferred.
**Impact on plan:** None. The plan executed as written; the only friction (known-failing build) was explicitly anticipated by the plan's own Task 1 acceptance note and by project precedent (06-01).

## Issues Encountered

- **Strict-prerender 404 on missing favicons.** Adding the favicon `<link>` tags caused `pnpm build` to fail hard (`Error: 404 /favicon.ico (linked from /)`) because the binaries are Plan 07-02's deliverable. Resolved by recognizing this as the established Wave-1 master-broken expectation (06-01 precedent), verifying my work with temporary placeholder binaries (then removing them), and documenting the dependency in the Task 2 commit message. The build will go green when 07-02 lands the real assets.

## Verification Results

- `pnpm build` → `build/sitemap.xml` exists with **70** `<url>` entries; `/watch/` URLs = 56; `/work/` matches = 9 (8 categories + static `/work/`).
- `node scripts/test-prerender-coverage.mjs` → with binaries present: **PASS (exit 0)** — all route counts + sitemap 70 + asset set. Without binaries (Wave-1 end-state): fails only on the favicon/og-image asset check, as designed.
- `pnpm check` → 641 files, **0 errors / 0 warnings**.
- Task 2 source files lint clean (`npx eslint` on the two svelte files → exit 0); lint-staged hook (eslint --fix + prettier) passed on commit.
- `pnpm test` → **440/440 passing** (no JSON-LD / metadata regression).
- Source greps: `import { base }`=1, `og:image:width 1200`=1, `og:image:height 630`=1, `twitter summary_large_image`=1, `apple-touch-icon`=1, noindex preserved=1, `/` brand-only title=1, old suffix=0, `sitemapUrlCount`≥1, `test:prerender`=1.
- Audit: 56 VideoObject JSON-LD, 1 Person JSON-LD (`Michelle Ngo`), descriptions on all 6 static + 8 category dirs + watch samples.

## Known Stubs

None. No placeholder/empty-data stubs introduced. (The favicon/og-image binaries are NOT stubs in `_three`'s tree — they are intentionally deferred to Plan 07-02's design checkpoint; `static/` was left in its original Phase-1 state.)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 07-02 (same wave) is the immediate next step and the gating dependency:** it must author the 6 favicon binaries + 1200x630 og-image.jpg + .nojekyll into `static/` to turn `pnpm build` green again. Until then, master carries the expected known-failing build (favicon 404 only).
- The coverage gate (`pnpm test:prerender`) is ready to flip to PASS the moment 07-02's binaries land — it already proves the sitemap + route side.
- The OG `og:image:width=1200`/`og:image:height=630` markers are in place for Plan 07-04's Trap B dimensional-parity grep.
- Deferred `.lintstagedrc.cjs` lint fix awaits Plan 07-03.

## Self-Check: PASSED

All created/modified files present on disk; all task commit hashes (`657f420`, `eb2d925`, `b1d2cb8`) found in git log.

---
*Phase: 07-polish-cutover*
*Completed: 2026-05-28*
