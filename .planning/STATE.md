---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 04-wayfinding-03 (NAV-02 keyboard handler + D-08 menu-pause bridge + D-01 chrome-height math + 4-spec e2e pillar)
last_updated: "2026-05-26T16:49:06.652Z"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 12
  completed_plans: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-19)

**Core value:** A hiring producer can scroll through Michelle's filmography like a cinema reel — each video taking the full screen with silent motion — and feel the work the way they would in a screening room, not a portfolio grid.
**Current focus:** Phase 04 — wayfinding

## Current Position

Phase: 5
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

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- **REEL-04 Chromium-only ambiguity** — `navigator.connection.effectiveType` returns `undefined` in Safari/Firefox. Must resolve before Phase 3 entry. Recommended softening: "progressive enhancement; autoplay-by-default outside Chromium; `▷ PLAY WITH SOUND` always available." (research/SUMMARY.md gap #1)
- **EU GDPR posture** — inherit `_four`'s no-CMP "interaction-as-consent" pattern, or escalate to legal counsel. Required before Phase 7 cutover. (research/SUMMARY.md gap #2)
- **A/B traffic-split mechanism** — Trap E mitigation; user decision required before Phase 7 cutover. (research/SUMMARY.md gap #5)
- **REQUIREMENTS.md count drift** — file said "41 total" but actually has 42 v1 requirements (WATCH-05 + CONT-03 + REEL-06 + REEL-07 + NAV-02 + NAV-03 + DATA-04 + POL-05 added during requirements pass without recounting). Coverage summary updated to 42 during roadmap creation.

## Session Continuity

Last session: 2026-05-26T16:38:14.897Z
Stopped at: Completed 04-wayfinding-03 (NAV-02 keyboard handler + D-08 menu-pause bridge + D-01 chrome-height math + 4-spec e2e pillar)
Resume file: None
