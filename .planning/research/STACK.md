# Stack Research

**Domain:** Cinematic-immersive filmmaker portfolio website (scroll-snap fullscreen reel + Vimeo/YouTube iframe lifecycle + viewport-windowed mounting + persistent filter pill bar) on top of SvelteKit 2 / Svelte 5 / TS strict / Tailwind v4 / pnpm / `@sveltejs/adapter-static` / GitHub Pages
**Researched:** 2026-05-19
**Confidence:** HIGH on locked base (mirrors shipped sibling `_four`); HIGH on most additions (verified via npm registry timestamps + official docs); MEDIUM on a few items called out below

---

## TL;DR — Recommendations at a Glance

1. **Embed lifecycle:** Use **raw iframe wrapped in a Svelte 5 `$effect` cleanup**, NOT `@vimeo/player` or `lite-vimeo-embed`. Reason: 56-video viewport-windowed mount/unmount needs zero-overhead listener-free behavior; native iframe `src` swap is the cheapest cleanup; `@vimeo/player` adds postMessage listeners that compound across 3 simultaneously-mounted iframes; `lite-vimeo-embed` is stale (last published Nov 2023).
2. **Network detection:** Use `navigator.connection.effectiveType` BUT treat it as **Chromium-only progressive enhancement**. iOS Safari and Firefox do NOT implement it as of 2026 — PROJECT.md REEL-04 needs a graceful fallback (default = autoplay-enabled; downgrade only when the API is present AND reports cellular).
3. **Scroll-snap:** **Pure CSS `scroll-snap-type: y mandatory`** with `100svh` sections. No JS lib. Embla/Swiper are for carousels, not full-page vertical reels.
4. **IntersectionObserver:** Use **`runed` `useIntersectionObserver`** — the de facto Svelte 5 rune-native utility lib, published Dec 2025 → 2026, actively maintained. Beats DIY only for the rune-cleanup ergonomics; DIY is a fine fallback.
5. **Tailwind v4:** No `@tailwindcss/container-queries` plugin (built-in in v4). No `@tailwindcss/aspect-ratio` (also built-in). Add **`@tailwindcss/typography`** for `/about` + `/press` long-form. Lock to **OKLCH tokens via `@theme`** CSS-first config.
6. **Performance tooling:** **`@sveltejs/enhanced-img` 0.10.4** (uses sharp under the hood) for poster generation; **`@lhci/cli` 0.15.x** (Lighthouse 12) gated against POL-02's 2.5s LCP budget in CI.
7. **Testing:** Keep sibling's **Vitest 4.1.5 data/ui split**; add **Playwright 1.60.0** for e2e of scroll-snap + reel viewport-windowing. WebdriverIO is not recommended for Vitest Browser Mode in 2026 per official guidance. Don't bother with `@vitest/browser` for this milestone — sticking with jsdom + `IntersectionObserver` mocks keeps the test loop fast.
8. **Accessibility:** `prefers-reduced-motion` checks in **two places**: (a) Tailwind `motion-safe:` / `motion-reduce:` variants on every animation; (b) JS-side guard in the autoplay decision branch (no muted-loop autoplay if reduced-motion is requested). **`@axe-core/playwright` 4.11.4** in CI for accessibility regression.
9. **CI/CD:** Replicate sibling `_four`'s GitHub Actions workflow — pnpm@11.0.9 + Node 22 + `pnpm install --frozen-lockfile` + `pnpm/action-setup@v4` + `actions/setup-node@v4` with `cache: 'pnpm'`. Push to `main` → build → upload-pages-artifact → deploy.

---

## Locked Foundation (mirrors `../michelle_ngo_four/package.json`)

These are **floors, not ceilings** — match sibling exactly unless a compelling reason emerges. The A/B comparison requires framework parity.

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

**Why these are LOCKED:** `_three` exists explicitly to A/B-test *design language* against `_four`. Drifting framework versions would conflate "design change" and "framework ergonomics change" — invalidating the test. PROJECT.md §Constraints is explicit on this.

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

---

## Cinematic-Layer Additions (the actual research output)

Everything below sits ON TOP of the locked foundation. These are the new dependencies `_three` introduces beyond `_four`'s shipped set.

### Embed Lifecycle (Question 1) — HIGH CONFIDENCE

| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **Raw iframe + Svelte 5 `$effect` cleanup** | — (no dep) | Mount Vimeo/YouTube iframes with `?autoplay=1&muted=1&loop=1&background=1` (Vimeo) / `?autoplay=1&mute=1&loop=1&playlist=<id>` (YouTube); unmount = replace `<iframe>` with `<img poster>` | HIGH |

**The recipe:**
```svelte
<script lang="ts">
  import { useIntersectionObserver } from 'runed';
  let section = $state<HTMLElement | null>(null);
  let visible = $state(false);
  useIntersectionObserver(
    () => section,
    (entries) => { visible = entries[0]?.isIntersecting ?? false; },
    { threshold: 0.5, rootMargin: '100% 0px' } // ±1 viewport buffer = REEL-03's "current ± 1"
  );
  // visible drives <iframe> vs <img poster> render — Svelte's reconciler does the unmount cleanup for us
</script>
```

**Why NOT `@vimeo/player` (2.30.4, current 2026-04):**
- Adds postMessage listener overhead per iframe. With 3 simultaneously-mounted iframes, that's 3 listener pairs swapping every snap. Raw iframe `src` swap has zero listener cost.
- Provides a JS API (`.play()`, `.pause()`, `.on('ended')`) that the silent muted background-loop use case doesn't need — URL params already do it.
- Svelte 5 `$effect` cleanup ordering bug (sveltejs/svelte#12731) makes `bind:this` + third-party observer libs error-prone. Native iframe lifecycle dodges this entirely.
- **When TO use `@vimeo/player`:** ONLY on the `/watch/[id]` page (WATCH-01) IF you need precise sound-on playback events for analytics or "Continue the reel" auto-advance. Even there, raw iframe + the `?api=1` postMessage handshake is enough. Defer this dep until proven necessary.

**Why NOT `lite-vimeo-embed` (0.3.0, last published 2023-11):**
- **Stale.** Three years of no maintenance is a red flag for a load-bearing dep on a shipping site.
- Designed for poster-first lazy-load (which is good!) but it's a custom element with its own lifecycle — clashes with Svelte 5's reconciler when you want fine-grained ±1 mount control.
- Better pattern: borrow its **poster-image-first approach** in our own component, no dep needed.

**Why NOT `lite-youtube-embed` (0.3.4, last published 2025-11-10):**
- Actually maintained and current! Genuinely good for a "click poster → embed iframe" pattern.
- BUT: optimized for the click-to-play use case. Our reel needs **automatic** mount-on-scroll, not click. Wrapping `lite-youtube-embed` in our IntersectionObserver to fake automatic mount is more code than just rendering the iframe ourselves.
- **When TO use it:** If we add a "PLAY WITH SOUND" CTA that swaps the muted-loop iframe to a full-fidelity click-to-play one on `/watch/[id]`, `lite-youtube-embed` is a reasonable choice for that specific click-to-play moment. Probably not worth the dep.

**Why NOT `svelte-vimeo-player` / `svelte-lite-youtube-embed` (Svelte-flavored wrappers):**
- `svelte-vimeo-player` 0.1.3 — very low version, unclear Svelte 5 rune compatibility, low downloads, abandoned-looking.
- `svelte-lite-youtube-embed` 1.1.0 — exists, but Svelte 5 runes adoption is unclear and wrapping a custom element in Svelte adds zero value.

**Anti-pattern:** Mounting all 56 iframes at once. Mobile Safari will OOM or throttle hard. REEL-03 (current ± 1) is non-negotiable.

---

### Network/Bandwidth Detection (Question 2) — HIGH CONFIDENCE on the constraint, MEDIUM on the workaround

**Hard constraint from research:** `navigator.connection.effectiveType` is **Chromium-only** (Chrome, Edge, Chrome Android, Samsung Internet) as of 2026. **Firefox and iOS Safari do NOT implement it** and likely never will (Apple/Mozilla have privacy concerns — fingerprinting surface).

**Sources:**
- caniuse.com/netinfo — "Not supported in Safari, Firefox"
- MDN Network Information API page — Firefox/Safari mark "no"

**Implication for PROJECT.md REEL-04:** The current spec ("On cellular connections... all sections show poster + tap-to-play") assumes the API works. On iOS Safari and Firefox, the API is `undefined` and we have NO way to detect cellular. REEL-04 needs to be re-spec'd or accepted as Chromium-only progressive enhancement.

**Recommended pattern (defensive):**

```ts
// src/lib/connection.svelte.ts
type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

function detect(): EffectiveType {
  if (typeof navigator === 'undefined') return 'unknown'; // SSR safe
  const conn = (navigator as any).connection;
  if (!conn || typeof conn.effectiveType !== 'string') return 'unknown';
  return conn.effectiveType;
}

export const networkClass = $state({
  effectiveType: detect(),
  saveData: typeof navigator !== 'undefined'
    && (navigator as any).connection?.saveData === true,
  // Default = autoplay-enabled. Downgrade only if API present AND reports cellular OR saveData.
  shouldAutoplay: () => {
    if (networkClass.saveData) return false;
    if (networkClass.effectiveType === 'unknown') return true; // safe default
    return !['slow-2g', '2g', '3g'].includes(networkClass.effectiveType);
  }
});
```

**Three design choices baked into the above:**
1. **Default = autoplay-on** (not autoplay-off). iOS Safari users — the dominant mobile filmmaker-portfolio audience — would otherwise *always* see poster-only. That defeats the cinema-mode design.
2. **`Save-Data` header / `connection.saveData`** is a partial substitute for `effectiveType`. iOS Safari doesn't expose `connection` at all, but a few Chromium devices have `Data Saver` enabled and we should honor that.
3. **Re-evaluate per-mount** (not just at boot). Long sessions on a train/in-and-out of WiFi — connection changes mid-scroll. Wire a `'change'` listener on `navigator.connection` (Chromium only) inside an `onMount`.

**Confidence:** HIGH that effectiveType is Chromium-only; MEDIUM on whether REEL-04 should soften ("on devices that expose the Network Information API and report cellular") or hold the spec and ship Chromium-only. **Recommend escalating to PROJECT.md decision.**

---

### Scroll-Snap (Question 3) — HIGH CONFIDENCE

| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **Pure CSS `scroll-snap-type: y mandatory`** | — (no dep) | Fullscreen vertical scroll-snap reel | HIGH |
| **`svh` viewport unit for section height** | — (CSS native) | Avoid iOS Safari address-bar collapse causing layout jump | HIGH |

**Pattern:**
```css
/* .work-reel container */
.work-reel {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  scroll-behavior: smooth;
  height: 100svh; /* small viewport — fits even when iOS chrome is shown */
}
.work-reel-section {
  scroll-snap-align: start;
  scroll-snap-stop: always; /* prevent over-scrolling past sections */
  height: 100svh;
}

@media (prefers-reduced-motion: reduce) {
  .work-reel { scroll-behavior: auto; }
}
```

**Why `svh` not `dvh` not `vh`:**
- `100vh` on iOS Safari = viewport with chrome HIDDEN. On first paint (chrome shown), 100vh overflows by ~80px causing layout shift on scroll.
- `100dvh` resizes constantly as the address bar animates. Combined with `scroll-snap` this causes scroll-snap recalculation → janky snapping on iOS.
- `100svh` = smallest viewport (with chrome visible). Fits on first paint, doesn't resize on chrome collapse → scroll-snap stable. WebKit bug 261185 confirms `svh` is the safe choice for scroll-snap layouts.

All three (`svh`, `lvh`, `dvh`) reached Baseline Widely Available in June 2025 → safe everywhere PROJECT.md targets (iOS 16+, current Chrome/Edge/Firefox).

**Why NOT `embla-carousel-svelte` (8.6.0):**
- Embla is for **horizontal carousels** (think "Continue the reel" rail on `/watch/[id]` — see below). Using it for full-page vertical snap is fighting the library.
- It's a reasonable pick for WATCH-02's horizontal "Continue the reel" carousel. Keep it for that, not the main reel.

**Why NOT `swiper` (12.1.4):**
- Heavy (~150KB). Built for image carousels with thousands of features (lazy-loading, virtual slides, etc.) we don't need.
- Vertical snap with all 56 sections would invite virtual-slide complexity that conflicts with our manual ±1 mount logic.
- **Anti-pattern for this project.**

**Why NOT a JS scroll-snap polyfill or lib:**
- CSS `scroll-snap` is universally supported in all target browsers (iOS 16+, current Chrome/Edge/Firefox per PROJECT.md constraints).
- The only browser that fights it is iOS Safari with the address-bar collapse — and `svh` solves that.
- JS scroll-snap libs (e.g., `fullpage.js`, `react-scroll-snap`) re-implement what the browser already does, badly, and break IntersectionObserver timing.

---

### IntersectionObserver Helpers (Question 4) — HIGH CONFIDENCE

| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`runed`** | 0.37.1 (current 2026-01) | Svelte 5 rune-native utilities including `useIntersectionObserver`, `IsInViewport` | HIGH |

**Why `runed`:**
- Built by `svecosystem` (the same group behind major Svelte 5 libs).
- Actively maintained: 0.36.0 (2025-11) → 0.37.1 (2025-12) → still iterating through 2026.
- **Rune-native** — uses `$state` getters, `$effect` cleanup automatically, no manual listener teardown.
- `useIntersectionObserver` API includes `pause()` / `resume()` / `stop()` — useful for pausing observers when off-tab.
- `IsInViewport` is a higher-level wrapper on top of `useIntersectionObserver` if you just want boolean visibility.

**Pattern (the same one used for REEL-03 above):**
```svelte
<script lang="ts">
  import { useIntersectionObserver } from 'runed';
  let el = $state<HTMLElement | null>(null);
  let visible = $state(false);
  useIntersectionObserver(
    () => el,
    (entries) => { visible = entries[0]?.isIntersecting ?? false; },
    { threshold: [0, 0.5, 1], rootMargin: '100% 0px' }
  );
</script>
<section bind:this={el}>
  {#if visible}<iframe ... />{:else}<img alt="poster" ... />{/if}
</section>
```

**Why NOT `svelte-intersection-observer` (1.1.1, published 2026-01-19):**
- Republished in Jan 2026 after a multi-year gap (1.0.0 was 2024-01, 1.1.0 was 2026-01-19). It IS maintained again — credit where due.
- But it's component-based (`<IntersectionObserver let:intersecting>`) not rune-based, which is awkward in Svelte 5.
- Doesn't compose as cleanly with `$derived` (e.g., "visible OR adjacent-to-visible") — runed's getter pattern does.

**Why NOT DIY:**
- DIY is **fine** and totally viable — IntersectionObserver is a 20-line wrapper. But the rune-cleanup ergonomics of `runed` save real bugs (the Svelte 5 `bind:this` + `$effect` ordering issue from #12731 is non-obvious).
- If you want to avoid the dep, DIY is the next-best pick. Don't reach for `svelte-intersection-observer`.

---

### Tailwind v4 for Full-Bleed Dark Cinema UI (Question 5) — HIGH CONFIDENCE

| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`@tailwindcss/typography`** | 0.5.19 | Long-form prose styling for `/about` bio, `/press` credits, PBS blockquote | HIGH |
| (No other plugins) | — | v4 built-ins cover the rest | HIGH |

**v4 built-ins that REPLACE plugins:**
- **Container queries** — `@container` / `@sm:` / `@md:` are built-in in v4. **Do NOT install `@tailwindcss/container-queries`.**
- **Aspect ratio** — `aspect-video`, `aspect-square`, arbitrary `aspect-[16/9]` are built-in. **Do NOT install `@tailwindcss/aspect-ratio`.**
- **Animation** — `animate-*` utilities + CSS-first `@theme` keyframes obviate `animate.css`.

**OKLCH palette strategy:**

Define in `src/app.css` (or `src/lib/styles/theme.css` imported there):

```css
@import 'tailwindcss';

@theme {
  /* Cinema palette — OKLCH for perceptual uniformity, P3 gamut on supporting displays */
  --color-ink: oklch(0.13 0.01 240);            /* near-black with slight cool tint */
  --color-paper: oklch(0.97 0.01 80);           /* warm off-white */
  --color-cinder: oklch(0.18 0.02 240);         /* deep gunmetal */
  --color-bone: oklch(0.85 0.01 80);            /* muted highlight */
  --color-amber: oklch(0.78 0.18 70);           /* spotlight accent */
  /* Category accents — reuse _four's hues if a tokens.css exists to copy */

  /* Cinematic motion */
  --ease-cinema: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fade: 480ms;
}
```

Then `bg-ink`, `text-paper`, `border-cinder` etc. work natively as Tailwind utilities in v4.

**Viewport units:** Use `h-svh`, `h-dvh`, `h-lvh` directly — Tailwind v4 ships these utilities. Pattern: `h-svh` for snap sections (Question 3), `min-h-dvh` for the page shell.

**Aspect ratio for letterboxed embeds:** Vimeo/YouTube standard is `aspect-video` (16/9). Letterbox container: wrap in a fixed-aspect div, iframe absolutely positions inside:
```html
<div class="relative aspect-video w-full max-h-svh mx-auto">
  <iframe class="absolute inset-0 h-full w-full" ... />
</div>
```

**Dark mode:** v4 default uses `@media (prefers-color-scheme: dark)` automatically. For `_three`'s ALWAYS-dark cinema language, **don't enable dark-mode variants at all** — just bake the dark palette into the base tokens. Saves bundle size, prevents accidental light-mode leakage if a user toggles their OS theme.

**Anti-pattern:** Installing `@tailwindcss/forms` or `animate.css`. Forms aren't in scope (`/contact` is `mailto:` only); animations are CSS-first via `@theme` keyframes.

---

### Performance Tooling (Question 6) — HIGH CONFIDENCE

| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`@sveltejs/enhanced-img`** | 0.10.4 (current 2026-03) | Build-time poster generation: WebP + AVIF + JPEG fallback, blur-up placeholders | HIGH |
| **`sharp`** | 0.34.5 | Image transform engine (peer dep of enhanced-img — pnpm auto-installs) | HIGH |
| **`@lhci/cli`** | 0.15.1 (Lighthouse 12.6.1) | CI Lighthouse gating against POL-02's 2.5s LCP budget | HIGH |

**`<enhanced:img>` pattern for poster swap (REEL-03 + POL-03):**
```svelte
<script lang="ts">
  // Posters live in src/lib/assets/posters/{vimeoId|youtubeId}.jpg
  // enhanced-img generates avif/webp/jpeg + multiple sizes at build
  import poster from '$lib/assets/posters/264677021.jpg?enhanced';
</script>

{#if visible}
  <iframe class="absolute inset-0 h-full w-full"
          src="https://player.vimeo.com/video/264677021?autoplay=1&muted=1&loop=1&background=1"
          allow="autoplay; fullscreen; picture-in-picture"
          loading="lazy"
          tabindex="-1"></iframe>
{:else}
  <enhanced:img src={poster} alt="" class="absolute inset-0 h-full w-full object-cover" />
{/if}
```

**Preload strategy for HERO-01:**
```html
<!-- src/app.html or +layout.svelte -->
<link rel="preload" as="image" href="/posters/hero.avif" type="image/avif" fetchpriority="high" />
<link rel="preconnect" href="https://player.vimeo.com" crossorigin />
<link rel="preconnect" href="https://i.vimeocdn.com" crossorigin />
```

Don't preload the iframe itself — the first paint should be the poster; the iframe defers until interaction or 1s idle (POL-02).

**Lazy-load mechanics:**
1. Poster ALWAYS renders first via `<enhanced:img>` (build-time-optimized, AVIF first).
2. After mount, `useIntersectionObserver` flips `visible = true` → iframe mounts.
3. iframe has its own `loading="lazy"` as a belt-and-braces signal.
4. When section scrolls out of ±1 buffer, `visible = false` → iframe unmounts → poster remains.

**Why `@sveltejs/enhanced-img` over `@unpic/svelte` or `svelte-img`:**
- First-party. Maintained by the SvelteKit team. Tracks SvelteKit releases.
- Works with `adapter-static` — generates static assets at build time, no runtime image server needed (GitHub Pages doesn't have one).
- `_four` likely already uses it for its hero WebP per `_four`'s design DNA notes — keep consistent.

**Lighthouse CI config sketch:**
```js
// lighthouserc.cjs
module.exports = {
  ci: {
    collect: { staticDistDir: './build', numberOfRuns: 3 },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // POL-02
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],   // POL-03
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

---

### Testing (Question 7) — HIGH CONFIDENCE

| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`vitest`** (locked from sibling) | 4.1.5 | Unit + component tests, data/ui project split | HIGH |
| **`jsdom`** (locked from sibling) | 29.1.1 | DOM environment for ui project | HIGH |
| **`@testing-library/svelte`** | 5.3.1 | Component test helpers (mount, query, fire events) — Svelte 5 compatible | HIGH |
| **`@testing-library/jest-dom`** | 6.9.1 | Custom matchers (`.toBeInTheDocument()` etc.) | HIGH |
| **`@playwright/test`** | 1.60.0 (current 2026) | E2E scroll-snap + reel viewport-windowing on real Chromium/WebKit/Firefox | HIGH |
| **`@axe-core/playwright`** | 4.11.4 | Accessibility scan in e2e suite | HIGH |

**Data/ui split:** Already locked from sibling — `src/lib/data/**` runs in node (fast), `src/lib/components/**` + `src/routes/**` runs in jsdom. Don't touch this.

**IntersectionObserver mock (`vitest-setup-ui.ts`) — required for jsdom:**
```ts
// jsdom doesn't ship IntersectionObserver; mock it for component tests
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) { this.callback = cb; }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds = [];
  // Test helper to manually trigger intersection
  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this as any);
  }
}
globalThis.IntersectionObserver = MockIntersectionObserver as any;
```

In component tests:
```ts
test('reel section mounts iframe when visible', async () => {
  const { container } = render(ReelSection, { props: { video: ... } });
  const observer = (IntersectionObserver as any).mock.instances[0];
  observer.trigger([{ isIntersecting: true }]);
  await tick();
  expect(container.querySelector('iframe')).toBeInTheDocument();
});
```

**Scroll-snap testing — Playwright only (not jsdom):**

jsdom does NOT implement `scroll-snap-type` or real scroll mechanics. Scroll-snap behavior MUST be tested in a real browser. Playwright:

```ts
// e2e/reel.spec.ts
test('reel snaps to next video on swipe', async ({ page }) => {
  await page.goto('/work');
  const reel = page.locator('.work-reel');
  await reel.evaluate((el) => el.scrollBy({ top: window.innerHeight, behavior: 'instant' }));
  await expect(page.locator('[data-section-index="1"]')).toBeInViewport({ ratio: 0.9 });
});
```

**Why Playwright (not WebdriverIO):**
- Official Vitest guidance for 2026 explicitly states: "If you don't already use WebdriverIO, it's not recommended for Vitest Browser Mode — stick with Playwright."
- Playwright auto-waits, single automation engine, faster.
- First-class iOS Safari (WebKit) testing — critical because PROJECT.md targets iOS Safari 16+ as a load-bearing browser.
- More mature ecosystem for the `@axe-core/playwright` accessibility integration.

**Why NOT `@vitest/browser` for this milestone:**
- 4.1.6 exists and works, but adds Playwright as a transitive dependency just to run component tests in a real browser. The jsdom + mock pattern is sufficient for component unit tests; e2e (where real-browser matters) is already covered by Playwright separately.
- If we add `@vitest/browser` later for component tests that need real `IntersectionObserver` (i.e., when mock fidelity becomes a bottleneck), do it as a follow-up.

---

### Accessibility (Question 8) — HIGH CONFIDENCE

| Recommended | Version | Purpose | Confidence |
|-------------|---------|---------|------------|
| **`@axe-core/playwright`** | 4.11.4 | Axe-core accessibility scan in e2e tests | HIGH |
| **`axe-core`** | 4.11.4 (peer) | Underlying engine | HIGH |
| Tailwind v4 `motion-safe:` / `motion-reduce:` variants | (built-in) | CSS-level reduced-motion guards | HIGH |

**`prefers-reduced-motion` is LOAD-BEARING for `_three`** — autoplay muted loops fail WCAG 2.3.3 (Animation from Interactions) unless they're disable-able by user preference. The entire reel concept hinges on getting this right.

**Two-tier defense:**

**Tier 1 — CSS (Tailwind v4):**
```svelte
<section class="h-svh snap-start scroll-snap-always
                motion-safe:transition-opacity motion-safe:duration-700">
  ...
</section>
```
Plus `prefers-reduced-motion` block in app.css:
```css
@media (prefers-reduced-motion: reduce) {
  .work-reel { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Tier 2 — JS (autoplay guard):**
```ts
// src/lib/motion.svelte.ts
export const motionPreference = $state({
  reduced: typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
});

if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', (e) => { motionPreference.reduced = e.matches; });
}
```

Then the autoplay decision is:
```ts
const shouldAutoplay = $derived(
  !motionPreference.reduced
    && networkClass.shouldAutoplay()
    && visible
);
```

If the user prefers reduced motion → muted loops never autoplay → always falls back to poster + tap-to-play. Cinematic vision preserved (the posters still look gorgeous); WCAG compliance preserved.

**Axe-core integration:**
```ts
// e2e/a11y.spec.ts
import { AxeBuilder } from '@axe-core/playwright';
test('home page has no a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

Run on every route + at least once with reduced-motion preference set:
```ts
await page.emulateMedia({ reducedMotion: 'reduce' });
```

**Other a11y baselines:**
- iframes need `title` attribute (Vimeo/YouTube embed title).
- Sticky filter pills (FILT-01) need `aria-current="page"` on the active pill, focus-visible ring, keyboard nav.
- TopNav fade (NAV-01) must NOT hide chrome from screen readers — use `opacity-0` with `pointer-events-none` only, never `display:none` or `visibility:hidden`.
- Every iframe needs `allow="autoplay; fullscreen; picture-in-picture"` (no `encrypted-media` — we don't DRM these).

---

### CI/CD (Question 9) — HIGH CONFIDENCE

**Mirror sibling `_four`'s deploy workflow exactly.** Don't innovate. Reference: `../michelle_ngo_four/.github/workflows/deploy-staging.yml` (look at it before writing this milestone's).

**Recommended workflow shape (`.github/workflows/deploy-staging.yml`):**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 11.0.9   # pin to package.json packageManager

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'     # caches ~/.pnpm-store keyed on pnpm-lock.yaml

      - run: pnpm install --frozen-lockfile

      - run: pnpm check
      - run: pnpm test
      - run: pnpm build
        env:
          BASE_PATH: '/michelle_ngo_three'   # FOUND-02: GH Pages subpath

      - uses: actions/upload-pages-artifact@v3
        with:
          path: build/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**Cache strategy notes:**
- `actions/setup-node@v4` with `cache: 'pnpm'` is the supported pnpm cache path. **Don't** roll your own `actions/cache@v4` block — setup-node's built-in cache handles invalidation correctly.
- The cache key is `pnpm-lock.yaml` hash — committing `pnpm-lock.yaml` (which sibling does) is required.
- Expect 30-50% install speedup on warm cache. Cold cache install on a fresh runner is ~45s; warm is ~10-15s for this stack size.

**Production deploy (POL-04):** Mirror sibling's `deploy-production.yml` exactly. The only differences vs staging:
- `BASE_PATH: ''` (apex domain, no subpath)
- `static/CNAME` containing `michellengo.net`
- Only triggers manually or on a release tag (cutover-gated)

**Pin discipline:**
- `pnpm/action-setup@v4` (NOT @v3 — v3 is deprecated as of late 2025)
- `actions/setup-node@v4`, `actions/checkout@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4` — all current major versions as of 2026-05
- `node-version: 22` (LTS, matches `engines.node` in package.json)
- `version: 11.0.9` for pnpm (matches `packageManager` field exactly — `corepack` will use this same version locally too)

**Optional add-on: Lighthouse CI as a non-blocking PR check**
```yaml
  lhci:
    needs: build
    runs-on: ubuntu-latest
    continue-on-error: true  # don't fail the deploy on perf budget miss; just report
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with: { name: github-pages, path: build/ }
      - run: npx @lhci/cli@0.15.x autorun
```

---

## Full Installation Command Block

```bash
# (Foundation comes from `pnpm create svelte@latest` + manual sync with _four's package.json — see VERSION FLOOR section)

# Cinematic-layer ADDITIONS only (deltas vs _four):
pnpm add runed@^0.37.1
pnpm add -D @sveltejs/enhanced-img@^0.10.4
pnpm add -D @tailwindcss/typography@^0.5.19
pnpm add -D embla-carousel-svelte@^8.6.0     # ONLY for /watch/[id] "Continue the reel" horizontal carousel (WATCH-02). Skip if not building that.

# Testing additions:
pnpm add -D @testing-library/svelte@^5.3.1
pnpm add -D @testing-library/jest-dom@^6.9.1
pnpm add -D @playwright/test@^1.60.0
pnpm add -D @axe-core/playwright@^4.11.4
pnpm add -D axe-core@^4.11.4

# Performance gating in CI (optional):
pnpm add -D @lhci/cli@^0.15.1

# Then install Playwright browser binaries (one-time per dev machine + CI):
pnpm exec playwright install --with-deps chromium webkit firefox
```

**Do NOT install:** `@vimeo/player`, `lite-vimeo-embed`, `lite-youtube-embed`, `svelte-vimeo-player`, `svelte-lite-youtube-embed`, `swiper`, `fullpage.js`, `react-scroll-snap`, `@tailwindcss/container-queries`, `@tailwindcss/aspect-ratio`, `@tailwindcss/forms`, `animate.css`, `svelte-intersection-observer`, `@vitest/browser`, `webdriverio`, `@wdio/cli`.

---

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

---

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

---

## Stack Patterns by Variant

**If the A/B coin lands on `_three` and we cut over:**
- Production deploy workflow fires (POL-04). CNAME points `michellengo.net` → GH Pages.
- Lighthouse CI gate hardens from `warn` to `error` on perf budgets.

**If REEL-04 spec softens to "Chromium-only progressive enhancement":**
- Keep `navigator.connection` detection as a pure enhancement.
- iOS Safari + Firefox users see autoplay reel (the cinema-intended experience).
- Document the trade-off in PROJECT.md Key Decisions.

**If REEL-04 spec hardens to "ALL cellular users must see poster":**
- Need a `Save-Data` HTTP header alternative — but `adapter-static` outputs no server, so we can't read request headers.
- Force the question: is "cellular" detectable at all from a static site on iOS Safari? **Answer: no.** Spec needs to change or accept the limitation.

**If hover-to-preview on small thumbnails creeps back in (currently out of scope):**
- Same recipe (poster + IO + iframe swap) at a smaller scale. Don't add Vimeo/YouTube wrapper libs even then.

**If we add `/watch/[id]` "Continue the reel" horizontal carousel (WATCH-02):**
- `embla-carousel-svelte` 8.6.0 is the right tool. Different problem from the vertical fullscreen reel — different solution.

---

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

---

## Open Decisions to Escalate

1. **REEL-04 spec on iOS Safari / Firefox.** `navigator.connection.effectiveType` is Chromium-only. Recommend softening REEL-04 to "On Chromium-based browsers reporting cellular, default to poster + tap-to-play; on other browsers, default to autoplay per HERO-01/REEL-02." Without a decision, the implementation will silently ignore the API on iOS Safari and Firefox.

2. **`@vimeo/player` on `/watch/[id]`.** Strictly required only if WATCH-02 ("Continue the reel" rail) auto-advances on video end. If user just clicks the next card, raw iframe is fine. Recommend deferring until WATCH milestone — make the call there.

3. **`@vitest/browser`.** If component tests start needing real `IntersectionObserver` math (e.g., precise `rootMargin` regression tests), reach for it. For this milestone, jsdom + mock is sufficient.

---

## Sources

**Verified via npm registry (timestamps confirm 2026 freshness):**
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

**Browser support / API claims:**
- [caniuse.com/netinfo](https://caniuse.com/netinfo) — Network Information API Firefox/Safari status: NOT SUPPORTED (HIGH)
- [MDN: NetworkInformation.effectiveType](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType) — confirms Chromium-only (HIGH)
- [WebKit bug 261185](https://bugs.webkit.org/show_bug.cgi?id=261185) — `svh`/`dvh` Safari behavior; supports the "use `svh` for scroll-snap" choice (HIGH)
- [Vimeo Help: About Player Parameters](https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters) — `autoplay`, `muted`, `loop`, `background` parameter contract (HIGH)
- [Vimeo Help: Embedding background videos](https://help.vimeo.com/hc/en-us/articles/12426285089681) — `background=1` auto-implies autoplay+muted+loop (HIGH)

**Library/pattern claims:**
- [runed.dev — useIntersectionObserver](https://www.runed.dev/docs/utilities/use-intersection-observer) — official docs (HIGH)
- [Tailwind v4 release post](https://tailwindcss.com/blog/tailwindcss-v4) — built-in container queries + OKLCH palette (HIGH)
- [SvelteKit Images docs](https://svelte.dev/docs/kit/images) — enhanced-img design + sharp under the hood (HIGH)
- [Vitest Browser Mode vs Playwright (2026)](https://www.epicweb.dev/vitest-browser-mode-vs-playwright) — WebdriverIO not recommended; Playwright is the pick (HIGH)
- [SvelteKit adapter-static docs](https://svelte.dev/docs/kit/adapter-static) — confirms static-site contract (HIGH)
- [Svelte issue #12731](https://github.com/sveltejs/svelte/issues/12731) — `$effect` cleanup ordering with `bind:this` + observers (HIGH — known issue, motivates the `runed` recommendation)

**Sibling project (in-repo, authoritative):**
- `../michelle_ngo_four/package.json` — version floor for all locked deps
- `../michelle_ngo_four/vite.config.ts` — Vitest data/ui project split pattern to replicate
- `../michelle_ngo_four/svelte.config.js` — adapter-static config to replicate

---
*Stack research for: cinematic-immersive filmmaker portfolio (`michelle_ngo_three`)*
*Researched: 2026-05-19*
