# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in [01-CONTEXT.md](./01-CONTEXT.md) — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 01-foundation
**Areas discussed:** Seed splash on `/`, Focus ring on dark bg, `@theme` token surface, `mnp_three_*` enforcement

---

## Seed splash on `/`

### Q1: What does the seed placeholder show on `/`?

| Option | Description | Selected |
|--------|-------------|----------|
| Wordmark + tagline (mirror `_four`) | Centered `MICHELLE NGO` wordmark + tone-setting tagline placeholder on dark bg. Matches `_four` D-09/D-10 exactly. Lowest risk; A/B parity in placeholder posture. | ✓ |
| Wordmark + scroll cue (skeleton hero) | Wordmark + `↓` scroll cue beneath. Pre-seeds HERO-02's affordance from day one so Phase 5 just swaps in the iframe. | |
| Bare wordmark only | Just `MICHELLE NGO` centered. Most restrained, A24/MUBI-style typographic silence. | |
| Wordmark + `▷ PLAY REEL` CTA stub | Wordmark + non-functional CTA. Maximum HeroAmbient pre-seed but the CTA-with-nowhere-to-go is awkward during the build window. | |

**User's choice:** Wordmark + tagline (mirror `_four`)
**Notes:** Matches `_four` D-09/D-10 pattern verbatim → captured as **D-01**.

### Q2: Background treatment for the splash?

| Option | Description | Selected |
|--------|-------------|----------|
| Solid dark neutral 950 | `bg-neutral-950` (`oklch(0.16 0 0)`). Locks canonical dark canvas token; no asset to source. Matches `_four`'s contrast hierarchy comment. | ✓ |
| Pure black (`#000000`) | Maximum cinema; locks `#000` as canonical letterbox color for `/watch/[id]`. Reads more absolute on OLED. | |
| Static poster from a hero credit | Full-bleed poster (e.g., producer reel 264677021 thumbnail) + gradient overlay. Visually richer; pre-validates `enhanced-img` + gradient-overlay pattern. | |
| Subtle CSS gradient | Slow-pan or radial dark gradient. No assets needed; risks generic dark-template feel. | |

**User's choice:** Solid dark neutral 950
**Notes:** Locks token day one for downstream consumption → captured as **D-02**.

### Q3: Wordmark typography — lock the display serif day one or defer?

| Option | Description | Selected |
|--------|-------------|----------|
| Lock display serif day one | Pick the cinematic display serif now + define `--font-display` in `@theme`. Phase 5 + all future name renderings inherit. | ✓ |
| System serif fallback | Use `font-serif` Tailwind utility (Georgia/Cambria stack); defer real pick to Phase 5. | |
| Neutral sans (defer serif entirely) | Use Inter or system sans now; cinematic serif lands at Phase 5. Matches `_four`'s neutral-splash discretion. | |

**User's choice:** Lock display serif day one
**Notes:** Typography identity established up front; specific font pick rolls into `@theme` area → captured as **D-03**, specific font as **D-09**.

### Q4: Tagline copy under the wordmark?

| Option | Description | Selected |
|--------|-------------|----------|
| `"Filmmaker. Site coming soon."` (mirror `_four` D-09) | Same copy as `_four`'s splash placeholder. Reads deliberate; explicitly placeholder; replaced at Phase 5. | ✓ |
| `"Filmmaker."` (one word) | Most restrained. Tonal match to cinema restraint; doesn't signal placeholder. | |
| No tagline (wordmark alone) | Maximum typographic silence. Pairs with bare wordmark layout. | |
| Custom (different copy) | Something else specific to `_three`. | |

**User's choice:** `"Filmmaker. Site coming soon."` (mirror `_four` D-09)
**Notes:** A/B placeholder parity → captured as **D-04**.

---

## Focus ring on dark bg

### Q1: Focus indicator structure — how does it stay visible on any background?

| Option | Description | Selected |
|--------|-------------|----------|
| Double-ring (outer light + inner dark) | Two stacked rings via `box-shadow`. Works on ANY background — light frames, dark frames, mid-tone overlays. Most defensive against arbitrary dark video posters. | ✓ |
| Single bright ring | One bright high-contrast ring (cream/cyan/category accent) via `outline` or `ring-2`. Simpler; relies on color being bright enough to cut through. | |
| Per-category OKLCH ring | Ring color matches active category accent. Visually consistent; some accents may fail AA on bright video frames. | |
| System default | `outline: auto`. Zero design work; inconsistent across browsers; WCAG fail risk on light video frames. | |

**User's choice:** Double-ring (outer light + inner dark)
**Notes:** Defensive against bright daylight PBS frames specifically → captured as **D-05**.

### Q2: Primary ring color?

| Option | Description | Selected |
|--------|-------------|----------|
| Cream/warm-white | Off-white at high lightness (`~oklch(0.98 0.02 80)`). Reads cinematic-warm; pairs with display serif. Less clinical than pure white. | ✓ |
| Pure white | `#ffffff` / `oklch(1 0 0)`. Maximum contrast on dark bg; slightly clinical. | |
| Cyan/electric-blue accent | High-chroma OKLCH cyan. More distinctive; pulls design toward sci-fi/tech; may fight category accents. | |
| Other | User-specified. | |

**User's choice:** Cream/warm-white
**Notes:** Cinema-warm match for display serif aesthetic → captured as **D-06**.

### Q3: Ring width / offset?

| Option | Description | Selected |
|--------|-------------|----------|
| 2px ring + 2px offset (default) | `outline: 2px solid <color>; outline-offset: 2px;`. Standard, accessible, doesn't dominate. | ✓ |
| 3px ring + 2px offset (heavier) | Thicker ring; more visible during fast scroll; trades elegance for visibility. | |
| 2px ring, no offset | Tight ring hugging the element. Compact; less halo. | |
| Other | User-specified. | |

**User's choice:** 2px ring + 2px offset (default)
**Notes:** Standard Tailwind weight; captured as **D-07**.

### Q4: Where does the focus token apply?

| Option | Description | Selected |
|--------|-------------|----------|
| Global `:focus-visible` in `app.css` | Define `--ring-focus` + `--ring-focus-offset` in `@theme` + apply via single global rule. Every interactive element inherits automatically. Satisfies SC #3. | ✓ |
| Token only, applied per-component | Token in `@theme`; each component opts in via Tailwind utilities. More explicit; easier override; forgetful component becomes keyboard-invisible. | |

**User's choice:** Global `:focus-visible` in `app.css`
**Notes:** Mechanical guarantee that no component can become keyboard-invisible → captured as **D-08**.

---

## @theme token surface

### Q1: Display serif (wordmark, hero name, `/about` bio, `/press` credits)?

| Option | Description | Selected |
|--------|-------------|----------|
| Source Serif 4 | Adobe open-source; modern transitional; editorial weight; ample weights 200–900. SIL OFL. | ✓ |
| EB Garamond | Classical Garamond revival; literary/auteur; lighter weights feel A24-ish. | |
| Cormorant | High-contrast Garamond derivative; dramatic; more decorative; risks period-piece feel. | |
| Other | User-specified (e.g., GT Sectra, Tiempos, Domaine Display). | |

**User's choice:** Source Serif 4
**Notes:** → captured as **D-09**.

### Q2: Monospace (numeric metadata, timestamps, durations, category tags)?

| Option | Description | Selected |
|--------|-------------|----------|
| JetBrains Mono | Apache 2.0; modern programming-grade clarity; ligatures; best legibility at small sizes. | ✓ |
| IBM Plex Mono | Open-source IBM; slightly warmer; pairs with IBM Plex Sans. | |
| System mono (`ui-monospace`) | Tailwind `font-mono` system stack. No font file; native rendering; less brand-locked. | |
| Other | User-specified. | |

**User's choice:** JetBrains Mono
**Notes:** → captured as **D-10**.

### Q3: Neutral sans (UI chrome — nav, buttons, filter pills, captions)?

| Option | Description | Selected |
|--------|-------------|----------|
| Inter | Open-source; highly legible at small sizes; de-facto modern UI sans; pairs with any serif. | ✓ |
| IBM Plex Sans | Open-source IBM; more characterful; pairs with IBM Plex Mono. | |
| System sans (`ui-sans-serif`) | Tailwind default; zero font load; native per OS; loses brand consistency. | |
| Other | User-specified (e.g., Söhne, ABC Diatype, Geist). | |

**User's choice:** Inter
**Notes:** → captured as **D-11**.

### Q4: Beyond fonts + focus + neutrals — what else to lock in `@theme` day one?

| Option | Description | Selected |
|--------|-------------|----------|
| Copy `_four`'s OKLCH category accents now | Port `--color-cat-pbs/promos/branded/docshort/reel/personal/edunon/other` verbatim. Phase 3+ CategoryTag work consumes them with zero setup. | ✓ |
| Fonts + focus + neutrals only (defer accents to Phase 3) | Lighter scaffold; revisit `app.css` at Phase 3. | |
| Fonts + focus + neutrals + overlay/transition tokens | Add `--gradient-overlay-strength`, `--transition-cinema`, `--chrome-fade-duration` day one so Phase 3+5 inherit consistent motion timings. | |
| Full (accents + overlay + transitions + spacing) | Maximum day-one lock-in; risks tokens that get revised once real content lands. | |

**User's choice:** Copy `_four`'s OKLCH category accents now
**Notes:** Max reuse; A/B parity on accent palette → captured as **D-12**.

### Q5 (follow-up): How should the three font families load?

| Option | Description | Selected |
|--------|-------------|----------|
| Self-host woff2 in `/static/fonts/` | Commit subsetted woff2 files; `@font-face` in `app.css` with `font-display: swap`. GH Pages CDN serves them at `/michelle_ngo_three/fonts/*.woff2`. Zero cross-origin handshakes; GDPR-clean; best for POL-02 LCP. | ✓ |
| Google Fonts CDN | `<link>` + `<preconnect>`. Two cross-origin handshakes; Google receives EU user IP — conflicts with `_four`'s no-CMP "interaction-as-consent" stance. | |
| Bunny Fonts (GDPR-safe proxy) | Google Fonts proxy; no Google handshake; still one cross-origin request. | |
| Mirror `_four`'s font strategy exactly | Inherit whatever `_four` does for A/B parity. | |

**User's choice:** Self-host woff2 in `/static/fonts/`
**Notes:** Confirmed in clarification turn after user mentioned GH Pages hosting. GH Pages CDN serves font files with cache headers; `BASE_PATH` is auto-applied. → captured as **D-13**.

---

## `mnp_three_*` enforcement

### Q1: Primary enforcement mechanism for `mnp_three_*` namespacing?

| Option | Description | Selected |
|--------|-------------|----------|
| Typed `$lib/storage.ts` helper | Tiny module with `storage.get/set/remove/clear` that auto-prefixes `mnp_three_`. Components never touch `window.localStorage`. Makes drift mechanically impossible. | ✓ |
| Convention + grep gate | Document in CLAUDE.md, manually use `mnp_three_<key>`, CI grep gate catches violations. Lighter scaffold; relies on regex correctness. | |
| ESLint custom rule banning raw localStorage | Custom rule errors on any `localStorage.*` outside `storage.ts`. Most rigorous; highest setup + maintenance cost. | |
| Helper + grep gate (belt and suspenders) | Both mechanisms together. Maximum defense. | |

**User's choice:** Typed `$lib/storage.ts` helper
**Notes:** → captured as **D-14**. (Note: D-17 adds the grep gate independently, so the effective posture ended up matching "Helper + grep gate" — the user picked the helper as the primary mechanism and approved the gate separately in Q4.)

### Q2: If using a helper — what shape does its API take?

| Option | Description | Selected |
|--------|-------------|----------|
| Object with typed methods + JSON serialize | `storage = { get<T>, set<T>, remove, clear }`. Auto-stringify on set, auto-parse on get. SSR-safe no-op. | ✓ |
| Per-key typed accessor functions | `getReelPosition()`, `setReelPosition(value)`, etc. Most type-safe (compile-time key enforcement); edit `storage.ts` for every new key. | |
| Svelte 5 rune wrapper | `persisted<T>(key, defaultValue): { value: T }` factory. Auto-syncs via `$effect`. Most idiomatic Svelte 5; heavier API. | |
| Defer — ship object-with-methods, evolve later | Start simplest, refactor to runes if Phase 3/4 wants reactive persistence. | |

**User's choice:** Object with typed methods + JSON serialize
**Notes:** Simplest mental model; matches function-call pattern → captured as **D-15**.

### Q3: Scope — what else besides localStorage needs the namespace?

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage only | Trap D's specific concern (persistent shared-origin storage). `sessionStorage` is tab-scoped; cookies unused in v1. | ✓ |
| localStorage + sessionStorage | Cover both; sessionStorage doesn't cross siblings but namespacing it now avoids future surprise. | |
| localStorage + sessionStorage + cookies + URL state | Maximum scope; URL state isn't really namespaceable; over-scoped for v1. | |

**User's choice:** localStorage only
**Notes:** Matches Trap D's exact concern → captured as **D-16**.

### Q4: CI gate — should PRs that introduce raw localStorage references fail the build?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — grep gate in `deploy.yml` | CI step `grep -rE 'window\.localStorage\|...' src/ --exclude=storage.ts; exit 1 if match`. Mechanically enforces convention without trusting reviewer attention. | ✓ |
| No — trust the helper + reviewer | Enforce only via helper being only sensible API; code review catches violations. Lighter CI. | |

**User's choice:** Yes — grep gate in `deploy.yml`
**Notes:** Mechanical enforcement satisfies SC #3 "verifiable by grep" → captured as **D-17**.

---

## Claude's Discretion

Items where the user delegated implementation detail to Claude during planning/execution:

- Exact woff2 subset character ranges (Latin only vs Latin+Extended).
- Specific cream OKLCH coordinates for the focus ring (D-06 target; tune for AA 4.5:1 on both `oklch(0.16 0 0)` and bright posterized frames).
- Inner-ring (dark) color exact value.
- Neutral palette ramp (950/900/800/.../50 OKLCH values).
- Wordmark exact font size/weight/letter-spacing on the splash (revised at Phase 5 anyway).
- README.md content (SvelteKit default + one-liner pointing at `_four`).
- `husky` / `lint-staged` exact version pins (match `_four`).
- `.prettierrc` specifics (match `_four`).
- Storage helper internal fallback behavior on `JSON.parse` failure.
- Additional `pnpm` scripts beyond `_four`'s set.
- ESLint rule severities (error vs warn) — match `_four`.

## Deferred Ideas

Items raised during discussion that belong in other phases or in plan-phase scoping:

- Phase 1 CI scope expansion (separate PR-time CI workflow running lint + typecheck + tests, Lighthouse CI warn-only scaffolding) — discussed; deferred to plan-phase. Lighthouse CI is explicitly Phase 7 work (POL-02 "blocking pre-cutover").
- `PUBLIC_SITE_URL` env wiring strategy (`.env` vs `.env.example`, staging vs production, GH Actions injection) — deferred to plan-phase.
- Concrete shape of the 4 smoke-tests (which assertions count toward each of unit / e2e / axe / `runed` IO hook) — deferred to plan-phase.
- PR preview deploys — not in v1 roadmap.
- Custom staging subdomain on `michellengo.net` — Phase 7 cutover only.
- Real favicon set + OG/Twitter card metadata — Phase 7 (POL-01).
- 404 / 50x error pages — Phase 4 or Phase 7.
- Light-mode palette / `prefers-color-scheme: light` — explicit Out of Scope.
- Font self-hosting beyond Latin subset — revisit at Phase 6 if needed.
