# Phase 4: Wayfinding - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Wrap the existing 56-section reel in URL-driven navigation so a hiring producer can navigate Michelle's filmography as fast as any other portfolio. Phase 4 ships:

- `<FilterPillBar />` — sticky pill row above the reel (8 categories + "All" reset)
- 8 prerendered `/work/[category]` routes (`entries()` pattern, parity with `_four` D-29)
- `<TopNav />` — wordmark + 8 category links + About/Press/Contact + mobile hamburger; cinematic chrome-fade during reel scroll
- `<MobileMenu />` — full-screen hamburger overlay mirroring `_four`'s pattern
- Keyboard navigation contract (Arrow + PageUp/PageDown + Home/End + Space)
- Roving tabindex for Tab focus management across 56 sections (Pitfall 18 mitigation)
- Skip-to-content link landing on `<main>` wrapping pill bar + reel (NAV-03)

Phase 4 ONLY changes the `videos` prop fed to `<ReelStage>` and adds the chrome around it — the iframe lifecycle, scroll-snap mechanics, IntersectionObserver, Page Visibility broadcast, and `<article aria-label>` landmark structure all shipped sealed in Phase 3.

In scope:
- `src/lib/components/FilterPillBar.svelte` (new)
- `src/lib/components/TopNav.svelte` (new — mirror `_four/src/lib/components/TopNav.svelte` cinematic restyle)
- `src/lib/components/MobileMenu.svelte` (new — mirror `_four/src/lib/components/MobileMenu.svelte` close to verbatim)
- `src/routes/work/[category]/+page.ts` + `+page.svelte` (new — 8 prerendered routes via `entries()`)
- `src/routes/+layout.svelte` extensions — mount `<TopNav />` + skip-link + `<main id="main" tabindex="-1">` wrapper
- Reel keyboard handler — Arrow + PageUp/PageDown + Home/End + Space mapped to section ↔ section
- Roving tabindex inside `<ReelStage>` (or `<ReelSection>`) so only the current section's interactive elements are tabbable
- Chrome-fade behavior (TopNav + FilterPillBar) — fade on active scroll, surface on scroll-stop / hover-near-top / focus / tap (reel routes only: `/work`, `/work/[cat]`, `/pbs-american-portrait`)
- Mobile menu broadcasts `documentHidden = true` to the existing `reel:visibility` context so iframes pause via the Phase 3 D-12 plumbing
- Unit + Playwright tests for filter routing, keyboard nav, focus management, chrome-fade behavior, axe pass

Out of scope (other phases):
- `/pbs-american-portrait/` route itself (TopNav LINK exists in Phase 4; landing page lands in Phase 6) — Phase 4 only ensures the TopNav active-state suffix-match covers BOTH `/pbs-american-portrait/` AND `/work/pbs-american-portrait/` per NAV-01
- `/`, `/watch/[id]`, `/about`, `/press`, `/contact` routes — Phases 5, 6
- `<Footer />` — Phase 6 (CONT-03)
- Hero / WatchPlayer iframe behavior — Phase 5
- SEO + JSON-LD + sitemap + Lighthouse CI + axe-core CI gate (Phase 4 SHIPS axe assertions; CI gate hardening is Phase 7) — Phase 7
- Filter-preference memory in `mnp_three_*` storage — deferred (URL is canonical state per FILT-02; no parallel store)
- Section-zero blockquote treatment for PBS landing — Phase 6 (PBS-01)
- Empty-state UI for zero-result filter — N/A (every category in CATEGORIES has ≥1 video by construction; malformed slugs 404)

</domain>

<decisions>
## Implementation Decisions

### FilterPillBar look + placement
- **D-01:** **Placement: sticky band BELOW TopNav, ABOVE reel.** TopNav row 1 (wordmark + About/Press/Contact + hamburger), pill bar row 2 (8 category pills + "All"), both `position: sticky` at the top of the viewport. Producers always see category context as they scroll. Reel section height becomes `calc(100svh - $chromeHeight)` instead of full `100svh` — chrome eats cinema, but wayfinding is always reachable. The combined chrome height is the load-bearing measurement for the chrome-fade behavior (D-08) — Phase 3's `h-svh` literal in `<ReelStage>` may need to become a derived value or a CSS variable. Planner's call on exactly where the `svh - $chrome` math lives (root layout CSS var, ReelStage prop, or a derived class).
- **D-02:** **Visual treatment: rounded pills with OKLCH category accent on active state.** Base: `rounded-full px-3 py-1 text-xs uppercase tracking-wider border border-white/15`. Inactive: `text-neutral-300 hover:bg-white/5`. Active: backgrounded with the category's `--color-cat-*` accent at low alpha + accent-colored text + accent ring. Reuses the 8 `--color-cat-*` variables already in `@theme` from Phase 1 D-12. Pill bar inherits Phase 1 D-05/D-06/D-07 double-ring focus token automatically (global `:focus-visible` rule).
- **D-03:** **"All" pill is leftmost, neutral-styled, active on `/work` (no category accent).** Producers map left-to-right; "All" as the home base of filtering is the conventional pattern. On any `/work/[category]` the All pill goes inactive. Active state for "All" uses white-on-dark fill (neutral), NOT an OKLCH accent — visual cue that "All" is the unfiltered home state, not a category.
- **D-04:** **Narrow widths (`<sm`): horizontal scroll-x with snap.** Pill row stays a single horizontal strip; overflow scrolls with `snap-x snap-proximity` so each pill snaps into view. Active pill auto-scrolls into the visible region on route change (use `element.scrollIntoView({ inline: 'center', behavior: 'smooth' })` — wrapped in `motion-safe:`). Producers flick through all 9 pills with one thumb gesture; cinematic horizontal motion echoes the vertical reel.

### TopNav + mobile menu behavior
- **D-05:** **Fade rule: chrome fades on active scroll; surfaces on scroll-stop + hover-near-top + focus + tap.** Default state: solid (`bg-neutral-950/95 backdrop-blur border-b border-white/10`, mirroring `_four/src/lib/components/TopNav.svelte:97`). During active scroll (`scroll` event firing) → `opacity-0 pointer-events-none` (NEVER `display:none` or `visibility:hidden` — PROJECT.md a11y constraint, hides chrome from SR). Surface triggers (any one re-shows chrome): scroll velocity drops to ~0 for 600ms (debounced timer reset on each `scroll` event); pointer enters the top ~80px hover zone; any element inside the chrome receives focus (focus-within); tap/click anywhere in the viewport. Producer-friendly: chrome out of the way while consuming, available the moment they pause.
- **D-06:** **Fade scope: reel routes ONLY (`/work`, `/work/[cat]`, `/pbs-american-portrait`).** On `/`, `/watch/[id]`, `/press`, `/about`, `/contact` chrome stays solid (those have their own chrome rules in later phases — hero CTA, watch player postMessage-driven fade, content page editorial chrome). Implementation: derive from `page.route.id` (reactive inside `.svelte` files per SvelteKit 2.27+) — same pattern `_four/src/lib/components/TopNav.svelte:60` uses for its inverse rule (transparent over hero). One canonical rule: "if this is a scroll-snap reel surface, chrome fades."
- **D-07:** **Mobile menu: mirror `_four/src/lib/components/MobileMenu.svelte` close to verbatim.** Full-screen overlay `fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col`, vertical list of 8 categories (uppercase, tracked) + horizontal rule + About/Press/Contact. Close on link tap. Instant animation (no CSS transition) — sidesteps `prefers-reduced-motion` handling per `_four`'s CONTEXT note. Saves design time AND stays A/B-parity-aligned on the chrome layer.
- **D-08:** **Mobile menu open ⇒ pause reel iframes via the existing `reel:visibility` context broadcast.** Reuse Phase 3 D-12 plumbing: when `mobileOpen === true`, set `documentHidden = true` in the visibility context (or sibling context with the same shape so PreviewLoop's existing consumer doesn't need to change). All 3 within-window PreviewLoops dispatch `postMessage 'pause'` within 300ms. Menu close re-broadcasts `documentHidden = false` and loops resume. Reuses the 5-layer leak defense plumbing; battery + thermal protection inherited. Implementation detail (planner's call): whether this lives in TopNav, layout, or a new `$lib/state/menu.svelte.ts` module-scope rune.

### Keyboard + focus contract (NAV-02 / NAV-03)
- **D-09:** **Arrow key + PageUp/PageDown + Space + Home/End mapping.** Inside the reel container: ArrowDown OR PageDown OR Space → scroll to next section (`scrollIntoView({ block: 'start', behavior: motion-safe ? 'smooth' : 'auto' })`). ArrowUp OR PageUp OR Shift+Space → previous. Home → section 1. End → last section. Native browser scroll behavior is preserved when focus is NOT inside the reel container (so a producer reading a Phase 6 long-form bio still gets native arrow-scroll). j/k vim aliases NOT shipped in v1 (Claude's discretion to revisit). Handler attaches via `onkeydown` on the reel container (NOT global `window` — global handler steals keys from form inputs in future phases).
- **D-10:** **Roving tabindex: only the current section's interactive elements are tabbable.** Off-screen sections set `tabindex="-1"` on the `▷ PLAY WITH SOUND` button (REEL-05) + the iframe + any future interactive child. Only the section where `activeIdx === index` (Phase 3 `<ReelStage>`'s existing `$state`) is tabbable. Implementation: derive `tabindex` per-section from the existing `reel:stage` context `activeIdx` getter; ReelSection consumes via `$derived(activeIdx === index ? 0 : -1)`. Tab from anywhere in the reel → lands on current section's CTA, then escapes to the next focusable element (TopNav / pill bar). Avoids the Pitfall 18 nightmare ("56 Tab presses to reach Press link"). No focus traps.
- **D-11:** **Skip-to-content link target: `<main id="main" tabindex="-1">` wrapping the FilterPillBar + reel.** Skip-link `href="#main"`, visible only on focus (`sr-only focus:not-sr-only` Tailwind pattern). First Tab after the skip-jump lands on the FilterPillBar (so SR users can choose a category before entering the reel) then into the current section's CTA via roving tabindex (D-10). Conventional WCAG 2.4.1 pattern; NAV-03's single SR landmark structure (`<main>` + ONE `<nav aria-label="Filmography filters">` + 56 `<article aria-label="Video N of M: [title]">`) is the rotor experience.
- **D-12:** **Escape closes mobile menu if open; otherwise no-op in reel.** Modal-pattern Escape only dismisses the overlay. Inside the reel, Escape is a no-op — preserves native browser shortcuts and avoids surprising users who expect Esc to do nothing on a static-feel page. Producers can use Home key (D-09) to reach section 1.

### Filter-switch scroll posture (FILT-02 flow)
- **D-13:** **Filter tap = full SvelteKit navigation to `/work/[new-category]`, default scroll-to-top.** The new filtered reel begins fresh at section 1 of that category. Simplest mental model: "changing filter is a context switch." No cross-category state persistence. The Pitfall 12 `#video=<id>` hash from Phase 3's `<ReelStage>` is NOT preserved across category boundaries — it would either resolve to a video not in the new filter (bad) or require a cross-category membership check (complex; videos belong to one category by design). The hash continues to work WITHIN a category for the back-nav scroll-restoration that Phase 5 WATCH-05 consumes.
- **D-14:** **No visual transition between filter routes — instant.** Tapping a pill triggers a normal SvelteKit navigation; the next route's prerendered HTML renders, prerendered poster is the first paint. No fade, no spinner, no skeleton. Cinematic restraint; matches `_four`'s posture. The brief poster→iframe-mount on the new section 1 is handled gracefully by Phase 3's unified codepath (REEL-04).
- **D-15:** **Prefetch on hover/focus: `data-sveltekit-preload-data="hover"` on every pill.** Matches `_four/src/lib/components/TopNav.svelte:139` pattern. On hover (desktop) or focus (keyboard) SvelteKit prefetches the route's load function + module. Zero cost (8 small prerendered HTML files); makes actual click feel instant. Apply to TopNav category links AND FilterPillBar pills AND MobileMenu links.
- **D-16:** **No empty-state UI — every category has ≥1 video by construction.** `videos.json` is byte-identical to `_four` (DATA-01); `getByCategory()` returns non-empty for all 8 categories (verified at build by `getCategoriesWithCounts()`); `slugToCategory()` returns `undefined` on unknown slug → `error(404)` per the `_four` D-30 pattern in `+page.ts`. The only path to "empty" is a malformed URL, which 404s. NO `<EmptyState>` component shipped — dead code.

### Claude's Discretion (open during plan-phase)
- Exact chrome-height variable mechanism — CSS custom property `--chrome-height` set on `:root`, hard-coded `h-[calc(100svh-7rem)]` literal on the ReelStage container, or a derived value via Svelte reactive context. (D-01 sets the constraint; planner picks the mechanism.)
- Exact scroll-stop debounce duration (D-05 specifies 600ms — planner may tune in plan-phase or during real-device QA).
- Whether the mobile-menu visibility broadcast lives in TopNav, the layout, or a new `$lib/state/menu.svelte.ts` rune (D-08).
- Exact pill-bar gap / padding tokens (`gap-2` vs `gap-3`, `py-2` vs `py-3` for the row container).
- Whether the FilterPillBar uses an `<ul>` with `<li><a>` pattern (mirrors `_four/TopNav.svelte:130`) or a flat `<a>` list inside `<nav aria-label="Filmography filters">` — both pass WCAG; planner's call.
- Whether the active pill auto-scrolls into view via JS on route change (D-04 recommends it via `scrollIntoView`) or relies purely on initial CSS `snap` alignment.
- ARIA semantics: `aria-current="page"` on the active pill (preferred for current-route signaling per WCAG ARIA 1.2); pill bar wraps in `<nav aria-label="Filmography filters">` per NAV-03 landmark structure.
- Whether the `aria-current="location"` semantic is also applied to TopNav category links (parallel surface to FilterPillBar).
- Mobile-menu close-on-link-tap timing — instant (D-07 default) vs 100ms delay so producer sees the close animation before nav fires.
- Whether section-N markup in `<ReelSection>` needs a focusable container with `tabindex` toggle (D-10 says iframes + CTA toggle; planner verifies markup contract).
- Exact ESLint per-file override pattern for `svelte/no-navigation-without-resolve` on the 3 new nav components (mirror `_four/TopNav.svelte:30`).
- The `<nav aria-label="Filmography filters">` text exactly — could be "Category filters" or "Filter by category" — small wording call.
- Whether the TopNav fade duration uses `transition-opacity duration-300` (Tailwind default) or a custom `@theme` variable (e.g., `--duration-chrome-fade`).
- Smoke-test scope: which Playwright assertions cover which NAV-0X requirement (planner maps).

### Folded Todos
None — `gsd-tools todo match-phase 4` returned 0 matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 4 requirements + success criteria
- `.planning/ROADMAP.md` §Phase 4: Wayfinding — goal, depends-on Phase 3, 5 success criteria, FILT-01..04 + NAV-01..03 mapping
- `.planning/REQUIREMENTS.md` §Wayfinding — FILT-01 (8 pills + All reset), FILT-02 (URL canonical state, no parallel store), FILT-03 (reload reproduces filter), FILT-04 (`entries()` prerender 8 slugs), NAV-01 (cinematic chrome-fade TopNav + mobile hamburger + PBS active-state on both routes), NAV-02 (Arrow/PageUp/Down + Tab exit + Escape + visible focus ring), NAV-03 (skip-to-content + `<article>` landmarks + ONE `<nav aria-label>` — NOT 56-region explosion)

### Project-wide context (locked constraints)
- `.planning/PROJECT.md` §Constraints — modern evergreen browsers iOS Safari 16+ / Chrome / Firefox current; scroll-snap + IntersectionObserver as load-bearing APIs
- `.planning/PROJECT.md` §Key Decisions — "Persistent filter pill bar above reel (8 categories + All); URL state via `/work/[category]` mirrors `_four` exactly"
- `.planning/PROJECT.md` §Constraints "Bandwidth ethics" — never autoplay 56 iframes on cellular (Phase 3 D-05 codepath; FilterPillBar narrowing reduces section count, may reduce pressure but doesn't change the gate)
- `.planning/STATE.md` §Blockers — none active for Phase 4; Phase 3's REEL-04 blocker resolved by D-05, EU GDPR resolved by D-06 (both Phase 3 CONTEXT)

### Phase 3 carry-forward (load-bearing context)
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §domain — Phase 3 ships `<article aria-label="Video N of M: [title]">` markup; NAV-03 "formalizes" the structure but markup already exists. Phase 4 builds keyboard handlers + skip-link + nav landmark ON TOP of Phase 3's landmark structure.
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §decisions D-10 — IntersectionObserver threshold 0.5 → `activeIdx` is the load-bearing signal D-10 (this phase) consumes for roving tabindex
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §decisions D-11 — `rootMargin: '100% 0%'` ±1 windowing — Phase 4 keyboard handlers must trust that the next section's iframe is already mounted by the time scroll arrives (D-09 mapping)
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §decisions D-12 — Page Visibility / `reel:visibility` context plumbing — D-08 here reuses this for mobile-menu pause
- `.planning/phases/03-reel-system-core-load-bearing-risk/03-CONTEXT.md` §decisions "URL hash" Claude's Discretion — Phase 3 wires `/work#video={id}` hash on snap settle; D-13 here governs how that hash interacts with filter switching (NOT preserved across categories)
- `src/lib/components/ReelStage.svelte` (current source) — `setContext('reel:stage', { mountedIds, activeIdx, videoCount })` and `setContext('reel:visibility', { documentHidden })` already exposed; D-10 + D-08 here consume these

### Phase 1 carry-forward
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-05/D-06/D-07/D-08 — double-ring focus token (cream/warm-white outer + dark inner); pill bar and skip-link both consume the global `:focus-visible` rule automatically
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-12 — 8 OKLCH category accents in `@theme` (`--color-cat-pbs`, `--color-cat-promos`, etc.); D-02 here consumes them on active pill state
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-14..D-17 — `mnp_three_*` storage namespace + grep gate; D-13 here keeps URL as canonical state — NO storage caller added by Phase 4

### Phase 2 carry-forward
- `.planning/phases/02-data-layer/02-CONTEXT.md` §decisions D-24 — 11-name public surface (`CATEGORIES`, `categoryToSlug`, `slugToCategory`, `getByCategory`, `getCategoriesInDisplayOrder`); Phase 4 consumes ALL of these unchanged

### Sibling-project reference (cinematic restyle of editorial pattern)
- `../michelle_ngo_four/src/lib/components/TopNav.svelte` — 169-line reference impl: `endsWith` suffix-match active-state (lines 100-121 — copy verbatim for D-06 with the inverse fade rule), `data-sveltekit-preload-data="hover"` (line 139 — copy for D-15), `eslint-disable svelte/no-navigation-without-resolve` (line 30 — copy), `${base}/work/${slug}` href construction (line 134 — copy). DIFFERENT from `_three`: `_four` fades transparent over the hero on `/`; `_three` fades during reel scroll on `/work*` (inverse rule per D-05 + D-06).
- `../michelle_ngo_four/src/lib/components/MobileMenu.svelte` — 69-line reference impl: `fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col` overlay, vertical `<ul>` of categories + horizontal rule + About/Press/Contact, close on link tap. Mirror close to verbatim per D-07; restyle if needed for cinematic-immersive (typography, spacing) but DON'T change the overlay structure.
- `../michelle_ngo_four/src/routes/work/[category]/+page.ts` — D-30 `entries()` + `slugToCategory` + `error(404)` + featured-first/published-desc sort pattern. **Async signature is load-bearing** (line 28 comment) so the upstream test's `.rejects.toMatchObject({ status: 404 })` resolves; do NOT make this sync. Copy near-verbatim for FILT-04.
- `../michelle_ngo_four/.planning/phases/03-grid-filter-watch/03-CONTEXT.md` — sibling's filter+nav decisions D-29..D-42 (active-state suffix-match, hover-prefetch, hamburger trigger, mobile menu shape). Useful prior art the planner can read instead of re-deriving.
- `../michelle_ngo_four/.planning/phases/04-reel-led-home/04-CONTEXT.md` §D-13/D-14 — sibling's transparent-over-hero observer pattern. INVERSE rule reference for `_three`'s D-05/D-06 fade scope — useful to read for the observer mechanics, then invert the trigger condition.
- **Explicitly do NOT copy** — `_four/src/lib/components/VideoCard.svelte` (grid pattern; `_three` has no grid); `_four/src/lib/components/HeroPoster.svelte` (sentinel observer for hero-transparency is `_four`'s pattern; `_three`'s scroll-event listener replaces it per D-05).

### Existing `_three` code Phase 4 consumes
- `src/lib/components/ReelStage.svelte` — Phase 3 component; Phase 4 may extend it with `onkeydown` handler for D-09 (or wire handlers in a parent — planner's call); `setContext('reel:stage', ...)` already exposes `activeIdx` for D-10 roving tabindex
- `src/lib/components/ReelSection.svelte` — Phase 3 component wrapping the `<article>` landmark; Phase 4 adds the `tabindex` derivation from `activeIdx` context per D-10
- `src/lib/data/index.ts` — Phase 2 11-name public surface; Phase 4 imports `getCategoriesInDisplayOrder`, `categoryToSlug`, `slugToCategory`, `getByCategory`, `CATEGORIES`
- `src/routes/work/+page.ts` + `+page.svelte` — Phase 3 unfiltered all-56 reel; remains as the canonical `/work`. Phase 4 ADDS `/work/[category]/+page.{ts,svelte}` as a sibling (NOT replacing the parent route).
- `src/routes/+layout.svelte` — Phase 1's minimal layout; Phase 4 inserts `<TopNav />` + skip-link + `<main id="main" tabindex="-1">` wrapper inside `{@render children()}` (planner's call on exact insertion vs slot wrapping)
- `src/app.css` `@theme` — `--font-display`, `--font-sans`, `--font-mono`, `--ring-focus`, `--ring-focus-inner`, `--ring-focus-offset`, 8 `--color-cat-*` accents, neutrals ramp — D-02 consumes accents on active-pill state; chrome-fade may add a `--duration-chrome-fade` token (Claude's Discretion)

### Provider / spec docs (for chrome-fade implementation)
- WCAG 2.4.1 (Bypass Blocks) — skip-to-content link target requirement; informs D-11
- WCAG 2.4.3 (Focus Order) — informs D-10 roving tabindex
- WCAG 2.4.7 (Focus Visible) — focus indicator visible against any background; covered by Phase 1 D-05 double-ring
- ARIA 1.2 `aria-current` — `"page"` for in-page nav, `"location"` for hierarchy; Claude's Discretion which applies to FilterPillBar vs TopNav
- SvelteKit `data-sveltekit-preload-data` — hover/tap/off trigger semantics (consumed by D-15)
- SvelteKit `$app/state.page` — reactive route id inside `.svelte` files (SvelteKit 2.27+); informs D-06 chrome-fade scope derivation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/components/ReelStage.svelte` — `setContext('reel:stage', { mountedIds, activeIdx, videoCount })` + `setContext('reel:visibility', { documentHidden })` ALREADY exposed; D-10 roving tabindex + D-08 mobile-menu pause consume these contexts unchanged
- `src/lib/data/index.ts` — Phase 2 `CATEGORIES`, `categoryToSlug`, `slugToCategory`, `getByCategory`, `getCategoriesInDisplayOrder` available unchanged for FilterPillBar + TopNav + `[category]/+page.ts`
- `src/app.css` `@theme` — 8 `--color-cat-*` OKLCH accents (Phase 1 D-12) for D-02 active-pill state; double-ring focus token (Phase 1 D-05..D-08) auto-applied via global `:focus-visible`; `--font-sans` (Inter) for pill text per Phase 1 D-11
- `src/routes/+layout.svelte` — Phase 1 layout with `onMount` initializing motion + network state; D-08 mobile-menu broadcast lives here OR in a new state module (planner's call)
- `src/routes/work/+page.ts` — Phase 3 unfiltered `/work` route; pattern reference for the new `/work/[category]/+page.ts`

### Sibling `_four` reusable patterns (cinematic restyle, not verbatim copy)
- `_four/src/lib/components/TopNav.svelte` — full reference impl; D-05/D-06/D-15 copy specific patterns (suffix-match, prefetch, eslint override); INVERT the fade rule (D-06 — fade on reel scroll, not transparent over hero)
- `_four/src/lib/components/MobileMenu.svelte` — full reference impl; D-07 mirrors close to verbatim (overlay shape, link list, close-on-tap, instant animation)
- `_four/src/routes/work/[category]/+page.ts` — full reference impl; near-verbatim copy for FILT-04 (entries() + slugToCategory + error(404) + async signature for test contract)
- `_four/src/lib/components/categoryAccent.ts` — already mirrored as CSS variables in `_three`'s `@theme` (Phase 1 D-12); FilterPillBar reads `--color-cat-*` directly, no JS import needed

### To be built in Phase 4 (no `_three` analogue yet)
- `src/lib/components/FilterPillBar.svelte` — sticky pill row, 9 pills (8 categories + All), OKLCH-accented active state, `<nav aria-label="Filmography filters">` landmark
- `src/lib/components/TopNav.svelte` — cinematic restyle of `_four`'s pattern with inverted fade rule (D-05/D-06)
- `src/lib/components/MobileMenu.svelte` — close mirror of `_four`'s pattern (D-07)
- `src/routes/work/[category]/+page.ts` — `entries()` + `load()` (near-verbatim from `_four`)
- `src/routes/work/[category]/+page.svelte` — renders `<ReelStage videos={data.videos} />` narrowed by category
- (Possibly) `src/lib/state/menu.svelte.ts` — module-scope rune for mobile-menu open state if D-08 broadcast lives outside TopNav (Claude's Discretion)
- (Possibly) `src/lib/scrollIdle.svelte.ts` — module-scope rune exposing `isScrolling` boolean for D-05 chrome-fade trigger (Claude's Discretion on inline vs extracted)
- Skip-link in `+layout.svelte` — `<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>` + `<main id="main" tabindex="-1">` wrapper around pill bar + `{@render children()}`
- Tests: `FilterPillBar.test.ts`, `TopNav.test.ts`, `MobileMenu.test.ts`, `work/[category]/page.test.ts`, plus Playwright e2e for keyboard navigation + chrome-fade + axe

### Established Patterns (carry-forward into Phase 4)
- **Module-scope state runes with SSR-guard:** `$lib/state/*.svelte.ts` files default to safe values during prerender (`typeof window === 'undefined'`); D-08 menu-state rune (if extracted) follows the `motion.svelte.ts` / `network.svelte.ts` shape from Phase 3
- **`.svelte.ts` extension for runes outside `.svelte` components** (Phase 1 STATE; Svelte 5.55+ rule); companion test files `.svelte.test.ts` wrapping rune use in `$effect.root(() => { ... })`
- **`data-sveltekit-preload-data="hover"` on every nav link** (Phase 3 carry-forward from sibling pattern; D-15 here)
- **`eslint-disable svelte/no-navigation-without-resolve` per-file override** for nav components using `${base}/...` literals (sibling `_four/TopNav.svelte:30` pattern; Phase 3 `ReelSection.svelte` carries the same override per Phase 3 STATE note "REEL-05 deep-link uses deprecated base+literal")
- **`endsWith` suffix-match for active-state** under `trailingSlash: 'always'` + `paths.relative: true` (sibling `_four/TopNav.svelte:100-121` — copy the entire helper function verbatim; PBS slug guard line 117-119 IS load-bearing for NAV-01 "PBS link active on both routes")
- **`aria-label` on landmark elements** (Phase 3 D-10 carry — `<article aria-label="Video N of M: [title]">`; NAV-03 adds `<nav aria-label="Filmography filters">` + `<main id="main" tabindex="-1">` to complete the landmark structure)
- **Vitest two-project split:** new component tests → `ui` project (jsdom); route load tests → `ui` project under `src/routes/**/*.test.ts` glob (page.test.ts pattern from `_four`)
- **`opacity-0 pointer-events-none` for hiding interactive chrome** (NOT `display:none` / `visibility:hidden` — preserves SR access per PROJECT.md a11y constraint)
- **CI grep gate posture (Phase 1 D-17):** if Phase 4 needs a "no module-scope `IntersectionObserver` in TopNav fade trigger" rule (D-05 uses a scroll event, not IO, so probably not needed) — model on D-17

### Integration Points
- **TopNav ↔ `$app/state.page`:** reactive `page.route.id` + `page.url.pathname` for fade scope (D-06) and active-state (D-02 / D-15); reads inside `$effect` to maintain reactivity (Pitfall 2 from sibling `_four/TopNav.svelte:50` carry-forward)
- **FilterPillBar ↔ `$lib/data`:** imports `getCategoriesInDisplayOrder`, `categoryToSlug` (unchanged from Phase 2); pure consumer, no data write
- **`/work/[category]/+page.ts` ↔ `$lib/data`:** imports `CATEGORIES`, `categoryToSlug`, `slugToCategory`, `getByCategory` for entries() + load() (mirrors `_four/work/[category]/+page.ts`)
- **`/work/[category]/+page.svelte` ↔ `<ReelStage>`:** identical to Phase 3 `/work/+page.svelte` shape — `<ReelStage videos={data.videos} />` where `data.videos` is narrowed by category; ReelStage is data-agnostic (D-01 in Phase 3 made the prop generic)
- **TopNav fade ↔ ReelStage scroll:** TopNav listens to `scroll` events on the reel container OR on `window` (planner's call — scroll-snap container's scroll fires on the container, not window); D-05 trigger
- **MobileMenu ↔ `reel:visibility` context (Phase 3 D-12):** MobileMenu (or TopNav around it) sets `documentHidden = true` while open; existing PreviewLoop consumer pauses iframes via postMessage; menu close re-broadcasts false. This is the load-bearing integration that lets Phase 4 reuse Phase 3 plumbing instead of building a parallel pause mechanism.
- **Roving tabindex ↔ `reel:stage` context (Phase 3):** `<ReelSection>` derives its interactive children's `tabindex` from `activeIdx === index ? 0 : -1` via the context getter; iframe + CTA both gated. D-10.
- **Skip-link ↔ `<main>` ↔ FilterPillBar tab order:** skip-link target is `<main>`; first Tab inside `<main>` lands on FilterPillBar's first pill ("All"); subsequent Tabs walk pills → reel current section CTA → TopNav About/Press/Contact (browser default tab order in DOM order, gated by roving tabindex)
- **Phase 5 carry-forward:** `<HeroAmbient>` on `/` will NOT have the chrome-fade behavior (D-06 scope is reel routes only); TopNav on `/` stays solid. Phase 5's `/watch/[id]` chrome behavior is postMessage-driven (different mechanism), NOT D-05's scroll-velocity trigger.
- **Phase 6 carry-forward:** `<Footer />` (CONT-03) mirrors TopNav structure (categories + secondary nav); the FilterPillBar pattern from Phase 4 informs but doesn't dictate the Footer's category list rendering.
- **Phase 7 carry-forward:** sitemap.xml endpoint (POL-01) will enumerate `/work/[category]` slugs from `CATEGORIES.map(c => `/work/${categoryToSlug(c)}`)` — same source-of-truth as `entries()` in D-30
- **Phase 7 carry-forward:** axe-core CI gate (POL-04) will run on ALL routes; Phase 4 ensures axe passes on `/work`, `/work/[cat]`, `/pbs-american-portrait` placeholder, layout shell — Phase 7 just adds the gate hardening

</code_context>

<specifics>
## Specific Ideas

- The **chrome-fade rule is the single most distinctive design decision of Phase 4**. `_four` fades chrome OVER the hero (the chrome IS the dark hero overlay); `_three` fades chrome DURING reel scroll (the chrome competes with cinema). Same `<TopNav>` shape, inverted trigger condition. Documenting this inversion in D-05/D-06 explicitly so a future contributor reading `_four`'s TopNav as the reference doesn't confuse the rule directions.
- **The mobile-menu pause path (D-08) is load-bearing for the A/B comparison** — without it, opening the mobile menu on `_three` would burn battery + bandwidth + thermal headroom while the producer is hunting for a category, which is exactly the "data ethics" posture PROJECT.md commits to. Reusing the Phase 3 `reel:visibility` context (vs building a parallel pause mechanism) keeps the 5-layer leak defense honest — every iframe pause goes through ONE plumbing path.
- **Roving tabindex (D-10) trusts Phase 3's `activeIdx` context getter to be reactive and correct.** If Phase 3's IntersectionObserver gets the wrong `activeIdx` (e.g., during fast scroll with snap-proximity), keyboard focus follows. The Phase 3 Playwright "scroll-snap pillar" passing on Chromium/WebKit/Firefox is the implicit gate for this trust. If `activeIdx` ever becomes unreliable (real-device QA finds a regression), D-10 fails too — the fix is in Phase 3 plumbing, not Phase 4 markup.
- **The skip-link target `<main>` wrapping pill bar + reel (D-11) decides the SR rotor experience.** SR users land on pill bar first (filter context before content) → then reel. This is the conventional pattern for any "filter + filtered content" page. The 8-pill landmark + 56-article landmark structure is what NAV-03 means by "not a 56-region landmark explosion" — `<article>` inside `<main>` doesn't count as a separate landmark in most SR rotors, but `<section>` would; Phase 3 already chose `<article>` (D-10 from Phase 3 CONTEXT) so Phase 4 inherits the correct semantic.
- **D-13 explicitly does NOT preserve `#video=<id>` across category boundaries** because videos belong to exactly one category by design (Phase 2 schema). The cross-category "find this video in another filter" check would always return false — implementing it would create dead code that signals possibility but never delivers. Phase 5 WATCH-05 back-nav scroll-restoration consumes the hash WITHIN a category, which IS the load-bearing use case.
- **Empty-state UI (D-16) is explicitly skipped** because the build-time guarantees (Zod schema + getCategoriesWithCounts() + slug 404) make it dead code. Shipping an `<EmptyState>` component "just in case" is the kind of speculative defensive code CLAUDE.md instructs to avoid ("Don't add error handling, fallbacks, or validation for scenarios that can't happen"). The 404 route handles every truly broken URL.

</specifics>

<deferred>
## Deferred Ideas

- **Filter-preference memory in `mnp_three_*` storage** — URL is canonical state (FILT-02; D-13); persisting last-viewed filter across sessions adds complexity without producer value. Reconsider if a producer flags "I had to re-find the PBS filter every visit."
- **j/k vim aliases for next/prev section** — D-09 only ships standard keys (Arrow/Page/Space/Home/End). Add if a user requests them.
- **Cross-category video presence check on filter switch** (D-13 alternative — preserve `#video=<id>` when the video exists in the new category) — videos belong to one category by schema; always returns false; dead code. Reopen if the schema changes.
- **Empty-state UI for zero-result filter** (D-16) — dead code; reconsider only if `videos.json` schema ever allows zero-video categories.
- **Section-zero PBS blockquote treatment** — Phase 6 (PBS-01). Phase 4 only ensures the TopNav PBS link active-state covers both `/pbs-american-portrait/` AND `/work/pbs-american-portrait/` per NAV-01.
- **Footer's category list rendering** — Phase 6 (CONT-03). Phase 4's FilterPillBar pattern is reference material for Phase 6, not a dependency.
- **Filter-bar density toggle (compact vs spacious pills)** — Phase 4 ships ONE density per breakpoint (per D-04). User-toggleable density is not in the requirement set; deferred.
- **TopNav scroll-direction-aware fade** (hide on scroll-down, show on scroll-up — the "iOS Safari" pattern) — D-05 uses scroll-velocity + scroll-stop + hover-zone + focus, NOT direction. Direction-aware is more complex and not requested. Reopen if real-device QA finds scroll-stop debounce feels wrong.
- **Sticky pill bar pin behavior (always-visible top vs sticky-on-scroll-up)** — D-01 locks "always sticky at top during fade-out window." Hide-completely-on-active-scroll happens via opacity, not via removing from layout.
- **Programmatic scroll-snap snap-on-key-press** — D-09 uses `scrollIntoView({ block: 'start' })`; native scroll-snap behavior takes over. If a producer's keypress lands the next section halfway during fast input, native snap pulls it home. Don't reimplement snap logic in JS.
- **Filter pill drag-to-reorder** — out of scope; pill order is `getCategoriesInDisplayOrder()` (count-desc, ties-alpha) — same as `_four`. A/B parity.
- **PBS filter pill linking to `/pbs-american-portrait/` instead of `/work/pbs-american-portrait/`** — Phase 4 ships PBS pill linking to `/work/pbs-american-portrait/` (the filter route). Phase 6 adds `/pbs-american-portrait/` (the dedicated landing); TopNav active-state covers both per NAV-01. The PILL routes to the filter; the TOPNAV link routes to the dedicated landing. Documented inconsistency by design — pill bar is filter context, TopNav is destination context.

</deferred>

---

*Phase: 04-wayfinding*
*Context gathered: 2026-05-26*
