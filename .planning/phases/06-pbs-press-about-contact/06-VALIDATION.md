---
phase: 6
slug: pbs-press-about-contact
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-27
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Sourced from `06-RESEARCH.md § Validation Architecture`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 (unit + component, two-project split: `data` node + `ui` jsdom) + Playwright 1.60.0 (e2e on chromium + webkit + firefox) + `@axe-core/playwright` 4.11.3 (a11y) |
| **Config file** | `vite.config.ts` (Vitest projects); `playwright.config.ts` (e2e matrix); existing infrastructure — zero new framework setup |
| **Quick run command** | `pnpm test` (vitest run, `passWithNoTests`) |
| **Full suite command** | `pnpm test && pnpm test:e2e && pnpm check && pnpm lint` |
| **Estimated runtime** | ~10s quick (vitest data+ui); ~3min full (incl. Playwright cold start across 3 browsers) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test && pnpm test:e2e && pnpm check && pnpm lint`
- **Before `/gsd:verify-work`:** Full suite must be green; axe-core scans on `/about`, `/contact`, `/press`, `/pbs-american-portrait/` must pass
- **Max feedback latency:** 10 seconds (quick) / ~3 minutes (full)

---

## Per-Requirement Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| PBS-01 | Section zero verbatim blockquote + sections 1–18 render | route + e2e | `pnpm test src/routes/pbs-american-portrait/page.test.ts` + `pnpm test:e2e tests/e2e/pbs-landing.spec.ts` | ❌ W0 | ⬜ pending |
| PBS-02 | 15/18 sections render "See on PBS →" badge; 3 IDs lack badge | unit + route | `pnpm test src/routes/pbs-american-portrait/_pbsCollectionUrl.test.ts` + `pnpm test src/routes/pbs-american-portrait/page.test.ts` | ❌ W0 | ⬜ pending |
| PBS-03 | TopNav PBS active on both routes | e2e (existing) | `pnpm test:e2e tests/e2e/wayfinding-layout.spec.ts` | ✅ Phase 4 | ⬜ pending |
| PRES-01 | 13 scroll-snap sections in prestige order (poster + wordmark + title + ▷ Watch) | unit + route + e2e | `pnpm test src/routes/press/_pressCredits.test.ts` + `pnpm test src/routes/press/page.test.ts` + `pnpm test:e2e tests/e2e/press.spec.ts` | ❌ W0 | ⬜ pending |
| ABT-01 | Verbatim bio + ambient hero + reduced-motion poster + ContactBlock below | route + e2e | `pnpm test src/routes/about/page.test.ts` + `pnpm test:e2e tests/e2e/about.spec.ts` | ❌ W0 | ⬜ pending |
| CONT-01 | ContactBlock on /contact + /about + Footer; 5 channels everywhere | unit + route + e2e | `pnpm test src/lib/components/ContactBlock.test.ts` + `pnpm test src/lib/components/Footer.test.ts` + `pnpm test:e2e tests/e2e/contact.spec.ts` | ❌ W0 | ⬜ pending |
| CONT-02 | IMDb/LinkedIn URLs contain fallback domains (passes for fallback + personalized) | unit | `pnpm test src/lib/components/ContactBlock.test.ts` (substring assertions) | ❌ W0 | ⬜ pending |
| CONT-03 | Site-wide Footer mirrors TopNav; 5 channels via ContactBlock; 8 categories; 4 site links | unit + e2e | `pnpm test src/lib/components/Footer.test.ts` + `pnpm test:e2e tests/e2e/contact.spec.ts` (Footer presence on every route) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Verbatim-Reuse Validation Strategy (Nyquist core)

CONTEXT pins content reuse from `_four` for PBS blockquote (D-17), bio default seed (D-19), prestige order (D-18), and channel literals (D-20). Strategy to prove byte-equality without manual diff:

**Strategy (1) — Test-level literal assertions (PRIMARY for Phase 6):**
Test files hardcode expected strings. The test IS the lock. Any drift in the route file → test red.

Example assertions:
```ts
// ContactBlock.test.ts
expect(emailLink?.textContent?.trim()).toBe('mynogo@gmail.com');
expect(phoneLink?.textContent?.trim()).toBe('(917) 566-1976');
expect(imdb?.getAttribute('href') ?? '').toContain('imdb.com'); // robust to fallback ↔ personalized swap

// pbs-american-portrait/page.test.ts
expect(blockquoteEl.textContent.trim()).toContain('Whether it's joy or sorrow');
expect(blockquoteEl.textContent.trim()).toContain('chance for everyday Americans to be heard.');

// press/_pressCredits.test.ts
expect(result.map((r) => r.network)).toEqual([
  'HBO Max', 'HBO', 'PBS', 'ABC News', 'U2', 'Amazon News',
  'Music Box Films', 'Monument Releasing', 'Cargo Film & Releasing',
  'AZPM', 'HBODocs', 'GrasshalmClips', 'Lenny Cooke (Movie)',
]);
expect(result).toHaveLength(13);
```

**Strategy (2) — Cross-repo byte-diff in CI:** Deferred to Phase 7 cross-repo CI hardening (out of Phase 6 scope per A/B integrity tracking).

**Strategy (3) — Visual regression snapshots:** REJECTED for Phase 6 — design language diverges from `_four`; pixel-equality would be a false-positive nightmare.

---

## Wave 0 Requirements

**New test files Phase 6 ships (all gating; no existing coverage):**

- [ ] `src/lib/components/ContactBlock.test.ts` — CONT-01, CONT-02 (channel order, mailto/tel hrefs, target=_blank rel=noopener, fallback URL contains-substring assertions). **Copy `_four`'s test verbatim** — 102 lines, ~4 describe / 7 it blocks.
- [ ] `src/lib/components/Footer.test.ts` — CONT-03 (3-column grid at lg breakpoint, ContactBlock in column 1, 8 category links in column 2 with PBS retarget href, 4 site links in column 3, copyright bottom strip).
- [ ] `src/routes/pbs-american-portrait/_pbsCollectionUrl.test.ts` — PBS-02 (regex extraction; 18 real-data extractions verifying 15 yes / 3 no; trailing punctuation strip). Copy `_four/.../_pbsCollectionUrl.test.ts` verbatim.
- [ ] `src/routes/pbs-american-portrait/page.test.ts` — PBS-01, PBS-02 (section zero renders + 18 sections render + 15/18 PBS badges + blockquote text matches verbatim).
- [ ] `src/routes/press/_pressCredits.test.ts` — PRES-01 (13 records returned, prestige order, no Michelle uploads, flat shape `{ network, video }`).
- [ ] `src/routes/press/page.test.ts` — PRES-01 (13 scroll-snap sections render in order; each has network wordmark + title + ▷ Watch CTA).
- [ ] `src/routes/about/page.test.ts` — ABT-01 (ambient hero renders, bio paragraph present, ContactBlock below bio, reduced-motion fallback assertable via `motion.svelte.ts` mock).
- [ ] `src/routes/contact/page.test.ts` — CONT-01 (wordmark top + ContactBlock centered + scroll-cue + Footer below splash).
- [ ] `tests/e2e/pbs-landing.spec.ts` — e2e PBS-01/02/03 on 3 browsers + axe a11y.
- [ ] `tests/e2e/press.spec.ts` — e2e PRES-01 (13 scroll-snap sections + prestige order + chrome-fade extension) + axe.
- [ ] `tests/e2e/about.spec.ts` — e2e ABT-01 (two-act layout + ambient fallback under reduced-motion + ContactBlock present) + axe.
- [ ] `tests/e2e/contact.spec.ts` — e2e CONT-01/02/03 (ContactBlock on /contact + /about + Footer; channel-homepage fallback URLs verified) + axe.

**Existing infrastructure (already configured — zero install work):**
- ✅ Vitest 4.1.5 two-project split (`data` + `ui`) in `vite.config.ts`
- ✅ Playwright 1.60.0 + 3-browser matrix in `playwright.config.ts`
- ✅ `@axe-core/playwright` 4.11.3 used in `tests/e2e/axe.spec.ts`
- ✅ jsdom 29.1.1 + `vitest-setup-ui.ts` configured for component mount/unmount
- ✅ Svelte 5 + Testing Library 5.3.1 pattern established (see `src/lib/components/HeroAmbient.svelte.test.ts`)
- ✅ Component test pattern: raw `mount`/`unmount` from 'svelte' (matches `_four` shape; see `_three/src/lib/components/PreviewLoop.test.ts`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bio approval gate (D-19 user sign-off) | ABT-01 | Plan-time content approval — not an executable test | `06-03-PLAN.md` surfaces verbatim bio seed inside `<approved>…</approved>` element; user must read and approve before execution begins. Default expectation: approve `_four` shipped bio verbatim. |
| Visual cinematic fidelity (atmosphere, pacing, "feels like cinema") | All | UI-SPEC §"6-pillar" review is subjective | Run `pnpm dev` and walk each route: `/pbs-american-portrait/`, `/press`, `/about`, `/contact`. Check chrome fade, scroll-snap feel, ambient hero loop on `/about`, reduced-motion degradation (`prefers-reduced-motion: reduce` via devtools). |
| `_four` vs `_three` A/B side-by-side parity at content layer | PBS-01, PRES-01, ABT-01, CONT-01 | Cross-repo human comparison | Open `michelle_ngo_four` and `michelle_ngo_three` in two tabs; compare PBS blockquote text, bio paragraph, 13 press credits, 5 contact channels char-by-char. Test-level literal assertions catch drift automatically; this is the human safety net. |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies declared
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all 12 missing test files listed above
- [ ] No watch-mode flags (vitest `run`, not `vitest`; playwright single-shot)
- [ ] Feedback latency < 10s quick / < 3min full
- [ ] `nyquist_compliant: true` set in frontmatter after planner satisfies all task→test mappings

**Approval:** pending
