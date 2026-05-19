# Pitfalls Research

**Domain:** Cinematic-immersive filmmaker portfolio (scroll-snapped fullscreen video reels with muted autoplay iframe loops)
**Researched:** 2026-05-19
**Confidence:** HIGH (iOS Safari / scroll-snap / dvh claims verified against 2025 sources; Vimeo/YouTube embed behavior verified against vendor docs; sibling `_four` cross-refs verified against `../michelle_ngo_four/.planning/PROJECT.md`)

> Scope reminder: this is the highest-risk variant of the four immersive designs the user could have picked. Scroll-snap + 56 muted-autoplay iframes + iOS Safari + GitHub Pages static deploy + a sibling A/B comparison is a stack of failure modes that compound. Every pitfall below is one Michelle's hiring producers will hit on a real device, on a real network, not a hypothetical.

---

## Critical Pitfalls

### Pitfall 1: iOS Safari `playsinline` regression made scroll-snap impossible to scroll past (2023 ghost still haunts)

**What goes wrong:**
On iOS 17.0–17.1 Safari, the `playsinline` attribute on a `<video>` (and by extension the YouTube/Vimeo iframe's internal `<video>`) caused the page to snag on the video — touch events were absorbed by the video element and you literally could not scroll past it. Combined with `scroll-snap-type: y mandatory`, you can end up trapped on a section with no way to scroll out.

**Why it happens:**
WebKit's gesture handling for `playsinline` videos started intercepting vertical pan gestures. Apple shipped a fix in iOS 17.2, but **iOS 16 and pre-17.2 devices are still in the wild in 2026** (especially in producer/agency offices where IT lags consumer cycles).

**How to avoid:**
- Use `scroll-snap-type: y proximity` (NOT `mandatory`) so the user can always break out of a sticky section.
- Test on iOS 16.x in BrowserStack/real device. Do NOT trust simulator-only verification.
- Provide a visible "next ↓ / prev ↑" affordance so a user who is trapped can escape via tap, not just swipe.
- Add `touch-action: pan-y` to the section wrapper to guarantee vertical pan reaches the scroll container.

**Warning signs:**
- QA on a real iPhone (not simulator) reports "I can't scroll past video 3."
- `scroll` event listener fires once per section then stops mid-reel.
- Vertical drag works on poster sections but freezes on iframe-mounted sections.

**Phase to address:** Phase 3 (Immersive Reel) — pick `proximity` not `mandatory` from day one; document the decision. Phase 7 (Polish) — real-device QA on iOS 16 + iOS 17.0/17.1 specifically.

**Confidence:** HIGH (Apple Developer Forums thread + multiple 2024–2025 writeups; confirmed bug, confirmed fix in 17.2)

---

### Pitfall 2: `100dvh` + scroll-snap on iOS Safari causes constant layout shift and breaks CLS

**What goes wrong:**
The "obvious" fix to the iOS `100vh > viewport` problem is `100dvh`. But `dvh` updates as the address bar animates in/out — and on a scroll-snap section where every reel is `height: 100dvh`, the snap target itself moves while you're scrolling. Result: jittery snap, content jumping by 60–90px as the address bar collapses, and a CLS score that fails Core Web Vitals.

**Why it happens:**
`dvh` is reactive to the chrome state. Scroll-snap recomputes snap positions on layout. The two fight each other. (As of 2025 all three units — `svh`/`lvh`/`dvh` — reached Baseline Widely Available.)

**How to avoid:**
- Use **`100svh`** for reel sections (the small viewport — the layout that fits when chrome is visible). Sections will be slightly shorter than the maximum viewport but they never jump. This is the load-bearing call.
- Reserve `lvh` for the home hero (where you want maximum cinema even at the cost of being briefly hidden behind chrome).
- Never use raw `100vh` — on iOS 14–15 it computes against the *largest* viewport and clips bottom content.
- Document this in a Phase 3 ADR so a well-meaning future cleanup doesn't "modernize" `svh` → `dvh`.

**Warning signs:**
- CLS score > 0.1 in Lighthouse on `/work`.
- Visible "bounce" when scroll-snapping on iPhone after pulling to refresh.
- Title text at the bottom of a section appears to slide up 60px during scroll.

**Phase to address:** Phase 3 (Immersive Reel) — bake `svh` into the section component on day one. Phase 7 — measure CLS on real iPhone, not just simulated 4G in DevTools (DevTools doesn't simulate the address bar animation).

**Confidence:** HIGH (Multiple 2025 sources document this specific scroll-snap × dvh interaction)

---

### Pitfall 3: Low Power Mode silently breaks the entire core experience

**What goes wrong:**
A hiring producer at the end of a long day is on Low Power Mode. They land on `/work`. Every reel section shows a black or poster-frozen iframe. There is **no play button visible** because the design assumed autoplay would always work and the user would tap `▷ PLAY WITH SOUND` only to escalate. Result: the entire site looks broken.

**Why it happens:**
iOS Low Power Mode blocks all `<video>` autoplay regardless of `muted`/`playsinline` — the `play()` Promise rejects. The default `<iframe>` Vimeo/YouTube embed doesn't expose this rejection to your wrapper. You think it's playing; it isn't.

**How to avoid:**
- **Every section MUST render a poster image first**, then attempt to swap to the iframe. If the iframe `play()` Promise rejects (Vimeo Player SDK + YouTube IFrame API both expose this), keep the poster and overlay a visible `▷ TAP TO PLAY` affordance.
- Listen for `videoElement.paused === true` 800ms after intended autoplay; if still paused, fall back to poster-with-play-button.
- This is **the same fallback path as the cellular detection** — design it once, use it for both triggers (Low Power + cellular + autoplay rejection + reduced-motion). The user said "cellular = poster + tap-to-play"; expand that to "anything-not-autoplaying = poster + tap-to-play."

**Warning signs:**
- Internal QA on an iPhone with battery < 20% (auto-LPM kicks in) shows blank sections.
- `play()` Promise rejection logged but UI doesn't adapt.
- Bug reports mention "video doesn't load" but devtools shows the iframe loaded fine.

**Phase to address:** Phase 3 (Immersive Reel) — autoplay-or-poster swap logic is a Phase 3 requirement, not a Phase 7 polish item. The fallback IS the design, not a corner case.

**Confidence:** HIGH (Apple developer forums + wojtek.im writeup + multiple consistent 2024–2025 sources)

---

### Pitfall 4: 56 iframes' aggregate data cost on uncapped autoplay ≈ 200–600MB per session

**What goes wrong:**
A user lazily scrolls the full reel on hotel/airport Wi-Fi (often metered or speed-throttled below "fast" cellular). At Vimeo's auto-quality default (HLS adaptive, typically ramping toward 720p+ on a "fast enough" connection), 56 silent autoplay loops can burn **8–15MB per minute of scroll** per active iframe. A 5-minute browse session blasts through 400MB+. Hotel Wi-Fi cuts them off. Producer thinks the site is broken. They close the tab.

**Why it happens:**
- Vimeo iframe defaults to auto-quality, which picks high quality on apparently-fast networks even when the user is paying per-MB.
- `navigator.connection.effectiveType` returns `'4g'` on a throttled-but-still-broadband connection — it does NOT mean "good cellular," it means "≥ 700 Kbps." A throttled hotel Wi-Fi often reports `'4g'`.
- Even with windowed mounting (current ± 1), three concurrent iframes × multiple seconds × 720p = real data.

**How to avoid:**
- **Hard-cap quality on every embed URL**: `&quality=540p` (Vimeo) and `vq=medium` (YouTube — note: hint only, not enforced; use as a soft floor).
- Expose `navigator.connection.saveData` — if true, full poster mode regardless of effective type. Save Data is the user telling you they're metered.
- Add a "Data saver" toggle in the chrome that persists in localStorage. Producers on a job-site Wi-Fi will use it.
- On `effectiveType ∈ {'slow-2g','2g','3g'}` use poster mode (REEL-04 already covers this); ALSO trigger poster mode when `downlink < 1.5 Mbps` even at `'4g'` to catch throttled wifi.
- Document a real number: at 540p + windowed mounting, expect ~3–5MB per minute. Test it.

**Warning signs:**
- DevTools "Slow 3G" emulation: section 1 loads but section 2's iframe stalls.
- Browser memory grows unbounded as user scrolls (means iframes aren't being unmounted, just hidden).
- Internal QA on tethered phone reports "site killed my data plan."

**Phase to address:** Phase 3 (Immersive Reel) — quality cap + Save-Data detection are mounting-logic concerns, not Phase 7 perf polish. Phase 7 — measure actual bytes on a 5-minute scroll session and document the number.

**Confidence:** HIGH (Vimeo official quality parameter docs + MoldStud bandwidth research; cellular ethics is `_three`'s explicit design constraint)

---

### Pitfall 5: Concurrent iframes melt 2-year-old phones (thermal throttling appears as "laggy scroll")

**What goes wrong:**
On a 2024-class mid-tier phone (iPhone 13 / Pixel 6a / Samsung A54), 2–3 simultaneously decoding HLS streams plus scroll-snap GPU compositing causes:
1. The device warms within 60–90 seconds.
2. The OS thermal manager kicks in: frame rate drops from 60 → 30fps in the active iframe.
3. Scroll-snap animations become juddery — feels like "the site is slow."
4. Battery drops 5–8% in 5 minutes.

**Why it happens:**
H.264/AV1 decode is hardware-accelerated but still draws power. Two iframes = two decoder pipelines. Compositing a fullscreen video under a scroll-snap container forces the GPU to keep the layer rendered even when not visible (unless explicitly hidden).

**How to avoid:**
- **Current ± 1 mounting is a floor, not a ceiling.** Pause the off-screen iframes via the Player API (`player.pause()`), don't just unmount them visually. Better still: when section enters viewport, the current one plays; the ±1 sections stay mounted-but-paused (preload, no decode).
- Use the **Page Visibility API**: when `document.hidden`, pause the current iframe. Resume on `visibilitychange` → visible. This solves backgrounded-tab drain.
- Use **IntersectionObserver with threshold 0.5** to determine "the current section" — don't play until ≥ 50% visible. Avoids briefly-decoding during a fast scroll.
- Provide an explicit "pause autoplay" affordance in the chrome (also satisfies WCAG SC 2.2.2 — see Pitfall 7).

**Warning signs:**
- Battery telemetry on test device drops > 5% in 5 minutes of browsing.
- Scroll-snap easing appears to stutter after ~60s of usage (was smooth at start).
- DevTools Performance panel shows GPU usage > 50% sustained.
- `RequestAnimationFrame` callbacks miss frames (>16.7ms tasks frequent).

**Phase to address:** Phase 3 (Immersive Reel) — pause-not-unmount + visibility API + intersection threshold are core mounting logic. Phase 7 — thermal test on a known mid-tier device for 5 minutes.

**Confidence:** HIGH (Page Visibility API MDN; well-documented mobile thermal behavior; multiple 2025 sources on iframe pause patterns)

---

### Pitfall 6: Vimeo/YouTube embed-disabled-by-owner is a silent runtime failure

**What goes wrong:**
Some of Michelle's 56 videos are uploaded by third parties (HBO, Hulu, PBS, U2 Sphere clients) on accounts she doesn't control. **Embed permissions can be revoked at any time** by the uploading account holder. Two months after launch, the U2 Sphere promo embed shows "Video unavailable" or "This video can't be embedded on this domain" in the iframe — but your wrapper has no way of knowing. It still mounts the iframe. The reel section is just a black box with a Vimeo error message.

**Why it happens:**
- Vimeo lets owners set domain-level embed whitelists. If `michellengo.net` isn't whitelisted (or the staging URL is whitelisted but prod isn't), playback fails inside the iframe.
- YouTube videos can have "Embedding disabled by owner" toggled at any time.
- The iframe itself loads (HTTP 200), so a network check doesn't catch this. The error is rendered *inside* the iframe.

**How to avoid:**
- **Build-time check**: For each video in `videos.json`, fetch the public oEmbed endpoint (`https://vimeo.com/api/oembed.json?url=...` or `https://www.youtube.com/oembed?url=...`) and confirm the response is OK. Fail the build with a clear message: `"Video X is no longer embeddable — remove from videos.json or replace."` This is the same pattern as `_four`'s Vite build-fail plugin on Zod schema violations.
- **Runtime check**: Subscribe to `player.on('error')` (Vimeo Player SDK) and `onError` (YouTube IFrame API). When fired, hide the iframe and surface the poster + "View on Vimeo →" / "View on YouTube →" external link.
- Maintain a documented escalation path: if PBS revokes embed, swap the section to poster-only with a per-video PBS deep-link (same shape as the existing PBS-collection-URL pattern from `_four` PBS-02).
- For the Vimeo Player SDK specifically, the `Player.ready()` Promise rejects on embed-blocked errors — wire it.

**Warning signs:**
- "Sorry, video unavailable" message visible inside a reel section.
- Vimeo `Player.ready()` Promise rejects.
- A previously-working video stops embedding three weeks after launch with no code changes.

**Phase to address:** Phase 2 (Data Layer) — add oEmbed health-check to the Vite build-fail plugin alongside Zod. Phase 3 — runtime error → poster fallback. Add a scheduled GitHub Action that runs the oEmbed check weekly and opens an issue on failure.

**Confidence:** HIGH (Vimeo help center + vimeo/player.js#270 GitHub issue + YouTube IFrame API docs)

---

### Pitfall 7: Scroll-snap-stop trap — user cannot fast-scroll past sections

**What goes wrong:**
Author sets `scroll-snap-type: y mandatory; scroll-snap-stop: always;` because it looks slick. Producer wants to jump from section 1 → section 40 to find the U2 piece. Even a hard flick lands on section 2. They flick again → section 3. The site refuses to let them skim. They give up and assume there are only 5 videos.

**Why it happens:**
`scroll-snap-stop: always` literally forces the scroll to halt at the first snap point in the scroll direction, regardless of momentum. Combined with `mandatory`, there is no escape valve. On Firefox there's a confirmed bug where this combo gets users *stuck* on a section.

**How to avoid:**
- Use `scroll-snap-type: y proximity` + `scroll-snap-stop: normal` (the default). The user retains momentum scrolling.
- Pair with the filter pill bar (FILT-01) as the actual navigation mechanism — pills are how producers skip to a category; the snap is for showcase, not navigation.
- Add a thumbnail-strip "minimap" affordance (right-side dot column or a scrubber) so producers can leap. This is the inclusive-design backbone, not just an accessibility nicety.

**Warning signs:**
- User test feedback: "I can't get to the last video without scrolling for 30 seconds."
- Session-length analytics show 80% bail at section 5–8.
- Mozilla bug `1959811` documents the exact get-stuck case.

**Phase to address:** Phase 3 (Immersive Reel) — pick `proximity` not `mandatory` in REEL-01's CSS. Phase 4 — minimap / quick-nav.

**Confidence:** HIGH (W3C spec + Mozilla bug 1959811 + multiple usability writeups)

---

### Pitfall 8: Screen reader announces 56 separate "pages" — accessibility tree pollution

**What goes wrong:**
Each `<section>` wraps a fullscreen reel with an iframe. Without explicit landmark and label handling, VoiceOver/JAWS/NVDA reads "section, region, ..." 56 times. The iframe's title (Vimeo's default) becomes the announced name. The user has no idea where they are in the reel and no efficient way to navigate.

**Why it happens:**
- `<section>` without `aria-labelledby` is a landmark with no name — screen readers announce it but it's not navigable.
- Iframes carry their embedded page's title; YouTube's iframe title is often "YouTube video player," which reads identically 14 times in a row.
- Tab order on 56 iframes × each iframe's internal player controls = hundreds of stops.

**How to avoid:**
- Use `<article>` (NOT `<section>`) for each reel — they're discrete pieces of content. Single `<section aria-label="Filmography reel">` wraps the whole `/work` content for landmark structure.
- Set `<iframe title="Preview of {video.title} by {video.uploader}">` explicitly on every embed (this is also good SEO).
- Apply `tabindex="-1"` to off-current iframes; only the in-view iframe is in tab order. Restore on enter-viewport.
- Provide a `<nav aria-label="Filmography videos">` with an in-page anchor list (the category pills already serve this role — make sure the markup reflects it).
- Add a "Skip to filter" / "Skip past reel" link, visible on focus.

**Warning signs:**
- VoiceOver rotor (Ctrl+Option+U → Landmarks) shows 56 unnamed regions.
- Tabbing through `/work` requires 200+ tab presses.
- axe DevTools flags "landmark must have unique name."

**Phase to address:** Phase 3 (Immersive Reel) — landmark structure baked in. Phase 7 — manual VoiceOver pass on `/work`.

**Confidence:** HIGH (WCAG SC 2.4.1, 2.4.6; CSS Carousels Sara Soueidan article; Chrome a11y carousel blog)

---

### Pitfall 9: `prefers-reduced-motion` ignored = vestibular-disorder users get nauseated, WCAG 2.3.3 violation

**What goes wrong:**
Default state of `/work` autoplays 1–3 muted videos as the user scroll-snaps between fullscreen sections. For a user with vestibular sensitivity, this combination — moving imagery + viewport snap + parallax-feeling transitions — induces motion sickness in seconds. WCAG SC 2.3.3 (Animation from Interactions) requires that motion triggered by interaction be disable-able.

**Why it happens:**
- Author treats reduced-motion as a "fade-out animation" toggle, not as a "no-autoplay video" toggle.
- WCAG 2.2.2 (Pause, Stop, Hide) requires that auto-updating motion content lasting > 5 seconds have a pause mechanism — silent autoplay loops are auto-updating.

**How to avoid:**
- On `prefers-reduced-motion: reduce`, render **all sections as static posters** (the same poster-mode fallback path as Pitfall 3/4). Do NOT autoplay anything. Tap-to-play remains; explicit user action is fine under WCAG.
- Provide a global "Pause all motion" toggle in the chrome (also catches users whose OS setting isn't set but who want a break).
- Reduce scroll-snap easing to `instant` under reduced-motion (`scroll-behavior: auto` instead of `smooth`).
- This is **the same poster-fallback codepath** as cellular, Low Power Mode, and autoplay-rejection — design once, trigger from multiple inputs.

**Warning signs:**
- macOS / iOS "Reduce Motion" toggle still autoplays the reel.
- User feedback mentions nausea or dizziness.
- axe / Lighthouse a11y flags missing pause control.

**Phase to address:** Phase 3 (Immersive Reel) — reduced-motion fork in mounting logic. Phase 7 — `/gsd:audit-uat`-style check that toggling Reduce Motion in OS settings yields a static `/work`.

**Confidence:** HIGH (WCAG 2.3.3, 2.2.2; multiple 2025 accessibility writeups; Tatiana Mac's no-motion-first approach is the canonical reference)

---

### Pitfall 10: Visible focus indicator invisible against dark video background

**What goes wrong:**
Default browser focus rings (often translucent or `outline: 1px solid #000`) disappear entirely over a dark fullscreen video. Keyboard users tabbing through 56 sections + category pills + chrome see *nothing* indicating focus. WCAG SC 2.4.7 (Focus Visible) failure.

**Why it happens:**
Cinematic-immersive design (A24/MUBI/Criterion vibe) leans dark. The default focus ring was designed against light backgrounds.

**How to avoid:**
- Define a high-contrast focus token: `outline: 2px solid white; outline-offset: 2px; box-shadow: 0 0 0 4px rgba(0,0,0,0.6);` (white ring + dark halo = visible on any background).
- Use `:focus-visible` (not `:focus`) so it appears for keyboard users without nagging mouse users.
- Test focus order: TopNav → filter pills → current reel section → in-section CTA → next section. No skipping.

**Warning signs:**
- Tab through `/work` with mouse pointer off-screen: nothing visibly moves.
- axe DevTools flags "Focus indicator must be visible."
- Hiring producer on a keyboard-only navigator session can't find the play button.

**Phase to address:** Phase 1 (Foundation) — focus-token in Tailwind v4 theme layer from day one. Phase 7 — keyboard-only sweep.

**Confidence:** HIGH (WCAG SC 2.4.7; well-documented best practice)

---

### Pitfall 11: SEO collapses — search engines see one page, not 56 (or 8, or 0)

**What goes wrong:**
A producer Googles "Michelle Ngo PBS American Portrait." Two scenarios:
1. **Bad:** Google indexes only `/work` (the immersive reel root) — single page, no per-video signal. Michelle's 18 PBS videos return zero results.
2. **Worse:** Google indexes `/work/pbs-american-portrait` (the filter route) but it renders as the same immersive reel — long single-page experience. Google's crawler doesn't scroll-snap; it sees one viewport's worth of content.

**Why it happens:**
- Scroll-snap reels look like one page to a crawler. The crawler doesn't see "this is 18 distinct pieces of content."
- `/watch/[id]` is where the actual indexable content lives — but if the immersive design buries it (user has to click `▷ PLAY WITH SOUND` to reach `/watch/[id]`), discoverability tanks.

**How to avoid:**
- `_three` already plans 56 prerendered `/watch/[id]` routes (WATCH-03) — keep this. **`/watch/[id]` is the SEO unit**, not `/work`.
- Every reel section's title is wrapped in an `<a href="/watch/[id]">` (server-rendered, not just a JS click handler) — gives crawlers a clear link graph.
- VideoObject JSON-LD lives on **`/watch/[id]`** (mirroring `_four`'s POL-01), not on `/work`. The watch route is what shows up in Google Video carousels.
- `/work` and `/work/[category]` carry `<meta name="description">` describing the curated set, not individual videos — they're feature landing pages, not indexes.
- Sitemap.xml lists `/watch/[id]` × 56 + `/work/[category]` × 8 + the static routes. Confirm sitemap is at `/sitemap.xml` (no BASE_PATH leak — see Pitfall 14).

**Warning signs:**
- Google Search Console shows `/work` indexed, all `/watch/[id]` routes "Discovered – not indexed."
- `site:michellengo.net inurl:/watch/` returns < 30 hits 4 weeks post-launch.
- VideoObject schema validation tool flags missing required properties (`thumbnailUrl`, `contentUrl`/`embedUrl`, `uploadDate`).

**Phase to address:** Phase 2 (Data Layer) — VideoObject schema spec on per-video data. Phase 6 (Watch View) — VideoObject JSON-LD per `/watch/[id]`. Phase 7 (Polish) — sitemap + Search Console validation.

**Confidence:** HIGH (schema.org spec + `_four`'s Phase 7 already shipped this pattern — POL-01 in `_three` mirrors)

---

### Pitfall 12: Filter-route + reel = ambiguous "where am I" on refresh

**What goes wrong:**
Producer filters to PBS, scrolls to section 12 of 18, refreshes mid-scroll. They land at section 1. They were doing focused review on a specific piece — they lose their place. They blame the site.

Alternate scenario: Producer shares `https://michellengo.net/work/pbs-american-portrait` to a colleague. Colleague opens it; they land at section 1. Producer has to clarify "scroll down to section 12." Sharing is broken.

**Why it happens:**
URL state is at the *category* level (`/work/pbs-american-portrait`), not the *position* level. Scroll position is local to the browser session.

**How to avoid:**
- Use a URL hash for in-reel position: `/work/pbs-american-portrait#video=620232398` or `#section=12`. Update via `history.replaceState` (not `pushState` — don't pollute back stack on every snap).
- On mount, parse the hash and `scrollIntoView({behavior: 'auto'})` to that section.
- IntersectionObserver writes the current section's id back to the hash with debounce (~300ms after snap settles).
- **Canonical sharable URL for a single video is `/watch/[id]`**, not `/work/[cat]#video=[id]`. The reel-hash is a return-to-position convenience, not the share target. Document this; otherwise OG cards and social previews break.

**Warning signs:**
- User feedback: "I can never find where I was."
- Refresh on a deep section loses scroll position.
- Shared URLs land collaborators at section 1.
- Browser back from `/watch/[id]` lands on `/work/[cat]` section 1, not the section they came from.

**Phase to address:** Phase 3 (Immersive Reel) — hash-position pattern is part of REEL-01. Phase 6 (Watch View) — back-navigation preserves originating hash via `history.state`.

**Confidence:** MEDIUM (well-known UX pattern; specifics of `history.replaceState` debounce timing are tunable)

---

### Pitfall 13: YouTube iframe places tracking cookies + local storage even before user interacts (GDPR / ePrivacy hit)

**What goes wrong:**
A producer in the EU lands on `/work`. The first section's YouTube iframe loads (autoplay=1). YouTube sets identifying cookies and writes `yt-remote-device-id` to local storage **before** the user clicked anything. Without a cookie consent banner gating the iframe, this is a GDPR/ePrivacy violation. Penalty risk is theoretical-but-real (Italian DPA fined a similar setup in 2023).

Even using `youtube-nocookie.com` doesn't fix this — it still writes to local storage.

**Why it happens:**
`autoplay=1` defeats the "play button = consent" workaround. Loading the iframe at all is sufficient to trigger storage in some configurations.

**How to avoid:**
- Default `/work` reel to **poster mode in EU** — detect via `Intl.DateTimeFormat().resolvedOptions().timeZone` (Europe/*) OR (better) by `navigator.language` heuristic, OR by GeoIP at static-build time (impossible with GH Pages, so do client-side).
- **Better:** make the cellular/reduced-motion/LPM poster fallback (Pitfalls 3, 4, 9) the *default*, and only autoplay when (a) on a fast non-cellular connection AND (b) user has interacted with the site OR (c) consent flag in localStorage. "Interaction = consent" is the two-click solution.
- Alternative: ship without a cookie consent banner but accept the EU compliance risk — out of scope for a portfolio site only if Michelle is OK with that decision being recorded. (Sibling `_four` is already live without a CMP; document the decision either way.)
- Use `youtube-nocookie.com` for YouTube embeds (set in `videos.json` or rewritten at embed-time) and document the local-storage caveat.

**Warning signs:**
- Browser DevTools → Application → Storage shows `yt-remote-device-id` set without user interaction.
- Lighthouse "Avoids third-party cookies" fails.
- GDPR consultant flags the site.

**Phase to address:** Phase 3 (Immersive Reel) — default-to-poster + interaction-as-consent. Phase 7 — document the compliance posture in the Launch Runbook.

**Confidence:** HIGH (Complianz + Cookiebot + kukie.io all consistent; recent EU enforcement actions documented)

---

### Pitfall 14: GitHub Pages `BASE_PATH` leaks into sitemap canonicals, OG URLs, JSON-LD `@id`s

**What goes wrong:**
Staging URL is `https://wolfwdavid.github.io/michelle_ngo_three/`. Production target is `https://michellengo.net/`. If `BASE_PATH=/michelle_ngo_three` leaks into the build's:
- `<link rel="canonical">` → search engines index staging as canonical, kill production SEO
- `sitemap.xml` `<loc>` entries → "michellengo.net's sitemap claims wolfwdavid.github.io URLs"
- `og:url` / `og:image` → social shares from staging point to wrong domain
- VideoObject `@id` / `url` → schema validation passes but values are wrong

Sibling `_four` hit this exactly — their D-05 (override from Cloudflare → GitHub Pages) carries `BASE_PATH=/<repo>` until cutover, and the Phase 7 production workflow (`deploy-production.yml`) overrides to `BASE_PATH=''`. The override has to be flawless across **all** generated metadata.

**Why it happens:**
`paths.base` in SvelteKit config is global, but ad-hoc string concatenation (`${PUBLIC_SITE_URL}${page.url.pathname}`) sometimes inlines the wrong root. Sitemap generators that read `import.meta.env.BASE` will silently use the wrong base.

**How to avoid:**
- One environment variable `PUBLIC_SITE_URL` (staging: `https://wolfwdavid.github.io/michelle_ngo_three`; prod: `https://michellengo.net`) drives ALL absolute URLs. No string concat with `paths.base`.
- Two workflows: `deploy.yml` (staging) sets `PUBLIC_SITE_URL` + `BASE_PATH=/michelle_ngo_three`; `deploy-production.yml` (cutover) sets `PUBLIC_SITE_URL=https://michellengo.net` + `BASE_PATH=''`. Verbatim mirror of `_four`'s D-05/Phase 7 pattern.
- Pre-commit / build-time test: grep the prerendered `build/` for the wrong domain string. Fails the build if `wolfwdavid.github.io` appears in a prod build, or `michellengo.net` in a staging build.
- Staging `robots.txt` is `Disallow: /` ALWAYS. Prod `robots.txt` is `Allow: /` ONLY after cutover. `_four`'s D-16 noindex-flip is the atomic toggle to copy.

**Warning signs:**
- `view-source:` on a production page shows `wolfwdavid.github.io` anywhere.
- Google Search Console reports the staging URL as canonical for production pages.
- OG card preview tool shows the wrong domain.
- Sitemap.xml `<loc>` entries don't match the host serving them.

**Phase to address:** Phase 1 (Foundation) — `PUBLIC_SITE_URL` env var pattern from day one. Phase 7 (Polish & Cutover) — verbatim copy of `_four`'s `deploy-production.yml` + Launch Runbook. Mirror `_four`'s D-16 atomic noindex flip.

**Confidence:** HIGH (sibling `_four` shipped this exact pattern successfully; documented in `_four` PROJECT.md Current State § Phase 7)

---

### Pitfall 15: `videos.json` drift between `_three` and `_four` silently invalidates the A/B comparison

**What goes wrong:**
`_three` requires `videos.json` byte-identical to `_four` (DATA-01). But:
- `_four` ships; Michelle adds a new branded promo a month later via PR to `_four`. `_three` doesn't sync.
- One sibling has 56 videos; the other has 57. The A/B is no longer comparing the same catalog.
- Subtle: a category retag (e.g., reclassify one PBS video to "Promo") in `_four` but not `_three` shifts category counts. Producer compares the two and the "PBS section feels denser" perception is a data artifact, not design.

**Why it happens:**
"Manual review" sync (per `_three`'s constraint: "no symlink; SvelteKit static builds work better with files in-tree") is a guarantee at one moment in time, not a continuous one. Drift creeps in via small unrelated PRs.

**How to avoid:**
- Add a CI job that diffs `_three/src/lib/data/videos.json` against `_four/src/lib/data/videos.json` byte-for-byte. Fail the build if they differ.
- Run this from BOTH repos (since either can be the deviator).
- Document the sync rule in `_three` README: "All `videos.json` edits go to `_four` first, then are copied here. PRs editing `_three`'s videos.json without an `_four` reference must be rejected."
- During A/B window, add a banner-or-comment in both repos: "A/B in progress — videos.json frozen until winner declared."
- Make the OG image generation read from the same source-of-truth and use the same dimensions (`_four`'s placeholder OG-image is 1200×630 per Phase 7).

**Warning signs:**
- Manual hash check of both `videos.json` files returns different values mid-A/B.
- Sitemap of `_three` has different `/watch/[id]` count than `_four`.
- User feedback during A/B mentions "this one has more PBS videos."

**Phase to address:** Phase 2 (Data Layer) — sync check as Vite build plugin or pre-commit hook + cross-repo CI. Phase 7 (Polish & Cutover) — pre-cutover A/B audit checklist verifies parity.

**Confidence:** HIGH (direct read of `_three`'s constraints; A/B methodology is the user's stated goal)

---

## Moderate Pitfalls

### Pitfall 16: Vimeo thumbnail URL rot (`vumbnail.com` is unofficial)

**What goes wrong:**
Convenience services like `vumbnail.com/{id}.jpg` are unofficial — they can disappear, rate-limit, or change format. If posters point at vumbnail, six months later half the reel shows broken images.

**How to avoid:**
- Use Vimeo's official oEmbed API at build time to fetch the canonical `thumbnail_url`, write it into `videos.json`, and self-host the WebP (same pattern as `_four`'s hero poster — 15.4KB content-hashed WebP under `_four`'s D-23/hero approach).
- For YouTube: `https://i.ytimg.com/vi/{id}/maxresdefault.jpg` is the official URL but not all videos have maxres — fall back to `hqdefault.jpg`. Self-host post-fetch.
- Run the fetch as part of the Vite build-fail plugin (Pitfall 6's oEmbed check is the same call).

**Warning signs:** Broken poster thumbnails after a few months; bandwidth complaints from third-party hosts.

**Phase to address:** Phase 2 (Data Layer) — poster-fetch + self-host pipeline.

**Confidence:** HIGH (Vimeo help center explicitly warns about caching thumbnail URLs)

---

### Pitfall 17: Cookie banner appears *inside* the iframe (visual disaster)

**What goes wrong:**
A user in the EU lands on `/work`. The Vimeo iframe loads its own cookie consent banner (Vimeo's own privacy notice), which appears as a black-and-white overlay covering the bottom third of the section. The cinematic vibe is destroyed; the producer thinks Michelle's site is buggy.

**How to avoid:**
- Use `dnt=1` (Do Not Track) on Vimeo embeds — suppresses Vimeo's own tracking and reduces (but does not eliminate) the cookie banner.
- For YouTube, the privacy-enhanced mode (`youtube-nocookie.com`) suppresses Google's banner inside the iframe.
- Pair with Pitfall 13's poster-first-default-in-EU strategy — if the iframe doesn't mount, no banner appears.

**Warning signs:** Browser shows iframe with overlay banner instead of video; QA from an EU IP / VPN test reproduces.

**Phase to address:** Phase 3 (Immersive Reel) — `?dnt=1` (Vimeo) and `youtube-nocookie.com` (YouTube) are URL-construction concerns. Phase 7 — EU-VPN QA.

**Confidence:** MEDIUM (well-documented for YouTube; Vimeo's banner behavior is less standardized but `dnt=1` is the documented mitigation)

---

### Pitfall 18: Tab key cycles through 56 iframes' internal players (focus trap nightmare)

**What goes wrong:**
Without `tabindex` management, pressing Tab inside `/work` cycles through every iframe's internal player controls (play, mute, fullscreen, settings × 56). Hundreds of stops before reaching the footer.

**How to avoid:**
- Set `tabindex="-1"` on all off-screen iframes; set `tabindex="0"` on the in-view iframe only.
- IntersectionObserver toggles `tabindex` as sections enter/leave viewport.
- Provide a global "Skip past reel" link visible on focus.

**Warning signs:** Manual Tab through `/work` requires hundreds of presses; user feedback mentions getting "lost" with keyboard.

**Phase to address:** Phase 3 (Immersive Reel) — tabindex-toggling is part of the IntersectionObserver mount/unmount logic.

**Confidence:** HIGH (WCAG SC 2.4.3; standard a11y pattern)

---

### Pitfall 19: Browser back from `/watch/[id]` loses reel position

**What goes wrong:**
Producer scrolls to section 23, taps `▷ PLAY WITH SOUND`, lands on `/watch/[id]`. Watches. Hits browser back. Lands at `/work` section 1, not section 23. Loses context. Painful with 56 sections.

**How to avoke:**
- When navigating `/work → /watch/[id]`, write the current section id (and category if filtered) into `history.state` via `history.pushState({fromSection: id, fromCategory: cat}, '', '/watch/...')`. On back-nav, SvelteKit's `afterNavigate` reads `history.state` and scrolls the previous `/work` page back to that section before the user sees the snap-to-top.
- Alternative: use the hash pattern from Pitfall 12 — `/work#video=620232398` is the URL the back button lands on, and the hash drives the scroll restore. Native browser behavior gets you 80% of the way.

**Warning signs:** User feedback "I lost my place when I went back."

**Phase to address:** Phase 6 (Watch View) — back-nav restoration; depends on Pitfall 12's hash mechanism.

**Confidence:** MEDIUM (well-known pattern; specifics of SvelteKit's `afterNavigate` snap-restoration need verification during impl)

---

### Pitfall 20: Title/category overlay illegible on light or busy video frames

**What goes wrong:**
Bottom-left title and top-right category tag are designed against a dark video frame. But a section's video opens on a white sky or bright snowfield — text becomes unreadable. Even a gradient overlay doesn't save you on every frame.

**How to avoid:**
- Always apply a **two-stop gradient overlay** (top-down dark and bottom-up dark) at fixed opacity, not just a single gradient. Roughly: `linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)`.
- Text uses `text-shadow: 0 2px 8px rgba(0,0,0,0.8)` as a belt-and-suspenders.
- Test against the actual 56 video posters (not Lorem-pixel mocks). Identify any with high-key center compositions and adjust per-video gradient strength if needed.

**Warning signs:** Producer test feedback "I can't read the titles on some videos"; WCAG contrast checker flags titles failing.

**Phase to address:** Phase 3 (Immersive Reel) — overlay system as part of REEL-05. Phase 7 — manual sweep through all 56 posters.

**Confidence:** MEDIUM (industry-common issue; specific gradient tuning is per-design)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode `vumbnail.com/{id}.jpg` for Vimeo posters | Skips an API call at build time | Service may disappear; rate limits | Never — official oEmbed is one extra line in the Vite plugin |
| Skip the `play()` Promise rejection check (assume autoplay always works) | Less code in the mounting logic | Site looks broken in Low Power Mode + EU + reduced-motion + cellular — ALL of which already need poster fallback | Never — the fallback is required for 4 different inputs |
| Use `scroll-snap-type: y mandatory` because it "feels more cinematic" | Tighter visual snap | Users get trapped; bug 1959811; fast-scroll dead | Never — `proximity` is the right call |
| Mount all 56 iframes upfront and CSS-hide off-screen ones | Simpler React/Svelte logic | 56 iframes melts mid-tier phones; data costs explode; battery dies | Never — windowed mount is REEL-03's whole point |
| Use `100dvh` because "it's the modern unit" | Slightly more visible content on iOS | CLS > 0.1; bouncy snap | Never — use `svh` for snap sections, `dvh` only where layout shift is OK |
| Skip the `videos.json` sync check between siblings | Less CI tooling | A/B comparison silently invalid; can't tell what to ship | Only acceptable post-A/B-winner-declared |
| Ship without VideoObject JSON-LD on `/watch/[id]` | Less metadata code | Google Video carousel exclusion; SEO loss | Never — `_four` already does it; copy verbatim |
| Ship without `tabindex` management on iframes | Less JS plumbing | Tab order broken; WCAG fail; producer can't use keyboard | Never — IntersectionObserver is already toggling state, add tabindex to it |
| Use Vimeo iframe at auto-quality (no `&quality=` cap) | Tracks user bandwidth; "smart" | Burns data on throttled wifi; cellular users pay for 720p | Never — cap at 540p for previews; full quality only on `/watch/[id]` |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vimeo Player SDK | Assume `Player.ready()` resolves; don't handle rejection | Always `.catch()` on `Player.ready()` — embed-disabled, privacy-restricted, and quota cases all reject |
| Vimeo iframe URL | Use `https://vimeo.com/{id}` directly | Use `https://player.vimeo.com/video/{id}?autoplay=1&mute=1&loop=1&background=1&dnt=1&quality=540p` — `background=1` hides ALL UI chrome and is the cinema mode |
| YouTube IFrame API | Assume `vq=hd720` enforces quality | `vq=` is a *hint*, not enforced; the API may still serve higher quality on fast connections. Combine with `playerVars.iv_load_policy=3` and `modestbranding=1` for cleaner UI |
| YouTube IFrame API | Forget `playsinline=1` for iOS | Both `playsinline=1` AND `enablejsapi=1` are required; mobile defaults to fullscreen otherwise |
| YouTube cookies | Use `youtube.com` then add a CMP | Use `youtube-nocookie.com` from the start; still wrap with consent for EU per Pitfall 13 |
| Vimeo `loop` | Set `&loop=1` and expect seamless looping | `loop=1` works for unmuted; for muted background mode use `&background=1&loop=1` together — `background=1` implies muted+loop+autoplay+no-controls |
| GitHub Pages CNAME | Add CNAME to repo settings via UI | Put `static/CNAME` containing `michellengo.net` in the repo so the workflow writes it every deploy — `_four` Phase 7 pattern |
| GitHub Pages base path | Hardcode `/michelle_ngo_three` in links | Use SvelteKit `$app/paths` `base` everywhere; never concat strings manually |
| SvelteKit `adapter-static` | Forget `fallback: 'index.html'` or `prerender: 'auto'` | Match `_four`'s adapter config exactly — proven shipping config |
| oEmbed health check | Run only at first build | Add a weekly GitHub Action that runs oEmbed against all 56 videos and opens an issue on failure — surfaces embed-disabled changes within 7 days |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| All-iframe mount | Memory grows unbounded on scroll; battery drops 10%+ in 3 min | Current ± 1 windowed mount (REEL-03) | At 10+ iframes on mid-tier phone |
| Auto-quality on cellular | Data bill complaints; section 2+ stalls on 3G | `&quality=540p` cap + Save-Data + `effectiveType` + `downlink` checks | Any metered or throttled connection |
| Background tab still decoding | Other-tab audio interruption (silent shouldn't but iframe state is opaque); battery drain | Page Visibility API → pause all players on `document.hidden` | Always; trivial to fix, common to miss |
| `100dvh` snap section | Jittery scroll; CLS > 0.1 | `100svh` for snap sections | iOS Safari, any version with address-bar UI |
| Preload thumbnails for all 56 sections | Slow first paint; LCP > 2.5s | Preload only first 2; lazy-load rest with `loading="lazy"` + `fetchpriority="low"` | Always |
| Synchronous IntersectionObserver work | Janky scroll | Debounce `tabindex` / mount toggles; use `rAF` for DOM writes | At 10+ observers or fast scrolls |
| Vimeo `background=1` without quality cap | Burns the most data of all modes (background is opinionated about quality) | Pair `background=1` with explicit `quality=540p` | Always when using background mode |
| YouTube auto-pause on tab hide is unreliable | Audio continues from background | Explicitly call `player.pauseVideo()` on `visibilitychange` | iOS Chrome ≠ iOS Safari behavior |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Allow embedding `_three` in third-party iframes | Clickjacking of the producer's reel | `X-Frame-Options: SAMEORIGIN` or CSP `frame-ancestors 'self'` — GitHub Pages doesn't set headers; document this gap or front with Cloudflare at cutover |
| No CSP header allowing arbitrary iframes | XSS via injected video URL | CSP `frame-src player.vimeo.com www.youtube-nocookie.com youtube.com; img-src i.ytimg.com vumbnail.com i.vimeocdn.com` — locked allowlist |
| Hardcode Vimeo/YouTube API keys in client | API key leak; quota theft | This site doesn't need a key — public iframe embed only. If oEmbed health-check uses a key, keep it in a GitHub Action secret only |
| Trust `videos.json` blindly from sibling sync | If `_four` is compromised, `_three` ships compromised data | Vite build-fail Zod schema (already in DATA-02) plus URL allowlist (only vimeo/youtube hosts) |
| `mailto:` exposed as plaintext | Spam scraping of `mynogo@gmail.com` | Already accepted in `_four` per CONT-01 — same posture; no change needed |
| Permissive `referrer-policy` leaks reel filter URL to Vimeo/YouTube | Privacy leak — Vimeo knows producer was on `/work/u2-sphere-trailer` | `<meta name="referrer" content="no-referrer-when-downgrade">` or `strict-origin-when-cross-origin` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visible chrome during reel (auto-hide TopNav) | Producer can't get out of `/work` | Chrome auto-hides on scroll-down but appears on scroll-up + tap + after 1s idle (FILT-01's persistent pill bar partially mitigates) |
| Silent autoplay assumed to "feel cinematic" | EU/LPM/reduced-motion users see a dead grid; non-context users may not realize videos *are* videos | Subtle UI signal — small ▶ icon top-corner of every section indicating it's playable; or a 1px progress bar that ticks as the preview loops |
| `▷ PLAY WITH SOUND` text-only CTA | Doesn't read as a CTA on a video bg | Pill-button shape + icon + the text, with focus ring (Pitfall 10) |
| Pull-to-refresh accidentally fires on the hero | iOS pulls-to-refresh `/`; producer thinks they made a mistake | `overscroll-behavior-y: contain` on the scroll container |
| No back-to-top affordance | At section 50, producer can't get back fast | After scrolling past section 5, show a floating `↑ Top` button with focus state |
| 56 sections feels endless | Producer doesn't know they're 1/4 of the way through | Subtle progress indicator: "12 / 56" in the chrome, or a vertical scroll-progress bar |
| Snap-on-touch interrupts mid-flick | Frustrating on fast-scroll | `scroll-snap-type: y proximity` (also covers Pitfall 7) |
| Active-state filter pill not obvious in dark theme | Producer can't tell which category they're filtered to | High-contrast active state — colored underline + bold + cat-token bg per `_four`'s OKLCH per-category accents |
| Watch view doesn't echo the section's framing | Going from `/work#video=X` to `/watch/X` feels like a different site | Watch view inherits the gradient overlay + same title typography; transitions feel like "zoom in" not "leave" |

---

## "Looks Done But Isn't" Checklist

- [ ] **Immersive reel:** Often missing the `play()` Promise rejection fallback — verify by enabling iOS Low Power Mode (or unplug device below 20%) and confirming poster + tap-to-play surfaces on every section
- [ ] **Immersive reel:** Often missing real-device QA — verify on at least one real iPhone (any iOS 16, 17, 18 version) AND one real Android, NOT just BrowserStack/simulator
- [ ] **Scroll-snap:** Often missing `proximity` (defaults to `mandatory` in many tutorials) — verify by attempting to fast-flick from section 1 → section 40 in a single gesture
- [ ] **Filter routing:** Often missing the in-reel position hash — verify by refreshing `/work/pbs-american-portrait` mid-scroll and confirming return to same section
- [ ] **`prefers-reduced-motion`:** Often missing the static-poster fork — verify by toggling iOS "Reduce Motion" or Chrome `prefers-reduced-motion: reduce` and confirming all autoplay is suppressed
- [ ] **Low Power Mode:** Often forgotten in QA — verify by switching the test device to LPM and reloading `/work`
- [ ] **EU privacy:** Often missing — verify with EU VPN that no Vimeo/YouTube cookie or local-storage entry is written before user interaction (or, if accepted as out-of-scope, document the decision)
- [ ] **`youtube-nocookie.com`:** Often forgotten — grep `videos.json` for `youtube.com/embed/` and confirm zero occurrences (use `youtube-nocookie.com/embed/`)
- [ ] **`?dnt=1` on Vimeo:** Often forgotten — grep `videos.json` or embed-URL builder for `dnt=1` presence on every Vimeo URL
- [ ] **`background=1` on Vimeo previews:** Often forgotten — the cinematic loop with NO chrome inside the iframe requires `background=1`
- [ ] **Quality cap on previews:** Often forgotten — grep for `quality=540p` on preview embeds; `/watch/[id]` allows higher
- [ ] **Page Visibility API pause:** Often forgotten — open `/work`, switch tabs for 60s, confirm no battery drain (test via `chrome://flags` battery saver or iOS battery widget)
- [ ] **Tabindex on iframes:** Often forgotten — manual Tab through `/work` should land on (current section's CTA) → (next section's CTA), not 200 player-control stops
- [ ] **Focus ring on dark bg:** Often default-styled and invisible — Tab through `/work` with the screen at low brightness and confirm focus is visible
- [ ] **VideoObject JSON-LD:** Often missing required fields (`uploadDate`, `thumbnailUrl`, `embedUrl`/`contentUrl`) — run Google's [Rich Results Test](https://search.google.com/test/rich-results) against `/watch/[id]`
- [ ] **Sitemap URLs:** Often have wrong domain or wrong base path — `curl https://michellengo.net/sitemap.xml | grep loc` and confirm every URL starts with `https://michellengo.net/` (no `wolfwdavid.github.io` leak)
- [ ] **Canonical URLs:** Often wrong on staging vs prod — `view-source:` on a prod page and confirm `<link rel="canonical">` points to the prod host
- [ ] **OG image:** Often the placeholder ships — replace `_four`'s placeholder OG with a real 1200×630 in `_three` before A/B (or accept identical placeholders for parity)
- [ ] **`robots.txt` flip:** Often forgotten in the cutover sequence — `_four`'s D-16 atomic noindex flip is the runbook; mirror it
- [ ] **`videos.json` byte parity:** Verify with `md5sum`/`sha256sum` on both files immediately before A/B launch
- [ ] **CSP `frame-src` allowlist:** Often missing — even GitHub Pages won't set it for you, but include a `<meta http-equiv="Content-Security-Policy">` as a defense-in-depth signal
- [ ] **Mobile real-device LCP:** Often only Lighthouse-simulated — measure with WebPageTest on a real iPhone or with Chrome remote debugging on a real Android

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Vimeo embed disabled by owner post-launch (Pitfall 6) | LOW | Health-check Action opens issue → swap `videos.json` entry to poster-only mode with external link → ship a single-line PR |
| iOS scroll-snap freeze (Pitfall 1) | MEDIUM | Switch `mandatory` → `proximity`; push hotfix; confirm on the affected iOS version |
| LCP > 2.5s on real device (Pitfall 2, 4) | MEDIUM | Drop hero from looping iframe to static WebP (mirror `_four`'s D-23 decision — cinema budget can borrow `_four`'s solution for the home only); cap reel quality to 360p as fallback |
| `BASE_PATH` leak in production (Pitfall 14) | LOW-MEDIUM | Re-run `deploy-production.yml` with corrected env; flush CDN cache; resubmit sitemap to Google Search Console |
| `videos.json` drift discovered mid-A/B (Pitfall 15) | LOW | Halt A/B; copy `_four`'s `videos.json` to `_three`; rebuild both; restart A/B with documented start time |
| GDPR enforcement letter (Pitfall 13) | HIGH | Implement consent gate; switch all reels to poster-default; require interaction to mount iframes; document remediation |
| Thermal throttling complaints (Pitfall 5) | MEDIUM | Reduce window from current±1 to current-only; pause off-screen players via SDK; confirm via real-device thermal test |
| Accessibility audit failure (Pitfalls 8, 9, 10, 18) | MEDIUM-HIGH | Each is an isolated fix but the cumulative remediation often requires re-shipping the reel component; budget 1–2 days |
| Cookie banner inside iframe ruins design (Pitfall 17) | LOW | Add `dnt=1` to all Vimeo embeds; swap YouTube URLs to `youtube-nocookie.com`; ship in one PR |
| Embed-disabled vid is also the home hero (HERO-01 = Vimeo 264677021) | HIGH | If Michelle's own reel is taken down or embed-restricted, the entire `/` hero breaks — fall back to static poster + tagline + `▷ PLAY REEL` linking out to her Vimeo channel; document this contingency in the Launch Runbook |

---

## A/B-with-`_four` Cross-Cutting Traps

Three concrete risks where `_three` and `_four` could silently undermine their own comparison:

### Trap A: `videos.json` drift (see Pitfall 15)
**Specific risk:** Either repo accepts a videos.json edit during the A/B window; comparison is no longer apples-to-apples.
**Mitigation:** Cross-repo CI byte-diff check + freeze rule documented in both READMEs + sync rule "edits land in `_four` first, then copy to `_three`."

### Trap B: Different OG image sizes / formats / dimensions
**Specific risk:** `_four` ships a placeholder 1200×630 PNG; `_three` ships a 1600×900 JPEG. When the A/B traffic is split, social previews look different — and producers click through to whichever has the more striking thumbnail, biasing the test on a variable the comparison wasn't supposed to measure.
**Mitigation:** Both siblings use the same OG image dimensions (1200×630), same format (PNG or both WebP), and the same content (Michelle's name + a single representative still). Either both placeholders or both designed-finals; never one of each. Cross-check before A/B launch.

### Trap C: Sitemap canonical URLs point to the wrong sibling
**Specific risk:** Both `_three` and `_four` go live with sitemaps. If they both claim `michellengo.net/work/pbs-american-portrait/` as canonical, Google deduplicates and may index whichever it crawled first. The A/B is corrupted by a search-engine choice you didn't make.
**Mitigation:** During A/B, only ONE sibling is on `michellengo.net`. The other lives on its staging URL with `noindex,nofollow` + `robots.txt: Disallow: /`. Mirror `_four`'s D-16 noindex flip exactly. After A/B winner declared, the loser stays noindex'd or is archived.

### (Bonus Trap D): Staging URL collision in shared cookies / local storage
**Specific risk:** `wolfwdavid.github.io/michelle_ngo_three/` and `wolfwdavid.github.io/michelle_ngo_four/` share the same eTLD+1 (`github.io`) for cookie / local-storage purposes. A "Data saver" toggle saved in localStorage on `_three` is visible to `_four` (and vice versa). If they implement the same key with different semantics, one will silently override the other.
**Mitigation:** Namespace all localStorage keys (`mnp_three_*` vs `mnp_four_*`) OR scope to the exact path. Document this in both repos.

### (Bonus Trap E): Different default routes break direct comparison
**Specific risk:** `_four`'s `/` is "hero + 8-card sampler"; `_three`'s `/` is "fullscreen ambient muted reel hero." If A/B participants are sent to `michellengo.net/`, the comparison is fair. If they're sent to `/work` (which renders differently in each), it's also fair. But if one cohort is sent to `/` and the other to `/work`, the comparison conflates page-type with design-language.
**Mitigation:** A/B traffic-splitting hits the same path on both siblings (`/` and `/work` are the natural entry points; both are valid). Document which paths are part of the comparison.

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 — iOS `playsinline` scroll freeze | Phase 3 (Immersive Reel) | Real-device test on iOS 16.x + 17.0/17.1 |
| 2 — `dvh` + scroll-snap CLS | Phase 3 | Lighthouse CLS < 0.1 on real iPhone |
| 3 — Low Power Mode breakage | Phase 3 | QA on iPhone in LPM (< 20% battery or manually toggled) shows poster + tap-to-play on every section |
| 4 — Bandwidth blowout | Phase 3 + Phase 7 | Network panel: 5-min scroll session uses < 50MB at 540p cap; Save-Data toggle works |
| 5 — Thermal melt | Phase 3 | 5-min sustained scroll on mid-tier phone: battery drops < 4%, no scroll judder |
| 6 — Embed-disabled by owner | Phase 2 + Phase 3 | Vite plugin oEmbed check + runtime `Player.on('error')` handler; weekly health-check Action |
| 7 — Scroll-snap-stop trap | Phase 3 | Manual fast-flick from section 1 to section 40 lands on section 40 |
| 8 — Screen reader landmark pollution | Phase 3 + Phase 7 | VoiceOver rotor shows ≤ 5 named landmarks on `/work` |
| 9 — `prefers-reduced-motion` ignored | Phase 3 | Toggle Reduce Motion in OS → `/work` shows static posters |
| 10 — Invisible focus ring | Phase 1 (Foundation) + Phase 7 | Tab through `/work` at low brightness; focus always visible |
| 11 — SEO single-page collapse | Phase 2 + Phase 7 | Search Console shows 56 `/watch/[id]` indexed within 4 weeks |
| 12 — Filter refresh loses position | Phase 3 | Refresh `/work/[cat]` mid-scroll restores section |
| 13 — GDPR/ePrivacy cookie hit | Phase 3 + Phase 7 | DevTools storage panel: no Vimeo/YouTube identifiers before user interaction |
| 14 — `BASE_PATH` leak | Phase 1 + Phase 7 | Grep prerendered build for wrong domain string (build-time test) |
| 15 — `videos.json` drift | Phase 2 + ongoing | Cross-repo CI byte-diff check; pre-A/B-launch manual hash compare |
| 16 — Vimeo thumbnail rot | Phase 2 | Self-hosted WebPs in repo; no `vumbnail.com` runtime calls |
| 17 — Cookie banner inside iframe | Phase 3 | EU-VPN QA on `/work` shows no overlay banner |
| 18 — Tab cycles all iframes | Phase 3 | Manual Tab through `/work` is ≤ 20 stops total (chrome + filter + current section's CTA only) |
| 19 — Back-from-watch loses position | Phase 6 (Watch View) | `/work#video=X` → `/watch/X` → back returns to section X scroll position |
| 20 — Illegible title on light frames | Phase 3 + Phase 7 | Manual sweep of all 56 posters; gradient sufficient on every frame |
| A — `videos.json` drift | Phase 2 | Cross-repo CI |
| B — OG image asymmetry | Phase 7 | Manual diff of OG-image dimensions/format on both repos |
| C — Sitemap canonical conflict | Phase 7 (Cutover) | Only one sibling indexed at a time; D-16 atomic flip mirrored from `_four` |
| D — Shared `github.io` storage collision | Phase 1 | Namespaced localStorage keys |
| E — Different A/B entry routes | Phase 7 | A/B testing plan documents identical entry paths |

---

## Cross-References to Sibling `_four`'s Decisions

`_four` already shipped v1.0 and hit (or designed around) several of these traps. Direct references:

| `_three` Pitfall | `_four` Decision | What `_four` Did |
|------------------|------------------|------------------|
| Pitfall 4, 5 — bandwidth + thermal | **Hero = static WebP (not looping reel)** | `_four` explicitly chose poster-not-loop for `/` hero — LCP win over cinema; `_three`'s D-decision to autoplay reel hero accepts the inverse trade |
| Pitfall 11 — SEO per-watch indexing | **POL-01 / Phase 7** | `_four` shipped per-page titles, VideoObject JSON-LD on every `/watch/[id]`, sitemap with 70 URLs — verbatim copy target for `_three` |
| Pitfall 12 — filter routing | **D-08 routing** | `_four` chose `/work/[category]` slug routes over `?category=` query params — prerendered, deep-linkable; `_three` mirrors this |
| Pitfall 14 — `BASE_PATH` + cutover | **D-05 (GH Pages override) + D-16 (atomic noindex flip)** | `_four`'s `deploy-production.yml` with `BASE_PATH=''` + 9-step Launch Runbook is the proven cutover path |
| Pitfall 14 — staging noindex | **D-16** | `_four`'s atomic noindex+robots flip during cutover prevents staging being indexed as canonical |
| Pitfall 15 — `videos.json` drift | **`_three` DATA-01** | Drift prevention is `_three`'s explicit constraint; needs the CI byte-diff to enforce |
| Pitfall 17 — embed defaults | (No `_four` precedent) | `_four` only uses iframes on `/watch/[id]`, click-to-play — never auto. `_three` is in net-new territory here |
| All a11y (Pitfalls 8, 9, 10, 18) | **`_four` 168/168 unit tests + a11y baseline** | `_four` accepted `prefers-reduced-motion` n/a because no autoplay; `_three`'s autoplay is the differentiator and requires net-new a11y work |
| Contact / ABT / PRES routes | **`_four` Phase 6 (CONT-01/02, ABT-01/02, PRES-01/02)** | `_three` reuses `_four`'s ContactBlock contract verbatim — no new pitfall surface here |
| Phase 7 placeholder OG image | **`_four` Phase 7 deferral pattern** | `_four` shipped placeholder OG; `_three` should match exactly during A/B to avoid Trap B |
| IMDb/LinkedIn fallback URLs | **`_four`'s D-deviation 2026-05-12 + 06-HUMAN-UAT.md** | `_three` carries the same tracked deviation; same pre-cutover swap requirement |

**Where `_three` has no `_four` precedent and is operating blind:**
- Immersive scroll-snap reel (REEL-01 through REEL-05) — entirely new territory
- Cellular fallback (REEL-04) — new
- Viewport-windowed iframe mounting (REEL-03) — new
- Filter pill bar in immersive context (FILT-01) — new
- Continue-the-reel cinematic carousel on `/watch/[id]` (WATCH-02) — `_four` ships a grid rail; `_three` is novel

These five areas need the most cautious phase-gating in the roadmap — pitfalls 1–10 cluster here.

---

## Sources

- [Apple Developer Forums — playsinline scroll bug](https://developer.apple.com/forums/thread/740225)
- [Apple Developer Forums — Safari Low Power Mode video playback](https://developer.apple.com/forums/thread/813352)
- [wojtek.im — Autoplay does not work on Mobile Safari in Low Power Mode](https://wojtek.im/journal/safari-autoplay-not-working-in-low-power-mode)
- [SiteLint — HTML video autoplay, blank poster, performance in Safari and iOS](https://www.sitelint.com/blog/fixing-html-video-autoplay-blank-poster-first-frame-and-improving-performance-in-safari-and-ios-devices)
- [Medium — Mobile viewport units: svh / lvh / dvh complete guide](https://medium.com/@tharunbalaji110/understanding-mobile-viewport-units-a-complete-guide-to-svh-lvh-and-dvh-0c905d96e21a)
- [TestMu — Viewport unit variants: browser support, dvh, svh, lvh](https://www.testmuai.com/learning-hub/viewport-unit-variants-browser-support/)
- [Savvy.co.il — CSS dvh dynamic viewport height explained](https://savvy.co.il/en/blog/css/css-dynamic-viewport-height-dvh/)
- [W3C — CSS Scroll Snap Module Level 1](https://www.w3.org/TR/css-scroll-snap-1/)
- [MDN — Basic concepts of scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap/Basic_concepts)
- [Mozilla Bug 1959811 — scroll-snap-stop: always gets users stuck](https://bugzilla.mozilla.org/show_bug.cgi?id=1959811)
- [Chrome for Developers — Accessible carousels](https://developer.chrome.com/blog/accessible-carousel)
- [Sara Soueidan — Are CSS carousels accessible?](https://www.sarasoueidan.com/blog/css-carousels-accessibility/)
- [A11y Collective — Carousel accessibility complete guide](https://www.a11y-collective.com/blog/accessible-carousel/)
- [Tatiana Mac — prefers-reduced-motion no-motion-first approach](https://www.tatianamac.com/posts/prefers-reduced-motion)
- [Thoughtbot — Can auto-playing videos be accessible?](https://thoughtbot.com/blog/can-auto-playing-videos-be-accessible)
- [Scott O'Hara — Reduced motion auto-playing videos](https://www.scottohara.me/note/2019/07/12/reduced-motion-video.html)
- [Vimeo — Set a default quality for embedded videos](https://help.vimeo.com/hc/en-us/articles/12426487034641-Set-a-default-quality-for-embedded-videos)
- [Vimeo — About Player Parameters](https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters)
- [Vimeo — Troubleshoot player error messages](https://help.vimeo.com/hc/en-us/articles/12425812280081-Troubleshoot-player-error-messages)
- [Vimeo Player SDK Reference](https://developer.vimeo.com/player/sdk/reference)
- [vimeo/player.js issue #270 — Video not embeddable error](https://github.com/vimeo/player.js/issues/270)
- [Vimeo — Fix video thumbnails in custom applications](https://help.vimeo.com/hc/en-us/articles/12427892029585-Fix-Video-Thumbnails-in-Custom-Applications)
- [YouTube IFrame Player API Reference](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters)
- [MDN — Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [Complianz — YouTube and the GDPR: how to embed YouTube](https://complianz.io/youtube-and-the-gdpr-how-to-embed-youtube-on-your-site/)
- [Kukie.io — YouTube embeds and cookie consent: privacy mode](https://kukie.io/blog/youtube-embeds-cookie-consent)
- [SvelteKit issue #2886 — paths.base + trailing slash](https://github.com/sveltejs/kit/issues/2886)
- [Bjorn Lu — Trailing slash for frameworks](https://bjornlu.com/blog/trailing-slash-for-frameworks)
- Sibling project: `C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\Websites\michelle_ngo_four\.planning\PROJECT.md` (D-05, D-08, D-16, D-18, D-20, D-23, Phase 7 cutover infrastructure)
- This project: `C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\Websites\michelle_ngo_three\.planning\PROJECT.md` (REEL-01..05, FILT-01..04, POL-01..04, A/B constraints)

---

*Pitfalls research for: cinematic-immersive filmmaker portfolio (scroll-snap reel × muted-autoplay iframes × 56 videos × GitHub Pages static deploy × A/B vs `_four`)*
*Researched: 2026-05-19*
