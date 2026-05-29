# Roadmap: Michelle Ngo Portfolio — Cinematic Cut

## Overview

`_three` is the cinematic-immersive A/B sibling of the shipped editorial-modern `_four`. Same 56 videos, same SvelteKit stack — but every browse surface is a vertical scroll-snapped fullscreen reel with silent muted preview loops. The journey: lay a buildable scaffold that mirrors `_four`'s tooling and namespacing (Phase 1), pull `_four`'s video data verbatim with a cross-repo drift guard (Phase 2), front-load the load-bearing iframe-lifecycle risk by building the reel system on real iOS Safari (Phase 3), wrap the reel in URL-driven wayfinding so producers don't get lost in 56 sections (Phase 4), wire the cinematic entry and watch surfaces that depend on the proven iframe pattern (Phase 5), restyle the content pages with maximum verbatim reuse from `_four` (Phase 6), and finish with SEO + perf + A11y + the A/B-eligible cutover infrastructure (Phase 7). Seven phases mirroring `_four`'s shape — structural parity is the precondition of a fair A/B.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Buildable, deploying SvelteKit 2 + Svelte 5 + TS strict scaffold on GH Pages with `BASE_PATH=/michelle_ngo_three/` and `mnp_three_*` namespacing from day one
- [x] **Phase 2: Data Layer** - `videos.json` byte-identical to `_four` + Zod schema + Vite build-fail plugin + oEmbed health-check + cross-repo drift CI (Trap A mitigation)
- [x] **Phase 3: Reel System Core (LOAD-BEARING RISK)** - `<ReelStage />` + `<ReelSection />` + `<PreviewLoop />` + `<PosterImage />` with 4-state iframe lifecycle, 5-layer leak defense, unified poster-fallback codepath; code-level gates green at commit `9207d45`; real-device matrix (iOS 16/17.0/17.1 BrowserStack + iPhone thermal QA) DEFERRED to UAT (see `.planning/phases/03-reel-system-core-load-bearing-risk/03-HUMAN-UAT.md`); must close before Phase 7 cutover
- [ ] **Phase 4: Wayfinding** - `<FilterPillBar />` + 8 prerendered `/work/[category]` routes + cinematic chrome-fade `<TopNav />` + keyboard navigation + skip-to-content + screen-reader landmarks
- [ ] **Phase 5: Hero & Watch** - `<HeroAmbient />` always-mounted producer reel on `/` + `<WatchPlayer />` letterboxed embed + chrome-fade-on-play + `<ContinueReelRail />` carousel + back-nav scroll restoration
- [ ] **Phase 6: PBS / Press / About / Contact** - Four content surfaces with verbatim reuse of `_four`'s bio, PBS blockquote, ContactBlock, Footer contract — cinematic restyle only
- [ ] **Phase 7: Polish & Cutover** - SEO + JSON-LD + sitemap + Lighthouse CI + axe-core CI + real-device QA matrix + A/B-integrity traps mitigated + production cutover infrastructure ready

## Phase Details

### Phase 1: Foundation
**Goal**: Buildable, deploying SvelteKit 2 + Svelte 5 + TS strict scaffold that mirrors `_four`'s tooling and locks in `_three`-specific decisions (`BASE_PATH`, `mnp_three_*` localStorage namespace, focus token, `PUBLIC_SITE_URL`, dark-only palette) from day one so they don't need to be retrofitted later.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02
**Success Criteria** (what must be TRUE):
  1. `pnpm install && pnpm build` produces a clean static build with TypeScript strict mode (+ `noUncheckedIndexedAccess` + `noImplicitOverride`), Svelte 5 runes, and Tailwind v4 utilities — zero errors, zero warnings on a fresh clone.
  2. Pushing to `main` triggers GitHub Actions and the site is reachable at `https://wolfwdavid.github.io/michelle_ngo_three/` over HTTPS within minutes of build completion (with `BASE_PATH=/michelle_ngo_three/` correctly applied to all asset and route URLs).
  3. The high-contrast focus token, `mnp_three_*` localStorage namespace, and `PUBLIC_SITE_URL` env are defined in the codebase before any feature code lands (verifiable by grep — `mnp_three_` does not appear in any feature commits because the convention is already in place).
  4. Tooling additions specific to `_three` (`runed`, `@sveltejs/enhanced-img`, `@tailwindcss/typography`, `@playwright/test`, `@axe-core/playwright`, `@testing-library/svelte`) are installed and a smoke test of each (one unit test + one e2e test + one axe assertion + one IO hook usage) passes on CI.
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Mirror _four scaffold (package.json + configs + 5 cinematic-layer dep additions + clean pnpm build)
- [x] 01-02-PLAN.md — _three-specific conventions day-one (@theme tokens + self-hosted fonts + global :focus-visible + $lib/storage.ts + .env.example + D-01 splash)
- [x] 01-03-PLAN.md — GH Actions deploy + D-17 grep gate + four smoke-test gates (unit + e2e + axe + runed IO hook) + human-verify checkpoint

### Phase 2: Data Layer
**Goal**: `src/lib/data/videos.json` is byte-identical to `_four`'s and stays that way under CI; the `$lib/data` loader surface, Zod schema, and Vite build-fail plugin are drop-in compatible with `_four`; an oEmbed health-check catches videos whose embeds have been disabled before they ship as runtime black boxes.
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. `src/lib/data/videos.json` is byte-for-byte identical to `../michelle_ngo_four/src/lib/data/videos.json` (verifiable by `sha256sum` or git's `--check-object` — no whitespace drift, no key reorder).
  2. Intentionally breaking a video record (delete a required field, change `source` to an invalid value, duplicate an `id`) fails `pnpm build` with a clear error pointing at the violating record — same Zod + Vite build-fail plugin behavior as `_four`.
  3. The `$lib/data` typed exports (`videos`, `producerReelId`, `getById`, `getByCategory`, category helpers) match `_four`'s public surface, so a component written against `_four`'s import shape compiles unchanged against `_three`.
  4. CI cross-repo diff check runs on every PR and fails the build with a clear message if `_three`'s `videos.json` drifts from `_four`'s (Trap A mitigation — A/B integrity precondition).
  5. The Vite build-fail plugin hits the Vimeo/YouTube oEmbed endpoint for every video at build time and fails with a clear message if any video is no longer embeddable (Pitfall 6 mitigation — runtime black boxes caught at build time).
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Mirror _four data layer (videos.json + 4 loader files + 4 test files verbatim) + wire validateVideosPlugin + .videos-source-sha sidecar
- [x] 02-02-PLAN.md — Cross-repo drift CI (DATA-04 / Trap A): drift-check job in deploy.yml clones _four at pinned SHA and byte-compares videos.json
- [x] 02-03-PLAN.md — oEmbed health-check (Pitfall 6): scripts/check-embeds.ts + pnpm check:embeds + nightly Action with auto-Issue tracking

### Phase 3: Reel System Core (LOAD-BEARING RISK)
**Goal**: The killer feature works on real producer hardware — iOS Safari 16, 17.0, 17.1, 17.2+, Chrome Android, Firefox desktop, Safari macOS. Scroll-snap is fluid, iframe lifecycle is leak-free, and the unified poster-fallback codepath cleanly degrades under all five "edge-case" triggers (`prefers-reduced-motion`, cellular, iOS Low Power Mode `play()` rejection, embed-disabled-by-owner, EU default-to-poster). 14 of 20 documented pitfalls cluster here; this phase MUST NOT be subdivided so its risk surface stays atomic.
**Depends on**: Phase 2
**Requirements**: REEL-01, REEL-02, REEL-03, REEL-04, REEL-05, REEL-06, REEL-07
**Success Criteria** (what must be TRUE):
  1. `/work` renders the 56 videos as fullscreen scroll-snapped sections (one video per `100svh` viewport, `scroll-snap-type: y proximity`) and a producer can flick-scroll from section 1 to section 50 without getting trapped (Pitfall 1, 7 mitigated).
  2. As a producer scrolls, only the current section + 1 above + 1 below have iframes mounted; off-window sections render as static posters with no measurable CLS on the poster→iframe swap (verifiable by Chrome DevTools "Layout Instability" panel — POL-03 staging satisfied).
  3. On any of the five fallback triggers (`prefers-reduced-motion: reduce`, cellular `effectiveType ∈ {2g,3g,slow-2g}` where the API is available, iOS Low Power Mode `play()` rejection, embed-disabled-by-owner error, EU default-to-poster posture), the reel renders posters only with a visible `▷ PLAY WITH SOUND` affordance on every section — the SAME `<PosterImage />` component, NOT five separate codepaths.
  4. After scrolling through all 56 sections then back, Chrome DevTools "Memory" snapshot shows no detached `<iframe>` nodes, no leaked postMessage listeners, no leaked IntersectionObservers — the 4-state lifecycle + 5-layer leak defense holds under real usage (REEL-06 verified).
  5. Backgrounding the tab (switching apps on iOS, switching tabs on desktop) pauses all preview loops within 300ms via the Page Visibility API; foregrounding resumes the current section's loop only (REEL-07; battery/thermal mitigation per Pitfall 5).
  6. Every section renders title (bottom-left), `<CategoryTag />` (top-right), and a `▷ PLAY WITH SOUND` action that deep-links to `/watch/[id]` with the section's video id (REEL-05).
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Reel foundations (ReelStage scroll-snap + ONE-IO + module-scope state runes + ReelSection D-08 gate + REEL-05 overlay + /work prerendered route)
- [x] 03-02-PLAN.md — Iframe lifecycle (URL builder + Vimeo/YouTube postMessage adapters + PreviewLoop 4-state machine + 5-layer leak defense + REEL-07 Page Visibility)
- [x] 03-03-PLAN.md — Fallback + e2e + real-device QA (PosterImage full + REEL-04 unified codepath + check-embeds --posters-only + validatePostersPlugin + Playwright 4-pillar suite; Tasks 8+9 DEFERRED to UAT — see 03-HUMAN-UAT.md)

### Phase 4: Wayfinding
**Goal**: A hiring producer can navigate the 56-section reel as fast as they navigate any other portfolio — pill-bar category filters above the reel, cinematic chrome-fade `<TopNav />` that surfaces on hover/focus/tap, keyboard navigation that respects scroll-snap, and screen-reader landmarks that don't explode into a 56-page tree.
**Depends on**: Phase 3
**Requirements**: FILT-01, FILT-02, FILT-03, FILT-04, NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. A sticky `<FilterPillBar />` above the reel renders 8 category pills + "All" reset; tapping a pill navigates to `/work/[category]` and the reel re-renders with only that category's videos — URL is the canonical source of state (no parallel Svelte store).
  2. Reloading or pasting any `/work/[category]` URL reproduces the filtered reel from prerendered HTML on first paint (8 routes prerendered via `entries()`, parity with `_four`).
  3. The cinematic `<TopNav />` (wordmark + 8 category links + About/Press/Contact + mobile hamburger) fades to transparent during active reel scroll and surfaces on hover/focus/tap; the PBS link is active-state on BOTH `/pbs-american-portrait/` and `/work/pbs-american-portrait/` (NAV-01, PBS-03 parity).
  4. A keyboard-only producer can navigate the entire `/work` surface — Arrow keys + PageUp/PageDown jump section-to-section, Tab exits the scroll-snap container to TopNav, Escape returns to top, focus ring is visible against any dark video background (NAV-02; Pitfall 10 mitigated).
  5. A screen-reader user lands on `/work`, hits a single skip-to-content link visible only on focus, and rotors through the page as `<main>` + ONE `<nav aria-label="Filmography filters">` + 56 `<article aria-label="Video N of M: [title]">` — not a 56-region landmark explosion (NAV-03; Pitfall 8 mitigated).
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Filter routing layer: FilterPillBar component + 8 prerendered /work/[category] routes + categoryAccent.ts static-literal class map (FILT-01..04)
- [x] 04-02-PLAN.md — Cinematic chrome: TopNav + MobileMenu + skip-link + <main> wrapper + scrollIdle/menu state runes + chrome-fade rule (NAV-01 + NAV-03)
- [x] 04-03-PLAN.md — Keyboard nav + roving tabindex + D-08 menu-pause bridge in ReelStage + chrome-height math + 4-spec Playwright e2e suite (NAV-02 + 3-browser validation of NAV-01/NAV-03/FILT-01..03/D-08)

### Phase 5: Hero & Watch
**Goal**: The cinematic entry surface (`/`) and the cinematic playback surface (`/watch/[id]`) both work on the iframe-lifecycle pattern proven sound in Phase 3. The hero is an always-mounted ambient producer reel that draws the user into the full `/work` reel below; the watch route is a letterboxed embed on full black with chrome that fades on play and rails the user toward sibling videos in the same category. Back-navigation from `/watch/[id]` restores the user's exact reel position.
**Depends on**: Phase 3
**Requirements**: HERO-01, HERO-02, HERO-03, WATCH-01, WATCH-02, WATCH-03, WATCH-04, WATCH-05
**Success Criteria** (what must be TRUE):
  1. `/` renders a full-bleed `100svh` `<HeroAmbient />` — Michelle's producer reel (Vimeo 264677021) silently autoplaying as the background, gradient overlay, name + tagline + `▷ PLAY REEL` CTA centered, `↓` scroll-cue inviting entry into the first reel sections below (HERO-01, HERO-02).
  2. Tapping `▷ PLAY REEL` navigates to `/watch/264677021` and the embed plays with sound on first paint (HERO-03).
  3. `/watch/[id]` plays the selected video full-bleed letterboxed on full black; on the `play` postMessage event the chrome (back button, title, metadata) fades to low-opacity, and on `pause` / hover it fades back in (WATCH-01, WATCH-02).
  4. Below the player, a `<ContinueReelRail />` horizontal carousel surfaces same-category sibling videos as poster-only cards (no nested iframes — rail is browse signal, not preview); replaces `_four`'s grid rail (WATCH-03).
  5. All 56 `/watch/[id]` routes are prerendered via `entries()` (sitemap-discoverable, SEO-eligible, parity with `_four`) — WATCH-04.
  6. Back-navigating from `/watch/[id]` to `/work` (or `/work/[category]`) restores the producer to the exact section they came from, via `history.state` + hash fragment on outbound navigation (WATCH-05; Pitfall 12 mitigated).
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md — Foundation extensions (vimeoAdapter pause subscription + url.ts playsinline=1 in 'play' mode + pageVisibility module-scope rune + ReelStage D-15 hash-restore $effect consumer)
- [x] 05-02-PLAN.md — Watch surface (WatchPlayer letterbox + chrome-fade state machine + ContinueReelRail pure CSS scroll-snap-x + /watch/[id] route + page.test + Playwright watch.spec + restore.spec)
- [x] 05-03-PLAN.md — Hero surface (createHeroDefer factory rune + HeroAmbient 5-layer z-stack with own IO + /+page.{ts,svelte} rewrite replacing Phase 1 splash + Playwright hero.spec)

### Phase 6: PBS / Press / About / Contact
**Goal**: The four content surfaces (`/pbs-american-portrait/`, `/press`, `/about`, `/contact`) are cinematically restyled but content-identical to `_four` — Michelle's user-approved bio, the verbatim PBS blockquote, the 13-credit prestige order, and the single-source-of-truth `<ContactBlock />` all come across without re-authoring. The cinematic restyle is shallow styling work atop established `_four` contracts.
**Depends on**: Phase 5
**Requirements**: PBS-01, PBS-02, PBS-03, PRES-01, ABT-01, CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. `/pbs-american-portrait/` renders section zero as the verbatim PBS blockquote (reused from `_four` 05-01 Candidate C) over a still, followed by sections 1-18 as the 18 PBS American Portrait videos in the same immersive scroll-snap reel format as `/work`; 15 of 18 sections carry a `See on PBS →` badge linking to the collection URL (PBS-01, PBS-02).
  2. `/press` renders 13 broadcast credits as vertical scroll-snap sections in prestige order (HBO Max → HBO → PBS → ABC News → U2 → Amazon News → Music Box Films → Monument Releasing → Cargo Film & Releasing → AZPM → HBODocs → GrasshalmClips → Lenny Cooke Movie); each section is a fullscreen still + network logo + caption + `▷ Watch` CTA → `/watch/[id]` (PRES-01).
  3. `/about` renders Michelle's user-approved first-person bio verbatim (reused from `_four` 06-02) layered over an ambient muted reel loop (same producer reel as `/`'s hero); under `prefers-reduced-motion: reduce` the bg degrades to a still poster instead; an embedded `<ContactBlock />` lives below the bio (ABT-01).
  4. `/contact` renders a minimal full-bleed surface — Michelle's name in display serif over a static poster, with the `<ContactBlock />` centered (CONT-01 home).
  5. The shared `<ContactBlock />` appears on `/contact`, `/about`, AND the site-wide restyled `<Footer />` — 5 contact channels (email, phone, IMDb, LinkedIn, Vimeo) on every prerendered route from a single `mailto:` literal source-of-truth, with the same channel-homepage IMDb/LinkedIn fallbacks as `_four` (CONT-01, CONT-02, CONT-03).
**Plans**: 4 plans (3 + 1 gap-closure)

Plans:
- [x] 06-01-PLAN.md — Shared chrome (ContactBlock + Footer + +layout.svelte mount + trailingSlash='always' + TopNav /press fade extension + svelte.config.js handleHttpError cleanup) — CONT-01/02/03 component-level + D-13/D-14/D-15/D-16/D-20/D-21
- [x] 06-02-PLAN.md — PBS landing + Press reel surfaces (ReelStage intro?: Snippet slot + ReelSection pbsCollectionUrl prop + verbatim _pbsCollectionUrl regex + flat-array _pressCredits + 3-browser e2e + axe) — PBS-01/02/03 + PRES-01
- [x] 06-03-PLAN.md — About + Contact splash surfaces (HeroAmbient wordmark/tagline props + bio approval gate + Person JSON-LD + /contact static-poster splash + 3-browser e2e with reduced-motion emulation + cross-surface CONT-01 check) — ABT-01 + CONT-01 + CONT-02
- [x] 06-04-PLAN.md — Gap closure: broaden TopNav scroll-target querySelector to match both reel container labels so the D-16 chrome-fade fires on /press (press.spec.ts Test D) — PRES-01 (D-16)

### Phase 7: Polish & Cutover
**Goal**: The site is production-ready and A/B-eligible. Per-page SEO + JSON-LD + sitemap + Lighthouse CI + axe-core CI all gate; real-device QA matrix signs off; the 5 A/B integrity traps (videos.json drift, OG asymmetry, sitemap canonical, shared localStorage, divergent entry routes) are all mitigated explicitly; production cutover infrastructure (`static/CNAME`, `deploy-production.yml`, atomic noindex flip, 9-step Launch Runbook) is ready to fire IF and ONLY IF `_three` wins the A/B vs `_four`.
**Depends on**: Phase 6
**Requirements**: FOUND-03, POL-01, POL-02, POL-03, POL-04, POL-05
**Success Criteria** (what must be TRUE):
  1. Every route has a per-page `<title>` + meta description; OG/Twitter cards work; Person JSON-LD lives on `/about`; VideoObject JSON-LD lives on every `/watch/[id]`; a build-time `sitemap.xml` endpoint enumerates 70 URLs identical in shape to `_four`'s (POL-01; Pitfall 11 mitigated).
  2. Lighthouse CI gates the `/` LCP < 2.5s on simulated 4G — poster image first paint, hero iframe deferred until interaction or 1s idle. Initial CI posture is warning-only; pre-cutover posture is blocking (POL-02).
  3. The poster→iframe swap on every reel section causes zero measurable layout shift (CLS contribution ≤ 0); `100svh` (not `vh`, not `dvh`) is used for every scroll-snap section, verifiable by grep (POL-03; Pitfall 2 mitigated).
  4. axe-core CI catches WCAG AA violations on every PR; a manual real-device QA matrix (iOS 16, iOS 17.0/17.1, iOS 17.2+, Chrome Android, Firefox desktop, Safari macOS) is signed off and documented before cutover (POL-04).
  5. All localStorage keys are namespaced `mnp_three_*` (Trap D mitigation — both siblings share `wolfwdavid.github.io` origin), and OG image dimensions are byte-identical to `_four`'s (Trap B mitigation) — verifiable by grep + filesize diff (POL-05).
  6. Production cutover infrastructure (`static/CNAME` = `michellengo.net`, `deploy-production.yml` workflow, atomic noindex flip pattern inherited from `_four` D-16, 9-step Launch Runbook) is committed and ready; the cutover fires only after the user declares `_three` the A/B winner. The runbook is reviewable end-to-end and the cutover is reversible (FOUND-03).
**Plans**: 5 plans

Plans:
- [x] 07-01-PLAN.md — Metadata core: sitemap.xml endpoint (70 URLs) + layout favicon/OG block + / brand-only title + JSON-LD audit + test-prerender-coverage.mjs (POL-01)
- [x] 07-02-PLAN.md — Cinematic-dark binary assets: favicon set (6) + 1200×630 og-image + .nojekyll, with asset-authoring checkpoint (POL-01/POL-05 Trap B)
- [x] 07-03-PLAN.md — axe 7-route harden + POL-03 100svh/CLS grep gate + D-17 measure-first Lighthouse (POL-02/03/04)
- [x] 07-04-PLAN.md — CI trap gates: prerender-coverage assert + Trap E route-manifest diff + Trap B OG-dim diff + Lighthouse CI; verify Trap A/D (POL-02/04/05)
- [x] 07-05-PLAN.md — Cutover infra: CNAME + deploy-production.yml + staged D-12 atomic flip + consolidated 07-QA-MATRIX.md + 9-step Launch Runbook (FOUND-03/POL-04)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-05-25 |
| 2. Data Layer | 3/3 | Complete | 2026-05-25 |
| 3. Reel System Core | 3/3 | Complete (code-level — real-device QA deferred to UAT, see 03-HUMAN-UAT.md) | 2026-05-26 |
| 4. Wayfinding | 3/3 | Complete | 2026-05-26 |
| 5. Hero & Watch | 3/3 | Complete (code-level — human UAT pending, see 05-HUMAN-UAT.md) | 2026-05-27 |
| 6. PBS / Press / About / Contact | 4/4 | Complete | 2026-05-28 |
| 7. Polish & Cutover | 0/5 | Planned | - |

---
*Roadmap created: 2026-05-19*
*Phases: 7 (mirrors `_four` for A/B structural parity)*
*Coverage: 42/42 v1 requirements mapped, zero orphans*
