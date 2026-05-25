---
phase: 01-foundation
plan: 03
subsystem: infra
tags: [github-actions, ci, deploy, gh-pages, base-path, smoke-tests, playwright, axe-core, runed, intersectionobserver, vitest, testing-library-svelte, jsdom, grep-gate, d-17, localstorage-discipline]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Plan 01-01 (package.json + pnpm-lock.yaml + vite.config.ts with tailwindcss→sveltekit plugin order + jsdom env + scripts: lint/check/test/test:e2e + adapter-static BASE_PATH wiring + .npmrc engine-strict + Node 22 .nvmrc)"
provides:
  - "GitHub Actions workflow .github/workflows/deploy.yml — push-to-main triggers build + 4 smoke-test gates + D-17 grep gate + upload-pages-artifact + deploy-pages with BASE_PATH=/michelle_ngo_three resolved from github.event.repository.name"
  - "Live staging site at https://wolfwdavid.github.io/michelle_ngo_three/ over HTTPS with BASE_PATH applied to all asset and route URLs"
  - "D-17 CI grep gate that fails the workflow if any file under src/ (except $lib/storage.ts + storage.test.ts) references window.localStorage, localStorage.<method>, or localStorage[key]"
  - "Four smoke-test gates exercised before every deploy: (1) unit on $lib/intersectionVisibility + smoke-page component, (2) Playwright e2e on / asserting 200 + <main> + /Michelle Ngo/ title, (3) axe-core scan returning zero WCAG 2a+aa+best-practice violations, (4) runed useIntersectionObserver hook exercised via IntersectionVisibility class"
  - "src/lib/intersectionVisibility.svelte.ts — tiny rune-native wrapper around runed's useIntersectionObserver (replaced in Phase 3 by ReelStage; serves as the smoke-test exercise of the cinematic-layer dep)"
  - "vitest-setup-ui.ts — loads @testing-library/jest-dom matchers + inert IntersectionObserver mock (jsdom doesn't ship one)"
  - "playwright.config.ts — Vite preview on PORT 4183 (shifted from default 4173 to avoid sibling _four collision during A/B local dev); webServer command 'pnpm build && pnpm preview --port 4183'; Chromium-only Phase 1 (webkit + firefox land in Phase 3 per REEL load-bearing risk)"
  - "src/vitest-globals.d.ts — narrower module augmentation surfacing jest-dom matchers on Vitest's Assertion type under TS strict (sidestepping jest-dom's bundled Jest type reference that errors under noImplicitAny)"
  - "vite.config.ts augmented additively: setupFiles: ['./vitest-setup-ui.ts'] + resolve.conditions: ['browser'] (Svelte 5 mount() under @testing-library/svelte requires browser conditions; without them mount() throws lifecycle_function_unavailable). Plan 01-01's plugins: [tailwindcss(), sveltekit()] preserved verbatim."
affects: [phase 01 complete; phase 02 (consumes the green CI workflow + the four gates — new Zod schema + cross-repo diff plugin in 02 must keep all gates green), phase 03 (REEL system unit tests will sit alongside intersectionVisibility.svelte.test.ts pattern; e2e under playwright.config.ts will add webkit + iPhone 14 projects), phase 07 (POL-04 hardens axe-core scan from warn to error across every route; LHCI gate added in deploy.yml; D-17 grep gate is the template for additional structural drift guards)]

# Tech tracking
tech-stack:
  added:
    - "GitHub Actions workflow stack: actions/checkout@v4, actions/setup-node@v4 (node-version: 22), pnpm/action-setup@v4 (version: 11.0.9 standalone), actions/upload-pages-artifact@v3, actions/deploy-pages@v4"
    - "runed 0.37.1 — exercised in production code via IntersectionVisibility wrapper class"
    - "@testing-library/svelte 5.3.1 — exercised via smoke-page.test.ts (render + screen + fireEvent)"
    - "@testing-library/jest-dom 6.9.1 — surfaces .toHaveTextContent() + .toBeInTheDocument() in component tests"
    - "@playwright/test 1.60.0 + @axe-core/playwright 4.11.3 — exercised by tests/e2e/splash.spec.ts + tests/e2e/axe.spec.ts"
  patterns:
    - "Pattern: All localStorage access goes through $lib/storage.ts (D-14 namespace discipline) and CI mechanically enforces it via .github/workflows/deploy.yml's grep step that scans src/ excluding the helper + its test, emitting ::error:: annotations on match (D-17)."
    - "Pattern: BASE_PATH is set ONLY on the artifact-build step, NOT on the e2e step. Playwright's preview server serves the build at the root so page.goto('/') resolves; the deploy artifact build re-runs with BASE_PATH=/michelle_ngo_three for GH Pages subpath. Two builds, two BASE_PATH postures — comments in both deploy.yml and playwright.config.ts cross-reference each other."
    - "Pattern: Svelte 5 files that use runes outside .svelte components MUST end in .svelte.{js,ts}. Test files that instantiate rune-using classes MUST be .svelte.test.ts and wrap construction in $effect.root(() => { ... }). Svelte 5.55+ refuses to compile runes in plain .ts and refuses to register $effect outside an effect-root scope."
    - "Pattern: @testing-library/svelte's mount() needs resolve.conditions: ['browser'] in vite.config.ts AND setupFiles for jest-dom + IntersectionObserver mock. Without browser conditions, mount() throws lifecycle_function_unavailable; without the IO mock, any module that touches IntersectionObserver at import time crashes."
    - "Pattern: Vitest 4 + @testing-library/svelte with globals: false does NOT auto-cleanup mounted components between tests — must call afterEach(cleanup) explicitly. Otherwise screen.getByTestId() finds leftover nodes from prior tests."
    - "Pattern: Playwright preview port 4183 (NOT Vite default 4173) — avoids local-dev collision when sibling _four's preview server is also running during A/B comparison work. CI is unaffected (fresh containers)."

key-files:
  created:
    - "vitest-setup-ui.ts (jest-dom matchers + inert IntersectionObserver mock)"
    - "src/lib/intersectionVisibility.svelte.ts (runed useIntersectionObserver wrapper; class with $state-backed isVisible getter; JSDoc mandates $effect.root scope at instantiation)"
    - "src/lib/intersectionVisibility.svelte.test.ts (3 tests under $effect.root scope; renamed from .test.ts deviation Rule 1)"
    - "src/lib/smoke-page.svelte (minimal Svelte 5 runes component: $props + $state + onclick counter)"
    - "src/lib/smoke-page.test.ts (2 component tests via @testing-library/svelte; afterEach(cleanup) deviation Rule 1)"
    - "src/vitest-globals.d.ts (narrower Vitest Assertion augmentation for jest-dom matchers — deviation Rule 3)"
    - "playwright.config.ts (Chromium project + webServer pnpm build && pnpm preview --port 4183; comment explains BASE_PATH omission)"
    - "tests/e2e/splash.spec.ts (page.goto('/') → 200 + <main> visible + title matches /Michelle Ngo/)"
    - "tests/e2e/axe.spec.ts (AxeBuilder withTags wcag2a + wcag2aa + wcag21a + wcag21aa + best-practice → violations.length === 0)"
    - ".github/workflows/deploy.yml (build + D-17 grep gate + lint + check + unit tests + Playwright install + e2e + axe + artifact build with BASE_PATH + upload-pages-artifact + deploy-pages)"
  modified:
    - "vite.config.ts (additive: setupFiles ['./vitest-setup-ui.ts'] in test block + top-level resolve.conditions ['browser']; plugins line preserved verbatim)"

key-decisions:
  - "D-17 CI grep gate landed in .github/workflows/deploy.yml as a discrete step BEFORE lint/check/unit/e2e — fails fast with ::error:: annotations citing offending lines; --exclude='storage.ts' + --exclude='storage.test.ts' carve out the helper-only escape hatch. Regex covers all three access shapes: window.localStorage, localStorage.<method>, localStorage[key]."
  - "BASE_PATH isolation: the e2e step deliberately OMITS BASE_PATH so 'pnpm build && pnpm preview --port 4183' serves the build at root (page.goto('/') resolves). The Build step that produces the GH Pages artifact sets BASE_PATH=/${{ github.event.repository.name }} — auto-resolves to /michelle_ngo_three with no manual rename needed if the repo is ever forked/renamed. Cross-referenced in comments in both deploy.yml and playwright.config.ts."
  - "Playwright preview port shifted from default 4173 → 4183 to avoid collision with sibling _four's preview server during local A/B comparison work. CI uses fresh containers and is unaffected. Encoded in PORT constant in playwright.config.ts."
  - "Phase 1 e2e matrix is Chromium-only. webkit + mobile-safari (iPhone 14) projects are commented in playwright.config.ts as the Phase 3 expansion target (CONTEXT iOS Safari 16/17.0/17.1 load-bearing). Keeps CI runtime sub-2-minutes in Phase 1 where iOS-specific behavior isn't yet exercised."
  - "Single CI workflow (deploy.yml) covers PR-time checks AND deploy gates — explicitly resolved CONTEXT deferred item 'Phase 1 CI scope: separate PR-time CI workflow vs. all checks in deploy.yml'. Rationale: the four smoke gates already block merges via branch protection on main; a separate PR workflow is duplication. Lighthouse CI is explicitly Phase 7."
  - "Four-smoke-test gate composition resolved (CONTEXT deferred): (1) UNIT runed IO hook smoke = intersectionVisibility.svelte.test.ts (3 tests; counts as BOTH unit AND runed-IO-usage), (2) UNIT component = smoke-page.test.ts (render + click counter), (3) E2E = splash.spec.ts (page.goto('/') + 200 + main + title), (4) AXE = axe.spec.ts (zero violations). All four passing pre-checkpoint."

patterns-established:
  - "Pattern: .svelte.ts file extension is mandatory for any TS file that uses runes ($state, $derived, $effect, $effect.root, $props). Svelte 5.55+ refuses to compile runes in plain .ts. Companion test files MUST be .svelte.test.ts to allow $effect.root() invocations in describe/test blocks."
  - "Pattern: Every class wrapping a runed hook (useIntersectionObserver etc.) MUST have a JSDoc warning that the constructor calls $effect internally and therefore MUST be instantiated inside $effect.root(() => { ... }) OR inside a Svelte component <script> context. Tests follow the $effect.root pattern with a cleanup() invocation after assertions."
  - "Pattern: D-17 mechanical drift guard — for every convention that must hold across many files (like the mnp_three_ namespace), there should be a discrete CI step that greps src/ for violations and fails with ::error:: annotations citing offending lines. The grep should --exclude the canonical sources of truth. Template for future Trap-N guards in Phases 4/5/6/7."
  - "Pattern: Cross-step env isolation in GH Actions — when two consecutive steps need different env postures (here: e2e at root vs. artifact build at /michelle_ngo_three), the env block lives per-step, NOT at job level. Comments in both the workflow YAML AND the consumed config (playwright.config.ts) cross-reference each other so the deliberate split survives future edits."
  - "Pattern: For Phase 1 smoke gates, the goal is provability (the gate exists and runs) not coverage (the gate finds all bugs). Phase 3+ tests will be exhaustive; Phase 1's job is to wire the harness so Phase 3 can populate it without ceremony."

requirements-completed: [FOUND-02]

# Metrics
duration: 18 min (Tasks 1–3 wall-clock; Task 4 was user-driven verification, not code execution)
completed: 2026-05-25
---

# Phase 01 Plan 03: CI Deploy + Smoke Gates Summary

**GitHub Actions deploy workflow (push-to-main → build → 4 smoke gates → D-17 grep gate → upload-pages-artifact → deploy-pages) shipped with BASE_PATH=/michelle_ngo_three auto-resolved, live at https://wolfwdavid.github.io/michelle_ngo_three/ over HTTPS, with all four smoke-test gates green: unit (intersectionVisibility + smoke-page), e2e (splash via Playwright), axe (zero violations), and runed useIntersectionObserver hook exercised via IntersectionVisibility wrapper — plus mechanical D-17 enforcement that fails CI on any raw localStorage usage outside $lib/storage.ts.**

## Performance

- **Duration:** 18 min (Tasks 1–3 wall-clock execution)
- **Started:** 2026-05-25T14:58:02Z (Task 1 first commit)
- **Completed:** 2026-05-25T15:30Z (user approved Task 4 checkpoint)
- **Tasks:** 4 (3 code-bearing + 1 human-verify checkpoint)
- **Files created:** 9
- **Files modified:** 1 (vite.config.ts, additively)

## Accomplishments

- **GitHub Actions deploy pipeline live** at `.github/workflows/deploy.yml` — push-to-main triggers a 12-step run: checkout → Node 22 → pnpm 11.0.9 → install --frozen-lockfile → **D-17 grep gate** → lint → type-check → unit tests → Playwright browser install → e2e + axe → build with BASE_PATH=/michelle_ngo_three → upload-pages-artifact → deploy-pages. Concurrency-grouped on `pages` so overlapping pushes don't fight.
- **Live staging site reachable** at https://wolfwdavid.github.io/michelle_ngo_three/ over HTTPS (user-verified 2026-05-25). BASE_PATH applied to all asset and route URLs; robots.txt continues to serve the staging noindex posture (`User-agent: *` + `Disallow: /`).
- **Four SC#4 smoke gates green** before every deploy:
  1. UNIT (runed IO hook) — `src/lib/intersectionVisibility.svelte.test.ts` × 3 tests passing
  2. UNIT (Svelte 5 component) — `src/lib/smoke-page.test.ts` × 2 tests passing
  3. E2E (Playwright) — `tests/e2e/splash.spec.ts` × 1 test passing (200 + `<main>` + `/Michelle Ngo/` title)
  4. AXE — `tests/e2e/axe.spec.ts` × 1 test passing (zero WCAG 2a/2aa/21a/21aa/best-practice violations against `/`)
- **D-17 mechanical drift guard live** — CI grep step scans `src/` for `window.localStorage`, `localStorage.<method>`, or `localStorage[key]` outside `$lib/storage.ts` + its test. On match: emits `::error::` annotations citing offending lines and fails the workflow. Verified locally: zero matches today.
- **runed cinematic-layer dep exercised in production code** — `src/lib/intersectionVisibility.svelte.ts` wraps `useIntersectionObserver` in a rune-native class with a `$state`-backed `isVisible` getter. Phase 3 ReelStage replaces this; today it's the smoke-level proof that the dep + Svelte 5.55+ rune-scoping rules + the .svelte.ts file convention all hold under TS strict.
- **Cinematic-layer Svelte 5 testing harness wired** — vitest-setup-ui.ts loads jest-dom matchers + an inert IntersectionObserver mock; vite.config.ts gains `setupFiles` + `resolve.conditions: ['browser']` (without browser conditions, mount() throws `lifecycle_function_unavailable` on Svelte 5). vitest-globals.d.ts surfaces jest-dom matchers on Vitest's Assertion under TS strict via a narrower augmentation that sidesteps jest-dom's bundled Jest type reference.
- **CONTEXT deferred items resolved**: (a) "Phase 1 CI scope: separate PR-time workflow vs. all checks in deploy.yml" → single workflow with branch-protection gating; (b) "Concrete shape of the 4 smoke tests" → the four-test composition above.

## Task Commits

Each code task was committed atomically with `--no-verify` per orchestrator instruction (parallel-execution Wave 2 pattern):

1. **Task 1: wire vitest setup + runed IO hook + component smoke gates** — `9966f5f` (feat)
2. **Task 2: playwright config + splash e2e + axe smoke gates** — `6496806` (feat)
3. **Task 3: deploy workflow with D-17 grep gate + 4 smoke gates before deploy** — `e49d83a` (feat)
4. **Task 4: live deploy verification at https://wolfwdavid.github.io/michelle_ngo_three/** — no code changes (checkpoint task; user-approved 2026-05-25 after verifying the green CI run, the live splash, BASE_PATH-prefixed asset URLs, robots.txt staging noindex)

**Plan metadata:** captured in the final docs commit at orchestrator wrap.

## Live Deploy Verification Snapshot

User-confirmed 2026-05-25 ("approved"):

| Check | Result |
|-------|--------|
| GitHub Actions workflow green | PASS — all 12 steps showed green checks on the most recent run |
| https://wolfwdavid.github.io/michelle_ngo_three/ loads over HTTPS | PASS — lock icon, no cert warnings |
| Splash renders (D-01 wordmark from Plan 01-02, NOT blank/404) | PASS — `MICHELLE NGO` + `Filmmaker. Site coming soon.` on dark canvas |
| Asset URLs prefixed `/michelle_ngo_three/` (BASE_PATH applied) | PASS — view-source confirmed |
| `/robots.txt` returns `User-agent: *` + `Disallow: /` (staging noindex) | PASS |
| Mobile Safari sanity (optional) | PASS (user-reported) |

## Pre-Checkpoint Local Verification (Orchestrator Snapshot)

Re-verified by orchestrator post-wave before resuming continuation:

| Check | Result |
|-------|--------|
| Unit gates `pnpm test src/lib/intersectionVisibility.svelte.test.ts src/lib/smoke-page.test.ts` | 5/5 pass |
| E2E + axe `pnpm test:e2e` on Chromium | 2/2 pass (splash 200 + `<main>` + title regex; axe zero violations) |
| D-17 grep gate locally | PASS — no raw `localStorage` outside `src/lib/storage.ts` |
| `pnpm check` (525 files) | 0 errors, 0 warnings |
| `pnpm lint` | clean |
| `pnpm build` (clean static export) | ~4s, clean |

## D-17 Grep Gate Contract

Discrete step in `.github/workflows/deploy.yml` runs:

```bash
grep -rnE 'window\.localStorage|localStorage\.|localStorage\[' src/ \
  --include='*.ts' --include='*.svelte' --include='*.svelte.ts' \
  --exclude='storage.ts' --exclude='storage.test.ts'
```

On match: emits `::error::` annotations citing offending lines + the message "All localStorage access must go through the typed $lib/storage helper to enforce the mnp_three_ namespace (Trap D mitigation)." On no match: emits `D-17 grep gate passed — no raw localStorage usage outside the helper.`

The carve-out for `storage.ts` + `storage.test.ts` is necessary because Plan 01-02's storage tests legitimately seed `window.localStorage.setItem('mnp_three_*', ...)` to verify the prefix application. All other code must go through `import { storage } from '$lib/storage'`.

## Files Created/Modified

- `vitest-setup-ui.ts` — loads `@testing-library/jest-dom/vitest` matchers + an inert `IntersectionObserverMock` class assigned to `globalThis.IntersectionObserver` (jsdom doesn't ship one; cast through `unknown` to satisfy `noUncheckedIndexedAccess` + strict).
- `src/lib/intersectionVisibility.svelte.ts` — class wrapper around runed's `useIntersectionObserver`; constructor signature tightened to `(target: () => HTMLElement | null | undefined, options?: UseIntersectionObserverOptions)` per runed's narrower types (deviation Rule 1); `$state`-backed `#isVisible` private field; `isVisible` public getter; JSDoc mandates `$effect.root` scope at instantiation.
- `src/lib/intersectionVisibility.svelte.test.ts` — 3 tests: (1) class is defined + constructable, (2) constructs inside `$effect.root` and exposes `isVisible === false` initial, (3) accepts options + still exposes false initial. Every `new IntersectionVisibility(...)` lives inside an `$effect.root(() => { ... })` callback with `cleanup()` after assertions. Filename ends `.svelte.test.ts` (deviation Rule 1: Svelte 5.55+ refuses `$effect.root` in plain `.test.ts`).
- `src/lib/smoke-page.svelte` — minimal Svelte 5 runes component: `$props()` greeting, `$state(0)` count, `onclick` increment, `data-testid` hooks.
- `src/lib/smoke-page.test.ts` — 2 tests via `@testing-library/svelte`: renders greeting prop, button click increments counter. `afterEach(cleanup)` invoked explicitly because Vitest 4 + TLS with `globals: false` doesn't auto-cleanup (deviation Rule 1).
- `src/vitest-globals.d.ts` — module augmentation surfacing `@testing-library/jest-dom` matchers (`.toHaveTextContent` etc.) on Vitest's `Assertion` interface so `svelte-check` succeeds under TS strict (deviation Rule 3: jest-dom's bundled types pull in a Jest type reference that errors under `noImplicitAny`).
- `playwright.config.ts` — Chromium-only project for Phase 1 (webkit + iPhone 14 commented for Phase 3 REEL expansion); `webServer.command: 'pnpm build && pnpm preview --port 4183'`; `PORT = 4183` (deviation Rule 3: shifted from default 4173 to avoid sibling `_four` collision during local A/B work); explanatory comment block on the BASE_PATH omission cross-references `deploy.yml`.
- `tests/e2e/splash.spec.ts` — `page.goto('/')` → assert `response?.status() === 200` + `page.locator('main')` visible + `page.toHaveTitle(/Michelle Ngo/)`. Wordmark-agnostic so Plan 01-02 / 01-03 can land in any order (the wave 2 parallel execution constraint).
- `tests/e2e/axe.spec.ts` — `AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']).analyze()` → `expect(results.violations).toEqual([])`. Zero violations against Plan 01-02's D-01 splash.
- `.github/workflows/deploy.yml` — full workflow per the plan, with D-17 grep gate BEFORE lint/check/unit/e2e; build env block sets `BASE_PATH: /${{ github.event.repository.name }}` + `PUBLIC_SITE_URL: https://wolfwdavid.github.io/michelle_ngo_three`; e2e step deliberately omits BASE_PATH (comment cross-references playwright.config.ts).
- `vite.config.ts` — **additive** edit only: `setupFiles: ['./vitest-setup-ui.ts']` added to the existing `test` block; new top-level `resolve: { conditions: ['browser'] }` block added. Plan 01-01's `plugins: [tailwindcss(), sveltekit()]` line preserved verbatim.

## Decisions Made

All decisions either followed the plan's pre-baked guidance or resolved CONTEXT deferred items as documented above. The two genuine engineering choices made during execution:

- **Playwright port 4183 vs. 4173** — Resolved a local-dev collision with sibling `_four`'s preview server during A/B comparison work. CI is unaffected (fresh containers per run). Encoded as a `PORT` constant in `playwright.config.ts` so future bumps are one-line.
- **Type augmentation strategy for jest-dom under TS strict** — chose a narrower Vitest-Assertion-only augmentation (`src/vitest-globals.d.ts`) over importing `@testing-library/jest-dom`'s bundled types globally, because the bundled types pull in a Jest type reference that errors under `noImplicitAny`. The narrower augmentation is the documented Vitest-only fix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test file renamed `intersectionVisibility.test.ts` → `intersectionVisibility.svelte.test.ts`**
- **Found during:** Task 1
- **Issue:** Svelte 5.55+ refuses to allow `$effect.root` invocations in plain `.test.ts` files — runes only compile in `.svelte` components or `.svelte.{js,ts}` files. The plan-stated filename `intersectionVisibility.test.ts` couldn't host the `$effect.root(() => { new IntersectionVisibility(...) })` test pattern that the same plan mandates.
- **Fix:** Renamed test file to `intersectionVisibility.svelte.test.ts`. The Vite glob `src/**/*.{test,spec}.{js,ts}` still picks it up because `.svelte.test.ts` ends in `.test.ts`. Updated test verify command path.
- **Files modified:** `src/lib/intersectionVisibility.svelte.test.ts` (created at corrected path)
- **Verification:** `pnpm test src/lib/intersectionVisibility.svelte.test.ts` exits 0 (3/3 tests pass).
- **Committed in:** `9966f5f`

**2. [Rule 1 - Bug] Added `afterEach(cleanup)` to `smoke-page.test.ts`**
- **Found during:** Task 1
- **Issue:** Vitest 4 + `@testing-library/svelte` 5.3.1 with `globals: false` (per Plan 01-01's vite.config.ts test block) does NOT auto-cleanup mounted components between tests. The second test's `screen.getByTestId('counter')` was finding two leftover buttons (one from the previous render still in jsdom) and throwing "Found multiple elements" before the assertion could run.
- **Fix:** Added explicit `import { afterEach } from 'vitest'; import { cleanup } from '@testing-library/svelte'; afterEach(cleanup);` at the top of the test file.
- **Files modified:** `src/lib/smoke-page.test.ts`
- **Verification:** `pnpm test src/lib/smoke-page.test.ts` exits 0 (2/2 tests pass).
- **Committed in:** `9966f5f`

**3. [Rule 1 - Bug] Tightened `IntersectionVisibility` constructor types**
- **Found during:** Task 1
- **Issue:** Plan's stated constructor signature `(target: () => Element | null | undefined, options?: IntersectionObserverInit)` was rejected by runed's narrower `MaybeGetter<MaybeElementGetter<HTMLElement>>` and `UseIntersectionObserverOptions` types under TS strict — `Element` is a wider DOM type than runed accepts, and the standard DOM `IntersectionObserverInit` is wider than runed's options shape.
- **Fix:** Changed constructor to `(target: () => HTMLElement | null | undefined, options?: UseIntersectionObserverOptions)` matching runed's exported types verbatim.
- **Files modified:** `src/lib/intersectionVisibility.svelte.ts`
- **Verification:** `pnpm check` exits 0 (525 files type-checked, no errors).
- **Committed in:** `9966f5f`

**4. [Rule 3 - Blocking] Added `src/vitest-globals.d.ts` module augmentation**
- **Found during:** Task 1
- **Issue:** `@testing-library/jest-dom/vitest` import in `vitest-setup-ui.ts` brought jest-dom's bundled types into the project, which transitively reference Jest's `@types/jest` — causing `svelte-check` to fail with `Cannot find type definition file for 'jest'` under TS strict (`noImplicitAny`). Without the augmentation, `svelte-check` would have failed and the deploy workflow's `pnpm check` step would have blocked Plan 01-02's parallel commit too.
- **Fix:** Created `src/vitest-globals.d.ts` with a narrower module augmentation that surfaces jest-dom matchers on Vitest's `Assertion` interface only — bypasses the broken Jest type reference. This is the documented Vitest-only fix (https://github.com/testing-library/jest-dom/issues/527).
- **Files modified:** `src/vitest-globals.d.ts` (created)
- **Verification:** `pnpm check` exits 0; `expect(button).toHaveTextContent('clicked 0')` type-checks correctly.
- **Committed in:** `9966f5f`

**5. [Rule 3 - Blocking] Playwright PORT changed from 4173 → 4183**
- **Found during:** Task 2
- **Issue:** Default Vite preview port 4173 was in use by sibling `_four`'s preview server during local A/B comparison work. `pnpm test:e2e` was failing with `EADDRINUSE` on the webServer startup; Playwright would not retry.
- **Fix:** Shifted preview port to 4183 (encoded as a `PORT` constant in playwright.config.ts). CI uses fresh containers and is unaffected.
- **Files modified:** `playwright.config.ts`
- **Verification:** `pnpm test:e2e` exits 0 on Chromium with both sibling preview servers running simultaneously.
- **Committed in:** `6496806`

---

**Total deviations:** 5 auto-fixed (3 bugs, 2 blocking). All necessary for correctness under Svelte 5.55+ rune-scoping rules, Vitest 4 cleanup semantics, runed's narrower types, jest-dom's TS-strict type leak, and local A/B port conflict. **Impact on plan:** Zero scope creep; the underlying SC #4 + D-17 + BASE_PATH contracts are all satisfied. The test-file rename is a one-character extension change; the type narrowing is invisible to consumers; the port shift is a local-only constant; the jest-dom augmentation is a 28-line type-only file. The plan's intended behavior is intact.

## Authentication Gates

None encountered. GitHub Actions runs under the auto-provisioned `GITHUB_TOKEN` and `actions/deploy-pages@v4`'s OIDC token (already enabled in repo settings as a one-time setup outside this plan's scope). No external service credentials were required.

## Issues Encountered

- **iframe-lifecycle dep choice not exercised here.** This plan only smoke-tests `runed`'s `useIntersectionObserver` — the load-bearing 4-state iframe lifecycle (REEL-06) is Phase 3 work. The smoke test proves the rune-cleanup ergonomics + the .svelte.ts file extension contract hold; it does not validate real IntersectionObserver behavior (the jsdom mock is inert by design). Phase 3 will exercise real IO behavior under Playwright on Chromium + WebKit + iPhone 14.
- **One-off Phase 1 wrapper class deletable in Phase 3.** `src/lib/intersectionVisibility.svelte.ts` exists only to satisfy SC #4's "runed IO hook is wired" gate. Phase 3's `ReelStage` will subsume it; the wrapper class can be deleted in 03-01 without affecting any consumer (nothing imports it except its own test).

## User Setup Required

None — GitHub Pages was previously enabled for the repo (Settings → Pages → Source → "GitHub Actions") as a one-time setup before this plan ran. No external service configuration required by this plan.

## Next Phase Readiness

- **Phase 1 is complete.** All three plans (01-01 scaffold, 01-02 tokens + storage + splash, 01-03 deploy + smoke gates) have green SUMMARYs. FOUND-01 and FOUND-02 are both satisfied. FOUND-03 (production cutover infrastructure for `michellengo.net`) is deferred to Phase 7 per ROADMAP.
- **Phase 2 (Data Layer) can begin** with the green CI workflow as its baseline. The Zod schema + Vite build-fail plugin + cross-repo diff CI check that Phase 2 adds will run alongside the four smoke gates and the D-17 grep gate — Phase 2 must keep all gates green.
- **Phase 3 (Reel System Core) test harness already wired.** `playwright.config.ts` has webkit + mobile-safari (iPhone 14) projects commented in as the Phase 3 expansion target. The cinematic-layer dep pattern (rune-cleanup + .svelte.ts files + $effect.root in tests) is established and documented in the IntersectionVisibility JSDoc as the template for ReelStage's IntersectionObserver wiring.
- **D-17 grep gate is the template for future Trap-N mechanical drift guards.** When Phases 4/5/6/7 add new conventions that must hold across many files (e.g., POL-03's `100svh` not `100vh`/`100dvh` rule), the same `grep | --exclude='canonical-source' | ::error::` step pattern can be copied verbatim. The first one is the hardest.
- **Pre-existing blockers** (REEL-04 Chromium-only ambiguity, EU GDPR posture, A/B traffic-split mechanism, REQUIREMENTS.md count drift) carry forward unchanged from Phase 1 entry — none of them are blockers for Phase 2 entry; all three are pre-Phase-7 blockers.

## Self-Check: PASSED

All 10 expected files exist on disk:
- `vitest-setup-ui.ts` FOUND
- `src/lib/intersectionVisibility.svelte.ts` FOUND
- `src/lib/intersectionVisibility.svelte.test.ts` FOUND
- `src/lib/smoke-page.svelte` FOUND
- `src/lib/smoke-page.test.ts` FOUND
- `src/vitest-globals.d.ts` FOUND
- `playwright.config.ts` FOUND
- `tests/e2e/splash.spec.ts` FOUND
- `tests/e2e/axe.spec.ts` FOUND
- `.github/workflows/deploy.yml` FOUND

All 3 task commits exist in git history:
- `9966f5f` FOUND (Task 1)
- `6496806` FOUND (Task 2)
- `e49d83a` FOUND (Task 3)

Task 4 was a human-verify checkpoint; verification was the user's "approved" response (no commit expected for the checkpoint itself; the deploy workflow it verified is at `.github/workflows/deploy.yml` committed in `e49d83a`).

SUMMARY.md present at `.planning/phases/01-foundation/01-03-SUMMARY.md`.

---

*Phase: 01-foundation*
*Completed: 2026-05-25*
