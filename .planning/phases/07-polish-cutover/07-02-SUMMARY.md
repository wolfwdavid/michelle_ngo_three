---
phase: 07-polish-cutover
plan: 02
subsystem: assets
tags: [favicon, open-graph, twitter-card, og-image, sharp, cinematic-dark, gh-pages, nojekyll, trap-b, prerender]

# Dependency graph
requires:
  - phase: 07-polish-cutover
    provides: "Plan 07-01 layout favicon/OG <link>/<meta> head block + scripts/test-prerender-coverage.mjs requiredStaticAssets gate — the consumers of these binaries"
  - phase: 01-foundation
    provides: "@sveltejs/enhanced-img → sharp 0.34.5 on disk (the asset engine, no new runtime dep); self-hosted Source Serif 4 woff2 (D-09 wordmark family)"
  - phase: 03-reel-system-core-load-bearing-risk
    provides: "static/posters/*.jpg reel frames (the cinematic-dark backdrop source — _three's own art)"
provides:
  - "static/og-image.jpg — 1200x630 cinematic-dark OG/Twitter card (Trap B dimensional-parity asset, 23KB within 3x band of _four's 15KB)"
  - "static/favicon.ico (multi-res 16+32) + favicon-{16,32,192,512}.png + apple-touch-icon.png (180) — cinematic-dark MN monogram set"
  - "static/.nojekyll — GH Pages Jekyll guard protecting _app/ immutable assets (Pitfall 5)"
  - "scripts/build-assets.mjs — reproducible dev-only sharp asset authoring script (re-run to regenerate)"
  - "GREEN pnpm build + PASS coverage gate (closes the 07-01 RED-build window)"
affects: [07-04-trap-parity, 07-05-cutover]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reproducible binary-asset authoring via a dev-only sharp script (scripts/build-assets.mjs) — derives OG + favicon set from a darkened/blurred reel-poster composite + SVG wordmark; no new runtime dep (sharp ships via @sveltejs/enhanced-img), no image-editor dependency"
    - "OKLCH @theme → sRGB hex conversion for off-DOM image authoring (canvas #0d0d0d, cream #fff7ea, reel-accent violet) so the social card matches the live site palette byte-for-tone"
    - "Hand-assembled multi-resolution ICONDIR/ICONDIRENTRY ICO (16+32 PNG payloads) since sharp does not expose multi-frame .ico emission"
    - "Robust sharp resolution: createRequire + pnpm-store (.pnpm/sharp@*) fallback so the script runs under pnpm's non-hoisted layout"

key-files:
  created:
    - scripts/build-assets.mjs
    - static/og-image.jpg
    - static/favicon.ico
    - static/favicon-16.png
    - static/favicon-32.png
    - static/favicon-192.png
    - static/favicon-512.png
    - static/apple-touch-icon.png
    - static/.nojekyll
  modified: []

key-decisions:
  - "User selected the sharp-script approach (Task 1 checkpoint:decision, pre-resolved by orchestrator): reproducible sharp-based composite from an existing static/posters/*.jpg, no new runtime dep, _three's OWN cinematic-dark art"
  - "og-image.jpg authored at 23443 bytes — comparable filesize to _four's 15386 (within the Plan 07-04 Trap B 3x ratio band [~5129, ~46158]) while keeping the wordmark crisp at mozjpeg q82 4:2:0"
  - "Backdrop motif is a darkened (brightness 0.34) + desaturated (0.55) + blurred (6px) _three reel poster behind a cream Source-Serif wordmark + violet reel-accent hairline — distinct from _four's editorial card, honoring D-02/D-13 'own cinematic art'"
  - "Wordmark renders with a system-serif fallback when Source Serif 4 is not registered with the machine's fontconfig (librsvg limitation) — design intent (cinematic-dark serif wordmark) preserved; build never fails on a missing font"

patterns-established:
  - "Asset-authoring-as-code: binaries are regenerable from scripts/build-assets.mjs, so the cinematic art is reviewable/diffable as a script rather than an opaque editor export"

requirements-completed: [POL-01, POL-05]

# Metrics
duration: 15min
completed: 2026-05-28
---

# Phase 7 Plan 02: Cinematic-Dark Favicon Set + 1200x630 OG Image + .nojekyll Summary

**Authored _three's OWN cinematic-dark social/favicon art via a reproducible sharp script — a 1200x630 OG card (Trap B dimensional parity with _four) and a multi-size MN-monogram favicon set + .nojekyll — flipping the 07-01 RED build GREEN and the coverage gate to PASS.**

## Performance

- **Duration:** ~15 min (active execution)
- **Completed:** 2026-05-28
- **Tasks:** 2 (1 pre-resolved decision checkpoint, 1 auto)
- **Files created:** 9 (8 static binaries + .nojekyll, 1 dev script)

## Accomplishments

- **og-image.jpg authored at EXACTLY 1200x630** (Trap B parity precondition verified by sharp probe), 23443 bytes — comfortably inside Plan 07-04's Trap B comparable-filesize band relative to `_four`'s 15386-byte card.
- **Cinematic-dark OG composition** that is `_three`'s OWN art: a darkened + desaturated + blurred reel poster (`static/posters/vimeo-714107646.jpg`) as a screening-room backdrop, a vignette + bottom-floor gradient for wordmark contrast, the cream "Michelle Ngo" serif wordmark, a "FILMMAKER & PRODUCER" tagline, and a violet reel-accent hairline — visually distinct from `_four`'s editorial card.
- **Favicon set (6 files)** authored from a 512x512 cinematic-dark "MN" monogram master (cream Source-Serif on a dark rounded canvas with a violet reel-accent ring): `favicon.ico` (hand-assembled multi-res 16+32), `favicon-16/32/192/512.png`, `apple-touch-icon.png` (180x180, flattened opaque so iOS adds no corner halo).
- **`static/.nojekyll`** written (Pitfall 5 — disables GH Pages Jekyll so SvelteKit's `_app/` immutable assets survive deploy).
- **Reproducible `scripts/build-assets.mjs`** kept in-tree: re-running it regenerates byte-stable output; no new runtime dependency (sharp already ships via `@sveltejs/enhanced-img`), no image-editor dependency.
- **Closed the 07-01 RED-build window:** `pnpm build` is GREEN (favicon `<link>` hrefs now resolve under strict prerender) and `node scripts/test-prerender-coverage.mjs` flipped to PASS (exit 0) — its `requiredStaticAssets` check was the only failing assertion left in Wave 1.

## Task Commits

1. **Task 1: Decide OG/favicon asset authoring approach** — checkpoint:decision, pre-resolved by orchestrator as **sharp-script**. No code commit (decision gate only); rationale recorded in Decisions below.
2. **Task 2: Produce the favicon set + 1200x630 og-image.jpg + .nojekyll** — `890bbf4` (feat). Includes the 8 static binaries, `.nojekyll`, and the reproducible `scripts/build-assets.mjs`.

## Files Created/Modified

- `scripts/build-assets.mjs` (created) — Dev-only sharp authoring script. Resolves sharp via `createRequire` + pnpm-store fallback; composites the 1200x630 OG (poster backdrop + SVG vignette/gradient/wordmark overlay, mozjpeg quality ladder to hit the Trap B filesize band); builds a 512x512 monogram master → 6 favicon exports; hand-assembles the multi-res ICO; writes `.nojekyll`. Self-verifies the OG is exactly 1200x630 before returning.
- `static/og-image.jpg` (created) — 1200x630, 23443 bytes, cinematic-dark OG/Twitter card.
- `static/favicon.ico` (created) — multi-res ICO, type=1, 2 images [16, 32].
- `static/favicon-16.png` / `favicon-32.png` / `favicon-192.png` / `favicon-512.png` (created) — MN-monogram PNG favicons at the four sizes the layout head references.
- `static/apple-touch-icon.png` (created) — 180x180 opaque (flattened onto the dark canvas).
- `static/.nojekyll` (created) — empty GH Pages Jekyll guard.

## Decisions Made

- **Task 1 decision: sharp-script approach** (pre-resolved by the orchestrator before this executor ran). Rationale: reproducible sharp-based crop/composite derived from an existing `static/posters/*.jpg`, no new runtime dependency (sharp already on disk via `@sveltejs/enhanced-img`), and it is `_three`'s OWN cinematic frame — satisfying the D-02/D-13 "own art" intent without an image-editor or `realfavicongenerator.net` round-trip. Chosen over `cinematic-real` (most wall-clock, manual editor work) and `placeholder-backlog` (the `_four` 67-byte-placeholder path, which violates `_three`'s prescriptive "own cinematic art").
- **Composite over straight crop.** A literal crop of a 295x166 WebP poster up to 1200x630 would be a ~4x upscale (soft, blocky). Instead the poster is a *darkened/blurred backdrop motif* behind a vector wordmark — honoring the CONTEXT D-13 discretion ("cinematic-dark 1200x630 composition derived from a hero poster crop with optional wordmark") and yielding a crisp, intentional card at the right dimensions.
- **Filesize tuned to the Trap B band.** mozjpeg q82 + 4:2:0 lands at 23443 bytes; `_four`'s card is 15386 bytes. 23443 is within the 3x ratio band [~5129, ~46158] the Plan 07-04 Trap B gate will check, while keeping the wordmark readable. A quality ladder (82→44) in the script auto-backs-off if a future backdrop pushes filesize past ~38KB.
- **OKLCH → sRGB palette match.** Canvas `#0d0d0d` (neutral-950 `oklch(0.16 0 0)`), cream `#fff7ea` (`oklch(0.98 0.02 80)`), reel-accent violet — converted from `src/app.css`'s `@theme` so the social card tones match the live site.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Visual bug] Favicon monogram overflowed the canvas**
- **Found during:** Task 2 (visual verification of the rendered 512px favicon master)
- **Issue:** Initial SVG used `font-size="288" letter-spacing="-6"` for the "MN" monogram, which spilled the glyphs past the rounded accent ring and clipped at the canvas edges (illegible as a contained mark, especially down-scaled to 16/32px tab sizes).
- **Fix:** Reduced to `font-size="210" letter-spacing="4"`, nudged baseline to `y="52%"`, regenerated. "MN" now sits cleanly inside the violet ring with breathing room and reads legibly at 32px and 16px.
- **Files modified:** `scripts/build-assets.mjs`
- **Commit:** `890bbf4` (the corrected script + regenerated binaries committed together)

### Known limitation (documented, not a defect)

**Source Serif 4 wordmark renders via system-serif fallback when fontconfig lacks the font.** librsvg (sharp's SVG renderer) resolves SVG `font-family` through the host fontconfig, not the project's `static/fonts/*.woff2`. On a machine where Source Serif 4 is not system-registered, the wordmark falls back to `Georgia, 'Times New Roman', serif`. This is a graceful degradation (design intent — a cinematic-dark *serif* wordmark — is preserved) and the build never fails on a missing font. To render the exact Source Serif 4 face, register the woff2 with fontconfig (or convert to TTF in a system font dir) before re-running `scripts/build-assets.mjs`; the output is regenerable on demand.

---

**Total deviations:** 1 auto-fixed (Rule 1 visual bug); 0 architectural; 0 deferred.
**Impact on plan:** None — plan executed via the chosen sharp-script path; all acceptance criteria met.

## Issues Encountered

- **sharp not hoisted under pnpm.** `require('sharp')` from the repo root fails because pnpm keeps it non-flat at `node_modules/.pnpm/sharp@0.34.5/node_modules/sharp`. Resolved in the script with a `createRequire` candidate list that globs the `.pnpm` store for any `sharp@*` and imports the resolved entry — robust across sharp version bumps.

## Verification Results

- **OG dimensions (Trap B):** `sharp('static/og-image.jpg').metadata()` → width 1200, height 630 — EXACTLY. Strict probe (`if(width!==1200||height!==630)process.exit(1)`) exits 0.
- **All 7 required static assets present in `static/`:** favicon.ico, favicon-16.png, favicon-32.png, favicon-192.png, favicon-512.png, apple-touch-icon.png, og-image.jpg — all `test -f` pass.
- **`static/.nojekyll` exists** (0 bytes).
- **Favicon sizes probed:** 16x16, 32x32, 192x192, 512x512 PNGs; apple-touch 180x180; favicon.ico = valid ICONDIR type 1, 2 images [16, 32].
- **`pnpm build`** → GREEN (built in ~3s; no favicon 404 under strict prerender). All 7 assets + `.nojekyll` copied into `build/`.
- **`node scripts/test-prerender-coverage.mjs`** → **PASS (exit 0)**: work/index + 8 categories + 56 watch + pbs/press/about/contact + sitemap (70 URLs) + all favicon/og-image binaries present.
- **Filesize:** og-image.jpg = 23443 bytes (within the Trap B 3x band of _four's 15386).

## Known Stubs

None. The 8 binaries are real, authored cinematic-dark art (not placeholder squares or copied `_four` assets). No empty-data/placeholder stubs introduced.

## User Setup Required

None — no external service or credential configuration required. (Optional: to render the exact Source Serif 4 face in the wordmark, register `static/fonts/source-serif-4-*.woff2` with the host fontconfig and re-run `node scripts/build-assets.mjs`.)

## Next Phase Readiness

- **Plan 07-04 (Trap parity):** og-image.jpg is at the locked 1200x630 with a comparable filesize to `_four`'s card — the Trap B dimensional/filesize-parity gate has its `_three` asset to diff against. The layout's `og:image:width=1200`/`og:image:height=630` markers (from 07-01) align with the binary.
- **Plan 07-05 (Cutover):** `.nojekyll` is in place so the GH Pages deploy won't strip `_app/`. The favicon set resolves with no browser-tab/iOS home-screen 404s.
- **Build + coverage gate are GREEN** — Wave 1's only remaining RED assertion (the static-asset check) is closed; downstream CI/cutover work proceeds on a green tree.

## Self-Check: PASSED

- All 9 created files present on disk (8 static binaries + .nojekyll + scripts/build-assets.mjs).
- Task 2 commit hash `890bbf4` found in git log.

---
*Phase: 07-polish-cutover*
*Completed: 2026-05-28*
