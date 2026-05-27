# Phase 5: Hero & Watch - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 05-hero-watch
**Areas discussed:** Hero composition on /, Watch player surface, Continue-the-reel rail, Back-nav scroll restoration

---

## Hero composition on /

### Q1 — Composition strategy on `/`

| Option | Description | Selected |
|--------|-------------|----------|
| Full reel below; hero unmounts off-screen | `/` composes <HeroAmbient> + <ReelStage videos={allVideos}>. Hero always-mounted WHILE VISIBLE; swaps to poster when scrolled fully off-screen. Preserves Phase 3 D-09's peak-3-iframe budget. | ✓ |
| Full reel below; hero stays mounted forever | Hero NEVER unmounts — peak = 4 simultaneous iframes when reel is active. Re-opens Phase 3 D-09 thermal/battery bet. | |
| Hero-only; ↓ anchor links to /work | `/` is single fullscreen hero. ↓ scroll-cue is an anchor link to /work. Cleanest budget but loses HERO-02 cinematic "scroll into the work" promise. | |
| Hero + 3-5 teaser sections + 'View all' | Mirrors _four's pattern: hero + first 3-5 ReelSections + "View all work →" link to /work. Compromise. | |

**User's choice:** Full reel below; hero unmounts off-screen
**Notes:** Preserves Phase 3 D-09 budget cleanly while honoring HERO-02's "scroll past hero reveals the full /work reel below" promise. The hero IntersectionObserver swap is the load-bearing mechanism.

---

### Q2 — Hero deferred-load mechanism (POL-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 5 ships the deferral | Poster eager-load (LCP), iframe swaps in after requestIdleCallback / 1s timer / first pointer interaction. | ✓ |
| Phase 5 ships iframe eagerly; Phase 7 retrofits | Phase 5 mounts iframe directly; Phase 7 POL-02 wraps it in deferral. | |
| Eager iframe — skip deferral entirely | Accept LCP hit; cinema-first per PROJECT.md (2.5s budget is intentionally looser). | |

**User's choice:** Phase 5 ships the deferral
**Notes:** Phase 6 (ABT-01) depends on the same ambient-iframe pattern; retrofitting in Phase 7 would mean changing component shape after Phase 6 consumes it.

---

### Q3 — Hero fallback affordance

| Option | Description | Selected |
|--------|-------------|----------|
| Poster + ▷ PLAY REEL CTA only | Reuses existing CTA which navigates to /watch/264677021 per HERO-03. One affordance, two contexts. Mirrors Phase 3 PosterImage ▷ PLAY WITH SOUND pattern. | ✓ |
| Poster + ▷ PLAY REEL + ▷ START AMBIENT separate | Two affordances: PLAY REEL (sound, navigates); START AMBIENT (mounts muted iframe manually). User agency on cellular. More complex. | |
| Static name/tagline + ↓ to /work — no CTA | Strip CTA on fallback; just name + tagline + scroll-cue. Cinematic restraint but hides the action. | |

**User's choice:** Poster + ▷ PLAY REEL CTA only
**Notes:** One affordance keeps the surface area small. Reuses the same navigation target Phase 3 already wired (▷ PLAY WITH SOUND on reel sections deep-links to /watch/[id]).

---

### Q4 — Hero overlay content + position

| Option | Description | Selected |
|--------|-------------|----------|
| Centered: MICHELLE NGO + tagline + ▷ PLAY REEL + ↓ | Display-serif wordmark centered + tagline + pill CTA + bottom ↓ chevron. Two-stop gradient overlay (top + bottom). | ✓ |
| Lower-left stack (mirrors _four's hero) | Wordmark + tagline + CTA flex-stacked lower-left, sized 6xl–9xl uppercase. A/B parity but dilutes design statement. | |
| Minimal: tiny wordmark top-left + ▷ PLAY REEL bottom-center | A24/MUBI restraint. Bold but may underserve hiring producer needing 2-sec confirmation. | |

**User's choice:** Centered: MICHELLE NGO + tagline + ▷ PLAY REEL + ↓
**Notes:** PROJECT.md HERO-01 phrasing "name + tagline + ▷ PLAY REEL CTA centered" supports this. Display-serif (Source Serif 4) wordmark over the producer reel with two-stop gradient for legibility.

---

## Watch player surface

### Q1 — Player letterbox + canvas shape

| Option | Description | Selected |
|--------|-------------|----------|
| Edge-to-edge 100vw, 16:9 cap, vertical letterbox bars top/bottom | Player fills full width. Cinematic-immersive maxes the work. Matches a24films.com / MUBI feel. | ✓ |
| max-w-7xl centered, vertical letterbox bars both sides | Capped at ~80rem; black bars left+right on wide. More 'theater seat' feel. | |
| Fit-to-viewport — dynamic 16:9 inside 100svh, bars wherever needed | Maximum possible 16:9 rectangle in viewport. Most cinematic but math hairier. | |

**User's choice:** Edge-to-edge 100vw, height = 16:9 cap, vertical letterbox bars top/bottom
**Notes:** "Cinema-immersive maxes the work" matches `_three`'s design DNA. Black letterbox bars on tall viewports only; portrait phones get top-third player + chrome below.

---

### Q2 — Chrome-fade postMessage rules

| Option | Description | Selected |
|--------|-------------|----------|
| Play → fade out 600ms grace. Pause + idle-3s + mouse-leave → fade in | 600ms grace prevents flash-fade during mid-click on native player UI. Hover/dwell pattern. | ✓ |
| Play → fade out immediately. Hover anywhere → fade in (3s timer); pause → fade in | More aggressive cinema mode. Hover anywhere in viewport surfaces chrome for 3s. | |
| Manual only: fade is user-toggled via 'i' info button — no auto-fade | Skip postMessage coupling. Producer has full control; loses 'breathe with the work' feel. | |

**User's choice:** Play → fade out (delayed 600ms). Pause + idle-3s + mouse-leave → fade in immediately
**Notes:** 600ms grace covers the volume-button-mid-click edge case. Pause = immediate fade-in (clear user signal). Idle-3s + mouse-leave keep chrome out during dwell.

---

### Q3 — Metadata placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below player in flow + fades with chrome layer | Mirrors _four content shape; shares opacity state with back button + TopNav chrome. ONE fade controller, multiple consumers. | ✓ |
| Overlay on lower-third of player (gradient scrim) + same fade | Cinema-tight composition. Fights with native player chrome (Vimeo/YouTube controls in lower-third) — z-stack risk. | |
| Below player in flow, ALWAYS visible (no fade) | Solid metadata; only back-button + TopNav fade. Drifts from WATCH-02 fade-on-play requirement. | |

**User's choice:** Below player in flow + fades together with the chrome layer
**Notes:** Same content contract as _four (h1, CategoryTag → /work/[cat], uploader · year, optional description) but cinematically restyled and gated by the same fade state as the back button.

---

### Q4 — Watch route autoplay behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Lock buildEmbedUrl(video, 'play') — autoplay with sound | Phase 3 'play' mode already wired. Cellular bypassed via click = consent. | ✓ |
| Cellular gate — even on /watch, show poster + ▷ TAP TO PLAY on slow connections | Bandwidth ethics carry forward even after click. Extra tap; producers may think site is broken. | |
| Autoplay muted; user clicks native player UI to unmute | Avoids autoplay-with-sound browser blocks. Loses HERO-03 "plays with sound" promise. | |

**User's choice:** Lock buildEmbedUrl(video, 'play') behavior — autoplay with sound
**Notes:** Click = consent. iOS LPM provider-native ▷ overlay is acceptable degradation. Direct URL paste treated identically (URL itself is the action).

---

## Continue-the-reel rail

### Q1 — Rail implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Pure CSS scroll-snap-x mandatory + flex row | Native browser primitives matching Phase 3 vertical-reel posture. Zero new deps. | ✓ |
| embla-carousel-svelte 8.6.0 | Drag-on-desktop + dot indicators. Research recommended. ~10KB cost. | |
| Render as vertical grid (mirror _four's rail exactly) | Skip horizontal carousel; use _four's 2/3/4 grid. A/B parity but loses cinematic restyle promise. | |

**User's choice:** Pure CSS scroll-snap-x mandatory + flex row
**Notes:** Embla's drag-on-desktop + dot features aren't load-bearing for a sibling-discovery rail. Consistent with Phase 3's "use the browser" posture.

---

### Q2 — Card sizing + count per breakpoint

| Option | Description | Selected |
|--------|-------------|----------|
| Mobile 1.4, sm 2.4, md 3.4, lg 4.4 — fractional 'peek' | Partial-card on right edge as scroll affordance. Standard Netflix/Apple TV+ rail pattern. | ✓ |
| Mobile 1, sm 2, md 3, lg 4 cards exact — no peek | Cleaner edges but no affordance that more exists. | |
| Fluid: cards are fixed pixel-width (e.g., 320px) | Predictable density but inconsistent card sizes across devices. | |

**User's choice:** Mobile 1.4 cards visible, sm 2.4, md 3.4, lg 4.4 — fractional 'peek'
**Notes:** Aspect-video (16:9). Sizing via viewport-percentage classes (w-[70vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw]).

---

### Q3 — Rail heading + entry-point pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Heading-is-link — mirror _four D-36 verbatim | <h2><a href={`${base}/work/${slug}`}>More in {category} →</a></h2>. One element, two jobs. | ✓ |
| Heading + separate 'View all →' link below the rail | Two affordances, less ambiguous click target. | |
| No heading at all — just cards + subtle category chip on each | A24/MUBI minimalism. Loses explicit framing. | |

**User's choice:** Heading-is-link — mirror _four D-36 verbatim
**Notes:** A/B parity at IA level. Plus data-sveltekit-preload-data="hover" + ESLint per-file override for `svelte/no-navigation-without-resolve`.

---

### Q4 — Empty-rail / single-sibling handling

| Option | Description | Selected |
|--------|-------------|----------|
| Hide rail entirely when 0 siblings (mirror _four D-38) | {#if rail.length > 0}...{/if} wrap. A/B parity. | ✓ |
| Hide when 0; show 'View all in {category}' link when 1-2; full rail at 3+ | Smarter density adaptation. Slightly more conditional logic. | |
| Always show rail; render 'No other {category} videos yet' empty state | Never leaves producer wondering. More verbose. | |

**User's choice:** Hide rail entirely when 0 siblings (mirror _four D-38)
**Notes:** Defensive — corpus doesn't currently produce empty rails but the pattern is forward-safe.

---

## Back-nav scroll restoration

### Q1 — Restoration mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Hash-only — Phase 3's /work#video={id} hash is the entire state | Read window.location.hash on /work mount; scrollIntoView matching section. URL canonical. | ✓ |
| Hash + history.state object — belt and suspenders | Hash + state with section index + scrollY + timestamp. Doubles state surface. | |
| mnp_three_*-prefixed storage: 'last_reel_position' | Survives across reloads + new tabs. Violates Phase 4 D-13 URL-canonical principle. | |

**User's choice:** Hash-only — nothing new; just read window.location.hash on /work mount
**Notes:** Consistent with Phase 4 D-13. Phase 3's hash write IS the state. Zero new state surface.

---

### Q2 — Restoration trigger

| Option | Description | Selected |
|--------|-------------|----------|
| onMount in ReelStage: read hash, match video, scrollIntoView block:'start' auto | Single canonical hook. 'auto' (not smooth) for instant first-paint landing. | ✓ |
| popstate listener — only restore on browser back/forward gestures | Cleaner separation; manual paste wouldn't restore — UX divergence. | |
| SvelteKit afterNavigate callback — restore on every nav | Framework-native feel. Same effect as onMount here. | |

**User's choice:** onMount in ReelStage: read hash, match video, scrollIntoView block:'start'
**Notes:** Single canonical hook in ReelStage. behavior:'auto' (instant) avoids polluting cinema entry with scroll animation noise.

---

### Q3 — Direct URL paste case

| Option | Description | Selected |
|--------|-------------|----------|
| Same restoration kicks in — scroll target into view on first paint | Hash is source of truth. Shareable deep-link bonus. | ✓ |
| Direct paste lands at top; only back-nav restores | Restoration only fires via popstate; ignores direct paste. | |
| Direct paste shows banner 'jump to section?' — user confirms | One-tap banner; avoids surprise. Adds UI surface. | |

**User's choice:** Same restoration kicks in — scroll target video into view on first paint
**Notes:** Hash is source of truth regardless of arrival. Free shareable-deep-link bonus.

---

### Q4 — Cross-route arrival case

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — hash carries; producer lands back on section they came from | Hash matches video in current filtered set → restore; else top. Predictable. | ✓ |
| No — strip hash on every /watch/[id] → /work/[cat] click | Filter switch is a context switch; producer lands at top. | |
| Phase 5 doesn't ship cross-route restoration — only back-button | Scope = back-button only. | |

**User's choice:** Yes — hash carries across; producer lands back on the section they came from
**Notes:** SvelteKit nav preserves hash by default. Hash-matches-in-current-set → restore; else top.

---

## Claude's Discretion

- Exact file split (`<WatchPlayer>` vs `<WatchChrome>` vs inline in /watch/[id]/+page.svelte)
- Whether HeroDefer mechanism extracts to `$lib/heroDefer.svelte.ts` rune (Phase 6 ABT-01 reuse)
- Hero IntersectionObserver impl (`runed` vs inline DIY)
- Gradient overlay exact alpha + stop math
- Idle timer impl (setTimeout reset vs interval polling)
- Pointer-leave bounds (player rect vs main element)
- Autoplay-blocked recovery (lean on embed's native ▷ overlay)
- VideoObject JSON-LD exact shape (mirror _four)
- Mobile pointer-leave handling (touchend + idle-3s on mobile)
- Back-button label vs icon
- Card element semantic (<a> vs <button>+goto)
- ContinueReelRail accessibility (<nav> vs <section>)
- scrollIntoView fallback (not needed for target browsers)
- ESLint per-file overrides (mirror Phase 3/4 pattern)
- Test scope mapping (planner maps in 05-PLAN)

## Deferred Ideas

- embla-carousel-svelte dep (reopen if mouse-drag on desktop matters)
- Custom share modal (out of scope per REQUIREMENTS)
- history.state payload for back-nav (D-14 hash-only)
- mnp_three_* storage for last-viewed (URL canonical)
- ▷ START AMBIENT separate toggle on hero fallback
- /about ambient-loop reuse of HeroAmbient (Phase 6)
- /watch/[id] skeleton loader
- In-video deep-link timestamps
- /watch/[id] "Up Next" auto-advance
- Hover-to-preview on rail cards
- prefers-reduced-data Chromium-only PE
- Reduced-motion handling on /watch (WCAG 2.3.3 doesn't trigger for playback)
- iOS Safari edge-swipe back-button (native)
- Cellular gate on /watch (D-09 explicit click = consent)
- Skeleton/blur-up on rail cards (Phase 3 posters static + content-hashed)
- Sharing-with-timestamp deep-link param
