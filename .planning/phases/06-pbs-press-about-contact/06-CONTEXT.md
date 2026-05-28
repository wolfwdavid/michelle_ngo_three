# Phase 6: PBS / Press / About / Contact - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the four content surfaces (`/pbs-american-portrait/`, `/press`, `/about`, `/contact`) plus the site-wide `<Footer />` + shared `<ContactBlock />` component. Content is reused **verbatim** from `_four` (bio, PBS blockquote, prestige-ordered press list, ContactBlock channel literals, IMDb/LinkedIn channel-homepage fallbacks). The cinematic restyle is the work — design language differs from `_four`'s editorial-modern; IA, content, and contracts do not.

In scope:
- `src/routes/pbs-american-portrait/+page.{ts,svelte}` (new prerendered route) — section zero (verbatim PBS blockquote over producer-reel-poster still) + 18 PBS American Portrait videos as scroll-snap reel sections; 15 of 18 sections carry "See on PBS →" badge top-right (3 PBS rows lack collection URL by design — IDs 620232398, 1007061884, 1007027015 per `_four` PBS-02)
- `src/routes/press/+page.{ts,svelte}` (new prerendered route) — 13 vertical scroll-snap sections (one per credit; flat array, not grouped), each a fullscreen still + text-wordmark network identity + title caption + ▷ Watch deep-link
- `src/routes/press/_pressCredits.ts` (new, route-local underscore-prefix) — `getPressCredits()` derives from `videos.json` filter `uploader !== 'Michelle Ngo'`, prestige-ordered per `_four`'s `PRESTIGE_ORDER` constant; output shape is **flat array** of `{ network, video }` not grouped (D-08 — one section per credit)
- `src/routes/about/+page.svelte` (new prerendered route) — two-act layout mirroring `/`: ambient producer-reel hero (h-svh) with "ABOUT" wordmark + scroll-cue → scroll → bio paragraph on dark canvas (max-w-2xl) → ContactBlock stacked below. Reduced-motion → ambient becomes static poster (consistent with `/` fallback)
- `src/routes/contact/+page.svelte` (new prerendered route) — minimal full-bleed splash: producer-reel poster bg + "MICHELLE NGO" wordmark top + ContactBlock centered + scroll-cue inviting scroll to Footer
- `src/lib/components/ContactBlock.svelte` (new shared component) — 5-row vertical channel list (Email → Phone → IMDb → LinkedIn → Vimeo) reused VERBATIM on /about, /contact, and Footer column 1. IMDb + LinkedIn ship as channel-homepage fallbacks (`https://www.imdb.com/`, `https://www.linkedin.com/`) per `_four` Phase 7 deferral inherited here; Vimeo = `https://vimeo.com/user2149742` from PROJECT.md seed
- `src/lib/components/Footer.svelte` (new site-wide component) — 3-column desktop / 1-column mobile grid mirroring `_four`'s structure verbatim: Column 1 ContactBlock, Column 2 mirrored 8 categories (PBS retargeted to `/pbs-american-portrait/`), Column 3 secondary nav (About / Press / Contact / View All Work →). Mono category links (no accent dilution); hairline `border-t border-white/10` + bg-neutral-950 continuous + py-12 md:py-16
- `src/routes/+layout.svelte` extension — `<Footer />` rendered below `{@render children()}` (sibling to existing `<TopNav />`)
- Phase 4 D-06 chrome-fade scope extension — chrome-fade D-06 now covers `/press` in addition to existing `/work*` and `/pbs-american-portrait/` (no FilterPillBar on /press — it's category filters, irrelevant on press surface)
- Bio copy authored by planner from public signals + `<approved>` element in 06-02-PLAN.md for user sign-off before execution (Phase 5 D-11 pattern carried forward from `_four` PBS Phase 5)
- Tests:
  - Unit: `_pressCredits.test.ts`, `ContactBlock.test.ts`, `Footer.test.ts`
  - Route: `pbs-american-portrait/page.test.ts`, `press/page.test.ts`, `about/page.test.ts`, `contact/page.test.ts`
  - Playwright e2e: covers PBS-01/02/03 (landing + per-section badges + active-state on both routes), PRES-01 (13 scroll-snap sections + prestige order + chrome-fade extension), ABT-01 (two-act layout + ambient fallback under reduced-motion + ContactBlock present), CONT-01 (ContactBlock on /contact + /about + Footer), CONT-02 (channel-homepage fallback URLs verified)

Out of scope (other phases):
- TopNav modifications — `TopNav.svelte` is NOT changed in Phase 6 (Phase 4 D-06 fade rule covers /press via the same `page.route.id` derivation; PBS dual-route active-state already shipped Phase 4)
- Per-page `<title>` + meta description coordination across all 7 routes, Person JSON-LD on `/about`, sitemap.xml endpoint — Phase 7 POL-01 (Phase 6 inlines basic `<title>` + description on each new route; Phase 7 audits + adds Person JSON-LD using the same `IMDB_URL`/`LINKEDIN_URL`/`VIMEO_URL` literals as ContactBlock)
- LCP < 2.5s CI gate (Lighthouse) — Phase 7 POL-02 (Phase 6 ships the cinematic pages; Phase 7 wires the gate)
- Removal of noindex robots meta — Phase 7 cutover (Phase 6 inherits Phase 1 D-11 noindex through cutover)
- Production cutover infrastructure (CNAME / deploy-production.yml / Launch Runbook) — Phase 7 FOUND-03 + POL-04 + POL-05
- Personalized IMDb/LinkedIn profile URLs — pre-cutover blocker tracked in HUMAN-UAT per CONT-02; Phase 6 ships fallbacks; URLs swap in before A/B winner cutover (single-line edit per URL when materializable)
- Auto-linkify URLs in /watch/[id] descriptions globally — Phase 7 polish (no Phase 6 work)
- Sectioned editorial by themed PBS collections, themed chips/badge row, schema-level `pbsOrder` curated-sort field — explicitly rejected at `_four`'s PBS phase, inherited rejection here
- Headshot on /about, Resume/CV download, legacy-disciplines section — explicitly rejected for v1 per `_four` D-20 inheritance (revisitable post-launch)
- Custom share modal, contact form, newsletter, analytics, i18n — Out of Scope per REQUIREMENTS

</domain>

<decisions>
## Implementation Decisions

### PBS section-zero design (`/pbs-american-portrait/`)

- **D-01:** **Section zero bg = producer reel poster** (Vimeo `264677021` poster from Phase 3's `posters.json` sidecar via `getPosterFor()`). Reuses the same still that anchors `/` hero fallback, `/about` reduced-motion fallback, and `/contact` splash (D-11). Single asset across every "hero-still" surface; zero new content authoring. Two-stop gradient overlay for blockquote legibility (mirrors Phase 5 D-05 hero treatment — exact gradient stop math is Claude's Discretion in plan-phase).
- **D-02:** **Subtitle above blockquote, outbound link below.** Top-to-bottom within section zero: small subtitle "18 stories produced by Michelle Ngo" (uppercase tracked, matches `_four` D-09 portfolio-forward credit) → blockquote (verbatim `_four` Candidate C text, centered, max-w-3xl over still) → attribution line "Description from pbs.org/american-portrait" → outbound link "Visit pbs.org/american-portrait →" (target=_blank rel=noopener) → scroll-cue inviting scroll to section 1. Reuses `_four`'s content shape verbatim; only canvas treatment changes (full-bleed cinematic vs editorial).
- **D-03:** **Per-PBS-section "See on PBS →" badge stacks with CategoryTag in top-right corner of each reel section (sections 1-18).** Extends the existing Phase 3 D-10 / REEL-05 overlay pattern: top-right corner gets `<CategoryTag category="PBS American Portrait" />` + the "See on PBS →" badge below it. Visual consistency with the established reel-section overlay; both are "meta" chrome about this section's video. The 3 PBS rows lacking collection URL (IDs 620232398, 1007061884, 1007027015 per `_four` PBS-02 audit) show CategoryTag alone — badge renders only when `pbsCollectionUrl(description) !== null`. Helper extraction logic copies `_four`'s `_pbsCollectionUrl.ts` verbatim (regex extracts first `https://www.pbs.org/american-portrait/collection/...` URL from description; trailing punctuation trimmed).
- **D-04:** **Section zero IS the first scroll-snap section** (`snap-start`, `h-svh`, uniform with sections 1-18). Single `<ReelStage>` instance handles all 19 sections — producer scrolls from blockquote into video 1 with the same cinematic rhythm. Matches REQUIREMENTS PBS-01 wording ("section zero is the verbatim PBS blockquote ... sections 1-18 are the 18 PBS American Portrait videos in the same immersive scroll-snap reel format"). Implementation note: section zero is a non-video sibling of the ReelSection children — may need a new `<ReelStageIntro>` slot or a polymorphic first child; planner picks.

### Press section anatomy (`/press`)

- **D-05:** **Each /press section's bg = poster of that credit's video.** Reuses Phase 3's `posters.json` sidecar via `getPosterFor(video)` — every press section's background is the static JPEG poster of the network's one credit video. Zero new content authoring; consistent with the reel-poster pipeline already shipped. Producer recognizes the same poster they'll see on `/work` or `/watch/[id]`. NO iframes on `/press` (poster-only, in contrast to `/work` and `/pbs-american-portrait/`) — no iframe lifecycle, no Page Visibility broadcast needed, no IntersectionObserver windowing.
- **D-06:** **Network identity = text wordmark only.** Each section renders the network name as a typographic moment in `--font-display` (Source Serif 4) — e.g., "HBO Max" set large and centered. No logo image assets, no licensing review, no per-network color decisions. Inherits `_four`'s "no logo wall" rejection (`_four` 06-CONTEXT deferred ideas) for cinematic restraint matching `_three`'s monochrome-chrome ethos. Networks rebrand without code/asset changes.
- **D-07:** **DOM composition within each press section: network wordmark TOP + video title CENTER + ▷ Watch CTA BOTTOM.** Top of viewport: network wordmark as primary identity moment (largest type). Center: video title as caption (smaller, `--font-sans` Inter, secondary). Bottom: `▷ Watch →` CTA deep-linking to `/watch/[video.id]`. Cinema-credit framing (network = production house, title = piece, CTA = view). Distinct from `/work` reel-section overlay convention (title bottom-left, category top-right per Phase 3 D-10) — marks `/press` as a deliberately different surface even though it shares the scroll-snap chassis.
- **D-08:** **One scroll-snap section per credit (flat array, forward-defensive).** Press helper output shape is `Array<{ network: string; video: Video }>` (NOT grouped by network like `_four`'s `_pressCredits.ts`). Current data: 13 distinct non-Michelle uploaders = 13 sections in prestige order. If a network later gains a second credit, it gets a second fullscreen section in a row (most cinematic — every credit is its own moment). Prestige order inherits `_four`'s `PRESTIGE_ORDER` constant verbatim (`HBO Max → HBO → PBS → ABC News → U2 → Amazon News → Music Box Films → Monument Releasing → Cargo Film & Releasing → AZPM → HBODocs → GrasshalmClips → Lenny Cooke (Movie)`). Within a prestige bucket (single network with multiple credits), sub-sort by featured-first then published-desc (matches Phase 3 D-25 default sort).

### /about + /contact composition

- **D-09:** **/about uses two-act layout mirroring `/`.** Act 1 (top, h-svh): ambient producer-reel hero with "ABOUT" wordmark (display-serif) + scroll-cue. Act 2 (below, dark canvas bg-neutral-950): bio paragraph + ContactBlock. Producer scrolls from ambient hero into bio with the same cinematic rhythm as `/` → reel. **Phase 5 D-03 `createHeroDefer` factory** (introduced specifically for this Phase 6 reuse per Plan 05-03 STATE note) is instantiated here to drive the ambient hero's deferred-load mechanism. Reduced-motion / cellular / autoplayFailed → ambient hero degrades to static producer-reel poster (consistent with `/` fallback codepath; reuses Phase 3 REEL-04 unified codepath via `motion.svelte.ts` + `network.svelte.ts` + `autoplayFailed` flag).
- **D-10:** **/about ContactBlock sits below bio in same vertical scroll on Act 2's dark canvas.** Container: `max-w-2xl mx-auto px-4 sm:px-6 lg:px-8` (editorial reading width matching `_four` D-21). Top-to-bottom of Act 2: bio paragraph (`<p>` with `text-base md:text-lg leading-relaxed text-neutral-200`) → `<ContactBlock />` stacked directly below with `mt-10 md:mt-12` spacing. Single dark-canvas section after the ambient hero. Reading ergonomics good for the ~100-word first-person bio (D-19 below). Matches `_four` D-22 layout convention.
- **D-11:** **/contact splash bg = producer reel poster** (same Vimeo `264677021` poster as PBS section-zero D-01, `/` hero fallback, `/about` reduced-motion fallback). One asset everywhere there's a hero-still surface. ROADMAP success criterion 4 explicitly says "static poster" for /contact (deliberately differentiates from /about's ambient muted reel) — D-11 honors that wording with the producer-reel poster as the static asset. Two-stop gradient overlay for wordmark + ContactBlock legibility (same posture as D-01).
- **D-12:** **/contact composition: "MICHELLE NGO" wordmark top + ContactBlock centered + scroll-cue at bottom.** Single `h-svh` splash. Upper-third: wordmark in `--font-display` Source Serif 4, same typography as `/` hero (visual rhyme between entry surfaces). Center: `<ContactBlock />` as the focal moment, centered horizontally and vertically. Lower edge: `↓` scroll-cue inviting scroll to expose the universal `<Footer />` (CONT-03) below. Cinema-credit-slate composition. Footer scrolls into view via natural document scroll (no scroll-snap on /contact since the splash + footer is the whole page).

### Site chrome: Footer + fade scope extension

- **D-13:** **Footer mirrors `_four`'s 3-column structure verbatim.** Column 1: `<ContactBlock />` (same component, same channel order — Email → Phone → IMDb → LinkedIn → Vimeo). Column 2: 8 mirrored category links in `getCategoriesInDisplayOrder()` order, PBS retargeted to `${base}/pbs-american-portrait/` (other 7 to `${base}/work/${slug}`). Column 3: secondary nav (About / Press / Contact / View All Work →). Bottom strip: `© 2026 Michelle Ngo · Built with SvelteKit` centered. Grid breakpoints: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12`. Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. A/B parity at chrome layer is the principle — only the visual language differs across siblings, not the IA. The Footer IS the IA-mirror element (NAV-02 / CONT-03), so structure should match `_four`.
- **D-14:** **Footer category links stay mono (no OKLCH accent).** Mirrors `_four` D-31. Accents are reserved for: active TopNav link (Phase 4), category-page heading on `/work/[category]` (Phase 3 / `_four` D-26), and `CategoryTag` chips on reel-section overlays. Adding accents in the Footer would dilute the accent semantic — "color marks current/relevant category." All Footer category links render text-white with `hover:underline underline-offset-2` (Phase 3 D-08 inline-link style inherited).
- **D-15:** **Footer visual weight matches `_four`: hairline top border + neutral-950 continuous + py-12 md:py-16.** No distinct darker band; no letterbox treatment; no thinner/heavier deviation. The Footer is "quiet directory chrome" regardless of design language — both `_four` and `_three` benefit from a non-shouty footer that lets the cinema upstream of it carry the visual weight. Top border `border-t border-white/10` (hairline, Phase 3 D-09 divider pattern). Background `bg-neutral-950` continuous with body. Padding `py-12 md:py-16` for generous vertical rhythm. Column heading labels (e.g., "Contact", "Work", "Site"): `text-xs uppercase tracking-wider text-neutral-500` per Claude's Discretion (planner tunes).
- **D-16:** **Phase 4 D-06 chrome-fade scope EXTENDS to `/press`.** Reel routes where TopNav fades during scroll now include: `/work`, `/work/[cat]`, `/pbs-american-portrait/`, AND `/press`. `/press` is a scroll-snap reel surface (just with poster stills not iframes) — same cinematic chrome treatment for visual consistency. **No `<FilterPillBar />` on `/press`** — it's category filters, irrelevant on the press surface (press has its own IA, not category-based). `/about` and `/contact` keep TopNav SOLID (not reel surfaces; their own splash chrome). `documentHidden` mobile-menu-pause rune (Phase 4 D-08) covers `/pbs-american-portrait/` automatically since it uses `<ReelStage>`; `/press` has no iframes so no pause concern.

### Verbatim content reuse (carry-forward from `_four`)

- **D-17:** **PBS blockquote text = `_four` Candidate C verbatim** ("Whether it's joy or sorrow, triumph or hardship, family traditions followed for decades or just the chaos of the morning school run, PBS American Portrait put together a picture of life as it's really lived. The show gives a glimpse into American life, and a chance for everyday Americans to be heard."). Pasted inline in `src/routes/pbs-american-portrait/+page.svelte` with the same attribution "Description from pbs.org/american-portrait" treatment. No re-fetch from pbs.org — `_four`'s user-approved text is the source of truth; Phase 6 inherits the approval.
- **D-18:** **Press prestige order = `_four`'s `PRESTIGE_ORDER` constant verbatim.** `_pressCredits.ts` ports the exact list: `HBO Max → HBO → PBS → ABC News → U2 → Amazon News → Music Box Films → Monument Releasing → Cargo Film & Releasing → AZPM → HBODocs → GrasshalmClips → Lenny Cooke (Movie)`. Section ordering is the cinema-credits scan signal for hiring producers; no rationale change in `_three`.
- **D-19:** **Bio voice = first-person, ~100 words, planner-drafted + user-approved at plan time.** Inherits `_four` D-17/D-18/D-19 pattern: planner uses public signals (PROJECT.md context, REQUIREMENTS, the broadcast credit list derived per D-08) to draft a ~100-word first-person paragraph; surfaces it verbatim in 06-02-PLAN.md inside an `<approved>...</approved>` element for user sign-off before execution. The approved text is then embedded inline in `src/routes/about/+page.svelte` (no separate strings file — i18n is Out of Scope). **Default seed text:** `_four`'s shipped bio ("I'm Michelle Ngo, a filmmaker and producer based in New York City. I make video that helps brands and broadcasters tell stories well — short documentaries, branded films, promos, and trailers. My credits include PBS American Portrait, HBO Max, HBO, ABC News, U2's Sphere residency, Amazon News, and Music Box Films. I love a tight schedule and a thoughtful script. I work hardest when the subject matter is human — real people telling true stories about how they live, what they make, and why it matters. If you have a project that needs a steady hand and a quick turn, get in touch.") — user can approve verbatim or request edits.
- **D-20:** **ContactBlock channel literals = `_four` verbatim.** Email: `mailto:mynogo@gmail.com` → display `mynogo@gmail.com`. Phone: `tel:+19175661976` → display `(917) 566-1976`. Channel order: Email → Phone → IMDb → LinkedIn → Vimeo. Style: Phase 3 D-08 inline-link (`text-white hover:underline underline-offset-2`). All external links: `target="_blank" rel="noopener"`. No obfuscation, no JS-deobfuscation, no contact form.
- **D-21:** **IMDb + LinkedIn ship as channel-homepage fallbacks at launch.** `IMDB_URL = 'https://www.imdb.com/'`, `LINKEDIN_URL = 'https://www.linkedin.com/'`, `VIMEO_URL = 'https://vimeo.com/user2149742'`. Inherits `_four`'s Phase 7 Plan 07-01 deferral decision (2026-05-13) verbatim — personalized profile URLs were not materializable before the cutover window; channel homepages are functional (no 404s) and unblock cutover. **Post-launch backlog item**: swap to personalized URLs of the shape `https://www.imdb.com/name/nm{NUMERIC_ID}/` and `https://www.linkedin.com/in/{HANDLE}/` when materializable — single-line edit in `ContactBlock.svelte` (and Person JSON-LD `sameAs` array on /about once Phase 7 ships it). Tracked as pre-cutover blocker in HUMAN-UAT per CONT-02.

### Claude's Discretion (open during plan-phase / research)

- Exact gradient overlay stop math for PBS section-zero (D-01) and /contact splash (D-11) — Phase 5 D-05 sets the two-stop pattern shape; precise alpha values + percentages tuned during plan or via `/gsd:ui-phase 6`.
- Whether section zero uses a new `<ReelStageIntro>` slot, a polymorphic first child of `<ReelStage>`, or rendered outside ReelStage with the same h-svh + snap-start classes (D-04). All three pass the contract; planner picks based on prop ergonomics.
- Whether `/press` uses `<ReelStage>` reused with a different `videos` prop, or a new dedicated `<PressStage>` component. Recommend reuse with a `kind: 'press'` discriminator since chrome behavior matches; planner verifies whether the section composition (D-07) is compatible with ReelStage's current children-rendering contract or needs a new slot.
- Exact PBS h1 typography on section zero — uppercase tracked display-serif vs sans, accent color vs neutral. `_four` D-08 uses `text-cat-pbs-american-portrait` accent; cinematic-immersive `_three` may want a neutral treatment since the section-zero IS already PBS context. Recommend keeping the PBS OKLCH accent (consistent with TopNav active-state).
- Whether the /about ambient hero reuses `<HeroAmbient />` verbatim (passing `video={getById(producerReelId)}`) or instantiates a separate `<AboutHero />` component that consumes the same `createHeroDefer` factory. Recommend reuse — `<HeroAmbient />` was designed parametric per Plan 05-03 D-01.
- Whether the "ABOUT" wordmark on /about matches `/`'s `MICHELLE NGO` wordmark exactly (same size, same position) or scales down (e.g., one tier smaller since /about isn't the main entry). Recommend match — visual rhyme between entry surfaces.
- Press section sort posture when prestige order has duplicates (D-08 — within-prestige-bucket sub-sort by featured-first then published-desc). Implementation detail; planner verifies the sort produces stable output for current 1:1 data.
- Footer column-header microcopy ("Contact" / "Work" / "Site" vs alternatives). `_four` defaults to "Contact" / "Work" / "Site" — recommend matching unless cinematic context wants different framing.
- Whether the Footer's "View All Work →" link href is `${base}/work` (no trailing slash, matching `_four`) or `${base}/work/` (consistent with the rest of the trailingSlash='always' contract). `_four` chose the no-trailing form; recommend match.
- Bottom-strip alignment in Footer (centered per `_four` D-29 vs left-aligned). `_four` chose centered; recommend match.
- Exact `space-y-*` / `gap-*` tokens within each press section composition (D-07) — planner picks during plan/UI phase.
- Whether `/contact` and `/about` use `<main>` or `<section>` as their outermost landmark inside the layout's `<main id="main">` wrapper. Phase 4 D-11 ships the layout-level `<main>`; recommend new pages use `<section>` to avoid nested main landmarks (axe rule).
- Whether Person JSON-LD payload on `/about` ships in Phase 6 (alongside the new route) or defers to Phase 7 POL-01 audit. `_four` shipped it inline in Phase 6 per Phase 7 Plan 07-02 retrofit; recommend ship in Phase 6 to avoid retrofit (same posture as `_three`'s Phase 5 VideoObject JSON-LD on `/watch/[id]`).
- Whether the PBS landing's outbound link to pbs.org gets a small icon (↗ external link glyph) or text-only "→" arrow. `_four` uses text-only "Visit pbs.org/american-portrait →"; recommend match.
- ESLint per-file override pattern (`svelte/no-navigation-without-resolve`) for new components using `${base}/...` literals — mirror Phase 3/4/5 pattern (already applied to TopNav, FilterPillBar, ReelSection, ContinueReelRail).
- Test scope mapping: which Playwright assertion covers PBS-01 vs PBS-02 vs PBS-03 vs PRES-01 vs ABT-01 vs CONT-01..03 — planner maps in 06-PLAN.
- Whether the `/about` ambient hero PreviewLoop instance shares the `'reel:visibility'` context with the page-level reel (none on /about since the only reel IS the hero) — likely irrelevant since /about has a single ambient instance; planner verifies.

### Folded Todos

None — `gsd-tools todo match-phase 6` returned `todo_count: 0`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 6 requirements + success criteria
- `.planning/ROADMAP.md` §Phase 6: PBS / Press / About / Contact — goal, depends-on Phase 5, 5 success criteria, PBS-01/02/03 + PRES-01 + ABT-01 + CONT-01/02/03 mapping
- `.planning/REQUIREMENTS.md` §PBS American Portrait — PBS-01 (verbatim PBS blockquote over still + 18 videos in scroll-snap reel format), PBS-02 (15 of 18 sections carry See on PBS → badge; 3 IDs lack URL by design: 620232398, 1007061884, 1007027015), PBS-03 (TopNav active on both routes — already shipped Phase 4)
- `.planning/REQUIREMENTS.md` §Press, About, Contact — PRES-01 (13 broadcast credits as vertical scroll-snap sections in prestige order; each section = fullscreen still + network logo + caption + ▷ Watch CTA), ABT-01 (first-person bio reused verbatim from `_four`, ambient muted reel loop bg + reduced-motion still fallback + embedded ContactBlock), CONT-01 (ContactBlock on /contact + /about + Footer — 5 channels every route), CONT-02 (IMDb + LinkedIn channel-homepage fallbacks pre-cutover), CONT-03 (site-wide cinematic Footer mirrors TopNav)
- `.planning/REQUIREMENTS.md` §Polish & Cutover — POL-01 (per-page `<title>` + meta + Person JSON-LD on /about emitted inline in Phase 6 alongside D-19 bio; Phase 7 audits)

### Project-wide context (locked constraints)
- `.planning/PROJECT.md` §Constraints — modern evergreen browsers iOS Safari 16+ / Chrome / Firefox current; scroll-snap as load-bearing API (used on PBS landing + /press); cinema-first LCP 2.5s budget on `/`; bandwidth ethics on cellular
- `.planning/PROJECT.md` §Key Decisions — "Reuse `_four`'s About bio + PBS blockquote + ContactBlock contract" (this phase resolves it), "Silent muted preview loops via native Vimeo/YouTube iframes" (PBS landing + /about ambient hero both consume this), "7-route IA mirrors `_four` exactly" (Footer 3-column mirrors `_four`'s IA per D-13)
- `.planning/PROJECT.md` §Context — current site contact info `mynogo [at] gmail.com`, `(917) 566-1976`, IMDb + LinkedIn — drives D-20 channel literals; Vimeo `user2149742` seed
- `.planning/PROJECT.md` §Current State — Phase 5 ship-state summary; Phase 6 builds atop HeroAmbient + createHeroDefer factory + WatchPlayer + ReelStage hash-restore
- `.planning/STATE.md` §Blockers/Concerns — REEL-04 Chromium-only ambiguity RESOLVED (Phase 3 D-05); EU GDPR posture RESOLVED (Phase 3 D-06); A/B traffic-split STILL OPEN (Phase 7) — does not affect Phase 6 directly

### Phase 5 carry-forward (HeroAmbient + createHeroDefer)
- `.planning/phases/05-hero-watch/05-CONTEXT.md` §decisions D-03 — `createHeroDefer` factory was extracted explicitly for Phase 6 ABT-01 reuse (PreviewLoop.svelte deferred-load mechanism). `/about` D-09 here instantiates the factory rather than the singleton — multiple hero-style surfaces (`/`, `/about`) coexist without timer/listener tangle.
- `.planning/phases/05-hero-watch/05-CONTEXT.md` §decisions D-04 — unified Phase 3 REEL-04 fallback codepath (motion + cellular + autoplayFailed + embedDisabled). `/about` D-09 here reuses this codepath verbatim — ambient hero degrades to producer-reel poster on any of the 5 fallback triggers.
- `.planning/phases/05-hero-watch/05-CONTEXT.md` §decisions D-05 — hero overlay 5-layer z-stack pattern (poster + deferred PreviewLoop + gradient + content + scroll-cue). `/about` D-09 + `/contact` D-11/D-12 here both reuse the gradient + content + scroll-cue layers.
- `src/lib/components/HeroAmbient.svelte` (Phase 5) — `/about` D-09 instantiates this component (or a parametric variant) with `video={getById(producerReelId)}` for the ambient hero.
- `src/lib/state/visibility.svelte.ts` (Phase 5 Plan 05-01) — `pageVisibility` module-scope rune. `/about` hero subscribes via existing `'reel:visibility'` context; mobile-menu open pauses /about's ambient hero just like /work's reel sections.

### Phase 4 carry-forward (chrome-fade scope + Footer infrastructure)
- `.planning/phases/04-wayfinding/04-CONTEXT.md` §decisions D-06 — TopNav chrome-fade scope = reel routes ONLY (`/work*`, `/pbs-american-portrait`). D-16 here EXTENDS this list to add `/press`. Implementation: `page.route.id` derivation in `TopNav.svelte` adds `/press` to the fade-scope match. `/about` and `/contact` keep TopNav SOLID — they have their own splash chrome rules per D-09 / D-11.
- `.planning/phases/04-wayfinding/04-CONTEXT.md` §decisions D-08 — `documentHidden = pageHidden || menu.menuOpen` rune. `/pbs-american-portrait/` D-04 inherits this automatically since it uses `<ReelStage>`. `/press` has no iframes (D-05 poster-only) so no pause concern. `/about` ambient hero subscribes to the same rune via `'reel:visibility'` context.
- `.planning/phases/04-wayfinding/04-CONTEXT.md` §decisions D-13 — URL is canonical source of state, no parallel store. D-21 here keeps the same posture: IMDb/LinkedIn channel-homepage fallback URLs are hardcoded literals in `ContactBlock.svelte`, not a config file or env var (single source of truth, easy to grep + swap when personalized URLs materialize).
- `src/lib/components/TopNav.svelte` (Phase 4) — D-16 here adds `/press` to its existing route-match logic for fade scope. Active-state for PBS dual-route already shipped Phase 4 (`endsWith` suffix-match covers both `/pbs-american-portrait/` and `/work/pbs-american-portrait/`).
- `src/routes/+layout.svelte` (Phase 4) — D-13 here adds `<Footer />` as a sibling of `<TopNav />` below `{@render children()}`.

### Phase 3 carry-forward (PosterImage + ReelStage + posters.json + iframe lifecycle)
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §decisions D-10 — `<article aria-label="Video N of M: [title]">` per section. PBS landing D-04 inherits this for sections 1-18; section zero may need a different landmark (likely `<section aria-labelledby="pbs-intro-heading">` since it's not a video). `/press` D-08 sections need their own landmark contract — planner picks (recommend `<article aria-label="Press credit: [title] on [network]">` for parity with /work's per-section semantics).
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §decisions D-09 — peak-3-iframe budget. PBS landing keeps the same ±1 windowing (18 video sections, only current ±1 mounted). `/press` has no iframes (D-05), so /press is "free" relative to the iframe budget.
- `src/lib/components/ReelStage.svelte` — D-04 + D-08 here reuse this component for PBS landing and /press. Planner verifies whether the current children-rendering contract supports section zero (D-04) and the press section composition (D-07), or needs a new slot/discriminator.
- `src/lib/components/ReelSection.svelte` — PBS landing reuses verbatim for sections 1-18; D-03 extends the top-right overlay to include the "See on PBS →" badge below CategoryTag.
- `src/lib/components/PosterImage.svelte` — `/press` D-05 sections render this as the section bg (poster-only, no iframe).
- `src/lib/data/posters.ts` + `src/lib/data/posters.json` — `getPosterFor(video)` consumed by D-01 (PBS section-zero bg = `getPosterFor(getById(producerReelId))`), D-05 (each /press section bg), D-11 (/contact splash bg). All four hero-still surfaces share Vimeo 264677021's poster.
- `src/lib/state/motion.svelte.ts` + `src/lib/state/network.svelte.ts` — Phase 3 module-scope runes. `/about` D-09 ambient hero subscribes for the REEL-04 fallback codepath.

### Phase 2 carry-forward (data layer)
- `.planning/phases/02-data-layer/02-CONTEXT.md` §decisions D-24 — 11-name public surface (`videos`, `producerReelId`, `getById`, `getByCategory`, `categoryToSlug`, `slugToCategory`, `CATEGORIES`, `getCategoriesInDisplayOrder`, etc.). Phase 6 consumes:
  - `getByCategory('PBS American Portrait')` for PBS landing's 18 video sections (D-04)
  - `videos.filter(v => v.uploader !== 'Michelle Ngo')` for press credits (D-08)
  - `producerReelId` + `getById(producerReelId)` for /about ambient hero (D-09) and /contact poster bg (D-11)
  - `getCategoriesInDisplayOrder()` + `categoryToSlug()` for Footer column 2 mirror (D-13)
- `src/lib/data/index.ts` — public exports; Phase 6 imports all without modification.
- `src/lib/data/videos.json` — 18 PBS records have collection URLs embedded in their `description` field (per `_four` PBS-02 audit). Same 13 non-Michelle uploaders as `_four`. Zero data writes in Phase 6.

### Phase 1 carry-forward
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-05/D-06/D-07/D-08 — double-ring focus token. Every focusable Phase 6 element (ContactBlock links, Footer links, /press ▷ Watch CTAs, PBS "See on PBS →" badges, outbound link to pbs.org) inherits via global `:focus-visible`.
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-11/D-12 — font tokens (`--font-display` Source Serif 4 for /about ABOUT wordmark + /contact MICHELLE NGO wordmark + press network wordmarks; `--font-sans` Inter for ContactBlock + bio + press title captions); 8 OKLCH category accents (only the PBS accent is used in Phase 6 — for PBS h1 on section zero per Claude's Discretion).
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-14..D-17 — `mnp_three_*` storage namespace + grep gate. Phase 6 has NO storage callers (channel URLs hardcoded literals per D-20/D-21; URL is canonical state per Phase 4 D-13).

### Sibling-project reference (verbatim content + structural parity)
- `../michelle_ngo_four/.planning/phases/06-press-about-contact/06-CONTEXT.md` — `_four`'s full Phase 6 design contract. **D-17 first-person bio voice + D-18 ~100-word bio length + D-19 plan-time approval pattern + D-20 no headshot/CV/legacy + D-25..D-32 footer 3-column + D-33..D-38 ContactBlock channel literals + D-10 PRESTIGE_ORDER** all inherit verbatim. The cinematic restyle in `_three` Phase 6 ONLY changes the per-page composition (D-01..D-12 here) — the IA, content, and channel contracts are byte-identical.
- `../michelle_ngo_four/.planning/phases/05-pbs-american-portrait/05-CONTEXT.md` — `_four`'s PBS phase context. **D-10 verbatim PBS blockquote text (Candidate C) + D-11 plan-time user approval pattern + D-21 `_pbsCollectionUrl.ts` helper extraction** all inherit verbatim. The cinematic restyle ONLY changes section composition (D-01..D-04 here) — the blockquote text + per-card URL extraction are byte-identical.
- `../michelle_ngo_four/src/lib/components/ContactBlock.svelte` — D-20/D-21 reference impl: 5-row vertical `<ul>` with hardcoded email/phone/IMDb/LinkedIn/Vimeo URLs (channel-homepage fallbacks for IMDb + LinkedIn per Phase 7 deferral). Copy near-verbatim for `_three`'s ContactBlock; channel literals byte-identical.
- `../michelle_ngo_four/src/lib/components/Footer.svelte` — D-13/D-14/D-15 reference impl: 3-column grid with ContactBlock + 8 category links (PBS retargeted) + secondary nav + copyright bottom strip. Copy structure verbatim per A/B-parity-at-chrome-layer principle. Cinematic restyle is the bg/border/padding tokens (D-15 — same as `_four`, intentionally).
- `../michelle_ngo_four/src/routes/about/+page.svelte` — D-19 bio paragraph reference impl. Default seed text in D-19 above. The cinematic restyle is the surrounding `<main>` wrapper (max-w-2xl on `_four`; two-act ambient hero + dark canvas on `_three` per D-09).
- `../michelle_ngo_four/src/routes/contact/+page.svelte` — D-12 baseline (`_four`'s is `<main class="mx-auto max-w-2xl">` with h1 + ContactBlock). `_three` diverges per D-11/D-12 — full-bleed splash with poster bg + wordmark + centered ContactBlock + scroll-cue.
- `../michelle_ngo_four/src/routes/press/+page.svelte` — D-07/D-08 baseline (`_four`'s is editorial: `<h1>Press</h1>` + grouped `<section>` per network with `<ul>` of titles in max-w-3xl). `_three` diverges per D-07/D-08 — full-bleed scroll-snap sections with poster bg + network wordmark + title caption + ▷ Watch CTA.
- `../michelle_ngo_four/src/routes/press/_pressCredits.ts` — D-08 helper reference impl. Copy `PRESTIGE_ORDER` constant verbatim. ADAPT shape: `_four` returns grouped `Array<{ network, videos }>`; `_three` returns flat `Array<{ network, video }>` per D-08 (one section per credit).
- `../michelle_ngo_four/src/routes/pbs-american-portrait/+page.svelte` — D-01..D-04 baseline (`_four`'s is editorial: h1 + subtitle + blockquote + outbound + h2 + 2/3/4 grid of VideoCards with per-li PBS badge). `_three` diverges — full-bleed scroll-snap reel with section zero + 18 video sections per D-04.
- `../michelle_ngo_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.ts` — D-03 helper reference impl. Copy verbatim — same regex extracts `https://www.pbs.org/american-portrait/collection/...` URLs from PBS video descriptions.

### External references (do NOT need to fetch — `_four` already did)
- `https://www.pbs.org/american-portrait/` — Source of the verbatim PBS blockquote (D-17). `_four` Phase 5 D-11 fetched + got user approval; the approved text is locked in `_four`'s `+page.svelte` line 56-60. `_three` Phase 6 inherits verbatim — no re-fetch.
- Schema.org Person — `https://schema.org/Person` — POL-01 Person JSON-LD payload (planner picks whether ship in Phase 6 inline or defer to Phase 7 audit; recommend Phase 6 per `_four` Plan 07-02 retrofit posture).
- Schema.org VideoObject — `https://schema.org/VideoObject` — already shipped Phase 5 on `/watch/[id]`; Phase 6 doesn't add new VideoObject JSON-LD.
- WCAG 2.4.1 (Bypass Blocks) — skip-link landmarks already shipped Phase 4 (`<main id="main" tabindex="-1">` wrapper). Phase 6 new routes render inside this — no new skip-link work.
- WCAG 2.4.7 (Focus Visible) — Phase 1 D-05 double-ring focus token covers all new Phase 6 focusable elements automatically.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/lib/data/index.ts` — 11-name public surface** (Phase 2 D-24). Phase 6 consumes `videos`, `producerReelId`, `getById`, `getByCategory`, `categoryToSlug`, `getCategoriesInDisplayOrder` — all unchanged.
- **`src/lib/data/posters.ts` + `getPosterFor(video)`** (Phase 3) — D-01 (PBS section-zero bg = producer reel poster), D-05 (each /press section bg = credit's video poster), D-11 (/contact splash bg = producer reel poster) all consume this helper.
- **`src/lib/components/ReelStage.svelte`** (Phase 3 + Phase 5) — D-04 + D-08 reuse for PBS landing (19 sections) and /press (13 sections). Already exposes `setContext('reel:stage', { activeIdx, videoCount, mountedIds })` + `setContext('reel:visibility', { documentHidden })`. Hash-restore $effect ships Phase 5 — already covers `/work#video={id}` for back-nav; PBS landing inherits since it uses ReelStage.
- **`src/lib/components/ReelSection.svelte`** (Phase 3) — PBS landing reuses verbatim for sections 1-18 (D-04); D-03 extends top-right overlay to include "See on PBS →" badge below CategoryTag.
- **`src/lib/components/PosterImage.svelte`** (Phase 3) — `/press` D-05 sections render this directly as bg; `/contact` D-11 splash bg renders this.
- **`src/lib/components/HeroAmbient.svelte`** (Phase 5) — `/about` D-09 ambient hero reuses this component (or a parametric variant) with `video={getById(producerReelId)}`. Plan 05-03 STATE note: createHeroDefer is a FACTORY (not singleton) precisely so /about can instantiate its own.
- **`src/lib/components/PreviewLoop.svelte`** (Phase 3) — wrapped inside HeroAmbient for /about's ambient hero; same 4-state lifecycle + 5-layer leak defense.
- **`src/lib/components/CategoryTag.svelte`** (Phase 3) — D-03 PBS landing renders this in each section's top-right overlay; PBS "See on PBS →" badge stacks below it.
- **`src/lib/state/motion.svelte.ts` + `network.svelte.ts`** (Phase 3) — `/about` D-09 fallback subscribes; reduced-motion or cellular → ambient becomes static poster.
- **`src/lib/state/menu.svelte.ts`** (Phase 4 D-08) — mobile-menu pause rune; PBS landing reel sections + /about ambient hero pause when menu opens; `/press` has no iframes (D-05).
- **`src/lib/state/visibility.svelte.ts`** (Phase 5) — `pageVisibility` module-scope rune; same consumers as above.
- **`src/lib/iframe/url.ts`** (Phase 3) — `buildEmbedUrl(video, mode)` consumed by PBS landing (mode='preview' for sections 1-18) and /about ambient hero (mode='preview').
- **`src/lib/iframe/vimeoAdapter.ts` + `youtubeAdapter.ts`** (Phase 3) — postMessage adapters used by PBS landing's PreviewLoops + /about ambient PreviewLoop.
- **`src/app.css` `@theme`** — `--font-display` Source Serif 4 (PBS section-zero h1, /about ABOUT wordmark, /contact MICHELLE NGO wordmark, /press network wordmarks); `--font-sans` Inter (ContactBlock links, bio, press title captions); `--color-cat-pbs-american-portrait` (PBS landing h1 accent — Claude's Discretion); `--ring-focus*` (all focusable elements); neutrals ramp (`bg-neutral-950` body + all content surfaces).
- **`src/lib/components/TopNav.svelte`** (Phase 4) — D-16 here extends its `page.route.id` route-match logic to add `/press` to the fade scope. PBS dual-route active-state already shipped Phase 4.
- **`src/routes/+layout.svelte`** (Phase 1 + Phase 4 + Phase 5) — D-13 here adds `<Footer />` as a sibling of `<TopNav />` below `{@render children()}`.

### Sibling `_four` reusable patterns (verbatim content + structural reference)
- **`_four/src/routes/about/+page.svelte`** — bio default seed text (D-19), Person JSON-LD payload pattern (Phase 7 retrofit posture — recommend Phase 6 inline ship here).
- **`_four/src/routes/contact/+page.svelte`** — minimal h1 + ContactBlock structure; `_three` rewraps in full-bleed splash per D-11/D-12.
- **`_four/src/routes/press/+page.svelte`** — content shape reference (h1 + iteration over groups); `_three` rewraps in scroll-snap sections per D-07/D-08.
- **`_four/src/routes/press/_pressCredits.ts`** — `PRESTIGE_ORDER` constant verbatim copy (D-18); ADAPT output shape (flat array per D-08, not grouped).
- **`_four/src/routes/pbs-american-portrait/+page.svelte`** — verbatim PBS blockquote text inline (D-17); h1 + subtitle + blockquote + outbound + h2 + grid baseline; `_three` rewraps in full-bleed reel per D-01..D-04.
- **`_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.ts`** — regex extractor copy verbatim (D-03).
- **`_four/src/lib/components/ContactBlock.svelte`** — 5-row vertical `<ul>` with hardcoded URLs (D-20/D-21); copy near-verbatim — channel literals byte-identical including the IMDb + LinkedIn channel-homepage fallback comment block.
- **`_four/src/lib/components/Footer.svelte`** — 3-column structure + ContactBlock import + mirrored categories + secondary nav + copyright (D-13); copy structure verbatim, design tokens shared with `_four` (D-15).

### To be built in Phase 6 (no `_three` analogue yet)
- `src/lib/components/ContactBlock.svelte` — 5-row vertical channel list per D-20/D-21
- `src/lib/components/ContactBlock.test.ts` — channel order, mailto/tel hrefs, target=_blank rel=noopener on socials, channel-homepage fallback URLs assertable
- `src/lib/components/Footer.svelte` — 3-column desktop / 1-column mobile per D-13/D-14/D-15
- `src/lib/components/Footer.test.ts` — markup: 3 columns at lg breakpoint, ContactBlock in column 1, 8 category links in column 2 with PBS retarget, About/Press/Contact + View All Work → in column 3, copyright bottom strip
- `src/routes/pbs-american-portrait/+page.{ts,svelte}` — section zero + 18 sections per D-01..D-04
- `src/routes/pbs-american-portrait/_pbsCollectionUrl.ts` — regex extractor copy from `_four` verbatim
- `src/routes/pbs-american-portrait/_pbsCollectionUrl.test.ts` — 18 real-data extractions + edge cases
- `src/routes/pbs-american-portrait/page.test.ts` — section zero renders + 18 sections render + 15-of-18 PBS badges present
- `src/routes/press/+page.{ts,svelte}` — 13 scroll-snap sections per D-05..D-08
- `src/routes/press/_pressCredits.ts` — flat array shape per D-08; PRESTIGE_ORDER from `_four` verbatim
- `src/routes/press/_pressCredits.test.ts` — 13 records returned, prestige order, no Michelle uploads, flat shape
- `src/routes/press/page.test.ts` — 13 scroll-snap sections render in order, each has network wordmark + title + ▷ Watch CTA
- `src/routes/about/+page.svelte` — two-act layout per D-09/D-10; bio approved at plan time per D-19
- `src/routes/about/page.test.ts` — ambient hero renders, bio paragraph present, ContactBlock below bio, reduced-motion fallback assertable
- `src/routes/contact/+page.svelte` — splash per D-11/D-12
- `src/routes/contact/page.test.ts` — wordmark top + ContactBlock centered + scroll-cue + Footer below splash
- `src/routes/+layout.svelte` extension — `<Footer />` added below `{@render children()}`
- `src/lib/components/TopNav.svelte` extension — `/press` added to chrome-fade scope (D-16)
- Playwright e2e: `tests/e2e/pbs-landing.spec.ts`, `tests/e2e/press.spec.ts`, `tests/e2e/about.spec.ts`, `tests/e2e/contact.spec.ts`, plus axe a11y assertions on all four

### Established Patterns (carry-forward into Phase 6)
- **`buildEmbedUrl(video, mode)` for ALL iframe URL construction** — PBS landing + /about ambient hero use mode='preview'; never inline URL params (Phase 3 lock)
- **`prerender = true` in `+page.ts` for all static-export routes** — all four Phase 6 routes prerender
- **`async load()` signature is load-bearing** — even when no awaits; press `+page.ts` async signature required for test contract consistency with `_four`
- **Module-scope state runes with SSR-guard** — `$lib/state/*.svelte.ts` defaults during prerender
- **`.svelte.ts` extension for runes outside `.svelte` components** + companion `.svelte.test.ts` files
- **`data-sveltekit-preload-data="hover"` on every nav link** — ContactBlock links (where internal), Footer links, /press ▷ Watch CTAs, /pbs-american-portrait outbound link
- **`eslint-disable svelte/no-navigation-without-resolve` per-file override** for components using `${base}/...` literals — Footer, ContactBlock (for internal links if any), /press +page.svelte, /pbs-american-portrait +page.svelte
- **`endsWith` suffix-match for active-state** (Phase 4 D-06) — already covers PBS dual-route; /press joins fade scope via the same route-match helper (D-16)
- **`opacity-0 pointer-events-none` for hiding interactive chrome** (NOT `display:none`) — Phase 4 D-05 pattern; D-16 here extends to /press
- **`<article>` not `<section>` for video-sized landmarks** (Phase 3 D-10) — PBS landing sections 1-18 use `<article>`; /press sections also use `<article aria-label="Press credit: [title] on [network]">` for parity (planner verifies); /about + /contact use `<section>` inside the layout-level `<main>`
- **Route-local underscore-prefixed helpers** (`_pbsCollectionUrl.ts`, `_pressCredits.ts`) — excluded from SvelteKit route detection; same pattern as `_four`
- **Vitest two-project split** — helper tests → node project (`_pressCredits.test.ts`, `_pbsCollectionUrl.test.ts`); component + route tests → ui project (jsdom)
- **POL-03 zero-CLS contract** — PBS section-zero poster + ambient hero poster + /press section posters all inherit the section's exact aspect-ratio container; no swap-on-mount layout shift
- **Plan-time content approval via `<approved>...</approved>` element** — D-19 bio + D-17 PBS blockquote inherit from `_four`'s Phase 5/Phase 6 pattern (PBS blockquote already approved in `_four`; only bio needs fresh approval in `_three`)

### Integration Points
- **`<HeroAmbient>` ↔ `createHeroDefer` factory** — `/about` D-09 instantiates the factory; `/` already does. Two parallel instances coexist (different routes, different timer/listener scopes).
- **`<ReelStage>` ↔ section zero (D-04) + press composition (D-07)** — planner verifies whether ReelStage's children-rendering contract supports non-video section zero and the network-top/title-center/CTA-bottom composition, or needs a new slot/discriminator. Recommend a polymorphic first child via prop `intro?: Snippet` and a section-content discriminator for /press.
- **`<ReelSection>` ↔ PBS "See on PBS →" badge (D-03)** — extends the existing top-right overlay (which already renders CategoryTag) to stack the PBS badge below. Conditional render based on `pbsCollectionUrl(video.description) !== null`. Helper imported from route-local `_pbsCollectionUrl.ts`.
- **`<TopNav>` ↔ chrome-fade scope (D-16)** — `page.route.id` derivation in TopNav.svelte adds `/press` to the fade-scope match. Current implementation uses `endsWith` suffix-match for active-state; for fade scope (D-06) the route prefix match is the load-bearing check.
- **`<Footer>` ↔ `getCategoriesInDisplayOrder() + categoryToSlug()` + `ContactBlock`** — Column 2 iterates categories; Column 1 renders ContactBlock; Column 3 hardcodes About/Press/Contact/View All Work → links. PBS retarget logic: `slug === 'pbs-american-portrait' ? '${base}/pbs-american-portrait/' : '${base}/work/${slug}'` — same template literal as `_four` Footer.
- **`<ContactBlock>` ↔ hardcoded URL constants** — D-20/D-21 literals. Single source of truth; editing here propagates to /about + /contact + Footer column 1 automatically.
- **`<HeroAmbient>` ↔ `pageVisibility` rune (Phase 5 / Phase 4 D-08)** — `/about` ambient hero pauses when mobile menu opens (consistent with reel routes); already wired via `'reel:visibility'` context.
- **`/about` Person JSON-LD ↔ ContactBlock URL constants** — Person JSON-LD `sameAs` array must match ContactBlock's IMDb/LinkedIn/Vimeo URLs (single source of truth principle). `_four` notes both files duplicate the URLs since ContactBlock doesn't export them — `_three` mirrors this duplication with the same comment block reminding maintainers to update both when URLs change. Planner picks whether to export the URLs from a shared module (e.g., `$lib/contact-channels.ts`) or keep the duplication with a sync warning.
- **`<svelte:head>` per-route `<title>` + meta description** — every Phase 6 route ships basic SEO inline (Phase 7 POL-01 audits). Titles: `PBS American Portrait — Michelle Ngo`, `Press — Michelle Ngo`, `About — Michelle Ngo`, `Contact — Michelle Ngo` (match `_four` patterns).
- **Phase 7 carry-forward:** POL-01 audits sitemap.xml + adds Person JSON-LD on /about (or ships inline here per planner's call) + adds OG/Twitter cards on every route.
- **Phase 7 carry-forward:** POL-04 real-device QA matrix covers /about ambient hero on cellular (LCP < 2.5s on poster-first paint) + scroll-snap on /press + PBS landing.
- **Phase 7 carry-forward:** noindex robots meta removed; Phase 6 inherits Phase 1 D-11 through cutover.

</code_context>

<specifics>
## Specific Ideas

- **A/B parity at chrome layer is the principle.** `_four` and `_three` MUST share IA (7 routes, same Footer structure, same ContactBlock channels, same prestige order, same PBS landing content) so the A/B test isolates design language. D-13/D-14/D-15 lock the Footer to `_four`'s structure verbatim; D-17/D-18/D-19/D-20/D-21 lock content to `_four`'s. The cinematic restyle is the work — every per-page composition decision (D-01..D-12) changes the canvas, not the content.

- **`createHeroDefer` factory existence is load-bearing for `/about` D-09.** Phase 5 Plan 05-03's STATE note records the explicit design decision: "createHeroDefer is a factory (not module-scope singleton) so Phase 6 ABT-01 /about ambient bg can instantiate its own without timer/listener tangle during SPA transitions." Without the factory, `/about` would either share `/`'s singleton (timer collisions on SPA navigation) or duplicate the deferred-load logic. The factory IS the Phase 6 reuse mechanism.

- **One hero-still asset everywhere.** D-01 (PBS section-zero bg), D-09 (/about reduced-motion fallback), D-11 (/contact splash bg), Phase 5 HERO-01 (`/` hero fallback) all share the producer reel poster (Vimeo 264677021). This is the cinematic surface signature of `_three` — every "hero moment" surface looks like the same still, like a recurring motif in a film. `_four` has one hero poster too but uses it only on `/`; `_three` makes it the visual hub of all entry surfaces.

- **D-08 flat-array press shape (one section per credit) diverges from `_four`'s grouped shape.** `_four`'s `_pressCredits.ts` returns `Array<{ network, videos[] }>` because `_four`'s /press is editorial (sections of credits per network). `_three`'s /press is cinematic-immersive (one fullscreen section per credit moment). Today's 1:1 data makes both shapes equivalent in output; tomorrow's multi-credit data diverges. D-08 picks the cinema-first shape because every credit IS a moment worth its own fullscreen section in `_three`'s design language.

- **D-16 extending chrome-fade to `/press` is the most distinctive `_three` wayfinding decision in Phase 6.** `_four`'s /press is a quiet editorial list where chrome stays solid. `_three`'s /press IS a reel surface — same scroll-snap rhythm, same chrome-fade ethos. If a producer experiences /work, /pbs-american-portrait/, and /press with consistent chrome behavior, the cinematic-immersive design statement holds. D-16 makes the chrome-fade scope ROUTE-shape-driven (any scroll-snap reel route) rather than CONTENT-domain-driven (only filmography category routes).

- **The IMDb/LinkedIn channel-homepage fallback is a cutover blocker, not a Phase 6 blocker.** D-21 ships the fallback URLs (`https://www.imdb.com/`, `https://www.linkedin.com/`) at v1 launch per `_four`'s explicit Phase 7 deferral inherited here. Existing tests assert "URL contains 'imdb.com'" / "URL contains 'linkedin.com'" — both fallbacks AND eventual personalized URLs pass these. The personalized URLs swap in pre-cutover as a single-line edit. HUMAN-UAT tracks this as a pre-cutover blocker per CONT-02; Phase 6 ships fallbacks without blocking.

- **PBS section-zero participating in scroll-snap (D-04) is the most subtle implementation decision.** Both `_four` (editorial flat layout) and a non-snap intro on `_three` would have section zero "above" the reel. `_three` D-04 makes section zero THE first reel section — uniform scroll rhythm, single ReelStage instance, no DOM/scroll-regime split. Producer flicks from blockquote into PBS Pride into PBS Veterans with the same flick velocity, the same h-svh frame, the same cinematic cadence. The PBS project context IS a film card in the reel, not a page preamble.

- **/contact's "static poster" (not ambient reel) per ROADMAP success criterion 4 is a deliberate differentiation from /about.** /about gets the ambient cinematic full treatment (HeroAmbient with deferred-load + PreviewLoop). /contact gets the still moment — a single quiet poster + name + contact, like the end-credits slate after a film. Producer arrives at /contact knowing the work (they came from /watch, /work, or /press); /contact is where the cinema stops and the action moment (write/call) begins. The visual restraint signals "now reach out."

</specifics>

<deferred>
## Deferred Ideas

### Phase 7 polish work
- **Person JSON-LD on /about** — POL-01 audits; planner may ship inline in Phase 6 (per `_four` Plan 07-02 retrofit posture) or defer to Phase 7 audit. Recommend Phase 6 inline ship per recent `_three` precedent (VideoObject JSON-LD shipped Phase 5 inline on /watch/[id]).
- **Per-page meta description tuning** — Phase 6 inlines basic `<title>` + description per `_four`; Phase 7 POL-01 audits + ensures OG/Twitter cards work + sitemap covers all 7 routes.
- **Personalized IMDb + LinkedIn profile URLs** — D-21 ships channel-homepage fallbacks; personalized URLs swap in pre-cutover as a single-line edit. Tracked as HUMAN-UAT pre-cutover blocker per CONT-02.
- **noindex robots meta removal** — Phase 7 cutover; Phase 6 inherits Phase 1 D-11 noindex through cutover.
- **Lighthouse CI gate hardening** — POL-02; /about ambient hero LCP < 2.5s budget mechanism shipped in Phase 5 + here, gate hardens in Phase 7.

### Considered but rejected (carried forward rejections from `_four` Phase 5/6)
- **Short URL `/pbs/`** — explicit `/pbs-american-portrait/` retained (`_four` PBS D-01 rejection inherited).
- **`/projects/pbs-american-portrait/` under a /projects parent** — no other projects exist (`_four` PBS deferred ideas inherited).
- **Sectioned editorial by themed PBS collections** (Pride / Veterans / Juneteenth as sub-h2 groups) — no per-collection metadata field; themes mentioned in titles only (`_four` PBS D-13 inherited).
- **Themed chips / badge row on PBS landing** — implies filterability the page doesn't offer (`_four` PBS rejection inherited).
- **Schema field `pbsOrder: number` for hand-curated sort** — Phase 3 D-25 default sort suffices (`_four` PBS rejection inherited).
- **Hide CategoryTag on PBS landing cards** — VideoCard stays uniform; `_three` extends with PBS badge stacked below CategoryTag per D-03 — both rendered (`_four` PBS D-20 carried; `_three` adds the badge stacking).
- **Strip "PBS American Portrait — " title prefix on PBS landing** — `_four` PBS D-22 rejection inherited; source-of-truth videos.json titles render uniformly.
- **Hand-authored press list** — derived from videos.json (`_four` D-08 inherited).
- **Logo grid / network-brand image wall on /press** — D-06 inherits `_four`'s rejection; text wordmark only.
- **Chronological press list** — D-08 inherits prestige order (`_four` D-10 inherited).
- **Alphabetical press list** — D-08 inherits prestige order.
- **Per-credit role label (Producer / Associate Producer)** — no role field in schema; `_four` D-13 inherited.
- **Per-credit year/date** — D-07 inherits `_four` D-13 (network + title sufficient; chronology noisy).
- **Per-credit blurb** — D-07 inherits `_four` D-13 (descriptions on /watch/[id] only).
- **"Other" rollup for single-credit networks** — D-08 inherits `_four` D-11 (every network shows; depth-and-breadth framing).
- **Third-person bio voice** — D-19 inherits `_four` D-17 first-person preference.
- **Medium/long bio (200+ words)** — D-19 inherits `_four` D-18 ~100-word punchy default.
- **Headshot on /about** — D-19 ABT-01 partial-satisfaction inherits `_four` D-20 rejection. Revisitable post-launch if Michelle provides one.
- **Resume/CV PDF download** — `_four` D-20 rejection inherited.
- **Legacy disciplines section (UX / Publishing / Copywriting)** — REQUIREMENTS Out of Scope; `_four` D-20 rejection inherited.
- **Two-column /about layout** — D-09 picks two-act ambient + single-column dark canvas instead; sidebar pattern rejected.
- **/contact redirect to /about** — D-03 (`_four` Phase 6 D-03) kept verbatim — /contact stays as a real page.
- **Drop /contact route entirely** — D-03 keeps the route.
- **Obfuscated email** — D-20 inherits `_four` D-33 (clean mailto: industry standard).
- **Phone omitted from footer** — D-20 inherits `_four` D-34 (phone public per user confirmation).
- **JS-deobfuscated email** — `_four` D-33 inherited.
- **Two-column footer / single editorial-row footer** — D-13 inherits `_four` D-25 3-column structure.
- **Mirrored-nav scope: secondary-only / categories-only** — D-13 inherits `_four` D-27/D-28 full mirror.
- **Distinct darker footer band** — D-15 inherits `_four` D-30 hairline+continuous treatment.
- **Per-category accents in footer** — D-14 inherits `_four` D-31 mono.
- **`Date().getFullYear()` JS for copyright year** — D-13 inherits `_four` D-29 literal `2026` (prerendered site).
- **Active-state highlighting on footer links** — D-13 inherits `_four` D-31 no active state.
- **`<ContactBlock />` orientation prop / horizontal variant** — D-20 inherits `_four` D-32 single layout.

### `_three`-specific deferred ideas
- **Animated transitions between scroll-snap sections on /press** — pure CSS scroll-snap takes over; no JS transition layer. Reopen if real-device QA shows snap-jank.
- **Per-section "still" sourcing fallback** — D-05 says `/press` section bg = credit video's poster. If a future credit has no poster (unusual — every video should have a poster per posters.json sidecar build-fail plugin), the section would fall back to a neutral canvas. Not addressed in v1; rely on posters.json being complete.
- **Multi-credit network "list view"** — D-08 chose flat array (one section per credit). Reopen if a network adds 5+ credits and producers complain about scroll-fatigue past 13+ sections.
- **PBS section-zero outbound link in chrome (sticky)** — D-02 places the outbound link inline within section zero. Reopen if user-testing shows producers want persistent "← back to PBS context" cue while scrolling through sections 1-18.
- **/about ambient hero deferred-load alternate sources** — Plan 05-03's createHeroDefer races rIC + 1s timer + first pointer interaction. /about uses the same. Reopen if the bio is visible before the ambient mount completes (producer scrolls past the ambient hero faster than the iframe loads).
- **/contact "scroll-cue" placement** — D-12 puts a scroll-cue at the bottom of the splash inviting scroll to Footer. Reopen if user-testing shows producers don't realize the Footer exists below the splash.
- **Per-PBS-video deep-link from /press** — `/press` sections deep-link to `/watch/[id]` (single-credit-per-network today). If a PBS press credit ever ships (PBS is currently sourced via Michelle's uploads, not as press), the deep-link goes to the specific video; the PBS landing page is reached via TopNav. No cross-link needed today.
- **ContactBlock as a Svelte snippet vs a component** — D-20 chose component (Phase 4 / Phase 5 conventions). Reopen if `_three`'s upcoming components need snippet-style composition.
- **Sticky/sliding `<Footer />` for cinematic mood** — D-15 chose natural end-of-page placement. Reopen if cinematic-ending posture wants the Footer to feel like a closing-credits slate.
- **PBS section-zero gradient color matching PBS accent** — D-01's gradient defaults to neutral black; could tint with PBS OKLCH accent for thematic identity. Subtle; planner picks during plan/UI phase.
- **/press section "now showing" / "coming soon" framing micro-copy** — D-07 keeps it factual (network / title / ▷ Watch). Reopen if cinema-credit-slate framing wants more theatrical micro-copy.
- **Cross-link "About this credit" from /press → /watch/[id] description block** — `/press` ▷ Watch CTA goes to /watch/[id] already; the watch page surfaces the description. No need for a parallel deep-link.

### Out of scope (REQUIREMENTS.md locked)
- Newsletter capture, analytics, contact form, i18n, real-time chat, hover autoplay on small thumbnails, video uploading UI, mobile native app/Capacitor, re-authoring videos.json, pre-generated MP4 preview clips, migrating non-video disciplines, light-mode palette, custom video player chrome, audio autoplay anywhere, music/ambient sound on `/` or `/about`, custom non-skippable page transitions, video-as-cursor effects, parallax effects, blocking intro splash screen, hover-required interactions on mobile, infinite scroll without filter affordance.

### Reviewed Todos (not folded)
None — `gsd-tools todo match-phase 6` returned `todo_count: 0`. No deferred review entries.

</deferred>

---

*Phase: 06-pbs-press-about-contact*
*Context gathered: 2026-05-27*
