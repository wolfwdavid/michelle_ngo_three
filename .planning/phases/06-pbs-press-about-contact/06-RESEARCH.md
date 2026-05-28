# Phase 6: PBS / Press / About / Contact — Research

**Researched:** 2026-05-27
**Domain:** Content-surface restyle (4 routes) with verbatim content reuse from sibling `_four` + new shared chrome (Footer + ContactBlock)
**Confidence:** HIGH

## Summary

Phase 6 is a **content-surface restyle phase, not a discovery phase**. CONTEXT.md (D-01..D-21) and UI-SPEC.md already lock 100% of the design decisions; REQUIREMENTS pins the requirements; the sibling `../michelle_ngo_four` ships the source-of-truth content; Phases 1–5 ship every primitive (`ReelStage`, `ReelSection`, `PosterImage`, `HeroAmbient`, `createHeroDefer`, `getPosterFor`, all state runes). The research job here is not "how do we build a reel" (already solved Phase 3) or "what library do we use" (zero new deps per UI-SPEC §Registry Safety) — it's **boundary clarification + path manifest + validation strategy**.

The single most important research output is the file-path manifest of `_four` source-of-truth files the planner must reference as `read_first` so the executor can extract verbatim text + literals + helper code with byte-fidelity. Without this manifest, the planner risks specifying "copy from `_four`" loosely and the executor risks paraphrasing.

The second-most-important output is the **trailingSlash mismatch finding**: `_three`'s root `+layout.ts` does NOT set `trailingSlash`, so SvelteKit defaults to `'never'`. Yet CONTEXT D-13 and existing TopNav/Footer code reference `/pbs-american-portrait/` (trailing slash). `_four` sets `trailingSlash = 'always'`. The PBS route in `_three` ships TODAY as `/pbs-american-portrait` (no trailing slash); CONTEXT documents wishing for `/pbs-american-portrait/`. The planner MUST decide: (a) introduce `trailingSlash = 'always'` in `_three`'s root layout (breaking change to existing `/work`, `/watch/[id]` URLs — but they prerender consistently), (b) drop the trailing slash from CONTEXT/UI-SPEC references, or (c) special-case the PBS route only. This decision affects 3 places: route URL, Footer column-2 PBS retarget href, TopNav `REEL_ROUTE_IDS` matcher.

**Primary recommendation:** Plan three plans split as **(06-01) shared chrome** (`<ContactBlock />` + `<Footer />` + `+layout.svelte` wiring + TopNav `/press` fade-scope extension + trailingSlash resolution), **(06-02) PBS + Press reel surfaces** (`/pbs-american-portrait/` + `/press` + ReelStage extension for non-video intro), **(06-03) About + Contact splash surfaces** (`/about` two-act with HeroAmbient reuse via factory + `/contact` static-poster splash + bio approval gate). All extractive — copy `_four` source verbatim where content + structure carry, restyle only the canvas.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**PBS section-zero design (`/pbs-american-portrait/`)**

- **D-01:** Section zero bg = producer reel poster (Vimeo `264677021` poster from Phase 3's `posters.json` sidecar via `getPosterFor()`). Reuses the same still that anchors `/` hero fallback, `/about` reduced-motion fallback, and `/contact` splash (D-11). Two-stop gradient overlay for blockquote legibility (mirrors Phase 5 D-05 hero treatment — exact gradient stop math is Claude's Discretion).
- **D-02:** Subtitle above blockquote, outbound link below. Top-to-bottom within section zero: small subtitle "18 stories produced by Michelle Ngo" → blockquote (verbatim `_four` Candidate C, centered, max-w-3xl) → attribution "Description from pbs.org/american-portrait" → outbound "Visit pbs.org/american-portrait →" → scroll-cue.
- **D-03:** Per-PBS-section "See on PBS →" badge stacks with CategoryTag in top-right corner of each reel section (sections 1-18). Badge renders only when `pbsCollectionUrl(description) !== null`. Helper extraction logic copies `_four`'s `_pbsCollectionUrl.ts` verbatim.
- **D-04:** Section zero IS the first scroll-snap section (`snap-start`, `h-svh`, uniform with sections 1-18). Single `<ReelStage>` instance handles all 19 sections. Implementation note: section zero is a non-video sibling of the ReelSection children — may need a new `<ReelStageIntro>` slot or a polymorphic first child; planner picks.

**Press section anatomy (`/press`)**

- **D-05:** Each /press section's bg = poster of that credit's video. Reuses Phase 3's `posters.json` sidecar via `getPosterFor(video)`. NO iframes on `/press` (poster-only, in contrast to `/work` and `/pbs-american-portrait/`).
- **D-06:** Network identity = text wordmark only. No logo image assets.
- **D-07:** DOM composition within each press section: network wordmark TOP + video title CENTER + ▷ Watch CTA BOTTOM.
- **D-08:** One scroll-snap section per credit (flat array, forward-defensive). Press helper output shape is `Array<{ network: string; video: Video }>` (NOT grouped by network like `_four`'s `_pressCredits.ts`). Prestige order inherits `_four`'s `PRESTIGE_ORDER` constant verbatim.

**/about + /contact composition**

- **D-09:** /about uses two-act layout mirroring `/`. Act 1 (top, h-svh): ambient producer-reel hero with "ABOUT" wordmark + scroll-cue. Act 2 (below, dark canvas bg-neutral-950): bio paragraph + ContactBlock. **Phase 5 D-03 `createHeroDefer` factory** is instantiated here.
- **D-10:** /about ContactBlock sits below bio in same vertical scroll on Act 2's dark canvas. Container: `max-w-2xl mx-auto px-4 sm:px-6 lg:px-8`.
- **D-11:** /contact splash bg = producer reel poster (same Vimeo `264677021` poster as PBS section-zero D-01). Two-stop gradient overlay. STATIC poster only — never iframe (deliberate differentiation from /about).
- **D-12:** /contact composition: "MICHELLE NGO" wordmark top + ContactBlock centered + scroll-cue at bottom.

**Site chrome: Footer + fade scope extension**

- **D-13:** Footer mirrors `_four`'s 3-column structure verbatim. Column 1: `<ContactBlock />`. Column 2: 8 mirrored category links in `getCategoriesInDisplayOrder()` order, PBS retargeted to `${base}/pbs-american-portrait/` (other 7 to `${base}/work/${slug}`). Column 3: secondary nav (About / Press / Contact / View All Work →). Bottom strip: `© 2026 Michelle Ngo · Built with SvelteKit` centered.
- **D-14:** Footer category links stay mono (no OKLCH accent). Mirrors `_four` D-31.
- **D-15:** Footer visual weight matches `_four`: hairline top border + neutral-950 continuous + py-12 md:py-16.
- **D-16:** Phase 4 D-06 chrome-fade scope EXTENDS to `/press`. Reel routes where TopNav fades now include: `/work`, `/work/[cat]`, `/pbs-american-portrait/`, AND `/press`. No `<FilterPillBar />` on `/press`.

**Verbatim content reuse (carry-forward from `_four`)**

- **D-17:** PBS blockquote text = `_four` Candidate C verbatim.
- **D-18:** Press prestige order = `_four`'s `PRESTIGE_ORDER` constant verbatim.
- **D-19:** Bio voice = first-person, ~100 words, planner-drafted + user-approved at plan time via `<approved>...</approved>` element in 06-02-PLAN.md.
- **D-20:** ContactBlock channel literals = `_four` verbatim. Email: `mailto:mynogo@gmail.com`. Phone: `tel:+19175661976`. Channel order: Email → Phone → IMDb → LinkedIn → Vimeo.
- **D-21:** IMDb + LinkedIn ship as channel-homepage fallbacks at launch (`https://www.imdb.com/`, `https://www.linkedin.com/`). Vimeo = `https://vimeo.com/user2149742`. Post-launch backlog item: swap to personalized URLs.

### Claude's Discretion

- Exact gradient overlay stop math for PBS section-zero (D-01) and /contact splash (D-11) — Phase 5 D-05 sets the two-stop pattern shape; precise alpha values + percentages tuned during plan or via `/gsd:ui-phase 6`.
- Whether section zero uses a new `<ReelStageIntro>` slot, a polymorphic first child of `<ReelStage>`, or rendered outside ReelStage with the same h-svh + snap-start classes (D-04). All three pass the contract; planner picks based on prop ergonomics.
- Whether `/press` uses `<ReelStage>` reused with a different `videos` prop, or a new dedicated `<PressStage>` component. Recommend reuse with a `kind: 'press'` discriminator since chrome behavior matches.
- Exact PBS h1 typography on section zero — uppercase tracked display-serif vs sans, accent color vs neutral. Recommend keeping the PBS OKLCH accent (consistent with TopNav active-state).
- Whether the /about ambient hero reuses `<HeroAmbient />` verbatim (passing `video={getById(producerReelId)}`) or instantiates a separate `<AboutHero />` component that consumes the same `createHeroDefer` factory. Recommend reuse — `<HeroAmbient />` was designed parametric per Plan 05-03 D-01.
- Whether the "ABOUT" wordmark on /about matches `/`'s `MICHELLE NGO` wordmark exactly (same size, same position) or scales down. Recommend match — visual rhyme between entry surfaces.
- Press section sort posture when prestige order has duplicates (D-08 — within-prestige-bucket sub-sort by featured-first then published-desc).
- Footer column-header microcopy ("Contact" / "Work" / "Site"). `_four` defaults to these — recommend matching.
- Whether the Footer's "View All Work →" link href is `${base}/work` (no trailing slash, matching `_four`) or `${base}/work/`.
- Bottom-strip alignment in Footer (centered per `_four` D-29 vs left-aligned). Recommend match.
- Exact `space-y-*` / `gap-*` tokens within each press section composition (D-07).
- Whether `/contact` and `/about` use `<main>` or `<section>` as their outermost landmark inside the layout's `<main id="main">` wrapper. Recommend `<section>` to avoid nested main landmarks.
- Whether Person JSON-LD payload on `/about` ships in Phase 6 (alongside the new route) or defers to Phase 7 POL-01 audit. Recommend ship in Phase 6.
- Whether the PBS landing's outbound link to pbs.org gets a small icon or text-only "→" arrow. `_four` uses text-only — recommend match.
- ESLint per-file override pattern (`svelte/no-navigation-without-resolve`) for new components using `${base}/...` literals — mirror Phase 3/4/5 pattern.
- Test scope mapping: which Playwright assertion covers PBS-01 vs PBS-02 vs PBS-03 vs PRES-01 vs ABT-01 vs CONT-01..03.

### Deferred Ideas (OUT OF SCOPE)

**Phase 7 polish work**
- Person JSON-LD on /about (POL-01 audits; planner may ship inline in Phase 6 per `_four` Plan 07-02 retrofit posture).
- Per-page meta description tuning, sitemap.xml endpoint (POL-01).
- Personalized IMDb + LinkedIn profile URLs — D-21 ships channel-homepage fallbacks; personalized URLs swap in pre-cutover.
- noindex robots meta removal — Phase 7 cutover.
- Lighthouse CI gate hardening — POL-02.

**Considered but rejected (inherited from `_four`)**
- Short URL `/pbs/`; `/projects/pbs-american-portrait/` parent; sectioned editorial PBS collections; themed chips/badge row; `pbsOrder` schema field; hide CategoryTag on PBS landing; strip PBS title prefix; hand-authored press list; logo grid on /press; chronological/alphabetical press list; per-credit role label / year / blurb; "Other" rollup; third-person bio; long bio; headshot on /about; Resume/CV PDF; legacy disciplines section; two-column /about; /contact redirect to /about; drop /contact route; obfuscated email; phone omitted from footer; JS-deobfuscated email; two-column footer; mirrored-nav scope limits; distinct darker footer band; per-category accents in footer; `Date().getFullYear()` JS for copyright; active-state highlighting on footer links; ContactBlock orientation prop / horizontal variant.

**`_three`-specific deferred**
- Animated transitions between scroll-snap sections on /press; per-section still sourcing fallback; multi-credit network "list view"; PBS section-zero outbound link in sticky chrome; /about ambient hero deferred-load alternate sources; /contact "scroll-cue" placement reopen; per-PBS-video deep-link from /press; ContactBlock as snippet vs component; sticky/sliding Footer; PBS section-zero gradient color matching PBS accent; /press "now showing" framing micro-copy; cross-link "About this credit" from /press → /watch/[id].

**Out of scope (REQUIREMENTS locked)**
Newsletter, analytics, contact form, i18n, real-time chat, hover autoplay on small thumbnails, video uploading UI, mobile native app, re-authoring videos.json, MP4 preview clips, migrating non-video disciplines, light-mode palette, custom video player chrome, audio autoplay anywhere, music/ambient sound on `/` or `/about`, custom page transitions, video-as-cursor effects, parallax, blocking intro splash, hover-required interactions on mobile, infinite scroll without filter affordance.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **PBS-01** | `/pbs-american-portrait/` renders section zero as the verbatim PBS blockquote over a still; sections 1-18 are the 18 PBS American Portrait videos in the immersive scroll-snap reel format | Blockquote text verbatim from `_four/src/routes/pbs-american-portrait/+page.svelte:57-60` (audit-confirmed); 18 PBS videos confirmed via `grep -c '"category": "PBS American Portrait"' videos.json` = 18; `ReelStage` + `ReelSection` shipped Phase 3, support extension via polymorphic first child or new intro slot |
| **PBS-02** | 15 of 18 PBS video sections carry a `See on PBS →` badge linking to the collection URL (3 lack a URL by design — IDs 620232398, 1007061884, 1007027015) | `_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.ts` regex extractor + 15 collection URLs confirmed via `grep -c 'pbs.org/american-portrait/collection' videos.json` = 15; ID 620232398 confirmed as PBS-categorized via direct grep |
| **PBS-03** | TopNav PBS link active-state covers both `/pbs-american-portrait/` and `/work/pbs-american-portrait/` | Already shipped Phase 4 via `TopNav.svelte:143` PBS dual-route `endsWith` guard. Phase 6 inherits — no TopNav active-state work needed |
| **PRES-01** | `/press` renders 13 broadcast credits as vertical scroll-snap sections in prestige order; each section is a fullscreen still + network logo + caption + `▷ Watch` CTA → `/watch/[id]` | 13 distinct non-Michelle uploaders confirmed via `grep -E '"uploader"' \| sort -u` (14 total, minus "Michelle Ngo" = 13); `PRESTIGE_ORDER` constant verbatim from `_four/src/routes/press/_pressCredits.ts:24-38`; `getPosterFor()` + posters.json sidecar shipped Phase 3 |
| **ABT-01** | `/about` renders Michelle's user-approved first-person bio layered over an ambient muted reel loop (same producer reel as `/`); reduced-motion serves still poster; embedded `<ContactBlock />` below | Bio default seed verbatim from `_four/src/routes/about/+page.svelte:62-67`; `<HeroAmbient />` + `createHeroDefer` factory shipped Phase 5; producer reel id `264677021` confirmed in videos.json (line 685); REEL-04 unified fallback codepath shipped Phase 3 |
| **CONT-01** | Shared `<ContactBlock />` lives on `/contact`, `/about`, AND the site-wide `<Footer />` — 5 channels appear on every prerendered route | `_four/src/lib/components/ContactBlock.svelte` is the reference impl (88 lines, no props, hardcoded literals). Single-source-of-truth pattern via single component import |
| **CONT-02** | IMDb + LinkedIn URLs use the same channel-homepage fallbacks as `_four` | `_four/src/lib/components/ContactBlock.svelte:41-43` ships `IMDB_URL='https://www.imdb.com/'`, `LINKEDIN_URL='https://www.linkedin.com/'`, `VIMEO_URL='https://vimeo.com/user2149742'` as inline consts; copy verbatim |
| **CONT-03** | Site-wide `<Footer />` mirrors TopNav (categories + secondary nav) and surfaces 5 contact channels on every route | `_four/src/lib/components/Footer.svelte` ships the 3-column reference impl (119 lines); `+layout.svelte` mounts `<Footer />` below `{@render children()}`; `_three/src/routes/+layout.svelte:22` already has the explicit comment "Phase 6 will add `<Footer />` AFTER `{@render children()}`" |
</phase_requirements>

## Phase Boundary & Reuse Scope

The phase boundary cleaves into three concentric rings:

### Ring 1: Verbatim content reuse (zero re-authoring permitted)

These are **byte-for-byte** copies from `_four`. Drift between `_three` and `_four` here breaks the A/B-integrity contract (Trap A inheritance).

| Asset | `_four` source | Byte-fidelity requirement |
|-------|----------------|----------------------------|
| PBS blockquote text (Candidate C, D-17) | `_four/src/routes/pbs-american-portrait/+page.svelte:57-60` | Verbatim including curly apostrophes (`it's`, `Americans`) — copy the 4 lines INSIDE the `<blockquote>` element, no edits, no quote marks added |
| PBS collection URL extractor (D-03) | `_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.ts` (24 lines total) | Verbatim including regex `COLLECTION_URL` + `TRAILING_PUNCT` + JSDoc comments. Underscore-prefix excludes from SvelteKit route detection |
| Press `PRESTIGE_ORDER` constant (D-18) | `_four/src/routes/press/_pressCredits.ts:24-38` | Verbatim — 13-string `as const` tuple. Order matters: `HBO Max → HBO → PBS → ABC News → U2 → Amazon News → Music Box Films → Monument Releasing → Cargo Film & Releasing → AZPM → HBODocs → GrasshalmClips → Lenny Cooke (Movie)` |
| Bio default seed text (D-19) | `_four/src/routes/about/+page.svelte:62-67` (lines BETWEEN `<!-- BEGIN approved bio -->` and `<!-- END approved bio -->`) | Default seed — D-19 requires fresh user approval via `<approved>...</approved>` in 06-02-PLAN.md. User may approve verbatim or request edits. Treat as seed, not lock |
| ContactBlock channel literals (D-20) | `_four/src/lib/components/ContactBlock.svelte:41-43` (the 3 URL consts) + 46-86 (the `<ul>` markup) | Verbatim including the `target="_blank" rel="noopener"` attributes, the `text-white hover:underline underline-offset-2` link class, the `<ul class="space-y-2 text-base">` wrapper |
| Footer "View All Work →" link microcopy + arrow (D-13) | `_four/src/lib/components/Footer.svelte:104` | Verbatim — the `→` arrow signals scope expansion per `_four` D-28 |
| Footer copyright literal (D-13) | `_four/src/lib/components/Footer.svelte:116` | Verbatim `© 2026 Michelle Ngo · Built with SvelteKit` — literal `2026`, NOT `Date().getFullYear()` per D-29 (prerendered site) |
| Footer category retarget logic (D-13) | `_four/src/lib/components/Footer.svelte:50-54` | Verbatim ternary: `slug === 'pbs-american-portrait' ? '${base}/pbs-american-portrait/' : '${base}/work/${slug}'` |
| Press credit filter logic (D-08) | `_four/src/routes/press/_pressCredits.ts:48` | Verbatim: `videos.filter((v) => v.uploader !== 'Michelle Ngo')` — yields exactly 13 records (audit-verified) |

### Ring 2: Restyled structural reuse (copy structure, change canvas)

These reuse `_four`'s structure but the cinematic restyle changes layout + typography + composition. The DOM rough-shape carries; the CSS + outer wrappers diverge.

| Asset | `_four` reference | `_three` divergence per CONTEXT |
|-------|-------------------|-------------------------------------|
| `<ContactBlock />` component | `_four/src/lib/components/ContactBlock.svelte` | **Near-verbatim** — same `<ul>` markup, same channel literals. The cinematic-immersive surfaces it's placed in (centered on /contact splash, below bio on /about Act 2, Footer column 1) carry the cinematic styling; the component itself is identical. Style class `text-white hover:underline underline-offset-2` survives unchanged |
| `<Footer />` component | `_four/src/lib/components/Footer.svelte` | **Structure verbatim** (D-13/D-14/D-15) — 3-column grid, same column composition, same hairline border + neutral-950 bg + py-12 md:py-16. The cinematic restyle is intentional non-divergence: A/B parity at chrome layer (D-15 explicitly says "no distinct darker band; no letterbox treatment") |
| `_pressCredits.ts` helper | `_four/src/routes/press/_pressCredits.ts` | **Reshape output**: `_four` returns `Array<{ network, videos[] }>` (grouped); `_three` returns `Array<{ network, video }>` (flat) per D-08. PRESTIGE_ORDER constant verbatim; defensive future-proofing (unknown uploader → appended last) preserved; filter logic verbatim; only the data structure changes |
| `_pbsCollectionUrl.ts` helper | `_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.ts` | **Verbatim** — same regex, same function signature |
| PBS landing route | `_four/src/routes/pbs-american-portrait/+page.svelte` | **Composition-level rewrite**: `_four` is editorial (h1 + subtitle + blockquote + outbound + h2 + 2/3/4 grid of VideoCards). `_three` is full-bleed scroll-snap reel (19 sections, section zero + 18 video sections) per D-01..D-04. Content within section zero is verbatim; the VideoCard grid is replaced by `<ReelStage>` |
| Press route | `_four/src/routes/press/+page.svelte` | **Composition-level rewrite**: `_four` is editorial (h1 + grouped sections with `<ul>` of titles, max-w-3xl). `_three` is 13 fullscreen scroll-snap sections per D-05..D-08. Content is data-derived, no editorial chrome carries |
| /about route | `_four/src/routes/about/+page.svelte` | **Composition-level rewrite**: `_four` is `max-w-2xl` editorial column with h1 + bio + ContactBlock. `_three` adds an Act 1 ambient hero ABOVE the bio (D-09). Bio paragraph + ContactBlock survive in Act 2; the outer wrapper changes from `<main class="max-w-2xl">` to `<section class="max-w-2xl">` (avoid nested `<main>` per axe rule — Claude's Discretion recommends `<section>`) |
| /contact route | `_four/src/routes/contact/+page.svelte` | **Composition-level rewrite**: `_four` is `max-w-2xl` h1 + ContactBlock editorial card. `_three` is full-bleed splash with poster bg + wordmark + centered ContactBlock + scroll-cue per D-11/D-12 |
| Person JSON-LD on /about | `_four/src/routes/about/+page.svelte:34-41` | **Verbatim** (Claude's Discretion recommends ship in Phase 6). Update `url` to `https://michellengo.net/about/` only if production URL is in scope (Phase 7 normally owns this); recommend ship with `https://michellengo.net/about/` matching `_four` |

### Ring 3: New components + cinematic-immersive composition

These have no `_four` analogue. Phase 6 builds them fresh — but using primitives already shipped Phases 1–5.

| New asset | Built atop |
|-----------|------------|
| `src/lib/components/ContactBlock.svelte` (new file at this path) | `_four/src/lib/components/ContactBlock.svelte` near-verbatim copy |
| `src/lib/components/Footer.svelte` (new file at this path) | `_four/src/lib/components/Footer.svelte` structure verbatim |
| `src/routes/pbs-american-portrait/{+page.ts,+page.svelte}` (new) | `<ReelStage>` + `<ReelSection>` + `<PosterImage>` + `getPosterFor()` + `getByCategory('PBS American Portrait')` + new `_pbsCollectionUrl.ts` |
| `src/routes/press/{+page.ts,+page.svelte,_pressCredits.ts}` (new) | `<PosterImage>` + `getPosterFor()` + `videos.filter()` + new flat-array `_pressCredits.ts` |
| `src/routes/about/+page.svelte` (new) | `<HeroAmbient />` (with `video={getById(producerReelId)}`) + `<ContactBlock />` + REEL-04 unified fallback codepath |
| `src/routes/contact/+page.svelte` (new) | `<PosterImage>` (or inline `<img>` since this is splash bg, not reel section) + `<ContactBlock />` + scroll-cue glyph |
| Section-zero polymorphic intro for PBS landing | Either: (a) new `<ReelStageIntro>` slot on `<ReelStage>`, (b) polymorphic first child, (c) sibling `<section>` rendered outside `<ReelStage>` with same `snap-start h-svh` classes. Planner picks — all three pass the contract per CONTEXT Claude's Discretion |
| `+layout.svelte` extension | Add `<Footer />` below `{@render children()}` (the existing layout has an explicit TODO comment at line 22 reserving this) |
| `TopNav.svelte` extension | Add `/press` to `REEL_ROUTE_IDS` set at line 61-65 (currently has 3 entries: `/work`, `/work/[category]`, `/pbs-american-portrait`). One-line change |

## PBS Surface Research

### Blockquote source (D-17)

**Source file:** `_four/src/routes/pbs-american-portrait/+page.svelte`

**Lines 56-61 (verbatim copy target):**

```html
<blockquote class="mt-6 border-l-2 border-neutral-700 pl-4 text-neutral-200 max-w-3xl">
  Whether it's joy or sorrow, triumph or hardship, family traditions followed for decades or just
  the chaos of the morning school run, PBS American Portrait put together a picture of life as
  it's really lived. The show gives a glimpse into American life, and a chance for everyday
  Americans to be heard.
</blockquote>
```

The text content (lines 57-60, INSIDE the `<blockquote>` element) is the verbatim Candidate C user-approved at `_four`'s Phase 5 (D-17 per CONTEXT). Phase 6 inherits the approval — no re-fetch from pbs.org, no re-approval.

**Attribution + outbound link literals (D-02 carry-forward from `_four`):**

```html
<p class="mt-2 text-xs text-neutral-500">Description from pbs.org/american-portrait</p>
<a href="https://www.pbs.org/american-portrait/" target="_blank" rel="noopener" class="hover:underline">
  Visit pbs.org/american-portrait →
</a>
```

The outbound URL `https://www.pbs.org/american-portrait/` is the canonical PBS American Portrait series page. Outbound carries `target="_blank" rel="noopener"`. The cinematic restyle changes the wrapper (full-bleed section-zero with gradient overlay + max-w-3xl blockquote container) — the literals stay.

### Collection URL extraction (D-03)

**Helper source:** `_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.ts`

```ts
const COLLECTION_URL = /https?:\/\/(?:www\.)?pbs\.org\/american-portrait\/collection\/[^\s)]+/;
const TRAILING_PUNCT = /[).,!?]+$/;

export function pbsCollectionUrl(description: string): string | null {
  const m = description.match(COLLECTION_URL);
  if (!m) return null;
  return m[0].replace(TRAILING_PUNCT, '');
}
```

**Verified data evidence:**
- `grep -c 'pbs.org/american-portrait/collection' src/lib/data/videos.json` = **15 collection URL occurrences** in description fields
- `grep -c '"category": "PBS American Portrait"' src/lib/data/videos.json` = **18 PBS videos**
- Math: 18 PBS videos – 15 with URLs = **3 without URLs** — confirms PBS-02 spec ("3 lack a URL by design — IDs 620232398, 1007061884, 1007027015")
- ID 620232398 confirmed PBS-categorized via direct grep (title: "American Portrait Year in Review 2020", uploader: "Michelle Ngo")

The badge renders ONLY when `pbsCollectionUrl(video.description) !== null`. Per D-03 the badge stacks BELOW the existing CategoryTag in the top-right corner of each reel section (sections 1-18). Badge style per UI-SPEC §354-359:
- Container: `inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-1 mt-2`
- Text: `font-mono text-sm tracking-wider text-neutral-50`
- Outbound posture: `target="_blank" rel="noopener"`

### 18-video set (sections 1-18)

**Load source:** `_four/src/routes/pbs-american-portrait/+page.ts`

```ts
export const load: PageLoad = () => ({
  videos: [...getByCategory('PBS American Portrait')].toSorted((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.published.localeCompare(a.published);
  }),
});
```

Sort posture: featured-first then `published.localeCompare` desc (D-18 inheritance from Phase 3 D-25 default sort). `getByCategory` already shipped Phase 2 D-24 in `_three`'s data layer; load matches `_four` verbatim except the `videos` are then passed to `<ReelStage>` instead of `<VideoCard>` grid.

**Section-zero composition with ReelStage:** CONTEXT Claude's Discretion offers 3 implementation paths. Recommended: a new `<ReelStage>` prop `intro?: Snippet` with a section-zero discriminator. The 19-section iteration becomes: section 0 renders the intro snippet content inside a `snap-start h-svh` `<section aria-labelledby="pbs-intro-heading">` (NOT `<article>` per Phase 3 D-10 contract for non-video landmarks); sections 1-18 iterate `videos` as `<article aria-label="Video N of M: ...">` per existing ReelStage contract. The `±1` viewport-windowing budget treats section zero as a non-iframe slot — no PreviewLoop mount, just a poster background. Activeidx hash-write (`#video=<id>`) at `ReelStage.svelte:131-133` should NOT fire for section zero (planner must guard `bestIdx > 0` or `if (videos[bestIdx])`).

## Press Surface Research

### 13 credits (data shape, D-08)

**Filter logic source:** `_four/src/routes/press/_pressCredits.ts:48`

```ts
const pressVideos = videos.filter((v) => v.uploader !== 'Michelle Ngo');
```

**Verified uploader count via `grep -E '"uploader"' src/lib/data/videos.json | sort -u`:**

14 distinct uploader strings:
1. ABC News
2. Amazon News
3. AZPM
4. Cargo Film & Releasing
5. GrasshalmClips
6. HBO
7. HBO Max
8. HBODocs
9. Lenny Cooke (Movie)
10. Michelle Ngo ← filtered out
11. Monument Releasing
12. Music Box Films
13. PBS
14. U2

After filter: **13 non-Michelle uploaders** — matches PRES-01 spec. Each uploader has exactly 1 credit today (audit-verified at `_four` plan time per the `_pressCredits.ts` JSDoc).

### Prestige order (D-18)

**Source:** `_four/src/routes/press/_pressCredits.ts:24-38`

```ts
const PRESTIGE_ORDER = [
  'HBO Max',
  'HBO',
  'PBS',
  'ABC News',
  'U2',
  'Amazon News',
  'Music Box Films',
  'Monument Releasing',
  'Cargo Film & Releasing',
  'AZPM',
  'HBODocs',
  'GrasshalmClips',
  'Lenny Cooke (Movie)',
] as const;
```

Copy this constant **verbatim** into `_three`'s new `src/routes/press/_pressCredits.ts`. The order is hand-tuned for hiring-producer scan signal (prestige weight descending). The 13 strings match the 13 filtered uploaders exactly — confirmed by the verified grep output above. Note string equality is character-sensitive: `Lenny Cooke (Movie)` includes the parenthetical and the trailing-paren character; `Cargo Film & Releasing` uses an ampersand not "and".

**Output shape divergence (D-08):**

`_four` returns `Array<{ network: string; videos: Video[] }>` (grouped). `_three` returns `Array<{ network: string; video: Video }>` (flat — one section per credit). The defensive future-proofing (unknown uploader → appended last in insertion order) carries forward. Today's data: 1:1 uploader-to-video ratio means both shapes are equivalent in output count (13 records). Tomorrow's multi-credit data: `_four` would render one section with N titles; `_three` would render N sections in a row (most cinematic — every credit is its own moment).

**Recommended TypeScript shape:**

```ts
export interface PressCredit {
  network: string;
  video: Video;
}

export function getPressCredits(): PressCredit[] {
  // Same filter + iteration logic; flatten the grouping at emit time.
}
```

### Network logo assets (D-06 — NO logo assets)

**D-06 inherits `_four`'s no-logo-wall rejection.** Network identity = text wordmark only, rendered in `--font-display` (Source Serif 4) at `text-6xl` weight 600 per UI-SPEC §100. Zero image assets to source, zero licensing review, zero per-network color decisions. The wordmark is the typographic moment.

**Per-section background:** `getPosterFor(video)` returns the static JPEG poster of the network's one credit video — same `posters.json` sidecar shipped Phase 3 D-04 (validated by `validatePostersPlugin` at vite.config.ts). NO iframes on `/press` per D-05 — poster-only, no iframe lifecycle, no IntersectionObserver windowing budget.

## About Surface Research

### Bio source + default seed (D-19)

**Source file:** `_four/src/routes/about/+page.svelte:62-67` (the lines INSIDE the `<!-- BEGIN approved bio -->` / `<!-- END approved bio -->` markers)

**Full default seed text (verbatim):**

> I'm Michelle Ngo, a filmmaker and producer based in New York City. I make video that helps brands and broadcasters tell stories well — short documentaries, branded films, promos, and trailers. My credits include PBS American Portrait, HBO Max, HBO, ABC News, U2's Sphere residency, Amazon News, and Music Box Films. I love a tight schedule and a thoughtful script. I work hardest when the subject matter is human — real people telling true stories about how they live, what they make, and why it matters. If you have a project that needs a steady hand and a quick turn, get in touch.

**Approval gate (D-19):** This is the **default seed**, not a lock. D-19 mandates plan-time fresh approval via `<approved>...</approved>` element in 06-02-PLAN.md (or 06-03 depending on planner's plan split). Planner MUST surface this text for user sign-off before execution. User may approve verbatim OR request edits. The approved text is then embedded inline in `src/routes/about/+page.svelte`.

**Word count:** ~108 words (close to D-19's "~100 words" target). Punctuation: em-dashes (`—`), curly apostrophes (`'`, `'`). Copy these characters exactly — they're typographically intentional (mirrors `_four`'s `<meta description>` line 47-48).

### Ambient reel reuse via `<HeroAmbient />` + `createHeroDefer` factory

`<HeroAmbient />` (`src/lib/components/HeroAmbient.svelte`) is the Phase 5 Plan 05-03 component. It already:
- Reads `producerReelId` + `getById(producerReelId)` from `$lib/data` (line 48) → loads Vimeo 264677021 unconditionally
- Owns its own IntersectionObserver via `runed`'s `useIntersectionObserver` (line 100-106)
- Subscribes to `pageVisibility.documentHidden` for mobile-menu / tab-visibility pause (line 73)
- Sets its own `setContext('reel:visibility', ...)` for child `PreviewLoop` (line 84-88)
- Instantiates `createHeroDefer()` factory (line 60) — **factory, not module-scope singleton** specifically so `/about` D-09 can instantiate its own without timer/listener collision during SPA navigation
- Implements REEL-04 unified fallback codepath (line 66-68): `motion.prefersReducedMotion || network.isCellularLike || autoplayFailedFromHero` → poster-only

**Reuse posture:** Recommend `/about` Act 1 import `<HeroAmbient />` verbatim. CONTEXT Claude's Discretion notes the option to instantiate a separate `<AboutHero />` component if /about's wordmark text needs to differ (`ABOUT` vs `MICHELLE NGO`). The current HeroAmbient hardcodes `MICHELLE NGO` and `Filmmaker & Producer` at line 164-167. Three options:

| Option | Tradeoff |
|--------|----------|
| (a) Reuse `<HeroAmbient />` verbatim | Wrong wordmark text — would show "MICHELLE NGO" on /about, not "ABOUT" |
| (b) Parameterize `<HeroAmbient />` with `{ wordmark, tagline }` props | Minimal — 2 new props, defaults to current values; one component covers both `/` and `/about` |
| (c) Build `<AboutHero />` as a sibling component sharing `createHeroDefer` | Clean separation; duplicates ~50 lines of layout code |

**Recommended:** Option (b). HeroAmbient was already designed parametric per Plan 05-03 STATE note. Add `{ wordmark?: string; tagline?: string }` props with defaults matching current. `/about` invokes `<HeroAmbient wordmark="ABOUT" tagline={undefined} />` (Claude's Discretion in UI-SPEC §232 recommends omitting the tagline on Act 1).

### Reduced-motion degradation pattern (REEL-04 inheritance)

`<HeroAmbient />` line 66-68 implements the unified REEL-04 codepath. When ANY of these is true, the iframe never mounts and the poster (Layer 1) is the only visible surface:

1. `motion.prefersReducedMotion` (matchMedia subscription from `$lib/state/motion.svelte`)
2. `network.isCellularLike` (Chromium-only; Safari/Firefox `effectiveType === undefined` evaluates falsy, so they get the iframe)
3. `autoplayFailedFromHero` (latched per-instance once PreviewLoop's 800ms HANDSHAKE_TIMEOUT_MS elapses or `onError` fires)

The `/about` ambient hero inherits this contract automatically. No new degradation work needed — `/about` Act 1 just consumes the existing component.

**Validation:** The Phase 5 hero.spec.ts e2e test (`tests/e2e/hero.spec.ts`) has a `reduced-motion` test variant that asserts the iframe NEVER appears (Layer 2 never renders) when `prefers-reduced-motion: reduce` matches. The /about Playwright test (Phase 6 new) should add a parallel assertion at the /about URL with the same emulation.

## Contact Surface Research

### `<ContactBlock />` contract (D-20)

**Source file:** `_four/src/lib/components/ContactBlock.svelte` (88 lines total)

**Channel literals (lines 41-43, 48-86):**

```ts
const IMDB_URL = 'https://www.imdb.com/';
const LINKEDIN_URL = 'https://www.linkedin.com/';
const VIMEO_URL = 'https://vimeo.com/user2149742';
```

```html
<ul class="space-y-2 text-base">
  <li><a href="mailto:mynogo@gmail.com" class="text-white hover:underline underline-offset-2">mynogo@gmail.com</a></li>
  <li><a href="tel:+19175661976" class="text-white hover:underline underline-offset-2">(917) 566-1976</a></li>
  <li><a href={IMDB_URL} target="_blank" rel="noopener" class="text-white hover:underline underline-offset-2">IMDb</a></li>
  <li><a href={LINKEDIN_URL} target="_blank" rel="noopener" class="text-white hover:underline underline-offset-2">LinkedIn</a></li>
  <li><a href={VIMEO_URL} target="_blank" rel="noopener" class="text-white hover:underline underline-offset-2">Vimeo</a></li>
</ul>
```

**5-channel order (D-20):** Email → Phone → IMDb → LinkedIn → Vimeo. Channel literals byte-identical to `_four`.

**Mailto literal:** `mailto:mynogo@gmail.com` (display: `mynogo@gmail.com`)

**Tel literal:** `tel:+19175661976` (display: `(917) 566-1976` — phone with parens + dash)

**IMDb fallback URL (D-21):** `https://www.imdb.com/`
**LinkedIn fallback URL (D-21):** `https://www.linkedin.com/`
**Vimeo URL:** `https://vimeo.com/user2149742`

**Post-launch URL swap (D-21 backlog item, OUT OF SCOPE for Phase 6):**
- Personalized IMDb shape: `https://www.imdb.com/name/nm{NUMERIC_ID}/`
- Personalized LinkedIn shape: `https://www.linkedin.com/in/{HANDLE}/`
- Tracked as pre-cutover blocker in HUMAN-UAT per CONT-02 — single-line edit per URL when materializable

**Test contract robustness (per `_four`'s existing test):** The IMDb assertion uses `getAttribute('href') ?? '' .toContain('imdb.com')` (substring match, not equality). This means the test passes for BOTH the fallback `https://www.imdb.com/` AND any future personalized URL like `https://www.imdb.com/name/nm1234567/`. Same for LinkedIn and Vimeo. Copy this test pattern verbatim — it absorbs the URL-swap without test changes.

### Single-source-of-truth pattern

ContactBlock has **no props**, **no variants**, **no orientation prop**. One vertical layout everywhere — `/about` Act 2, `/contact` center, Footer column 1. Editing the literals in one file propagates everywhere. The component IS the source of truth.

`<svelte:head>` Person JSON-LD on /about must duplicate the URL constants (the comment block at `_four/src/routes/about/+page.svelte:20-29` explains why — ContactBlock doesn't export its URL constants). Two options:

| Option | Tradeoff |
|--------|----------|
| (a) Duplicate URL literals in `/about/+page.svelte` with a sync-warning comment block (matching `_four`) | Mirrors `_four` exactly — A/B parity preserved. Risk: drift if maintainer edits one but not the other |
| (b) Extract URL constants to `$lib/contact-channels.ts` shared module | Cleaner — single source. Diverges from `_four`'s pattern |

**Recommended:** Option (a). Mirror `_four`'s posture — the sync-warning comment block (`_four/src/routes/about/+page.svelte:20-29`) is the load-bearing safety net. A/B parity is the principle.

## Footer Integration

### Where `<ContactBlock />` injects

ContactBlock appears on three surfaces:
1. **`/about` Act 2** — below bio paragraph with `mt-12` gap (D-10 + UI-SPEC §65 spacing consolidation)
2. **`/contact` splash** — centered horizontally + vertically (D-12)
3. **`<Footer />` column 1** — below "Contact" `<h3>` header (D-13)

**Single component, three call sites.** All three import from `$lib/components/ContactBlock.svelte` (no path differences — `_four`'s reference uses `./ContactBlock.svelte` relative inside Footer because both files are in `src/lib/components/`; `/about` and `/contact` use `$lib/components/ContactBlock.svelte` alias).

### Layout-level vs route-level Footer injection

**Layout-level injection** per CONTEXT D-13 + existing layout TODO comment (`src/routes/+layout.svelte:22`):

> Phase 6 will add `<Footer />` AFTER `{@render children()}` (CONT-03).

The Footer is universal chrome — appears on EVERY route (the 7 routes Phase 1-5 ship + the 4 new Phase 6 routes). Mounting in `+layout.svelte` below `{@render children()}` gives single-source-of-truth without per-page imports.

**No route-level Footer overrides.** `/work` and `/work/[category]` (reel routes) use scroll-snap mandatory; the user reaches the Footer only by scrolling past the entire reel — natural flow. `/contact` per D-12 explicitly invites scroll to Footer with a scroll-cue.

### TopNav fade-scope extension (D-16)

Current `TopNav.svelte:61-65`:

```ts
const REEL_ROUTE_IDS: ReadonlySet<string> = new Set([
  '/work',
  '/work/[category]',
  '/pbs-american-portrait',
]);
```

**Phase 6 change (D-16):** Add `/press` to the set. One-line edit. The fade-scope rule (`onReelRoute = page.route.id !== null && REEL_ROUTE_IDS.has(page.route.id)` at line 68) automatically picks up the new entry.

**Note on PBS route id:** Current set uses `/pbs-american-portrait` (no trailing slash). This is the `page.route.id` SvelteKit computes from `src/routes/pbs-american-portrait/+page.svelte` — it's the route-pattern id, NOT the URL pathname. The actual URL emitted is `/pbs-american-portrait` (since `_three` has no `trailingSlash` setting — default `'never'`). See "Routing & Prerender Notes" below for the trailingSlash decision.

### Footer category retarget logic (D-13)

`_four/src/lib/components/Footer.svelte:50-54`:

```ts
{@const slug = categoryToSlug(category)}
{@const href =
  slug === 'pbs-american-portrait'
    ? `${base}/pbs-american-portrait/`
    : `${base}/work/${slug}`}
```

**Critical decision:** The PBS retarget href is `${base}/pbs-american-portrait/` (WITH trailing slash). Under `_four`'s `trailingSlash = 'always'`, both forms (with/without trailing slash) resolve to the same prerendered HTML; the click-side normalization handles either. Under `_three`'s default `trailingSlash = 'never'`, the trailing slash MAY cause a redirect or 404 depending on adapter behavior — see Routing notes below.

## Routing & Prerender Notes

### Critical finding: trailingSlash mismatch between `_three` and `_four`

**`_four`** sets `trailingSlash = 'always'` in `src/routes/+layout.ts` (verified via grep). All routes emit as `/about/`, `/contact/`, `/press/`, `/pbs-american-portrait/`, etc.

**`_three`** does NOT set `trailingSlash` (verified — `src/routes/+layout.ts` only sets `prerender = true`). SvelteKit's default is `trailingSlash = 'never'`. Routes emit as `/about`, `/contact`, `/press`, `/pbs-american-portrait`, etc.

This is a **shipped, non-trivial divergence** from `_four`. Existing `_three` code already accommodates it: `TopNav.svelte:61-65` uses `/pbs-american-portrait` (no trailing slash) in `REEL_ROUTE_IDS`; `TopNav.svelte:143` PBS dual-route guard uses `endsWith('/pbs-american-portrait')` (also no trailing slash); `svelte.config.js:37` handleHttpError allowlist uses `/about`, `/press`, `/contact` (no trailing slash).

**But CONTEXT D-13 wants `${base}/pbs-american-portrait/` (with trailing slash) in Footer column 2**, and the route shape PBS-01 specifies is `/pbs-american-portrait/` (with trailing slash) in the requirements wording.

**Three resolution paths (planner picks):**

| Path | Effort | Risk |
|------|--------|------|
| (a) Adopt `trailingSlash = 'always'` in `_three`'s `+layout.ts` | One-line edit. ALL existing routes auto-renormalize to trailing-slash form. Existing `endsWith` guards in TopNav may need updating from `endsWith('/work/${slug}')` to `endsWith('/work/${slug}/')` | Medium — touches Phase 4 active-state logic; existing tests assert pathname shapes |
| (b) Strip trailing slash from Footer + CONTEXT references | No-route-config change. Footer column 2 PBS retarget becomes `${base}/pbs-american-portrait` (no trailing slash). UI-SPEC + REQUIREMENTS wording updates | Low — fewer touch points; but diverges from `_four`'s "match exactly" Footer mirror principle (D-13) |
| (c) Special-case the PBS route only | Hardcode `${base}/pbs-american-portrait/` literally; SvelteKit serves the same HTML for both forms in adapter-static (the 404.html fallback catches the trailing-slash form). Verify by manually checking `build/pbs-american-portrait/index.html` exists after build | Low — but obscures the inconsistency; risks runtime 404 if adapter normalization differs from expected |

**Recommended:** (a) — adopt `trailingSlash = 'always'`. Adapter-static emits `build/<route>/index.html` for both `'always'` and `'never'` postures (the directory structure is the same; only the URL canonical form differs in HTTP redirects / `<link rel=canonical>` SEO). Migration is one-line; the existing `endsWith` logic in TopNav already accommodates with-or-without-trailing-slash via the normalized form (`page.url.pathname.replace(/\/$/, '')` at line 140). Recommend the planner promote this from "Claude's Discretion" to an explicit D-22 lock in 06-CONTEXT.md or surface it as the first decision in 06-01-PLAN.md.

**Confidence:** MEDIUM-HIGH. SvelteKit 2.59 `adapter-static` documented behavior: both `trailingSlash` settings emit the same `<route>/index.html` directory structure. Verified via reading `_three`'s existing `svelte.config.js` (uses `fallback: '404.html'` + `strict: true`); the 404.html fallback catches mismatched URL forms.

### Prerender posture (all 4 routes)

All 4 new routes are static — inherit `prerender = true` from `src/routes/+layout.ts:3`. No `+page.ts` re-declaration needed.

**Per-route load shape:**

| Route | Load | Source of truth |
|-------|------|------------------|
| `/pbs-american-portrait/` | `+page.ts`: `getByCategory('PBS American Portrait')` sorted featured-first then date-desc → `{ videos: Video[] }` | `_four/src/routes/pbs-american-portrait/+page.ts` (15 lines) — copy verbatim |
| `/press` | `+page.ts`: `getPressCredits()` → `{ credits: PressCredit[] }` (NOTE: shape differs from `_four`'s `{ groups }` per D-08 flat array) | `_four/src/routes/press/+page.ts` (14 lines) — adapt for flat array |
| `/about` | No load needed — purely static composition | n/a |
| `/contact` | No load needed — purely static composition | n/a |

### svelte.config.js handleHttpError allow-list cleanup

Current `svelte.config.js:37-40` ships an allow-list for known-pending Phase 6 routes:

```js
if (path === '/about' || path === '/press' || path === '/contact') {
  console.warn(`[prerender] Expected pending 404 (Plan 04-02 NAV-01 / Phase 6): ${path}`);
  return;
}
```

**Phase 6 cleanup:** Remove this 3-route allow-list once the routes ship in Phase 6. The `/posters/` + `/watch/` allow-list above it (line 33-36) is already obsolete (Phase 3 + Phase 5 shipped) — Phase 6 should remove the entire 3-route block AND optionally clean up the obsolete `/posters/` + `/watch/` block as well. Planner picks whether to ship the cleanup in 06-01 (shared chrome plan) or carry to Phase 7 polish.

### PBS-03 inheritance from Phase 4

CONTEXT confirms PBS-03 (TopNav active-state on both `/pbs-american-portrait/` and `/work/pbs-american-portrait/`) is **already shipped** in Phase 4 via `TopNav.svelte:143` PBS dual-route `endsWith` guard. Phase 6 inherits the requirement satisfaction — no TopNav active-state work needed for PBS-03.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 (unit + component) + Playwright 1.60.0 (e2e) + @axe-core/playwright 4.11.3 (a11y) |
| Config file | `vite.config.ts` (Vitest two-project split: `data` node, `ui` jsdom). `playwright.config.ts` (e2e on chromium + webkit + firefox) |
| Quick run command | `pnpm test` (vitest run with passWithNoTests) |
| Full suite command | `pnpm test && pnpm test:e2e && pnpm check && pnpm lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PBS-01 | Section zero renders verbatim blockquote; sections 1-18 render | route + e2e | `pnpm test src/routes/pbs-american-portrait/page.test.ts` + `pnpm test:e2e tests/e2e/pbs-landing.spec.ts` | ❌ Wave 0 — both new |
| PBS-02 | 15 of 18 sections render "See on PBS →" badge; 3 IDs lack badge | unit + route | `pnpm test src/routes/pbs-american-portrait/_pbsCollectionUrl.test.ts` + `pnpm test src/routes/pbs-american-portrait/page.test.ts` | ❌ Wave 0 — both new |
| PBS-03 | TopNav PBS active on both routes | e2e (existing Phase 4) | `pnpm test:e2e tests/e2e/wayfinding-layout.spec.ts` | ✅ Phase 4 shipped |
| PRES-01 | 13 scroll-snap sections in prestige order; each = poster + wordmark + title + ▷ Watch | unit + route + e2e | `pnpm test src/routes/press/_pressCredits.test.ts` + `pnpm test src/routes/press/page.test.ts` + `pnpm test:e2e tests/e2e/press.spec.ts` | ❌ Wave 0 — all new |
| ABT-01 | Bio renders verbatim; ambient hero renders; reduced-motion → poster; ContactBlock below | route + e2e | `pnpm test src/routes/about/page.test.ts` + `pnpm test:e2e tests/e2e/about.spec.ts` | ❌ Wave 0 — both new |
| CONT-01 | ContactBlock on /contact + /about + Footer; 5 channels everywhere | unit + route + e2e | `pnpm test src/lib/components/ContactBlock.test.ts` + `pnpm test src/lib/components/Footer.test.ts` + `pnpm test:e2e tests/e2e/contact.spec.ts` | ❌ Wave 0 — all new |
| CONT-02 | IMDb/LinkedIn URLs contain fallback domains (test passes for both fallback + personalized) | unit | `pnpm test src/lib/components/ContactBlock.test.ts` (existing `_four` test pattern) | ❌ Wave 0 — new |
| CONT-03 | Site-wide Footer mirrors TopNav; 5 channels via ContactBlock; 8 categories; 4 site links | unit + e2e | `pnpm test src/lib/components/Footer.test.ts` + `pnpm test:e2e tests/e2e/contact.spec.ts` (verifies Footer present on every route) | ❌ Wave 0 — both new |

### Verbatim-reuse validation strategy (the hard Nyquist question)

CONTEXT pins content reuse from `_four` for PBS blockquote (D-17), bio default seed (D-19 — pending approval), prestige order (D-18), and channel literals (D-20). **How does Phase 6 prove byte-equality with `_four`'s source without manual diff?**

**Three strategies (planner picks; recommend all three):**

| Strategy | Mechanism | Failure mode caught |
|----------|-----------|---------------------|
| (1) Test-level literal assertions | Test files hardcode expected strings: `expect(blockquoteText).toBe("Whether it's joy or sorrow…")`. The test IS the lock. Drift in the route file → test red. | Direct content edit (typo, paraphrase, deletion) |
| (2) Cross-repo byte-diff in CI (Trap A inheritance) | Phase 2 already ships `videos.json` cross-repo diff. Extend pattern to `_four`'s ContactBlock URL constants + Footer category retarget logic + bio paragraph. CI clones `_four` at pinned SHA and asserts string equality. | Sibling rewrite without `_three` follow-up |
| (3) Visual regression snapshot (Playwright `toHaveScreenshot`) | Snapshot per-surface on first run; flag any pixel diff on subsequent runs. **Reject this for Phase 6** — design language differs; pixel-equality would be a false-positive nightmare | n/a (rejected) |

**Recommended:** Strategy (1) primarily, with Strategy (2) deferred to Phase 7's cross-repo CI hardening (out of Phase 6 scope per A/B integrity tracking).

**Strategy (1) example assertions:**

```ts
// src/lib/components/ContactBlock.test.ts — copy from _four/src/lib/components/ContactBlock.test.ts verbatim
expect(emailLink?.textContent?.trim()).toBe('mynogo@gmail.com');
expect(phoneLink?.textContent?.trim()).toBe('(917) 566-1976');
expect(imdb?.getAttribute('href') ?? '').toContain('imdb.com');  // robust to fallback ↔ personalized swap
```

```ts
// src/routes/pbs-american-portrait/page.test.ts (new)
expect(blockquoteEl.textContent.trim()).toContain('Whether it's joy or sorrow');
expect(blockquoteEl.textContent.trim()).toContain('chance for everyday Americans to be heard.');
```

```ts
// src/routes/press/_pressCredits.test.ts (new)
expect(result.map((r) => r.network)).toEqual([
  'HBO Max', 'HBO', 'PBS', 'ABC News', 'U2', 'Amazon News',
  'Music Box Films', 'Monument Releasing', 'Cargo Film & Releasing',
  'AZPM', 'HBODocs', 'GrasshalmClips', 'Lenny Cooke (Movie)',
]);
expect(result).toHaveLength(13);
```

### Sampling Rate

- **Per task commit:** `pnpm test` (Vitest run — typically < 10 seconds for the data + ui projects together)
- **Per wave merge:** `pnpm test && pnpm test:e2e && pnpm check && pnpm lint` (full suite — ~3 minutes including Playwright cold start)
- **Phase gate:** Full suite green before `/gsd:verify-work`; axe-core scan in e2e suite (existing `tests/e2e/axe.spec.ts` pattern from Phase 1) — extend with assertions on `/about`, `/contact`, `/press`, `/pbs-american-portrait`

### Wave 0 Gaps

**New test files Phase 6 ships (matching CONTEXT §Established Patterns + UI-SPEC §Component Inventory):**

- [ ] `src/lib/components/ContactBlock.test.ts` — covers CONT-01, CONT-02 (channel order, mailto/tel hrefs, target=_blank rel=noopener, fallback URL contains-substring assertions). **Copy `_four`'s test verbatim** — 102 lines, 4 describe blocks, ~7 it blocks.
- [ ] `src/lib/components/Footer.test.ts` — covers CONT-03 (3-column grid at lg breakpoint, ContactBlock in column 1, 8 category links in column 2 with PBS retarget href, 4 site links in column 3, copyright bottom strip). Reference `_four/src/lib/components/Footer.test.ts` for shape.
- [ ] `src/routes/pbs-american-portrait/_pbsCollectionUrl.test.ts` — covers PBS-02 (regex extraction; 18 real-data extractions verifying 15 yes / 3 no; trailing punctuation strip edge case). Copy `_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.test.ts` verbatim.
- [ ] `src/routes/pbs-american-portrait/page.test.ts` — covers PBS-01, PBS-02 (section zero renders + 18 sections render + 15-of-18 PBS badges present + blockquote text matches verbatim).
- [ ] `src/routes/press/_pressCredits.test.ts` — covers PRES-01 (13 records returned, prestige order, no Michelle uploads, flat shape `{ network, video }`).
- [ ] `src/routes/press/page.test.ts` — covers PRES-01 (13 scroll-snap sections render in order; each has network wordmark + title + ▷ Watch CTA).
- [ ] `src/routes/about/page.test.ts` — covers ABT-01 (ambient hero renders, bio paragraph present, ContactBlock below bio, reduced-motion fallback assertable via `motion.svelte.ts` mock).
- [ ] `src/routes/contact/page.test.ts` — covers CONT-01 (wordmark top + ContactBlock centered + scroll-cue + Footer below splash).
- [ ] `tests/e2e/pbs-landing.spec.ts` — e2e PBS-01/02/03 on 3 browsers + axe a11y.
- [ ] `tests/e2e/press.spec.ts` — e2e PRES-01 (13 scroll-snap sections + prestige order + chrome-fade extension) + axe.
- [ ] `tests/e2e/about.spec.ts` — e2e ABT-01 (two-act layout + ambient fallback under reduced-motion + ContactBlock present) + axe.
- [ ] `tests/e2e/contact.spec.ts` — e2e CONT-01/02/03 (ContactBlock on /contact + /about + Footer; channel-homepage fallback URLs verified) + axe.

**Existing test infrastructure (zero new framework setup needed):**
- ✅ Vitest 4.1.5 two-project split (data + ui) already configured in `vite.config.ts`
- ✅ Playwright 1.60.0 + 3-browser matrix (chromium + webkit + firefox) already configured in `playwright.config.ts`
- ✅ @axe-core/playwright 4.11.3 already installed + used in `tests/e2e/axe.spec.ts`
- ✅ jsdom 29.1.1 + vitest-setup-ui.ts already configured for component mount/unmount
- ✅ Svelte 5 + Testing Library 5.3.1 pattern established (see `src/lib/components/HeroAmbient.svelte.test.ts` for the .svelte.test.ts extension pattern when needed)

**Component test pattern (mount/unmount, no @testing-library/svelte wrapper):**

`_four`'s pattern uses raw `mount`/`unmount` from 'svelte' (see `_four/src/lib/components/ContactBlock.test.ts:1-3`). `_three` follows the same pattern — see `src/lib/components/PreviewLoop.test.ts` etc. for verbatim shape. No new pattern to invent.

## File-path manifest

**Source-of-truth `_four` files the planner MUST reference as `read_first` in plans:**

### For shared chrome (likely Plan 06-01)

- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/lib/components/ContactBlock.svelte` — full reference impl (88 lines); copy near-verbatim into `_three/src/lib/components/ContactBlock.svelte`
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/lib/components/ContactBlock.test.ts` — full test reference (102 lines); copy verbatim into `_three/src/lib/components/ContactBlock.test.ts`
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/lib/components/Footer.svelte` — full reference impl (119 lines); copy structure verbatim into `_three/src/lib/components/Footer.svelte`
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/lib/components/Footer.test.ts` — test reference; copy structure verbatim

### For PBS landing (likely Plan 06-02)

- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/pbs-american-portrait/+page.svelte` — **read lines 57-60 for verbatim PBS blockquote text** (D-17); read lines 64-72 for outbound link literals (D-02). Cinematic restyle changes everything outside these lines.
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/pbs-american-portrait/+page.ts` — full file (20 lines); copy verbatim (sort posture identical for `_three`)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.ts` — full file (24 lines); copy verbatim
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.test.ts` — test reference; copy verbatim

### For Press surface (likely Plan 06-02)

- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/press/_pressCredits.ts` — **read lines 24-38 for verbatim PRESTIGE_ORDER constant** (D-18); read line 48 for verbatim filter logic. Reshape output from grouped to flat per D-08 — but copy the PRESTIGE_ORDER + filter + future-proofing logic verbatim.
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/press/+page.ts` — reference for load() shape (adapt to flat array)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/press/_pressCredits.test.ts` — test reference (adapt assertions for flat array)

### For About surface (likely Plan 06-03)

- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/about/+page.svelte` — **read lines 62-67 for bio default seed text** (D-19); read lines 30-41 for Person JSON-LD payload pattern (Claude's Discretion recommends ship in Phase 6); read lines 20-29 for the sync-warning comment block about URL duplication

### For Contact surface (likely Plan 06-03)

- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/contact/+page.svelte` — reference for absolute minimum composition (h1 + ContactBlock). `_three` rewraps in full-bleed splash; the ContactBlock import remains identical

### Existing `_three` files the planner MUST reference for primitive reuse

- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/components/ReelStage.svelte` — Phase 3 + Phase 5; verify children-rendering contract for section-zero intro slot decision
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/components/ReelSection.svelte` — Phase 3; extension target for D-03 PBS badge in top-right overlay
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/components/HeroAmbient.svelte` — Phase 5 Plan 05-03; consume on /about Act 1 (with wordmark/tagline prop additions if Option (b) chosen)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/heroDefer.svelte.ts` — Phase 5 Plan 05-03; factory exported via `createHeroDefer()` already designed for /about reuse per JSDoc line 19-23
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/components/PosterImage.svelte` — Phase 3; consume on /press section bg + /contact splash bg (likely inline `<img>` simpler for splash bg, since PosterImage carries title/CTA overlays designed for reel context)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/data/posters.ts` — Phase 3; `getPosterFor(video)` returns deterministic path string
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/data/index.ts` — Phase 2 public surface; consume `videos`, `producerReelId`, `getById`, `getByCategory`, `categoryToSlug`, `getCategoriesInDisplayOrder`
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/components/TopNav.svelte` — Phase 4; one-line edit at line 61-65 to add `/press` to REEL_ROUTE_IDS (D-16)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/routes/+layout.svelte` — Phase 1 + 4 + 5; add `<Footer />` below `{@render children()}` (line 22 TODO comment already reserves the spot)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/svelte.config.js` — Phase 1 + 4; either (a) adopt `trailingSlash = 'always'` in `+layout.ts`, (b) remove the 3-route handleHttpError allow-list at lines 37-40 once routes ship
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/routes/+layout.ts` — Phase 1; possibly add `export const trailingSlash = 'always';` per Routing decision

## Open Questions / Risks

1. **trailingSlash mismatch resolution** (highest-priority, surfaced in Routing section)
   - What we know: `_four` uses `'always'`; `_three` uses default `'never'`. Existing `_three` code (TopNav route-id matcher, handleHttpError allow-list) accommodates `'never'` form. CONTEXT D-13 + UI-SPEC reference `/pbs-american-portrait/` (with trailing slash).
   - What's unclear: Whether to adopt `'always'` to match `_four` (and the implicit "A/B parity at chrome layer" principle) OR strip the trailing slash from CONTEXT/UI-SPEC.
   - Recommendation: Adopt `trailingSlash = 'always'` in 06-01-PLAN. One-line edit in `src/routes/+layout.ts`. Update tests asserting pathname shapes if any. Lift to explicit D-22 lock at plan-phase or surface in plan-check.

2. **ReelStage section-zero composition** (CONTEXT Claude's Discretion)
   - What we know: ReelStage's current child contract iterates `videos` prop as `<article aria-label="Video N of M: ...">` per Phase 3 D-10. Section zero is non-video — needs different landmark (`<section aria-labelledby="pbs-intro-heading">`).
   - What's unclear: Implementation path — new `intro?: Snippet` prop on ReelStage, polymorphic first child via a discriminator, or sibling section outside ReelStage with same `snap-start h-svh` classes.
   - Recommendation: New `intro?: Snippet` slot on ReelStage. Minimal extension, preserves the `±1` viewport-windowing budget (section zero is a non-iframe slot), and the activeIdx hash-write at `ReelStage.svelte:131-133` automatically excludes section zero (it's not in the `videos` array).

3. **HeroAmbient wordmark parameterization** (CONTEXT Claude's Discretion)
   - What we know: Current HeroAmbient hardcodes "MICHELLE NGO" + "Filmmaker & Producer" at lines 164-167. `/about` Act 1 wants "ABOUT" wordmark.
   - What's unclear: Add props vs build sibling component.
   - Recommendation: Add `{ wordmark?: string; tagline?: string }` props with defaults matching current values. One file edit; backward-compatible with `/` invocation.

4. **Plan split** (Claude's Discretion in CONTEXT; UI-SPEC §646 hints "estimated split: shared chrome / PBS+press / about+contact")
   - What we know: Three coherent work groups exist (shared chrome, PBS+press reel surfaces, about+contact splash surfaces). The bio approval gate (D-19) is plan-time work, not execution-time — wherever the bio renders, that plan needs the `<approved>` element.
   - What's unclear: Whether the trailingSlash decision lives in 06-01 (shared chrome) or precedes it as a 0-effort migration. Whether the Person JSON-LD on /about lives in 06-03 (about+contact) or splits to Phase 7 audit.
   - Recommendation: 3 plans as suggested — 06-01 shared chrome (ContactBlock + Footer + layout wiring + TopNav fade extension + trailingSlash decision), 06-02 PBS + Press reel surfaces (both share ReelStage extension work), 06-03 About + Contact splash surfaces (bio approval gate in 06-03's `<approved>` element).

5. **Bio approval gate timing** (D-19 lock)
   - What we know: Default seed is `_four`'s shipped bio (~108 words). D-19 mandates fresh user approval at plan time via `<approved>...</approved>` element.
   - What's unclear: Whether user approves verbatim seed (most likely — `_four`'s bio is already user-approved and shipped) or requests edits.
   - Recommendation: 06-03-PLAN surfaces the seed inside `<approved>` and waits for user sign-off. Default expectation: user approves verbatim.

6. **Footer category retarget URL form** (depends on trailingSlash decision)
   - What we know: `_four` Footer uses `${base}/pbs-american-portrait/` (with trailing slash) under `trailingSlash='always'`. `_three`'s "no trailing slash by default" makes this URL emit a redirect or 404 unless handled.
   - What's unclear: Same as Open Question 1.
   - Recommendation: Resolves automatically when Open Question 1 resolves.

7. **Removal of svelte.config.js handleHttpError allow-list** (cleanup opportunity)
   - What we know: `svelte.config.js:32-41` ships allow-lists for known-pending Phase 6 routes (`/about`, `/press`, `/contact`) and obsolete Phase 3/5 routes (`/posters/`, `/watch/`).
   - What's unclear: Whether the cleanup ships in 06-01 (shared chrome) or carries to Phase 7 polish.
   - Recommendation: Ship cleanup in 06-01 — it's mechanical, low-risk, and the strict prerender posture is the correct end-state.

## Sources

### Primary (HIGH confidence — direct file reads)

- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/.planning/phases/06-pbs-press-about-contact/06-CONTEXT.md` — primary source for all 21 D-decisions, deferred ideas, code context, integration points
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/.planning/phases/06-pbs-press-about-contact/06-UI-SPEC.md` — pre-approved design contract (typography 4 sizes + 2 weights, spacing scale, color tokens, per-surface layout)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/.planning/REQUIREMENTS.md` — 8 requirement IDs (PBS-01/02/03, PRES-01, ABT-01, CONT-01/02/03)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/.planning/ROADMAP.md §Phase 6` — goal + 5 success criteria
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/.planning/STATE.md` — Phase 5 ship state; resume file pointer
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/lib/components/ContactBlock.svelte` — verbatim channel literals + Phase 7 deferral comment block
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/lib/components/Footer.svelte` — verbatim 3-column structure + PBS retarget logic + copyright literal
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/about/+page.svelte` — verbatim bio default seed + Person JSON-LD payload pattern + URL sync-warning comment block
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/contact/+page.svelte` — minimal contact composition reference
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/press/_pressCredits.ts` — verbatim PRESTIGE_ORDER constant + filter logic + defensive future-proofing
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/press/+page.svelte` — editorial composition reference (diverges in `_three`)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/press/+page.ts` — load() shape reference
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/pbs-american-portrait/+page.svelte` — verbatim PBS blockquote text (lines 57-60) + outbound link literals (lines 64-72)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/pbs-american-portrait/+page.ts` — verbatim sort posture
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.ts` — verbatim regex + JSDoc
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_four/src/lib/components/ContactBlock.test.ts` — test pattern reference (substring assertions on URLs survive fallback ↔ personalized swap)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/routes/+layout.svelte` — current layout shape; explicit Phase 6 Footer TODO at line 22
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/components/HeroAmbient.svelte` — Phase 5 ambient hero contract + REEL-04 fallback codepath + setContext('reel:visibility') broadcast
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/heroDefer.svelte.ts` — `createHeroDefer()` factory; JSDoc line 19-23 explicitly cites /about reuse rationale
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/components/ReelStage.svelte` — Phase 3 + 5 children-rendering contract; hash-write at line 131-133 (planner must guard against section-zero firing)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/components/TopNav.svelte` — Phase 4 chrome-fade scope set at lines 61-65; D-16 one-line extension target
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/svelte.config.js` — handleHttpError allow-list cleanup target
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/src/lib/data/videos.json` — direct grep verification: 18 PBS videos, 15 collection URLs, 14 distinct uploaders (13 non-Michelle)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/package.json` — Vitest + Playwright + axe-core versions confirmed
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/vite.config.ts` — two-project Vitest split confirmed (data node + ui jsdom)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/.planning/config.json` — workflow.nyquist_validation: true (validation architecture section required)
- `C:/Users/Mkaru/Documents/Hello_World/hugginface_profile/Websites/michelle_ngo_three/CLAUDE.md` — locked stack + cinematic design DNA + iOS 16+ target + `h-svh` lock

### Secondary (MEDIUM confidence — derived/inferred)

- Recommended trailingSlash resolution (Open Question 1) — derived from comparing `_four/+layout.ts` posture vs `_three/+layout.ts` absence vs CONTEXT D-13 URL form. Adapter-static behavior across both postures verified via official SvelteKit `adapter-static` docs (cached knowledge — emits `<route>/index.html` directory structure under both `'always'` and `'never'`).

### Tertiary (LOW confidence — none)

No tertiary sources. Every claim in this research is verified against either a CONTEXT decision, a UI-SPEC contract, a REQUIREMENTS line, a direct file read, or a grep against committed data.

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — zero new dependencies per UI-SPEC §Registry Safety; all primitives already shipped Phases 1–5
- Architecture: HIGH — CONTEXT D-01..D-21 pre-populated; UI-SPEC §Per-Surface Layout Contract diagrams every surface
- Pitfalls: HIGH — Phase 3 documented 20 pitfalls; Phase 4-5 expanded; Phase 6 inherits all mitigations
- Verbatim content reuse: HIGH — file paths + line numbers verified via direct file reads
- Validation Architecture: HIGH — existing test infrastructure (Vitest two-project + Playwright 3-browser + axe-core) covers all Phase 6 needs; new files listed in Wave 0 Gaps
- trailingSlash resolution: MEDIUM — recommended path is one-line edit but planner must verify no existing test depends on `'never'` form

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (30 days — stable phase; all primitives shipped; only stale risk is `_four` SHA pin drift if sibling edits ship between research and execution)
