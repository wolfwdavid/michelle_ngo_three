<!-- GSD:project-start source:PROJECT.md -->
## Project

**Michelle Ngo Portfolio — Cinematic Cut**

A second, contrasting design of **Michelle Ngo**'s filmmaker portfolio — built as a sibling to `../michelle_ngo_four` (which shipped as the editorial-modern v1). Same 56 deduped videos, same hiring-producer audience, same SvelteKit stack — but a **cinematic-immersive** visual language: dark full-bleed, scroll-snapped fullscreen reels with silent muted preview loops, a persistent category filter pill bar for wayfinding, and an A24 / MUBI / Criterion aesthetic that lets the films breathe. The two builds will be A/B-evaluated and the preferred direction will own the production `michellengo.net` cutover.

**Core Value:** A hiring producer can scroll through Michelle's filmography like a cinema reel — each video taking the full screen with silent motion — and feel the work the way they would in a screening room, not a portfolio grid.

### Constraints

- **Tech stack**: SvelteKit 2.59+ + Svelte 5.55+ + TypeScript 5.9+ strict (+ noUncheckedIndexedAccess + noImplicitOverride) + Tailwind v4.3+ + pnpm — locked to match `_four` exactly so the A/B isolates *design*, not framework ergonomics
- **Data**: `videos.json` byte-identical to `_four`'s; same Zod schema; same Vite build-fail plugin
- **Hosting**: Static-export-friendly (`@sveltejs/adapter-static`); deploys to GitHub Pages (matches `_four`'s D-05 override)
- **Domain**: `michellengo.net` stays on WordPress.com until A/B winner is chosen; staging at `wolfwdavid.github.io/michelle_ngo_three/` during dev
- **Compatibility**: Modern evergreen browsers only — iOS Safari 16+, Chrome/Edge/Firefox current. Scroll-snap + IntersectionObserver are non-negotiable load-bearing APIs.
- **Performance**: Cinema-first, not speed-first — LCP target 2.5s on 4G (looser than `_four`'s 2.0s). Viewport-windowed iframes + cellular poster fallback are the budget's load-bearing decisions.
- **Bandwidth ethics**: On cellular, default to poster + tap-to-play. Never autoplay 56 video iframes on metered connections.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## TL;DR — Recommendations at a Glance
## Locked Foundation (mirrors `../michelle_ngo_four/package.json`)
### Core Technologies (LOCKED)
| Technology | Version (sibling floor) | Current 2026 | Purpose | Why Recommended |
|------------|-------------------------|--------------|---------|-----------------|
| `@sveltejs/kit` | 2.59.1 | 2.60.1 (npm 2026-05) | Meta-framework, routing, SSG | Locked by PROJECT.md constraints; matches `_four` exactly for valid A/B |
| `svelte` | 5.55.5 | 5.55.8 | Runes-based reactive component framework | Svelte 5 runes (`$state`, `$effect`, `$derived`) are non-negotiable for the rune-native ecosystem the addons below target |
| `typescript` | 5.9.3 | 5.9.x | Type system | `strict` + `noUncheckedIndexedAccess` + `noImplicitOverride` per sibling tsconfig.json — keeps array indexing honest, critical for the 56-video reel |
| `tailwindcss` | 4.3.0 | 4.3.0 | Utility-first CSS | v4 is CSS-first (`@theme` block in app.css), built-in container queries, OKLCH palette by default |
| `@tailwindcss/vite` | 4.3.0 | 4.3.0 | Tailwind Vite plugin | Mandatory v4 integration path (vite plugin BEFORE sveltekit() per sibling vite.config.ts comment) |
| `vite` | 8.0.7 | 8.6.0 (current 2026) | Build tool | Vite 8 ships with sibling; safe to track patches |
| `@sveltejs/adapter-static` | 3.0.10 | 3.0.10 | Static export | Required for GitHub Pages; `fallback: '404.html'`, `strict: true` per sibling |
| `@sveltejs/vite-plugin-svelte` | 7.1.2 | 7.x | Svelte/Vite glue | Required peer; match sibling |
| `pnpm` | 11.0.9 (packageManager pin) | 11.x | Package manager | Pin in `package.json` `packageManager` field; CI uses same |
| `node` | ≥22 (engines) | 22.x LTS | Runtime | Engines pin in package.json mirrors sibling |
### Toolchain (LOCKED — mirror sibling)
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| `eslint` | 9.39.4 | Lint | Flat config (`eslint.config.js`), matches sibling |
| `@eslint/js` + `typescript-eslint` + `eslint-plugin-svelte` + `globals` | 9.39.4 / 8.59.2 / 3.17.1 / 17.6.0 | Lint ecosystem | Match sibling versions byte-for-byte |
| `prettier` | 3.8.3 | Format | + `prettier-plugin-svelte` 3.5.1 |
| `husky` | 9.1.7 | Pre-commit hooks | + `lint-staged` 17.0.4 |
| `svelte-check` | 4.4.6 | Type-check Svelte | Run in `pnpm check` |
| `zod` | 4.4.3 | Schema validation | Reused for `videos.json` validation plugin (DATA-02) |
| `vitest` | 4.1.5 | Test runner | + `@vitest/coverage-v8` 4.1.5; data/ui project split per sibling vite.config.ts |
| `jsdom` | 29.1.1 | DOM in tests | Locked because `vitest-setup-ui.ts` depends on it |
| `@types/node` | 22.19.18 | Node typings | Match sibling |
## Cinematic-Layer Additions (the actual research output)
### Embed Lifecycle (Question 1) — HIGH CONFIDENCE
| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **Raw iframe + Svelte 5 `$effect` cleanup** | — (no dep) | Mount Vimeo/YouTube iframes with `?autoplay=1&muted=1&loop=1&background=1` (Vimeo) / `?autoplay=1&mute=1&loop=1&playlist=<id>` (YouTube); unmount = replace `<iframe>` with `<img poster>` | HIGH |
- Adds postMessage listener overhead per iframe. With 3 simultaneously-mounted iframes, that's 3 listener pairs swapping every snap. Raw iframe `src` swap has zero listener cost.
- Provides a JS API (`.play()`, `.pause()`, `.on('ended')`) that the silent muted background-loop use case doesn't need — URL params already do it.
- Svelte 5 `$effect` cleanup ordering bug (sveltejs/svelte#12731) makes `bind:this` + third-party observer libs error-prone. Native iframe lifecycle dodges this entirely.
- **When TO use `@vimeo/player`:** ONLY on the `/watch/[id]` page (WATCH-01) IF you need precise sound-on playback events for analytics or "Continue the reel" auto-advance. Even there, raw iframe + the `?api=1` postMessage handshake is enough. Defer this dep until proven necessary.
- **Stale.** Three years of no maintenance is a red flag for a load-bearing dep on a shipping site.
- Designed for poster-first lazy-load (which is good!) but it's a custom element with its own lifecycle — clashes with Svelte 5's reconciler when you want fine-grained ±1 mount control.
- Better pattern: borrow its **poster-image-first approach** in our own component, no dep needed.
- Actually maintained and current! Genuinely good for a "click poster → embed iframe" pattern.
- BUT: optimized for the click-to-play use case. Our reel needs **automatic** mount-on-scroll, not click. Wrapping `lite-youtube-embed` in our IntersectionObserver to fake automatic mount is more code than just rendering the iframe ourselves.
- **When TO use it:** If we add a "PLAY WITH SOUND" CTA that swaps the muted-loop iframe to a full-fidelity click-to-play one on `/watch/[id]`, `lite-youtube-embed` is a reasonable choice for that specific click-to-play moment. Probably not worth the dep.
- `svelte-vimeo-player` 0.1.3 — very low version, unclear Svelte 5 rune compatibility, low downloads, abandoned-looking.
- `svelte-lite-youtube-embed` 1.1.0 — exists, but Svelte 5 runes adoption is unclear and wrapping a custom element in Svelte adds zero value.
### Network/Bandwidth Detection (Question 2) — HIGH CONFIDENCE on the constraint, MEDIUM on the workaround
- caniuse.com/netinfo — "Not supported in Safari, Firefox"
- MDN Network Information API page — Firefox/Safari mark "no"
### Scroll-Snap (Question 3) — HIGH CONFIDENCE
| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **Pure CSS `scroll-snap-type: y mandatory`** | — (no dep) | Fullscreen vertical scroll-snap reel | HIGH |
| **`svh` viewport unit for section height** | — (CSS native) | Avoid iOS Safari address-bar collapse causing layout jump | HIGH |
- `100vh` on iOS Safari = viewport with chrome HIDDEN. On first paint (chrome shown), 100vh overflows by ~80px causing layout shift on scroll.
- `100dvh` resizes constantly as the address bar animates. Combined with `scroll-snap` this causes scroll-snap recalculation → janky snapping on iOS.
- `100svh` = smallest viewport (with chrome visible). Fits on first paint, doesn't resize on chrome collapse → scroll-snap stable. WebKit bug 261185 confirms `svh` is the safe choice for scroll-snap layouts.
- Embla is for **horizontal carousels** (think "Continue the reel" rail on `/watch/[id]` — see below). Using it for full-page vertical snap is fighting the library.
- It's a reasonable pick for WATCH-02's horizontal "Continue the reel" carousel. Keep it for that, not the main reel.
- Heavy (~150KB). Built for image carousels with thousands of features (lazy-loading, virtual slides, etc.) we don't need.
- Vertical snap with all 56 sections would invite virtual-slide complexity that conflicts with our manual ±1 mount logic.
- **Anti-pattern for this project.**
- CSS `scroll-snap` is universally supported in all target browsers (iOS 16+, current Chrome/Edge/Firefox per PROJECT.md constraints).
- The only browser that fights it is iOS Safari with the address-bar collapse — and `svh` solves that.
- JS scroll-snap libs (e.g., `fullpage.js`, `react-scroll-snap`) re-implement what the browser already does, badly, and break IntersectionObserver timing.
### IntersectionObserver Helpers (Question 4) — HIGH CONFIDENCE
| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`runed`** | 0.37.1 (current 2026-01) | Svelte 5 rune-native utilities including `useIntersectionObserver`, `IsInViewport` | HIGH |
- Built by `svecosystem` (the same group behind major Svelte 5 libs).
- Actively maintained: 0.36.0 (2025-11) → 0.37.1 (2025-12) → still iterating through 2026.
- **Rune-native** — uses `$state` getters, `$effect` cleanup automatically, no manual listener teardown.
- `useIntersectionObserver` API includes `pause()` / `resume()` / `stop()` — useful for pausing observers when off-tab.
- `IsInViewport` is a higher-level wrapper on top of `useIntersectionObserver` if you just want boolean visibility.
- Republished in Jan 2026 after a multi-year gap (1.0.0 was 2024-01, 1.1.0 was 2026-01-19). It IS maintained again — credit where due.
- But it's component-based (`<IntersectionObserver let:intersecting>`) not rune-based, which is awkward in Svelte 5.
- Doesn't compose as cleanly with `$derived` (e.g., "visible OR adjacent-to-visible") — runed's getter pattern does.
- DIY is **fine** and totally viable — IntersectionObserver is a 20-line wrapper. But the rune-cleanup ergonomics of `runed` save real bugs (the Svelte 5 `bind:this` + `$effect` ordering issue from #12731 is non-obvious).
- If you want to avoid the dep, DIY is the next-best pick. Don't reach for `svelte-intersection-observer`.
### Tailwind v4 for Full-Bleed Dark Cinema UI (Question 5) — HIGH CONFIDENCE
| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`@tailwindcss/typography`** | 0.5.19 | Long-form prose styling for `/about` bio, `/press` credits, PBS blockquote | HIGH |
| (No other plugins) | — | v4 built-ins cover the rest | HIGH |
- **Container queries** — `@container` / `@sm:` / `@md:` are built-in in v4. **Do NOT install `@tailwindcss/container-queries`.**
- **Aspect ratio** — `aspect-video`, `aspect-square`, arbitrary `aspect-[16/9]` are built-in. **Do NOT install `@tailwindcss/aspect-ratio`.**
- **Animation** — `animate-*` utilities + CSS-first `@theme` keyframes obviate `animate.css`.
### Performance Tooling (Question 6) — HIGH CONFIDENCE
| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`@sveltejs/enhanced-img`** | 0.10.4 (current 2026-03) | Build-time poster generation: WebP + AVIF + JPEG fallback, blur-up placeholders | HIGH |
| **`sharp`** | 0.34.5 | Image transform engine (peer dep of enhanced-img — pnpm auto-installs) | HIGH |
| **`@lhci/cli`** | 0.15.1 (Lighthouse 12.6.1) | CI Lighthouse gating against POL-02's 2.5s LCP budget | HIGH |
- First-party. Maintained by the SvelteKit team. Tracks SvelteKit releases.
- Works with `adapter-static` — generates static assets at build time, no runtime image server needed (GitHub Pages doesn't have one).
- `_four` likely already uses it for its hero WebP per `_four`'s design DNA notes — keep consistent.
### Testing (Question 7) — HIGH CONFIDENCE
| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`vitest`** (locked from sibling) | 4.1.5 | Unit + component tests, data/ui project split | HIGH |
| **`jsdom`** (locked from sibling) | 29.1.1 | DOM environment for ui project | HIGH |
| **`@testing-library/svelte`** | 5.3.1 | Component test helpers (mount, query, fire events) — Svelte 5 compatible | HIGH |
| **`@testing-library/jest-dom`** | 6.9.1 | Custom matchers (`.toBeInTheDocument()` etc.) | HIGH |
| **`@playwright/test`** | 1.60.0 (current 2026) | E2E scroll-snap + reel viewport-windowing on real Chromium/WebKit/Firefox | HIGH |
| **`@axe-core/playwright`** | 4.11.4 | Accessibility scan in e2e suite | HIGH |
- Official Vitest guidance for 2026 explicitly states: "If you don't already use WebdriverIO, it's not recommended for Vitest Browser Mode — stick with Playwright."
- Playwright auto-waits, single automation engine, faster.
- First-class iOS Safari (WebKit) testing — critical because PROJECT.md targets iOS Safari 16+ as a load-bearing browser.
- More mature ecosystem for the `@axe-core/playwright` accessibility integration.
- 4.1.6 exists and works, but adds Playwright as a transitive dependency just to run component tests in a real browser. The jsdom + mock pattern is sufficient for component unit tests; e2e (where real-browser matters) is already covered by Playwright separately.
- If we add `@vitest/browser` later for component tests that need real `IntersectionObserver` (i.e., when mock fidelity becomes a bottleneck), do it as a follow-up.
### Accessibility (Question 8) — HIGH CONFIDENCE
| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`@axe-core/playwright`** | 4.11.4 | Axe-core accessibility scan in e2e tests | HIGH |
| **`axe-core`** | 4.11.4 (peer) | Underlying engine | HIGH |
| Tailwind v4 `motion-safe:` / `motion-reduce:` variants | (built-in) | CSS-level reduced-motion guards | HIGH |
- iframes need `title` attribute (Vimeo/YouTube embed title).
- Sticky filter pills (FILT-01) need `aria-current="page"` on the active pill, focus-visible ring, keyboard nav.
- TopNav fade (NAV-01) must NOT hide chrome from screen readers — use `opacity-0` with `pointer-events-none` only, never `display:none` or `visibility:hidden`.
- Every iframe needs `allow="autoplay; fullscreen; picture-in-picture"` (no `encrypted-media` — we don't DRM these).
### CI/CD (Question 9) — HIGH CONFIDENCE
- `actions/setup-node@v4` with `cache: 'pnpm'` is the supported pnpm cache path. **Don't** roll your own `actions/cache@v4` block — setup-node's built-in cache handles invalidation correctly.
- The cache key is `pnpm-lock.yaml` hash — committing `pnpm-lock.yaml` (which sibling does) is required.
- Expect 30-50% install speedup on warm cache. Cold cache install on a fresh runner is ~45s; warm is ~10-15s for this stack size.
- `BASE_PATH: ''` (apex domain, no subpath)
- `static/CNAME` containing `michellengo.net`
- Only triggers manually or on a release tag (cutover-gated)
- `pnpm/action-setup@v4` (NOT @v3 — v3 is deprecated as of late 2025)
- `actions/setup-node@v4`, `actions/checkout@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4` — all current major versions as of 2026-05
- `node-version: 22` (LTS, matches `engines.node` in package.json)
- `version: 11.0.9` for pnpm (matches `packageManager` field exactly — `corepack` will use this same version locally too)
## Full Installation Command Block
# (Foundation comes from `pnpm create svelte@latest` + manual sync with _four's package.json — see VERSION FLOOR section)
# Cinematic-layer ADDITIONS only (deltas vs _four):
# Testing additions:
# Performance gating in CI (optional):
# Then install Playwright browser binaries (one-time per dev machine + CI):
## Alternatives Considered (and Rejected)
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Raw iframe + `runed` IntersectionObserver | `@vimeo/player` 2.30.4 | ONLY if `/watch/[id]` needs precise sound-on playback events (e.g., auto-advance, analytics). Even then, evaluate `?api=1` + raw postMessage first. |
| Raw iframe (Vimeo) | `lite-vimeo-embed` 0.3.0 | Never — stale (2023-11), no automatic mount control |
| Raw iframe (YouTube) | `lite-youtube-embed` 0.3.4 | If you add a discrete "click poster → swap to iframe" interaction that's NOT viewport-driven (e.g., a poster grid). The main reel is viewport-driven, so it doesn't apply. |
| `runed` `useIntersectionObserver` | DIY IO wrapper | Acceptable trade — fewer deps, but you re-implement the Svelte 5 cleanup ordering carefully (see svelte#12731). |
| `runed` | `svelte-intersection-observer` 1.1.1 | Republished Jan 2026 — back from the dead, BUT component-based API (`<IntersectionObserver let:intersecting>`) is awkward in Svelte 5 runes. Skip. |
| Pure CSS scroll-snap + `svh` | `embla-carousel-svelte` (vertical mode) | Use embla for **horizontal** "Continue the reel" rail on `/watch/[id]` (WATCH-02). Never for the vertical fullscreen reel. |
| Pure CSS scroll-snap | `swiper` | Never — too heavy, fights manual ±1 mount logic |
| Pure CSS scroll-snap | `fullpage.js` | Never — re-implements browser behavior, breaks IO timing, license concerns |
| `@sveltejs/enhanced-img` | `@unpic/svelte` | If we ever switch off `adapter-static` to a runtime image server (we won't — GH Pages doesn't have one). |
| Tailwind v4 built-in container queries | `@tailwindcss/container-queries` plugin | Never (in v4) — built-in supersedes |
| Tailwind v4 built-in aspect utilities | `@tailwindcss/aspect-ratio` plugin | Never (in v4) — built-in supersedes |
| Vitest jsdom + IO mock | `@vitest/browser` 4.1.6 | If component tests need real `IntersectionObserver` behavior beyond what a mock can simulate (e.g., real `rootMargin` math). Defer. |
| Playwright | WebdriverIO | Never for this project — official Vitest 2026 guidance recommends Playwright; WebKit support is first-class. |
## What NOT to Use (consolidated)
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@vimeo/player` for the reel | postMessage listener overhead × 3 simultaneous mounts; not needed for muted-loop-only use case | Raw iframe + URL params |
| `lite-vimeo-embed` | Stale (last published 2023-11); custom-element lifecycle clashes with Svelte's reconciler | Raw iframe |
| `swiper` | ~150KB; designed for image carousels with hundreds of features we don't need | CSS scroll-snap (vertical) + embla (horizontal) |
| `fullpage.js` | License (GPLv3 / commercial); re-implements `scroll-snap` poorly; breaks IntersectionObserver timing | CSS `scroll-snap-type: y mandatory` + `svh` |
| `@tailwindcss/container-queries` | Built into Tailwind v4 | (nothing — use `@container` directly) |
| `@tailwindcss/aspect-ratio` | Built into Tailwind v4 | `aspect-video`, `aspect-[16/9]` |
| `@tailwindcss/forms` | Forms not in scope for `_three` (`/contact` is `mailto:` only) | — |
| `animate.css` | Tailwind v4 `@theme` + CSS keyframes do this with zero JS | `@theme { --duration-fade: 480ms; }` + `motion-safe:` variants |
| `100vh` for full-screen sections | iOS Safari overflows by ~80px until first scroll → layout jump fights scroll-snap | `100svh` |
| `100dvh` for snap sections | Resizes constantly on iOS chrome animate → scroll-snap recalculation jank | `100svh` for snap; `100dvh` for content blocks that should fill |
| `display:none` on TopNav fade | Hides chrome from screen readers; breaks NAV-01 a11y | `opacity-0 pointer-events-none` |
| WebdriverIO with Vitest Browser Mode | Officially not recommended for Vitest in 2026 | Playwright |
| Autoplay-on as the default with reduced-motion ignored | WCAG 2.3.3 violation | Two-tier guard: CSS `prefers-reduced-motion` + JS autoplay derivation |
| Trusting `navigator.connection` everywhere | Chromium-only; Firefox/iOS Safari return `undefined` | Graceful detection with safe defaults (see Network Detection section) |
| `pnpm/action-setup@v3` | Deprecated late 2025 | `pnpm/action-setup@v4` |
## Stack Patterns by Variant
- Production deploy workflow fires (POL-04). CNAME points `michellengo.net` → GH Pages.
- Lighthouse CI gate hardens from `warn` to `error` on perf budgets.
- Keep `navigator.connection` detection as a pure enhancement.
- iOS Safari + Firefox users see autoplay reel (the cinema-intended experience).
- Document the trade-off in PROJECT.md Key Decisions.
- Need a `Save-Data` HTTP header alternative — but `adapter-static` outputs no server, so we can't read request headers.
- Force the question: is "cellular" detectable at all from a static site on iOS Safari? **Answer: no.** Spec needs to change or accept the limitation.
- Same recipe (poster + IO + iframe swap) at a smaller scale. Don't add Vimeo/YouTube wrapper libs even then.
- `embla-carousel-svelte` 8.6.0 is the right tool. Different problem from the vertical fullscreen reel — different solution.
## Version Compatibility Notes
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `svelte@5.55+` | `runed@0.37.x` | Runed targets Svelte 5 specifically; runes API required |
| `tailwindcss@4.3` | `@tailwindcss/vite@4.3` | Major versions must match; v4 plugin v4 only |
| `tailwindcss@4.3` | `@tailwindcss/typography@0.5.19` | Typography 0.5.x works with v4; 0.6 may bring v4-native config — track release notes |
| `@sveltejs/kit@2.59+` | `@sveltejs/adapter-static@3.0.10` | adapter-static 3.x tracks kit 2.x |
| `@sveltejs/enhanced-img@0.10.x` | `vite@8.x` | Needs Vite 8; sibling already on 8.0.7 |
| `vitest@4.1.5` | `@testing-library/svelte@5.3.1` | Svelte 5 + Vitest 4 supported in TLS 5.x |
| `playwright@1.60` | `@axe-core/playwright@4.11.4` | Playwright 1.x widely compatible with axe-core/playwright 4.x |
| `pnpm@11.0.9` | `pnpm/action-setup@v4` | v4 of the action supports pnpm 9–11; v3 ceiling is pnpm 9 |
| Node 22 | All of the above | LTS through 2027-04 |
## Open Decisions to Escalate
## Sources
- `@vimeo/player` 2.30.4 — published 2026-04-29
- `runed` 0.37.1 — published 2025-12-20 (and tracking through 2026)
- `@sveltejs/enhanced-img` 0.10.4 — published 2026-03-12
- `lite-vimeo-embed` 0.3.0 — last published 2023-11-23 (STALE flag)
- `lite-youtube-embed` 0.3.4 — published 2025-11-10
- `svelte-intersection-observer` 1.1.1 — published 2026-01-19 (newly maintained)
- `@playwright/test` 1.60.0 — current 2026
- `@lhci/cli` 0.15.1 — current 2026 (Lighthouse 12.6.1)
- `embla-carousel-svelte` 8.6.0 — published 2025-04 (current stable; 9.0.0-rc02 in RC 2026-04)
- `swiper` 12.1.4 — current 2026
- `axe-core` / `@axe-core/playwright` 4.11.4 — current 2026
- `tailwindcss` 4.3.0 — matches sibling `_four` floor
- [caniuse.com/netinfo](https://caniuse.com/netinfo) — Network Information API Firefox/Safari status: NOT SUPPORTED (HIGH)
- [MDN: NetworkInformation.effectiveType](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType) — confirms Chromium-only (HIGH)
- [WebKit bug 261185](https://bugs.webkit.org/show_bug.cgi?id=261185) — `svh`/`dvh` Safari behavior; supports the "use `svh` for scroll-snap" choice (HIGH)
- [Vimeo Help: About Player Parameters](https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters) — `autoplay`, `muted`, `loop`, `background` parameter contract (HIGH)
- [Vimeo Help: Embedding background videos](https://help.vimeo.com/hc/en-us/articles/12426285089681) — `background=1` auto-implies autoplay+muted+loop (HIGH)
- [runed.dev — useIntersectionObserver](https://www.runed.dev/docs/utilities/use-intersection-observer) — official docs (HIGH)
- [Tailwind v4 release post](https://tailwindcss.com/blog/tailwindcss-v4) — built-in container queries + OKLCH palette (HIGH)
- [SvelteKit Images docs](https://svelte.dev/docs/kit/images) — enhanced-img design + sharp under the hood (HIGH)
- [Vitest Browser Mode vs Playwright (2026)](https://www.epicweb.dev/vitest-browser-mode-vs-playwright) — WebdriverIO not recommended; Playwright is the pick (HIGH)
- [SvelteKit adapter-static docs](https://svelte.dev/docs/kit/adapter-static) — confirms static-site contract (HIGH)
- [Svelte issue #12731](https://github.com/sveltejs/svelte/issues/12731) — `$effect` cleanup ordering with `bind:this` + observers (HIGH — known issue, motivates the `runed` recommendation)
- `../michelle_ngo_four/package.json` — version floor for all locked deps
- `../michelle_ngo_four/vite.config.ts` — Vitest data/ui project split pattern to replicate
- `../michelle_ngo_four/svelte.config.js` — adapter-static config to replicate
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
