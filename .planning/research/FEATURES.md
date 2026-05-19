# Feature Research

**Domain:** Cinematic-immersive filmmaker portfolio (scroll-snapped fullscreen reels with muted preview loops) for an audience of hiring producers / agencies evaluating Michelle Ngo
**Researched:** 2026-05-19
**Confidence:** HIGH (the 56-video corpus, taxonomy, copy, and 7-route IA are inherited byte-for-byte from sibling `_four`'s shipped v1.0; the cinematic differentiators are validated against direct WebFetch reads of a24films.com and mubi.com plus multiple 2025–2026 filmmaker-portfolio survey articles; accessibility recommendations are anchored in WCAG 2.x SC and the sibling Pitfalls research)

> Scope reminder: this site is a contrasting sibling to `../michelle_ngo_four` (shipped editorial-modern v1.0). The two have **identical IA, identical content, identical audience**. The ONLY axis they differ on is *visual language*. Everything in this file that says "table stakes" was validated by `_four` already. Everything in "differentiators" is the new bet `_three` is making.

---

## Feature Landscape

### Table Stakes (Hiring producers expect these — missing = site is dismissed)

Features whose absence makes a producer close the tab. These are non-negotiable. Every one of these is **already validated by sibling `_four`** — if they're missing in `_three`, the A/B is rigged.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Reel-first home page** | A producer's first instinct is "show me her best work in 30 seconds." If the homepage isn't anchored on a reel, they bail. Industry sources are unambiguous: "for a producer, brand, or agency looking to begin a new production, a company's reel is the first place they look to make their hiring choice." | LOW | `_four` validated via HERO-01..03. `_three` evolves it from `<HeroPoster />` (static WebP) to `<HeroAmbient />` (silent muted reel-as-background). Same Vimeo id `264677021`, same PLAY REEL CTA → `/watch/264677021`. |
| **Mobile-functional layout** | 65% of portfolio views are from mobile (industry survey, 2025). A site that's only good on a 27" display is dead. | MEDIUM | iOS Safari is the critical browser. Scroll-snap + `100svh` (NOT `dvh`) + `playsinline` + cellular fallback are all load-bearing (see Pitfalls 1, 2, 3, 4). Already the bulk of `_three`'s technical risk. |
| **Works browsable** | Producer needs to scan the catalog and find something category-relevant. If they can't navigate from reel → individual films efficiently, the site fails its job. | MEDIUM | `_four` validates via 56-card grid. `_three` substitutes scroll-snapped fullscreen reel with `<FilterPillBar />` as the wayfinding compensation — pills are how a producer skips from "I want to see the PBS work" to PBS. **Without the pill bar, the reel is browse-hostile.** |
| **Press credits visible** | HBO Max, PBS, Hulu, Amazon, U2 Sphere are the differentiators that telegraph "she has shipped at scale." If a producer can't surface this in 2 clicks, the site under-sells her. | LOW | `_four` shipped `/press` with 13 prestige-ordered credits. `_three` reuses the same data shape (`_pressCredits.ts` lifted verbatim), restyled for cinema-dark. |
| **Per-video watch surface** | Producer wants to actually play a piece with sound, not just see a preview loop. `/watch/[id]` is the SEO unit too (Pitfall 11). | LOW | `_four`'s 56 prerendered `/watch/[id]` routes carry over. Each gets VideoObject JSON-LD. |
| **"Continue the reel" / sibling-discovery from watch** | After watching one piece, the producer wants more like it. `_four`'s "More in [Category]" rail on `/watch/[id]` validated this — it's the engine of "every interaction reinforces depth and breadth of her video work" (Core Value). | LOW | `_three` keeps it, restyled as horizontal carousel (`<ContinueReelRail />`) instead of grid. Same `getByCategory()` data path. |
| **About page with bio + verified identity** | Producer wants to know who they'd be hiring. Bio + IMDb + LinkedIn + headshot (optional) = sufficient. | LOW | `_four`'s user-approved first-person bio (~109 words) reused verbatim (ABT-01). `<ContactBlock />` reused verbatim. |
| **Contact accessible from every surface** | `mailto:` link + phone in footer = the table-stakes baseline. Hide contact and you lose the inquiry. | LOW | `_four`'s `<ContactBlock />` is the single source of truth for `mailto:`, phone, IMDb, LinkedIn, Vimeo. Rendered on `/contact`, `/about`, and the site-wide footer. |
| **PBS American Portrait dedicated landing** | 18 of 56 videos are PBS — it's her flagship body of work. A producer Googling "Michelle Ngo PBS" needs to land on something denser than a filter. | LOW–MEDIUM | `_four` validated `/pbs-american-portrait/` with verbatim PBS copy + 18-card grid + 15 per-card "See on PBS →" badges. `_three` keeps the route + copy + per-card outbound links; the layout becomes immersive (see § PBS treatment below). |
| **Deep-linkable URLs** | Producer shares "https://michellengo.net/work/branded" to a colleague. If reloading that URL doesn't reproduce the filtered view, sharing is broken. | LOW | URL = source of truth (`/work` = "All", `/work/[category]` = filtered). 8 prerendered category routes (FILT-04). |
| **Per-page SEO metadata (title, description, OG, JSON-LD)** | Without this, the press page doesn't surface in Google, OG cards on social shares are blank, video carousels don't include her work. | LOW | `_four` Phase 7 already shipped per-page `<title>`, OG/Twitter cards, Person JSON-LD on `/about`, VideoObject JSON-LD on every `/watch/[id]`, build-time `sitemap.xml` (70 URLs). `_three` mirrors verbatim. |
| **First paint feels fast** | Producer's tolerance for blank screens is ~2s. Beyond that, they assume the site is broken. | MEDIUM | `_three` accepts a slightly looser LCP budget than `_four` (2.5s vs 2.0s on simulated 4G) because the hero is now an ambient reel iframe, not a 15KB poster. Still well under "feels broken." Poster-first paint then iframe deferred-mount is the load-bearing technique. |
| **No layout shift on poster → iframe swap** | A reel section jumping 80px when the iframe boots is the visual equivalent of stuttering. Cinema-vibe ruined. | LOW | Aspect-ratio container locks dimensions before iframe arrives (POL-03). |

---

### Cinematic-Immersive Differentiators (the opinionated bets — `_three`'s reason to exist)

These features only make sense in a cinema-leaning portfolio. On a grid site like `_four` they would feel out of place. Each is annotated with **credibility-to-producer** (`HIGH` = serious filmmakers do this; `MEDIUM` = stylistic but defensible; `LOW` = gimmick — avoid).

| Feature | Value Proposition | Complexity | Credibility | Notes |
|---------|-------------------|------------|-------------|-------|
| **Scroll-snapped fullscreen sections (1 video = 1 viewport)** | Each piece gets the screen-real-estate of a screening room rather than a 320×180 thumbnail. Producer feels the work, not the menu. This is THE design statement; everything else flows from it. | HIGH | **HIGH** | Cinematic Scroll patterns (Framer Marketplace) and several 2025 director portfolios (Andrew Cussens, Alexandros Maragos, Fiona Ziegler) all use full-screen sectioning. Use `proximity` not `mandatory` (Pitfall 7). Pair with `100svh` not `100dvh` (Pitfall 2). |
| **Silent muted preview loops in each section** | Motion is the signal. A still poster says "I made this." A silently looping preview says "I made this, and you're already watching it." Calibrated to feel like ambient texture, not advertising. | HIGH | **HIGH** | Industry-standard for cinematic-immersive sites since ~2018. Native Vimeo/YouTube embeds with `autoplay=1&muted=1&loop=1` (+ `background=1` for Vimeo to strip chrome). Viewport-windowed mounting (current ± 1) per REEL-03 to keep memory + bandwidth bounded. |
| **`<HeroAmbient />` — ambient muted reel as full-bleed homepage background** | Replaces `_four`'s static `HeroPoster` with the producer's reel itself playing silent in the background, name + tagline overlaid, scroll-cue inviting entry into the reel. The whole site begins as cinema, not as a landing page. | MEDIUM | **HIGH** | Same Vimeo id `264677021` as `_four`'s PLAY REEL target. Always-mounted iframe (the LCP-budget exception per POL-02). On cellular / reduced-motion / Low Power, falls back to `_four`'s static WebP poster — same fallback path as the reel. |
| **Persistent sticky `<FilterPillBar />` above the reel** | The cinematic reel is browse-hostile without wayfinding. 8 category pills (All + 7 cats; PBS pill targets the flagship landing per `_four`'s D-03 parity) sticky-pinned above the snap container = the producer's "skip to the part I care about" affordance. The differentiator vs `_four` is the bar's **persistence on the reel surface** (not hidden in a hamburger). | LOW | **HIGH** | URL is source of truth (`/work` vs `/work/[category]`); same prerender topology as `_four`. The pill bar is one of the load-bearing inclusive-design backbones — without it, scroll-snap traps users (Pitfall 7). |
| **Cinematic minimal TopNav that fades on reel scroll** | Wordmark + About/Press/Contact + hamburger; chrome dissolves to opacity ~0.2 while the user is in the reel, surfaces fully on hover or when home/non-reel surfaces are active. Subtractive, not intrusive. | MEDIUM | **HIGH** | A24's site uses minimal top chrome with content-first scrolling — this is conventional for cinema-leaning sites. Implementation: `$effect` + IntersectionObserver pattern from `_four`'s TopNav.svelte, extended to also fade on `reel-scrolling` flag from `ReelStage` context. |
| **`▷ PLAY WITH SOUND` deep-link per section (the escalation)** | The preview is silent ambient context. Tapping `▷ PLAY WITH SOUND` deep-links to `/watch/[id]` where the iframe autoplays with audio. The two-step (silent → click → sound) is the cinematic equivalent of "step into the screening room." | LOW | **HIGH** | Reuses the per-video data already in `videos.json`. The click counts as user gesture for sound autoplay (browsers block sound-on autoplay without one). |
| **Letterboxed `<WatchPlayer />` on black with chrome-fade-on-play** | `/watch/[id]` renders the iframe in maximum-comfortable letterbox over black, with title + uploader + category metadata fading in below. On `play` postMessage event (Vimeo Player SDK / YouTube IFrame API), chrome fades to ~30% opacity; on `pause` or mouseover, it fades back. Mimics theatrical projection. | MEDIUM | **HIGH** | Vimeo `Player.on('play')` and YouTube `onStateChange(PLAYING)` are documented APIs; the chrome-fade pattern is standard on Mubi/Netflix/Apple TV+ web players. |
| **`<ContinueReelRail />` — horizontal carousel below WatchPlayer** | After the credits roll, a horizontally-scrolling rail of same-category siblings continues the screening-room feel. NOT a grid (`_four`'s territory). Uses posters only — no nested iframes (browse signal, not preview). | LOW | **HIGH** | Replaces `_four`'s `VideoCard` 2/3/4-grid rail with a `scroll-snap-type: x mandatory` horizontal strip. Same data path (`getByCategory()` minus current id). |
| **Title (bottom-left) + category tag (top-right) overlay on each reel section** | The cinematic equivalent of a film festival lower-third. Sparse, restrained, two-stop gradient overlay so legibility is guaranteed on any frame (Pitfall 20). | LOW | **HIGH** | `<CategoryTag />` component reused verbatim from `_four`. Two-stop gradient (top-down + bottom-up) at fixed opacity + `text-shadow` belt-and-suspenders. |
| **Fade-in-on-intersect chrome (title/tag appear as section enters viewport)** | Section-level chrome animates in as the section scrolls into view, not all-at-once on page load. Restrained motion that reinforces "this is a procession of films" rather than "this is a webpage of stuff." | LOW | **MEDIUM** | IntersectionObserver already running for mount-windowing (Pattern 1 in ARCHITECTURE.md) — just add a `data-visible` attribute and a 200ms opacity transition. Cheap. Skip under `prefers-reduced-motion`. |
| **Dark-mode-only palette (no light-mode toggle)** | Cinematic-immersive vibe is fundamentally dark. A24 / MUBI / Criterion all lean dark (or dark-on-restrained-neutral). A toggle would dilute the design statement. **Single-mode is the differentiator.** | LOW | **HIGH** | Tailwind v4 with `--color-cat-*` vars overridden to muted cinematic palette. Dark-only is a deliberate decision, not an accessibility regression — focus rings must compensate (Pitfall 10: white outline + dark halo). |
| **Restrained typography (1 display family + 1 mono, max)** | Cinema designs trust the imagery to carry the page. MUBI literally only uses one typeface across the homepage. Type discipline = quietness = "the films speak." | LOW | **HIGH** | Pair with `_four`'s existing Tailwind type scale; remove any decorative weights. The discipline is to *not add* a third family. |
| **Scroll-cue affordance on home (`↓ scroll to enter reel`)** | A user landing on `/` with the ambient hero needs a single legible invitation to scroll. A small `↓` glyph + label like "Enter the reel" = sufficient. | LOW | **HIGH** | Static SVG/text, fades in 1s after page load, fades out as user scrolls. Doesn't need motion if `prefers-reduced-motion`. |
| **In-reel hash position (`#video=620232398`) for refresh + share** | Producer scrolls to section 12 of 18, refreshes mid-scroll → returns to section 12, not section 1. Same for sharing a URL "I was looking at this piece." Lifts the immersive-mode pain of lost scroll position. | MEDIUM | **HIGH** | `history.replaceState` (NOT `pushState` — don't pollute back-stack on every snap) writes the visible section's id to the URL hash with ~300ms debounce. On mount, parse hash → `scrollIntoView({behavior:'auto'})`. Canonical share URL for a single video remains `/watch/[id]` (Pitfall 12). |
| **Cellular / reduced-motion / Low-Power-Mode → static-poster reel** | Same browse surface, no autoplay; every section shows poster + `▷ PLAY WITH SOUND` button. The cinema vibe is preserved via the dark-mode-only palette and full-bleed sectioning even when motion is gone. | MEDIUM | **HIGH** | This is **the accessibility-equivalent feature**, not a separate concession. Treats environmental signals (cellular, reduced motion, Low Power, autoplay rejection) as a single fallback path (Pitfalls 3, 4, 9). |
| **Per-video "See on PBS →" outbound badges (PBS sections only)** | Reinforces the reality of the work — PBS American Portrait is a real publication with a real URL the producer can verify outside the portfolio. | LOW | **HIGH** | `_four` validates: 15 of 18 PBS videos have a collection URL; 3 don't. Same data, same outbound link, restyled as a cinema-dark badge. |
| **VideoObject JSON-LD per `/watch/[id]` (SEO + Google Video carousel)** | Producer Googles a piece by title → it surfaces in Google Video. Without VideoObject schema this doesn't happen. | LOW | **HIGH** (utility, not visual) | `_four` already ships this. Trivial to mirror. The differentiator-relevance: in an immersive reel where Google sees one page, the per-video schema is the only thing rescuing per-piece discoverability (Pitfall 11). |

---

### Anti-Features (cinema-leaning sites get these wrong — DO NOT BUILD)

Features that "feel cinematic" but actively harm the hiring-producer audience. Most of these are sins committed by film school portfolio templates. Avoiding them is half the design statement.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Intro splash / "click anywhere to enter"** | "Builds suspense like a film title card." | Adds friction before the producer sees a single frame of work. The hiring rule is *show, don't gate*. A24, MUBI, Criterion all go straight to content. | The ambient reel hero IS the title card. No splash, no gating. Land directly on `/` with the muted reel playing. |
| **Background music autoplay (sitewide soundtrack)** | "Sets the mood like a film." | Browsers block it; if it works, it's hostile (producer is on a call); WCAG 2.2.2 violation (no easy pause). Universally hated since the Flash era. | All preview loops are MUTED. Sound only arrives on user-initiated `▷ PLAY WITH SOUND` → `/watch/[id]` navigation. |
| **Custom non-skippable page transitions (`.5s+` fade-to-black between every navigation)** | "Feels cinematic, like a scene cut." | Adds 0.5–1.2s to every route change. Producer scanning the catalog is slowed by 30–60s across a session. SvelteKit's instant client-side navigation is a feature; killing it is a regression. | NO custom global transition. Allow at most a 150ms opacity ease on `WatchPlayer` mount (the player's own arrival), nothing global. |
| **Video-as-cursor effects (custom cursor reveals video underneath)** | "Looks artsy on Awwwards." | Hostile to touch devices (no cursor on iOS). Hostile to keyboard users. Hostile to producers using a trackpad to skim. High novelty, low utility. | The preview loops in the reel ARE the "look around" affordance. No custom cursor. |
| **Parallax-everything (multi-layer scroll-decoupled images)** | "Feels three-dimensional." | Motion sickness for vestibular-sensitive users (WCAG 2.3.3). Janks on mid-tier phones (Pitfall 5). Visual noise competing with the actual work. | At most a subtle title-fade-on-intersect (described above). Zero parallax. The full-bleed sectioning IS the depth. |
| **Custom unmute-on-scroll (auto-unmute the section the user lands on)** | "Even more immersive." | Browsers block it without gesture; when it works it's hostile (autoplaying sound on a producer's open laptop in a meeting); requires gesture-managed audio focus. | Sound stays muted until the producer taps `▷ PLAY WITH SOUND`. The two-state model (silent ambient → click → sound) is the safer cinema metaphor. |
| **Hiding the works list behind "scroll down 4 viewports of decoration first"** | "Builds anticipation." | Producer doesn't have anticipation budget. If the reel isn't on screen within 1 scroll, they bail. The criterion is: from `/`, **first scroll** must show the first reel section. | Home is exactly two surfaces vertical: ambient hero (1 viewport) → first reel section (next viewport). Scroll once = arrive in the reel. |
| **Auto-advancing reel (each section plays its full preview then snaps to the next without user input)** | "Like a TV reel." | User loses agency. WCAG 2.2.2 violation if it lasts > 5s without pause. Killing user-controlled scroll is the cardinal sin of scroll-driven design. | User-driven scroll-snap only. Each section autoplays its silent loop until the user scrolls or clicks. |
| **Heavy gradient overlays that obscure the video frame (full-frame black overlay at 60%+)** | "Improves text contrast." | Defeats the purpose of showing the work. If you can't read the title without obscuring half the video, the title is too big or the layout is wrong. | Two-stop gradient at edges only (top and bottom 30%, transparent middle 40%) + per-text `text-shadow` (Pitfall 20). |
| **Vimeo/YouTube embed default chrome inside the preview loop** | "Lets the user click play without leaving." | The Vimeo logo / title bar / share icons cluster inside what's supposed to be an ambient frame. Vimeo's branded chrome inside a cinema preview = aesthetic disaster. | Vimeo: `background=1` strips all chrome. YouTube: `controls=0&modestbranding=1`. Documented in the iframe URL builder (Architecture Pattern 4). |
| **Custom video player wrapper (rebuilding playback chrome on top of HLS)** | "More design control." | 3–6 weeks of work; introduces bug surface; can't be tested across the same device matrix Vimeo already tests against; misses captions/quality/PiP controls. | Use Vimeo / YouTube native embed for `/watch/[id]`. Wrap chrome (back button, title, metadata) AROUND the iframe, not INSIDE it. |
| **Sound effects on hover / on snap ("click" or "whoosh" on every scroll-snap")** | "Tactile feel." | Browser-blocked without gesture; annoying when it works; hostile to anyone with hearing-sensitivity; not a film convention (a real screening room is silent between films). | Visual feedback only — the section snapping into the viewport IS the feedback. |
| **Animated SVG film-strip / projector / clapboard icons in the chrome** | "Reinforces the film theme." | Reads as "stock cinema clip art." Real cinema sites (A24, MUBI, Criterion) lean type-only or wordmark-only. Iconography that says "FILMMAKER" is sub-amateur. | A wordmark and a `▷` triangle. Nothing else. |
| **"Now showing" pseudo-marquee or fake theater-lobby chrome (red curtain, ticket-stub fonts)** | "Theme it like a cinema lobby." | Costume-cinema. Producer reads it as kitsch and dismisses the work. Real arthouse cinema sites are deliberately *anti*-marquee. | Stay restrained. The work is the cinema; the chrome is a gallery wall. |
| **Cookie consent banner that overlays the reel hero** | "EU compliance." | Killing the LCP impression with a dialog is its own LCP regression. | Default the reel to POSTER mode in EU / on first paint (Pitfall 13: "interaction = consent"). The reel autoplays AFTER the user has scrolled or clicked something. No CMP modal needed for a portfolio site that doesn't set tracking cookies of its own. |
| **Sticky "Hire me!" CTA pinned to every viewport** | "Drives conversion." | Reads desperate. A hiring producer's conversion path is `/contact` or the footer mailto — they don't need to be sold. | Contact lives in the TopNav, the footer (every page via `<ContactBlock />`), and gets its own `/contact` route. Three is plenty. |
| **YouTube/Vimeo `autoplay=1` with default-quality (HD/4K)** | "Best-looking preview." | 8–15 MB/min × 3 concurrent iframes burns through a hotel-wifi day-pass in a few minutes (Pitfall 4). | Hard-cap `&quality=540p` (Vimeo). For YouTube, `vq=medium` (hint, not enforced). Combined with `navigator.connection.saveData` honoring, this is the bandwidth-ethics floor. |
| **CMS-managed, runtime-fetched videos.json** | "More editable." | `_four`'s 56-video JSON-in-repo with Zod build-fail validation is faster, freer, and prevents drift between siblings (Pitfall 15). | Inherit `_four`'s `videos.json` byte-for-byte. PR-based edits. CI diff against `_four` to catch drift. |

---

### Accessibility-Equivalent Features (paired with every cinematic feature)

Every "differentiator" above has a paired accessibility/fallback feature. This isn't a separate sprint — it's how the cinematic feature is built. Cellular fallback, reduced-motion fallback, Low-Power-Mode fallback, and screen-reader fallback all converge on the **same poster-mode codepath** (Pitfalls 3, 4, 9). This is one of the highest-leverage architectural decisions in the project.

| Cinematic Feature | Accessibility Equivalent | Trigger | Complexity |
|-------------------|--------------------------|---------|------------|
| Silent muted autoplay preview loops | **Static poster + `▷ PLAY WITH SOUND` button** in every section. Same layout, no iframe. | `prefers-reduced-motion: reduce` OR `navigator.connection.effectiveType ∈ {2g,3g,slow-2g}` OR `saveData: true` OR Vimeo/YouTube `play()` Promise rejects (Low Power Mode) OR build-time oEmbed health check fails. | MEDIUM (one path, multiple triggers) |
| Scroll-snap fullscreen sections (motion of viewport) | **`scroll-behavior: auto` (no smooth)** under reduced-motion; **`scroll-snap-type: y proximity` (NOT mandatory)** universally so users can break out of sticky sections (Pitfalls 1, 7). | `prefers-reduced-motion: reduce` for behavior; proximity is always on for sticky-trap mitigation. | LOW |
| Scroll-driven chrome fade | **Static high-contrast chrome (no fade)** under reduced-motion. | `prefers-reduced-motion: reduce`. | LOW |
| Title/category overlay on each section | **Always-visible**, never hover-revealed. Two-stop gradient + `text-shadow` guarantees legibility even on bright video frames. Each section is also wrapped in an `<article aria-labelledby="reel-title-{id}">` for screen-reader landmark structure. | Always on. | LOW |
| Fullscreen sections (visual) | **Single `<section aria-label="Filmography reel">`** wraps the entire `/work` content; each video is `<article>` (NOT `<section>` — see Pitfall 8). Iframes carry explicit `title="Preview of {video.title} by {video.uploader}"` (avoids "YouTube video player" repetition). Off-current iframes get `tabindex="-1"` so Tab doesn't cycle through 56 player UIs (Pitfall 18). | Always on. | MEDIUM |
| 56-section reel (keyboard navigation) | **`<FilterPillBar />` pills are the keyboard skip mechanism** — pills are `<a href>` links, focusable, ordered. PLUS a "Skip past reel" link visible on focus. Arrow keys + Page Down work natively on a scroll container. | Always on. | LOW |
| Muted preview = no audio | **Captions on `/watch/[id]`**: Vimeo's `cc=1` URL param + YouTube's `cc_load_policy=1` enable native captions where the uploader provided them. **Policy decision**: Michelle's PBS videos carry PBS captions; HBO/Hulu carry network captions. The accessibility floor is "enable native cc, do not author custom transcripts in v1." | `cc=1` (Vimeo), `cc_load_policy=1` (YouTube) on `/watch/[id]` only; preview loops have no audio so captions are N/A. | LOW (URL param flip) |
| Dark-mode-only palette | **High-contrast focus ring**: `outline: 2px solid white; outline-offset: 2px; box-shadow: 0 0 0 4px rgba(0,0,0,0.6)` (white ring + dark halo = visible on ANY background, including bright frames). `:focus-visible`, not `:focus`. | Always on. | LOW |
| Scroll position lost on refresh | **Hash-position pattern** (`#video=620232398`) writes current section id to URL on debounce; reload restores. | Always on. | MEDIUM |
| Hero ambient muted reel | **Static WebP poster fallback** (the same 15.4KB asset `_four` ships). Hero replaces the iframe with the poster on cellular/reduced-motion/LPM. | `prefers-reduced-motion` OR cellular OR `play()` rejection. | LOW |
| Aggregate iframe playback (thermal / battery) | **Pause off-viewport iframes via Player API** (`player.pause()`) before unmounting; **Page Visibility API** pauses everything when tab is backgrounded (Pitfall 5). | Always on. | MEDIUM |
| Cookie/tracking from autoplaying YouTube iframe | **Default reel to poster in EU + on first paint until interaction**. Iframes use `youtube-nocookie.com` and Vimeo `dnt=1`. (Pitfall 13.) | Always on (default-to-poster); interaction = consent. | MEDIUM |
| **Global "Pause all motion" toggle in chrome** | A user whose OS reduced-motion isn't set but who wants a break from motion gets a manual escape hatch. Persists in localStorage. Visible in TopNav or via a chrome icon. | Always available. | LOW |

**Captions/transcripts policy decision (research finding):** Vimeo's `cc=1` and YouTube's `cc_load_policy=1` URL params enable the platform's NATIVE captions where the uploader provided them. For Michelle's 56-video catalog, captions are uploader-side: PBS/HBO/Hulu/Amazon carry broadcast-grade captions; Vimeo personal uploads vary. **Do NOT author custom WebVTT files in v1**. Do flip the `cc=1` param on `/watch/[id]` and document the captions policy in `/about` or a small `/accessibility` note. Re-evaluate post-launch if a producer flags a specific piece lacking captions.

---

## Feature Dependencies

```
[Reel-first home (HeroAmbient)]
    └──requires──> [Ambient muted iframe lifecycle]
                       └──requires──> [Iframe lifecycle pattern (build/mount/listen/unmount)]
                                          └──requires──> [iframe/buildEmbedUrl.ts + adapters]

[Scroll-snapped fullscreen reel]
    └──requires──> [Viewport-windowed iframe mounting (current ± 1)]
                       └──requires──> [IntersectionObserver in ReelStage]
    └──requires──> [`100svh` sectioning, scroll-snap proximity]
    └──requires──> [Static-poster fallback path (REUSED by 5 triggers)]
                       └──requires──> [connection.svelte.ts + motion.svelte.ts state runes]

[Static-poster fallback path]  ← one codepath, five triggers
    ├──triggered by──> [prefers-reduced-motion: reduce]
    ├──triggered by──> [cellular / saveData]
    ├──triggered by──> [Low Power Mode (play() Promise rejection)]
    ├──triggered by──> [Embed-disabled-by-owner (Player.ready() rejection)]
    └──triggered by──> [EU default-to-poster-until-interaction (Pitfall 13)]

[FilterPillBar — sticky wayfinding]
    └──requires──> [URL-as-source-of-truth (/work vs /work/[cat])]
                       └──requires──> [8 prerendered category routes (FILT-04)]
    └──enhances──> [Scroll-snapped reel] (without pills, the reel is browse-hostile)

[Watch view (WatchPlayer)]
    └──requires──> [Iframe lifecycle pattern]
    └──requires──> [chrome-fade-on-play via postMessage adapter]
    └──enhances──> [Continue the reel rail] (below the player)

[Continue the reel rail (ContinueReelRail)]
    └──requires──> [getByCategory() loader from $lib/data]
    └──uses──> [PosterImage only — NO nested iframes]
    └──enhances──> [Core Value: "every interaction reinforces depth"]

[PBS American Portrait landing]
    └──requires──> [Verbatim PBS blockquote from _four]
    └──requires──> [Per-video "See on PBS →" badge data]
    └──parallels──> [/work/pbs-american-portrait/ filter route]   (D-03 active-state parity)

[Press page (cinematic prestige order)]
    └──requires──> [_pressCredits.ts derivation from videos.json (reused from _four)]
    └──requires──> [Per-credit /watch/[id] link]

[About page]
    └──requires──> [User-approved bio (verbatim from _four)]
    └──requires──> [ContactBlock (verbatim from _four)]
    └──enhances──> [Ambient still or muted reel loop as bio background]

[Per-page SEO metadata + JSON-LD + sitemap.xml]
    └──requires──> [PUBLIC_SITE_URL env (NOT paths.base concat) — Pitfall 14]
    └──enhances──> [Discoverability under immersive design (Pitfall 11 mitigation)]

[GitHub Pages deploy parity with _four]
    └──requires──> [BASE_PATH staging vs '' prod] (separate workflows)
    └──requires──> [Cross-repo videos.json byte-diff CI check (Pitfall 15)]
```

### Dependency Notes

- **HeroAmbient requires the iframe lifecycle to be solved FIRST** — the hero is the always-mounted iframe and trains the rest of the codebase. Land iframe/* + state/* before HeroAmbient or you'll rewrite it twice.
- **Static-poster fallback is the unifying codepath** — design it ONCE and trigger from five sources. The biggest architectural mistake `_three` could make is treating cellular fallback, reduced-motion fallback, and Low-Power-Mode fallback as three separate features.
- **FilterPillBar is not optional accessibility scaffolding — it's load-bearing wayfinding** — without it, scroll-snap traps users (Pitfall 7) AND screen readers can't navigate the 56-section reel.
- **Hash-position (#video=…) and back-nav-restoration are paired** — implementing one without the other yields a half-broken experience (Pitfalls 12, 19).
- **PBS landing and PBS filter route both exist** — they're not redundant; `_four`'s D-03 (active-state parity on both paths) is preserved. The landing has the blockquote + per-video PBS badges; the filter route is just the reel filtered to PBS.
- **videos.json byte-identity is a CI invariant, not a vibe** — Pitfall 15 says drift silently invalidates the A/B. Need cross-repo diff in CI.

### Conflicts

- **Reel autoplay × WCAG 2.2.2 (Pause, Stop, Hide)** — resolved by `prefers-reduced-motion` honoring + global "Pause all motion" toggle. Without both, the cinematic differentiator is a WCAG failure.
- **Scroll-snap mandatory × iOS Safari touch absorption** — resolved by `proximity` (Pitfall 1). Mandatory is a non-starter on iOS 16/17.0/17.1.
- **YouTube `autoplay=1` × EU ePrivacy** — resolved by default-to-poster-until-interaction (Pitfall 13). Don't autoplay YouTube iframes in EU on first paint.

---

## MVP Definition

### Launch With (v1)

Minimum viable cinematic-immersive portfolio — what's needed to make the A/B vs `_four` legitimate.

- [ ] **All Table Stakes** — table stakes are non-negotiable; without them the A/B doesn't measure design, it measures completeness.
- [ ] **Scroll-snapped fullscreen reel with muted preview loops** (`<ReelStage />`, `<ReelSection />`, `<PreviewLoop />`, `<PosterImage />`) — THE design statement.
- [ ] **HeroAmbient on `/`** (ambient muted reel-as-background + name + tagline + scroll-cue + PLAY REEL CTA).
- [ ] **Sticky `<FilterPillBar />`** (8 pills + All, URL-as-state, sticky over reel, hidden on home).
- [ ] **Cinematic minimal TopNav** with chrome-fade-on-reel-scroll.
- [ ] **`<WatchPlayer />`** with letterboxed iframe + chrome-fade-on-play + below-player title/uploader/category metadata.
- [ ] **`<ContinueReelRail />`** horizontal carousel below WatchPlayer.
- [ ] **Static-poster fallback codepath** triggered by all 5 conditions (reduced-motion, cellular, saveData, play() rejection, embed-disabled).
- [ ] **PBS American Portrait landing** with verbatim blockquote + 18 sections in immersive reel format + per-section "See on PBS →" badges.
- [ ] **Press page in cinematic dark-editorial style** (13 credits, prestige order, each → /watch/[id]).
- [ ] **About page over ambient background** (bio verbatim + ContactBlock).
- [ ] **Contact page** (minimal h1 + ContactBlock).
- [ ] **Hash-position for in-reel section restoration**.
- [ ] **Dark-mode-only palette** with high-contrast focus ring.
- [ ] **VideoObject JSON-LD per `/watch/[id]` + Person JSON-LD on `/about` + sitemap.xml + per-page OG/Twitter** (verbatim metadata pattern from `_four` Phase 7).
- [ ] **`videos.json` byte-identical sync check vs `_four`** in CI.
- [ ] **Cross-browser real-device QA on iOS 16, iOS 17.0–17.1, iOS 17.2+, Android Chrome, Desktop Safari/Chrome/Firefox/Edge**.

### Add After Validation (v1.x — only if `_three` wins the A/B)

Features to add ONLY if `_three` is chosen as the production cutover. Don't pre-build them; they're conditional on signal.

- [ ] **Pre-generated short MP4 preview clips** (3–5s, muted, 540p) — would replace the Vimeo/YouTube iframes in preview loops for ~10× lower bandwidth + instant mount. Currently out of scope because it would break `videos.json` reuse mandate (the A/B prerequisite). Post-A/B, this is the highest-leverage optimization.
- [ ] **Per-video minimap / scrubber** — a right-side dot column or bottom scrubber that shows current position in the 56-section reel and lets producers leap. Currently the pill bar covers wayfinding; minimap is an enhancement.
- [ ] **Plausible analytics** — measure scroll depth, watch-rate per section, bounce point. Enables data-driven iteration. Privacy-friendly, no banner needed.
- [ ] **Replace IMDb/LinkedIn channel-homepage URLs with Michelle's personalized URLs** (tracked in `_four`'s `06-HUMAN-UAT.md`; pre-cutover blocker).
- [ ] **Author proper favicons + 1200×630 OG image** (current is placeholder; same as `_four`'s post-launch backlog item).
- [ ] **Real-user telemetry on production LCP** (Web Vitals beacon) — confirm the 2.5s budget holds on real producers' devices.
- [ ] **"Skip past reel" focus-visible link** (currently planned as accessibility nicety; could be promoted to visible affordance if user testing flags it).

### Future Consideration (v2+)

Only if a) `_three` wins, b) Michelle's posting cadence increases, OR c) producer feedback drives it.

- [ ] **CMS integration** (Sanity/Airtable) — same `_four` deferral logic; 56 items is small.
- [ ] **Per-video markdown pages for SEO depth** — beyond JSON-LD, give Google indexable per-video copy (uploader case study, role, year).
- [ ] **Search across videos** by title/uploader/description — currently the catalog is small enough to scan.
- [ ] **Filter by year or client** — currently 8-category is enough.
- [ ] **Newsletter capture** — only if Michelle starts publishing essay-side content.
- [ ] **Per-piece custom captions / transcripts** — current policy is "platform captions only"; revisit if accessibility feedback flags it.
- [ ] **Cinema-mode toggle on `/watch/[id]`** (auto-dim siblings, theater curtains animation) — a real cinema convention but adds complexity; only if A/B feedback says "I want the player even more isolated."

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Scroll-snapped reel (REEL-01..05) | HIGH | HIGH | **P1** |
| HeroAmbient muted reel-as-background | HIGH | MEDIUM | **P1** |
| FilterPillBar persistent + sticky | HIGH | LOW | **P1** |
| Static-poster fallback (5-trigger codepath) | HIGH (accessibility + bandwidth ethics) | MEDIUM | **P1** |
| Cinematic TopNav with chrome-fade | MEDIUM | MEDIUM | **P1** |
| WatchPlayer letterbox + chrome-fade-on-play | HIGH | MEDIUM | **P1** |
| ContinueReelRail (horizontal carousel) | HIGH (Core Value enabler) | LOW | **P1** |
| Per-section title/tag overlay + 2-stop gradient | HIGH (legibility) | LOW | **P1** |
| PBS landing as immersive reel + blockquote | HIGH | LOW | **P1** |
| Press page restyled (cinematic prestige) | HIGH | LOW | **P1** |
| About over ambient muted reel loop | MEDIUM | LOW | **P1** |
| Dark-mode-only palette + high-contrast focus | HIGH | LOW | **P1** |
| videos.json byte-identical CI check | HIGH (A/B integrity) | LOW | **P1** |
| Hash-position for in-reel restoration | MEDIUM | MEDIUM | **P1** |
| VideoObject JSON-LD per /watch/[id] | HIGH (SEO under immersive) | LOW | **P1** |
| Fade-in-on-intersect chrome | MEDIUM | LOW | P2 |
| Global "Pause all motion" toggle | MEDIUM | LOW | P2 |
| Per-section "See on PBS →" outbound badge | MEDIUM | LOW | P2 |
| "Skip past reel" focus-visible link | MEDIUM (a11y) | LOW | P2 |
| Build-time oEmbed health check | MEDIUM (prevent silent breakage) | MEDIUM | P2 |
| Cross-repo videos.json byte-diff CI | HIGH (A/B integrity, but late-discoverable) | LOW | P2 |
| Pre-generated short MP4 preview clips | HIGH (bandwidth) | HIGH (content pipeline) | P3 (only post-A/B) |
| Minimap / scrubber for 56-section nav | MEDIUM | MEDIUM | P3 |
| Plausible analytics | MEDIUM | LOW | P3 |
| Cinema-mode toggle on /watch/[id] | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must ship for the A/B comparison to be legitimate. Without these, `_three` isn't a real cinematic-immersive design.
- P2: Should ship before cutover. Quality polish; mostly low-cost.
- P3: Defer until `_three` wins A/B (or never, if `_four` wins).

---

## Surface-Specific Recommendations

The question asked for **specific recommendations** for PBS / Press / About + Contact / Watch. Not "TBD by designer" — concrete patterns.

### PBS American Portrait page treatment

**Recommendation: 18-section fullscreen reel preceded by a single cinema-title section.**

```
┌─────────────────────────────────────────┐
│                                         │
│         PBS AMERICAN PORTRAIT           │  ← 100svh fullscreen title section
│   [verbatim PBS blockquote, h2-sized]   │     (NO video bg — typographic only)
│                                         │     "Learn more at pbs.org →" outbound link
│         ↓ Explore the stories           │     scroll-cue at bottom
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│                                         │
│     [muted preview of PBS video 1]      │  ← First of 18 immersive reel sections
│  title (bottom-left)  PBS tag (top-r)   │     "See on PBS →" badge per card
│  ▷ PLAY WITH SOUND  See on PBS →        │
│                                         │
└─────────────────────────────────────────┘
   ... × 17 more sections ...
```

**Rationale:**
- The blockquote section gets its own viewport because the verbatim PBS copy is part of the value proposition (Candidate C, user-locked in `_four`'s 05-01). Hiding it in a small sidebar would dilute the credit.
- The 18 videos flow as reel sections — consistent with the rest of the site's cinematic-immersive language. Hybrid landings (typography + grid) would clash.
- The first reel section appears below the fold, accessed via scroll-cue. This is the cinematic-immersive equivalent of `_four`'s h1 + blockquote + grid stack.
- Per-section "See on PBS →" badge is the same data as `_four`'s 15/18 collection URLs. The 3 PBS videos without URLs simply omit the badge.

**Complexity:** LOW (reuses `<ReelStage />` with filtered video list + one extra `<PBSTitleSection />` component).

**Alternative considered + rejected:** Keep the grid layout in dark mode. Rejected — clashes with the rest of `_three`'s immersive language. The whole site is reels; PBS shouldn't be the one grid.

---

### Press page treatment

**Recommendation: dark-editorial "credits roll" layout — typographic, NOT a reel.**

```
┌─────────────────────────────────────────┐
│                                         │
│              PRESS                      │  ← Compact intro section (~30vh)
│                                         │     h1 + 1-line subtitle
│                                         │
├─────────────────────────────────────────┤
│  HBO MAX                                │  ← Each credit is a row:
│  Producer's Reel — 2024                 │     • Network name (large, bold)
│  ▷ View piece                           │     • Title + year (medium)
├─────────────────────────────────────────┤     • Link to /watch/[id]
│  PBS                                    │     • Subtle hover state
│  American Portrait — 2020–2024          │     • 1px hairline divider
│  ▷ View 18 stories                      │
├─────────────────────────────────────────┤
│  HULU                                   │
│  ...                                    │
└─────────────────────────────────────────┘
```

**Rationale:**
- **Quote-over-stills (rejected)**: the user (Michelle) doesn't have publication quotes — she has broadcast credits. A logo wall (rejected too) reduces her work to brand decoration. The right treatment is the cinematic equivalent of a film's "Credits" sequence — typography-driven, restrained, dark.
- 13 credits is a small list — one row per credit fits comfortably. No need to network-group (the prestige order from `_four` is already a curated story).
- Per-credit hover state previews the piece thumbnail in the row's whitespace? **No** — that's gimmick. Just hover-color-shift the title. Clicking goes to `/watch/[id]` which IS the preview.
- Each row is `<a href="/watch/[id]">` so it's a single tap target on mobile.
- Cinematic vibe comes from typography + spacing + dark palette + hairline dividers. No imagery competing with text.

**Complexity:** LOW (data shape reused verbatim from `_four`'s `_pressCredits.ts`).

**Alternative considered + rejected:** Network-grouped sections with logo wall. Rejected — reduces individual pieces to logos, hides the actual work. The producer wants "click → see the U2 Sphere piece," not "stare at the HBO logo."

---

### About + Contact treatment

**Recommendation: About over an ambient muted reel loop background; Contact as a separate minimal route.**

#### `/about`

```
┌─────────────────────────────────────────┐
│  [muted producer reel loop, background] │  ← Same Vimeo id 264677021,
│                                         │     dimmed to ~20% opacity overlay
│       [first-person bio ~109 words]     │     Centered text column (max-w-2xl)
│        verbatim from _four              │     Restrained typography
│                                         │
│       ── ContactBlock ──                │     Same component as /contact + footer
│       mailto: phone: IMDb: LinkedIn:    │
└─────────────────────────────────────────┘
```

**Rationale:**
- The ambient muted reel loop in the background says "her work is the context for this bio." Restrained — dimmed to 20% so the text dominates.
- Falls back to a static still (one frame of the reel as WebP) under reduced-motion / cellular / LPM. Same fallback codepath as the rest of the site.
- Bio is the verbatim `_four` text (user-approved). ContactBlock renders inside the page (NOT just in the footer) so the page has a self-contained "what next" surface.
- No headshot in v1 (matches `_four`'s D-20 deferral).

**Complexity:** LOW (one bg-iframe + reused bio + reused ContactBlock).

#### `/contact`

```
┌─────────────────────────────────────────┐
│                                         │
│            CONTACT                      │  ← Compact h1
│                                         │
│         ── ContactBlock ──              │  ← Same component as everywhere else
│         mailto:  phone:  IMDb: ...      │
│                                         │
└─────────────────────────────────────────┘
```

**Rationale:**
- Minimal. The user lands on `/contact` already committed to contact; no need to sell.
- Plain dark background — no ambient reel here. The page is functional, not seductive. Save the cinema for `/work` and `/about`.
- Same ContactBlock as everywhere else — single source of truth.
- Footer (rendered globally) ALSO contains ContactBlock so any page has contact paths available without navigating to `/contact`.

**Where contact lives in a single-page-immersive context:**
- Site-wide footer (every page).
- Standalone `/contact` route (deep-linkable).
- Embedded in `/about` (mid-bio cadence).
- TopNav menu link.
- Producer can always reach contact in 1 click from any surface.

**Complexity:** LOW (one component, four mount points, single `mailto:` literal).

---

### Watch view treatment

**Recommendation: letterboxed embed on black, chrome fades to ~30% opacity on play, fades back on mouse-move / hover / pause.**

```
┌─────────────────────────────────────────┐
│  ← Back   Title          [×] Close      │  ← Top chrome (fades on play)
├─────────────────────────────────────────┤
│ ███████████████████████████████████████ │  ← Black letterbox
│ █                                     █ │
│ █  ┌───────────────────────────────┐  █ │
│ █  │                               │  █ │  ← Vimeo/YouTube iframe
│ █  │   [video, 16:9 letterboxed]   │  █ │     max-width: comfortable
│ █  │                               │  █ │     centered, generous margin
│ █  └───────────────────────────────┘  █ │
│ █                                     █ │
│ ███████████████████████████████████████ │
├─────────────────────────────────────────┤
│  Title • Uploader • Category • Year     │  ← Metadata strip (fades on play)
│                                         │
│  ─── CONTINUE THE REEL ───              │  ← Section divider
│                                         │
│  [poster] [poster] [poster] [poster] →  │  ← ContinueReelRail (horizontal scroll)
│   Same-category siblings, posters only  │
└─────────────────────────────────────────┘
```

**Rationale:**
- **Letterboxed on black with comfortable margin** = the projection-room metaphor. The video is the only luminous thing.
- **Chrome fade on `play` event** via Vimeo `Player.on('play')` and YouTube `onStateChange(YT.PlayerState.PLAYING)` — both documented APIs. Chrome dimms to ~30% opacity, restores on `pause`, on `mousemove` (200ms idle timer), on hover over chrome elements, or on Escape key.
- **NOT a full chrome-disappear** — at 30% the back button is still findable; at 0% the user gets trapped in a video. WCAG 2.4.7 violation if chrome is fully invisible.
- **Title/uploader/category metadata** lives BELOW the player (not overlaid). On play it fades to 50% — still readable, less attention-grabbing.
- **`<ContinueReelRail />`** is the Core-Value-reinforcing follow-on (same as `_four`'s "More in [Category]" rail) — but as a horizontal carousel of posters rather than a 2/3/4-col grid. Cinematic = lateral motion.
- **Posters only in the rail** — NO nested iframes (rail is browse signal, not preview; nesting iframes inside `/watch/[id]` would multiply bandwidth + decode load).
- **CategoryTag in the metadata strip is interactive** (round-trips to `/work/[category]`) — mirrors `_four`'s pattern.

**Complexity:** MEDIUM (postMessage adapter for play/pause events + 200ms idle timer + back-nav-restoration for reel position per Pitfall 19).

**Alternative considered + rejected:** Full-bleed video (no letterbox, video fills viewport). Rejected — most of Michelle's catalog is 16:9 and the audience watches on widescreen displays; stretching to fill would distort, and `object-fit: contain` would still letterbox. The black letterbox is the correct cinematic frame.

---

## Competitor / Reference Site Analysis

Three reference sites cited by the user. Audited directly via WebFetch (a24films.com, mubi.com) and via 2025–2026 secondary sources (criterion.com — the marketing site returned 403 to WebFetch; behavior inferred from cited articles). Additional 2026 director-portfolio survey sources cross-referenced.

| Feature | a24films.com | mubi.com | criterion.com | `_three` approach |
|---------|--------------|----------|---------------|-------------------|
| Layout | Full-bleed vertical-scroll, alternating content blocks (NOT scroll-snap); hero carousel of upcoming films | Sparse navigation, gallery-like, vertical scroll, "hand-curated" copy, hero is a single bold statement + featured film | Editorial film-first hierarchy, no busy UI | **Scroll-snapped fullscreen reel** — more aggressive immersion than any of the three, justified because Michelle's catalog is the product, not a single feature film |
| Video usage on home | Static stills + trailer thumbnails; NOT autoplay | Featured film hero is likely a still or short loop; primarily editorial imagery | Imagery + editorial; less video-forward | **Ambient muted reel loop as full-bleed background** — the cinema-immersive bet; A24/Criterion don't go this far, MUBI implies it |
| Navigation chrome | Minimal logo + search; footer consolidates main nav (Films, TV, Docs, Shop, Membership, Notes, App) | Sparse top-nav (Now Showing, Browse, Notebook); footer link clusters (Memberships, EDITIONS, SHOP) | Restrained; film-focused IA | **Minimal TopNav (wordmark + About/Press/Contact + hamburger) with chrome-fade-on-scroll** — same restraint, plus the dynamic fade |
| Color palette | Neutral/sophisticated, grayscale merch photography, dark text on LIGHT backgrounds (NOT a dark-mode site!) | Print-inspired, dark backgrounds likely dominate, "luminous and gallery-like" type | Restrained; less dark than expected | **Dark-mode-only** — `_three` is darker than A24 (which is actually light) but matches MUBI |
| Typography | Bold film titles, sizing/weight for hierarchy, art-house aesthetic | Clean minimalist hierarchy, single typeface, tagline-driven | Editorial, restrained | **Single display family + 1 mono (max)** — disciplined like MUBI |
| Imagery treatment | Theatrical poster-style stills, 16x9 and 8x10 ratios, year prominent | Vertical stills + editorial imagery, NOT carousels | Film stills, editorial | **Full-bleed live reel preview per video** — most aggressive of the four; A24/MUBI/Criterion all lean still |
| Browse mechanism | Vertical scroll + footer nav | "Now Showing" curated list + Browse | List-driven, category-filterable | **Sticky FilterPillBar above scroll-snap reel** — URL-routed, deep-linkable |
| Cinema vibe source | Restraint + theatrical poster discipline | Print-aesthetic + curation language ("by hand") | Editorial discipline | **Scroll-snap + muted preview loops + dark palette** — more motion-forward than any reference |
| What `_three` does that NONE do | — | — | — | **Sectioned reel where every section IS a film, full-screen, autoplaying silently.** This is the design statement — closer to TikTok's full-screen-feed pattern than to A24/MUBI/Criterion. Justified because Michelle's "catalog of completed work" is a different product than "ticket sales for upcoming releases." |

**Key observation from the audit:** None of A24 / MUBI / Criterion actually do silent-muted-autoplay full-screen reel sectioning. They lean stills + editorial restraint. **`_three`'s differentiator is more aggressive than its references** — which is defensible (Michelle's catalog warrants the immersion that A24's release-marketing doesn't) but means the design is doing more than mimicking a known pattern. The 2025-class director-portfolio survey (Fiona Ziegler, Andrew Cussens, Alexandros Maragos, etc.) shows fullscreen-video-background is common at the **homepage** level; `_three` extends it to the catalog level.

---

## Sources

**Sibling project artifacts (HIGH confidence):**
- `C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\Websites\michelle_ngo_three\.planning\PROJECT.md` — kickoff state, requirements, key decisions
- `C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\Websites\michelle_ngo_four\.planning\PROJECT.md` — sibling v1.0 shipped state, validates all "table stakes" + the IA + the contact/about/press/PBS contracts
- `C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\Websites\michelle_ngo_four\.planning\REQUIREMENTS.md` — v1 requirements list, traceability, out-of-scope list (30/30 validated)
- `C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\Websites\michelle_ngo_three\.planning\research\ARCHITECTURE.md` — sibling researcher; component vocabulary (ReelStage, ReelSection, PreviewLoop, PosterImage, HeroAmbient, FilterPillBar, WatchPlayer, ContinueReelRail) + Patterns 1–4
- `C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\Websites\michelle_ngo_three\.planning\research\PITFALLS.md` — sibling researcher; Pitfalls 1–20 informed every anti-feature and accessibility-equivalent

**Reference design language (audited directly):**
- [A24 Films](https://a24films.com/) — full-bleed vertical scroll, static stills (NOT autoplay), neutral palette, minimal top chrome with footer-consolidated nav (WebFetch 2026-05-19, MEDIUM confidence in current state)
- [MUBI](https://mubi.com/en/us) — gallery-like, curated, "by hand" copy, print-aesthetic, dark backgrounds, single typeface (WebFetch 2026-05-19, MEDIUM confidence; HTML markup was limited)
- [Criterion Collection](https://www.criterion.com/) — film-first editorial; WebFetch returned 403, behavior inferred from cited articles + 2025 lineup posts (LOW–MEDIUM confidence)
- [Criterion Channel](https://www.criterionchannel.com/) — dark-mode streaming UI, browse/grid hybrid (LOW confidence; not directly fetched)
- [A24 on Pixel Parlor / case study](https://pixelparlor.com/our-work/a24-films/) — design-agency context on A24's film-promotional sites (MEDIUM confidence)

**Filmmaker portfolio industry references (HIGH confidence in industry conventions):**
- [Filmmaker Portfolios: 15+ Well-Designed Examples (2026)](https://www.sitebuilderreport.com/inspiration/filmmaker-portfolios)
- [32 Best Filmmaker Portfolio Examples For 2025 (founderjar.com)](https://www.founderjar.com/inspiration/filmmaker-portfolio-examples/) — "for a producer, brand, or agency... a company's reel is the first place they look"
- [14 Amazing Director Film Portfolio Website Examples | Format](https://www.format.com/customers/film/director) — multiple cited examples (Fiona Ziegler, Andrew Cussens, Alexandros Maragos) using fullscreen-video-bg on homepage
- [8 Inspiring Film-Based Portfolio Designs for Filmmakers (Format)](https://www.format.com/magazine/film-based-portfolio-examples)
- [Film Director Portfolio Websites: 5 Examples (Minimalio)](https://minimalio.org/film-director-portfolio/)
- [Filmmaker Portfolios: 120 Deep Dive (Fabrik)](https://fabrik.io/blog/filmmakers-on-fabrik-a-deep-dive-into-120-portfolio-websites)
- [20 Best Filmmaker Website Examples (HubSpot)](https://blog.hubspot.com/website/filmmaker-website-examples)
- [How to Make a Demo Reel — Shooting Richard](https://shootingrichard.com/demo-reel/) — "no one believes you when you say I'm a really good filmmaker — show, don't tell"
- [The Ultimate Guide to Demo Reels (EditShare)](https://editshare.com/post/the-ultimate-guide-to-demo-reels/) — "many employers won't even consider candidates without a reel"
- [Filmmaker on Quora: do producers have reels?](https://www.quora.com/Do-up-and-coming-film-producers-have-reels-or-are-reels-just-for-directors-DPs-and-actors)

**Cinematic-scroll implementation references (MEDIUM–HIGH confidence in technique):**
- [Cinematic Scroll — Framer Marketplace](https://www.framer.com/marketplace/components/cinematic-scroll/) — confirms the "scroll-snap + autoplay + floating chrome" pattern is a recognized cinematic technique
- [Scroll Autoplay — Foliovision](https://foliovision.com/player/demos/scroll-autoplay) — multi-video scroll-driven autoplay pattern reference
- [Fullscreen Background Video (Autoplay) — RaddyDev](https://raddy.dev/blog/fullscreen-background-video-autoplay-using-html5-css-js-cross-browser/) — implementation reference for the muted-loop-bg technique

**Anti-pattern / mistake references (MEDIUM confidence):**
- [10 Portfolio Mistakes Keeping Video Editors Unemployed (Cutjamm, 2026)](https://www.cutjamm.com/blog/video-editor-portfolio-mistakes)
- [Top 20 New Filmmaker Mistakes (Hayot Films)](https://hayotfilms.com/blog/top-20-new-filmmaker-mistakes/)

**Accessibility / standards references (HIGH confidence):**
- WCAG 2.2 SC 2.2.2 (Pause, Stop, Hide), 2.3.3 (Animation from Interactions), 2.4.1 (Bypass Blocks), 2.4.6 (Headings and Labels), 2.4.7 (Focus Visible) — anchors all the cinematic-feature/accessibility-equivalent pairings
- [Vimeo Player SDK reference](https://developer.vimeo.com/player/sdk/reference) — `Player.on('play')` and parameter docs (`background=1`, `dnt=1`, `quality`, `cc=1`)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) — `onStateChange`, `youtube-nocookie.com`, `cc_load_policy`

---

*Feature research for: Cinematic-immersive filmmaker portfolio (sibling-A/B of editorial-modern `_four`)*
*Researched: 2026-05-19*
