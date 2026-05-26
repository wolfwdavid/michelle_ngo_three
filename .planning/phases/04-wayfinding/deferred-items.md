# Deferred Items - Phase 04 Wayfinding

## Pre-existing lint error (out of scope for Plan 04-02)
- **File**: `.lintstagedrc.cjs:15`
- **Error**: `A require() style import is forbidden (@typescript-eslint/no-require-imports)`
- **First introduced**: commit 4e2b372 (Phase 03-01)
- **Why deferred**: Pre-existing, not caused by Plan 04-02 changes (only added files under src/lib/state/ + src/app.css edit)
- **Recommendation**: Add `.lintstagedrc.cjs` to eslint ignores OR convert to ESM; track as polish task in Phase 7.

## Reel e2e test regression (Plan 04-03 fixes)
- **File**: `tests/e2e/reel.spec.ts` (Pillar 1: fast-flick test only)
- **Failure**: `activeIdx === -1` after scrolling — no article spans viewport centerline
- **Root cause**: TopNav (Plan 04-02) + FilterPillBar (Plan 04-01) added chrome above the reel; ReelStage's `h-svh` container is now partially hidden behind chrome. Articles don't span vp/2 because the reel viewport is effectively smaller.
- **Fix is chartered to Plan 04-03**: per src/routes/work/+page.svelte:8 comment + 04-CONTEXT.md D-01 — Plan 04-03 extends ReelStage's container height from `h-svh` to `h-[calc(100svh-var(--chrome-nav-height)-var(--chrome-pill-height,0px))]` so the reel doesn't sit underneath the chrome. The Pillar 1 fast-flick test will need its centerline logic updated to account for the new chrome geometry OR Plan 04-03 must also fix the test math.
- **Status**: 12/15 reel e2e tests still pass (Pillars 2, 3, 4 unaffected); Pillar 1 + 2 skipped variants pass too.
