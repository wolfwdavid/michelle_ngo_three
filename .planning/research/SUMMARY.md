# Project Research Summary — Michelle Ngo Portfolio, Cinematic Cut (`michelle_ngo_three`)

**Synthesizes:** [STACK.md](./STACK.md) · [FEATURES.md](./FEATURES.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [PITFALLS.md](./PITFALLS.md)
**Project:** Cinematic-immersive A/B sibling of shipped `../michelle_ngo_four`. Same 56 videos, same SvelteKit stack, scroll-snapped fullscreen reels with silent muted preview loops.

---

## Executive Summary

`_three` is the cinematic-immersive A/B sibling of the shipped editorial-modern `_four`. The stack is locked byte-for-byte to `_four` (SvelteKit 2.59 / Svelte 5.55 / TS strict / Tailwind v4.3 / pnpm / GH Pages) so the A/B isolates **visual language**, not framework drift. The design makes one bold bet: every browse surface is a vertical scroll-snapped fullscreen reel where each video silently autoplays as the user enters its viewport. This bet is **more aggressive than any cited reference** — A24, MUBI, and Criterion lean stills and editorial restraint at catalog scale; the closest structural analog is TikTok's full-screen feed repurposed for arthouse.

The single highest-leverage architectural insight from research is the **unified poster-fallback codepath**: five "edge cases" — `prefers-reduced-motion`, cellular detection, iOS Low Power Mode `play()` rejection, embed-disabled-by-owner, EU GDPR default-to-poster-until-interaction — collapse into one shared design surface. Design it once; trigger from five sources. Treating them as separate features would be the project's biggest unforced error.

Iframe lifecycle is the riskiest technical area: a 4-state machine (unmounted → mounted-loading → mounted-playing → unmounting) with 5 layers of leak defense, gated by viewport-windowed mounting (current ± 1 = max 3 simultaneous iframes regardless of catalog size). **Phase 3 is the load-bearing risk phase** — 14 of 20 documented pitfalls cluster there, and iframe lifecycle blocks everything downstream.

The productivity multiplier comes from massive verbatim reuse from `_four`: ContactBlock, Footer, CategoryTag, categoryAccent.ts, validate-videos Vite plugin, Vitest data/ui split, `entries()` 70-URL prerender topology, test-prerender-coverage script, per-page SEO/JSON-LD/sitemap pattern, and `videos.json` itself all copy across byte-identically.

---

## Key Findings — Recommended Stack

**Foundation (locked from `_four`, do not relitigate):**
- SvelteKit 2.59+ · Svelte 5.55+ · TypeScript 5.9+ strict + `noUncheckedIndexedAccess` + `noImplicitOverride`
- Tailwind v4.3+ (built-in container queries, OKLCH palette, aspect-ratio utilities — no plugins needed except `@tailwindcss/typography` for prose)
- pnpm · `@sveltejs/adapter-static` · GitHub Pages auto-deploy

**Additions specific to cinematic-immersive (5 new deps):**
- `runed` — Svelte 5 rune-native `useIntersectionObserver` (lighter than `svelte-intersection-observer`, dodges `$effect`+`bind:this` cleanup bug sveltejs/svelte#12731). Use over DIY observer.
- `@sveltejs/enhanced-img` — automatic WebP/AVIF generation + responsive `<picture>` for poster fallback assets
- `@tailwindcss/typography` 0.5.19 — only Tailwind plugin needed (prose surfaces on `/about`, `/press`)
- `@playwright/test` + `@axe-core/playwright` — e2e for scroll-snap behavior; first-class WebKit support critical for iOS Safari 16+ target
- `@testing-library/svelte` + `@testing-library/jest-dom` — component testing (extends `_four`'s Vitest 4.x setup)

**Anti-patterns (do NOT add):**
- `@vimeo/player` SDK — adds ~30KB, raw iframe + URL params handles autoplay+mute+loop reliably; consider only if WATCH-02 requires auto-advance
- `lite-vimeo-embed` — stale since Nov 2023; not 2026-current
- Custom scroll-snap JS library (e.g., Swiper, Embla) — pure CSS `scroll-snap-type` is Baseline; JS libs fight iOS Safari address-bar collapse
- `svelte-intersection-observer` — has the cleanup-ordering bug; use `runed` instead

**Load-bearing CSS/browser facts:**
- **`100svh` (not `100vh`, not `100dvh`)** for scroll-snap section height — `vh` overflows on iOS Safari first paint, `dvh` constantly recalculates as the address bar animates causing CLS, `svh` is stable. All three units are Baseline as of June 2025.
- **`scroll-snap-type: y proximity`** (not `mandatory`) — `mandatory` traps users mid-scroll; `proximity` allows fast-scroll-past behavior (Mozilla bug 1959811 mitigation).
- **`playsinline`** still required on `<iframe>` for iOS Safari 16/17.0/17.1 (fixed in 17.2+ but devices remain in the wild).
- **`navigator.connection.effectiveType`** is **Chromium-only** in 2026 — Safari and Firefox return `undefined`. REEL-04 must be softened to "progressive enhancement; autoplay-by-default outside Chromium."

---

## Expected Features

**Table stakes (13 — all validated by `_four`'s shipped v1.0):**
- Reel-first impression, browsable works list, click-to-play full embed, press credits visible, contact accessible (email + phone), mobile-functional, deep-linkable filtered views, dedicated PBS landing (her flagship), about/bio surface, basic SEO/OG cards, footer with contact mirror, sitemap, HTTPS production deploy.

**Cinematic differentiators (17 — the opinionated bets):**
- Fullscreen scroll-snapped reel sections (the one big bet)
- Silent muted autoplay loops per section (`?autoplay=1&mute=1&loop=1&playsinline=1`)
- Viewport-windowed iframe mounting (current ± 1 only)
- Static-poster fallback as default with `▷ PLAY WITH SOUND` escalation
- Persistent category filter pill bar (URL-driven via `/work/[category]`)
- Cinematic-minimal TopNav with chrome-fade on reel scroll
- HeroAmbient on `/` (always-mounted muted iframe of producer reel + name overlay + scroll cue)
- Letterboxed WatchPlayer on black with chrome-fade-on-play
- "Continue the reel" same-category horizontal carousel (replaces `_four`'s rail-as-grid)
- Dark-mode-only palette
- Restrained typography (display serif for name, mono numerics, neutral sans for body)
- Per-category OKLCH accent (carried verbatim from `_four`)
- Page-Visibility-API pause on tab background
- Smooth `scroll-behavior` + section landmarks for keyboard navigation
- Reduced-motion fork (static posters; identical layout)
- `prefers-color-scheme: light` is intentionally not supported — explicit dark-only design statement
- Skip-to-content link visible only on focus

**Anti-features (17 explicit don'ts):**
- Blocking intro splash, music autoplay, custom non-skippable page transitions, video-as-cursor effects, parallax overuse, auto-unmute on first viewport entry, sticky "hire me" CTA, lightboxes for press logos, hover-required interactions on mobile, full-screen takeovers without escape, hamburger-only mobile nav, infinite scroll without filter affordance, page transitions that hide deep-linkable URLs, custom video player chrome layered over Vimeo/YouTube native, animated cursor trails, hero text that disappears as you scroll past sentinel, ambient audio.

**Accessibility-equivalent pairings (12 — every cinematic feature has a fallback):**
- Reduced-motion → static posters + same layout (not "lite mode")
- Keyboard nav → arrow keys + PageUp/PageDown jump section-to-section, `Tab` exits to TopNav, `Escape` to top
- Screen reader → each ReelSection as `<article aria-label="Video N of M: [title]">`, decorative iframe `aria-hidden="true"`
- Captions/transcripts → platform-only via `cc_load_policy=1` (YouTube) and Vimeo native captions; **no custom WebVTT in v1**
- Focus indicators → high-contrast ring tokens visible over dark video bg
- Skip-to-content → visible only on focus, lands on `<main>`
- Section landmarks → `<main>` + `<nav>` + `<footer>` (no nested `<section>` salad)
- Color contrast → WCAG AA 4.5:1 minimum on overlays (gradient strength + text-shadow gates)
- Touch targets → 44×44 minimum on filter pills + nav links
- Motion-safe Tailwind utilities (`motion-safe:animate-*`) for every animated affordance
- `aria-current="page"` on active filter pill + TopNav link
- `prefers-reduced-data` → posters even on Wi-Fi if user opts in (Chromium-only progressive enhancement)

**Surface treatments (specific, not "TBD"):**
- **PBS American Portrait (`/pbs-american-portrait`)** — 18-section fullscreen reel; section zero is the verbatim PBS blockquote (reused from `_four`) over a still; 15 of 18 sections carry a `See on PBS →` badge linking to collection URL.
- **Press (`/press`)** — vertical scroll-snap stack of 13 prestige-ordered credits; each section is a fullscreen still from the credit's source video + network logo + "About this credit" caption + `▷ Watch` CTA linking to `/watch/[id]`. Inherits prestige order from `_four` exactly.
- **About (`/about`)** — bio (reused verbatim from `_four`) overlaid on an ambient muted reel loop (the same producer reel as `/`'s hero); ContactBlock embedded below; ABT-01 ambiguous between "still" vs "muted loop" — recommend muted loop for design consistency, but `_four`'s headshot deferral (D-20) should be revisited.
- **Contact (`/contact`)** — minimal: ContactBlock centered over a static poster (one of Michelle's most prestigious credits) with name in display serif above. Reuses `ContactBlock` from `_four`.
- **Watch (`/watch/[id]`)** — letterboxed Vimeo/YouTube embed on full black; metadata (title, uploader, category, year) fades in below player on idle, fades out on play; horizontal `ContinueReelRail` of same-category siblings beneath; chrome-fade behavior uses Vimeo/YouTube native postMessage events for play/pause state.

---

## Architecture Approach

**Component hierarchy (13 components, single-line responsibilities):**

New (cinematic-specific):
- `ReelStage` — scroll-snap container; owns IntersectionObserver + `mountedIds` state + activeIdx; provides context to children
- `ReelSection` — one fullscreen `<article>` per video; renders PreviewLoop or PosterImage based on `mountedIds`
- `PreviewLoop` — the muted iframe with lifecycle (4-state machine + 5-layer leak defense)
- `PosterImage` — static fallback (Vimeo `vumbnail` or YouTube thumbnail proxied through `enhanced-img`)
- `FilterPillBar` — sticky URL-driven category filter (8 pills + "All" reset)

Adapted from `_four` (restyled, same contract):
- `HeroAmbient` (was `HeroPoster`) — always-mounted muted iframe of producer reel + name/tagline/scroll-cue overlay
- `TopNav` — cinematic-minimal fork with chrome-fade on reel scroll
- `MobileMenu` — restyled full-screen overlay
- `WatchPlayer` — extracted letterboxed embed with chrome-fade-on-play (chrome state driven by Vimeo/YouTube postMessage events)
- `ContinueReelRail` — horizontal scroll carousel of same-category siblings (replaces `_four`'s grid rail)

Verbatim reuse from `_four`:
- `ContactBlock` — single `mailto:` source-of-truth on `/contact`, `/about`, and `<Footer />`
- `Footer` — 3-column desktop / 1-column mobile; restyled palette only
- `CategoryTag` — span/anchor variant; same OKLCH accent helper
- `categoryAccent.ts` — 8 OKLCH category colors as `@theme` tokens

**State ownership (explicit, no "TBD"):**
- **Active reel index + `mountedIds`** — component-local `$state` in `ReelStage`, exposed via `setContext('reel:mountedIds')`. NOT module-scope (would bleed across `/work`, `/work/[cat]`, `/pbs-american-portrait`).
- **Connection effectiveType + reduced-motion preference** — module-scope runes in `$lib/state/network.svelte.ts` and `$lib/state/motion.svelte.ts`. App-wide singletons.
- **Active category filter** — **URL only** (`$app/state` `page.url.pathname`). Anti-pattern guard: never duplicate in a Svelte store; URL is the canonical source. Same as `_four` D-08.
- **TopNav chrome visibility** — component-local `$state` + `$effect` IO, mirroring `_four/src/lib/components/TopNav.svelte:56-89` exactly.

**Iframe lifecycle (the load-bearing decision — 4-state machine):**
```
unmounted ──[enter ±1 window]──→ mounted-loading
                                        │
                                  (postMessage: ready)
                                        ↓
                                 mounted-playing
                                        │
                                  [leave ±1 window]
                                        ↓
                                  unmounting (cleanup)
                                        ↓
                                   unmounted
```

5-layer leak defense:
1. Svelte `{#if}` block teardown drives DOM unmount (Svelte handles native listener cleanup)
2. Vimeo/YouTube adapter layer (`$lib/iframe/vimeoAdapter.ts`, `$lib/iframe/youtubeAdapter.ts`) exposes `dispose()` that clears postMessage handlers
3. ONE `IntersectionObserver` per `ReelStage` mount (not per `ReelSection`; observe N children); `disconnect()` in `$effect` cleanup
4. Named postMessage listener references for clean `removeEventListener` (NOT inline closures)
5. `MessageEvent.origin` filtering — discard all non-`player.vimeo.com`/`youtube.com` messages

**Data flow:** `src/lib/data/videos.json` → Zod schema → Vite build-fail plugin → `$lib/data/index.ts` typed exports (`videos`, `getById`, `getByCategory`) → `+page.ts` loader filters by category → `+page.svelte` consumes via `data` prop → passes to `<ReelStage videos={data.videos} />`. Filter happens in `+page.ts` (server-time at prerender), NOT client-side `$derived`.

**Route structure (7 routes, mirrors `_four` for A/B parity):**
- `/` — `HeroAmbient` (always-mounted) + scroll into first sections of full reel
- `/work` — `<ReelStage videos={all56} />`
- `/work/[category]` — `<ReelStage videos={categoryFiltered} />` × 8 prerendered slugs via `entries()`
- `/watch/[id]` — `<WatchPlayer />` + `<ContinueReelRail />` × 56 prerendered ids via `entries()`
- `/pbs-american-portrait` — verbatim PBS blockquote section + `<ReelStage videos={pbs18} />`
- `/press` — vertical scroll-snap stack of 13 prestige-ordered credits
- `/about` — bio over ambient loop + `<ContactBlock />`
- `/contact` — minimal `<ContactBlock />` over static poster

**Build order (critical edges):**
1. **Foundation** → 2. **Data Layer** (verbatim from `_four`) → 3. **Reel System Core** (BLOCKS everything downstream — if iframe lifecycle is unsound on real iOS Safari, project pivots) → 4. **Wayfinding** (FilterPillBar + 8 category routes + cinematic TopNav) → 5. **Hero & Watch** (depends on iframe lifecycle proven in Phase 3) → 6. **PBS / Press / About / Contact** (max reuse from `_four`) → 7. **Polish & Cutover** (mirror `_four`'s Phase 7 exactly).

**Anti-patterns called out:**
1. Mounting all 56 iframes ("preloading") — use viewport-windowed ±1 only
2. Duplicating filter state in a Svelte store — URL is the only source of truth (matches `_four` D-08)
3. Module-scope shared IntersectionObserver — instantiate per `ReelStage` mount (route bleed otherwise)
4. Inline-closure postMessage listeners — use named references for `removeEventListener`
5. Module-scope `activeIdx` rune — component-local only (multi-route bleeding)
6. Per-section IntersectionObservers (56 of them) — one observer in `ReelStage`, observe children

---

## Critical Pitfalls

**iOS Safari traps (verified 2026-current, not 2022 lore):**
- `playsinline` scroll-freeze fixed in iOS 17.2; iOS 16 and 17.0/17.1 devices still in wild → **`playsinline=1` required**
- Low Power Mode rejects `play()` even on muted+autoplay → **fallback codepath catches this; user sees PosterImage + `▷ PLAY` CTA**
- `scroll-snap-stop: always` traps users → **omit; use `proximity` not `mandatory`**

**Bandwidth / data-cost:**
- Without windowing, 56 iframes ≈ 50-100MB/min on a moderate connection — unusable on cellular
- With ±1 windowing + cellular fallback: ~3-5MB/min typical browsing session
- **Cross-cutting fallback codepath is the only defense; design once**

**Battery / thermal:**
- 1-3 simultaneous iframes on a 2-year-old phone manifests as fan + frame-rate drop within ~3 min of sustained reel browsing
- **Page Visibility API pause on tab background is non-negotiable** (most browsers don't auto-pause hidden iframes)

**Vimeo / YouTube API gotchas:**
- Some videos disable embeds → discovered at runtime (no build-time API to check) → **add oEmbed health-check to Vite plugin in Phase 2 (Trap A mitigation)**
- YouTube thumbnail URLs change format; Vimeo's `vumbnail.com` is unofficial → **self-host posters via `enhanced-img` at build time**
- EU IPs trigger Vimeo/YouTube cookie banners inside the iframe → **interaction-as-consent posture; document in Launch Runbook**

**Scroll-snap UX failures:**
- Browser back from `/watch/[id]` loses position → **`history.state` + hash fragment to restore section (`/work#video=620232398`)**
- Keyboard `PageUp/PageDown` doesn't natively snap → **JS handler that calls `section.scrollIntoView()` for arrow keys + PageUp/PageDown**
- Screen reader announces every section as a separate page → **use `<article>` not `<section>` to suppress landmark spam**

**SEO traps:**
- `/work` is essentially a feature page, not an index — the SEO is on `/watch/[id]` (56 deep-link targets) and `/work/[category]` (8 deep-link filters)
- VideoObject JSON-LD on each `/watch/[id]` (carry from `_four` Phase 7)
- Sitemap.xml lists all 70 prerendered URLs (matches `_four`)

**A/B integrity traps (5 specific risks):**
- **Trap A: videos.json drift** — `_three` and `_four` diverge silently if both are edited. **Mitigation: cross-repo byte-diff CI check in Phase 2**
- **Trap B: OG image asymmetry** — different shapes/aspects produce different social-media first impressions, contaminating A/B. **Mitigation: identical OG image dimensions + JSON-LD shape**
- **Trap C: Sitemap canonical conflicts** — both siblings list `michellengo.net/*` once live, confusing crawlers. **Mitigation: only the A/B winner's sitemap is published; loser stays on staging URL**
- **Trap D: Shared `wolfwdavid.github.io` localStorage** — both siblings share the apex domain origin; persistent state from one bleeds into the other. **Mitigation: namespace all localStorage keys as `mnp_three_*`**
- **Trap E: Divergent entry routes** — if marketing pushes `/work` to one cohort and `/` to another, you measure copy, not design. **Mitigation: identical entry-route distribution in A/B traffic-split mechanism (TBD by user)**

**Cutover gotchas:**
- Inherit `_four`'s D-05 (GitHub Pages override), D-16 (atomic noindex flip), `deploy-production.yml`, and 9-step Launch Runbook **verbatim**.

---

## Implications for Roadmap

**Suggested phases: 7** (mirrors `_four`'s shape; A/B requires structural parity)

| # | Phase | Goal | Delivers | Addresses | Avoids |
|---|-------|------|----------|-----------|--------|
| 1 | Foundation | Buildable, deploying scaffold | SK2 + S5 + TS strict + Tailwind v4 + Vitest split + Playwright + axe + `runed` + `enhanced-img` + GH Pages auto-deploy with `BASE_PATH=/michelle_ngo_three/` | FOUND-01, FOUND-02 | Skipping focus tokens / `PUBLIC_SITE_URL` env / namespaced localStorage from day one |
| 2 | Data Layer | Same-as-`_four` source-of-truth | Verbatim videos.json copy + Zod schema + Vite plugin + `$lib/data` surface + cross-repo byte-diff CI + oEmbed health-check | DATA-01..03 | Trap A (videos.json drift) + runtime "embed disabled" surprises (Pitfall 4/16) |
| 3 | Reel System Core ⚠ HIGHEST RISK | Killer feature working on real iOS | `<ReelStage />` + `<ReelSection />` + `<PreviewLoop />` + `<PosterImage />` + 4-state lifecycle + 5-layer leak defense + unified 5-trigger fallback codepath + IntersectionObserver windowing + real-device iOS QA gate | REEL-01..05 | 14 of 20 pitfalls cluster here; iframe leaks; Low Power Mode breakage; cellular blowout |
| 4 | Wayfinding | Discoverable in 56-section reel | `<FilterPillBar />` + 8 prerendered `/work/[category]` routes + cinematic `<TopNav />` with chrome-fade + keyboard nav + skip-to-content | FILT-01..04, NAV-01 | Scroll-snap traps (Pitfall 7); screen-reader page-explosion (Pitfall 8) |
| 5 | Hero & Watch | Entry + playback surfaces | `<HeroAmbient />` (always-mounted) + `<WatchPlayer />` letterbox + chrome-fade-on-play + `<ContinueReelRail />` + back-nav scroll restoration via `history.state` | HERO-01..03, WATCH-01..03 | Pitfall 12 (back-nav lost position); Pitfall 17 (chrome over native player chrome) |
| 6 | PBS / Press / About / Contact | Content pages with max reuse | `/pbs-american-portrait` (18-section reel + verbatim blockquote) + `/press` (13 prestige sections) + `/about` (bio over ambient loop) + `/contact` (poster + `<ContactBlock />`) + restyled `<Footer />` | PBS-01..03, PRES-01, ABT-01, CONT-01..02 | Re-authoring assets that exist verbatim in `_four` |
| 7 | Polish & Cutover | Production-ready + A/B-eligible | Per-page SEO + OG cards + Person JSON-LD on `/about` + VideoObject JSON-LD on every `/watch/[id]` + sitemap.xml + Lighthouse CI (LCP 2.5s budget) + axe-core CI + real-device QA matrix + cutover infra (`static/CNAME` + `deploy-production.yml` + D-16 atomic noindex flip + 9-step Launch Runbook) | POL-01..04, FOUND-03 | Trap B/C/D/E (A/B asymmetry); SEO collisions; D-16 deferral |

### Phase Ordering Rationale

- **Foundation first** because `BASE_PATH` + focus tokens + `PUBLIC_SITE_URL` + namespaced localStorage must be in from day one (retrofitting `mnp_three_*` namespacing is painful)
- **Data Layer second** because it's verbatim reuse from `_four` (lowest risk, unblocks Phase 3 quickly)
- **Reel System Core third (and load-bearing)** because if iframe lifecycle is unsound on real Safari iOS, the project pivots — front-load the risk
- **Wayfinding fourth** because FilterPillBar is co-dependent with ReelStage (the reel without the pill bar is browse-hostile + a WCAG navigation failure)
- **Hero & Watch fifth** because HeroAmbient and WatchPlayer both depend on iframe-lifecycle pattern proven in Phase 3
- **Content pages sixth** because they're maximum verbatim reuse from `_four`; cinematic restyle is shallow styling work
- **Polish & Cutover seventh** mirroring `_four`'s Phase 7 exactly (A/B requires same launch posture)

---

## Research Flags

**Needs `/gsd:research-phase` before planning:**
- **Phase 3 (HIGHEST priority)** — Resolve REEL-04 Chromium-only ambiguity at entry; iframe lifecycle pattern needs concrete validation on iOS Safari 16/17.0/17.1 real devices; postMessage handshake timing
- **Phase 5 (MEDIUM)** — postMessage handshake for chrome-fade-on-play timing; back-nav `history.state` semantics across browsers
- **Phase 7 (MEDIUM)** — EU GDPR posture decision (inherit `_four`'s no-CMP "interaction = consent" or escalate); real-device LCP measurement methodology; A/B traffic-split mechanism

**Standard patterns (skip phase research):**
- Phase 1 (mirrors `_four`)
- Phase 2 (verbatim reuse from `_four`)
- Phase 4 (URL-as-state is canonical; `entries()` proven on `_four`)
- Phase 6 (max reuse from `_four`)

---

## Confidence Assessment

**Overall: HIGH** — version data verified via live npm registry timestamps (2026-current); browser-support claims verified via caniuse/MDN; sibling `_four`'s shipped package.json + svelte.config + vite.config + lib tree read directly.

| Area | Level | Source |
|------|-------|--------|
| Locked foundation (SK/Svelte/TS/Tailwind/pnpm/Node) | HIGH | Read directly from `_four/package.json` |
| Embed lifecycle (raw iframe pattern) | HIGH | Vimeo official docs + npm staleness check |
| Network detection (Chromium-only constraint) | HIGH | caniuse + MDN both confirm |
| Scroll-snap + `svh` | HIGH | WebKit bug 261185 + viewport-units Baseline 2025-06 |
| IntersectionObserver via `runed` | HIGH | Official runed docs + active 2026 maintenance |
| Tailwind v4 specifics | HIGH | Tailwind v4 release notes |
| `@sveltejs/enhanced-img` | HIGH | Official SvelteKit Images docs |
| Lighthouse-CI / Playwright | HIGH | Live npm + Vitest 2026 official guidance |
| iOS Safari behavior (Pitfalls 1, 2, 3) | HIGH | Apple Developer Forums + 2024-2025 writeups |
| Vimeo/YouTube embed APIs | HIGH | Vendor official docs + GitHub issue trail |
| WCAG accessibility | HIGH | Canonical SC references (2.2.2, 2.3.3, 2.4.1, 2.4.6, 2.4.7) |
| EU/GDPR | HIGH | Complianz + Cookiebot + Kukie.io agree |
| A/B trap analysis | MEDIUM-HIGH | Inferred from project constraints; no published precedent |
| Filter-route position hash (`history.replaceState`) | MEDIUM | Standard UX pattern; specific debounce tuning is implementation-time |

---

## Gaps to Address (highest-leverage first)

1. **REEL-04 spec on iOS Safari / Firefox** — `navigator.connection.effectiveType` is Chromium-only; must resolve before Phase 3 entry. Recommend softening REEL-04 to "progressive enhancement; autoplay-by-default outside Chromium; manual `▷ PLAY WITH SOUND` always available."
2. **EU GDPR compliance posture** — inherit `_four`'s no-CMP "interaction-as-consent" pattern explicitly in Launch Runbook, OR escalate to legal counsel.
3. **`@vimeo/player` SDK vs raw postMessage** — recommend raw postMessage in Phase 3 RESEARCH; defer SDK decision unless WATCH-02 auto-advance requires it.
4. **`/about` ambient still vs muted reel loop** — ABT-01 ambiguous; delegate to Phase 6 UI-SPEC. Recommend muted loop for design consistency.
5. **A/B traffic-splitting mechanism + identical entry routes** — Trap E mitigation; user decision required before Phase 7 cutover.
6. **Cross-repo `videos.json` byte-diff CI** — Trap A; Phase 2 deliverable.
7. **HeroAmbient cellular / LPM fallback consistency** — Phase 5 UI-SPEC.
8. **Gradient strength + text-shadow values for overlay legibility** — Pitfall 20; Phase 7 manual sweep against actual 56 posters.

---

## Critical Cross-Cutting Decisions (Surfaced Prominently)

1. **Unified poster-fallback codepath** — 5 triggers collapse into one component (`PosterImage` + `▷ PLAY WITH SOUND`). The single highest-leverage architectural decision in the project. Treating them as separate features is the biggest unforced error.
2. **REEL-04 Chromium-only blocker** — `navigator.connection.effectiveType` returns undefined in Safari/Firefox. PROJECT.md needs softening before Phase 3 entry.
3. **`100svh` (not vh, not dvh) for scroll-snap sections** — load-bearing; document in Phase 3 ADR.
4. **Iframe lifecycle = 4-state machine + 5-layer leak defense** — highest-risk technical area; prevents WebKit detached-element leak family (bug 227194).
5. **Phase 3 is the load-bearing risk phase** — 14 of 20 pitfalls cluster there; iframe lifecycle blocks everything downstream; front-load the risk.
6. **A/B integrity traps (5 specific risks)** — videos.json drift, OG asymmetry, sitemap canonicals, shared localStorage, divergent entry routes. All need explicit mitigation.
7. **Massive verbatim reuse from `_four`** — productivity multiplier across Phases 1, 2, 6, 7.
8. **The bet `_three` makes is more aggressive than its references** — A24/MUBI/Criterion don't do full-screen scroll-snap reels at catalog scale; closest analog is TikTok repurposed for arthouse. Less precedent to copy; more real-device validation needed; the A/B genuinely measures an opinionated bet.

---

## Ready for Requirements

Research is complete. PROJECT.md's req scaffold (FOUND-01..03, DATA-01..03, REEL-01..05, FILT-01..04, NAV-01, HERO-01..03, WATCH-01..03, PBS-01..03, PRES-01, ABT-01, CONT-01..02, POL-01..04) covers the table-stakes + cinematic-differentiator + accessibility-equivalent surfaces identified above. REQUIREMENTS.md should formalize these with REQ-IDs and the v1/v2/out-of-scope split, then ROADMAP.md maps them to the 7 phases above.

---
*Synthesis completed: 2026-05-19*
