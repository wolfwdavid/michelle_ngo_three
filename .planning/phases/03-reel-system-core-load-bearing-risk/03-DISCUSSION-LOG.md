# Phase 3: Reel System Core (LOAD-BEARING RISK) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 03-reel-system-core-load-bearing-risk
**Areas discussed:** Poster pipeline, REEL-04 fallback logic, Mount-vs-play strategy, Phase 3 done-criteria

---

## Gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Poster pipeline | Build-time vs runtime vs in-JSON; link-rot vs build complexity vs DATA-01 byte-identity | ✓ |
| REEL-04 fallback logic | STATE.md Phase 3 entry blocker (Chromium-only `navigator.connection`); EU GDPR posture | ✓ |
| Mount-vs-play strategy | Windowed ±1 with current-only-plays vs all-3-play; thermal/battery on iPhone 13-class | ✓ |
| Phase 3 done-criteria | Playwright-only vs hybrid vs full POL-04 matrix during Phase 3 | ✓ |
| REEL-05 overlay treatment | Title/CategoryTag/PLAY-WITH-SOUND visual specifics | (punted to plan-phase or `/gsd:ui-phase 3`) |
| URL hash & deep-link structure | `#video={id}` debounce / replaceState vs pushState | (Claude's discretion in plan-phase) |

---

## Poster pipeline

### Q1: Where do the 56 video posters live?

| Option | Description | Selected |
|--------|-------------|----------|
| Build-time fetch + self-host | Vite plugin fetches Vimeo oEmbed + YouTube i.ytimg.com at build, writes WebP/AVIF/JPEG via `@sveltejs/enhanced-img` into `static/posters/` with content-hashed filenames | ✓ |
| Runtime fetch from provider CDN | `vumbnail.com/{id}.jpg` (unofficial) + `i.ytimg.com/vi/{id}/maxresdefault.jpg`; zero build complexity; link-rot risk per Pitfall 16 | |
| Pre-committed static posters | Manually fetch all 56 once, commit; no refresh mechanism; cleanest A/B but diverges from `_four` | |

**User's choice:** Build-time fetch + self-host
**Notes:** Matches research SUMMARY + Pitfall 16 mitigation; reuses installed `@sveltejs/enhanced-img`.

### Q2: How do poster paths plumb into the data layer?

| Option | Description | Selected |
|--------|-------------|----------|
| Build-time sidecar JSON | `src/lib/data/posters.json` maps `(source, id)` → hashed path; `videos.json` stays byte-identical to `_four` (DATA-01); new `getPosterFor(video)` helper in NEW file | ✓ |
| Derive paths at component-time | Convention-based path from id; clashes with `@sveltejs/enhanced-img` content hashing | |
| Inline via `import.meta.glob` | Bundler resolution; opaque for grep | |

**User's choice:** Build-time sidecar JSON
**Notes:** Preserves DATA-01 byte-identity; honors Phase 2 D-22 "no premature helpers in mirrored loader"; sidecar lands in NEW file.

### Q3: What happens if a poster fetch fails at build time?

| Option | Description | Selected |
|--------|-------------|----------|
| Fail the build | `pnpm build` aborts with clear error naming failing video; mirrors `validateVideosPlugin` (DATA-02) posture | ✓ |
| Soft-fail with placeholder | Write generic placeholder + warning; build succeeds; silent failure mask | |
| Use cached previous build's poster | Fall back to last-known good; doesn't help on fresh CI clone | |

**User's choice:** Fail the build
**Notes:** Treats poster availability as hard build prerequisite — forces producer to investigate.

### Q4: Where does the poster-fetch code live?

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `scripts/check-embeds.ts` | Phase 2's oEmbed script ALSO saves `thumbnail_url` assets; run via `pnpm check:embeds` + nightly; **posters become committed artifacts** | ✓ |
| New Vite plugin | Separate plugin at `buildStart`, parallel to `validateVideosPlugin`; build-time deterministic; ~3-4s cold build cost | |
| Pre-build npm script | `scripts/fetch-posters.ts` invoked by `pnpm prebuild`; footgun: easy to forget on dev server | |

**User's choice:** Extend `scripts/check-embeds.ts`
**Notes:** Posters become **committed artifacts** — refreshing requires running `pnpm check:embeds` locally and committing the diff. Build verifies the sidecar+files exist (the "fail the build" gate from Q3 still applies, but on missing committed files, not on live network failures).

---

## REEL-04 fallback logic

### Q1: How should the cellular/network branch behave outside Chromium?

| Option | Description | Selected |
|--------|-------------|----------|
| Progressive enhancement: autoplay-default outside Chromium | If `navigator.connection` undefined, treat as fast; Chromium gets bandwidth-ethics protection; preserves cinematic experience on iOS Safari (Michelle's primary audience) | ✓ |
| Conservative: poster-default outside Chromium | If undefined, default to poster; safest on metered iOS; heavy-handed for the design bet | |
| User-controllable: localStorage data-saver toggle | Belt + suspenders; adds chrome UI surface | |

**User's choice:** Progressive enhancement: autoplay-default outside Chromium
**Notes:** STATE.md blocker #1 (REEL-04 Chromium-only ambiguity) RESOLVED. Matches research SUMMARY softening recommendation.

### Q2: EU GDPR posture for the autoplay iframe (Pitfall 13)

| Option | Description | Selected |
|--------|-------------|----------|
| Inherit `_four`'s no-CMP "interaction-as-consent" | No cookie banner; `youtube-nocookie.com` + Vimeo `dnt=1` minimize tracking; document in Launch Runbook (Phase 7) | ✓ |
| EU-detect + default-to-poster | Use `Intl.DateTimeFormat().resolvedOptions().timeZone` or `navigator.language` as heuristic; safer; adds detection complexity; diverges from `_four` posture | |
| Escalate to legal counsel before Phase 3 | Pause Phase 3 entry until legal confirms; blocks progress | |

**User's choice:** Inherit `_four`'s no-CMP "interaction-as-consent"
**Notes:** STATE.md blocker #2 (EU GDPR posture) RESOLVED. Preserves A/B sibling parity; same legal exposure as `_four` already accepted.

### Q3: How is LPM 'play() rejection' detected and surfaced?

| Option | Description | Selected |
|--------|-------------|----------|
| postMessage handshake + 800ms timeout | Listen for `play` postMessage; if not received in 800ms, swap iframe → PosterImage + `▷ TAP TO PLAY`; catches LPM/embed-disabled/blocked-autoplay in one mechanism | ✓ |
| Vimeo `Player.ready()` Promise + try/catch | Use `@vimeo/player` SDK; reverses research SUMMARY's "raw iframe + URL params" lock; +30KB | |
| Skip detection; rely on always-visible TAP TO PLAY | Simplest; no telemetry on rejection rate; passive | |

**User's choice:** postMessage handshake + 800ms timeout
**Notes:** Single detection mechanism covers four fallback triggers (LPM, embed-disabled, browser-blocked autoplay, EU autoplay restrictions).

### Q4: Where does trigger-detection state live?

| Option | Description | Selected |
|--------|-------------|----------|
| Module-scope runes in `$lib/state/` | `network.svelte.ts` + `motion.svelte.ts`; app-wide singletons; Phase 5 HeroAmbient + WatchPlayer reuse | ✓ |
| Component-local in ReelStage | Local + simple; Phase 5 redoes the work | |
| Resolved at `+page.ts` `load()` time | Server-side prerender has no client context; wrong tool | |

**User's choice:** Module-scope runes in `$lib/state/`
**Notes:** SSR-safe defaults; hydration flips values; matches Phase 1 `$lib/storage.ts` `__isBrowser()` idiom.

---

## Mount-vs-play strategy

### Q1: When the user is centered on section N, what's happening in N-1 and N+1?

| Option | Description | Selected |
|--------|-------------|----------|
| Only N plays; N±1 mounted-paused (preload, no decode) | Pitfall 5 recommendation; sustainable on iPhone 13-class; ~50-150ms postMessage `play` latency on scroll | |
| All 3 within window play simultaneously | Cinematic "reel is alive"; 3x decode load; fan within ~60s on mid-tier; battery 5-8% in 5 min per Pitfall 5 | ✓ |
| Only N plays; N±1 NOT mounted yet | Strictest; lowest memory; visible poster→iframe flicker on fast scroll | |

**User's choice:** All 3 within window play simultaneously
**Notes:** Explicit trade-off: cinematic feel over thermal/battery. D-16 thermal QA (5-min iPhone scroll) is the validation gate; D-16 documents the escalation path (360p ±1 cap → current-only-plays fallback) if the budget is breached.

### Q2: What IntersectionObserver threshold defines the 'current' section?

| Option | Description | Selected |
|--------|-------------|----------|
| threshold: 0.5 | 50%+ visible; clean discriminator for scroll-snap proximity + 100svh sections | ✓ |
| threshold: 0.75 | Stricter; less wasted decode; risk: visible "still poster" during slow approach | |
| Multiple thresholds [0, 0.25, 0.5, 0.75, 1] | Granular tracking; more bookkeeping; downstream UI-SPEC can revisit | |

**User's choice:** threshold: 0.5
**Notes:** "Current" is for UI signal (active hash, landmark focus); all 3 within window play regardless of threshold per Q1.

### Q3: When does the iframe actually attach to the DOM?

| Option | Description | Selected |
|--------|-------------|----------|
| Eager: `rootMargin: '100% 0%'` | 1 viewport above + 1 below; sections swap off-screen; no mid-view blink | ✓ |
| Lazy: mount only when current (threshold 0.5) | Strict; lowest memory; visible swap on entry | |
| Predictive: mount only in scroll direction | Asymmetric ±1; memory-efficient; back-scroll triggers full remount | |

**User's choice:** Eager: rootMargin '100% 0%'
**Notes:** Matches REEL-03 + REEL-06 lifecycle; one observer per ReelStage.

### Q4: Page Visibility behavior on tab background?

| Option | Description | Selected |
|--------|-------------|----------|
| Pause the playing ones; keep ±1 mounted | postMessage `pause` to all within-window iframes; resume on visibility return; no remount churn | ✓ |
| Pause and unmount all iframes | Frees memory; poster→iframe re-swap visible on return | |
| Pause only; do nothing to ±1 | Equivalent to recommended | |

**User's choice:** Pause the playing ones; keep ±1 mounted
**Notes:** REEL-07 satisfied with minimal churn; pause must dispatch within 300ms per REEL-07 SC.

---

## Phase 3 done-criteria

### Q1: What gates Phase 3 'done'?

| Option | Description | Selected |
|--------|-------------|----------|
| Automation + 1 real-device pass on user's iPhone | Playwright (WebKit/Chromium/Firefox) + axe-core + your iPhone w/ LPM + cellular emulation; full matrix deferred to POL-04 | |
| Automation only; defer all real-device QA to Phase 7 | Faster Phase 3; pushes thermal/LPM risk discovery to Phase 7 | |
| Full POL-04 real-device matrix during Phase 3 | iOS 16 + 17.0 + 17.1 + 17.2+ + Android Chrome + Firefox + Safari macOS all validated before Phase 3 closes | ✓ |

**User's choice:** Full POL-04 real-device matrix during Phase 3
**Notes:** Most aggressive QA gate; risk-front-loaded. Discovery-of-untenable-design at Phase 7 would force Phase 3 rework.

### Q2: What does the Playwright suite cover?

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll-snap + windowed-mount + leak + a11y (4 pillars) | Full coverage of the load-bearing surfaces | ✓ |
| Pillars 1-3; defer a11y to Phase 7 axe-core CI | Faster Phase 3; risk of a11y debt accumulation | |
| Scroll + windowed-mount only; defer leak + a11y | Cheapest; highest Phase 7 surprise risk | |

**User's choice:** Scroll-snap + windowed-mount + leak + a11y (4 pillars)
**Notes:** Includes axe-core on `/work` even though NAV-03 lives in Phase 4 — the `<article aria-label>` markup ships in Phase 3.

### Q3: How is thermal/battery risk validated?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual on user's iPhone: 5-min scroll + battery readings | Cheap, decisive; escalation path documented (360p ±1 cap or current-only fallback) | ✓ |
| Defer to POL-04 (Phase 7) | Phase 7 surprise risk; would force Phase 3 rework | |
| Synthetic: Lighthouse + DevTools Performance | Doesn't measure hardware decode + thermal manager | |

**User's choice:** Manual on user's iPhone: 5-min scroll + battery readings
**Notes:** Captures battery % drop as VERIFICATION artifact; >8% triggers D-16 escalation path.

### Q4: Phase 3 plan structure?

| Option | Description | Selected |
|--------|-------------|----------|
| 3 plans: foundations → lifecycle → fallback+QA | Risk-staged; each plan independently testable | ✓ |
| 2 plans: structure → lifecycle+fallback | Faster; higher in-flight risk | |
| 4 plans: structure → lifecycle → fallback → QA | Cleanest gates; more overhead | |
| 1 plan: monolithic | Risk-heavy; messy checkpoint | |

**User's choice:** 3 plans: foundations → lifecycle → fallback+QA
**Notes:** Plan 03-01 = ReelStage/ReelSection + state runes; Plan 03-02 = PreviewLoop lifecycle + URL builder; Plan 03-03 = PosterImage + fallback + QA + BrowserStack matrix.

### Q5 (follow-up): How do you actually access iOS 16 / 17.0 / 17.1 / 17.2+ for sign-off?

| Option | Description | Selected |
|--------|-------------|----------|
| BrowserStack subscription | Pay-as-you-go or monthly; real Apple silicon; ~$30-50/month | ✓ |
| User's iPhone only + simulator | Gaps on iOS 16 / 17.0 / 17.1; POL-04 closes them at Phase 7 | |
| Friend-with-older-iPhone manual social validation | Free; ad-hoc; probably incomplete | |
| Soften to: 'full matrix on current OS + best-effort older' | Reverts to original recommended gate; honest about device access | |

**User's choice:** BrowserStack subscription
**Notes:** Phase 3 plan budgets BrowserStack sessions for iOS 16, 17.0, 17.1, 17.2+ + Android Chrome. Subscription is a Phase 3 entry dependency.

---

## Claude's Discretion

Areas where Claude has explicit flexibility during planning/implementation (see CONTEXT.md `<decisions>` section for full list):
- Exact iframe URL builder file location and per-source split
- Sidecar JSON file shape (`posters.json` vs typed `.ts`)
- `static/posters/` exact subpath
- IntersectionObserver `rootMargin` shorthand variant
- `<iframe tabindex="-1">` toggle home (Phase 3 markup vs Phase 4 logic)
- URL hash debounce timing (~300ms per Pitfall 12)
- `<PosterImage>` component contract (siblings vs single composite)
- BrowserStack CI integration vs manual session runs
- Per-section play start position (default 0:00)
- REEL-05 visual specifics OR escalation to `/gsd:ui-phase 3`

---

## Deferred Ideas

Captured for future phases (see CONTEXT.md `<deferred>` section for full list):
- Data-saver toggle UI (Phase 4+ chrome work)
- REEL-05 visual specifics formal UI-SPEC
- `<iframe tabindex="-1">` per-section toggle (Phase 4 NAV-02 territory)
- In-video deep-link timestamps (per-video override)
- BrowserStack CI integration
- Save-Data HTTP header awareness (adapter-static limitation)
- EU GeoIP detection (revisit only if legal flags it)
- Per-section preview duration cap (postMessage seek)
- `prefers-reduced-data` mode (v2; mirrors `prefers-reduced-motion` posture)
- A/B traffic-split mechanism (STATE.md blocker #3; Phase 7)

Explicitly rejected anti-patterns (do NOT revisit):
- Module-scope IntersectionObserver shared across ReelStages
- Per-section IntersectionObservers (56 of them)
- `@vimeo/player` SDK for the reel (raw iframe + URL params + postMessage is the locked pattern)
- `lite-vimeo-embed` / `lite-youtube-embed`
- `100vh` / `100dvh` for scroll-snap sections (must be `100svh`)
- `scroll-snap-type: y mandatory` (must be `y proximity`)
