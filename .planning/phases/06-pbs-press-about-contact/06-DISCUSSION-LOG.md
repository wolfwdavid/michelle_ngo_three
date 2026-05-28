# Phase 6: PBS / Press / About / Contact - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 06-pbs-press-about-contact
**Areas discussed:** PBS section-zero design, Press section anatomy, /about + /contact composition, Site chrome (Footer + fade scope)

---

## Gray Areas Selected

| Option | Description | Selected |
|--------|-------------|----------|
| PBS section-zero design | How the verbatim PBS blockquote presents as the first section of the scroll-snap reel — still source, subtitle + outbound link placement, per-section badge placement, snap participation. | ✓ |
| Press section anatomy | 13 vertical scroll-snap sections per PRES-01 — still source, network identity treatment, section composition, multi-credit handling. | ✓ |
| /about + /contact composition | Two pages sharing a "name/wordmark + bg + ContactBlock" pattern but differing in fidelity — /about ambient muted reel, /contact static poster. | ✓ |
| Site chrome: Footer + fade scope | Footer cinematic restyle vs `_four`'s mono editorial 3-column + chrome-fade scope extension to /press. | ✓ |

**User's choice:** All four areas selected for discussion.

---

## PBS section-zero design

### Q1: Section zero background still source

| Option | Description | Selected |
|--------|-------------|----------|
| Producer reel poster (Recommended) | Vimeo 264677021 poster — same still anchoring `/` hero fallback and (per ABT-01) `/about` reduced-motion fallback. One reused asset across all hero-still surfaces. | ✓ |
| Curated PBS still | Pick one representative still from the 18 PBS videos and use its poster as section-zero bg. | |
| Black/typographic-only | No still — pure cinematic typography on bg-neutral-950. | |
| Pull a frame from PBS source | Fetch a representative frame from pbs.org/american-portrait or PBS press still. | |

**User's choice:** Producer reel poster (Recommended)
**Notes:** Cinematic continuity — every "hero moment" surface shares the same still. Zero new content authoring.

### Q2: Subtitle + outbound link arrangement within section zero

| Option | Description | Selected |
|--------|-------------|----------|
| Subtitle above, outbound below (Recommended) | Matches `_four` D-09/D-12 order verbatim, restyled for full-bleed. Subtitle → blockquote → outbound → scroll-cue. | ✓ |
| Subtitle as overlay chip | Subtitle as top-right chip; outbound link inside blockquote attribution. | |
| No subtitle — blockquote-only | Drop subtitle; blockquote + attribution + outbound compose alone. | |
| Subtitle below blockquote | Reverse order — blockquote first, then subtitle as attribution-style line. | |

**User's choice:** Subtitle above, outbound below (Recommended)
**Notes:** Reuses `_four`'s content shape; only canvas treatment changes.

### Q3: Per-PBS-section "See on PBS →" badge placement (sections 1-18)

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right with CategoryTag (Recommended) | Extends Phase 3 D-10 overlay: CategoryTag + "See on PBS →" badge stacked top-right. | ✓ |
| Inline with title overlay | Badge below bottom-left title, near "▷ PLAY WITH SOUND" CTA. | |
| Dedicated right-edge chip | New vertical strip on right edge with badge as sticky chip. | |
| Below PLAY WITH SOUND CTA | Stack badge below existing CTA as secondary action. | |

**User's choice:** Top-right with CategoryTag (Recommended)
**Notes:** Visual consistency with established reel-section overlay pattern; both are "meta" chrome about this section's video.

### Q4: Section zero scroll-snap participation

| Option | Description | Selected |
|--------|-------------|----------|
| Section zero IS the first snap section (Recommended) | snap-start, h-svh, uniform with sections 1-18. Single ReelStage instance handles all 19. | ✓ |
| Static intro above the snap container | Section zero in non-snap wrapper, snap engages from video 1. | |
| Sticky overlay until first scroll | Sticks until user begins to scroll past, then snap takes over. | |
| Two separate ReelStage instances | Blockquote in non-snap wrapper, separate ReelStage below. | |

**User's choice:** Section zero IS the first snap section (Recommended)
**Notes:** Matches REQUIREMENTS PBS-01 wording ("sections 1-18 ... in the same immersive scroll-snap reel format"). Producer scrolls from blockquote into video 1 with the same cinematic rhythm.

---

## Press section anatomy

### Q1: Per-section background still source

| Option | Description | Selected |
|--------|-------------|----------|
| Poster of that credit's video (Recommended) | Each section's bg = poster of network's one credit video via `getPosterFor()`. Zero new authoring; reuses Phase 3 posters.json sidecar. | ✓ |
| Network-branded canvas | Dark canvas with network name as focal typographic moment (no poster). | |
| Curated still per network | Hand-pick a still per network — 13 extra curation decisions. | |
| Muted preview loop (cellular-gated) | Each section auto-plays the credit's video as silent muted loop. | |

**User's choice:** Poster of that credit's video (Recommended)
**Notes:** Consistent with reel-poster pipeline; producer recognizes same poster they see on /work or /watch/[id].

### Q2: Network identity treatment within each section

| Option | Description | Selected |
|--------|-------------|----------|
| Text wordmark only (Recommended) | Network name in `--font-display` Source Serif 4. Zero new asset pipeline. Matches `_four`'s "no logo wall" rejection. | ✓ |
| Real network logos | Source actual logo images from network press kits — adds 13 assets + licensing + per-network treatment decisions. | |
| Wordmark + accent treatment | Text wordmark + small custom typographic accent per network. | |
| Wordmark + small monogram | Text wordmark + single-letter monogram mark. | |

**User's choice:** Text wordmark only (Recommended)
**Notes:** Cinematic restraint matches `_three`'s monochrome-chrome ethos.

### Q3: DOM/visual composition within each /press section

| Option | Description | Selected |
|--------|-------------|----------|
| Network top, title center, CTA bottom (Recommended) | Cinema-credit framing: network (production house) → title (piece) → ▷ Watch (view). Distinct from /work overlay convention. | ✓ |
| Title top, network below, CTA centered | Asset-forward framing — title first, network second, CTA centered. | |
| Mirror /work overlay convention | Title bottom-left + network top-right + ▷ Watch inline with title. | |
| Centered single composition | All elements stacked vertically and centered. | |

**User's choice:** Network top, title center, CTA bottom (Recommended)
**Notes:** Marks /press as deliberately different surface even though it shares scroll-snap chassis.

### Q4: Multi-credit network handling

| Option | Description | Selected |
|--------|-------------|----------|
| One section per credit (Recommended) | Flat array — each video = own fullscreen section. Press helper output `Array<{ network, video }>`. | ✓ |
| One section per network, list titles | Group by network like `_four` does — multi-credit network = one section with title list. | |
| One section per network, feature one credit | Group by network with featured credit + "+N more →" link. | |
| Skip the question — 1:1 today | Don't design for multi-credit scenarios; address when data changes. | |

**User's choice:** One section per credit (Recommended)
**Notes:** Most cinematic (every credit is its own moment); forward-defensive for future data growth.

---

## /about + /contact composition

### Q1: /about overall layout pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Two-act, mirror `/` (Recommended) | Ambient-reel hero (h-svh) → scroll → bio on dark canvas. Reuses Phase 5 HeroAmbient + createHeroDefer factory. | ✓ |
| Single surface, bio over ambient | Bio sits directly over ambient reel with gradient overlay — one continuous hero surface. | |
| Three scroll-snap acts | Ambient + bio + ContactBlock as three snap sections. | |
| Editorial banner + prose column | Ambient as small banner, bio + ContactBlock in editorial column below. | |

**User's choice:** Two-act, mirror `/` (Recommended)
**Notes:** Reuses Phase 5 createHeroDefer factory (designed specifically for this Phase 6 reuse per Plan 05-03 STATE note). Coherent site pattern: "ambient reel hero → scroll → content".

### Q2: ContactBlock placement on /about

| Option | Description | Selected |
|--------|-------------|----------|
| Below bio, same scroll (Recommended) | Bio paragraph (max-w-2xl editorial reading width) + ContactBlock stacked below on dark canvas after ambient hero. | ✓ |
| Side-by-side with bio (desktop) | Two-column desktop: bio left, ContactBlock right sidebar. | |
| Separate scroll-snap section after bio | Bio = one section, ContactBlock = own fullscreen scroll-snap section. | |
| Floating sticky chip | ContactBlock pinned as bottom-right floating panel visible throughout scroll. | |

**User's choice:** Below bio, same scroll (Recommended)
**Notes:** Matches `_four`/D-22 layout convention; reading ergonomics for the ~100-word bio.

### Q3: /contact splash background

| Option | Description | Selected |
|--------|-------------|----------|
| Producer reel poster (Recommended) | Reuses Vimeo 264677021 poster — same still everywhere there's a hero-still surface. | ✓ |
| Different curated still | Pick a different still suited to name+contact composition. | |
| Black/typographic-only | No still — pure cinematic typography on bg-neutral-950. | |
| Ambient muted reel loop | Same as /about — ambient reel as bg. | |

**User's choice:** Producer reel poster (Recommended)
**Notes:** One asset everywhere there's a hero-still surface. Honors ROADMAP success criterion 4 wording "static poster."

### Q4: Name treatment + ContactBlock composition within /contact splash

| Option | Description | Selected |
|--------|-------------|----------|
| Wordmark top, ContactBlock centered (Recommended) | Upper-third: MICHELLE NGO wordmark (display-serif, same as `/`). Center: ContactBlock. Bottom: scroll-cue to Footer. | ✓ |
| Centered name + below-name ContactBlock | Centered vertical stack — wordmark + ContactBlock directly below. | |
| Lower-third composition | Both name and ContactBlock in lower-third of viewport over poster (cinema-credit slate). | |
| Asymmetric (name left, contact right) | Editorial-asymmetric — wordmark bottom-left, ContactBlock bottom-right. | |

**User's choice:** Wordmark top, ContactBlock centered (Recommended)
**Notes:** Cinema-credit-slate composition. Splash fills h-svh; scrolls to expose universal Footer.

---

## Site chrome: Footer + fade scope

### Q1: Footer column structure for `_three`

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror `_four` 3-column verbatim (Recommended) | Contact / Work (8 categories, PBS retargeted) / Site (About + Press + Contact + View All Work →). A/B parity at chrome layer. | ✓ |
| Thin inline strip | Single horizontal row with all links inline + copyright. | |
| Centered single column | ContactBlock + categories + secondary nav + copyright stacked centered. | |
| 4-column with socials separated | Contact / Work / Site / Socials (IMDb + LinkedIn + Vimeo broken out). | |

**User's choice:** Mirror `_four` 3-column verbatim (Recommended)
**Notes:** Footer IS the IA-mirror element (NAV-02 / CONT-03); structure should match `_four` so A/B isolates design language not IA.

### Q2: Footer category links accent treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Mono (Recommended, matches `_four` D-31) | Category links stay neutral white-on-dark with underline-on-hover. Accents reserved for TopNav active + page headings + CategoryTag. | ✓ |
| Per-category OKLCH accents | Each link in its `--color-cat-*` accent color. | |
| Accent on hover/focus only | Mono by default; accent kicks in on hover/focus. | |
| Accent underline only | Text stays white; underline-on-hover in category accent color. | |

**User's choice:** Mono (Recommended)
**Notes:** Adding accents in Footer would dilute the accent semantic ("color marks current/relevant category").

### Q3: Footer visual weight for cinematic site

| Option | Description | Selected |
|--------|-------------|----------|
| Same as `_four` — quiet hairline (Recommended) | `border-t border-white/10` + bg-neutral-950 continuous + py-12 md:py-16. Quiet directory chrome. | ✓ |
| Heavier cinema chrome band | Distinct darker band + more vertical padding. | |
| Letterboxed footer | Rendered inside black letterbox bars matching /watch/[id] WatchPlayer. | |
| Lighter/thinner | Minimal hairline + tighter py-6 md:py-8. | |

**User's choice:** Same as `_four` — quiet hairline (Recommended)
**Notes:** Footer is "quiet directory chrome" regardless of design language. Lets cinema upstream carry visual weight.

### Q4: Chrome-fade D-06 scope extension to /press

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — extend fade to /press (Recommended) | /press is scroll-snap reel (just with posters not iframes). Same cinematic chrome treatment. No FilterPillBar on /press. | ✓ |
| No — keep TopNav solid on /press | /press is credentials list; persistent chrome aids navigability. | |
| Fade only when ContactBlock isn't visible | TopNav fades only mid-scroll between credit sections; surfaces near top/bottom. | |
| Yes, AND `documentHidden` extends to /pbs-american-portrait/ iframes | Extend fade + ensure mobile-menu pause covers PBS landing iframes (already covered by D-08). | |

**User's choice:** Yes — extend fade to /press (Recommended)
**Notes:** /press IS a scroll-snap reel surface; chrome-fade scope is ROUTE-shape-driven (any scroll-snap reel route) rather than CONTENT-domain-driven (only filmography category routes).

---

## Claude's Discretion

Open during plan-phase / research:
- Exact gradient overlay stop math for PBS section-zero and /contact splash (Phase 5 D-05 sets shape; precise values tuned in plan/UI phase)
- Section-zero implementation pattern in ReelStage (new slot vs polymorphic child vs separate wrapper)
- Whether /press uses ReelStage reused or new PressStage component
- PBS h1 typography on section zero (accent color vs neutral)
- Whether /about reuses HeroAmbient verbatim or instantiates a separate AboutHero component
- /about ABOUT wordmark sizing relative to `/` MICHELLE NGO wordmark
- Press section sub-sort within prestige bucket when data has duplicates
- Footer column-header microcopy ("Contact" / "Work" / "Site" vs alternatives)
- Footer "View All Work →" link href (trailing slash vs not — `_four` chose no trailing)
- Footer bottom-strip alignment (centered vs left-aligned — `_four` chose centered)
- Whether /contact + /about use `<main>` or `<section>` outermost landmark (layout already provides `<main id="main">`)
- Whether Person JSON-LD ships in Phase 6 or defers to Phase 7 POL-01
- PBS outbound link styling (text-only "→" vs icon ↗)
- ESLint per-file override pattern for new components

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section — Phase 7 polish items (Person JSON-LD audit, OG/Twitter cards, personalized IMDb/LinkedIn URLs, noindex removal, Lighthouse CI gate hardening) + carried-forward rejections from `_four` Phase 5/6 + `_three`-specific deferred ideas (animated transitions, per-section still fallback, multi-credit "list view", PBS sticky outbound, /about defer-load alternates, /contact scroll-cue, ContactBlock snippet vs component, sticky Footer, PBS accent gradient, /press cinema micro-copy).

---

*Discussion log written: 2026-05-27*
