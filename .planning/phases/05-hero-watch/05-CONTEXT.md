# Phase 5: Hero & Watch - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Two cinematic surfaces, both riding the iframe-lifecycle pattern proven sound in Phase 3:

1. `/` **HeroAmbient** — full-bleed `100svh` always-mounted producer reel (Vimeo `264677021`) playing silently muted as the background with a two-stop gradient overlay; centered `MICHELLE NGO` + tagline + `▷ PLAY REEL` CTA + bottom `↓` scroll-cue; the *full* `/work` reel composes immediately below. Scrolling past hero engages the reel.
2. `/watch/[id]` — edge-to-edge `100vw` letterboxed embed on full black; metadata below player in normal flow (h1 title, interactive CategoryTag chip → `/work/[cat]`, uploader · year, optional description); a `<ContinueReelRail />` horizontal scroll-snap-x carousel of same-category siblings; 56 prerendered slug routes; back-nav scroll restoration via `/work#video={id}` hash already written by Phase 3.

In scope:
- `src/lib/components/HeroAmbient.svelte` (new — wraps PreviewLoop in always-mounted-while-visible posture, owns its own IntersectionObserver to unmount when off-screen)
- `src/routes/+page.svelte` rewrite — replaces the Phase 1 splash; composes `<HeroAmbient />` + `<ReelStage videos={data.videos} />`
- `src/routes/+page.ts` — load returns `{ videos }` from `$lib/data` (same pattern as `/work/+page.ts`)
- `src/lib/components/WatchPlayer.svelte` (new — letterboxed iframe wrapper consuming `buildEmbedUrl(video, 'play')`; postMessage handlers for `play`/`pause`; pointer + idle-3s timer driving the fade controller)
- `src/lib/components/WatchChrome.svelte` (or fold inline — Claude's discretion) — owns the metadata + back-button block whose visibility binds to the shared fade state
- `src/lib/components/ContinueReelRail.svelte` (new — pure CSS scroll-snap-x mandatory flex row; heading-is-link to `/work/[slug]`; hide if empty)
- `src/routes/watch/[id]/+page.{ts,svelte}` (new — near-verbatim from `_four`: `entries()` over all 56 videos, `error(404)` on unknown id, rail built at load-time via `getByCategory + filter(currentId) + sort(featured-first, published-desc)`)
- Hero deferred-load: poster first paint → swap to iframe after `requestIdleCallback` / 1s timer / first pointer interaction (POL-02 mechanism lands here, not retrofitted in Phase 7)
- Back-nav scroll restoration in `<ReelStage>` — `onMount` reads `window.location.hash`, matches video id, `scrollIntoView({ block: 'start', behavior: 'auto' })` (sync, no smooth scroll noise on first paint)
- Hero fallback codepath: reuses the unified Phase 3 REEL-04 trigger set (reduced-motion + cellular + LPM + EU-blocked + embed-disabled) → poster + `▷ PLAY REEL` CTA
- VideoObject JSON-LD payload on `/watch/[id]` — derived from video record; ships in Phase 5 to mirror `_four/watch/[id]/+page.svelte` shape (Phase 7 POL-01 audits)
- Tests: unit (HeroAmbient defer logic + WatchPlayer fade state machine + ContinueReelRail scroll-snap + hash-restoration); Playwright e2e (HERO-01..03 + WATCH-01..05 + axe a11y on `/` and `/watch/[id]`)

Out of scope (other phases):
- `<TopNav />` chrome-fade behavior — Phase 4 D-06 locked scope to reel routes only; `/` and `/watch/[id]` keep TopNav solid (TopNav already shipped in Phase 4)
- `/pbs-american-portrait/` landing page, `/press`, `/about`, `/contact` — Phase 6
- Per-page `<title>` + meta description tuning across all routes, Person JSON-LD on `/about`, sitemap.xml endpoint — Phase 7 POL-01 (Phase 5 emits the VideoObject JSON-LD only because it's inline in the `/watch/[id]` template)
- LCP < 2.5s CI gate (Lighthouse CI hardening) — Phase 7 POL-02 (Phase 5 ships the *mechanism*; Phase 7 wires the *gate*)
- Production cutover infrastructure — Phase 7 FOUND-03 + POL-04 + POL-05
- `<Footer />` + `<ContactBlock />` — Phase 6 (CONT-01..03)
- Real-device QA matrix for hero LCP on cellular — Phase 7 POL-04 (Phase 5 ships the mechanism; thermal QA already deferred to UAT per Phase 3)
- Native player chrome UX (Vimeo/YouTube native controls) — owned by the providers; do not layer custom controls
- Custom share modal beyond default `mailto:` — out of scope per REQUIREMENTS Out-of-Scope list

</domain>

<decisions>
## Implementation Decisions

### Hero composition on `/`

- **D-01:** **`/` composes `<HeroAmbient />` + `<ReelStage videos={data.videos} />` below.** The Phase 1 splash (`src/routes/+page.svelte`) is replaced entirely. Producer scrolls from hero into the reel as one continuous cinematic surface. PROJECT.md HERO-02 promise ("scrolling past hero reveals the first ReelSection of the full /work reel below") is the load-bearing UX commitment.
- **D-02:** **Hero is always-mounted WHILE VISIBLE; unmounts to poster when scrolled fully off-screen.** A dedicated IntersectionObserver inside `<HeroAmbient>` (NOT shared with the ReelStage observer below — they own separate viewports + different windowing rules) watches the hero element. When `intersectionRatio === 0` the hero iframe swaps to its poster, preserving Phase 3 D-09's peak-3-iframe budget (hero counts as +1 only while visible; once off-screen, the ±1 reel windowing has the full budget). When scrolled back into view, hero re-mounts via the same deferred-load path as initial mount.
- **D-03:** **Phase 5 ships the deferred-load mechanism in `<HeroAmbient>`.** Poster mounts eagerly (LCP first paint, same `<img>` + `loading="eager"` + `fetchpriority="high"` pattern as `_four/HeroPoster.svelte:33`); iframe swaps in after **whichever fires first**: `requestIdleCallback({ timeout: 1000 })` OR `setTimeout(1000)` fallback (Safari lacks requestIdleCallback) OR first pointer interaction (`pointerdown` / `wheel` / `touchstart` / `scroll`). POL-02 LCP < 2.5s on 4G is satisfied by the eager poster; iframe is best-effort enhancement. Phase 7 just hardens the Lighthouse CI gate; the mechanism is owned here.
- **D-04:** **Hero fallback affordance: poster + `▷ PLAY REEL` CTA only.** The unified Phase 3 REEL-04 codepath applies here verbatim — `motion.prefersReducedMotion || network.isCellularLike || autoplayFailedFromHeroLoop || embedDisabled` collapses to ONE poster render. The existing CTA (which already navigates to `/watch/264677021` per HERO-03) is the sole affordance. No separate `▷ START AMBIENT` toggle. Mirrors Phase 3 PosterImage `▷ PLAY WITH SOUND` pattern: one affordance, two contexts (cinematic mode = CTA atop ambient reel; fallback = CTA atop still poster).
- **D-05:** **Hero overlay: centered MICHELLE NGO + tagline + `▷ PLAY REEL` + `↓` scroll-cue.** Display-serif (`--font-display` Source Serif 4) wordmark, centered horizontally, vertically around the visual midline. Tagline below in sans (`--font-sans`). Pill-button CTA below tagline using Phase 1 D-05/D-06/D-07 double-ring focus token (automatic via global `:focus-visible`). Bottom-center `↓` chevron scroll-cue. **Two-stop gradient overlay for legibility (Pitfall 20):** `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%)` — protects top + bottom for text contrast while keeping the center video uncovered. (Exact stop alpha + gradient stops Claude's discretion in plan-phase.)

### Watch player surface (`/watch/[id]`)

- **D-06:** **Letterbox = edge-to-edge `100vw` player; height = 16:9 cap; vertical letterbox bars top/bottom on tall viewports.** Implementation: outer `<div class="bg-black min-h-svh">`; player container is `aspect-video w-full max-h-svh` centered via flex. On wide monitors the player fills the width; black bars top/bottom only if viewport is taller than `width × 9/16`. On portrait phones the player occupies the upper third and chrome flows below in document order. Cinematic-immersive maxes the work — matches a24films.com / MUBI screening-room feel.
- **D-07:** **Chrome-fade postMessage rules — `play` → fade OUT after 600ms grace; `pause` OR pointer-leave-canvas OR idle-3s-while-playing → fade IN immediately.** State machine: `'idle' → ('play' postMessage + 600ms timer) → 'playing-chrome-faded' → ('pause' postMessage OR pointer leaves player bounding rect OR no pointer movement for 3s) → 'idle'`. The 600ms grace prevents flash-fade when a producer is mid-click on the native player UI (e.g., adjusting volume immediately after play starts). Single fade controller in `<WatchPlayer>` (or a `$state` rune in the page); back button + TopNav-spacer + metadata + ContinueReelRail-heading all subscribe to ONE opacity getter. (TopNav itself stays solid per Phase 4 D-06; the FADING chrome is the watch-page-specific overlay — back button + idle metadata.)
- **D-08:** **Metadata placement: BELOW player in normal flow; the entire below-player region shares the fade state.** Mirror `_four/watch/[id]/+page.svelte` content shape verbatim — `<h1>{title}</h1>` + `<CategoryTag category href={base}/work/{slug}/>` + `<p>{uploader} · {year}</p>` + `{#if description}<p whitespace-pre-line>...{/if}` — but restyled for cinematic palette (display-serif title, ample whitespace, monochrome chip with category accent ring). The metadata block, the back-button, and the ContinueReelRail heading all consume the same `opacity-{fadeOn ? 100 : 0}` + `pointer-events-{fadeOn ? auto : none}` derived classes. (Pure CSS transition, no JS animation.)
- **D-09:** **Watch route uses `buildEmbedUrl(video, 'play')` from Phase 3 — autoplay with sound.** The 'play' mode already excludes `muted=1`/`loop=1`/`background=1` while keeping `autoplay=1` + `dnt=1`. **Cellular policy: bypassed when user explicitly clicks `▷ PLAY REEL` or `▷ PLAY WITH SOUND`.** Click = consent. iOS Low Power Mode may still block autoplay-with-sound; that's the provider's own UI (a native ▷ overlay button) and is acceptable degradation. Direct URL paste to `/watch/[id]` (no click) ALSO autoplays — the URL is itself an action. No additional cellular gate on `/watch/[id]`.

### Continue-the-reel rail (`<ContinueReelRail />` — WATCH-03)

- **D-10:** **Pure CSS `scroll-snap-x mandatory` + `flex` row.** Native browser primitives matching the Phase 3 vertical-reel posture. `flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-hide` outer container; each `<a>` (card link) is `snap-start`. Native momentum scroll on iOS; touch drag works for free. **No `embla-carousel-svelte` dep** — embla's drag-on-desktop + dot-indicator features aren't load-bearing for a sibling-discovery rail; the ~10KB cost isn't justified.
- **D-11:** **Card sizing — fractional peek: mobile 1.4 cards visible, sm 2.4, md 3.4, lg 4.4.** Aspect-video (16:9) poster cards (consuming Phase 3's `$lib/data/posters.ts` `getPosterFor()` helper). Sizing via Tailwind v4 viewport-percentage classes: `w-[70vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw]`. Always partial-card on right edge as affordance to scroll. Card includes title + uploader · year overlay (consistent with reel-section overlay treatment).
- **D-12:** **Heading-is-link (mirror `_four` D-36 verbatim):** `<h2><a href={`${base}/work/${slug}`} data-sveltekit-preload-data="hover">More in {category} →</a></h2>`. One element does two jobs (heading + filter entry-point). A/B parity at IA level. (ESLint per-file override `svelte/no-navigation-without-resolve` mirrors the `_three/ReelSection.svelte` + `_four/TopNav.svelte:30` pattern.)
- **D-13:** **Hide rail entirely when `rail.length === 0` (mirror `_four` D-38).** `{#if rail.length > 0}<section>...</section>{/if}` wraps the heading + carousel. Producer sees only player + metadata. Edge case is rare given the 56-video corpus (every category has ≥1 video; the rail can only be empty if the current video is the only one in its category, which the data audit confirms doesn't happen for any production category) — but mirror the defensive `_four` posture for forward-safety.

### Back-nav scroll restoration (WATCH-05)

- **D-14:** **Hash-only mechanism — Phase 3's `/work#video={id}` hash write IS the entire state.** No `history.state` object, no `mnp_three_*` storage. URL is canonical (consistent with Phase 4 D-13 "URL is canonical source of state, no parallel store"). Phase 3 already writes the hash via `history.replaceState` debounced 300ms after each snap settle; Phase 5 is purely the *consumer* side.
- **D-15:** **Restoration trigger: `<ReelStage>` `onMount` reads `window.location.hash`, matches video id, calls `scrollIntoView({ block: 'start', behavior: 'auto' })`.** Single canonical hook in `<ReelStage>` (not in route page components, not in layout). `behavior: 'auto'` (NOT 'smooth') so the scroll is instant on first paint — no animated scroll noise polluting the cinema entry. If hash is absent OR doesn't match any video in the current `videos` prop (e.g., wrong category on `/work/[cat]`), no-op and land at top. **Implementation note:** the `onMount` hook runs after `sectionRefs` is bound; the planner should verify timing (may need a `tick()` await or a `$effect` that fires once `sectionRefs.length === videos.length`).
- **D-16:** **Direct URL paste case behaves identically.** Hash is the source of truth regardless of arrival mode. Pasting `/work#video=1007027015` into a fresh tab lands on that section. Free bonus: producers can share deep-link URLs to specific reel positions. (Phase 7 POL-01 sitemap may want to surface these, or may stay slug-level — defer to Phase 7.)
- **D-17:** **Cross-route arrival also restores when hash matches a video in the current filtered set.** SvelteKit `<a href>` clicks preserve the hash by default if the link target carries one. Clicking "More in {category} →" from `/watch/X` (where the user originated from `/work/promos#video=X`) lands on `/work/promos` with hash intact — restoration finds video X in the filtered set, scrolls there. If hash points to a video NOT in the new filtered set (e.g., user manually changes the URL), ignore hash and land at top. Predictable: hash-matches-in-current-set → restore; else → top.

### Claude's Discretion (open during plan-phase / research)

- Exact file split for `<WatchPlayer>` vs `<WatchChrome>` vs inline in `/watch/[id]/+page.svelte` — single component vs decomposed; planner's call based on test surface.
- Whether the deferred-load mechanism lives inside `<HeroAmbient>` directly or extracted to a `$lib/heroDefer.svelte.ts` rune that future surfaces (e.g., Phase 6 `/about` ambient-loop bg) reuse. Phase 6 ABT-01 does specify "layered over an ambient muted reel loop" — a shared rune may be the cleaner abstraction.
- Hero IntersectionObserver implementation — `runed`'s `useIntersectionObserver` (matches Phase 3 ReelStage pattern) vs inline DIY for the single-element single-observer case. Both pass.
- Gradient stop math for hero overlay — D-05 specifies the two-stop shape; exact alpha + stop percentages tuned during plan or via `/gsd:ui-phase 5`.
- Idle timer implementation — `setTimeout` reset on each `pointermove` event vs `setInterval` polling with last-move timestamp. Reset-on-move is conventional.
- Pointer-leave detection bounds — player's bounding rect vs the whole `<main>` element. Recommend bounding rect (more focused fade trigger).
- `WatchPlayer` autoplay-blocked recovery — if browser blocks autoplay-with-sound (some Chrome variants do without prior user gesture), the embed's native ▷ overlay button is the recovery UX; Phase 5 doesn't synthesize a custom overlay.
- VideoObject JSON-LD payload exact shape — mirror `_four/watch/[id]/+page.svelte:41-54` near-verbatim. Phase 7 POL-01 audits.
- Mobile pointer-leave handling — touch devices don't emit `pointerleave` on lift; chrome-fade should also trigger on `touchend` + idle-3s timer on mobile.
- Whether the back-button gets a visible label ("BACK") or icon-only (`←`) — palette consistency with Phase 4 chrome.
- Cards: native `<a>` element vs `<button>` with SvelteKit `goto()` — `<a>` is correct semantic + prefetch-friendly + back-nav-friendly.
- ContinueReelRail accessibility: `<nav aria-label="More in {category}">` wrapping vs `<section aria-labelledby={...}>` — both pass; `<section>` may be more semantically accurate ("rail" is content, not nav).
- ScrollIntoView fallback for browsers without smooth-or-instant support — universally supported in target browsers (iOS Safari 16+), so no fallback needed.
- ESLint per-file override pattern for new components (`svelte/no-navigation-without-resolve` for any using `${base}/...` literals) — mirror Phase 3/4 pattern.
- Test scope mapping: which Playwright assertion covers HERO-01 vs HERO-02 vs HERO-03 vs WATCH-01..05 — planner maps in 05-PLAN.

### Folded Todos

None — `gsd-tools todo match-phase 5` returned 0 matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 5 requirements + success criteria
- `.planning/ROADMAP.md` §Phase 5: Hero & Watch — goal, depends-on Phase 3, 6 success criteria, HERO-01..03 + WATCH-01..05 mapping
- `.planning/REQUIREMENTS.md` §Home & Reel-Led Entry — HERO-01 (`/` renders `<HeroAmbient />` always-mounted producer reel 264677021, gradient overlay, centered name + tagline + `▷ PLAY REEL`), HERO-02 (`↓` scroll-cue, scrolling past hero reveals first ReelSection of full `/work` reel below), HERO-03 (`▷ PLAY REEL` → `/watch/264677021` plays with sound)
- `.planning/REQUIREMENTS.md` §Watch View — WATCH-01 (full-bleed letterboxed on black, chrome fades on play / back on hover via postMessage), WATCH-02 (title + uploader + category + year metadata fade in on idle, out on play), WATCH-03 (`<ContinueReelRail />` horizontal carousel, replaces `_four`'s grid rail), WATCH-04 (56 prerendered slug routes via `entries()`), WATCH-05 (back-nav restores reel section via `history.state` + hash)
- `.planning/REQUIREMENTS.md` §Polish & Cutover — POL-02 (LCP < 2.5s on 4G, hero iframe deferred until interaction or 1s idle — D-03 here owns the mechanism), POL-03 (no layout shift on poster→iframe swap, `100svh`), POL-01 (VideoObject JSON-LD on every `/watch/[id]` — emitted inline in Phase 5 template; Phase 7 audits)

### Project-wide context (locked constraints)
- `.planning/PROJECT.md` §Constraints — modern evergreen browsers iOS Safari 16+ / Chrome / Firefox current; scroll-snap + IntersectionObserver as load-bearing APIs; cinema-first LCP 2.5s budget; bandwidth ethics on cellular
- `.planning/PROJECT.md` §Key Decisions — "Silent muted preview loops via native Vimeo/YouTube iframes" (hero); "Viewport-windowed iframe mounting current ± 1" (D-02 here preserves the budget); "Cellular = poster + tap-to-play" (hero fallback D-04)
- `.planning/PROJECT.md` §Current State — Phase 3 + Phase 4 ship-state summary; what Phase 5 builds on
- `.planning/STATE.md` §Blockers/Concerns — REEL-04 Chromium-only ambiguity RESOLVED (Phase 3 D-05); EU GDPR posture RESOLVED (Phase 3 D-06); A/B traffic-split STILL OPEN (Phase 7) — does not affect Phase 5

### Phase 3 carry-forward (load-bearing iframe-lifecycle context)
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §decisions D-05/D-06/D-07/D-08 — unified REEL-04 fallback codepath (5 triggers → ONE PosterImage render); cellular detection on Chromium only; 800ms postMessage timeout; module-scope state runes. Hero D-04 reuses this codepath verbatim. Watch player D-09 inherits 'play' mode autoplay-with-sound contract.
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §decisions D-09/D-10/D-11/D-12 — peak-3-iframe budget; ±1 viewport-windowed mounting; IntersectionObserver threshold 0.5 + `rootMargin: '100% 0%'`; pause-not-unmount on Page Visibility. D-02 here preserves the peak-3 budget by unmounting hero when scrolled off.
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §decisions "URL hash Claude's Discretion" — Phase 3 writes `/work#video={id}` on snap settle (300ms debounce, `history.replaceState`); D-14/D-15 here are the consumer side
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §domain — Phase 3 ships `<article aria-label>` landmark structure; back-nav restoration relies on the section refs Phase 3 already binds
- `src/lib/iframe/url.ts` — `buildEmbedUrl(video, mode: 'preview' | 'play')` already supports both modes. D-09 locks the 'play' mode for `/watch/[id]`. The 'preview' mode is what HeroAmbient consumes (silent muted background loop).
- `src/lib/components/PreviewLoop.svelte` — 4-state lifecycle + 5-layer leak defense + Page Visibility consumer. HeroAmbient reuses this component (or its lifecycle pattern) verbatim for the always-mounted-while-visible posture.
- `src/lib/components/PosterImage.svelte` — Phase 3 fallback component; HeroAmbient renders this when in fallback mode (D-04).
- `src/lib/data/posters.ts` + `src/lib/data/posters.json` — Phase 3 poster sidecar; ContinueReelRail D-11 cards consume `getPosterFor()`; HeroAmbient's poster IS one of these (Vimeo 264677021).
- `src/lib/state/motion.svelte.ts` + `src/lib/state/network.svelte.ts` — Phase 3 module-scope runes. Hero D-04 fallback codepath subscribes to these unchanged.
- `src/lib/components/ReelStage.svelte` — already exposes `setContext('reel:stage', { mountedIds, activeIdx, videoCount })`; D-15 restoration trigger lives inside this component's `onMount` (or new `$effect`).

### Phase 4 carry-forward
- `.planning/phases/04-wayfinding/04-CONTEXT.md` §decisions D-05/D-06 — TopNav chrome-fade scope is reel routes ONLY (`/work`, `/work/[cat]`, `/pbs-american-portrait`); `/` and `/watch/[id]` keep TopNav SOLID. D-07 here introduces a *separate* fade controller for watch-page chrome (back button, metadata, rail heading) — distinct from TopNav.
- `.planning/phases/04-wayfinding/04-CONTEXT.md` §decisions D-13 — "URL is canonical source of state, no parallel store" — D-14 here extends the principle to back-nav restoration (no `history.state` payload, no storage).
- `src/lib/components/TopNav.svelte` (Phase 4) — already exists; Phase 5 routes consume it unchanged. Confirms NAV-01 contract.
- `src/lib/components/FilterPillBar.svelte` (Phase 4) — only renders on `/work`/`/work/[cat]`/`/pbs-american-portrait`; does NOT appear on `/` or `/watch/[id]`.
- `src/lib/state/menu.svelte.ts` (Phase 4 D-08 bridge) — mobile menu pause posture; Hero iframe and Watch iframe should ALSO be paused when mobile menu is open (consistent with reel pause). Planner verifies the wiring extends.

### Phase 2 carry-forward
- `.planning/phases/02-data-layer/02-CONTEXT.md` §decisions D-24 — 11-name public surface (`videos`, `producerReelId`, `getById`, `getByCategory`, `categoryToSlug`, `slugToCategory`, `CATEGORIES`, etc.); Phase 5 consumes all unchanged
- `src/lib/data/index.ts` — public exports; HeroAmbient imports `producerReelId` + `getById(producerReelId)`; `/watch/[id]/+page.ts` imports `videos`, `getById`, `getByCategory`; ContinueReelRail receives the filtered + sorted rail array from load()

### Phase 1 carry-forward
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-05/D-06/D-07/D-08 — double-ring focus token; `▷ PLAY REEL` CTA + back button + ContinueReelRail card focus rings inherit via global `:focus-visible`
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-11/D-12 — font tokens (`--font-display` Source Serif 4, `--font-sans` Inter, `--font-mono`); category accent OKLCH variables `--color-cat-*`
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-14..D-17 — `mnp_three_*` storage namespace + grep gate (D-14 enforces no raw `localStorage`); Phase 5 has NO storage caller (D-14 hash-only mechanism explicit no-storage stance)

### Sibling-project reference (cinematic restyle of editorial pattern)
- `../michelle_ngo_four/src/routes/watch/[id]/+page.ts` — D-31/D-32 reference impl: `entries()` over all videos, `error(404)` on unknown id, rail = `getByCategory + filter(currentId) + toSorted(featured-first, published-desc)`. **Async signature is load-bearing** for the upstream test's `.rejects.toMatchObject({ status: 404 })` contract — do NOT make this sync. Copy near-verbatim for WATCH-04 + rail load.
- `../michelle_ngo_four/src/routes/watch/[id]/+page.svelte` — D-33..D-38 reference impl: direct iframe (no autoplay, no facade), max-w-5xl player + max-w-7xl metadata/rail, h1 + interactive CategoryTag + uploader · year + optional description, h2 heading-is-link rail, hide rail when empty. **Cinematic restyle target:** D-06 here makes the player edge-to-edge instead of max-w-5xl; D-08 here keeps the metadata shape but applies fade-with-chrome opacity behavior; D-10..D-13 here replace the 2/3/4 grid with a horizontal scroll-snap-x rail. The CONTENT contract (what fields show, what links where) carries over verbatim.
- `../michelle_ngo_four/src/lib/components/HeroPoster.svelte` — D-05 reference for poster eager-load pattern: `<link rel="preload" as="image">` in head + `<img loading="eager" fetchpriority="high">` Layer 1 of the z-stack. D-03 here borrows the eager-poster pattern but adds the iframe-swap-after-idle behavior on top (sibling's hero is poster-only; `_three`'s hero swaps to ambient iframe).
- `../michelle_ngo_four/.planning/phases/04-reel-led-home/04-CONTEXT.md` — sibling's hero-on-`/` decisions D-09..D-15 (poster only, no ambient iframe). `_three` diverges: cinematic-immersive ambient iframe IS the cinematic differentiator vs `_four`. Read for the "what changed and why" context, not for the pattern itself.
- **Explicitly do NOT copy** — `_four/src/lib/components/VideoCard.svelte` (the grid card; `_three`'s rail cards have different aspect + sizing per D-11); `_four/src/routes/+page.svelte` Featured-grid (`_three`'s `/` composes hero + full reel, not hero + grid).

### Existing `_three` code Phase 5 consumes
- `src/routes/+page.svelte` — Phase 1 splash placeholder; Phase 5 D-01 REPLACES this file entirely with the hero + reel composition
- `src/lib/components/ReelStage.svelte` — Phase 3 component; D-15 restoration trigger may extend this with an `onMount` block that reads location.hash. Already exposes `setContext('reel:stage', { activeIdx })` — D-15 may read it back from the same context once the scroll lands.
- `src/lib/components/ReelSection.svelte` — Phase 3 component; rendered unchanged below hero on `/` and on all `/work` routes
- `src/lib/components/PreviewLoop.svelte` — Phase 3 component; HeroAmbient instantiates ONE PreviewLoop for `producerReelId`; WatchPlayer does NOT use PreviewLoop (different lifecycle: not muted, not background, not viewport-windowed — direct iframe with postMessage listeners for fade-controller is simpler)
- `src/lib/components/PosterImage.svelte` — Phase 3 fallback component; HeroAmbient renders this in fallback mode (D-04); ContinueReelRail cards reuse the `<img>` + `getPosterFor()` pattern (NOT the PosterImage component wholesale — rail cards have different overlay treatment)
- `src/lib/data/index.ts` — public 11-name surface; Phase 5 imports `videos`, `producerReelId`, `getById`, `getByCategory`, `categoryToSlug`
- `src/lib/iframe/url.ts` — `buildEmbedUrl(video, 'preview' | 'play')` consumed by both HeroAmbient ('preview') and WatchPlayer ('play')
- `src/lib/iframe/vimeoAdapter.ts` + `src/lib/iframe/youtubeAdapter.ts` — postMessage adapters; WatchPlayer's fade-controller subscribes to `onPlay` + `onPause` callbacks via these
- `src/lib/state/network.svelte.ts` + `motion.svelte.ts` — module-scope runes; Hero D-04 fallback codepath consumes
- `src/routes/+layout.svelte` — Phase 4 ships skip-link + `<main id="main" tabindex="-1">` wrapper; Phase 5 routes render inside this unchanged
- `src/app.css` `@theme` — `--font-display` (hero wordmark + watch title), `--ring-focus*` (every focusable Phase 5 element), `--color-cat-*` (CategoryTag chip on watch metadata, rail cards), neutrals ramp (player canvas `bg-neutral-950` / `bg-black`)

### Provider docs (already cited in Phase 3 but apply to Phase 5 too)
- Vimeo player parameters — `https://help.vimeo.com/hc/en-us/articles/12426260232977` — D-09 `'play'` mode uses `?autoplay=1&dnt=1` (no `background=1`, no `muted=1`, no `loop=1`)
- Vimeo player JS messaging — `https://developer.vimeo.com/player/sdk/embed` — D-07 fade controller listens for `play` + `pause` postMessage events (already wired in `vimeoAdapter.ts`)
- YouTube IFrame API — `https://developers.google.com/youtube/iframe_api_reference` — D-07 fade controller listens for `onStateChange` event 1 (playing) + 2 (paused)
- Schema.org VideoObject — `https://schema.org/VideoObject` — POL-01 JSON-LD payload (mirror `_four/watch/[id]/+page.svelte:41-54`)
- WCAG 2.2.2 (Pause, Stop, Hide) — moving content on hero may need pause control; the `▷ PLAY REEL` is not a pause control (it navigates), but reduced-motion fallback (D-04) IS the pause-equivalent — confirms compliance
- WCAG 1.4.13 (Content on Hover or Focus) — fade-in on hover should be dismissable / hoverable / persistent — D-07's idle-3s timer satisfies "persistent" axis (chrome stays while pointer is over the player)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/iframe/url.ts` — `buildEmbedUrl(video, 'preview' | 'play')` ALREADY supports both modes. HeroAmbient: 'preview'. WatchPlayer: 'play'. Zero changes to url.ts in Phase 5.
- `src/lib/iframe/vimeoAdapter.ts` + `youtubeAdapter.ts` — postMessage adapter contract (`attachVimeo({ onReady, onPlay, onPause, onError })` + `attachYouTube(...)`) is the load-bearing API for the WatchPlayer fade controller (D-07). Adapters already handle origin allowlist + named listener refs + dispose() for the 5-layer leak defense.
- `src/lib/components/PreviewLoop.svelte` — HeroAmbient wraps a `PreviewLoop` for `producerReelId` (or instantiates the same lifecycle pattern inline). The `documentHidden` context bridge from Phase 4 D-08 already pauses the hero on mobile menu open.
- `src/lib/components/PosterImage.svelte` — HeroAmbient's fallback render path; pattern is `{#if shouldUsePoster}<PosterImage>...{:else}<PreviewLoop>...{/if}` mirroring Phase 3 ReelSection.
- `src/lib/components/ReelStage.svelte` — Phase 5 D-15 extends this with hash-restoration in `onMount`. Already exposes `setContext('reel:stage', { activeIdx, videoCount })`.
- `src/lib/data/posters.ts` + `getPosterFor(video)` — ContinueReelRail cards + HeroAmbient's poster fallback consume this; sidecar JSON already includes `vimeo-264677021` (producer reel).
- `src/lib/state/motion.svelte.ts` + `network.svelte.ts` — Hero D-04 fallback subscribes; WatchPlayer D-09 does NOT subscribe (click = consent overrides).
- `src/lib/state/menu.svelte.ts` (Phase 4) — `menu.menuOpen` getter; Hero + Watch iframes should pause when this flips true (planner verifies the bridge extends to hero/watch).
- `../michelle_ngo_four/src/routes/watch/[id]/+page.ts` — near-verbatim copy target for `entries()` + load() + rail derivation
- `../michelle_ngo_four/src/routes/watch/[id]/+page.svelte` — content shape reference (h1, CategoryTag chip → /work/[cat], uploader · year, optional description, VideoObject JSON-LD payload) — restyle layer, keep content contract
- `../michelle_ngo_four/src/routes/watch/[id]/page.test.ts` — test contract; mirror for `_three`

### To be built in Phase 5 (no `_three` analogue yet)
- `src/lib/components/HeroAmbient.svelte` — full-bleed `100svh` always-mounted-while-visible producer reel + own IntersectionObserver (unmount when off-screen per D-02) + deferred-load mechanism (poster → iframe after idle/timer/interaction per D-03) + overlay (wordmark + tagline + CTA + ↓ per D-05) + fallback codepath (D-04)
- `src/lib/components/WatchPlayer.svelte` — letterboxed edge-to-edge iframe (D-06) + postMessage `onPlay`/`onPause` listeners feeding the fade controller (D-07) + idle-3s timer + pointer-leave detection
- `src/lib/components/ContinueReelRail.svelte` — pure CSS scroll-snap-x (D-10) + fractional-peek card sizing (D-11) + heading-is-link (D-12) + hide-when-empty (D-13)
- `src/routes/+page.ts` — load returns `{ videos }` (mirrors `src/routes/work/+page.ts`); `prerender = true`
- `src/routes/+page.svelte` — REPLACES Phase 1 splash; composes `<HeroAmbient />` + `<ReelStage videos={data.videos} />` (D-01)
- `src/routes/watch/[id]/+page.ts` — near-verbatim from `_four`; `entries()` + load() + rail derivation
- `src/routes/watch/[id]/+page.svelte` — composes `<WatchPlayer video={data.video} />` + metadata block + `<ContinueReelRail rail={data.rail} category={data.video.category} />`; VideoObject JSON-LD in `<svelte:head>`
- `src/lib/heroDefer.svelte.ts` (Claude's discretion — extract or inline) — `requestIdleCallback` + 1s timer + pointer interaction → shouldMount flag rune
- Tests:
  - `src/lib/components/HeroAmbient.svelte.test.ts` — defer logic + fallback codepath + unmount-when-off-screen
  - `src/lib/components/WatchPlayer.svelte.test.ts` — fade state machine + postMessage handler wiring
  - `src/lib/components/ContinueReelRail.svelte.test.ts` — scroll-snap markup contract + heading-is-link + hide-when-empty
  - `src/routes/+page.test.ts` — hero + reel composition
  - `src/routes/watch/[id]/page.test.ts` — load() returns video + rail (mirror `_four`); `error(404)` on unknown id; rail sorting; rail filters out current id
  - Playwright e2e:
    - `tests/e2e/hero.spec.ts` — HERO-01 (hero renders), HERO-02 (scroll past hero → reel appears), HERO-03 (PLAY REEL navigates to /watch/264677021), defer-load mechanism, fallback under reduced-motion
    - `tests/e2e/watch.spec.ts` — WATCH-01 (player letterbox, chrome fades on play), WATCH-02 (metadata fade tied to chrome), WATCH-03 (rail renders, scrolls horizontally), WATCH-04 (56 prerendered routes — sampled), WATCH-05 (back-nav restores section)
    - `tests/e2e/restore.spec.ts` — direct paste with hash, cross-route hash carry-over, hash-not-in-set ignore

### Established Patterns (carry-forward into Phase 5)
- **`buildEmbedUrl(video, mode)` for ALL iframe URL construction** — never inline URL params at the call site (Phase 3 lock)
- **`prerender = true` in `+page.ts` for all static-export routes** — both `/` and `/watch/[id]/...` are SSG
- **`entries()` for dynamic route prerender** — mirror `_four/work/[category]/+page.ts` and `_four/watch/[id]/+page.ts` patterns
- **`async load()` signature is load-bearing** — even when no awaits are present (test contract: `.rejects.toMatchObject({ status: 404 })` requires the promise rejection)
- **Module-scope state runes with SSR-guard** — `$lib/state/*.svelte.ts` defaults during prerender; HeroDefer rune (if extracted) follows
- **`.svelte.ts` extension for runes outside `.svelte` components** + companion `.svelte.test.ts` files wrapping rune use in `$effect.root(() => { ... })` (Svelte 5.55+ rule, Phase 1 STATE note)
- **`data-sveltekit-preload-data="hover"` on every nav link** — pill bar, TopNav, ContinueReelRail cards, "More in {category}" heading-link
- **`eslint-disable svelte/no-navigation-without-resolve` per-file override** for components using `${base}/...` literals (Phase 4 D-08 documents the pattern; ContinueReelRail + WatchPlayer back-button will need it)
- **`endsWith` suffix-match for active-state** (Phase 4 D-06 helper) — not directly used in Phase 5 since the new routes don't introduce TopNav active-state changes, but applies if `/watch/[id]` ever needs a nav-highlight
- **`opacity-0 pointer-events-none` for hiding interactive chrome** (NOT `display:none`) — D-07 fade controller follows
- **`<article>` not `<section>` for video-sized landmarks** (Phase 3 D-10 + Pitfall 8) — `/watch/[id]/+page.svelte` outer wrapper is `<article>` mirroring `_four` line 73
- **Vitest two-project split** — component tests → `ui` project (jsdom); route load tests → `ui` project under `src/routes/**/*.test.ts` glob
- **POL-03 zero-CLS contract** — poster→iframe swap inherits container's exact aspect-ratio; HeroAmbient and WatchPlayer both follow

### Integration Points
- **`<HeroAmbient>` ↔ `$lib/iframe/url` + `vimeoAdapter`:** wraps the iframe in 'preview' mode; the always-mounted-while-visible posture means HeroAmbient subscribes to BOTH `motion.svelte.ts` (reduced-motion → poster) AND its own IntersectionObserver (off-screen → unmount). NOT subject to ReelStage's ±1 windowing.
- **`<HeroAmbient>` ↔ `<ReelStage>` (on `/`):** sibling components inside `+page.svelte`. HeroAmbient owns its own viewport (top 100svh); ReelStage's reel sits below. NO shared observer; NO context bridge (the documentHidden bridge from Phase 4 D-08 covers both via the layout-level menu rune).
- **`<WatchPlayer>` ↔ `vimeoAdapter`/`youtubeAdapter`:** subscribes to `onPlay` → start 600ms fade-out timer; `onPause` → immediate fade-in. The adapter's existing named-listener-refs + origin allowlist + dispose() pattern (5-layer leak defense) extends to WatchPlayer without modification.
- **`<WatchPlayer>` ↔ fade controller state:** $state in WatchPlayer (or `$state` in `+page.svelte`) drives a derived class set (`opacity-{n}` + `pointer-events-{auto|none}`) consumed by back-button, metadata block, ContinueReelRail heading. Pure CSS transition.
- **`<ContinueReelRail>` ↔ `$lib/data` + `posters.ts`:** card thumbnails consume `getPosterFor(video)`; cards link to `/watch/[id]` of that video; heading links to `/work/[slug]` via `categoryToSlug(category)`.
- **`<ReelStage>` ↔ window.location.hash (D-15):** new `onMount` (or `$effect` after sectionRefs bind) reads hash, finds element, scrollIntoView. Single canonical hash consumer.
- **`/watch/[id]/+page.ts` ↔ `getById` + `getByCategory`:** load() narrows video by id (404 on miss); rail is `getByCategory(video.category).filter(v => v.id !== video.id).toSorted(featured-first, published-desc)`.
- **`/+page.ts` ↔ `$lib/data`:** load returns `{ videos }` (mirrors `/work/+page.ts`).
- **`<svelte:head>` ↔ VideoObject JSON-LD:** inline `{@html JSON.stringify(payload)}` block per `_four/watch/[id]/+page.svelte:65-71` (eslint-disable `svelte/no-at-html-tags` — payload is build-time validated by Zod, no user input).
- **`menu.menuOpen` rune (Phase 4 D-08) ↔ HeroAmbient + WatchPlayer:** when mobile menu opens, hero and watch iframes pause too (consistent with reel pause). Planner verifies the wiring extends — likely via the same `documentHidden = pageHidden || menu.menuOpen` `$derived` already in `ReelStage`, surfaced into HeroAmbient + WatchPlayer.
- **Phase 6 carry-forward:** `<ContactBlock />` (CONT-01) lives below player on `/watch/[id]`? — REQUIREMENTS does NOT say so for Phase 5; ContactBlock is on `/contact`, `/about`, and Footer (CONT-03). Phase 5's `/watch/[id]` does NOT include ContactBlock. Footer (CONT-03) appears on every route incl. `/watch/[id]` once Phase 6 ships.
- **Phase 6 carry-forward:** `/about` ABT-01 specifies "layered over an ambient muted reel loop" — same `<HeroAmbient>` pattern adapted. If D-03's deferred-load mechanism is extracted to `$lib/heroDefer.svelte.ts`, `/about` reuses it.
- **Phase 7 carry-forward:** POL-01 sitemap.xml enumerates `/watch/[id]` slugs from `videos.map(v => `/watch/${v.id}`)` — same source-of-truth as `entries()` in `/watch/[id]/+page.ts`.
- **Phase 7 carry-forward:** POL-02 Lighthouse CI gate hardens; the LCP-bearing poster eager-load is shipped in Phase 5 D-03. CI just gates.
- **Phase 7 carry-forward:** POL-01 VideoObject JSON-LD audit; Phase 5 inlines the payload mirror of `_four`.

</code_context>

<specifics>
## Specific Ideas

- **Hero is the single most distinctive surface of `_three`.** `_four`'s `/` is a static hero poster + featured grid. `_three`'s `/` is an *ambient cinema* hero with the producer reel literally playing as the background — same producer reel ID (Vimeo 264677021), same wordmark/tagline content, completely different sensory register. The A/B test isolates this question: does "cinema-as-first-impression" outperform "thumbnail-grid-as-first-impression" for a hiring producer who wants to see Michelle's work? D-01 + D-03 + D-05 together commit to making cinema the first impression.

- **The peak-3-iframe budget is the load-bearing perf decision of `_three`.** Phase 3 D-09 accepted ±1 = 3 simultaneous iframes for the cinematic "reel is alive" feel. Phase 5 D-02 *preserves* this budget by unmounting hero when scrolled fully off-screen. The cost: a brief poster→iframe swap if the producer scrolls back to top after exploring the reel (acceptable; D-03's deferred-load mechanism makes the re-swap idiomatic). The alternative — always-mounted hero pushing peak to 4 iframes — re-opens the thermal/battery bet from Phase 3 D-09 and would force re-litigating the iPhone QA matrix (Phase 3 D-16). Don't.

- **Hash-only restoration (D-14) is consistent with Phase 4 D-13's URL-as-canonical-state principle.** Adding `history.state` or `mnp_three_*` storage for back-nav would create a parallel state surface that could drift from the URL. The hash IS the state. SvelteKit's history-preserving nav + the browser's native back/forward gestures handle the rest. The "shareable deep-link to a specific reel section" (D-16) is a free bonus, not the goal.

- **Chrome-fade on `/watch/[id]` is a SEPARATE controller from TopNav chrome-fade.** Phase 4 D-06 explicitly scopes TopNav fade to reel routes only; TopNav stays solid on `/watch/[id]`. Phase 5 D-07's fade controller governs the watch-page-specific overlay: back button + metadata + rail heading. They use the same `opacity-0 pointer-events-none` Tailwind pattern but are driven by *different* state sources (TopNav fades on `scrollIdle`; watch chrome fades on `playerState + idle timer + pointer-leave`). Don't conflate.

- **D-09's "click = consent" on cellular is a deliberate departure from Phase 3 D-05's cellular-poster-fallback.** Phase 3 protects producers on cellular from *56 autoplaying iframes* on `/work`. Phase 5 D-09 says: when a producer explicitly clicks `▷ PLAY REEL` / `▷ PLAY WITH SOUND`, they have consented to playing *this one video* even on cellular. The data-ethics posture is preserved (no surprise autoplay) while respecting user agency (no extra tap-to-play gate after explicit click). Direct URL paste to `/watch/[id]` is treated the same — the URL itself is the action.

- **The rail's hide-when-empty (D-13) is defensive, not load-bearing.** The 56-video corpus has every category populated. The rail can only be empty if a video is the sole member of its category, which doesn't currently happen. Mirror `_four`'s D-38 hide-when-empty pattern for forward-safety; if a future `videos.json` update creates a singleton category, the rail gracefully disappears instead of rendering an empty `<section>`.

- **VideoObject JSON-LD ships in Phase 5, audited in Phase 7.** REQUIREMENTS lists POL-01 (incl. VideoObject JSON-LD) under Phase 7, but the JSON-LD payload is inline in `_four/watch/[id]/+page.svelte` and the same is true here. It's cheaper to ship it correctly in Phase 5 (when the watch page is being authored) than to retrofit in Phase 7. Phase 7 POL-01 just *audits* the payload + adds Person JSON-LD on `/about` (Phase 6) + sitemap.xml (Phase 7) + Lighthouse CI gate hardening.

</specifics>

<deferred>
## Deferred Ideas

- **`embla-carousel-svelte` dep for the rail** — D-10 went with pure CSS scroll-snap-x. Embla's drag-on-desktop + dot-indicator features aren't load-bearing here. Reopen IF a producer flags "I can't drag the rail with my mouse on desktop."
- **Custom share modal beyond default `mailto:`** — `_four` parity; out of scope per REQUIREMENTS Out-of-Scope (FEAT-V2-03 if ever revisited).
- **`history.state` payload for back-nav** — D-14 chose hash-only. Reopen if hash-only proves insufficient (e.g., scroll position within a section, not just section id).
- **`mnp_three_*` storage for last-viewed video** — explicitly rejected by D-14 (URL is canonical). Reopen only if a producer requests cross-session resume.
- **`▷ START AMBIENT` separate-from-PLAY-REEL toggle on hero fallback** — D-04 chose single-CTA. Reopen if user-testing reveals producers want manual control over ambient bg even on cellular.
- **`/about` ambient-loop reuse of `<HeroAmbient>`** — Phase 6 ABT-01 territory. D-03 may extract a shared `$lib/heroDefer.svelte.ts` rune if planner sees the abstraction earning its keep.
- **`/watch/[id]` skeleton loader during iframe mount** — current pattern is poster → iframe (Phase 3); skeleton not necessary because the iframe loads quickly on first-paint click. Reopen if real-device QA finds an awkward flash.
- **In-video deep-link timestamps** (`?t=<sec>` Vimeo / `?start=<sec>` YouTube) — Phase 3 deferred this; remains deferred for Phase 5. Always plays from 0:00. Reopen on producer request.
- **`/watch/[id]` "Up Next" auto-advance** — `_four` doesn't have it; `_three` doesn't ship it. WATCH-03 rail is browse-signal, not autoplay-queue. Reopen as v2 feature if user-testing demands it.
- **Hover-to-preview on rail cards** — poster-only by WATCH-03 ("rail is browse signal, not preview"); hover-preview would re-mount iframes outside the ±1 budget. Reopen only if rail UX testing demands it.
- **`prefers-reduced-data` Chromium-only progressive enhancement** — Phase 3 deferred; remains deferred. Cellular detection (Phase 3 D-05) already covers the bandwidth-ethics axis.
- **Reduced-motion handling on `/watch/[id]`** — autoplay-with-sound under `prefers-reduced-motion: reduce` is *playback*, not motion-decoration; WCAG 2.3.3 doesn't trigger. No special handling. Reopen if a producer reports vestibular issues.
- **Back-button gesture for iOS Safari edge-swipe** — native browser back; no custom gesture handling needed.
- **Cellular gate on `/watch/[id]`** — explicitly rejected by D-09. Click = consent.
- **Skeleton/blur-up placeholder on rail card load** — posters are static + content-hashed (Phase 3 D-01); no flash to skeleton. Reopen if mobile real-device QA finds a visible swap.
- **Sharing-with-timestamp deep-link param** — out of scope; defer to v2 if `_three` wins.

</deferred>

---

*Phase: 05-hero-watch*
*Context gathered: 2026-05-27*
