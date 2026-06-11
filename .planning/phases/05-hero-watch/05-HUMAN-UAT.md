---
status: complete
phase: 05-hero-watch
source: [05-VERIFICATION.md]
started: 2026-05-27T19:45:00Z
updated: 2026-06-10T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Hero iframe attaches and plays silently on / after defer trigger (rIC/timeout/interaction)
expected: Within ~1s on first visit (or immediately on first pointer/wheel/touch/scroll), the producer reel (Vimeo 264677021) attaches as the hero background and plays muted+looped behind the wordmark/CTA/scroll-cue overlay. Phase 3 HANDSHAKE_TIMEOUT_MS = 800ms can unmount the iframe in headless e2e (documented caveat); only a real browser session reliably keeps the handshake alive.
why_human: Cross-origin postMessage handshake between parent and player.vimeo.com is non-deterministic in headless Playwright; SUMMARY pivoted the e2e assertion away from "iframe attached within 5s" to "LCP poster attached" for this exact reason. Real Chrome/Safari session needed to confirm the iframe stays mounted and plays.
result: pass

### 2. Hero iframe unmounts to poster when scrolled off-screen (D-02 budget)
expected: Scroll past the hero into the reel; the hero iframe element disappears from the DOM (isOnScreen flips false via IntersectionObserver). Scroll back up; iframe re-mounts. Peak iframe count never exceeds 3 (hero +1 plus reel ±1).
why_human: Visual + DOM-inspection check tied to live IntersectionObserver scroll thresholds. Unit-tested via runed mock; only a real scroll session confirms hysteresis at the boundary.
result: pass

### 3. WATCH-01 chrome-fade flow on real Vimeo provider
expected: Open /watch/264677021 with sound enabled; chrome (back-button + h1 + CategoryTag + uploader · year + ContinueReelRail heading region) is opacity-100 initially. On Vimeo 'play' event (audible playback starts), after a 600ms grace the entire chrome group fades to opacity-20 + pointer-events-none. Hover / move pointer over the canvas → chrome restores to opacity-100. Pause via Vimeo native controls → chrome restores immediately. After 3s of no pointer move while playing → fades again. Touch on mobile restores + arms idle-3s.
why_human: Phase 3 HANDSHAKE_TIMEOUT_MS = 800ms caveat applies — cross-origin postMessage timing is non-deterministic in headless. Unit tests mock the adapter handlers and exercise all 8 transitions via fake timers + flushSync; the end-to-end real-iframe path requires a live cross-origin handshake against player.vimeo.com that the SUMMARY explicitly defers to Phase 7 POL-04 BrowserStack iOS Safari 17.x UAT.
result: pass

### 4. HERO-03 sound-on autoplay on /watch/264677021 after PLAY REEL click
expected: From /, click ▷ PLAY REEL. The watch page loads and the embed plays with audible sound on first paint (user-gesture sticky activation per Research Finding 2 persists across SvelteKit client-side nav).
why_human: Sticky activation behavior varies across browser engines and OS versions (especially iOS Safari Low Power Mode where play() may reject silently). The e2e asserts the URL contains autoplay=1 and absence of muted=/mute= params (proven via build/watch/264677021.html iframe src grep), but the actual audible-sound emission can only be confirmed via real-device playback.
result: pass

### 5. WATCH-05 back-nav round-trip restores exact reel position
expected: Scroll /work to a non-first article (e.g., the 5th video). Click ▷ PLAY WITH SOUND on that ReelSection. Browser back. URL is /work#video=<that-id> and the same article is at viewport top.
why_human: ReelStage's hash-write is debounced 300ms on snap-settle (Pitfall D — explicitly deferred from Plan 05-01). If the producer clicks PLAY WITH SOUND before the debounce timer fires, the hash never lands and back-nav lands at top. The headless e2e (tests/e2e/restore.spec.ts line 134-157) accepts BOTH outcomes as structurally passing (strong path when hash captured, weak path when missed). Real-device verification across the producer's actual interaction speed is needed to confirm the happy path.
result: pass

### 6. WATCH-05 cross-route arrival from /watch → ContinueReelRail heading → /work/[cat] restores
expected: Open /watch/<reel-video-id>. Click "More in Reel →" heading (or any rail card → its watch page, then back). Arrive at /work/reel. If the URL bears a #video=<id> hash matching a video in that category, that article is at viewport top; otherwise no-op land at top (D-17).
why_human: Same cross-origin / SPA-timing non-determinism as the back-nav round-trip; tested structurally in unit + e2e but the full producer-flow needs real-browser verification.
result: pass

### 7. axe WCAG AA pass on /, /work, /watch/[id], /work/[category] (sampled)
expected: Zero violations on each route. e2e hero.spec.ts + watch.spec.ts already run @axe-core/playwright across Chromium + WebKit + Firefox; this human check confirms behavior matches the automated assertion on staging.
why_human: Automated scan is already green per SUMMARY; the human check is the customary deploy-day spot-check on the actual staging URL (wolfwdavid.github.io/michelle_ngo_three/) rather than localhost preview.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
