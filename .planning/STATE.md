---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: "Quick 260610-vu7 HALTED at Task 1: LCP median 2866ms still misses 2500ms (FCP-bound, ~900ms env delta vs 07-03); D-12 warn->error flip NOT landed"
last_updated: "2026-06-11T03:16:14.781Z"
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 24
  completed_plans: 24
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-19)

**Core value:** A hiring producer can scroll through Michelle's filmography like a cinema reel — each video taking the full screen with silent motion — and feel the work the way they would in a screening room, not a portfolio grid.
**Current focus:** Phase 07 — polish-cutover

## Current Position

Phase: 07
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 0/TBD | 0 min | — |
| 2. Data Layer | 0/TBD | 0 min | — |
| 3. Reel System Core | 0/TBD | 0 min | — |
| 4. Wayfinding | 0/TBD | 0 min | — |
| 5. Hero & Watch | 0/TBD | 0 min | — |
| 6. Content Pages | 0/TBD | 0 min | — |
| 7. Polish & Cutover | 0/TBD | 0 min | — |

**Recent Trend:**

- Last 5 plans: —
- Trend: — (no executions yet)

*Updated after each plan completion*
| Phase 01-foundation P01 | 8 min | 3 tasks | 22 files |
| Phase 01-foundation P02 | 7 | 3 tasks | 11 files |
| Phase 01-foundation P03 | 18 min | 4 tasks | 10 files |
| Phase 02-data-layer P01 | 6 min | 3 tasks tasks | 11 files files |
| Phase 02-data-layer P02 | 2 | 1 tasks | 1 files |
| Phase 02-data-layer P03 | 12 min | 4 tasks | 4 files |
| Phase 03-reel-system-core-load-bearing-risk P01 | 41 min | 7 tasks tasks | 20 files files |
| Phase 03-reel-system-core-load-bearing-risk P02 | 21min | 5 tasks | 10 files |
| Phase 03 P03 | 90 | 7 tasks | 11 files |
| Phase 04-wayfinding P01 | 17min | 3 tasks | 9 files |
| Phase 04-wayfinding P02 | 20 | 3 tasks | 13 files |
| Phase 04-wayfinding P03 | 128min | 3 tasks tasks | 11 files files |
| Phase 05-hero-watch P01 | 16min | 3 tasks | 8 files |
| Phase 05 P02 | 22 min | 3 tasks | 13 files |
| Phase 05-hero-watch P03 | 34min | 3 tasks | 11 files |
| Phase 06-pbs-press-about-contact P01 | 22min | 3 tasks | 8 files |
| Phase 06-pbs-press-about-contact P02 | 14min | 4 tasks tasks | 17 files files |
| Phase 06-pbs-press-about-contact P03 | 21min | 6 tasks | 8 files |
| Phase 06-pbs-press-about-contact P04 | 55 | 2 tasks | 1 files |
| Phase 07-polish-cutover P01 | 30 min | 3 tasks tasks | 6 files files |
| Phase 07-polish-cutover P02 | 15min | 2 tasks | 9 files |
| Phase 07-polish-cutover P03 | 95min | 4 tasks | 9 files |
| Phase 07-polish-cutover P04 | 15 | 2 tasks | 2 files |
| Phase 07-polish-cutover P05 | 12 | 3 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Kickoff: `_three` is a real shipping candidate, not a mockup — both A/B siblings get full polish.
- Kickoff: Scroll-snap fullscreen reel chosen as the cinematic-immersive design direction (over editorial / archive / bento alternatives).
- Kickoff: Viewport-windowed iframe mounting (current ± 1) — load-bearing perf decision.
- Kickoff: Cellular = poster + tap-to-play; bandwidth ethics over autoplay.
- Kickoff: Reuse `_four`'s `videos.json` byte-for-byte; cross-repo CI drift guard required (Trap A).
- Roadmap: 7-phase structure adopted to mirror `_four`'s shape — A/B requires structural parity.
- Roadmap: Phase 3 (Reel System Core) is the load-bearing-risk phase — 14 of 20 documented pitfalls cluster there; not subdividing to keep the risk surface atomic.
- [Phase 01-foundation]: Pinned @axe-core/playwright to 4.11.3 (4.11.4 does not exist on npm)
- [Phase 01-foundation]: Copied sibling favicon.png as Phase 1 placeholder to unblock adapter-static strict prerender (POL-01 replaces in Phase 7)
- [Phase 01-foundation]: pnpm-workspace.yaml allowBuilds opts in sharp + esbuild build scripts (sharp required by @sveltejs/enhanced-img)
- [Phase 01-foundation]: Cream focus ring landed at oklch(0.98 0.02 80); inner ring at oklch(0.16 0 0) matching neutral-950 for visual rhyme
- [Phase 01-foundation]: PUBLIC_SITE_URL strategy: committed .env.example (staging value active, production cutover line commented); GH Actions workflow in Plan 01-03 will set the real value in env: block
- [Phase 01-foundation]: Storage SSR-safety pattern uses exported __isBrowser predicate + vi.stubGlobal — explicitly rejected the unstable ?ssr-test import-query trick
- [Phase 01-foundation]: Neutrals ramp landed as 8 zero-chroma OKLCH stops 50/100/300/500/700/800/900/950 (0.98/0.94/0.82/0.62/0.40/0.30/0.22/0.16)
- [Phase 01-foundation]: D-17 CI grep gate live: scans src/ for raw localStorage outside $lib/storage.ts and fails with ::error:: annotations; mechanical drift guard template for future Trap-N gates
- [Phase 01-foundation]: BASE_PATH isolation: e2e step omits BASE_PATH (preview at root); artifact-build step sets BASE_PATH=/${{ github.event.repository.name }} for GH Pages subpath. Two builds, two postures, cross-referenced in deploy.yml + playwright.config.ts
- [Phase 01-foundation]: Playwright preview port shifted 4173 -> 4183 to avoid sibling _four collision during local A/B work; CI uses fresh containers and is unaffected
- [Phase 01-foundation]: Single CI workflow (deploy.yml) covers PR-time + deploy gates; rejected separate PR workflow as duplication (4 smoke gates + branch protection on main is sufficient)
- [Phase 01-foundation]: Svelte 5.55+ rune-scoping rules require .svelte.ts file extension for any TS using runes outside .svelte components; companion test files end .svelte.test.ts and wrap rune-using class instantiation in $effect.root(() => { ... })
- [Phase 02-data-layer]: Mirrored _four data layer byte-for-byte (9 files: 5 source + 4 test); 11-name public surface preserved; validateVideosPlugin wired top-level + both Vitest projects
- [Phase 02-data-layer]: ui Vitest project include widened to src/lib/**/*.{test,spec}.{js,ts} to catch Phase 1 tests (storage, intersectionVisibility, smoke-page); exclude src/lib/data/** keeps data tests in node-env data project
- [Phase 02-data-layer]: Pinned _four@07667658ee2fd16a3d56b66bbe832d08fc3badd5 in .videos-source-sha (D-05 current main HEAD at sync time); sha256=fd15e0568425ef8a8472b8bae856bc43a5a85810e4fb1a8f9d0cff771d8ef91c
- [Phase 02-data-layer]: DATA-02 smoke-test verified: corrupting [0].source='tiktok' aborts pnpm build with exit 1 + 'Invalid discriminator value. Expected youtube | vimeo' at [0].source via [plugin validate-videos]
- [Phase 02-data-layer]: Wired drift-check CI job into deploy.yml with __four/ subdir checkout, D-12/D-07/sidecar-mismatch error annotations, and pull_request trigger expansion — DATA-04/Trap A precondition closed
- [Phase 02-data-layer]: Phase 2 P3 oEmbed health-check: standalone scripts/check-embeds.ts (Node 22 --experimental-strip-types, zero new deps); pnpm check:embeds entrypoint; nightly cron 06:00 UTC at .github/workflows/oembed-check.yml; auto-Issue via gh issue list --label embed-check; D-14 retry+classify (401/403=embed_disabled, 404/410=removed, 5xx/network=transient); D-15 hand-rolled per-host queue limit 6; D-20 .embed-check-report.json gitignored
- [Phase 02-data-layer]: Phase 2 P3 smoke-tests verified: happy path 56/56 embeddable exit 0 (no .embed-check-report.json written); forced 404 path via temp-edited oembedUrl exited 1 with 14 YouTube failures classified 'removed' and report file written matching {ranAt, totalChecked, failures:[{source,id,title,status,classification}], warnings} shape; tree restored clean post-test
- [Phase 03-reel-system-core-load-bearing-risk]: SvelteSet replaces plain Set for mountedIds (svelte/prefer-svelte-reactivity + no-unnecessary-state-wrap)
- [Phase 03-reel-system-core-load-bearing-risk]: Test files for rune-using modules use .svelte.test.ts extension (Svelte 5.55+ rune-scoping rule for $effect.root)
- [Phase 03-reel-system-core-load-bearing-risk]: REEL-05 deep-link uses deprecated base+literal until Phase 5 ships /watch/[id] route — eslint per-file override silences svelte/no-navigation-without-resolve
- [Phase 03-reel-system-core-load-bearing-risk]: prerender.handleHttpError allow-list for /posters/* + /watch/* during Plan 03-01 → Plan 03-03 / Phase 5 rollout window
- [Phase 03-reel-system-core-load-bearing-risk]: lint-staged moved to .lintstagedrc.cjs invoking node <abs-path-to-cli.js> directly — fixes Windows-spawn ENOENT under husky environment
- [Phase 03-reel-system-core-load-bearing-risk]: Lifecycle $state variable named 'lifecycle' (NOT 'state') — svelte-check/tsc tripped on let state = $state<T>(...) with 'Block-scoped variable $state used before its declaration'; identifier collides with the rune in lexical scope
- [Phase 03-reel-system-core-load-bearing-risk]: PreviewLoop onautoplayfailed callback is the unified REEL-04 fallback signal — fires on 800ms HANDSHAKE_TIMEOUT_MS elapsing OR onError handler invocation; Plan 03-03 ReelSection wires the consumer ( autoplayFailed flag + new shouldMount gate clause)
- [Phase 03-reel-system-core-load-bearing-risk]: PreviewLoop wasHidden guard ((false)) prevents spurious postMessage 'play' on initial render when documentHidden defaults to false; only the hidden→visible TRANSITION sends resume — every other dispatch path is gated on wasHidden===true
- [Phase 03-reel-system-core-load-bearing-risk]: HANDSHAKE_TIMEOUT_MS=800 exported as named const from $lib/iframe/url.ts; Plan 03-03 BrowserStack matrix is the real-device gate — if iOS Safari 16/17.0/17.1 shows premature fallback on cellular, bump to 1200ms (NOT abandon the mechanism)
- [Phase 03-reel-system-core-load-bearing-risk]: YouTube adapter dispose does NOT send a defensive postMessage (no clean unsubscribe protocol); relies on Layer 1 (Svelte iframe DOM teardown); Plan 03-03 Playwright leak-defense pillar verifies sufficiency on Chromium+WebKit+Firefox
- [Phase 03]: Plan 03-03 finalized with Tasks 8 (BrowserStack matrix) + 9 (physical iPhone thermal QA) DEFERRED to UAT per user decision 2026-05-26; tracked in .planning/phases/03-reel-system-core-load-bearing-risk/03-HUMAN-UAT.md; both gates MUST close before Phase 7 cutover per CONTEXT D-13/D-14/D-16
- [Phase 03]: REEL-04 unified codepath SHIPPED — single $derived in ReelSection collapses 5 fallback triggers (motion.prefersReducedMotion || network.isCellularLike || autoplayFailedFromPreviewLoop) into ONE PosterImage render; PreviewLoop onautoplayfailed callback (Plan 03-02) consumed via Svelte 5 callback-prop idiom; per-section state isolation verified
- [Phase 03]: validatePostersPlugin (D-03) mirrors validateVideosPlugin shape and placement (between tailwindcss and sveltekit); pattern carries forward to any future sidecar (captions, transcripts); aborts buildStart on missing sidecar entry OR missing static/posters/{source}-{id}.jpg with ::error:: annotation + literal 'pnpm check:embeds --posters-only' fix command
- [Phase 03]: Playwright Page Visibility e2e tests skip on headless (visibilitychange unreliable on headless backgrounding); 3 skips documented as known caveat in 03-VERIFICATION.md and 03-03-SUMMARY.md; unit-level contract in PreviewLoop.test.ts pins behavior; real-device matrix (deferred) closes the headless gap
- [Phase 04-wayfinding]: [Plan 04-01]: FilterPillBar ships with sticky top-0 (no chrome-nav-height var yet); Plan 04-02 publishes var, Plan 04-03 plumbs into FilterPillBar top + ReelStage h-svh
- [Phase 04-wayfinding]: [Plan 04-01]: categoryAccent.ts ships 3 flavors (text/bg-15/ring-40) as separate Records — Pitfall 7 scanner-contract pinned with readFileSync().includes() test assertions
- [Phase 04-wayfinding]: [Plan 04-01]: eslint per-file override pre-registers TopNav + MobileMenu so Plan 04-02 diff stays component-only (single source of truth at config level, NOT per-file inline directives)
- [Phase 04-wayfinding]: [Plan 04-01]: jsdom missing scrollIntoView — guard added (typeof active.scrollIntoView === 'function'); same guard covers any future SSR codepath
- [Phase 04-wayfinding]: scrollIdle target queried as [role=region][aria-label=Filmography reel] container, NOT window — reel-snap scroll fires on inner element; window listener would never fire
- [Phase 04-wayfinding]: menu rune ships writer (openMenu/closeMenu); Plan 04-03 owns ReelStage consumer wiring via 1-line documentHidden OR — keeps parallel-wave file ownership clean
- [Phase 04-wayfinding]: Splash page outer <main> -> <div> (Rule 3 deviation) — layout owns the single <main> landmark; nested would axe-fail WCAG 1.3.1
- [Phase 04-wayfinding]: svelte.config.js handleHttpError allowlist extended for /about, /press, /contact (Phase 6 known-pending) — mirror of existing /watch/[id] pattern
- [Phase 04-wayfinding]: WebKit skip-link e2e test uses element.focus() instead of page.keyboard.press(Tab) — WebKit macOS doesn't tab to <a> by default; focus() asserts focusability without depending on browser-default Tab behavior
- [Phase 04-wayfinding]: [Plan 04-03] documentHidden refactored from $state+$effect bridge to $derived(pageHidden || menu.menuOpen) — purer expression, satisfies svelte/prefer-writable-derived, PreviewLoop consumer unchanged
- [Phase 04-wayfinding]: [Plan 04-03] Keyboard handler scoped to reel container (NOT global window) with tabindex='0' — future Phase 6 form inputs don't have keys stolen; svelte-ignore directives for noninteractive tabindex+element-interactions justified inline
- [Phase 04-wayfinding]: [Plan 04-03] data-doc-hidden attribute on reel container — exposes documentHidden for unit-test introspection without mocking setContext or PreviewLoop consumer
- [Phase 04-wayfinding]: [Plan 04-03] Tab-walk e2e verified via DOM-introspection (linkOrder list) not physical Tab presses — cross-origin iframes briefly capture focus on attach; deterministic + headless-safe
- [Phase 04-wayfinding]: [Plan 04-03] TopNav+MobileMenu wordmark text-neutral-50 (Rule 1 deviation) — fixes pre-existing Plan 04-02 color-contrast WCAG AA failure (1.19:1 black on dark canvas)
- [Phase 04-wayfinding]: [Plan 04-03] reel.spec.ts Pillar 1 centerline math uses reel container bounding rect not window.innerHeight (Rule 3 deviation, chartered by Plan 04-02 deferred-items.md)
- [Phase 05-hero-watch]: [Plan 05-01] vimeoAdapter.onLoad now subscribes 'play'+'pause'+'error'; dispose symmetrically removes play+pause (Finding 1 gap closure). YouTube adapter untouched — onStateChange info=2 already routes to onPause.
- [Phase 05-hero-watch]: [Plan 05-01] buildEmbedUrl playsinline=1 lifted out of 'if mode === preview' for BOTH Vimeo + YouTube — now unconditional per provider (Finding 11 / Pitfall B). 'play' mode iOS Safari tap-to-play stays in-document; chrome-fade postMessage flow survives.
- [Phase 05-hero-watch]: [Plan 05-01] pageVisibility module-scope rune ($lib/state/visibility.svelte.ts) is the single source-of-truth for documentHidden = _pageHidden OR menu.menuOpen. Registered once via initVisibilityListener from +layout.svelte; ReelStage + HeroAmbient (05-03) + WatchPlayer (05-02) all subscribe. Phase 3 D-12 'reel:visibility' setContext shape preserved verbatim.
- [Phase 05-hero-watch]: [Plan 05-01] D-15 hash-restoration consumer in ReelStage uses $effect (not onMount — Pitfall C: sectionRefs[] bind:this populates after first paint flush). restoredFromHash $state guard makes effect single-fire per mount so Phase 4 filter-narrowing doesn't re-scroll. scrollIntoView({block:'start', behavior:'auto'}) per D-15 — explicitly NOT 'smooth'.
- [Phase 05]: [Plan 05-02] WatchPlayer ships D-06 letterbox (bg-black min-h-svh + aspect-video w-full max-h-svh flex-centered) + D-07 8-transition chrome-fade state machine. chromeFaded exposed as $bindable so the route's +page.svelte shares opacity with the below-player chrome region (D-08).
- [Phase 05]: [Plan 05-02] ContinueReelRail ships pure CSS scroll-snap-x mandatory rail (NO embla dep) + D-11 fractional-peek widths + D-12 heading-is-link + D-13 hide-when-empty. <section aria-labelledby='rail-heading'> per UI-SPEC (rail is content, not nav).
- [Phase 05]: [Plan 05-02] data-video-id={video.id} landed on the <article aria-label='Video N of M: ...'> in ReelStage.svelte (NOT ReelSection.svelte as plan literally said). The article landmark lives in ReelStage's {#each} loop wrapping ReelSection; ReelSection.svelte starts with a <div>. Documented as Rule 1 deviation.
- [Phase 05]: [Plan 05-02] VideoObject JSON-LD payload (@context schema.org + @type VideoObject + name + description + thumbnailUrl + uploadDate + embedUrl + contentUrl) ships in <svelte:head> per video; contentUrl branches on video.source (vimeo: vimeo.com/{id}; youtube: youtube.com/watch?v={id}). Phase 7 POL-01 audits.
- [Phase 05]: [Plan 05-02] WatchPlayer unit tests required flushSync() under vi.useFakeTimers() so the $effect microtask captures adapter handlers before assertions. PointerEvent + TouchEvent dispatches need {bubbles: true} for Svelte 5 jsdom event delegation; pointerleave stays non-bubbling (native behavior). ESLint glob for src/routes/watch/[id]/+page.svelte must use src/routes/watch/**/+page.svelte (minimatch treats literal [id] as char class).
- [Phase 05-hero-watch]: Plan 05-03: createHeroDefer is a factory (not module-scope singleton) so Phase 6 ABT-01 /about ambient bg can instantiate its own without timer/listener tangle during SPA transitions
- [Phase 05-hero-watch]: Plan 05-03: HeroAmbient (SIBLING of ReelStage) sets its OWN setContext('reel:visibility', { documentHidden }) so PreviewLoop child sees zero API change — the bridge value sources from pageVisibility.documentHidden which already ORs document.hidden with menu.menuOpen
- [Phase 05-hero-watch]: Plan 05-03: e2e D-03 defer-mechanism assertion targets the LCP-bearing poster image (not the iframe-attached check) because PreviewLoop's 800ms HANDSHAKE_TIMEOUT_MS unmounts the iframe in headless before Playwright can poll — same documented caveat as Phase 3 reel.spec.ts
- [Phase 05-hero-watch]: Plan 05-03: e2e test stubs live in src/lib/components/ so svelte-check resolves the .svelte declarations via the lib alias
- [Phase 06-pbs-press-about-contact]: [Plan 06-01] trailingSlash='always' adopted at +layout.ts — resolves D-13 PBS retarget URL form contract; matches _four verbatim; TopNav endsWith() guard already normalizes trailing slash
- [Phase 06-pbs-press-about-contact]: [Plan 06-01] Typography ramp consolidated to text-sm for Footer headers + bottom strip (UI-SPEC Dim 4 — no text-xs) — diverges from _four's text-xs intentionally
- [Phase 06-pbs-press-about-contact]: [Plan 06-01] svelte.config.js handleHttpError allow-list dropped entirely (no empty prerender block) — strict prerender default restored as end-state; 06-02 + 06-03 must close /about, /press, /contact, /pbs-american-portrait 404s in same phase
- [Phase 06-pbs-press-about-contact]: [Plan 06-02] ReelStage intro slot resolved via intro?: Snippet prop — minimal extension, preserves ±1 viewport-windowing budget, not added to sectionRefs[]/IO targets so hash-write codepath stays gated on videos[bestIdx]?.id
- [Phase 06-pbs-press-about-contact]: [Plan 06-02] getPbsCollectionUrl per-video hook landed on ReelStage (not ReelSection slot/discriminator); forwarded to each ReelSection inside existing {#each} loop via pbsCollectionUrl={getPbsCollectionUrl?.(video)} — backward-compatible additive contract
- [Phase 06-pbs-press-about-contact]: [Plan 06-02] /press uses snap-mandatory (not snap-proximity like /work + PBS landing) — Pitfall 7 reason for proximity (postMessage handshake timing) does not apply on poster-only NO-iframe /press
- [Phase 06-pbs-press-about-contact]: [Plan 06-02] /press flat array shape PressCredit[] (D-08 divergence from _four's grouped shape) — one fullscreen section per credit; today's 1:1 data yields 13 records; forward-defensive for multi-credit-per-network futures
- [Phase 06-pbs-press-about-contact]: [Plan 06-03] HeroAmbient tagline suppression via Svelte 5 sentinel key-presence ('tagline' in rest props) — / keeps default 'Filmmaker & Producer'; /about's tagline={undefined} renders no tagline (Svelte applies default on undefined, can't distinguish absent from explicit-undefined)
- [Phase 06-pbs-press-about-contact]: [Plan 06-03] /about bio embedded with STRAIGHT apostrophes to match user-approved _four-shipped source byte-for-byte (plan's 'curly apostrophes' template comment was incorrect)
- [Phase 06-pbs-press-about-contact]: [Plan 06-03] Person JSON-LD sameAs byte-identical to ContactBlock literals (D-21 single-source duplication + sync-warning); /about needs no eslint override, /contact does (poster src ${base} literal)
- [Phase 06-pbs-press-about-contact]: [Plan 06-04] D-16 fix: TopNav scroll-target querySelector broadened to a CSS selector-list matching BOTH reel-container labels (Filmography reel + Press credits reel) — exactly one per route, resolves unambiguously; closes the /press chrome-fade gap with the ?? window fallback preserved
- [Phase 06-pbs-press-about-contact]: [Plan 06-04] press.spec.ts Test C deferred (not fixed): clicking ▷ Watch navigates correctly (proven via waitForURL probe → /watch/<id>/) but the test's networkidle wait races the trailingSlash='always' 307 redirect; the D-16 listener activation exposed this latent fragility. Honored gap-only scope (TopNav.svelte only); one-line waitForURL fix recommended for follow-up
- [Phase 07-polish-cutover]: [Plan 07-01] Did NOT author favicon/og-image binaries (07-02's checkpointed _three-cinematic-art deliverable); used temporary _four copies for verification only, then removed. Known-failing pnpm build accepted as Wave-1 end-state (favicon 404 under strict prerender until 07-02 lands binaries) — identical master-broken expectation as Plan 06-01.
- [Phase 07-polish-cutover]: [Plan 07-01] Sitemap hardcodes absolute https://michellengo.net host (NOT env-aware per Pitfall 4); 70-URL count (6 static + 8 category + 56 watch) pinned by scripts/test-prerender-coverage.mjs wired as pnpm test:prerender. POL-01 JSON-LD/description audit (D-15): 56 VideoObject + 1 Person valid, 7/7 descriptions intact — zero gaps, no template edits.
- [Phase 07-polish-cutover]: [Plan 07-02] User selected sharp-script approach: reproducible scripts/build-assets.mjs composites _three's OWN cinematic-dark art (darkened/blurred reel poster + cream Source-Serif wordmark + violet reel-accent) from existing static/posters/*.jpg; no new runtime dep (sharp via @sveltejs/enhanced-img), no image-editor
- [Phase 07-polish-cutover]: [Plan 07-02] og-image.jpg authored at EXACTLY 1200x630, 23443 bytes (within Trap B 3x band of _four's 15386); mozjpeg q82 4:2:0 with auto quality-ladder back-off; OKLCH @theme converted to sRGB (canvas #0d0d0d, cream #fff7ea) so the social card matches live-site tones
- [Phase 07-polish-cutover]: [Plan 07-02] Wordmark uses system-serif fallback when Source Serif 4 isn't fontconfig-registered (librsvg limitation); design intent preserved, build never fails on missing font; multi-res favicon.ico hand-assembled (16+32 PNG payloads) since sharp lacks multi-frame .ico emission
- [Phase 07-polish-cutover]: [Plan 07-03] axe gate hardened /-only -> 7 routes (24 assertions, 3 browsers); fixed 3 WCAG-AA: Footer h3->h2 + sr-only h1 on /work + /work/[category]
- [Phase 07-polish-cutover]: [Plan 07-03] POL-02 D-17 measure-first: real / LCP on simulated Slow-4G. Task 4 poster-preload escalation hoisted preload to page-level head (/ + /about); median 2859->2806ms (-53ms, variance 296->11ms, perf 0.91->0.95). Still MISS by 306ms — ACCEPTED warning-only; 07-04 owns warn->error flip. Honest finding: SvelteKit emits JS modulepreloads ahead of all <svelte:head>, so fetchpriority=high (not DOM order) is the lever
- [Phase 07-polish-cutover]: [Plan 07-03] POL-03 audit (not refactor): grep-confirmed 100svh-only in snap sections, zero 100vh/100dvh, shared aspect-video container across ReelSection/PosterImage/PreviewLoop; CLS 0.0054 empirical. POL-03 marked COMPLETE; POL-02 + POL-04 PARTIAL (CI blocking flip -> 07-04; real-device QA -> UAT)
- [Phase 07-polish-cutover]: [Plan 07-04] Trap E uses committed-snapshot route-manifest (src/lib/data/.four-route-manifest, pinned at four_commit_sha=07667658) diffed against build/ route shapes; normalized to <shape>\t<count> with /watch/*=56 + /work/*=8 collapses — avoids building _four in CI (RESEARCH OQ3)
- [Phase 07-polish-cutover]: [Plan 07-04] Trap B (D-02/POL-05): _four's og-image.jpg is a WebP-in-.jpg (RIFF/WEBP magic), so the CI probe parses only _three's JPEG SOF dims (must be 1200x630) and uses format-agnostic statSync byte counts for the 3x filesize-ratio band; dependency-free (drift-check job has no pnpm install/sharp). Split: meta-tag grep in build job, dim+ratio in drift-check job
- [Phase 07-polish-cutover]: [Plan 07-04] Lighthouse / LCP gate wired at WARNING posture (lighthouserc.json ['warn',...], no preset:desktop, mobile Slow-4G preserved) as a new lighthouse job needs:deploy. 07-03 measured ~2806ms vs 2500ms budget so a blocking gate would fail CI — warn->error flip is a documented 07-05 pre-cutover step (D-12), NOT this plan
- [Phase 07-polish-cutover]: [Plan 07-05] FOUND-03 satisfied as stop-at-infrastructure: CNAME + manual-dispatch deploy-production.yml + staged-but-unlanded D-12 flip + 9-step reversible runbook + 07-QA-MATRIX go/no-go gate. POL-04 left PARTIAL — device-QA sign-off (BrowserStack matrix + iPhone thermal) deferred to UAT in 07-QA-MATRIX.md. Four invariants re-confirmed: noindex present, deploy-production.yml workflow_dispatch-only, CNAME=michellengo.net, no cutover fired.

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- **REEL-04 Chromium-only ambiguity** — `navigator.connection.effectiveType` returns `undefined` in Safari/Firefox. Must resolve before Phase 3 entry. Recommended softening: "progressive enhancement; autoplay-by-default outside Chromium; `▷ PLAY WITH SOUND` always available." (research/SUMMARY.md gap #1)
- **EU GDPR posture** — inherit `_four`'s no-CMP "interaction-as-consent" pattern, or escalate to legal counsel. Required before Phase 7 cutover. (research/SUMMARY.md gap #2)
- **A/B traffic-split mechanism** — Trap E mitigation; user decision required before Phase 7 cutover. (research/SUMMARY.md gap #5)
- **REQUIREMENTS.md count drift** — file said "41 total" but actually has 42 v1 requirements (WATCH-05 + CONT-03 + REEL-06 + REEL-07 + NAV-02 + NAV-03 + DATA-04 + POL-05 added during requirements pass without recounting). Coverage summary updated to 42 during roadmap creation.
- POL-02/D-12: hero LCP still misses 2500ms (median 2866ms, quick 260610-vu7). Preload lever exhausted (poster on-wire 18ms); residual FCP/render-bound ~2715ms (~900ms env delta vs 07-03). warn->error flip BLOCKED until a like-for-like apex/07-03-host re-measure or an FCP lever lands under budget.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260610-vu7 | LCP remediation D-12: preload hoist + defer ease landed; gate flip HALTED (2866ms > 2500ms) | 2026-06-11 | 5c1fa98 | [260610-vu7-lcp-remediation-d-12-close-306ms-lcp-mis](./quick/260610-vu7-lcp-remediation-d-12-close-306ms-lcp-mis/) |

## Session Continuity

Last session: 2026-06-11T03:15:52.255Z
Stopped at: Quick 260610-vu7 HALTED at Task 1: LCP median 2866ms still misses 2500ms (FCP-bound, ~900ms env delta vs 07-03); D-12 warn->error flip NOT landed
Resume file: None
