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

### Active

#### Foundation

- [ ] **FOUND-03**: Production deploy reachable on `michellengo.net` apex with HTTPS (cutover-gated; only triggers if `_three` wins A/B)

#### Immersive Reel (the killer feature)

- [ ] **REEL-01**: `/work` renders the 56 videos as fullscreen scroll-snapped sections (one video = one viewport, vertical snap)
- [ ] **REEL-02**: Each visible section autoplays a silent muted preview loop using the native Vimeo/YouTube embed (`?autoplay=1&mute=1&loop=1`)
- [ ] **REEL-03**: Viewport-windowed mounting — only the current section + 1 above + 1 below are mounted as iframes; off-screen sections fall back to poster image (perf gate)
- [ ] **REEL-04**: On cellular connections (`navigator.connection.effectiveType` ∈ {`2g`,`3g`,`slow-2g`}) all sections show poster + tap-to-play instead of autoplay (bandwidth fallback)
- [ ] **REEL-05**: Each section shows title (bottom-left), category tag (top-right), and a `▷ PLAY WITH SOUND` action that deep-links to `/watch/[id]`

#### Wayfinding

- [ ] **FILT-01**: Sticky filter pill bar above the reel renders 8 category pills (PBS, Promo, Branded, Doc, Reel, Personal, Educational, plus an "All" reset)
- [ ] **FILT-02**: Tapping a pill filters the reel to only that category's videos; URL becomes `/work/[category]` (deep-linkable, mirrors `_four`'s routing)
- [ ] **FILT-03**: Reloading or pasting a `/work/[category]` URL reproduces the filtered reel
- [ ] **FILT-04**: 8 `/work/[category]` slug routes are prerendered (parity with `_four`)
- [ ] **NAV-01**: Minimal cinematic TopNav (wordmark + 8 category links + About/Press/Contact + hamburger on mobile) — chrome fades during reel scroll, surfaces on hover/tap

#### Home & Reel-Led Entry

- [ ] **HERO-01**: `/` renders a fullscreen ambient hero — Michelle's producer reel (Vimeo 264677021) playing silently muted as the entire background, gradient overlay, name + tagline + `▷ PLAY REEL` CTA centered
- [ ] **HERO-02**: A `↓` scroll-cue invites the user into the reel; scrolling `/` reveals the first sections of the `/work` reel below the hero
- [ ] **HERO-03**: `▷ PLAY REEL` navigates to `/watch/264677021` and the embed plays with sound

#### Watch View

- [ ] **WATCH-01**: `/watch/[id]` plays the selected video full-bleed (Vimeo/YouTube embed, max comfortable letterbox) with title + uploader + category metadata fading in below
- [ ] **WATCH-02**: Below the player, a "Continue the reel" rail surfaces same-category siblings (cinematic horizontal carousel, not _four's grid rail)
- [ ] **WATCH-03**: 56 `/watch/[id]` slug routes prerender (parity with `_four`)

#### PBS American Portrait

- [ ] **PBS-01**: `/pbs-american-portrait/` renders a dedicated landing — fullscreen PBS title section + the verbatim PBS blockquote (reused from `_four` Phase 5) + 18 PBS videos in the same immersive scroll-snap reel format
- [ ] **PBS-02**: Each PBS video section carries a "See on PBS →" badge linking to its collection URL (where available — 15 of 18 have URLs)
- [ ] **PBS-03**: TopNav PBS link is active on both `/pbs-american-portrait/` and `/work/pbs-american-portrait/` (filter route parity with `_four`)

#### Press, About, Contact

- [ ] **PRES-01**: `/press` surfaces 13 broadcast credits in cinematic prestige order (HBO Max → HBO → PBS → ABC → U2 → Amazon → Music Box → Monument → Cargo → AZPM → HBODocs → Grasshalm → Lenny Cooke), each linking to `/watch/[id]`
- [ ] **ABT-01**: `/about` renders Michelle's user-approved first-person bio (reused verbatim from `_four`) over an ambient still or muted reel loop
- [ ] **CONT-01**: Shared `<ContactBlock />` lives on `/contact`, `/about`, AND the site-wide footer (single `mailto:` literal source-of-truth — same pattern as `_four`)
- [ ] **CONT-02**: IMDb + LinkedIn URLs use the same channel-homepage fallbacks as `_four` until Michelle's personalized URLs land (pre-cutover blocker tracked in HUMAN-UAT)

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
- **Next:** Phase 3 (Reel System Core — load-bearing risk) — fullscreen scroll-snap reel with viewport-windowed iframe mounting (the killer feature; cellular fallback gated here).

---
*Last updated: 2026-05-25 after Phase 2 completion*
