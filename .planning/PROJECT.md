# Michelle Ngo Portfolio — Cinematic Cut

## What This Is

A second, contrasting design of **Michelle Ngo**'s filmmaker portfolio — built as a sibling to `../michelle_ngo_four` (which shipped as the editorial-modern v1). Same 56 deduped videos, same hiring-producer audience, same SvelteKit stack — but a **cinematic-immersive** visual language: dark full-bleed, scroll-snapped fullscreen reels with silent muted preview loops, a persistent category filter pill bar for wayfinding, and an A24 / MUBI / Criterion aesthetic that lets the films breathe. The two builds will be A/B-evaluated and the preferred direction will own the production `michellengo.net` cutover.

## Core Value

A hiring producer can scroll through Michelle's filmography like a cinema reel — each video taking the full screen with silent motion — and feel the work the way they would in a screening room, not a portfolio grid.

## Requirements

### Validated

- [x] **FOUND-01** — Validated in Phase 1: Foundation (clean `pnpm build` with TS strict + Svelte 5 runes + Tailwind v4)
- [x] **FOUND-02** — Validated in Phase 1: Foundation (GH Actions auto-deploy to `wolfwdavid.github.io/michelle_ngo_three/` confirmed live by user)
- [x] **DATA-01** — Validated in Phase 2: Data Layer (`videos.json` byte-identical to `_four` via `cmp -s` + sha256 match `fd15e056…`; sidecar pins `_four@07667658`)
- [x] **DATA-02** — Validated in Phase 2: Data Layer (`validateVideosPlugin()` wired in `vite.config.ts` between Tailwind and SvelteKit; smoke-test confirms `this.error()` aborts build on schema mismatch)
- [x] **DATA-03** — Validated in Phase 2: Data Layer (11-name `$lib/data` public surface live; `pnpm check` clean; data + ui Vitest projects both green — 49 tests / 7 files)
- [x] **DATA-04** — Validated in Phase 2: Data Layer (drift-check job appended to `deploy.yml`; runs on every PR + push to main; Trap A "silent `_four` divergence" now caught at CI boundary)
- [x] **REEL-01** — Validated in Phase 3: Reel System Core (`/work` renders 56 fullscreen `h-svh snap-y snap-proximity` sections with article-landmark wrapper)
- [x] **REEL-02** — Validated in Phase 3: Reel System Core (silent muted autoplay via raw iframe URL params per `$lib/iframe/url.ts`; no `@vimeo/player` dep)
- [x] **REEL-03** — Validated in Phase 3: Reel System Core (single IntersectionObserver per ReelStage, mountedIds capped at 3 — current ±1 viewport-windowed mounting confirmed at unit + e2e level)
- [x] **REEL-04** — Validated in Phase 3: Reel System Core (unified poster-fallback codepath observable in `ReelSection.svelte:65` — 5 triggers collapse through one `$derived(motion.prefersReducedMotion || network.isCellularLike || autoplayFailedFromPreviewLoop)`; per-section isolation proven)
- [x] **REEL-05** — Validated in Phase 3: Reel System Core (title + category overlay + `▷ PLAY WITH SOUND` deep-link present in ReelSection + PosterImage)
- [x] **REEL-06** — Validated in Phase 3: Reel System Core (PreviewLoop 4-state lifecycle + 5-layer leak defense; mount/dispose symmetry pinned by unit test)
- [x] **REEL-07** — Validated in Phase 3: Reel System Core (Page Visibility broadcast via `reel:visibility` context; pause-not-unmount with `wasHidden` transition guard)
- [x] **FILT-01** — Validated in Phase 4: Wayfinding (sticky `<FilterPillBar />` renders 9 pills — 8 categories + "All" reset — above the reel on `/work` and `/work/[category]`)
- [x] **FILT-02** — Validated in Phase 4: Wayfinding (tapping a pill navigates to `/work/[category]`; URL is canonical source of state, no parallel store)
- [x] **FILT-03** — Validated in Phase 4: Wayfinding (reload/paste `/work/[category]` reproduces filtered reel from prerendered HTML on first paint)
- [x] **FILT-04** — Validated in Phase 4: Wayfinding (8 `/work/[category]` routes prerendered via `entries: EntryGenerator`)
- [x] **NAV-01** — Validated in Phase 4: Wayfinding (cinematic `<TopNav />` chrome-fades via `opacity-0 pointer-events-none` during reel scroll, surfaces on hover/focus/tap; PBS dual-route active state on `/pbs-american-portrait/` AND `/work/pbs-american-portrait/`)
- [x] **NAV-02** — Validated in Phase 4: Wayfinding (Arrow/PageUp/PageDown/Space/Home/End map to section-to-section navigation; roving tabindex bounds reel tab-stops to 1; double-ring focus visible against dark video backgrounds)
- [x] **NAV-03** — Validated in Phase 4: Wayfinding (skip-link → `<main id="main" tabindex="-1">` landmark; `<article aria-label="Video N of M: [title]">` per section; SR rotor surfaces 1 main + 1 header + 2 navs + 56 articles, not a 56-region explosion)
- [x] **HERO-01** — Validated in Phase 5: Hero & Watch (`<HeroAmbient />` at `src/lib/components/HeroAmbient.svelte` ships 5-layer z-stack — poster + deferred PreviewLoop + gradient + content + scroll-cue; Vimeo 264677021 via `buildEmbedUrl(v,'preview')`; wordmark + tagline + PLAY REEL CTA visible in `build/index.html`)
- [x] **HERO-02** — Validated in Phase 5: Hero & Watch (`↓` scroll-cue at `HeroAmbient.svelte:179-184`; `/+page.svelte` renders `<ReelStage>` directly below `<HeroAmbient>`; e2e `hero.spec.ts` confirms scroll-past reveals first ReelSection)
- [x] **HERO-03** — Validated in Phase 5: Hero & Watch (CTA href `${base}/watch/${producerReelId}`; built iframe src `?autoplay=1&dnt=1&playsinline=1` — sound-on contract, no `muted=`; sticky-activation real-device confirmation flagged to Phase 7 POL-04 UAT)
- [x] **WATCH-01** — Validated in Phase 5: Hero & Watch (`<WatchPlayer />` letterbox + 8-transition chrome-fade state machine; consumes `vimeoAdapter` pause subscription added in Plan 05-01; 15 unit tests cover all transitions)
- [x] **WATCH-02** — Validated in Phase 5: Hero & Watch (title + uploader · year + CategoryTag rendered below player; shared `chromeFaded` $bindable drives synchronized fade)
- [x] **WATCH-03** — Validated in Phase 5: Hero & Watch (`<ContinueReelRail />` pure-CSS `scroll-snap-type: x mandatory`, poster-only `<a>` cards, no nested iframes; replaces `_four`'s grid rail)
- [x] **WATCH-04** — Validated in Phase 5: Hero & Watch (56 prerendered `build/watch/<id>.html` files via `entries: EntryGenerator` returning `videos.map(v => ({id: v.id}))`; VideoObject JSON-LD per route)
- [x] **WATCH-05** — Validated in Phase 5: Hero & Watch (ReelStage hash-restore `$effect` consumer at lines 174-201 + Phase 3 debounced writer at 129-132; D-14 narrowing: hash-only — NO history.state — documented and approved in 05-CONTEXT.md; debounce-timing real-device confirmation flagged to Phase 7 POL-04 UAT)
- [x] **PBS-01** — Validated in Phase 6: PBS / Press / About / Contact (`/pbs-american-portrait/` renders section zero as the verbatim PBS blockquote over a still + sections 1-18 as the 18 PBS videos in `/work`-format scroll-snap reel)
- [x] **PBS-02** — Validated in Phase 6: PBS / Press / About / Contact (15 of 18 PBS sections carry a "See on PBS →" badge linking to the collection URL via the per-video `getPbsCollectionUrl` hook on ReelStage)
- [x] **PBS-03** — Validated in Phase 6: PBS / Press / About / Contact (TopNav PBS link active on both `/pbs-american-portrait/` and `/work/pbs-american-portrait/` — dual-route parity with `_four`)
- [x] **PRES-01** — Validated in Phase 6: PBS / Press / About / Contact (`/press` renders 13 broadcast credits as prestige-ordered scroll-snap sections, each with a `▷ Watch` CTA → `/watch/[id]`; D-16 chrome-fade now fires on `/press`, closed via Plan 06-04)
- [x] **ABT-01** — Validated in Phase 6: PBS / Press / About / Contact (`/about` two-act layout — HeroAmbient producer-reel hero + verbatim user-approved bio + embedded `<ContactBlock />`; reduced-motion degrades to a still poster; Person JSON-LD inline)
- [x] **CONT-01** — Validated in Phase 6: PBS / Press / About / Contact (shared `<ContactBlock />` on `/contact`, `/about`, AND the site-wide `<Footer />` — 5 channels from a single `mailto:` source-of-truth on every prerendered route)
- [x] **CONT-02** — Validated in Phase 6: PBS / Press / About / Contact (IMDb + LinkedIn channel-homepage fallbacks match `_four`; personalized-URL swap remains a pre-cutover HUMAN-UAT blocker)
- [x] **CONT-03** — Validated in Phase 6: PBS / Press / About / Contact (site-wide `<Footer />` cinematic restyle mirrors TopNav nav + surfaces the 5 contact channels on every route)

### Active

#### Foundation

- [ ] **FOUND-03**: Production deploy reachable on `michellengo.net` apex with HTTPS (cutover-gated; only triggers if `_three` wins A/B)

#### Polish & Cutover

- [ ] **POL-01**: Per-page `<title>` + meta descriptions, OG/Twitter cards, Person JSON-LD on `/about`, VideoObject JSON-LD on every `/watch/[id]`, build-time `sitemap.xml` endpoint, favicon set + og-image (parity with `_four` Phase 7)
- [ ] **POL-02**: Cinematic chrome budget — `/` LCP < 2.5s on a simulated 4G connection (poster image first paint, reel hero iframe deferred until interaction or 1s idle) — looser than `_four`'s 2.0s budget because we're betting on cinema over speed
- [ ] **POL-03**: No layout shift on poster→iframe swap; iframes inherit the section's exact aspect-ratio container
- [ ] **POL-04**: Production cutover infrastructure (`static/CNAME` = `michellengo.net`, `deploy-production.yml` workflow, Launch Runbook) ready to fire if `_three` wins the A/B

### Out of Scope

- **Hover-to-preview on grid cards** — `_four`'s territory; `_three` has *no grid view*. Every browse surface IS the immersive reel.
- **CMS integration** — same 56-video corpus, JSON-in-repo stays
- **Newsletter capture, analytics, contact form, i18n** — same exclusions as `_four`
- **Real-time chat, hover autoplay on small thumbnails, video uploading UI** — same exclusions as `_four`
- **Mobile native app / Capacitor wrap** — web-only, like `_four`
- **Re-authoring `videos.json`** — explicitly reuse `_four`'s. Drift between siblings would invalidate the A/B comparison.
- **Pre-generated short MP4 preview clips** — would be lower bandwidth than full Vimeo/YouTube iframes, but breaks the videos.json reuse mandate and adds a content pipeline. Defer to v2 if `_three` wins and we want to optimize.
- **Migrating non-video disciplines from the WordPress site** — same as `_four`, video-focus only

## Context

**Sibling project — `../michelle_ngo_four`:**
- Shipped v1.0 complete (Phases 1–7 done, 168/168 unit tests passing, GH Pages staging at `https://wolfwdavid.github.io/michelle_ngo_four/`)
- Design DNA: reel-led editorial-modern, full-bleed WebP hero + gradient + name/tagline + PLAY REEL CTA, YouTube-style 2/3/4-col responsive grid with OKLCH per-category accents, blur-up thumbs, click-to-filter routing
- Reference vibe: samhendi.com + isotopefilms.com (let thumbnails carry color, chrome stays monochrome)
- All planning artifacts in `../michelle_ngo_four/.planning/` are the authoritative source for shared specs (videos.json contents, PBS blockquote, About bio, ContactBlock contract)

**Existing site (michellengo.net):**
- Same context as `_four` — WordPress.com, will be cut over to whichever sibling wins A/B
- Contact: `mynogo [at] gmail.com`, (917) 566-1976, IMDb + LinkedIn

**Reference design language for `_three` (cinematic-immersive):**
- **a24films.com** — dark, full-bleed, films take the whole viewport, minimal chrome
- **mubi.com** — cinematic editorial, type breathes over imagery, restrained palette
- **criterion.com** — film-first hierarchy, no busy UI competing with the work
- **Cinema mode in modern video apps** — silent muted loops as ambient browse signal

**Video corpus** (reused verbatim from `_four`):
- 56 videos, 14 YouTube + 43 Vimeo, deduped
- 18 PBS American Portrait, 12 promos/trailers, 8 branded, smaller buckets (Doc, Reel, Personal, Educational)
- Source-of-truth: `../michelle_ngo_four/src/lib/data/videos.json` — copied into `src/lib/data/videos.json` at Phase 2 and held in sync via manual review (no symlink; SvelteKit static builds work better with files in-tree)

## Constraints

- **Tech stack**: SvelteKit 2.59+ + Svelte 5.55+ + TypeScript 5.9+ strict (+ noUncheckedIndexedAccess + noImplicitOverride) + Tailwind v4.3+ + pnpm — locked to match `_four` exactly so the A/B isolates *design*, not framework ergonomics
- **Data**: `videos.json` byte-identical to `_four`'s; same Zod schema; same Vite build-fail plugin
- **Hosting**: Static-export-friendly (`@sveltejs/adapter-static`); deploys to GitHub Pages (matches `_four`'s D-05 override)
- **Domain**: `michellengo.net` stays on WordPress.com until A/B winner is chosen; staging at `wolfwdavid.github.io/michelle_ngo_three/` during dev
- **Compatibility**: Modern evergreen browsers only — iOS Safari 16+, Chrome/Edge/Firefox current. Scroll-snap + IntersectionObserver are non-negotiable load-bearing APIs.
- **Performance**: Cinema-first, not speed-first — LCP target 2.5s on 4G (looser than `_four`'s 2.0s). Viewport-windowed iframes + cellular poster fallback are the budget's load-bearing decisions.
- **Bandwidth ethics**: On cellular, default to poster + tap-to-play. Never autoplay 56 video iframes on metered connections.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `_three` is a real shipping candidate, not a mockup | User decision at kickoff — both siblings get full polish so the A/B is fair | — Pending |
| Scroll-snap fullscreen reel (one video = one viewport) | Cinematic-immersive design direction chosen at kickoff over editorial / archive / bento alternatives | — Pending |
| Silent muted preview loops via native Vimeo/YouTube iframes (`?autoplay=1&mute=1&loop=1`) | Reuses `_four`'s videos.json without a preview-clip content pipeline; native embeds handle silent autoplay reliably across browsers | — Pending |
| Viewport-windowed iframe mounting (current ± 1) | Mounting 56 iframes simultaneously would melt mobile browsers; ±1 buffer keeps scroll buttery without burning bandwidth | — Pending |
| Cellular = poster + tap-to-play (no autoplay) | Bandwidth ethics + perceived perf on metered connections; detected via `navigator.connection.effectiveType` | — Pending |
| Persistent filter pill bar above reel (8 categories + All) | User chose this for wayfinding over side drawer / section-zero menu / hybrid; URL state via `/work/[category]` mirrors `_four` exactly | — Pending |
| 7-route IA mirrors `_four` exactly | Direct A/B requires same surfaces, only different design language; collapsing routes would conflate "design change" and "IA change" | — Pending |
| Reuse `_four`'s videos.json byte-for-byte | A/B comparison only valid if both siblings serve the same catalog; re-authoring would introduce drift | — Pending |
| Reuse `_four`'s About bio + PBS blockquote + ContactBlock contract | Same single-source-of-truth assets to keep the A/B isolated to visual layer | — Pending |
| LCP budget 2.5s (vs `_four`'s 2.0s) | Cinema-first design accepts a slightly heavier first paint in exchange for an ambient muted reel hero; tracked, not waived | — Pending |
| GitHub Pages staging (D-05 from `_four` carried forward) | Same auto-deploy workflow proven on `_four`; pipeline-in-repo over dashboard-managed Cloudflare Pages | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

## Current State

- **Phase 1: Foundation — Complete (2026-05-25).** Buildable, deploying SvelteKit scaffold live at `wolfwdavid.github.io/michelle_ngo_three/`. All day-one conventions locked: `mnp_three_` storage namespace, double-ring focus token, dark OKLCH palette, 7 self-hosted woff2 fonts, `PUBLIC_SITE_URL` env. CI pipeline runs 4 smoke gates + D-17 grep gate before every deploy.
- **Phase 2: Data Layer — Complete (2026-05-25).** `videos.json` + 4 loader files + 4 test files mirrored byte-identical from `_four` (sha256 `fd15e056…`, pinned via `.videos-source-sha`). `validateVideosPlugin()` wired into Vite — schema violations abort `pnpm build`. `drift-check` CI job catches silent `_four` divergence on every PR/main. oEmbed health-check infra shipped (`scripts/check-embeds.ts` + nightly Action) — link rot will auto-file an issue before users see it. `pnpm check` 0 errors / `pnpm test` 49 tests green.
- **Phase 3: Reel System Core — Complete (2026-05-26).** The killer feature ships. `/work` renders all 56 videos as fullscreen scroll-snap sections (`h-svh snap-y snap-proximity`) with a single IntersectionObserver per stage and current ±1 viewport-windowed iframe mounting. PreviewLoop ships the 4-state lifecycle (idle → mounting → playing → paused) with 5-layer leak defense; URL-param-driven raw iframes (no `@vimeo/player` dep) plus Vimeo + YouTube postMessage adapters with origin allowlists. REEL-04 unified poster-fallback codepath observable as ONE `$derived` collapsing 5 triggers (reduced-motion, cellular, save-data, autoplay-failed, embed-disabled). Page Visibility broadcast pauses-not-unmounts when the tab hides. Build-time poster pipeline (`check-embeds.ts --posters-only` + `validatePostersPlugin`) ships 56 JPEGs + `posters.json` sidecar. Playwright 4-pillar e2e suite green across Chromium + WebKit + Firefox. `pnpm test` 165/165 / `pnpm check` 0 errors / `pnpm test:e2e` 21 passed. **Real-device QA (BrowserStack 7-OS matrix + physical iPhone thermal test) deferred to UAT** — tracked in `03-HUMAN-UAT.md` (status: partial); MUST close before Phase 7 cutover per CONTEXT D-13/D-14/D-16.
- **Phase 4: Wayfinding — Complete (2026-05-26).** Navigation contract ships. `<FilterPillBar />` renders a sticky 9-pill row (8 categories + "All") above the reel; URL is the canonical source of state — `/work/[category]` via `entries: EntryGenerator` prerenders 8 routes so reload/paste reproduces the filtered reel from HTML on first paint. Cinematic `<TopNav />` chrome-fades via `opacity-0 pointer-events-none` (never `display:none` — SR-safe), surfaces on hover/focus/tap, with verbatim PBS dual-route active-state guard. `$lib/state/menu.svelte.ts` rune exposes `menu.menuOpen` for the D-08 menu-pause bridge consumed by `ReelStage` as `documentHidden = $derived(pageHidden || menu.menuOpen)`. NAV-02 keyboard handler maps Arrow/PageDown/PageUp/Space±Shift/Home/End to section navigation with roving tabindex bounding reel tab-stops to 1. Skip-link → `<main id="main" tabindex="-1">` landmark + `<article aria-label="Video N of M: [title]">` per section delivers a clean SR rotor (1 main + 1 header + 2 navs + 56 articles). Chrome-height math via `--chrome-nav-height` + `--chrome-pill-height` CSS vars in container `calc(100svh - …)`. 261/261 unit tests green; 4 new Playwright e2e specs (~33 tests × 3 browsers) covering NAV-01 chrome-fade, NAV-02 keyboard, FILT-01..03 routing, D-08 mobile-menu pause. **iOS Safari real-device aesthetic QA deferred** — chrome-fade timing under address-bar collapse, focus-ring legibility against live video, touch-scroll feel; tracked for human review, not gating.
- **Phase 5: Hero & Watch — Complete (2026-05-27).** Entry + playback surfaces ship. `/` replaces the Phase 1 splash with `<HeroAmbient />` (5-layer z-stack: poster + deferred PreviewLoop + gradient + wordmark/tagline/PLAY REEL CTA + scroll-cue) above `<ReelStage videos={data.videos} />`. HeroAmbient owns its own runed IntersectionObserver, deferred-load racing rIC/1s-timeout/first-interaction via `createHeroDefer` factory (Phase 6 ABT-01 carry-forward), and the unified REEL-04 fallback collapsing reduced-motion + cellular + autoplayFailed into one poster path. `/watch/[id]` ships `<WatchPlayer />` letterbox + 8-transition chrome-fade state machine (consumes Vimeo `pause` postMessage event subscribed in Plan 05-01) and `<ContinueReelRail />` pure-CSS scroll-snap-x rail of same-category siblings — replacing `_four`'s grid rail. All 56 watch routes prerender via `entries()`; each carries VideoObject JSON-LD. Foundation extensions (Plan 05-01): layout-scope `pageVisibility` rune at `$lib/state/visibility.svelte.ts` (consumed by ReelStage + HeroAmbient + PreviewLoop via shared `'reel:visibility'` context), `vimeoAdapter` `pause` subscription with symmetric dispose, `playsinline=1` unconditional in `buildEmbedUrl` (iOS Safari in-document playback), ReelStage hash-restore `$effect` consumer with `restoredFromHash` guard. D-14 narrowing approved: hash-only restoration, NO history.state writes. 346/346 unit tests / 0 type errors across 610 files / 27 cross-browser e2e tests green (chromium + webkit + firefox). **7 real-browser UAT items deferred to Phase 7 POL-04** — tracked in `05-HUMAN-UAT.md` (status: partial); cross-origin postMessage timing + sticky-activation audio + debounced-hash-write/snap-settle interplay are non-deterministic in headless and need real-device verification on BrowserStack iOS Safari 16/17.x matrix.
- **Phase 6: PBS / Press / About / Contact — Complete (2026-05-28).** The four content surfaces ship, content-identical to `_four` with a cinematic restyle. `/pbs-american-portrait/` renders the verbatim PBS blockquote as section zero (via the new ReelStage `intro?: Snippet` slot) over the 18 PBS videos in `/work`-format scroll-snap, with a per-video "See on PBS →" badge on 15 of 18 sections (`getPbsCollectionUrl` hook). `/press` renders 13 prestige-ordered broadcast credits as poster-only scroll-snap sections (flat `PressCredit[]` shape), each with a `▷ Watch` CTA → `/watch/[id]`. `/about` ships a two-act layout — HeroAmbient producer-reel hero (extended with `wordmark?`/`tagline?` props) + verbatim user-approved bio + embedded `<ContactBlock />` + inline Person JSON-LD; reduced-motion degrades to a still poster. `/contact` is a single `h-svh` poster-bg splash with centered `<ContactBlock />`. The shared `<ContactBlock />` (5 channels from a single `mailto:` source-of-truth) now appears on `/contact`, `/about`, and the site-wide `<Footer />` mounted in `+layout.svelte`. `trailingSlash='always'` adopted; `svelte.config.js` handleHttpError allow-list removed (strict prerender restored). **D-16 chrome-fade gap closed via Plan 06-04** — TopNav's scroll-target querySelector broadened to a selector-list matching both `Filmography reel` and `Press credits reel` containers, so the fade fires on `/press` too. 440/440 unit tests / 0 type errors across 639 files; `press.spec.ts` 15/15 across chromium + webkit + firefox. Verified 7/7 must-have truths.
- **Next:** Phase 7 (Polish & Cutover) — SEO + JSON-LD audit + sitemap + Lighthouse CI + axe-core CI + real-device QA matrix (closes the Phase 3/5 deferred HUMAN-UAT items) + A/B-integrity traps + production cutover infrastructure.

---
*Last updated: 2026-05-28 after Phase 6 completion*
