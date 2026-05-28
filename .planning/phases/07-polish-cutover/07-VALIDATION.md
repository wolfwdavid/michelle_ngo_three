---
phase: 7
slug: polish-cutover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-28
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.5 (unit/component, data+ui project split) + @playwright/test 1.60 (e2e) + @lhci/cli (perf) + @axe-core/playwright (a11y) |
| **Config file** | `vite.config.ts` (vitest projects), `playwright.config.ts`, `lighthouserc.*` (Wave 0 ports/creates), `.github/workflows/deploy.yml` (CI gates) |
| **Quick run command** | `pnpm check && pnpm test:unit` |
| **Full suite command** | `pnpm check && pnpm test:unit && pnpm test:e2e` |
| **Estimated runtime** | ~120 seconds (unit ~15s, e2e incl. axe ~90s, lhci separate) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm check && pnpm test:unit`
- **After every plan wave:** Run full suite `pnpm check && pnpm test:unit && pnpm test:e2e`
- **Before `/gsd:verify-work`:** Full suite green + Lighthouse JSON committed + QA-matrix doc present
- **Max feedback latency:** ~120 seconds

---

## Per-Task Verification Map

> Planner fills this with concrete task IDs during planning. The requirement→method map below (from 07-RESEARCH.md §Validation Architecture) is the contract each task's `<acceptance_criteria>` must honor.

| Requirement | Success Criterion | Validation Method | Automated? | Proving Artifact / Command |
|-------------|-------------------|-------------------|------------|----------------------------|
| POL-01 | Per-page title + meta description; OG/Twitter; Person JSON-LD `/about`; VideoObject JSON-LD per `/watch/[id]`; sitemap 70 URLs | grep head tags + prerender-coverage count assert + schema validation | mostly auto | `test-prerender-coverage.mjs` asserts sitemap URL count == 70; grep `<meta name="description"` present on all 6 static + category routes; JSON-LD audit script validates 56 VideoObject + 1 Person |
| POL-02 | Lighthouse CI gates `/` LCP < 2.5s simulated 4G (warn → blocking) | lhci autorun numeric threshold | auto | `lhci autorun` asserts `largest-contentful-paint` numeric < 2500ms; report committed to `07-LIGHTHOUSE.json` |
| POL-03 | Poster→iframe swap CLS ≤ 0; every scroll-snap section uses `100svh` | grep assertion | auto | `grep -rc '100svh'` in reel section components > 0 AND `grep -rc '100vh\|100dvh'` in snap sections == 0; CLS verified in Lighthouse JSON (`cumulative-layout-shift` ≈ 0) |
| POL-04 | axe-core CI on every PR (7 routes); real-device QA matrix signed off | axe e2e scan (auto) + manual QA-matrix sign-off | mixed | `tests/e2e/axe.spec.ts` scans all 7 routes, 0 violations; `07-QA-MATRIX.md` go/no-go signed (manual) |
| POL-05 | localStorage keys namespaced `mnp_three_*`; OG dimensions byte-identical to `_four` | grep gate (Trap D, DONE) + dimension diff (Trap B) | auto | D-17 grep gate fails on raw `localStorage`; OG-dimension probe vs `__four/` asset asserts 1200×630 + comparable filesize |
| FOUND-03 | Cutover infra ready, reviewable, reversible, A/B-winner-gated | file-exists + manual runbook review | mixed | `static/CNAME` == `michellengo.net`; `deploy-production.yml` present (no BASE_PATH); atomic noindex-flip commit prepared (not landed); 9-step Launch Runbook reviewable (manual) |
| Trap A | videos.json drift | CI gate (DONE) | auto | `drift-check` job byte-compares vs `__four/` pinned SHA — verify still green |
| Trap C | sitemap/canonical: both siblings noindex until winner | grep/policy gate | auto | `static/robots.txt` `Disallow: /` + layout `noindex` meta present pre-cutover; flip is winner-only |
| Trap E | divergent entry routes | CI route-manifest diff (NEW) | auto | route-manifest diff job enumerates `_three` prerendered routes, compares vs `_four` pinned list, fails on divergence |

*Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/test-prerender-coverage.mjs` — port from `_four`; pins sitemap 70-URL count assertion (D-14). `_three` has only `check-embeds.ts` today.
- [ ] `lighthouserc.*` config — port/create lhci autorun config with LCP < 2500ms numeric assertion (warning-only initial posture).
- [ ] JSON-LD audit harness — validates all 56 VideoObject + Person payloads against schema.org shapes (D-15 audit-and-close).
- [ ] axe e2e harden — extend `tests/e2e/axe.spec.ts` from `/`-only to all 7 routes.

*Existing infrastructure (vitest data/ui split, playwright e2e, axe wired on `/`, drift-check job, D-17 grep gate) covers the rest.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BrowserStack 7-OS × 4-pillar reel matrix | POL-04 / D-06 | Cross-origin postMessage + sticky-activation non-determinism only real devices resolve | Run 28-cell matrix (iOS Safari 16/17.0/17.1/17.2+, Chrome Android, Firefox desktop, Safari macOS); all green before cutover |
| iPhone 5-min thermal test | POL-04 / D-06 | Thermal throttling not simulable | Physical iPhone, 5-min reel scroll, temp delta ≤ 8% |
| 7 Phase 5 surface UAT items | POL-04 / D-07 | Real Vimeo embed + sticky-activation behavior | Hero attach/play/unmount, watch chrome-fade, HERO-03 sound-on, WATCH-05 back-nav + cross-route rail restore, axe staging spot-check |
| 21-cell responsive sweep | POL-04 / D-08 | Visual layout judgment | 3 breakpoints × 7 routes, DevTools emulation + real-iPhone iOS spot-check → numbered punch list → fix all → ship |
| A/B winner declaration | FOUND-03 / D-09 | No analytics (out of scope); manual side-by-side | User + Michelle review both staging URLs; user declares winner — gates DNS flip |
| Launch Runbook end-to-end review | FOUND-03 / D-11 | Reversibility + sequencing judgment | 9-step runbook reviewable; verify-then-flip with DNS-revert rollback |
| Real cinematic OG/favicon asset authoring | POL-01 / D-13 | Visual design (cinematic-dark composition) | Author 1200×630 OG + multi-size favicon set; checkpoint candidate |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (prerender-coverage script, lhci config, JSON-LD audit, axe harden)
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
