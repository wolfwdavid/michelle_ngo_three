# Phase 4: Wayfinding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 04-wayfinding
**Areas discussed:** FilterPillBar look + placement, TopNav + mobile menu behavior, Keyboard + focus contract, Filter-switch scroll posture

---

## FilterPillBar look + placement

### Q1: Where should the FilterPillBar sit relative to the reel?

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky band BELOW TopNav, above reel | TopNav row 1, pill bar row 2, both `position: sticky`. Reel section becomes `calc(100svh - 96px)`. | ✓ |
| Floating OVER the reel (top-center) | Floats with backdrop-blur; reel stays full `100svh`. Pills overlap title cards / talking heads. | |
| Inside the TopNav row (single sticky strip) | Combines wordmark + 8 pills + secondary nav in one row. Mobile hostile. | |
| Floating at the BOTTOM (thumb-zone) | Floats above mobile chrome; competes with PLAY WITH SOUND CTA. | |

**User's choice:** Sticky band BELOW TopNav, above reel (Recommended)
**Notes:** Eats ~96px of viewport but wayfinding always reachable. D-01.

---

### Q2: What visual treatment for the pills themselves?

| Option | Description | Selected |
|--------|-------------|----------|
| Rounded pills with OKLCH category accent on active | Reuses `--color-cat-*` from Phase 1 D-12. Inactive neutral, active accent fill + ring. | ✓ |
| Minimal underlined text (MUBI / Criterion vibe) | No pill shapes, just text + underline on active. Small tap targets. | |
| OKLCH-tinted stamps (cinematic-marquee) | Each pill permanently tinted in its category color. Loud at rest. | |
| Outlined stamps with accent on hover/active only | Thin border, neutral text, accent on interaction. | |

**User's choice:** Rounded pills with OKLCH category accent on active (Recommended)
**Notes:** Most recognizable as "filter pill"; reuses existing tokens. D-02.

---

### Q3: Where does the "All" pill live and how does it differ from category pills?

| Option | Description | Selected |
|--------|-------------|----------|
| First pill, neutral-styled, active on `/work` | Leftmost, neutral white/dark fill on active (no OKLCH accent). Conventional home-base. | ✓ |
| Last pill, styled as a "reset" / clear-X chip | Rightmost with `✕ Clear filter`. Hides on `/work`. | |
| No "All" pill — wordmark click resets | Wordmark doubles as filter reset. Invisible affordance. | |

**User's choice:** First pill, neutral-styled, becomes active on `/work` (Recommended)
**Notes:** Producers map left-to-right. D-03.

---

### Q4: How should the pill bar behave on narrow widths (<sm, mobile portrait)?

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll-x with snap | Single strip, `snap-x snap-proximity`, active pill auto-scrolls into view. | ✓ |
| Wrap to multiple rows | 2-3 rows; eats more vertical viewport. | |
| Collapse into hamburger menu only | Hides on `<sm`; categories only in MobileMenu. Violates "always visible" intent of FILT-01. | |
| Show 3-4 visible pills with "More …" expander | Nondeterministic; UI affordance not on desktop. | |

**User's choice:** Horizontal scroll-x with snap (Recommended)
**Notes:** Thumb-friendly; cinematic horizontal motion echoes the vertical reel. D-04.

---

## TopNav + mobile menu behavior

### Q5: What triggers the TopNav (and pill bar) to fade vs surface?

| Option | Description | Selected |
|--------|-------------|----------|
| Fade on active scroll, surface on scroll-stop + hover-near-top | Solid by default; `opacity-0` during active scroll (600ms debounce); surfaces on scroll-stop / hover top 80px / focus / tap. | ✓ |
| Fade always, surface only on hover-zone / focus / tap | Cinematic restraint; 600ms friction on first entry. | |
| Always solid, no fade | Violates NAV-01. | |
| Fade-on-play (postMessage-driven) | Timing varies per video; inconsistent with all-3-play. | |

**User's choice:** Fade on active scroll, surface on scroll-stop + hover-near-top (Recommended)
**Notes:** D-05. Chrome out of the way during consumption, available the moment they pause.

---

### Q6: Which routes get the chrome-fade behavior?

| Option | Description | Selected |
|--------|-------------|----------|
| Reel routes only: /work, /work/[cat], /pbs-american-portrait | Consistent rule: scroll-snap reel = fade. Other routes keep their own chrome rules. | ✓ |
| All routes | `/contact` shouldn't behave like `/work`. | |
| Only on /work and /work/[cat]; PBS keeps it solid | Inconsistent rule between identical scroll-snap surfaces. | |

**User's choice:** Reel routes only (Recommended)
**Notes:** D-06. Inverse rule from `_four`'s "transparent over hero only".

---

### Q7: Mobile hamburger overlay treatment?

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror _four's MobileMenu: full-screen `bg-black/95 backdrop-blur-sm`, instant | Reuse `_four/src/lib/components/MobileMenu.svelte` pattern. Saves design time. | ✓ |
| Cinematic-different: fade-in from edges + ambient muted reel loop bg | Heavier (iframe mount cost); more delight. | |
| Side-drawer from the right | Feels app-y; partial reel reveal looks half-finished. | |
| Bottom sheet (iOS-style) | Hides the reel; not paradigmatic for desktop. | |

**User's choice:** Mirror _four's MobileMenu pattern (Recommended)
**Notes:** D-07. A/B-parity-aligned on the chrome layer.

---

### Q8: When the mobile menu is open, what happens to the underlying reel?

| Option | Description | Selected |
|--------|-------------|----------|
| Pause via existing `reel:visibility` context | Reuse Phase 3 D-12; `documentHidden = true` while menu open. | ✓ |
| Leave iframes running underneath | Burns battery/bandwidth/thermal while menu open. | |
| Unmount the entire ReelStage | Violates Phase 3 D-12 "pause-not-unmount"; poster→iframe blink storm. | |

**User's choice:** Pause via existing visibilitychange path (Recommended)
**Notes:** D-08. Reuses 5-layer leak defense plumbing.

---

## Keyboard + focus contract (NAV-02 / NAV-03)

### Q9: Arrow keys + PageUp/PageDown mapping inside the reel?

| Option | Description | Selected |
|--------|-------------|----------|
| ArrowDown/Up + PageDown/Up + Space = next; Home/End = first/last | Standard reel interaction model. j/k optional, not shipped v1. | ✓ |
| Only PageUp/PageDown + Home/End (no arrows) | Reel users instinctively reach for arrows. | |
| Context-sensitive arrows (vertical in reel, horizontal in pill bar) | Implementation complexity. | |

**User's choice:** Arrow + PageUp/Down + Space + Home/End (Recommended)
**Notes:** D-09. Handler attaches to reel container, not global window.

---

### Q10: How should Tab move focus through the reel?

| Option | Description | Selected |
|--------|-------------|----------|
| Roving tabindex: only current section's interactive elements tabbable | Off-screen sections `tabindex="-1"`. Avoids 56-Tab nightmare (Pitfall 18). | ✓ |
| All sections tabbable in order | Violates Pitfall 18; hostile. | |
| Skip-link-driven hybrid | Similar to roving but with "reel as one stop" framing. | |

**User's choice:** Roving tabindex (Recommended)
**Notes:** D-10. Consumes Phase 3's `reel:stage` context `activeIdx` getter.

---

### Q11: Where does the skip-to-content link land?

| Option | Description | Selected |
|--------|-------------|----------|
| Jumps focus to `<main>` wrapping pill bar + reel | First Tab after jump lands on FilterPillBar; conventional WCAG 2.4.1 pattern. | ✓ |
| Jumps directly to first reel section's CTA | Skips pill bar; SR users can't reach filter without backing up. | |
| Jumps to active section's CTA (uses activeIdx) | Non-deterministic on initial visit. | |

**User's choice:** Jumps to `<main>` (Recommended)
**Notes:** D-11. SR rotor: `<main>` + ONE `<nav>` + 56 `<article>` (NAV-03 landmark structure).

---

### Q12: What does Escape do?

| Option | Description | Selected |
|--------|-------------|----------|
| Closes mobile menu if open; otherwise no-op in reel | Modal-pattern. Conservative. | ✓ |
| Closes mobile menu; in reel, scrolls to top | Redundant with Home key. | |
| Closes mobile menu; in reel, returns focus to TopNav wordmark | Custom focus restoration; breaks SR mental model. | |

**User's choice:** Closes mobile menu if open; otherwise no-op (Recommended)
**Notes:** D-12.

---

## Filter-switch scroll posture (FILT-02 flow)

### Q13: When a producer mid-reel taps a different filter pill, what should happen to scroll position?

| Option | Description | Selected |
|--------|-------------|----------|
| Always reset to section 1 of the new category | Simplest mental model: "changing filter is a context switch." | ✓ |
| Preserve the Pitfall 12 hash; resume in new filter at the equivalent video | Cross-category membership rarely yields true; videos belong to one category. | |
| `goto({ noScroll: true })` — stay at pixel scroll | Jarring; potential blank space; violates scroll-snap. | |
| Smooth-scroll back to top during navigation | Adds perceived latency; conflicts with reduced-motion. | |

**User's choice:** Always reset to section 1 of the new category (Recommended)
**Notes:** D-13. Pitfall 12 hash still works WITHIN a category for Phase 5 WATCH-05.

---

### Q14: What visual transition (if any) when switching between filter routes?

| Option | Description | Selected |
|--------|-------------|----------|
| Instant — default SvelteKit navigation, no transition | Cinematic restraint; matches `_four`. | ✓ |
| Brief crossfade (motion-safe only) | Extra mount complexity; competes with iframe mount blink. | |
| Show a brief poster-grid "loading" between routes | Adds a transition-only UI surface. | |

**User's choice:** Instant (Recommended)
**Notes:** D-14. Phase 3 unified codepath handles the brief poster→iframe-mount blink gracefully.

---

### Q15: Should we prefetch filter routes on hover/focus?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — `data-sveltekit-preload-data="hover"` on every pill | Matches `_four/TopNav.svelte:139` pattern. Zero cost (small prerendered HTML). | ✓ |
| No prefetch — only on tap | 150-300ms feel-difference vs prefetched. | |
| Predictive (only pills adjacent to active) | Complex; negligible saving. | |

**User's choice:** Yes — `data-sveltekit-preload-data="hover"` on every pill (Recommended)
**Notes:** D-15. Apply to TopNav, FilterPillBar, AND MobileMenu links.

---

### Q16: What happens on empty filter results (a category with 0 videos)?

| Option | Description | Selected |
|--------|-------------|----------|
| Not possible — every category has ≥1 video; no empty-state UI needed | Build-time guarantees (Zod + getCategoriesWithCounts) prevent it. Malformed URLs 404. | ✓ |
| Defensive empty-state component | Dead code; speculative defensive code (against CLAUDE.md guidance). | |
| Treat zero results as a 404 | Makes future content edits into build failures; opinionated. | |

**User's choice:** Not possible — no empty-state UI needed (Recommended)
**Notes:** D-16. The 404 path covers truly broken URLs.

---

## Claude's Discretion

Left open for plan-phase / research:
- Chrome-height variable mechanism (CSS var vs literal vs reactive context)
- Scroll-stop debounce duration (D-05 specifies 600ms — may tune)
- Where the mobile-menu visibility broadcast lives (TopNav, layout, or new state module)
- Pill-bar gap / padding tokens
- `<ul><li><a>` vs flat `<a>` list inside `<nav>`
- Active pill auto-scroll-into-view JS implementation
- `aria-current="page"` vs `"location"` semantics
- Mobile-menu close-on-tap timing (instant vs 100ms delay)
- ESLint per-file override for `svelte/no-navigation-without-resolve`
- Exact `<nav aria-label>` wording
- TopNav fade duration (Tailwind default vs custom `@theme` variable)
- Playwright assertion-to-requirement mapping

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section:
- Filter-preference memory in `mnp_three_*` storage
- j/k vim aliases
- Cross-category `#video=<id>` preservation
- Empty-state UI
- Section-zero PBS blockquote treatment (Phase 6)
- Footer category list rendering (Phase 6)
- Filter-bar density toggle
- Scroll-direction-aware fade ("iOS Safari" pattern)
- Sticky pill bar pin behavior variants
- Programmatic snap-on-key-press JS
- Pill drag-to-reorder
- PBS pill vs PBS TopNav link routing inconsistency (by design)
