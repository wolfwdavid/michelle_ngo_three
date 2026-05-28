# Phase 7: Polish & Cutover - Research

**Researched:** 2026-05-28
**Domain:** SEO metadata / sitemap / Lighthouse perf gate / axe a11y CI / A/B-integrity CI gates / GitHub Pages production cutover (SvelteKit + adapter-static)
**Confidence:** HIGH (parity-based — `_four` shipped this exact phase; current `_three` state directly inspected)

## Summary

Phase 7 is **heavily parity-based**. The sibling `../michelle_ngo_four` already shipped its Phase 7 across 5 plans (07-01 imdb-linkedin-swap, 07-02 production-metadata, 07-03 responsive-qa-matrix, 07-04 perf-gate, 07-05 production-cutover). Every metadata file, the sitemap endpoint, the QA-matrix doc, the cutover workflow, and the layout head block exist as working reference implementations. The planner's job is to **mirror `_four`'s shapes and identify the deltas** — NOT to invent.

Critically, `_three` has **already shipped most of the metadata** that `_four` built in 07-02: VideoObject JSON-LD on `/watch/[id]`, Person JSON-LD on `/about`, per-page `<title>` on all 7 routes, and per-page `<meta description>` on 3 of 7 routes. POL-01 is therefore largely an **audit-and-close-gaps** job, not an author-from-scratch job. The genuinely NEW work in `_three` is: (1) the `sitemap.xml` endpoint, (2) the layout-level favicon + OG/Twitter head block, (3) the `static/` binary assets (favicon set + og-image + CNAME + `.nojekyll`), (4) `test-prerender-coverage.mjs` (which `_three` does NOT have), (5) the three new CI trap gates (Trap B OG-dimension diff, Trap C sitemap/canonical policy, Trap E route-manifest diff), (6) Lighthouse CI, (7) hardening the existing axe smoke gate to all routes, (8) the consolidated QA matrix, and (9) the cutover infra (deploy-production.yml + atomic noindex flip).

The biggest divergence from `_four`: **`_four` heavily DEFERRED Phase 7** (placeholder favicon/OG assets, deferred Lighthouse measurement via a "structured-deferral payload," fast-path QA acceptance, channel-homepage IMDb/LinkedIn URLs, stop-at-infrastructure cutover runbook). `_three`'s CONTEXT.md is MORE prescriptive — D-17 says "measure first" for LCP, D-06 requires the full BrowserStack matrix to be GREEN before cutover. The planner must decide per-decision whether `_three` follows `_four`'s deferral pattern or actually executes. This is flagged loudly in each section below.

**Primary recommendation:** Mirror `_four`'s 07-02 metadata blueprint verbatim for the NEW pieces (sitemap, favicon/OG layout block, coverage script); AUDIT the already-shipped pieces (JSON-LD, titles, descriptions) and close the 5 missing descriptions + the `/` brand-only title delta; clone the `drift-check` job's `__four/` pinned-SHA checkout mechanism three times for Traps B/C/E; wire `@lhci/cli` 0.15.1 for the LCP gate and harden the existing `axe.spec.ts` to all 7 routes; build the cutover infra exactly as `_four`'s 07-05 (CNAME + deploy-production.yml + atomic D-12 flip + 9-step Launch Runbook).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**A/B integrity traps**
- **D-01:** Trap verification = mechanical CI gates where checkable + a manual pre-cutover checklist for judgment calls. Extend `_three`'s proven gate patterns (`drift-check` job in `deploy.yml`, the D-17 grep gate). The 5 traps: A (videos.json drift) DONE Phase 2; B (OG asymmetry) NEW; C (sitemap canonical) NEW; D (shared localStorage) DONE Phase 1; E (divergent entry routes) NEW.
- **D-02:** Trap B — OG image: same frame, cinematic art. `_three`'s OG image is its OWN cinematic-dark composition, NOT a reuse of `_four`'s art. Mitigation is **dimensional parity**: identical 1200×630 dimensions + comparable filesize. Verify via grep (meta tags) + filesize/dimension diff against `_four`'s OG asset.
- **D-03:** Trap C — sitemap/canonical: both siblings noindex until a winner exists. Only the WINNER flips to index + emits the `michellengo.net` canonical at cutover (atomic flip per D-12). The loser stays noindex.
- **D-04:** Trap E — route parity: mechanical CI route-manifest diff. Add a CI check (same mechanism as videos.json `drift-check`) that enumerates `_three`'s prerendered routes at build and compares against `_four`'s pinned route list; fails CI on any IA divergence. Reuse the existing `__four/` pinned-SHA checkout.

**Real-device QA matrix**
- **D-05:** One consolidated `07-QA-MATRIX.md` sign-off artifact covering all three QA sources — Phase 3 reel-risk matrix + Phase 5 surface UAT + the responsive sweep — as a single go/no-go document that gates cutover. Updates/supersedes the partial `03-HUMAN-UAT.md` and `05-HUMAN-UAT.md`.
- **D-06:** Cutover hardware gate = full BrowserStack 7-OS matrix + iPhone thermal, all green. The 7-OS × 4-pillar BrowserStack matrix (iOS Safari 16 / 17.0 / 17.1 / 17.2+, Chrome Android, Firefox desktop, Safari macOS) AND the physical iPhone 5-minute thermal test (delta ≤ 8%) must pass before cutover fires. Escalation branches pre-sketched in `03-VERIFICATION.md` (Branch A: 360p ±1 quality cap; Branch B: D-09 reversal to current-only-plays).
- **D-07:** All 7 Phase 5 surface UAT items fold into the same hardware pass.
- **D-08:** Responsive sweep = `_four`'s 21-cell single-pass. 3 breakpoints (mobile ≤640 / tablet ~768 / desktop ≥1280) × 7 routes = 21 cells, walked once → numbered punch list → fix all → ship. Bounded (no audit-fix-audit loop). Chrome DevTools mobile emulation primary + the real-iPhone pass from D-06 as the iOS Safari spot-check; real-Android not required.

**Cutover & A/B gating**
- **D-09:** A/B winner = manual side-by-side declaration by the user. No measured split (analytics out-of-scope/v2). The cutover is hard-gated on that explicit declaration — the DNS flip does not fire autonomously.
- **D-10:** GDPR posture = inherit `_four`'s no-CMP "interaction-as-consent." No cookie-consent banner.
- **D-11:** Cutover sequence = verify-then-flip with DNS-revert rollback (parity with `_four` D-03). Verify the apex serves the new `_three` build via `curl --resolve` / hosts-file override BEFORE touching DNS; lower registrar TTL to 300s pre-swap; rollback = revert registrar DNS to WordPress.com. 9-step Launch Runbook reviewable end-to-end and reversible. Apex IPs + `www` CNAME per GitHub Pages custom-domain docs.
- **D-12:** The noindex→index flip is one atomic commit, the LAST commit before the DNS swap — winner only. Two edits in one commit: remove the `noindex` robots meta from the layout head, and replace `static/robots.txt` `Disallow: /` with `Allow: /` + `Sitemap: https://michellengo.net/sitemap.xml`. Inherits `_four` D-16. If `_three` loses, this commit never lands.

**SEO & metadata**
- **D-13:** Mirror `_four`'s metadata blueprint verbatim; only the OG image art + favicon rendering go cinematic-dark. `<Page> — Michelle Ngo` title format (home stays brand-only), per-route `<meta name="description">`, sitewide OG + Twitter `summary_large_image`, Person JSON-LD on `/about`, VideoObject JSON-LD on `/watch/[id]`, prerendered `sitemap.xml`, full multi-size favicon set.
- **D-14:** Sitemap: derive URL count from the build, assert it in CI. 6 static + 8 `/work/[category]` + 56 `/watch/[id]` = **70 URLs**. Assert the count in the prerender-coverage check (extend `_four`'s `scripts/test-prerender-coverage.mjs` equivalent). Implementation: `src/routes/sitemap.xml/+server.ts` with `prerender = true`, no new dep.
- **D-15:** VideoObject JSON-LD audit = validate all 56 + confirm Person. Phase 5 already injects VideoObject per `/watch/[id]`; Person JSON-LD shipped Phase 6. POL-01 is an audit-and-close, not a re-implementation.
- **D-16:** Per-page description copy tuned to `_three`'s cinematic voice. Keep `_four`'s description schema (one line, ≤155 chars) but tune wording. Schema is locked; words are Claude's (optional verbatim-copy checkpoint for `/` and `/about`).

**Perf (locked by roadmap + parity)**
- **D-17:** Lighthouse CI gates `/` LCP < 2.5s on simulated 4G (looser than `_four`'s 2.0s). Warning-only initial posture, blocking pre-cutover. `_three`'s LCP element on `/` is the hero POSTER image (hero iframe deferred until interaction/1s idle per Phase 5), so the escalation path differs from `_four`'s static-WebP `<picture>`+AVIF route — **measure first, escalate only if the poster path misses 2.5s**. JSON report committed to `07-LIGHTHOUSE.json`.

### Claude's Discretion
- **A/B winner mechanism implementation** — D-09 sets manual declaration; the exact ritual is the user's to run. Claude only builds the cutover infra the declaration unlocks.
- **OG image authoring** — cinematic-dark 1200×630 composition derived from a hero poster crop with optional wordmark; no design-tool dependency; ship the crop as-is if compositing complicates.
- **Favicon authoring** — single 512×512 cinematic-dark master → export ico (16+32) / 192 / 512 / apple-touch (180); any image editor + realfavicongenerator.net.
- **Sitemap endpoint pattern** — `src/routes/sitemap.xml/+server.ts` returning templated XML, `prerender = true`; tiny helper only if the manual template gets hairy.
- **Lighthouse CI tooling** — `@lhci/cli autorun` against staging, or plain `npx lighthouse` captured by hand; either way JSON lands in `07-LIGHTHOUSE.json`.
- **Description copy tuning** — D-16 locks the shape; wording is Claude's, with an optional user checkpoint for `/` and `/about`.
- **Whether the route-manifest diff (D-04) lives in `deploy.yml` alongside `drift-check` or as a standalone job** — planner's call; reuse the existing `__four/` checkout.

### Deferred Ideas (OUT OF SCOPE)
- **Traffic-split / measured A/B with analytics** — rejected per D-09; winner declared by manual side-by-side review.
- **Adding a CMP / cookie-consent banner** — rejected per D-10; inherit `_four`'s no-CMP interaction-as-consent.
- **301 redirects from legacy WordPress paths** — same clean-break posture as `_four`; static hosting can't do server 301s.
- **Per-page OG image variants** — sitewide single OG image is the baseline; per-page variants are post-launch.
- **Web font for the cinematic wordmark in OG/favicon** — favicon/OG art uses the existing self-hosted fonts at author time, not as a new runtime dep.
- **AVIF poster generation (PERF-V2-02), service worker (PERF-V2-03), MP4 preview clips (PERF-V2-01)** — all v2; D-17 measures first and escalates the poster path only if 2.5s LCP misses.
- **Real-Android device pass** — DevTools mobile emulation is the Android contract (D-08); BrowserStack Chrome Android covers the real-engine check.
- **The loser sibling's post-A/B disposition** — project-level decision outside `_three`'s Phase 7 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-03 | Production cutover infrastructure ready (`static/CNAME` + `deploy-production.yml` + 9-step Launch Runbook); production deploy on `michellengo.net` apex with HTTPS, fires only if `_three` wins A/B | `_four` 07-05 PLAN/SUMMARY is the verbatim blueprint: CNAME, deploy-production.yml (BASE_PATH='' + workflow_dispatch + Verify-CNAME guard), atomic D-12 flip, 9-step runbook. `_three`'s `svelte.config.js` already has `paths.base = process.env.BASE_PATH ?? ''` (per-env hook ready). See §Cutover Infrastructure. |
| POL-01 | Per-page `<title>` + descriptions all 7 routes; sitewide OG/Twitter; Person JSON-LD on `/about`; VideoObject JSON-LD on every `/watch/[id]`; build-time `sitemap.xml` (70 URLs) | AUDIT job — titles + 2 JSON-LD already shipped in `_three`. New: sitemap endpoint (`_four` source verbatim with `_three` data exports), layout favicon/OG block, 5 missing descriptions, `/` brand-only title fix. See §Metadata Blueprint + §Sitemap. |
| POL-02 | `/` LCP < 2.5s on simulated 4G (poster first paint, hero iframe deferred); Lighthouse CI gates (warning→blocking) | `@lhci/cli` 0.15.1 `autorun` OR `npx lighthouse`; report to `07-LIGHTHOUSE.json`. Poster-first escalation path (NOT `_four`'s WebP `<picture>`). See §LCP Poster-First Path. |
| POL-03 | Zero CLS on poster→iframe swap; `100svh` (not vh/dvh) for scroll-snap sections — grep-verifiable | ALREADY SATISFIED structurally — `ReelSection`/`PosterImage`/`PreviewLoop` share `aspect-video w-full` container; `h-svh`/`calc(100svh-...)` used pervasively. POL-03 is a grep+DevTools audit. See §CLS / 100svh Verification. |
| POL-04 | axe-core CI catches WCAG AA on every PR; manual real-device QA matrix (7 OS) signs off before cutover | Existing `tests/e2e/axe.spec.ts` runs in CI via `pnpm test:e2e` — harden from `/`-only to all 7 routes. QA matrix = consolidated `07-QA-MATRIX.md` (D-05). See §axe-core in CI + §QA Consolidation. |
| POL-05 | All localStorage keys `mnp_three_*` (Trap D, DONE); OG image dimensions byte-identical to `_four` (Trap B) | Trap D = Phase 1 D-17 grep gate (verify still passes). Trap B = OG dimension diff vs `__four/static/og-image.jpg`. See §The 5 Traps. |
</phase_requirements>

## Standard Stack

**This phase adds ZERO new runtime JS deps** (CONTEXT D-13 parity + CLAUDE.md "no new runtime JS deps — sitemap/JSON-LD/metadata are all dep-free"). The only tooling additions are dev/CI-only and optional.

### Core (already installed — used by this phase)
| Library | Version (verified) | Purpose | Why Standard |
|---------|--------------------|---------|--------------|
| `@sveltejs/adapter-static` | 3.0.10 | Static export; `prerender = true` emits `sitemap.xml`, favicons, CNAME into `build/` | Already locked; GH Pages has no runtime |
| `@axe-core/playwright` | 4.11.3 (installed) | axe WCAG AA scan in Playwright e2e (POL-04) | Already installed + wired in `tests/e2e/axe.spec.ts`; runs in CI via `pnpm test:e2e` |
| `@playwright/test` | 1.60.0 (installed) | e2e harness that runs the axe scan | Already locked |

> **Version correction:** CLAUDE.md lists `@axe-core/playwright` 4.11.4 and `axe-core` 4.11.4. Verified against npm: **4.11.4 does NOT exist as a stable release** (only a prerelease `4.11.4-dad3572.0`). The latest stable is **4.11.3**, which is exactly what `_three` already has installed. STATE.md Phase 1 decision already records this pin. `axe-core` itself is NOT a direct dep (it ships transitively under `@axe-core/playwright`). Do NOT attempt to install 4.11.4.

### Supporting (CI/dev-only — optional, planner's call per D-17 discretion)
| Library | Version (verified) | Purpose | When to Use |
|---------|--------------------|---------|-------------|
| `@lhci/cli` | 0.15.1 (verified npm, bundles Lighthouse ~12.x) | `lhci autorun` against staging for the `/` LCP gate (POL-02) | If wiring Lighthouse as a reproducible CI job. CLAUDE.md recommends this. |
| `lighthouse` (standalone) | 13.3.0 (verified npm) | One-shot `npx lighthouse <url>` captured by hand | If avoiding a devDependency (`_four` used `npx lighthouse`, no install) |
| `sharp` | 0.34.x (peer of enhanced-img, already on disk) | One-shot OG-image/favicon generation IF scripting the assets | Only if NOT authoring binaries manually. `@sveltejs/enhanced-img` 0.10.4 already pulls sharp transitively. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@lhci/cli` devDependency | `npx lighthouse` one-shot | `_four` chose `npx` (zero install). `@lhci/cli autorun` gives a reproducible CI gate with assertions (`assert.assertions` block) — better fit for D-17's "warning→blocking" posture. Recommend `@lhci/cli` for the actual gate. |
| Manual favicon/OG authoring | `sharp` one-shot script | CLAUDE.md says favicon/OG "use existing fonts at author time, not a new runtime dep." sharp is already on disk via enhanced-img — a dev-only `scripts/build-assets.mjs` is acceptable. `_four` shipped placeholders and deferred. |

**Installation (only if planner opts into the Lighthouse devDependency):**
```bash
pnpm add -D @lhci/cli   # 0.15.1 — optional; npx lighthouse is the zero-install alternative
```

**Version verification (run at plan time before pinning):**
```bash
npm view @lhci/cli version            # → 0.15.1 (verified 2026-05-28)
npm view @axe-core/playwright version # → 4.11.3 (verified 2026-05-28; 4.11.4 is prerelease-only)
npm view lighthouse version           # → 13.3.0 (verified 2026-05-28)
```

## Architecture Patterns

### Current `_three` State (what already exists — AUDIT, don't re-author)

```
src/routes/
├── +layout.svelte          # head: ONLY <meta robots noindex> + <title>Michelle Ngo>. NO favicon/OG block yet.
├── +page.svelte            # <title>Michelle Ngo — Filmmaker</title>  ← D-13 says home = brand-only "Michelle Ngo" (DELTA)
│                           #   NO <meta description> (MISSING — POL-01 gap)
├── work/+page.svelte       # <title>Work — Michelle Ngo</title> ✓ + description ✓
├── work/[category]/+page.svelte  # <title>{data.category} — Michelle Ngo</title> ✓  NO description (MISSING)
├── watch/[id]/+page.svelte # <title> ✓ + description ✓ + VideoObject JSON-LD ✓ (with contentUrl — RICHER than _four)
├── pbs-american-portrait/+page.svelte  # <title> ✓  NO description (MISSING)
├── press/+page.svelte      # <title> ✓  NO description (MISSING)
├── about/+page.svelte      # <title> ✓ + description ✓ + Person JSON-LD ✓ (sameAs channel-homepage URLs)
└── contact/+page.svelte    # <title> ✓  NO description (MISSING)

static/
├── favicon.png   (67 bytes — Phase 1 placeholder)
├── robots.txt    (User-agent: * \n Disallow: /)   ← D-12 flips this, WINNER ONLY
├── fonts/        (7 self-hosted woff2 — Phase 1)
└── posters/      (poster JPEGs)
    # MISSING: CNAME, .nojekyll, favicon.ico, favicon-{16,32,192,512}.png, apple-touch-icon.png, og-image.jpg

scripts/
└── check-embeds.ts   # Phase 2 oEmbed health-check
    # MISSING: test-prerender-coverage.mjs  (_four HAS it; _three does NOT)

.github/workflows/
├── deploy.yml        # has: D-17 grep gate (Trap D), lint, check, test, e2e (incl. axe), build, deploy, drift-check (Trap A)
└── oembed-check.yml  # Phase 2 nightly
    # MISSING: deploy-production.yml (FOUND-03)
```

### Pattern 1: SvelteKit `+server.ts` prerendered endpoint (sitemap.xml)
**What:** A `GET` endpoint exporting `prerender = true` so adapter-static emits `build/sitemap.xml`.
**When to use:** D-14 sitemap (the one genuinely new POL-01 file).
**Example (from `_four`, adapt data import to `_three` — IDENTICAL exports):**
```typescript
// Source: ../michelle_ngo_four/src/routes/sitemap.xml/+server.ts (verbatim except header comment)
import { videos, getCategoriesInDisplayOrder, categoryToSlug } from '$lib/data';

export const prerender = true;

const SITE = 'https://michellengo.net';
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = ['/', '/work/', '/pbs-american-portrait/', '/press/', '/about/', '/contact/'];

export function GET() {
  const urls: string[] = [];
  for (const path of STATIC_ROUTES) {
    urls.push(`  <url><loc>${SITE}${path}</loc><lastmod>${TODAY}</lastmod></url>`);
  }
  for (const category of getCategoriesInDisplayOrder()) {
    const slug = categoryToSlug(category);
    urls.push(`  <url><loc>${SITE}/work/${slug}/</loc><lastmod>${TODAY}</lastmod></url>`);
  }
  for (const v of videos) {
    urls.push(`  <url><loc>${SITE}/watch/${v.id}/</loc><lastmod>${TODAY}</lastmod></url>`);
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
```
> `_three`'s `$lib/data/index.ts` exports `videos`, `getCategoriesInDisplayOrder`, `categoryToSlug` — VERIFIED identical to `_four`'s contract. The file drops in unchanged. Count = 6 + 8 + 56 = **70** (matches D-14/SC#1).
> **BASE_PATH note:** the absolute `https://michellengo.net` host is hardcoded (matches `_four`). Staging emits the "wrong" host but staging is noindex (D-03/Trap C), so it's harmless. `trailingSlash = 'always'` is already set (Phase 6 06-01) — all sitemap URLs use trailing slashes to match.

### Pattern 2: `<svelte:head>` JSON-LD via `{@html}` (already established in `_three`)
**What:** Inject a literal `<script type="application/ld+json">` block. Svelte's compiler treats inline `<script>` in `<svelte:head>` as a Svelte script block, so the `{@html}` + split-string trick is required.
**Example (the pattern `_three` already uses on `/watch/[id]` and `/about`):**
```svelte
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html `<script type="application/ld+json">${JSON.stringify(payload)}<` + `/script>`}
```
> Safe because the payload is `JSON.stringify` of Zod-validated (VideoObject) or hardcoded-static (Person) data. The eslint-disable is the canonical pattern (both `_three` and `_four` use it).

### Pattern 3: Sitewide favicon + OG/Twitter head block in `+layout.svelte`
**What:** One layout-level `<svelte:head>` block emits favicon `<link>`s + OG/Twitter `<meta>`s; per-route `<title>`/`<meta description>` override in each `+page.svelte`.
**Example (from `_four/src/routes/+layout.svelte` — replicate; `og:image:alt` may go cinematic):**
```svelte
<!-- D-13 Favicon set -->
<link rel="icon" type="image/x-icon" href="{base}/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="16x16" href="{base}/favicon-16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="{base}/favicon-32.png" />
<link rel="icon" type="image/png" sizes="192x192" href="{base}/favicon-192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="{base}/favicon-512.png" />
<link rel="apple-touch-icon" sizes="180x180" href="{base}/apple-touch-icon.png" />
<!-- D-02/D-13 Sitewide OG + Twitter (summary_large_image, 1200x630) -->
<meta property="og:site_name" content="Michelle Ngo" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://michellengo.net{base}/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Michelle Ngo — Filmmaker & Producer" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://michellengo.net{base}/og-image.jpg" />
```
> Requires adding `import { base } from '$app/paths';` to `_three`'s `+layout.svelte` script block (currently NOT imported there). The `noindex` meta + `<title>Michelle Ngo>` STAY (D-12 owns the noindex removal, winner-only). NOTE: `_three`'s `og:image:width/height` are the Trap B dimension-parity assertion targets (1200×630).

### Pattern 4: Mechanical CI drift gate reusing `__four/` pinned-SHA checkout (Traps B/C/E)
**What:** The `drift-check` job in `deploy.yml` already (a) reads `src/lib/data/.videos-source-sha` for the pinned `_four` SHA, (b) `actions/checkout@v4` of `wolfwdavid/michelle_ngo_four` at that SHA into `__four/`, (c) compares + fails with `::error::` annotations. Traps B and E reuse steps (a)+(b) and add their own compare step.
**When to use:** D-02 (Trap B OG-dimension diff), D-04 (Trap E route-manifest diff). D-03 (Trap C) is a policy/grep gate, not a `__four/` diff.
**Example (Trap E route-manifest diff — new step, reuses the `__four/` checkout):**
```bash
# After `pnpm build` (both repos), enumerate prerendered route dirs and compare.
# _three route manifest = sorted list of build/ subdirs that contain index.html
THREE_ROUTES=$(cd build && find . -name index.html | sed 's|/index.html||' | sort)
# _four route manifest at pinned SHA (build __four too, OR diff against a committed manifest)
FOUR_ROUTES=$(cd __four/build && find . -name index.html | sed 's|/index.html||' | sort)
if ! diff <(echo "$THREE_ROUTES") <(echo "$FOUR_ROUTES") > /dev/null; then
  echo "::error::Trap E — route IA divergence between _three and _four@<sha>. A/B isolates DESIGN not IA."
  diff <(echo "$THREE_ROUTES") <(echo "$FOUR_ROUTES")
  exit 1
fi
```
> Planner decides whether to build `__four/` in CI (slower, exact) or compare against a committed `_four` route manifest snapshot (faster, needs sync discipline like the videos-source-sha sidecar). CONTEXT D-04 leaves "live in deploy.yml alongside drift-check or standalone job" to the planner; reuse the existing `__four/` checkout the drift-check sets up.

### Anti-Patterns to Avoid
- **Re-authoring the already-shipped JSON-LD / titles / descriptions.** `_three` already has VideoObject (richer than `_four` — includes `contentUrl`), Person JSON-LD, and 7/7 titles. POL-01 is AUDIT + gap-fill. Re-writing them risks breaking existing passing tests.
- **Installing `axe-core` 4.11.4 or `@axe-core/playwright` 4.11.4.** Those versions don't exist as stable. Use installed 4.11.3.
- **Adding any runtime JS dep.** D-13 + CLAUDE.md forbid it. Sitemap/JSON-LD/metadata are pure string interpolation.
- **Using `vh` or `dvh` for scroll-snap section height.** POL-03 + Phase 3 lock `svh`. `_three` already complies; the grep gate enforces it.
- **`display:none` / `visibility:hidden` on TopNav chrome-fade.** Hides from screen readers (NAV-01 a11y). `_three` uses `opacity-0 pointer-events-none`.
- **Flipping noindex in any commit other than the atomic D-12 commit.** Search engines must never see a half-flipped state, and the staging URL must stay noindex during the A/B.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap generation | A custom XML library / sitemap npm pkg | `+server.ts` string interpolation (Pattern 1) | `_four` proves a 30-line template is enough for 70 URLs; no dep (D-13) |
| JSON-LD serialization | Hand-written JSON strings | `JSON.stringify(payload)` in `<svelte:head>` (Pattern 2) | Already established in `_three`; escapes correctly; Zod-validated input |
| Lighthouse runner | Custom Puppeteer perf script | `@lhci/cli autorun` (0.15.1) OR `npx lighthouse` | LHCI handles throttling presets + assertions + report shape |
| axe scan | Custom a11y rule engine | `@axe-core/playwright` 4.11.3 `AxeBuilder` (already wired) | Industry standard; already in `tests/e2e/axe.spec.ts` |
| Cross-repo route/OG/data diff | New diff tooling | Clone the `drift-check` job's `__four/` checkout + `diff`/`cmp` + `::error::` (Pattern 4) | The mechanism is already proven for Trap A; D-01 says extend it |
| CNAME provisioning | Manual repo settings only | `static/CNAME` + GH Pages settings UI (committed together) | adapter-static copies `static/CNAME` → `build/CNAME`; avoids the "save and lose domain" footgun |
| BASE_PATH env switching | Source-code env branches | `process.env.BASE_PATH ?? ''` in svelte.config.js (already present) + per-workflow env | Single hook; production workflow sets `BASE_PATH: ''`, staging keeps `/michelle_ngo_three` |

**Key insight:** Every "new" capability in this phase already has a proven implementation in `_four` (or already exists in `_three`). The phase is composition + audit + the 3 new trap gates, not invention.

## Runtime State Inventory

> This phase is NOT a rename/refactor/migration — it is additive (new files + CI gates + cutover infra). The most relevant "runtime state" is the **external/registrar/GH-Pages state** the cutover touches, which is genuinely off-repo. Captured here per the rename-phase discipline because the cutover is a state-mutating launch event.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastore stores any renamed key. videos.json is byte-identical to `_four` (Trap A guards it). | None — verified by drift-check job. |
| Live service config | (1) **GitHub Pages custom-domain config** for `michellengo.net` lives in the repo Settings UI, NOT in git — set by user at cutover (FOUND-03 Task in `_four` 07-05). (2) **Domain registrar DNS** (A records + www CNAME) lives at the registrar — the launch event itself. | Human-action runbook steps (D-11). NOT automatable. |
| OS-registered state | None — no Task Scheduler / pm2 / systemd entries reference this project. | None — verified (web-only static site). |
| Secrets/env vars | `PUBLIC_SITE_URL` set in `deploy.yml` (staging value `https://wolfwdavid.github.io/michelle_ngo_three`). `deploy-production.yml` must set `BASE_PATH: ''` (and may set the prod `PUBLIC_SITE_URL`). No secret keys renamed. | New `deploy-production.yml` sets `BASE_PATH: ''`; planner decides prod `PUBLIC_SITE_URL`. |
| Build artifacts | `static/favicon.png` (67-byte Phase 1 placeholder) — superseded by the new favicon set but kept as fallback (`_four` kept its `favicon.png` too). No stale egg-info/compiled artifacts. | New favicon set added alongside; placeholder stays as fallback. |

**The canonical cutover question:** After `static/CNAME` + `deploy-production.yml` land and the production workflow runs, GH Pages serves `michellengo.net` via the apex anycast IPs — but DNS still points to WordPress.com until the human registrar swap. `curl --resolve` verifies the apex BEFORE the swap (D-11). The DNS swap is the ONLY irreversible-to-users step; rollback = revert registrar records (TTL=300s).

## Common Pitfalls

### Pitfall 1: Treating POL-01 as author-from-scratch when most of it is shipped
**What goes wrong:** Planner re-writes VideoObject/Person JSON-LD and all 7 titles, breaking existing passing route tests (`watch/[id]/page.test.ts`, `about/page.test.ts`).
**Why it happens:** `_four`'s 07-02 PLAN authored everything in one pass; `_three` already shipped JSON-LD in Phases 5/6 and titles incrementally.
**How to avoid:** Scope POL-01 as: (1) NEW — sitemap endpoint, layout favicon/OG block, coverage script, binary assets; (2) GAP-FILL — 5 missing descriptions (`/`, `/work/[category]`, `/pbs-american-portrait`, `/press`, `/contact`) + the `/` brand-only title; (3) AUDIT — validate 56 VideoObject payloads + Person against schema.org, confirm nothing regressed.
**Warning signs:** A task that says "add VideoObject JSON-LD to /watch/[id]" — it's already there.

### Pitfall 2: `_four`'s deferral pattern vs `_three`'s prescriptive CONTEXT
**What goes wrong:** Planner copies `_four`'s "defer Lighthouse / fast-path QA / placeholder assets" outcomes wholesale, but `_three`'s CONTEXT D-17 says "measure first" and D-06 requires the full BrowserStack matrix GREEN before cutover.
**Why it happens:** `_four`'s SUMMARYs read as the canonical outcome; they're actually `accepted-deferred` user decisions specific to `_four`'s launch.
**How to avoid:** Treat `_four`'s SUMMARY *decisions* as one valid branch, not the mandate. Each `_three` decision (D-06, D-17) is more prescriptive — plan the actual execution path; let the user choose deferral at a checkpoint if they want it. Flag the divergence in the plan.
**Warning signs:** A `07-LIGHTHOUSE.json` that's a "structured-deferral payload" (no measurement) when D-17 says measure-first.

### Pitfall 3: LCP escalation path doesn't map from `_four`
**What goes wrong:** Planner copies `_four`'s D-08 escalation (`<picture>` + AVIF on a static WebP hero). `_three`'s `/` LCP element is the hero POSTER image, with the hero iframe deferred until interaction/1s idle (Phase 5 `createHeroDefer`). The `<picture>`+AVIF-on-static-WebP route does not directly apply.
**Why it happens:** Both phases gate `/` LCP; the LCP *element* differs.
**How to avoid:** `_three`'s escalation is about the poster image (`getPosterFor` → `static/posters/*.jpg`, `loading=eager fetchpriority=high` on the hero poster). Escalation options: preload the hero poster, ensure `fetchpriority=high`, AVIF poster variant (PERF-V2-02, deferred), or tune the defer-trigger timing. Measure first (D-17); only escalate if 2.5s missed.
**Warning signs:** An escalation task touching a `hero-poster.webp` `<picture>` — `_three` has no such static WebP hero; the hero is a deferred iframe + poster.

### Pitfall 4: Sitemap absolute-URL host wrong on staging (intentional, don't "fix")
**What goes wrong:** Planner notices the sitemap emits `https://michellengo.net/...` on the staging build and tries to make it environment-aware.
**Why it happens:** Looks like a bug.
**How to avoid:** It's intentional (D-03 / Trap C). Staging is noindex; search engines never crawl it; the production build (BASE_PATH='') emits the same content. `_four` documented this explicitly. The OG `og:image` absolute URL has the same intentional staging-wrong-host behavior.

### Pitfall 5: Forgetting `.nojekyll` (GH Pages footgun)
**What goes wrong:** GH Pages' Jekyll processing strips files/folders starting with `_` from the build, breaking SvelteKit's `_app/` immutable assets.
**Why it happens:** `_three`'s `static/` has NO `.nojekyll` (verified); `_four`'s does.
**How to avoid:** Ensure `static/.nojekyll` exists (empty file). adapter-static may emit it automatically, but `_four` keeps it explicit in `static/`. Verify `build/.nojekyll` exists post-build. (Staging already deploys fine, so SvelteKit/adapter likely handles it — but confirm before the production cutover.)

### Pitfall 6: Non-atomic D-12 flip leaking indexability
**What goes wrong:** robots.txt flipped to `Allow: /` in one commit, noindex meta removed in another → search engines see an inconsistent half-open policy, OR the staging URL gets indexed mid-A/B.
**Why it happens:** Two files, easy to split.
**How to avoid:** D-12 requires ONE commit staging both `src/routes/+layout.svelte` (remove noindex line) AND `static/robots.txt` (Allow + Sitemap directive). It is the LAST commit before DNS swap, WINNER ONLY. If `_three` loses, the commit never lands.

### Pitfall 7: Hardening axe to all routes surfaces latent violations
**What goes wrong:** `axe.spec.ts` currently scans only `/` (zero violations). Extending to `/work`, `/watch/[id]`, `/pbs-american-portrait`, `/press`, `/about`, `/contact` may surface real WCAG AA failures (e.g., color-contrast on category accent tokens, iframe `title` attributes).
**Why it happens:** Per-route content differs; `/`-only never exercised the reel/watch/footer chrome.
**How to avoid:** POL-04 task should scan all 7 routes and EXPECT to fix any surfaced violations (CLAUDE.md a11y notes: iframes need `title`, sticky pills need `aria-current="page"`, chrome-fade must use opacity not display:none). Budget fix time; don't assume zero.

## Code Examples

### deploy-production.yml (FOUND-03 — verbatim from `_four` 07-05, adjust repo name)
```yaml
# Source: ../michelle_ngo_four/.github/workflows/deploy-production.yml (per 07-05 PLAN)
name: Deploy to GitHub Pages (production / apex)
on:
  workflow_dispatch:        # production fires ONLY on manual dispatch (D-11 verify-then-flip)
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages              # shared with deploy.yml so staging + prod never race
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - uses: pnpm/action-setup@v4
        with: { version: 11.0.9, standalone: true }
      - run: pnpm install --frozen-lockfile
      - name: Build (apex — BASE_PATH unset)
        env:
          BASE_PATH: ''     # D-11 BASE_PATH split — apex serves from /
        run: pnpm build
      - name: Verify CNAME in build artifact
        run: test -f build/CNAME || (echo "build/CNAME missing — D-11 assertion not in artifact" && exit 1)
      - uses: actions/upload-pages-artifact@v3
        with: { path: build/ }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
> `_three`'s staging `deploy.yml` stays UNCHANGED (keeps `BASE_PATH: /${{ github.event.repository.name }}` = `/michelle_ngo_three`). Both share `concurrency.group: pages`.

### static/CNAME (FOUND-03)
```
michellengo.net
```
> Single line + trailing newline. adapter-static copies `static/` → `build/`, so `build/CNAME` is asserted in the artifact (D-11). Harmless on staging (GH Pages ignores it there).

### D-12 atomic flip (winner-only, last commit before DNS swap)
```diff
# src/routes/+layout.svelte — DELETE this line:
-  <meta name="robots" content="noindex, nofollow" />

# static/robots.txt — REPLACE entire content:
-User-agent: *
-Disallow: /
+User-agent: *
+Allow: /
+
+Sitemap: https://michellengo.net/sitemap.xml
```
```bash
git add src/routes/+layout.svelte static/robots.txt
git commit -m "feat(07): atomic noindex+robots flip — _three is the A/B winner, now indexable (D-12)"
```

### @lhci/cli config for the `/` LCP gate (POL-02 — if using LHCI; warning→blocking posture via assertions)
```json
// lighthouserc.json — assert LCP < 2500ms on / (D-17). Warning-only: level "warn"; blocking: level "error".
{
  "ci": {
    "collect": {
      "url": ["https://wolfwdavid.github.io/michelle_ngo_three/"],
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "largest-contentful-paint": ["warn", { "maxNumericValue": 2500 }]
      }
    }
  }
}
```
> LHCI's default collect preset is mobile + Slow-4G throttle (the FOUND-03 measurement profile — D-17 "simulated 4G"). Do NOT use `preset: desktop` for the gate measurement (desktop disables Slow-4G; would let a passing audit hide a real mobile failure — this exact trap is called out in `_four`'s 07-04 PLAN). The 2500 threshold is `_three`'s looser budget vs `_four`'s 2000. Flip `warn`→`error` pre-cutover (D-17 blocking posture). Commit the JSON output to `07-LIGHTHOUSE.json`.

### test-prerender-coverage.mjs assertions (NEW for `_three` — port from `_four`)
```javascript
// Port ../michelle_ngo_four/scripts/test-prerender-coverage.mjs.
// _three has NO scripts/test-prerender-coverage.mjs (verified) — this is a NEW file.
// Asserts in build/: work/index.html + 8 work/<slug>/ + 56 watch/<id>/ + pbs/press/about/contact +
//   sitemap.xml with >= 70 <url> entries + favicon set + og-image.jpg.
const sitemapUrlCount = (readFileSync(join(BUILD,'sitemap.xml'),'utf8').match(/<url>/g) ?? []).length;
if (sitemapUrlCount < 70) failures.push(`sitemap.xml has ${sitemapUrlCount} <url>; expected >= 70 (6+8+56).`);
const requiredAssets = ['favicon.ico','favicon-16.png','favicon-32.png','favicon-192.png','favicon-512.png','apple-touch-icon.png','og-image.jpg'];
const missing = requiredAssets.filter(n => !existsSync(join(BUILD,n)));
if (missing.length) failures.push(`Missing static assets in build/: ${missing.join(', ')}`);
```
> Add a `"test:prerender": "node scripts/test-prerender-coverage.mjs"` script and wire it into `deploy.yml` after the build step. This is the CI assertion that pins the 70-URL count (D-14).

### Trap B — OG dimension parity diff (reuses `__four/` checkout)
```bash
# After the drift-check job's __four/ checkout (or its own checkout of _four at pinned SHA):
FOUR_OG=__four/static/og-image.jpg     # _four's OG asset (currently 15386 bytes placeholder)
THREE_OG=static/og-image.jpg
# Dimension parity (1200x630) — use `file` or a tiny node sharp/identify check:
node -e "
const fs=require('fs');
// Minimal JPEG SOF parse OR shell out to identify; here assert both exist + size delta bounded.
const a=fs.statSync('$FOUR_OG').size, b=fs.statSync('$THREE_OG').size;
const ratio=Math.max(a,b)/Math.min(a,b);
if (ratio > 3) { console.error('::error::Trap B — OG filesize wildly diverges (>3x) from _four; crop render likely wrong.'); process.exit(1); }
console.log('Trap B filesize parity OK (ratio '+ratio.toFixed(2)+')');
"
# Dimensions MUST be 1200x630 on both — assert via the layout meta tags grep AND an image-dim probe:
grep -c 'og:image:width" content="1200"' build/index.html   # >= 1
grep -c 'og:image:height" content="630"' build/index.html   # >= 1
```
> CONTEXT D-02: mitigation is DIMENSIONAL parity (1200×630 + comparable filesize), NOT visual reuse. `_three`'s OG art is its own cinematic-dark composition. Planner picks the dimension-probe mechanism (sharp metadata, ImageMagick `identify`, or a small JPEG header parse). The grep on `og:image:width/height` is the cheap mechanical half.

## State of the Art

| Old Approach (`_four` shipped) | Current / `_three` Approach | When Changed | Impact |
|--------------------------------|------------------------------|--------------|--------|
| Placeholder favicon/OG assets (deferred authoring) | `_three` should author cinematic-dark assets (D-02/D-13) OR follow `_four`'s placeholder-then-backlog branch via checkpoint | `_three` CONTEXT 2026-05-28 | OG art is `_three`'s own; favicon is cinematic wordmark |
| Lighthouse DEFERRED (structured-deferral payload, no measurement) | D-17 "measure first" — actually run the gate | `_three` CONTEXT D-17 | Plan must execute Lighthouse, not park it (or checkpoint-defer with user) |
| Fast-path QA acceptance (0 cells walked) | D-06 full BrowserStack 7-OS + thermal GREEN required before cutover | `_three` CONTEXT D-06 | Real-device matrix is a hard cutover gate, not fast-pathed |
| `<picture>`+AVIF escalation on static WebP hero | Poster-first escalation (hero iframe deferred; LCP = poster image) | `_three` Phase 5 hero arch | `_four`'s D-08 escalation does NOT map; see Pitfall 3 |
| 5 separate Phase-7 plans, some 5-min deferrals | Same plan shape; `_three` may collapse/execute more | planner's call | More actual execution expected per `_three`'s prescriptive CONTEXT |
| No route-manifest CI gate (Trap E) | NEW Trap E route-manifest diff (D-04) | `_three` CONTEXT D-04 | New CI job reusing `__four/` checkout |

**Deprecated/outdated in CLAUDE.md:**
- `@axe-core/playwright` / `axe-core` "4.11.4" — does NOT exist as stable (4.11.3 is latest; `_three` already has it). Use 4.11.3.

## Open Questions

1. **Does `_three` author real cinematic OG/favicon assets, or follow `_four`'s placeholder-then-backlog branch?**
   - What we know: D-02/D-13 want cinematic-dark OWN assets; Claude's Discretion allows shipping a hero-poster crop as-is. `_four` shipped 67-byte/15KB placeholders and deferred.
   - What's unclear: Whether the user wants polished assets pre-cutover (matches "both A/B siblings get full polish" kickoff decision) or accepts placeholders.
   - Recommendation: Plan a `checkpoint:decision` task (like `_four` 07-02 Task 1) offering: (a) author cinematic 512×512 favicon master + 1200×630 OG crop, (b) sharp one-shot script, (c) placeholder-then-backlog. The metadata WIRING (layout block, sitemap, coverage script) proceeds regardless — only the binary quality is gated.

2. **Lighthouse: execute the gate now (D-17 "measure first") or checkpoint-defer to post-launch telemetry (`_four` branch)?**
   - What we know: D-17 says measure first; `_four` deferred to real-user telemetry.
   - What's unclear: User's appetite for running `lhci autorun` against staging now vs trusting the poster-first budget.
   - Recommendation: Plan to ACTUALLY run it (D-17 prescriptive) against the staging URL, commit real numbers to `07-LIGHTHOUSE.json`, with a checkpoint to escalate-or-accept if >2.5s. Offer the `_four` defer branch as the fallback option at the checkpoint.

3. **Trap E / Trap B: build `__four/` in CI (exact, slow) or compare against a committed `_four` snapshot (fast, sync-discipline)?**
   - What we know: drift-check already checks out `__four/` at a pinned SHA. Building `__four/` adds pnpm-install + build time to CI.
   - What's unclear: CI time budget tolerance.
   - Recommendation: For Trap E route-manifest, compare against a committed `_four` route-manifest snapshot file (e.g., `src/lib/data/.four-route-manifest` sidecar, refreshed like `.videos-source-sha`) — avoids building `_four` in CI. For Trap B OG-dimension, `__four/static/og-image.jpg` is already checked out by drift-check; reuse it directly (no `_four` build needed — it's a static asset). Planner's call per D-04.

4. **A/B winner declaration ritual + cutover firing — does `_three` build infra and STOP (like `_four` 07-05), or attempt the cutover?**
   - What we know: D-09 hard-gates cutover on explicit user "_three wins" declaration; D-06 requires BrowserStack GREEN first.
   - What's unclear: Whether the user expects Phase 7 to fire the cutover or just stage it.
   - Recommendation: Stage everything cutover-ready (CNAME, deploy-production.yml, runbook) and STOP at "ready for DNS swap" — exactly `_four`'s 07-05 stop-at-infrastructure pattern. The 9-step runbook is the deliverable; the DNS flip waits on the user's declaration (D-09) AND the BrowserStack GREEN gate (D-06).

## Validation Architecture

> Nyquist validation is ENABLED (`workflow.nyquist_validation: true` in config.json). This section maps every requirement + success criterion to a validation method.

### Test Framework
| Property | Value |
|----------|-------|
| Unit framework | Vitest 4.1.5 (data project node-env + ui project jsdom) — `pnpm test` |
| E2E framework | Playwright 1.60.0 (Chromium + WebKit + Firefox) — `pnpm test:e2e` |
| a11y engine | `@axe-core/playwright` 4.11.3 (in `tests/e2e/axe.spec.ts`) |
| Build assertion | `scripts/test-prerender-coverage.mjs` (NEW — port from `_four`) — `node scripts/test-prerender-coverage.mjs` |
| Perf | `@lhci/cli` 0.15.1 `lhci autorun` OR `npx lighthouse` → `07-LIGHTHOUSE.json` |
| Type/lint | `pnpm check` (svelte-check) + `pnpm lint` (eslint) |
| Config file | `vite.config.ts` (vitest projects), `playwright.config.ts` (port 4183), `deploy.yml` (CI orchestration) |
| Quick run command | `pnpm build && node scripts/test-prerender-coverage.mjs` (NEW) |
| Full suite command | `pnpm check && pnpm lint && pnpm test && pnpm test:e2e && pnpm build && node scripts/test-prerender-coverage.mjs` |

### Phase Requirements → Test Map
| Req / SC | Behavior | Test Type | Automated Command / Method | Mechanical? | File Exists? |
|----------|----------|-----------|-----------------------------|-------------|-------------|
| POL-01 (titles) | 7/7 routes emit D-13 `<title>` | grep build output | `grep -c "<title>.* — Michelle Ngo\|<title>Michelle Ngo" build/**/index.html` per route | Yes | ✅ (6/7 done; `/` needs brand-only fix) |
| POL-01 (descriptions) | 7/7 routes emit `<meta description>` | grep build output | `grep -c 'name="description"' build/<route>/index.html` >= 1 each | Yes | ❌ Wave 0 — 5 missing (`/`, `/work/[cat]`, `/pbs`, `/press`, `/contact`) |
| POL-01 (VideoObject) | 56 `/watch/[id]` emit valid VideoObject | grep + count + schema audit | `grep -l "VideoObject" build/watch/*/index.html \| wc -l` == 56 | Yes (count); schema = manual | ✅ shipped (audit only) |
| POL-01 (Person) | `/about` emits Person JSON-LD | grep build output | `grep -c '"@type":"Person"' build/about/index.html` >= 1 | Yes | ✅ shipped (audit only) |
| POL-01 (OG/Twitter) | sitewide OG + Twitter on every route | grep build output | `grep -c "og:image" build/index.html && grep -c "summary_large_image" build/work/index.html` | Yes | ❌ Wave 0 — layout block + assets |
| POL-01 (sitemap) | `build/sitemap.xml` with 70 URLs | build-count assertion | `node scripts/test-prerender-coverage.mjs` asserts `<url>` count >= 70 | Yes | ❌ Wave 0 — endpoint + coverage script |
| POL-02 | `/` LCP < 2.5s on simulated 4G | Lighthouse JSON threshold | `lhci autorun` asserts `largest-contentful-paint maxNumericValue 2500` (warn→error) → `07-LIGHTHOUSE.json` | Yes (gate); poster-first escalation = judgment | ❌ Wave 0 — lighthouserc + report |
| POL-03 (CLS) | poster→iframe swap CLS ≤ 0 | DevTools Layout-Instability (manual) + structural grep | `aspect-video` shared container in ReelSection/PosterImage/PreviewLoop | grep mechanical; CLS=0 = DevTools manual | ✅ structurally satisfied (audit) |
| POL-03 (100svh) | every scroll-snap section uses `100svh`/`svh` not vh/dvh | grep gate | `grep -rn '100vh\|100dvh' src/lib/components src/routes` returns 0 in snap sections; `h-svh`/`calc(100svh` present | Yes | ✅ already compliant (add grep gate) |
| POL-04 (axe) | WCAG AA on every PR, all 7 routes | axe scan in CI | `pnpm test:e2e` runs `axe.spec.ts` (harden `/`-only → 7 routes); `violations == []` | Yes | ⚠️ `/`-only exists; Wave 0 extend to 7 |
| POL-04 (QA matrix) | 7-OS BrowserStack + thermal + 21-cell signed off | manual QA-matrix sign-off | `07-QA-MATRIX.md` all-pass + `03-VERIFICATION.md` 28-cell GREEN + thermal delta ≤ 8% | No — human judgment | ❌ Wave 0 — consolidated matrix doc |
| POL-05 (Trap D) | localStorage keys `mnp_three_*` | grep gate (existing) | D-17 grep gate in deploy.yml fails on raw localStorage outside `$lib/storage.ts` | Yes | ✅ DONE Phase 1 (verify passes) |
| POL-05 (Trap B) | OG dims 1200×630, filesize comparable to `_four` | dimension/filesize diff | grep `og:image:width 1200`/`height 630` + filesize ratio vs `__four/static/og-image.jpg` | Yes | ❌ Wave 0 — Trap B gate + OG asset |
| FOUND-03 (CNAME) | `build/CNAME` == `michellengo.net` | build assertion | `test -f build/CNAME && grep -qx michellengo.net build/CNAME` | Yes | ❌ Wave 0 |
| FOUND-03 (prod workflow) | deploy-production.yml builds BASE_PATH='' | grep + YAML parse | `grep -c "BASE_PATH: ''" .github/workflows/deploy-production.yml` == 1; `grep -c workflow_dispatch` >= 1 | Yes | ❌ Wave 0 |
| FOUND-03 (atomic flip) | noindex removed + robots open in ONE commit | git log + grep | `git log -1 --name-only` lists both files; `grep -c noindex build/index.html` == 0 (winner only) | Yes | ❌ winner-only, last commit |
| FOUND-03 (runbook) | 9-step reviewable reversible runbook | doc review | `07-05-SUMMARY.md` § Launch Runbook present, gated, with rollback | No — human review | ❌ Wave 0 |
| SC#5 (Trap A) | videos.json byte-identical to `_four` | CI byte-diff (existing) | `drift-check` job `cmp` against `__four/.../videos.json` | Yes | ✅ DONE Phase 2 (verify passes) |
| SC#5 (Trap E) | route IA identical to `_four` | route-manifest diff CI | `diff` `_three` build routes vs `_four` pinned manifest; `::error::` on divergence | Yes | ❌ Wave 0 — new CI gate |
| SC#5 (Trap C) | both siblings noindex until winner | policy/grep | noindex present in build pre-flip; robots.txt `Disallow: /` until D-12 | Yes | ✅ default state (verify) |

### Sampling Rate
- **Per task commit:** `pnpm check && pnpm lint && pnpm test` (fast; the unit + type + lint gates)
- **Per metadata/sitemap task:** `pnpm build && node scripts/test-prerender-coverage.mjs` (the 70-URL + asset assertion)
- **Per wave merge:** full suite incl. `pnpm test:e2e` (axe + reel + watch + surface specs)
- **Phase gate (pre-cutover):** full suite green + Lighthouse `/` LCP < 2.5s + `07-QA-MATRIX.md` all-pass (BrowserStack 7-OS + thermal + 21-cell) + all 5 trap gates green, before the user's A/B-winner declaration and `/gsd:verify-work`.

### Wave 0 Gaps (infrastructure that must exist before / early in implementation)
- [ ] `scripts/test-prerender-coverage.mjs` — port from `_four`; asserts 70-URL sitemap + favicon set + og-image + all route HTML (the build-count gate for D-14). `_three` does NOT have this file.
- [ ] `src/routes/sitemap.xml/+server.ts` — the sitemap endpoint (port from `_four`, identical data exports).
- [ ] `lighthouserc.json` (or the `npx lighthouse` invocation) — the POL-02 gate config.
- [ ] `static/.nojekyll` — verify it exists / emits in build (GH Pages footgun; `_three` static/ lacks it).
- [ ] `static/CNAME`, favicon set (6 files), `og-image.jpg` — binary/asset Wave 0 (or checkpoint-gated authoring).
- [ ] Extend `tests/e2e/axe.spec.ts` from `/`-only to all 7 routes (POL-04 harden).
- [ ] New CI gates in `deploy.yml` (or standalone): Trap E route-manifest diff, Trap B OG-dimension diff, POL-02 Lighthouse, prerender-coverage assertion.
- [ ] `07-QA-MATRIX.md`, `07-LIGHTHOUSE.json` planning artifacts.
- [ ] `.github/workflows/deploy-production.yml` — the FOUND-03 production workflow.

*(Existing test infrastructure — Vitest projects, Playwright 3-browser config, axe wiring, drift-check, D-17 grep gate — covers the AUDIT + already-shipped requirements; the gaps above are the genuinely new pieces.)*

## Sources

### Primary (HIGH confidence — directly inspected in this repo / sibling)
- `../michelle_ngo_four/.planning/phases/07-polish-production-cutover/07-CONTEXT.md` — `_four` D-01..D-20 blueprint
- `../michelle_ngo_four/.planning/phases/07-polish-production-cutover/07-02-production-metadata-PLAN.md` + `-SUMMARY.md` — metadata/sitemap/JSON-LD/favicon/OG exact shapes
- `../michelle_ngo_four/.planning/phases/07-polish-production-cutover/07-04-perf-gate-PLAN.md` + `-SUMMARY.md` — Lighthouse wiring + deferral pattern + mobile-preset trap
- `../michelle_ngo_four/.planning/phases/07-polish-production-cutover/07-05-production-cutover-PLAN.md` + `-SUMMARY.md` — CNAME, deploy-production.yml, atomic flip, 9-step Launch Runbook
- `../michelle_ngo_four/.planning/phases/07-polish-production-cutover/07-03-responsive-qa-matrix-SUMMARY.md` + `07-QA-MATRIX.md` — 21-cell matrix shape
- `../michelle_ngo_four/.planning/phases/07-polish-production-cutover/07-01-imdb-linkedin-swap-SUMMARY.md` — IMDb/LinkedIn deferral posture
- `../michelle_ngo_four/src/routes/sitemap.xml/+server.ts` — sitemap source (verbatim-portable)
- `../michelle_ngo_four/src/routes/+layout.svelte` — favicon + OG/Twitter head block source
- `../michelle_ngo_four/.github/workflows/deploy.yml` + `scripts/test-prerender-coverage.mjs` — staging workflow + coverage script
- `michelle_ngo_three/.github/workflows/deploy.yml` — current CI (drift-check Trap A + D-17 grep gate Trap D = reuse templates)
- `michelle_ngo_three/src/routes/{+layout,about/+page,watch/[id]/+page,contact/+page}.svelte` — current shipped metadata state
- `michelle_ngo_three/src/lib/components/{ReelSection,PosterImage}.svelte` — POL-03 aspect-video/svh current compliance
- `michelle_ngo_three/static/`, `scripts/`, `package.json`, `.planning/config.json` — current asset/script/dep/config state
- `michelle_ngo_three/tests/e2e/axe.spec.ts` — current `/`-only axe scan (POL-04 harden target)
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-HUMAN-UAT.md` + `05-hero-watch/05-HUMAN-UAT.md` — deferred QA backlog (D-05/D-06/D-07)
- `.planning/{CONTEXT,REQUIREMENTS,ROADMAP,STATE}.md` (Phase 7) — locked decisions + requirements + success criteria

### Secondary (MEDIUM confidence — npm registry, verified live)
- `npm view @lhci/cli version` → 0.15.1 (2026-05-28)
- `npm view @axe-core/playwright version` → 4.11.3 (4.11.4 prerelease-only; 2026-05-28)
- `npm view lighthouse version` → 13.3.0 (2026-05-28)

### Tertiary (LOW confidence — external docs, planner consults at plan time)
- GitHub Pages custom domain — https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site (apex IPs 185.199.108-111.153, www CNAME)
- schema.org Person + VideoObject — https://schema.org/Person, https://schema.org/VideoObject
- OG protocol — https://ogp.me/ (dimensions + property names)
- Lighthouse CI — https://github.com/GoogleChrome/lighthouse-ci

## Metadata

**Confidence breakdown:**
- Metadata blueprint (sitemap/JSON-LD/titles/OG/favicon): HIGH — `_four` shipped verbatim-portable source; `_three` current state directly audited
- Cutover infrastructure (CNAME/deploy-production.yml/atomic flip/runbook): HIGH — `_four` 07-05 is a complete working blueprint; `_three`'s svelte.config.js already has the BASE_PATH hook
- The 5 traps (mechanical gates): HIGH on A/D (DONE, verified) + Trap E/B mechanism (clones proven drift-check); MEDIUM on exact OG-dimension probe tooling (planner picks sharp/identify/header-parse)
- LCP poster-first path: MEDIUM — `_four`'s escalation doesn't map; `_three`'s hero arch (deferred iframe + poster) is inspected, but actual 2.5s measurement is unrun (D-17 "measure first")
- axe-in-CI: HIGH — already wired; harden-to-7-routes is mechanical but may surface real violations (Pitfall 7)
- QA consolidation: HIGH on doc shape (`_four` 07-QA-MATRIX.md template); the BrowserStack/thermal execution is human-action (D-06)
- Version recommendations: HIGH — verified live against npm; corrected CLAUDE.md's 4.11.4 error

**Research date:** 2026-05-28
**Valid until:** 2026-06-27 (30 days — stable stack; re-verify `@lhci/cli`/`lighthouse` versions if planning slips past this)

## RESEARCH COMPLETE
