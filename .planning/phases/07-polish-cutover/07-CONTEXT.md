# Phase 7: Polish & Cutover - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Make `_three` production-ready and A/B-eligible against `_four`, then stage (but do not necessarily fire) the production cutover. Tune the existing 7 routes / 56 videos — no new pages, no new components. Phase 7 measures, fixes, adds metadata, mitigates the 5 A/B-integrity traps, closes the deferred real-device QA backlog, and commits cutover infrastructure that fires **only if `_three` wins the A/B vs `_four`**.

In scope (POL-01..05 + FOUND-03):
- Per-page `<title>` + meta descriptions, sitewide OG/Twitter cards, Person JSON-LD on `/about`, VideoObject JSON-LD audit on every `/watch/[id]`, build-time `sitemap.xml` endpoint (70 URLs)
- Lighthouse CI gating `/` LCP < 2.5s on simulated 4G (warning-only initially, blocking pre-cutover)
- axe-core in CI catching WCAG AA on every PR
- CLS / `100svh` grep verification on poster→iframe swap (POL-03)
- The 5 A/B-integrity traps mitigated explicitly (A done Phase 2, D done Phase 1; B/C/E this phase)
- Consolidated real-device QA matrix closing Phase 3 (BrowserStack 7-OS + iPhone thermal) + Phase 5 (7 surface UAT items) deferrals + a `_four`-style 21-cell responsive sweep
- Production cutover infrastructure: `static/CNAME` = `michellengo.net`, `deploy-production.yml`, atomic noindex flip, 9-step Launch Runbook — ready, reversible, A/B-winner-gated

Out of scope (deferred / locked elsewhere):
- New pages, routes, or components (Phase 7 is polish only)
- Analytics / Plausible (v2) — directly constrains the A/B mechanism (see D-09)
- Contact form, CMS, newsletter, i18n, search/filter (Out of Scope per REQUIREMENTS.md)
- Re-authoring `videos.json` or diverging IA (would break the A/B — the whole point of the traps)
- Pre-generated MP4 preview clips (v2 PERF-V2-01)
- Light-mode palette (explicit dark-only design statement)

</domain>

<decisions>
## Implementation Decisions

### A/B integrity traps
- **D-01:** **Trap verification = mechanical CI gates where checkable + a manual pre-cutover checklist for judgment calls.** Extend `_three`'s proven gate patterns (the `drift-check` job in `deploy.yml`, the D-17 grep gate that fails on raw `localStorage`) to every trap that reduces to a script. The 5 traps and their status:
  - **Trap A (videos.json drift):** DONE — Phase 2 `drift-check` CI job (DATA-04) clones `_four` at pinned SHA and byte-compares. No new work; verify it still passes.
  - **Trap B (OG asymmetry):** New this phase — see D-02.
  - **Trap C (sitemap canonical):** New this phase — see D-03.
  - **Trap D (shared localStorage):** DONE — Phase 1 D-17 grep gate enforces `mnp_three_*` namespace on the shared `wolfwdavid.github.io` origin. No new work; verify it still passes.
  - **Trap E (divergent entry routes):** New this phase — see D-04.
- **D-02:** **Trap B — OG image: same frame, cinematic art.** `_three`'s OG image is its own cinematic-dark composition, NOT a reuse of `_four`'s editorial art. The A/B tests *design*, so the visual SHOULD differ. The MITIGATION is dimensional parity: identical 1200×630 dimensions + comparable filesize so iMessage/Slack/social crops render identically across both siblings (POL-05 "identical OG image dimensions"). Verify via grep (meta tags) + filesize/dimension diff against `_four`'s OG asset.
- **D-03:** **Trap C — sitemap/canonical: both siblings noindex until a winner exists.** During the A/B both staging URLs live on `wolfwdavid.github.io`; both stay `noindex` so the two staging URLs never compete in search or split link equity. Only the WINNER flips to `index` + emits the `michellengo.net` canonical at cutover (the atomic flip per D-12). The loser stays `noindex`. `_three`'s sitemap is built and prerendered but its open-policy/canonical only matters post-cutover for the winner.
- **D-04:** **Trap E — route parity: mechanical CI route-manifest diff.** Add a CI check (same mechanism as the videos.json `drift-check`) that enumerates `_three`'s prerendered routes at build and compares them against `_four`'s pinned route list; fails CI on any IA divergence. Strongest guarantee that the A/B isolates design, not information architecture. (Note: STATE.md historically labeled the A/B *traffic-split mechanism* "Trap E" — that concern is handled separately as the A/B winner mechanism in D-09; the roadmap's canonical Trap E is "divergent entry routes," which is what this decision mitigates.)

### Real-device QA matrix
- **D-05:** **One consolidated `07-QA-MATRIX.md` sign-off artifact** covering all three QA sources — Phase 3 reel-risk matrix + Phase 5 surface UAT + the responsive sweep — as a single go/no-go document that gates cutover. Mirrors `_four`'s `07-QA-MATRIX.md` pattern. Updates/supersedes the partial `03-HUMAN-UAT.md` and `05-HUMAN-UAT.md` deferral trackers.
- **D-06:** **Cutover hardware gate = full BrowserStack 7-OS matrix + iPhone thermal, all green.** Honors Phase 3 D-13/D-14 literally: the reel is the load-bearing bet, so the 7-OS × 4-pillar BrowserStack matrix (iOS Safari 16 / 17.0 / 17.1 / 17.2+, Chrome Android, Firefox desktop, Safari macOS) AND the physical iPhone 5-minute thermal test (delta ≤ 8%) must pass before cutover fires. Escalation branches pre-sketched in `03-VERIFICATION.md` (Branch A: 360p ±1 quality cap; Branch B: D-09 reversal to current-only-plays). BrowserStack subscription activation + manual session runs are a known pre-cutover dependency.
- **D-07:** **All 7 Phase 5 surface UAT items fold into the same hardware pass.** Hero iframe attach/play, hero unmount-to-poster, watch chrome-fade on real Vimeo, HERO-03 sound-on autoplay, WATCH-05 back-nav reel restore, cross-route rail restore, axe staging spot-check (per `05-HUMAN-UAT.md`). They share the cross-origin postMessage / sticky-activation non-determinism that only real devices resolve — verified on the same BrowserStack/iPhone run as the reel matrix.
- **D-08:** **Responsive sweep = `_four`'s 21-cell single-pass.** 3 breakpoints (mobile ≤640 / tablet ~768 / desktop ≥1280) × 7 routes = 21 cells, walked once → numbered punch list → fix all listed items in one pass → ship. Bounded (no audit-fix-audit loop), parity with `_four` D-18/D-20. Methodology: Chrome DevTools mobile emulation primary + the real-iPhone pass from D-06 as the iOS Safari spot-check; real-Android not required (DevTools emulation is the Android contract).

### Cutover & A/B gating
- **D-09:** **A/B winner = manual side-by-side declaration by the user (Claude's discretion confirms: no measured split is viable).** Analytics is out-of-scope/v2 for BOTH siblings, so there is no measurement infrastructure and a traffic-split test would violate the no-analytics constraint. Both staging URLs already exist (`wolfwdavid.github.io/michelle_ngo_three/` vs `…_four/`); the user + Michelle review both and the user declares the winner with an explicit call. **The cutover is hard-gated on that explicit declaration** — Phase 7 builds and verifies everything cutover-ready, but the DNS flip does not fire autonomously.
- **D-10:** **GDPR posture = inherit `_four`'s no-CMP "interaction-as-consent."** No cookie-consent banner. Same corpus, same Vimeo/YouTube embeds, same hiring-producer audience as `_four`, which already ships this posture. Consistency keeps the A/B clean and avoids new consent chrome that would itself bias the design comparison.
- **D-11:** **Cutover sequence = verify-then-flip with DNS-revert rollback (parity with `_four` D-03).** Verify the apex serves the new `_three` build via `curl --resolve` / hosts-file override BEFORE touching DNS; lower registrar TTL to 300s pre-swap; rollback = revert registrar DNS records to WordPress.com. The 9-step Launch Runbook is reviewable end-to-end and reversible. Apex IPs + `www` CNAME per GitHub Pages custom-domain docs.
- **D-12:** **The noindex→index flip is one atomic commit, the LAST commit before the DNS swap — winner only.** Two edits in one commit: remove the `noindex` robots meta from the layout head, and replace `static/robots.txt` `Disallow: /` with `Allow: /` + `Sitemap: https://michellengo.net/sitemap.xml`. Inherits `_four` D-16. Search engines see the open policy from the first crawl on `michellengo.net`. If `_three` loses, this commit never lands and `_three` stays `noindex`.

### SEO & metadata
- **D-13:** **Mirror `_four`'s metadata blueprint verbatim; only the OG image art + favicon rendering go cinematic-dark.** Adopt `_four` Phase 7 D-11..D-17 in shape: `<Page> — Michelle Ngo` title format (home stays brand-only), per-route `<meta name="description">`, sitewide OG + Twitter `summary_large_image`, Person JSON-LD on `/about`, VideoObject JSON-LD on `/watch/[id]`, prerendered `sitemap.xml` endpoint, full multi-size favicon set. Parity is the precondition of a fair A/B — the metadata layer is NOT part of the design comparison, so it must not introduce noise. The favicon is a cinematic-dark wordmark/letter-mark; the OG image is the cinematic-dark composition from D-02.
- **D-14:** **Sitemap: derive URL count from the build, assert it in CI.** Generate from `_three`'s actual prerendered routes — 6 static pages (`/`, `/work`, `/pbs-american-portrait`, `/press`, `/about`, `/contact`) + 8 `/work/[category]` slugs + 56 `/watch/[id]` = **70 URLs**. Assert the count in the prerender-coverage check (extend `_four`'s `scripts/test-prerender-coverage.mjs` equivalent). The build is authoritative; the roadmap's "70" is the expected target the assertion pins. Implementation: `src/routes/sitemap.xml/+server.ts` with `prerender = true`, no new dep.
- **D-15:** **VideoObject JSON-LD audit = validate all 56 + confirm Person.** Phase 5 already injects VideoObject per `/watch/[id]` (single template, payload shape logged in STATE.md). POL-01 is an audit-and-close: validate all 56 payloads against schema.org, confirm Person JSON-LD on `/about` (shipped Phase 6), fix any gaps. Not a re-implementation — a verification with gap closure.
- **D-16:** **Per-page description copy tuned to `_three`'s cinematic voice.** Keep `_four`'s description schema (one line, ≤155 chars) but tune wording to the cinematic-immersive framing where it reads better. Descriptions are SEO-only and not part of the design A/B, so differentiation is low-risk. The schema is locked; the words are Claude's to tune (some may want a verbatim-copy checkpoint for `/` and `/about` if framing is sensitive).

### Perf (locked by roadmap + parity — not separately discussed)
- **D-17:** **Lighthouse CI gates `/` LCP < 2.5s on simulated 4G** (looser than `_four`'s 2.0s per the cinema-first budget). Warning-only initial posture, blocking pre-cutover. `_three`'s LCP element on `/` is the hero POSTER image (the hero iframe is deferred until interaction/1s idle per Phase 5), so the escalation path differs from `_four`'s static-WebP `<picture>`+AVIF route — measure first, escalate only if the poster path misses 2.5s. JSON report committed to `07-LIGHTHOUSE.json` for traceability.

### Claude's Discretion
- **A/B winner mechanism implementation** — D-09 sets manual declaration; the exact ritual (side-by-side review session, who signs off) is the user's to run. Claude only builds the cutover infra that the declaration unlocks.
- **OG image authoring** — recommend a cinematic-dark 1200×630 composition derived from a hero poster crop with optional wordmark; no design-tool dependency; ship the crop as-is if compositing complicates.
- **Favicon authoring** — single 512×512 cinematic-dark master → export ico (16+32) / 192 / 512 / apple-touch (180); any image editor + realfavicongenerator.net.
- **Sitemap endpoint pattern** — `src/routes/sitemap.xml/+server.ts` returning templated XML, `prerender = true`; tiny helper only if the manual template gets hairy.
- **Lighthouse CI tooling** — `@lhci/cli autorun` against staging, or plain `npx lighthouse` captured by hand; either way JSON lands in `07-LIGHTHOUSE.json`.
- **Description copy tuning** — D-16 locks the shape; wording is Claude's, with an optional user checkpoint for `/` and `/about`.
- **Whether the route-manifest diff (D-04) lives in `deploy.yml` alongside `drift-check` or as a standalone job** — planner's call; reuse the existing `__four/` checkout the drift-check already sets up.

### Folded Todos
*None — `gsd-tools todo match-phase 7` returned `todo_count: 0`.*

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 7 requirements + success criteria
- `.planning/REQUIREMENTS.md` §Polish & Cutover — **POL-01** (SEO/JSON-LD/sitemap), **POL-02** (LCP < 2.5s Lighthouse CI), **POL-03** (CLS/`100svh`), **POL-04** (axe CI + real-device QA matrix), **POL-05** (`mnp_three_*` + OG dimension parity); §Foundation **FOUND-03** (cutover infrastructure)
- `.planning/ROADMAP.md` §Phase 7: Polish & Cutover — goal, depends-on Phase 6, 6 success criteria (note SC#1 sitemap "70 URLs", SC#4 7-OS QA matrix, SC#5 Trap B/D, SC#6 A/B-winner-gated cutover)

### The parity blueprint (THE most important ref — `_four` shipped this phase fully)
- `../michelle_ngo_four/.planning/phases/07-polish-production-cutover/07-CONTEXT.md` — the authoritative blueprint `_three`'s metadata/cutover decisions mirror (D-11..D-17 metadata, D-01..D-06 hosting/cutover, D-16 noindex flip, D-17 sitemap, D-18..D-20 QA sweep). D-13 (titles), D-14 (descriptions), D-15 (JSON-LD), D-12 (OG) define the exact shapes to replicate.
- `../michelle_ngo_four/.planning/phases/07-polish-production-cutover/07-QA-MATRIX.md` — the 21-cell responsive-sweep doc pattern D-08 adopts
- `../michelle_ngo_four/.planning/phases/07-polish-production-cutover/07-LIGHTHOUSE.json` — Lighthouse report artifact shape D-17 produces
- `../michelle_ngo_four/src/routes/sitemap.xml/+server.ts` — sitemap endpoint pattern D-14 replicates (adjust route set to `_three`'s 70)
- `../michelle_ngo_four/.github/workflows/deploy.yml` + any `deploy-production.yml` — cutover workflow + BASE_PATH split D-11 mirrors

### Deferred QA backlog that Phase 7 closes (D-05/D-06/D-07)
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-HUMAN-UAT.md` — Test 1 (BrowserStack 7-OS × 4-pillar matrix) + Test 2 (iPhone thermal, delta ≤ 8%); both `blocked` pending pre-cutover window
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-VERIFICATION.md` §BrowserStack Real-Device Matrix + §Thermal QA — the 28-cell matrix template + escalation Branches A/B
- `.planning/phases/05-hero-watch/05-HUMAN-UAT.md` — the 7 surface UAT items (hero attach/play/unmount, watch chrome-fade, HERO-03 sound-on, WATCH-05 back-nav + cross-route restore, axe staging spot-check)

### A/B integrity trap sources
- `.planning/ROADMAP.md` §Phase 7 SC#5 — the 5 traps enumerated (A videos.json drift, B OG asymmetry, C sitemap canonical, D shared localStorage, E divergent entry routes)
- `.planning/STATE.md` §Blockers/Concerns — EU GDPR posture (D-10) + A/B traffic-split mechanism (D-09) both flagged "required before Phase 7 cutover"; REEL-04 Chromium-only ambiguity resolved in Phase 3
- Phase 2 `drift-check` job in `.github/workflows/deploy.yml` — Trap A (DONE); the mechanism D-04 route-manifest diff reuses (`__four/` pinned-SHA checkout)
- Phase 1 D-17 grep gate (scans `src/` for raw `localStorage` outside `$lib/storage.ts`) — Trap D (DONE); the mechanical-gate template D-01 extends

### Project-wide context
- `.planning/PROJECT.md` Constraints — Performance "cinema-first not speed-first, LCP 2.5s on 4G" (D-17); Hosting "adapter-static → GitHub Pages, D-05 carried forward"; Domain "`michellengo.net` stays on WordPress until A/B winner chosen, staging at `wolfwdavid.github.io/michelle_ngo_three/`" (D-09/D-11/D-12); Bandwidth ethics "cellular = poster + tap-to-play"
- `.planning/PROJECT.md` Key Decisions — "7-route IA mirrors `_four` exactly" (D-04 Trap E), "Reuse `_four`'s videos.json byte-for-byte" (Trap A), "LCP budget 2.5s vs `_four`'s 2.0s" (D-17), "GitHub Pages staging" (D-11)

### Source files Phase 7 touches (current `_three` state)
- `src/routes/+layout.svelte` — sitewide `<svelte:head>`; D-12 (noindex flip) + D-13 (favicons, OG/Twitter meta) extend it; check current robots-meta state
- `static/robots.txt` — D-12 flips `Disallow: /` → `Allow: /` + Sitemap directive (winner only)
- `static/CNAME` — D-11 creates containing `michellengo.net` (does not exist yet)
- `static/favicon.png` — Phase 1 placeholder; D-13 adds the cinematic multi-size set
- `src/routes/watch/[id]/+page.svelte` — VideoObject JSON-LD already injected (Phase 5); D-15 audits
- `src/routes/about/+page.svelte` — Person JSON-LD already injected (Phase 6 D-21); D-15 confirms
- `src/lib/components/ContactBlock.svelte` — IMDb/LinkedIn personalized-URL swap is a pre-cutover HUMAN-UAT blocker (CONT-02); fold into D-05 checklist
- `.github/workflows/deploy.yml` — has `drift-check` job (Trap A); D-04 adds route-manifest diff; D-11 adds/forks production-deploy variant without `BASE_PATH`
- `svelte.config.js` — `paths.base = process.env.BASE_PATH ?? ''` already supports the per-env split (D-11)

### External references (planner consults at plan-phase)
- GitHub Pages custom domain — https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site (D-11)
- schema.org Person + VideoObject — https://schema.org/Person, https://schema.org/VideoObject (D-15)
- OG protocol — https://ogp.me/ (D-02 dimensions + D-13 property names)
- Lighthouse CI — https://github.com/GoogleChrome/lighthouse-ci (D-17)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 2 `drift-check` CI job** (`.github/workflows/deploy.yml`) — already clones `_four` at a pinned SHA into `__four/` and byte-compares. D-04 route-manifest diff reuses this exact checkout + comparison shape; D-02 OG-dimension diff can compare against `__four/`'s OG asset the same way.
- **Phase 1 D-17 grep gate** — the canonical "scan `src/` and fail CI with `::error::` annotations" template. D-01 extends this pattern for any new mechanical trap gate. Trap D is already enforced by it.
- **`_four`'s shipped Phase 7** (`../michelle_ngo_four/`) — every metadata file, the sitemap endpoint, the QA-matrix doc, the cutover workflow, and the Lighthouse report already exist as working reference implementations to mirror.
- **`src/lib/data` exports** (`videos`, `getCategoriesInDisplayOrder` / category helpers) — feed both the D-14 sitemap (70 URLs) and the D-15 VideoObject audit (56 records); zero new data authoring.
- **VideoObject JSON-LD template** (`src/routes/watch/[id]/+page.svelte`, Phase 5) + **Person JSON-LD** (`src/routes/about/+page.svelte`, Phase 6 D-21) — already shipped; D-15 audits rather than authors.
- **`src/routes/+layout.svelte` `<svelte:head>`** — the single home for sitewide title/robots/favicon/OG; D-12 + D-13 batch their edits here.
- **`adapter-static` + `prerender = true` + `trailingSlash = 'always'`** (Phase 6 D-13) — every metadata/sitemap addition prerenders at build; no runtime needed.

### Established Patterns
- **Mechanical CI drift guards with `::error::` annotations** (drift-check, D-17 grep gate) — the house style for A/B-integrity enforcement; D-01/D-02/D-04 all follow it.
- **`<svelte:head>` per-route head edits, deepest title wins** — D-13 titles/descriptions + D-15 JSON-LD follow this.
- **`+server.ts` + `prerender = true` for non-HTML routes** — D-14 sitemap endpoint.
- **Deferred-UAT trackers as YAML-frontmatter `*-HUMAN-UAT.md`** (Phase 3, Phase 5) — D-05 consolidates these into `07-QA-MATRIX.md`.
- **Pinned-exact deps, no new runtime JS** — `_four`'s Phase 7 D-09 "no new JS deps" norm carries; sitemap/JSON-LD/metadata are all dep-free.

### Integration Points
- **CREATE** `static/CNAME` (D-11), cinematic favicon set + `static/og-image.*` (D-13), `src/routes/sitemap.xml/+server.ts` (D-14), `07-QA-MATRIX.md` + `07-LIGHTHOUSE.json` (D-05/D-17), `deploy-production.yml` or a workflow_dispatch variant (D-11)
- **EDIT** `.github/workflows/deploy.yml` (add D-04 route-manifest diff; wire D-17 Lighthouse CI; D-12/POL-04 axe-in-CI if not already), `src/routes/+layout.svelte` (D-12 noindex flip + D-13 favicons/OG — winner-gated for the flip), `static/robots.txt` (D-12 flip), per-route `+page.svelte` files (D-13 titles/descriptions where missing), `ContactBlock.svelte` (IMDb/LinkedIn swap — pre-cutover blocker)
- **VERIFY** Phase 2 `drift-check` (Trap A) + Phase 1 D-17 grep gate (Trap D) still pass; all 56 VideoObject + Person JSON-LD valid (D-15)

</code_context>

<specifics>
## Specific Ideas

- **The A/B is the spine of this phase.** Every trap decision (D-01..D-04) exists so the comparison isolates *design*, not data/IA/social-rendering. `_three` "winning" means the cinematic-immersive direction beats `_four`'s editorial-modern on the same catalog, same routes, same metadata frame.
- **Cutover is staged, not fired.** Phase 7 makes `_three` cutover-ready and reversible; the DNS flip is hard-gated on the user's explicit "_three wins" declaration (D-09). The deliverable is a *ready, reviewable, reversible runbook* — not a launched site.
- **The reel matrix is the load-bearing QA.** Phase 3's whole risk thesis (14 of 20 pitfalls cluster in the reel) was verified at code level and deferred to this phase for real-device sign-off. D-06's full BrowserStack + thermal gate is the moment that bet gets settled. If it fails, escalation Branches A/B (360p cap, then current-only-plays) are pre-sketched.
- **Parity is a feature, not laziness.** "Mirror `_four`" (D-13) is a deliberate A/B-integrity choice: the metadata layer must be invisible to the comparison so the only variable is the design language.

</specifics>

<deferred>
## Deferred Ideas

- **Traffic-split / measured A/B with analytics** — rejected per D-09; analytics is out-of-scope/v2 for both siblings, so the winner is declared by manual side-by-side review.
- **Adding a CMP / cookie-consent banner** — rejected per D-10; inherit `_four`'s no-CMP interaction-as-consent.
- **301 redirects from legacy WordPress paths** — same clean-break posture as `_four` (D-04 there); static hosting can't do server 301s; revisit only on inbound-link telemetry (none in v1).
- **Per-page OG image variants** — sitewide single OG image is the baseline (mirrors `_four`); per-page variants are post-launch.
- **Web font for the cinematic wordmark in OG/favicon** — `_three` already self-hosts 7 woff2 fonts (Phase 1); favicon/OG art uses them at author time, not as a new runtime dep.
- **AVIF poster generation** (PERF-V2-02), **service worker** (PERF-V2-03), **MP4 preview clips** (PERF-V2-01) — all v2; D-17 measures first and escalates the poster path only if 2.5s LCP misses.
- **Real-Android device pass** — DevTools mobile emulation is the Android contract (D-08); BrowserStack Chrome Android covers the real-engine check.
- **The loser sibling's post-A/B disposition** (take down / archive / keep as staging) — project-level decision outside `_three`'s Phase 7 scope; this phase only handles `_three`'s readiness.

### Reviewed Todos (not folded)
*None — `gsd-tools todo match-phase 7` returned `todo_count: 0`.*

</deferred>

---

*Phase: 07-polish-cutover*
*Context gathered: 2026-05-28*
