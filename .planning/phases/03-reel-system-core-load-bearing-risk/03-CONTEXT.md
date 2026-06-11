# Phase 3: Reel System Core (LOAD-BEARING RISK) - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the killer feature on real producer hardware: `<ReelStage />` + `<ReelSection />` + `<PreviewLoop />` + `<PosterImage />` with the 4-state iframe lifecycle (REEL-06), 5-layer leak defense (REEL-06), unified poster-fallback codepath across 5 triggers (REEL-04), viewport-windowed ±1 mounting (REEL-03), Page Visibility pause (REEL-07), and full POL-04 real-device matrix validation (iOS Safari 16 / 17.0 / 17.1 / 17.2+, Chrome Android, Firefox desktop, Safari macOS) gating Phase 3 close.

14 of 20 documented pitfalls cluster here; this phase MUST NOT be subdivided so its risk surface stays atomic. Phase 4 (Wayfinding), Phase 5 (Hero & Watch), and Phase 6 (Content pages) all depend on the iframe-lifecycle pattern proven sound in Phase 3.

In scope:
- `<ReelStage>` scroll-snap container (`100svh` sections, `scroll-snap-type: y proximity`, `overscroll-behavior-y: contain`, `touch-action: pan-y`)
- ONE `IntersectionObserver` per `<ReelStage>` mount; observes N children; `disconnect()` in `$effect` cleanup
- `<ReelSection>` as `<article aria-label="Video N of M: [title]">` landmark
- `<PreviewLoop>` with the 4-state machine + iframe URL builder (Vimeo `?background=1&dnt=1&quality=540p` family; YouTube on `youtube-nocookie.com` with `vq=medium`)
- `<PosterImage>` consuming the `posters.json` sidecar; renders for all 5 fallback triggers
- Module-scope state runes in `$lib/state/network.svelte.ts` + `$lib/state/motion.svelte.ts`
- Poster pipeline extension to `scripts/check-embeds.ts` + `static/posters/` committed artifacts + `src/lib/data/posters.json` sidecar
- Playwright 4-pillar suite (scroll-snap, windowed-mount, leak defense, axe a11y) on WebKit + Chromium + Firefox
- BrowserStack real-device matrix run for iOS 16 / 17.0 / 17.1 / 17.2+
- Manual thermal validation on physical iPhone (5-min reel scroll + battery readings)

Out of scope (other phases):
- `<FilterPillBar />` + `/work/[category]` routes + cinematic chrome-fade `<TopNav />` + keyboard arrow-key nav — Phase 4 (FILT-01..04, NAV-01..03)
- `<HeroAmbient>` always-mounted producer reel on `/` + `<WatchPlayer>` letterboxed embed + `<ContinueReelRail>` + back-nav `history.state` scroll restoration — Phase 5 (HERO-01..03, WATCH-01..05)
- PBS / Press / About / Contact pages — Phase 6
- Per-page SEO + Lighthouse CI gate + production cutover — Phase 7
- Data-saver localStorage toggle UI — deferred (no caller yet; module-scope `network.svelte.ts` only exposes `effectiveType` + `saveData` for v1)

</domain>

<decisions>
## Implementation Decisions

### Poster pipeline
- **D-01:** Build-time fetch + self-host posters via `@sveltejs/enhanced-img` (already installed, Phase 1). At build time, fetch each video's poster from its provider — Vimeo oEmbed (`thumbnail_url` field on `https://vimeo.com/api/oembed.json?url=...`) and YouTube (`https://i.ytimg.com/vi/{id}/maxresdefault.jpg` with `hqdefault.jpg` fallback per Pitfall 16). Process into WebP/AVIF/JPEG with content-hashed filenames written to `static/posters/`. Survives Vimeo `vumbnail.com` link-rot risk (Pitfall 16) and avoids the per-request CDN latency cost of runtime fetches.
- **D-02:** Paths plumb via a build-emitted sidecar JSON at `src/lib/data/posters.json` mapping `"{source}-{id}"` → hashed asset path (e.g., `/posters/vimeo-264677021-abc123.webp`). `videos.json` stays byte-identical to `_four` (DATA-01 preserved; D-04 sidecar pattern from Phase 2 is the model). A new `$lib/data` helper `getPosterFor(video)` reads the sidecar — added to a new file (`src/lib/data/posters.ts` — Claude's discretion on exact name), NOT by editing the mirrored `videos.ts`/`index.ts` (Phase 2 D-22 "no premature loader helpers in the mirrored loader" + Phase 2 D-24 "the original 11 exports stay stable forever").
- **D-03:** Build aborts (`pnpm build` exits non-zero with a clear error naming the failing video) if any poster file referenced in `posters.json` is missing OR if `posters.json` itself is stale relative to `videos.json`. Same posture as Phase 2 `validateVideosPlugin` (DATA-02). Mechanism: a small Vite plugin step that reads `videos.json`, reads `posters.json`, checks every `(source, id)` has both a sidecar entry AND a file under `static/posters/`. Fails fast at `buildStart`.
- **D-04:** Poster fetching is **NOT** a per-build Vite plugin — it's an extension to `scripts/check-embeds.ts` (Phase 2). The same script that hits Vimeo/YouTube oEmbed now ALSO saves the `thumbnail_url` asset and updates `posters.json`. Invoked via `pnpm check:embeds` and the nightly GH Action. **Posters become committed artifacts** under `static/posters/` (NOT `.gitignore`d). Refreshing a poster requires running `pnpm check:embeds` locally and committing the diff (poster + sidecar). Same posture as the `videos.json` sync (Phase 2 D-01, D-02 — manual `cp` + PR per change). Build does not fetch the network. **Implication:** if Michelle updates a Vimeo thumbnail and we don't refresh, the staging poster is stale until someone runs `pnpm check:embeds`. The nightly Action catches it.

### REEL-04 unified fallback codepath
Five triggers collapse into ONE `<PosterImage>` codepath (SUMMARY.md cross-cutting decision #1 — the single highest-leverage architectural decision in this phase).

- **D-05:** **Network/cellular branch — progressive enhancement; autoplay-by-default outside Chromium.** Where `navigator.connection?.effectiveType` returns `undefined` (Safari 2026, Firefox 2026), treat the user as fast-enough and autoplay. Chromium readers get Pitfall 4 bandwidth ethics protection: poster on `effectiveType ∈ {'slow-2g', '2g', '3g'}` OR `saveData === true` OR `downlink < 1.5 Mbps` (the throttled-hotel-wifi case). Safari/Firefox iOS users on cellular see the full reel; no data-saver UI in v1 (deferred). **STATE.md blocker #1 (REEL-04 Chromium-only ambiguity) — RESOLVED.**
- **D-06:** **EU GDPR posture — inherit `_four`'s no-CMP "interaction-as-consent" pattern.** Do not ship a cookie banner. Mitigations: `youtube-nocookie.com` host for all YouTube embeds (Pitfall 13, 17); `?dnt=1` on all Vimeo embeds (Pitfall 17); the unified 800ms-postMessage-timeout fallback (D-07) means EU users whose browsers block autoplay-with-storage land on the poster path without ever firing `yt-remote-device-id` writes. Document posture explicitly in Phase 7 Launch Runbook. **STATE.md blocker #2 (EU GDPR posture) — RESOLVED.**
- **D-07:** **LPM / autoplay-rejection / embed-disabled detection — postMessage handshake with 800ms timeout.** Mount iframe with autoplay URL params. Listen for the provider's "play" / "ready" postMessage event (origin-filtered to `player.vimeo.com` / `www.youtube-nocookie.com` per the 5-layer leak defense layer 5). If no event within 800ms (per Pitfall 3), unmount the iframe and swap to `<PosterImage>` with a visible `▷ TAP TO PLAY` CTA. Catches: iOS Low Power Mode (Pitfall 3), browser-blocked autoplay, embed-disabled-by-owner (Pitfall 6 runtime case), EU autoplay restrictions (D-06 belt). No `@vimeo/player` SDK — research SUMMARY explicitly locks "raw iframe + URL params + raw postMessage" (saves ~30KB; Svelte 5 `$effect` cleanup ordering bug sveltejs/svelte#12731 dodged by avoiding `bind:this` + adapter pattern).
- **D-08:** **Trigger-detection state lives in module-scope runes** at `src/lib/state/network.svelte.ts` (exports `effectiveType`, `saveData`, `downlink`, a computed `isCellularLike` boolean) and `src/lib/state/motion.svelte.ts` (exports `prefersReducedMotion`). App-wide singletons; computed once on browser side via `navigator.connection` + `matchMedia('(prefers-reduced-motion: reduce)')`; consumed by `<ReelStage>` in Phase 3, future `<HeroAmbient>` + `<WatchPlayer>` in Phase 5. **SSR-safe**: during prerender / `__isBrowser()===false` (Phase 1 storage.ts pattern), default to "fast network / no motion preference" so the prerendered HTML is the cinematic-autoplay variant; runtime hydration flips the rune values; Svelte's reactivity re-renders the section if the user's actual posture differs. (Same SSR-guard idiom as `$lib/storage.ts`.)

### Mount-vs-play strategy (REEL-03, REEL-07)
- **D-09:** **All 3 sections within the ±1 window play simultaneously** (NOT current-only-plays). Cinematic "reel is alive" feel — N-1, N, N+1 all autoplay-loop. Accepts the Pitfall 5 thermal/battery trade-off (5-8% battery in 5 min, fan-on within ~60s on iPhone 13-class) as a design bet. Phase 3 thermal QA (D-16) is the validation gate; D-16 escalation path is "drop quality cap to 360p for ±1 sections OR fall back to current-only-plays" if the iPhone test fails > 8% / 5min.
- **D-10:** **IntersectionObserver threshold 0.5** (50%+ visible) defines the "current" section for any UI signal (active hash write per D-21, landmark focus, future telemetry). All 3 within-window sections play regardless of threshold — threshold is for "which section is centered NOW," not "which section plays." With `scroll-snap-type: y proximity` + `100svh`, sections are either ~0% or ~100% visible most of the time, so 0.5 is a clean discriminator.
- **D-11:** **Eager mount: IntersectionObserver `rootMargin: '100% 0%'`** (1 viewport above + 1 below the visible area). Sections enter the ±1 window off-screen, swap `<PosterImage>` → `<PreviewLoop>` before the user sees them. No mid-view blink. ONE observer per `<ReelStage>` (not per `<ReelSection>` — would be 56 observers, breaks Pitfall 5 thermal posture). Observer is instantiated in `<ReelStage>`'s component scope (NOT module-scope — module-scope leaks state across `/work`, `/work/[cat]`, `/pbs-american-portrait` routes; SUMMARY architecture anti-pattern #3).
- **D-12:** **Page Visibility API: pause all 3 playing iframes on `document.hidden`; keep them mounted.** On `visibilitychange` → visible, resume via postMessage `'play'` to all 3 within-window iframes. Cheapest resume (no remount cycle, no poster→iframe blink). REEL-07 satisfied. Pause must dispatch within 300ms of `visibilitychange` (REEL-07 SC).

### Phase 3 done-criteria
- **D-13:** **Phase 3 closes on full POL-04 real-device matrix validation** during Phase 3 (NOT deferring to Phase 7). Matrix: iOS Safari 16, 17.0, 17.1, 17.2+, Chrome Android current, Firefox desktop current, Safari macOS current. Given the all-3-play decision (D-09) escalates thermal/network risk, the load-bearing-risk phase validates the full matrix during Phase 3 — discovery-of-untenable-design at Phase 7 would force Phase 3 rework, much costlier.
- **D-14:** **Device access for the matrix: BrowserStack subscription** (real-device cloud, ~$30-50/month metered). Used for iOS Safari 16, 17.0, 17.1 — the hard-to-test versions where the Pitfall 1 `playsinline` scroll-trap regression lives. Plus the user's physical iPhone for current iOS Safari + LPM toggle + cellular emulation. **BrowserStack subscription is a Phase 3 dependency** — must be active before Plan 03-03 verification step. Document in Phase 3 plan as a prerequisite checkbox.
- **D-15:** **Playwright suite covers 4 pillars** on WebKit + Chromium + Firefox:
  1. **Scroll-snap behavior** — fast-flick from section 1 → section 30 lands cleanly (proximity not trapped); test exercises Pitfalls 1, 7.
  2. **Windowed-mount invariant** — `document.querySelectorAll('iframe').length` never exceeds 3 during a full reel scroll; covers REEL-03.
  3. **Leak defense** — after scrolling all 56 sections then back, no detached iframe nodes, no leaked postMessage listeners, no leaked IntersectionObservers; covers REEL-06.
  4. **a11y** — `@axe-core/playwright` scan on `/work` passes WCAG AA; covers NAV-03 landmark structure even though NAV-03 is technically a Phase 4 requirement (the `<article aria-label>` markup ships in Phase 3 as the section wrapper).
- **D-16:** **Thermal validation is manual: 5-minute reel scroll on physical iPhone with battery monitor open.** Capture screenshots/photos of battery % before + after; document drop in `03-VERIFICATION.md`. **Escalation triggers** (any one):
  - Battery > 8% drop in 5 min → drop quality cap on ±1 sections to 360p (keep 540p for current). If still > 8%, fall back to current-only-plays (reverses D-09).
  - Fan engages (audible) within 60s → same escalation.
  - Scroll-snap visibly stutters after sustained browsing → same.
  Done-criteria: the chosen mount-play posture survives the 5-min test within budget. Phase 3 plan budget includes a "thermal QA + remediation" task in Plan 03-03.
- **D-17:** **Phase 3 decomposes into 3 plans** in this order:
  - **03-01-PLAN.md** — Reel foundations. `<ReelStage>` + `<ReelSection>` structure; scroll-snap CSS (`100svh`, `y proximity`, `overscroll-behavior-y: contain`, `touch-action: pan-y`); ONE IntersectionObserver per stage with `rootMargin: '100% 0%'` + threshold 0.5; module-scope state runes (`network.svelte.ts` + `motion.svelte.ts`); `<article aria-label="Video N of M: [title]">` landmark structure; `/work` route renders `<ReelStage videos={data.videos} />`. Tests: scroll-snap behavior + IO mount/unmount + state-rune SSR guards. Verification gate: scroll-snap passes Playwright.
  - **03-02-PLAN.md** — Iframe lifecycle. `<PreviewLoop>` with 4-state machine (`unmounted → mounted-loading → mounted-playing → unmounting`) + 5-layer leak defense (Svelte teardown + adapter `dispose()` + observer `disconnect()` + named postMessage listener refs + `MessageEvent.origin` allowlist for `player.vimeo.com` / `www.youtube-nocookie.com`); iframe URL builder at `$lib/iframe/url.ts` (exact path Claude's discretion) wrapping Vimeo (`?autoplay=1&muted=1&loop=1&background=1&dnt=1&quality=540p&playsinline=1`) and YouTube (`youtube-nocookie.com/embed/{id}?autoplay=1&mute=1&loop=1&playsinline=1&modestbranding=1&playlist={id}&vq=medium&iv_load_policy=3`); the postMessage 800ms timeout (D-07); Page Visibility pause (D-12). Tests: leak-defense memory test + URL builder snapshot + postMessage-timeout simulation. Verification gate: leak defense Playwright pillar passes.
  - **03-03-PLAN.md** — Fallback + QA. `<PosterImage>` consuming `posters.json` sidecar; the unified 5-trigger fallback codepath (reduced-motion, cellular-on-Chromium, LPM/autoplay-rejection-via-D-07, embed-disabled-via-D-07, EU baseline-via-D-06); extension of `scripts/check-embeds.ts` to fetch + save posters + write `posters.json`; build-time poster-sanity Vite plugin (D-03); axe-core a11y gate; Playwright 4-pillar suite green on WebKit + Chromium + Firefox; BrowserStack matrix run (iOS 16, 17.0, 17.1, 17.2+, Chrome Android); manual thermal QA on physical iPhone (D-16). Verification gate: all four Playwright pillars green + BrowserStack matrix evidence committed + thermal screenshot committed.

### Claude's Discretion (open during plan-phase / research)
- Exact iframe URL builder file location (`$lib/iframe/url.ts` vs `$lib/embed/url.ts` vs split into `vimeoUrl.ts` / `youtubeUrl.ts`).
- Sidecar JSON file shape: pure JSON (`posters.json`) vs typed `.ts` export. JSON is simpler; `.ts` gets static type-check. Slight preference for JSON to mirror Phase 2 D-04 `.videos-source-sha` plain-text choice.
- `static/posters/` exact subpath (`static/posters/` vs `static/img/posters/` vs `static/poster/`).
- IntersectionObserver `rootMargin` exact value (`'100% 0%'` vs `'100% 0% 100% 0%'` — equivalent in shorthand; either is fine).
- Whether per-section `<iframe>` gets `tabindex="-1"` when in ±1 but not current (Pitfall 18 / Phase 4 NAV-02 territory; section markup may live in Phase 3 anyway — Claude's call during 03-02 plan).
- URL hash convention `/work#video={id}` debounce timing (~300ms after snap settle per Pitfall 12) — Phase 3 wires the section IDs; Phase 5 WATCH-05 wires the back-nav `history.state` restoration. Phase 3 SHOULD write the hash on snap settle so the browser back-button native restoration works in Phase 5.
- Inline `loading="lazy"` + `fetchpriority="low"` on `<PosterImage>` `<img>` beyond the first 2 sections.
- `<PosterImage>` component contract — does it render the title/category overlay + `▷ PLAY WITH SOUND` CTA itself, or are those siblings inside `<ReelSection>`? (Leaning: siblings, so the overlay is identical between poster and iframe modes.)
- BrowserStack CI integration vs manual session runs — manual is fine for v1; CI integration is overkill for a one-time-per-phase matrix.
- Per-section play start position — always 0:00 vs deep-link via Vimeo `?t=<sec>` / YouTube `?start=<sec>`. Default 0:00 for v1; defer per-video overrides.

### REEL-05 overlay treatment (Claude's Discretion or `/gsd:ui-phase 3`)
REEL-05 (title bottom-left + category tag top-right + `▷ PLAY WITH SOUND` CTA) lives in this phase but the visual specifics are punted. Two valid paths:
- **Claude's discretion in plan-phase** — typography uses `--font-display` (Source Serif 4) for title; CategoryTag adapts `_four/src/lib/components/CategoryTag.svelte` restyled for dark cinematic palette (reuse `categoryAccent.ts` from `_four`); PLAY-WITH-SOUND CTA is a pill button consuming Phase 1 D-05/D-06/D-07 focus tokens; two-stop gradient overlay per Pitfall 20 (`linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)`).
- **`/gsd:ui-phase 3`** — spawn the UI-SPEC workflow if planner finds the visual decisions hairy. Plan-phase can route to it.

### Folded Todos
None — `gsd-tools todo match-phase 3` returned 0 matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 3 requirements + success criteria
- `.planning/ROADMAP.md` §Phase 3: Reel System Core (LOAD-BEARING RISK) — goal, depends-on Phase 2, 6 success criteria, REEL-01..07 mapping
- `.planning/REQUIREMENTS.md` §Immersive Reel (Killer Feature) — REEL-01 (`100svh`, proximity), REEL-02 (`?autoplay=1&mute=1&loop=1&playsinline=1`), REEL-03 (±1 windowing + IO per stage), REEL-04 (5-trigger fallback), REEL-05 (title + category + PLAY WITH SOUND), REEL-06 (4-state + 5-layer leak defense), REEL-07 (Page Visibility pause)
- `.planning/REQUIREMENTS.md` §Polish & Cutover — POL-03 (`100svh`, zero CLS on poster→iframe swap), POL-04 (real-device QA matrix gating cutover — D-13 pulls this into Phase 3)
- `.planning/REQUIREMENTS.md` §Wayfinding — NAV-03 (article landmark + skip-to-content); Phase 3 ships the `<article aria-label>` wrapper that NAV-03 formalizes in Phase 4

### Project-wide context (locked constraints)
- `.planning/PROJECT.md` §Constraints — modern evergreen browsers iOS Safari 16+ / Chrome / Firefox current; scroll-snap + IntersectionObserver as load-bearing APIs; cinema-first LCP 2.5s budget; bandwidth ethics on cellular
- `.planning/PROJECT.md` §Key Decisions — scroll-snap fullscreen reel; silent muted preview loops via native iframes (no SDK); viewport-windowed iframe mounting current ± 1; cellular = poster + tap-to-play
- `.planning/STATE.md` §Blockers/Concerns — REEL-04 Chromium-only ambiguity (RESOLVED by D-05); EU GDPR posture (RESOLVED by D-06); A/B traffic-split (still open — Phase 7); REQUIREMENTS.md count drift (informational)

### Research synthesis (Phase 3 is the load-bearing-risk phase)
- `.planning/research/SUMMARY.md` §Executive Summary + §Critical Cross-Cutting Decisions — unified poster-fallback codepath is THE single highest-leverage decision; Phase 3 = load-bearing-risk phase; 5 A/B integrity traps
- `.planning/research/SUMMARY.md` §Key Findings — Recommended Stack — raw iframe + URL params (no `@vimeo/player`); `runed` IO; `100svh` not `vh`/`dvh`; `proximity` not `mandatory`; `playsinline` still required iOS Safari 16/17.0/17.1
- `.planning/research/SUMMARY.md` §Architecture Approach — 13-component hierarchy; state ownership (component-local for `mountedIds`/`activeIdx`, module-scope for network/motion, URL-only for filter); 4-state lifecycle + 5-layer leak defense diagram; anti-patterns (mount-all-56, module-scope IO, inline closures, per-section observers)
- `.planning/research/SUMMARY.md` §Research Flags — Phase 3 is HIGHEST priority for `/gsd:research-phase` BEFORE planning; iframe lifecycle needs concrete validation on iOS Safari 16/17.0/17.1 real devices; postMessage handshake timing
- `.planning/research/PITFALLS.md` — ALL 20 pitfalls (14 cluster in Phase 3); specifically Pitfalls 1 (`playsinline` scroll-freeze iOS 16/17.0/17.1), 2 (`100dvh` CLS — use `100svh`), 3 (LPM `play()` rejection), 4 (56-iframe data cost / 540p cap / Save-Data), 5 (thermal / pause-not-unmount / Page Visibility), 6 (oEmbed health-check), 7 (`proximity` not `mandatory`), 8 (`<article>` not `<section>`), 9 (`prefers-reduced-motion` → posters), 10 (focus indicator over dark video bg — Phase 1 D-05/D-06/D-07 already covers), 12 (URL hash for position), 13 (EU GDPR — D-06), 17 (Vimeo `?dnt=1` / YouTube `nocookie`), 18 (`tabindex` management), 20 (gradient overlay legibility)
- `.planning/research/ARCHITECTURE.md` — state ownership patterns; component-local `$state` vs module-scope rune vs `$lib/storage.ts`; informs D-08
- `.planning/research/STACK.md` — version matrix for `runed`, `@sveltejs/enhanced-img`, `@playwright/test`, `@axe-core/playwright` (all installed Phase 1); raw iframe pattern recommendation
- `.planning/research/FEATURES.md` — cinematic differentiators list + accessibility-equivalent pairings (12 reduced-motion / keyboard / SR / focus / skip-to-content / landmarks / contrast / touch targets / motion-safe / aria-current / save-data fallbacks)

### Phase carry-forward
- `.planning/phases/01-foundation/01-CONTEXT.md` §decisions D-05/D-06/D-07/D-08 — double-ring focus token (consumed by `▷ PLAY WITH SOUND` button); `.planning/phases/01-foundation/01-CONTEXT.md` §code_context Integration Points — `runed` IO already wired via `src/lib/intersectionVisibility.svelte.ts`
- `.planning/phases/02-data-layer/02-CONTEXT.md` §decisions D-13..D-20 — `scripts/check-embeds.ts` shape (D-18 standalone Node script + D-14 retry+classify + D-15 concurrency limit 6 + D-19 auto-Issue reporting + D-20 `.embed-check-report.json` gitignored) — D-04 here extends this script with poster-fetch
- `.planning/phases/02-data-layer/02-CONTEXT.md` §decisions D-22, D-24 — "no premature loader helpers in mirrored loader"; new file pattern for `_three`-specific helpers — D-02 here adds `posters.ts` as that new file

### Sibling-project reference (for restyle reuse only)
- `../michelle_ngo_four/src/lib/components/CategoryTag.svelte` — span/anchor variant + OKLCH accent helper; restyle for dark cinematic palette in REEL-05 overlay (per `_four` →  `_three` translation)
- `../michelle_ngo_four/src/lib/components/categoryAccent.ts` — 8 OKLCH category accents helper; already mirrored into `_three/src/app.css` `@theme` block (Phase 1 D-12); `_three` reads tokens from CSS variables — no JS dep needed
- **Explicitly do NOT copy** — `_four/src/lib/components/VideoCard.svelte` (grid pattern; `_three` has no grid); `_four/src/lib/components/HeroPoster.svelte` (single-poster pattern; `_three`'s HeroAmbient in Phase 5 is always-mounted iframe, different contract)

### Existing `_three` code Phase 3 consumes
- `src/lib/data/index.ts` — public 11-name surface from Phase 2; `videos`, `producerReelId`, `getById`, `getByCategory`, `getCategoriesInDisplayOrder`, `getCategoriesWithCounts`
- `src/lib/intersectionVisibility.svelte.ts` — Phase 1 wrapper around `runed`'s `useIntersectionObserver`; documents the `$effect.root` requirement and the 5.55+ rune-scoping rule (`.svelte.ts` extension). Phase 3's `<ReelStage>` IO is built on the same pattern (likely inline rather than via this wrapper; the wrapper was a Phase 1 SC #4 smoke-test that may not need to survive — Claude's call)
- `src/lib/storage.ts` — `mnp_three_*`-prefixed storage helper. No Phase 3 caller for v1 (data-saver toggle deferred); reserved for Phase 5 WATCH-05 back-nav `history.state` mirror
- `src/app.css` — `@theme` tokens: `--font-display` (Source Serif 4), `--font-mono`, `--font-sans` (Inter); `--ring-focus`/`--ring-focus-inner`/`--ring-focus-offset` (double-ring focus); 8 `--color-cat-*` accents; neutrals ramp; global `:focus-visible` rule — REEL-05 PLAY-WITH-SOUND button consumes these

### Provider docs (for the iframe URL builder + postMessage handshake)
- Vimeo player parameters — `https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters` (autoplay, muted, loop, background=1 implies muted+loop+autoplay+no-controls, dnt=1)
- Vimeo player JS messaging — `https://developer.vimeo.com/player/sdk/embed` (postMessage `play`/`pause`/`ready` events; origin `player.vimeo.com`)
- Vimeo oEmbed — `https://vimeo.com/api/oembed.json?url=...` (returns `thumbnail_url` for poster pipeline D-01)
- YouTube IFrame API — `https://developers.google.com/youtube/iframe_api_reference` (autoplay+playsinline+playlist={id}+modestbranding+vq=medium+iv_load_policy=3 cleaner UI; origin `www.youtube-nocookie.com`)
- WebKit bug 261185 (`svh`/`dvh` Safari) — informs `100svh` choice for scroll-snap

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/data/index.ts` — Phase 2 11-name public surface (`videos`, `producerReelId`, `getById`, `getByCategory`, `getCategoriesInDisplayOrder`, `getCategoriesWithCounts`); Phase 3 imports `videos` (and possibly `getByCategory` for `/work/[category]` later in Phase 4) directly
- `src/lib/intersectionVisibility.svelte.ts` — `runed` `useIntersectionObserver` wrapper from Phase 1 SC #4 smoke (Phase 3 may inline its own IO inside `<ReelStage>` instead — both patterns valid; the wrapper is single-target, the ReelStage IO is N-targets-one-observer)
- `src/lib/storage.ts` + `__isBrowser` — SSR-guard idiom for module-scope state runes in D-08 (`network.svelte.ts` + `motion.svelte.ts` use the same `typeof window === 'undefined'` defaults pattern)
- `src/app.css` `@theme` tokens — `--font-display` (REEL-05 title typography), `--ring-focus` + `--ring-focus-inner` + `--ring-focus-offset` (REEL-05 `▷ PLAY WITH SOUND` button focus), `--color-cat-*` (CategoryTag accents), `--color-neutral-950` (poster background fallback)
- `scripts/check-embeds.ts` (Phase 2) — gets the poster-fetch extension per D-04; same `p-limit`-or-hand-rolled concurrency queue (Phase 2 D-15) applies to thumbnail fetches
- `vite.config.ts` Vitest two-project split (`data` = node env, `ui` = jsdom env) — Phase 3 component tests land in `ui` project; data tests (poster sidecar shape, URL builder snapshots) land in `data` project

### To be built day-one in Phase 3 (no `_three` analogue yet)
- `src/lib/components/ReelStage.svelte` — scroll-snap container, IntersectionObserver host, mountedIds set, context provider
- `src/lib/components/ReelSection.svelte` — `<article aria-label="Video N of M: [title]">` landmark wrapper; renders `<PreviewLoop>` OR `<PosterImage>` based on context
- `src/lib/components/PreviewLoop.svelte` — iframe lifecycle 4-state machine + 5-layer leak defense; consumes iframe URL builder
- `src/lib/components/PosterImage.svelte` — static fallback consuming `posters.json` sidecar; `loading="lazy"` + `fetchpriority="low"` beyond first 2 sections
- `src/lib/iframe/url.ts` (exact name Claude's discretion) — iframe URL builder for Vimeo + YouTube
- `src/lib/iframe/vimeoAdapter.ts` + `src/lib/iframe/youtubeAdapter.ts` — postMessage adapters exposing `play()` / `pause()` / `dispose()` per the 5-layer leak defense layer 2
- `src/lib/state/network.svelte.ts` — module-scope rune for `effectiveType` / `saveData` / `downlink` / `isCellularLike`
- `src/lib/state/motion.svelte.ts` — module-scope rune for `prefersReducedMotion`
- `src/lib/data/posters.ts` (exact name Claude's discretion) — `getPosterFor(video)` consuming `src/lib/data/posters.json`
- `src/lib/data/posters.json` — build-emitted sidecar; `(source, id)` → hashed asset path
- `static/posters/*.{webp,avif,jpg}` — committed poster artifacts (NOT gitignored)
- `src/routes/work/+page.svelte` + `src/routes/work/+page.ts` — Phase 3 wires `/work` (Phase 4 adds `/work/[category]` filter routes)
- `tests/e2e/reel.spec.ts` or similar — Playwright 4-pillar suite

### Established Patterns (carry-forward into Phase 3)
- **Module-scope state runes with SSR-guard:** `$lib/state/*.svelte.ts` files set sensible defaults during prerender (`typeof window === 'undefined'`), hydrate via `$effect` on browser; matches `$lib/storage.ts` `__isBrowser()` idiom
- **`.svelte.ts` file extension** required for any TS using runes outside `.svelte` components (Phase 1 STATE note; Svelte 5.55+ rune-scoping rule); companion test files end `.svelte.test.ts` and wrap rune-using class instantiation in `$effect.root(() => { ... })`
- **CI grep gate posture (Phase 1 D-17):** mechanical drift guards live in `.github/workflows/deploy.yml`; if Phase 3 adds a "no module-scope `IntersectionObserver`" or "no `100vh` / `100dvh` in scroll-snap sections" rule, model on D-17
- **Verbatim error annotations:** GitHub Actions `::error::` annotations with literal fix commands (Phase 2 D-12 style) — applies to poster-sanity Vite plugin failures (D-03)
- **No raw `localStorage` outside `$lib/storage.ts`** (Phase 1 D-14/D-17) — Phase 3 has no `localStorage` callers in v1 (data-saver toggle deferred); when added in Phase 4/5, route through `storage`
- **adapter-static + GH Pages:** `paths.base` consumed everywhere; never concat strings manually; iframe URL builder uses absolute provider URLs (no `$app/paths` involvement)
- **Vitest two-project split:** Phase 3 components → `ui` project (jsdom); Phase 3 data/utility tests (URL builder snapshots, sidecar shape) → `data` project (node)

### Integration Points
- **`<ReelStage>` ↔ `$lib/state/network.svelte.ts` / `motion.svelte.ts`:** ReelStage subscribes to the runes via `$derived` for the autoplay-or-poster decision; rune values are read-only outside the state file
- **`<ReelStage>` ↔ `$lib/data` (`videos` + Phase 4 `getByCategory`):** Phase 3 ships `<ReelStage videos={data.videos}>`; Phase 4 narrows to `getByCategory(category)` per-route
- **`<ReelSection>` ↔ `<PreviewLoop>` / `<PosterImage>` via context:** ReelStage sets context (`mountedIds`, `activeIdx`, `shouldAutoplay`); ReelSection consumes; PreviewLoop and PosterImage are siblings within ReelSection composed by parent
- **`<PreviewLoop>` ↔ iframe URL builder ↔ Vimeo/YouTube providers:** URL builder is pure (no DOM); PreviewLoop consumes URL + manages lifecycle + listens postMessage; adapter layer (`vimeoAdapter.ts` / `youtubeAdapter.ts`) is the named-listener-refs layer of the 5-layer leak defense
- **`<PreviewLoop>` ↔ Page Visibility API:** ReelStage subscribes to `document.visibilitychange` once; broadcasts via context; ALL within-window PreviewLoop instances dispatch postMessage `pause` synchronously (D-12)
- **`scripts/check-embeds.ts` ↔ `static/posters/` + `src/lib/data/posters.json`:** poster-fetch extension writes both; build-time Vite plugin (D-03) verifies they exist + are in sync with `videos.json`
- **`<PosterImage>` ↔ `src/lib/data/posters.ts` ↔ `posters.json`:** PosterImage calls `getPosterFor(video)` which reads the sidecar; SSR-safe (sidecar is a static import)
- **Phase 4 carry-forward:** Phase 3's section IDs (with the `/work#video={id}` hash convention per Pitfall 12) — Phase 5 WATCH-05 wires the back-nav scroll restoration consuming Phase 3's hash writes
- **Phase 5 carry-forward:** `<HeroAmbient>` (always-mounted producer reel on `/`) reuses `<PreviewLoop>` + iframe URL builder; consumes the same module-scope state runes
- **Phase 7 carry-forward:** Phase 7's `deploy-production.yml` gates on `scripts/check-embeds.ts` (Phase 2 D-13 case 3) — Phase 3's poster-fetch extension travels with the script; production deploy verifies posters too

</code_context>

<specifics>
## Specific Ideas

- The **all-3-play decision (D-09)** is the most aggressive bet of Phase 3 — chosen for cinematic "reel is alive" feel over the Pitfall 5 thermal/battery recommendation of "current-only-plays." The validation gate (D-16, manual iPhone 5-min scroll) is the explicit guard rail; if it fails, D-16's escalation path is documented (360p ±1 quality cap → current-only-plays fallback). The user owns this bet and the validation; planner must surface the fail-path branches in 03-03 as conditional sub-tasks.
- The **poster pipeline as committed artifacts (D-04)** trades "build always touches network" for "manual `pnpm check:embeds` + commit posters." Matches Phase 2 D-01/D-02 manual-sync ethos for `videos.json` — same producer-mental-model: data + posters live in the repo, refresh is an explicit operation, drift gets caught by the nightly Action. Side effect: PRs that touch `videos.json` SHOULD also touch `posters.json` + `static/posters/*` — could be a future grep gate but defer until producer demonstrates the workflow.
- The **800ms postMessage timeout (D-07)** is the load-bearing detection mechanism for FOUR of the five fallback triggers (LPM, embed-disabled, browser-blocked autoplay, EU autoplay restrictions). Only `prefers-reduced-motion` and `effectiveType ∈ slow-2g/2g/3g` bypass it (those are pre-mount decisions; iframe never attaches). Cellular and reduced-motion are the "don't even try" paths; the other three are the "try, fail fast, fall back" paths. One codepath, three input layers (`network.svelte.ts`, `motion.svelte.ts`, 800ms timeout) — the SUMMARY's "design once, trigger from five sources" decision made concrete.
- The **full POL-04 matrix during Phase 3 (D-13, D-14)** front-loads risk because pivoting at Phase 7 would mean re-litigating Phase 3. BrowserStack subscription becomes a Phase 3 entry dependency; the plan-phase task list opens with "verify BrowserStack subscription active" as a prerequisite checkbox. iOS Safari 16 + 17.0 + 17.1 are the load-bearing versions (Pitfall 1 `playsinline` scroll-freeze + Pitfall 3 LPM rejection both target these); user's physical iPhone covers the current-iOS thermal + LPM toggle case.
- Phase 3 ships the `<article aria-label="Video N of M: [title]">` landmark structure even though NAV-03 formally maps to Phase 4. Reason: the `<article>` IS the section markup; deferring it would require Phase 4 to rewrite the section component vs add behavior. Phase 4 builds keyboard arrow-key handlers + skip-to-content link on TOP of Phase 3's landmark structure.

</specifics>

<deferred>
## Deferred Ideas

- **Data-saver toggle UI** (chrome button persisting via `mnp_three_data_saver` in `$lib/storage`) — `network.svelte.ts` exposes `saveData` from `navigator.connection.saveData` for v1 but no user-facing toggle ships. Add when a real producer flags the bandwidth issue OR when Phase 4 chrome work surfaces a natural slot.
- **REEL-05 visual specifics** — title typography rhythm, CategoryTag dark-cinematic restyle exact tokens, `▷ PLAY WITH SOUND` button shape (pill / underline / icon-only). Plan-phase can opt to spawn `/gsd:ui-phase 3` for a formal UI-SPEC.
- **URL hash debounce timing** (~300ms per Pitfall 12) — Phase 3 wires the section IDs + writes the hash; exact debounce timing is plan-phase / implementation detail.
- **`<iframe tabindex="-1">` toggle for non-current sections within ±1 window** — Phase 4 NAV-02 / Pitfall 18 territory; Phase 3 may need the markup but the toggle logic could slide to Phase 4. Planner's call.
- **In-video deep-link timestamps** (Vimeo `?t=<sec>`, YouTube `?start=<sec>` per-video override) — v1 always plays from 0:00; deferred until a producer requests a specific opening moment.
- **BrowserStack CI integration** — manual session runs are fine for v1's matrix gate; CI integration is overkill for one-time-per-phase validation.
- **Save-Data HTTP header** awareness — `adapter-static` ships no server; can't read request headers. Documented limitation; client-side `saveData` is the available signal.
- **EU GeoIP detection** — D-06's no-CMP posture means we don't branch on EU vs non-EU explicitly. If legal counsel ever flags this (Phase 7 cutover window), re-evaluate.
- **Module-scope IntersectionObserver shared across ReelStage instances** — explicitly anti-pattern (SUMMARY architecture); each `<ReelStage>` mount owns its IO.
- **Per-section IntersectionObservers** — explicitly anti-pattern (56 observers melts iOS, breaks Pitfall 5); ONE observer per stage.
- **`@vimeo/player` SDK** — explicitly anti-pattern (research SUMMARY locks raw iframe; ~30KB savings; dodges Svelte `$effect` cleanup ordering bug #12731). Re-evaluate ONLY if Phase 5 `<WatchPlayer>` "Continue the reel" auto-advance requires precise sound-on playback events.
- **`lite-vimeo-embed` / `lite-youtube-embed`** — explicitly anti-pattern (stale / custom-element clash with Svelte reconciler / not viewport-driven).
- **In-section preview duration cap** (e.g., loop only 10s of video then re-loop) — would reduce bandwidth but requires postMessage seek logic; deferred. Vimeo `background=1` and YouTube `loop=1` already loop the full video for v1.
- **Reduced-data mode (`prefers-reduced-data`)** — Chromium-only progressive enhancement (mirrors `prefers-reduced-motion` posture); add to the `<PosterImage>` trigger set in v2 if/when adoption broadens.
- **A/B traffic-split mechanism** — STATE.md blocker #3; Phase 7 (Trap E mitigation); does not affect Phase 3.

</deferred>

---

*Phase: 03-reel-system-core-load-bearing-risk*
*Context gathered: 2026-05-25*
