# Requirements: Michelle Ngo Portfolio — Cinematic Cut

**Defined:** 2026-05-19
**Core Value:** A hiring producer can scroll through Michelle's filmography like a cinema reel — each video taking the full screen with silent motion — and feel the work the way they would in a screening room, not a portfolio grid.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: `pnpm build` produces a clean static build with TypeScript strict mode (+ `noUncheckedIndexedAccess` + `noImplicitOverride`), Svelte 5 runes, and Tailwind v4 utilities rendering correctly
- [x] **FOUND-02**: Pushing to `main` triggers a GitHub Actions deploy and the site is reachable at `wolfwdavid.github.io/michelle_ngo_three/` over HTTPS within minutes of build completion (`BASE_PATH=/michelle_ngo_three/`)
- [ ] **FOUND-03**: Production cutover infrastructure is ready (`static/CNAME` + `deploy-production.yml` + 9-step Launch Runbook); production deploy reachable on `michellengo.net` apex with HTTPS only fires if `_three` wins the A/B vs `_four`

### Data Layer

- [x] **DATA-01**: `src/lib/data/videos.json` is byte-identical to `../michelle_ngo_four/src/lib/data/videos.json` (source-of-truth reuse — not re-authored)
- [x] **DATA-02**: The same Zod schema + Vite build-fail plugin from `_four` validates `videos.json` at build time; intentionally breaking a record fails the build
- [x] **DATA-03**: The same `$lib/data` typed loader surface as `_four` (`videos`, `producerReelId`, `getById`, `getByCategory`, category helpers) is drop-in compatible
- [x] **DATA-04**: Cross-repo byte-diff CI check fails the build if `_three`'s `videos.json` drifts from `_four`'s (A/B integrity — Trap A mitigation)

### Immersive Reel (Killer Feature)

- [ ] **REEL-01**: `/work` renders the 56 videos as fullscreen scroll-snapped sections (one video per `100svh` viewport, `scroll-snap-type: y proximity`)
- [ ] **REEL-02**: Each visible section autoplays a silent muted preview loop via the native Vimeo/YouTube embed (`?autoplay=1&mute=1&loop=1&playsinline=1`)
- [ ] **REEL-03**: Viewport-windowed mounting — only the current section + 1 above + 1 below are mounted as iframes; off-window sections fall back to `<PosterImage />` (perf gate; one IntersectionObserver per `ReelStage`)
- [ ] **REEL-04**: Poster fallback codepath triggers on ANY of: `prefers-reduced-motion: reduce`, cellular connection (`effectiveType` ∈ {`2g`, `3g`, `slow-2g`} where API is available — Chromium only), iOS Low Power Mode (`play()` rejection caught), embed-disabled-by-owner (oEmbed health check), EU default-to-poster-until-interaction posture (inherit `_four`'s no-CMP "interaction-as-consent" pattern)
- [ ] **REEL-05**: Each section renders title (bottom-left), category tag (top-right), and `▷ PLAY WITH SOUND` action deep-linking to `/watch/[id]`
- [ ] **REEL-06**: Iframe lifecycle implements 4-state machine (unmounted → mounted-loading → mounted-playing → unmounting) with 5-layer leak defense (Svelte teardown + adapter `dispose()` + observer `disconnect()` + named listener refs + `MessageEvent.origin` filtering); validated by memory-leak test in Phase 3
- [ ] **REEL-07**: Page Visibility API pauses preview loops when the tab is backgrounded; resumes when foregrounded (battery/thermal mitigation)

### Wayfinding

- [ ] **FILT-01**: Sticky `<FilterPillBar />` above the reel renders 8 category pills + "All" reset (PBS, Promo, Branded, Doc, Reel, Personal, Educational + All)
- [ ] **FILT-02**: Tapping a pill filters the reel to that category and updates URL to `/work/[category]`; URL is the canonical source of state (no parallel store)
- [ ] **FILT-03**: Reloading or pasting `/work/[category]` reproduces the filtered reel from server-prerender
- [ ] **FILT-04**: 8 `/work/[category]` slug routes are prerendered via `entries()` (parity with `_four`)
- [ ] **NAV-01**: Cinematic-minimal `<TopNav />` (wordmark + 8 category links + About/Press/Contact + mobile hamburger) — chrome fades during reel scroll, surfaces on hover/tap/focus; D-13 active-state on prerendered HTML via `endsWith` suffix-match
- [ ] **NAV-02**: Keyboard navigation works — Arrow keys + PageUp/PageDown jump section-to-section, Tab exits scroll-snap to TopNav, Escape returns to top; visible focus ring contrasts dark video bg
- [ ] **NAV-03**: Skip-to-content link visible only on focus, lands on `<main>`; section landmarks use `<article aria-label="Video N of M: [title]">` (suppresses screen-reader page-explosion)

### Home & Reel-Led Entry

- [ ] **HERO-01**: `/` renders `<HeroAmbient />` — Michelle's producer reel (Vimeo 264677021) playing silently muted as the entire `100svh` background, gradient overlay, name + tagline + `▷ PLAY REEL` CTA centered; iframe is always-mounted (not viewport-windowed) since hero is single-instance
- [ ] **HERO-02**: `↓` scroll-cue invites entry; scrolling past hero reveals the first ReelSection of the full `/work` reel below
- [ ] **HERO-03**: `▷ PLAY REEL` navigates to `/watch/264677021` and the embed plays with sound

### Watch View

- [ ] **WATCH-01**: `/watch/[id]` plays the selected video full-bleed letterboxed on full black (Vimeo/YouTube embed); chrome fades out on play and back in on hover/pause via postMessage events
- [ ] **WATCH-02**: Below the player, title + uploader + category + year metadata fade in on idle, fade out on play
- [ ] **WATCH-03**: `<ContinueReelRail />` horizontal carousel surfaces same-category siblings beneath the player (replaces `_four`'s grid rail)
- [ ] **WATCH-04**: 56 `/watch/[id]` slug routes prerender via `entries()` (parity with `_four`)
- [ ] **WATCH-05**: Back-nav from `/watch/[id]` restores the user to the same section they came from (via `history.state` + hash fragment on entry)

### PBS American Portrait

- [ ] **PBS-01**: `/pbs-american-portrait/` renders a dedicated landing — section zero is the verbatim PBS blockquote (reused from `_four` 05-01 Candidate C) over a still; sections 1-18 are the 18 PBS American Portrait videos in the immersive scroll-snap reel format
- [ ] **PBS-02**: 15 of 18 PBS video sections carry a `See on PBS →` badge linking to the collection URL (3 lack a URL by design — IDs 620232398, 1007061884, 1007027015 — same as `_four`)
- [ ] **PBS-03**: TopNav PBS link active-state covers both `/pbs-american-portrait/` and `/work/pbs-american-portrait/` (filter route parity with `_four`)

### Press, About, Contact

- [ ] **PRES-01**: `/press` renders 13 broadcast credits as vertical scroll-snap sections in prestige order (HBO Max → HBO → PBS → ABC News → U2 → Amazon News → Music Box Films → Monument Releasing → Cargo Film & Releasing → AZPM → HBODocs → GrasshalmClips → Lenny Cooke Movie); each section is a fullscreen still + network logo + caption + `▷ Watch` CTA → `/watch/[id]`
- [ ] **ABT-01**: `/about` renders Michelle's user-approved first-person bio (reused verbatim from `_four` 06-02) layered over an ambient muted reel loop (same producer reel as `/` hero); embedded `<ContactBlock />` below; reduced-motion serves still poster instead
- [ ] **CONT-01**: Shared `<ContactBlock />` lives on `/contact`, `/about`, AND the site-wide `<Footer />` (single `mailto:` literal source-of-truth — same pattern as `_four`); 5 contact channels appear on every prerendered route
- [ ] **CONT-02**: IMDb + LinkedIn URLs use the same channel-homepage fallbacks as `_four` (pre-cutover blocker — Michelle's personalized URLs swap in before A/B winner cutover)
- [ ] **CONT-03**: Site-wide `<Footer />` (cinematic restyle of `_four`'s pattern) mirrors TopNav (categories + secondary nav) and surfaces 5 contact channels on every route

### Polish & Cutover

- [ ] **POL-01**: Per-page `<title>` + meta descriptions across all 7 routes; sitewide OG/Twitter cards; Person JSON-LD on `/about`; VideoObject JSON-LD on every `/watch/[id]`; build-time `sitemap.xml` endpoint (70 URLs — matches `_four`)
- [ ] **POL-02**: Cinematic chrome budget — `/` LCP < 2.5s on simulated 4G (poster image first paint, hero iframe deferred until interaction or 1s idle); Lighthouse CI gates this in CI (warning-only initially, blocking pre-cutover)
- [ ] **POL-03**: No layout shift on poster→iframe swap; iframes inherit each section's exact aspect-ratio container; `100svh` (not vh / not dvh) for scroll-snap section height
- [ ] **POL-04**: axe-core CI catches WCAG AA violations; manual real-device QA matrix (iOS 16, iOS 17.0/17.1, iOS 17.2+, Chrome Android, Firefox desktop, Safari macOS) signs off before cutover
- [ ] **POL-05**: All localStorage keys namespaced `mnp_three_*` (Trap D mitigation — both siblings share `wolfwdavid.github.io` origin); identical OG image dimensions to `_four` (Trap B mitigation)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Performance

- **PERF-V2-01**: Pre-generated short MP4 preview clips (10s key moments per video) replacing full Vimeo/YouTube iframes — lower bandwidth, faster paint, but adds a content pipeline. Revisit if `_three` wins A/B and we want to optimize.
- **PERF-V2-02**: AVIF poster generation in addition to WebP for ~15-20% further savings
- **PERF-V2-03**: Service worker for offline-capable hero + first 3 reel sections

### Accessibility

- **A11Y-V2-01**: Custom WebVTT captions/transcripts beyond Vimeo/YouTube native `cc=1` (re-evaluate if a producer flags a specific gap)
- **A11Y-V2-02**: Audio descriptions track on producer reel

### Features

- **FEAT-V2-01**: Analytics (Plausible) — defer to v2 if conversion measurement is needed
- **FEAT-V2-02**: Cookieless EU CMP integration (only if "interaction-as-consent" posture is found insufficient)
- **FEAT-V2-03**: Custom share modal beyond default `mailto:`

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| YouTube-style grid view | `_four`'s territory; `_three` has NO grid view — every browse surface IS the immersive reel. Coexistence would dilute the design statement. |
| CMS integration (Sanity/Airtable) | Same 56-video corpus, JSON-in-repo stays — drift between siblings would invalidate the A/B |
| Hover-autoplay grid previews | No grid view exists; preview lives in the reel itself |
| Real-time chat / customer-facing comms | Not in `_four`, not in `_three` |
| Video upload / authoring UI | Edit via PR for v1; same as `_four` |
| Newsletter capture / mailing list | No demonstrated need |
| Analytics for v1 | Defer to v2 (Plausible if added) |
| Contact form | `mailto:` is sufficient — same as `_four` |
| i18n | English-only — same as `_four` |
| Non-video disciplines from WP site (UX, Publishing, Copywriting) | Predate the video focus, don't fit cinematic-immersive model — same as `_four` |
| Mobile native app / Capacitor wrap | Web-only — same as `_four` |
| Re-authoring `videos.json` | Explicitly reuse `_four`'s byte-for-byte; drift invalidates the A/B |
| Pre-generated MP4 preview clips | Would be lower bandwidth than full iframes but breaks reuse mandate and adds a pipeline; deferred to v2 if `_three` wins |
| Light-mode palette | Explicit dark-only design statement — `prefers-color-scheme: light` is intentionally not supported |
| Custom video player chrome | Don't layer over Vimeo/YouTube native controls — let the platforms handle their own UX |
| Audio autoplay anywhere | Cardinal sin; all autoplay is muted |
| Music / ambient sound on `/` or `/about` | Heavy-handed cinema gimmick; the muted reel is enough |
| Custom non-skippable page transitions | Adds friction without producer value |
| Video-as-cursor effects | Performative; hurts the work |
| Parallax effects | Risk of overuse; muted reel loops are already motion-rich |
| Blocking intro splash screen | Hostile to producers in a hurry |
| Hover-required interactions on mobile | Inaccessible on touch |
| Infinite scroll without filter affordance | Without `<FilterPillBar />`, scroll-snap traps users (Pitfall 7 / WCAG fail) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 7 | Pending |
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| REEL-01 | Phase 3 | Pending |
| REEL-02 | Phase 3 | Pending |
| REEL-03 | Phase 3 | Pending |
| REEL-04 | Phase 3 | Pending |
| REEL-05 | Phase 3 | Pending |
| REEL-06 | Phase 3 | Pending |
| REEL-07 | Phase 3 | Pending |
| FILT-01 | Phase 4 | Pending |
| FILT-02 | Phase 4 | Pending |
| FILT-03 | Phase 4 | Pending |
| FILT-04 | Phase 4 | Pending |
| NAV-01 | Phase 4 | Pending |
| NAV-02 | Phase 4 | Pending |
| NAV-03 | Phase 4 | Pending |
| HERO-01 | Phase 5 | Pending |
| HERO-02 | Phase 5 | Pending |
| HERO-03 | Phase 5 | Pending |
| WATCH-01 | Phase 5 | Pending |
| WATCH-02 | Phase 5 | Pending |
| WATCH-03 | Phase 5 | Pending |
| WATCH-04 | Phase 5 | Pending |
| WATCH-05 | Phase 5 | Pending |
| PBS-01 | Phase 6 | Pending |
| PBS-02 | Phase 6 | Pending |
| PBS-03 | Phase 6 | Pending |
| PRES-01 | Phase 6 | Pending |
| ABT-01 | Phase 6 | Pending |
| CONT-01 | Phase 6 | Pending |
| CONT-02 | Phase 6 | Pending |
| CONT-03 | Phase 6 | Pending |
| POL-01 | Phase 7 | Pending |
| POL-02 | Phase 7 | Pending |
| POL-03 | Phase 7 | Pending |
| POL-04 | Phase 7 | Pending |
| POL-05 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-19*
*Last updated: 2026-05-19 — roadmap creation corrected total count from 41 to 42 (8 reqs added during requirements pass: DATA-04, REEL-06, REEL-07, NAV-02, NAV-03, WATCH-05, CONT-03, POL-05 without recounting at the time)*
