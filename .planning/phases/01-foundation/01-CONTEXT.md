# Phase 1: Foundation - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up a buildable, deploying SvelteKit 2 + Svelte 5 + TS strict scaffold at `https://wolfwdavid.github.io/michelle_ngo_three/` that mirrors `_four`'s tooling AND locks in `_three`-specific conventions from day one so they never need to be retrofitted: `BASE_PATH=/michelle_ngo_three/`, dark-only palette via Tailwind v4 `@theme` tokens, high-contrast focus token, `mnp_three_*` localStorage namespace via a typed helper, `PUBLIC_SITE_URL` env, and the 5 cinematic-layer dep additions (`runed`, `@sveltejs/enhanced-img`, `@tailwindcss/typography`, `@playwright/test` + `@axe-core/playwright`, `@testing-library/svelte` + `@testing-library/jest-dom`) installed and smoke-tested.

In scope:
- Project scaffold mirroring `_four`'s `package.json` / `svelte.config.js` / `tsconfig.json` / `eslint.config.js` / husky+lint-staged setup
- One smoke-test route at `/` (dark cinematic splash placeholder)
- GitHub Actions auto-deploy from `main` to `wolfwdavid.github.io/michelle_ngo_three/`
- `_three`-specific conventions locked in `app.css` `@theme` + `$lib/storage.ts` + global `:focus-visible` rule
- Smoke-test gate: one unit test + one e2e + one axe assertion + one `runed` IntersectionObserver hook usage

Out of scope (other phases):
- `videos.json` data layer + Zod schema + Vite build-fail plugin — Phase 2
- Reel system + iframe lifecycle — Phase 3
- Filter pill bar + `/work/[category]` routes + cinematic TopNav — Phase 4
- HeroAmbient + WatchPlayer + ContinueReelRail — Phase 5
- PBS / Press / About / Contact pages — Phase 6
- Per-page SEO + Lighthouse CI + axe-core CI gate + production cutover (`michellengo.net`) — Phase 7

</domain>

<decisions>
## Implementation Decisions

### Seed splash on `/`
- **D-01:** `/` renders a centered `MICHELLE NGO` wordmark + tagline placeholder on dark bg — mirrors `_four`'s D-09/D-10 placeholder pattern exactly so the build-window posture is A/B-parity-neutral. Real `<HeroAmbient />` (iframe + scroll cue + `▷ PLAY REEL` CTA) lands at Phase 5.
- **D-02:** Splash background is `bg-neutral-950` (`oklch(0.16 0 0)` per `_four`'s contrast hierarchy comment) — locks the canonical dark canvas token used by every later phase.
- **D-03:** Wordmark uses the cinematic display serif locked in `@theme` day one via `--font-display` — typography identity established up front, no Phase 5 surprise.
- **D-04:** Tagline copy is exactly `"Filmmaker. Site coming soon."` — matches `_four` D-09 verbatim. Gets replaced at Phase 5.

### Focus indicator
- **D-05:** Keyboard focus uses a double-ring indicator (outer cream/warm-white + inner dark) — defensive against arbitrary dark video backgrounds AND bright video frames (e.g., PBS American Portrait daylit subjects). NAV-02 + WCAG 2.4.7 load-bearing.
- **D-06:** Primary ring color is cream/warm-white (target `~oklch(0.98 0.02 80)`) — cinematic-warm match for the display serif aesthetic; less clinical than pure white.
- **D-07:** Ring weight is `2px` + `2px` outline-offset (Tailwind `ring-2 ring-offset-2` equivalent via `outline`).
- **D-08:** Applied via a single global `:focus-visible` rule in `src/app.css` driven by `--ring-focus` + `--ring-focus-offset` tokens defined in `@theme`. Components inherit automatically — no per-component opt-in, so a forgetful component cannot become invisible to keyboard users. Satisfies ROADMAP Phase 1 Success Criteria #3 ("focus token defined in codebase before any feature code lands").

### `@theme` token surface (day-one design system scope)
- **D-09:** Display serif is **Source Serif 4** → bound to `--font-display`. Used for `MICHELLE NGO` wordmark, Phase 5 hero name, Phase 6 `/about` bio + `/press` credits. SIL OFL; weights 400/600/700 subsetted.
- **D-10:** Mono is **JetBrains Mono** → bound to `--font-mono`. Used for numeric metadata, durations, timestamps, category-tag stamps. Apache 2.0; weight 400 subsetted.
- **D-11:** Neutral sans is **Inter** → bound to `--font-sans`. Used for nav, buttons, filter pills, captions, body chrome. SIL OFL; weights 400/500/600 subsetted.
- **D-12:** Copy `_four`'s 8 OKLCH category accents verbatim into `app.css` `@theme` on day one: `--color-cat-pbs` (`oklch(0.72 0.21 25)`), `--color-cat-promos` (`oklch(0.78 0.18 60)`), `--color-cat-branded` (`oklch(0.72 0.18 180)`), `--color-cat-docshort` (`oklch(0.78 0.18 130)`), `--color-cat-reel` (`oklch(0.78 0.18 280)`), `--color-cat-personal` (`oklch(0.78 0.18 330)`), `--color-cat-edunon` (`oklch(0.78 0.18 90)`), `--color-cat-other` (`oklch(0.78 0.05 250)`). Phase 3 `CategoryTag` consumes them with zero setup; A/B parity on accent palette.
- **D-13:** All three font families are self-hosted as subsetted woff2 in `static/fonts/`, declared via `@font-face` in `app.css` with `font-display: swap`. Zero cross-origin handshakes (no Google Fonts, no Bunny CDN); GDPR-clean, no EU Google-cookie surface; aligns with `_four`'s no-CMP "interaction-as-consent" posture noted in STATE.md blockers. GH Pages CDN serves them at `/michelle_ngo_three/fonts/*.woff2` with cache headers.

### `mnp_three_*` localStorage namespacing (Trap D mitigation)
- **D-14:** Namespacing is enforced via a typed `$lib/storage.ts` helper that auto-prefixes every key with `mnp_three_`. Components never touch `window.localStorage` directly. Makes drift mechanically impossible across refactors. Trap D risk eliminated at the source.
- **D-15:** Helper API shape is an object with typed methods: `storage.get<T>(key: string): T | null`, `storage.set<T>(key: string, value: T): void`, `storage.remove(key: string): void`, `storage.clear(): void`. Auto-stringify on `set`, auto-parse on `get`. No-ops when `typeof window === 'undefined'` (SSR-safe — required for SvelteKit prerender). Try/catch around `JSON.parse` to tolerate corrupt values (Claude's discretion on fallback shape).
- **D-16:** Helper scope is `localStorage` only. `sessionStorage` is tab-scoped (doesn't cross siblings, Trap D doesn't apply); cookies aren't used in v1 (no auth, no analytics, mailto-only contact); URL state isn't namespaceable (filter routes live at `/work/[category]` and matter for SEO).
- **D-17:** CI grep gate in `.github/workflows/deploy.yml` blocks any raw `localStorage.*` or `window.localStorage.*` reference outside `src/lib/storage.ts`. Fails the build with a clear message. Mechanically enforces the helper-only path; cannot be silently violated by a forgetful Phase 3+ commit. Satisfies ROADMAP Phase 1 Success Criteria #3 ("verifiable by grep").

### Claude's Discretion
- Exact woff2 subset character ranges (Latin only vs Latin+Extended; emoji/symbol fallbacks via system sans).
- Specific cream OKLCH coordinates (D-06 gives the target; tune for AA 4.5:1 on `oklch(0.16 0 0)` AND on a bright posterized frame).
- Inner-ring (dark) color exact value — likely `oklch(0.16 0 0)` matching neutral-950 for visual rhyme.
- Neutral palette ramp (950/900/800/.../50 OKLCH values) — sensible dark-mode neutrals.
- Wordmark exact font size/weight/letter-spacing on the splash — get replaced at Phase 5 anyway.
- README.md content — fine to leave at SvelteKit scaffold default + a one-liner pointing at `_four` as the editorial sibling.
- `husky` / `lint-staged` exact version pins (use the pins from `_four`'s `package.json` for parity).
- `.prettierrc` specifics (print width, semis, single vs double quotes) — match `_four` exactly.
- Storage helper internal fallback behavior on `JSON.parse` failure (return `null` vs throw vs default).
- `pnpm` scripts beyond `_four`'s set (e.g., add `pnpm typecheck` alias for `svelte-check`).
- ESLint rule severities (error vs warn) — match `_four`.

### Deferred to plan-phase (discussed but not locked)
- Phase 1 CI scope: whether a separate PR-time CI workflow runs lint + typecheck + tests, OR if those checks live only in the deploy workflow. The smoke-test gate from SC #4 (one unit + one e2e + one axe + one IO hook) lands either way. Lighthouse CI scaffolding is explicitly Phase 7 work (POL-02 says "blocking pre-cutover").
- `PUBLIC_SITE_URL` env wiring details: `.env` file strategy (committed default vs `.env.example` only), staging vs production value, GH Actions injection mechanism. SC #3 just requires the env be defined in the codebase.
- Concrete shape of the 4 smoke-tests (which specific assertion counts toward each of unit / e2e / axe / `runed` IO).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 requirements + success criteria
- `.planning/ROADMAP.md` §Phase 1: Foundation — goal, depends-on, 4 success criteria, FOUND-01 + FOUND-02 mapping
- `.planning/REQUIREMENTS.md` §Foundation — FOUND-01 (clean static build, TS strict + `noUncheckedIndexedAccess` + `noImplicitOverride`, Svelte 5 runes, Tailwind v4), FOUND-02 (`main` → GH Actions → `wolfwdavid.github.io/michelle_ngo_three/` with `BASE_PATH=/michelle_ngo_three/`)
- `.planning/REQUIREMENTS.md` §Out of Scope — light-mode palette explicit exclusion (informs dark-only `@theme`), pre-generated MP4 preview clips, CMS, analytics, contact form, i18n, mobile native app

### Project-wide context (locked constraints)
- `.planning/PROJECT.md` §Constraints — tech stack lock (SvelteKit 2.59+ / Svelte 5.55+ / TS 5.9 strict / Tailwind v4.3+ / pnpm), hosting (GH Pages via `adapter-static`), domain (`wolfwdavid.github.io/michelle_ngo_three/` staging; `michellengo.net` apex deferred to Phase 7), bandwidth ethics
- `.planning/PROJECT.md` §Key Decisions — `_three` is real shipping candidate; reuse `_four`'s `videos.json` byte-for-byte; LCP budget 2.5s (vs `_four`'s 2.0s); GH Pages staging
- `.planning/STATE.md` §Blockers/Concerns — `mnp_three_*` namespace requirement (Trap D); REQUIREMENTS.md count drift acknowledged

### Research synthesis (cinematic-layer dep choices)
- `.planning/research/SUMMARY.md` §Key Findings — Recommended Stack — 5 new deps locked: `runed` (Svelte 5 rune-native IO), `@sveltejs/enhanced-img` (poster generation), `@tailwindcss/typography` (only Tailwind plugin needed), `@playwright/test` + `@axe-core/playwright` (e2e + a11y CI), `@testing-library/svelte` + `@testing-library/jest-dom`
- `.planning/research/SUMMARY.md` §Research Flags — Phase 1 explicitly flagged "Standard patterns (skip phase research)" → `/gsd:plan-phase 1 --skip-research` is the recommended next command
- `.planning/research/SUMMARY.md` §Critical Cross-Cutting Decisions — Trap D (shared `wolfwdavid.github.io` localStorage origin) motivates D-14..D-17
- `.planning/research/STACK.md` — Full version matrix (locked floor from `_four`'s `package.json` + cinematic-layer additions deltas)
- `.planning/research/ARCHITECTURE.md` — State ownership patterns (component-local `$state` vs module-scope rune vs `$lib/storage.ts`); informs D-14 helper API shape
- `.planning/research/PITFALLS.md` §A/B Integrity Traps — Trap D shared-localStorage detail

### Sibling-project reference (max verbatim reuse)
- `../michelle_ngo_four/package.json` — version floor for all locked deps (mirror exactly except `_three`'s 5 new deps + `_three`-specific scripts)
- `../michelle_ngo_four/svelte.config.js` — `adapter-static` config to replicate verbatim (`pages: 'build'`, `assets: 'build'`, `fallback: '404.html'`, `strict: true`, `paths.base: process.env.BASE_PATH ?? ''`)
- `../michelle_ngo_four/tsconfig.json` — TS config to replicate verbatim (`strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`)
- `../michelle_ngo_four/eslint.config.js` — flat ESLint config to mirror
- `../michelle_ngo_four/.github/workflows/deploy.yml` — GH Actions deploy pattern (verbatim with one swap: `BASE_PATH` already resolves to `/${{ github.event.repository.name }}` which produces `/michelle_ngo_three` automatically — no manual edit needed)
- `../michelle_ngo_four/src/app.css` — `@theme` block pattern for OKLCH category accents (lines 27-36 copy verbatim into `_three`'s `app.css`)
- `../michelle_ngo_four/.planning/phases/01-foundation/01-CONTEXT.md` — sibling Phase 1's decision inventory (D-01..D-16 from `_four`); most decisions transfer with hosting swap (Cloudflare Pages → GH Pages) being the main delta

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

**From `_four` (verbatim copy or near-verbatim mirror):**
- `_four/package.json` `devDependencies` block — entire locked-foundation dep list (versions 4.4.3 to 22.19.18) copies straight; `_three` adds 5 deps from research/SUMMARY.md
- `_four/.github/workflows/deploy.yml` — works as-is for `_three` because it derives `BASE_PATH` from `${{ github.event.repository.name }}` (resolves to `michelle_ngo_three` automatically)
- `_four/svelte.config.js` — 21 lines, zero changes needed
- `_four/tsconfig.json` — 8 lines, zero changes needed
- `_four/src/app.css` `@theme` block (lines 27-36) — 8 OKLCH category accent variables (D-12)
- `_four/.prettierrc` + `_four/eslint.config.js` — copy verbatim
- `_four/static/robots.txt` — `User-agent: * / Disallow: /` for staging noindex; Phase 7 flips it

**Built day one in `_three` (no `_four` analogue):**
- `src/lib/storage.ts` — typed localStorage helper with `mnp_three_*` prefix (D-14, D-15, D-16); `_four` doesn't have this because it has no sibling-collision risk
- `app.css` `@theme` additions beyond `_four`: `--font-display`, `--font-mono`, `--font-sans`, `--ring-focus`, `--ring-focus-offset`, and the neutrals palette ramp (Claude's discretion)
- Global `:focus-visible` rule in `app.css` (D-08)
- `static/fonts/` directory with subsetted woff2 (D-13)
- `.env` or `.env.example` defining `PUBLIC_SITE_URL` (resolution deferred to plan-phase)

### Established Patterns

- **GSD workflow lock-in:** `CLAUDE.md` enforces routing all edits through GSD commands; husky pre-commit must not conflict with GSD's atomic-commit flow (see `_four` D-15).
- **Planning docs structure:** `.planning/PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, plus `.planning/phases/XX-name/XX-{CONTEXT,RESEARCH,PLAN,VERIFICATION}.md`. Don't move or rename.
- **Tailwind v4 plugin order:** `tailwindcss()` BEFORE `sveltekit()` in `vite.config.ts` plugins array (Phase 1 Pattern 1, called out in `_four/vite.config.ts:72`).
- **`adapter-static` + GH Pages:** `BASE_PATH` env passed at build time; `paths.base` consumes it; `404.html` fallback required for client-side routing on GH Pages.
- **`@theme` CSS-first config:** Tailwind v4 reads variables from `app.css` `@theme { ... }` block; no `tailwind.config.js` needed (D-02 from `_four`).

### Integration Points

- **GH Actions ↔ GH Pages:** `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` pattern from `_four/.github/workflows/deploy.yml`. `concurrency: { group: pages, cancel-in-progress: false }` prevents deploy races.
- **pnpm-lock.yaml ↔ pnpm/action-setup@v4:** `version: 11.0.9` pin in workflow matches `packageManager: "pnpm@11.0.9"` in `package.json` so CI uses the exact same pnpm version as local.
- **`PUBLIC_SITE_URL` ↔ `import.meta.env.PUBLIC_SITE_URL`:** SvelteKit exposes `PUBLIC_*`-prefixed env vars to client code. Phase 7 SEO work (POL-01 sitemap + OG cards + JSON-LD) consumes this.
- **`$lib/storage.ts` ↔ Phase 3+ persistence:** Phase 3 will use it for WATCH-05 back-nav scroll restoration; Phase 4 may use it for filter-preference memory (TBD).
- **Global `:focus-visible` rule ↔ Phase 4 NAV-02:** Every interactive element gets the focus token automatically; Phase 4 keyboard-nav work consumes it without per-component opt-in.

</code_context>

<specifics>
## Specific Ideas

- Wordmark + tagline matches `_four` D-09/D-10 verbatim so the placeholder posture is A/B-parity-neutral — a producer who happens to land on either staging URL during the build window sees the same intentional-placeholder posture.
- Self-host fonts in `static/fonts/` because EU users on `_four` already get zero Google Fonts handshakes (assumed; verify during plan-phase). Inheriting that posture keeps Trap D thinking aligned: minimize cross-origin handshakes that vary between siblings.
- Double-ring focus chosen explicitly because the reel will render posters from PBS American Portrait videos with bright daylight subjects — a single bright ring would disappear against a sunlit poster. The outer cream + inner dark stack works on ANY frame.
- Helper-first storage (D-14) over convention-only because the realistic failure mode is a Phase 3+ commit during a debugging session — the kind of moment where copy-pasted `localStorage.setItem(...)` from a Stack Overflow answer skips the prefix. The helper makes that mechanically impossible; the grep gate (D-17) catches anyone who tries to import `localStorage` despite the helper existing.
- 5 cinematic-layer deps installed even though only `runed` gets exercised in Phase 1's smoke tests — installing them all upfront prevents the "we should have installed Playwright in Phase 1" friction that hits at Phase 3 entry when iframe lifecycle tests need real-browser coverage.

</specifics>

<deferred>
## Deferred Ideas

- **PR preview deploys** — not in v1 roadmap; revisit if a collaborator joins or A/B winner needs reviewer sign-off pre-cutover.
- **Custom staging subdomain on `michellengo.net`** (e.g., `staging.michellengo.net`) — Phase 7 cutover only; requires WordPress.com DNS work.
- **Real favicon set + OG/Twitter card metadata** — Phase 7 polish (POL-01); placeholder favicon and minimal `<title>Michelle Ngo</title>` are enough for Phase 1.
- **404 / 50x error pages** — Phase 4 or Phase 7 (depends on whether layout shell exists at that point).
- **Phase 1 CI scope expansion** — separate PR-time CI workflow running lint + typecheck + tests. Discussed in this session but deferred to plan-phase to scope concretely. Lighthouse CI scaffolding is explicitly Phase 7 work (POL-02 "blocking pre-cutover").
- **`PUBLIC_SITE_URL` env wiring strategy** — `.env` vs `.env.example`, staging vs production override, GH Actions injection. Decision deferred to plan-phase; SC #3 only requires the env be defined.
- **Concrete smoke-test shape** — which specific assertions count toward unit / e2e / axe / `runed` IO hook usage. Researcher / planner will resolve against SC #4 during plan-phase.
- **Light-mode palette / `prefers-color-scheme: light`** — explicit Out of Scope in REQUIREMENTS.md; dark-only is a design statement, not a constraint to relax.
- **Custom share modal beyond `mailto:`** — v2 (FEAT-V2-03).
- **Font self-hosting beyond Latin subset** — if `/about` or `/press` body copy needs Latin Extended characters, revisit subset at Phase 6.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-05-20*
