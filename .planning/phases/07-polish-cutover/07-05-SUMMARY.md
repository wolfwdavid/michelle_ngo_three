---
phase: 07-polish-cutover
plan: 05
subsystem: infra
tags: [github-pages, cutover, dns, cname, deploy, seo, noindex, runbook]

# Dependency graph
requires:
  - phase: 07-01
    provides: sitemap.xml endpoint + absolute https://michellengo.net host + POL-01 JSON-LD/description audit
  - phase: 07-04
    provides: 5 CI trap gates + Lighthouse warn-posture LCP job (warn->error flip carried here)
provides:
  - "static/CNAME (=michellengo.net) baked into every build artifact"
  - "deploy-production.yml — manual-dispatch apex deploy (BASE_PATH='', Verify-CNAME guard, shared concurrency)"
  - "07-QA-MATRIX.md — single consolidated go/no-go cutover gate (D-05)"
  - "9-step Launch Runbook (in this SUMMARY) — gated, reversible, DNS-revert rollback"
  - "D-12 atomic noindex->index flip documented as ONE prepared commit, NOT landed (winner-only)"
affects: [cutover, michellengo.net, A/B-winner-declaration, UAT-device-QA]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Stop-at-infrastructure: Phase 7 delivers cutover READINESS; the live DNS flip is the user's cutover-day action, hard-gated on D-09 (A/B winner) + D-06 (GREEN BrowserStack matrix)"
    - "Manual-dispatch production workflow shares concurrency.group: pages with staging deploy.yml so they can never race"
    - "D-12 one-way-door: noindex removal + robots flip is ONE atomic commit, the LAST commit before DNS, never split, never landed during the A/B"

key-files:
  created:
    - static/CNAME
    - .github/workflows/deploy-production.yml
    - .planning/phases/07-polish-cutover/07-QA-MATRIX.md
    - .planning/phases/07-polish-cutover/07-05-SUMMARY.md
  modified: []

key-decisions:
  - "FOUND-03 satisfied as stop-at-infrastructure: CNAME + manual-dispatch deploy + staged-but-unlanded D-12 flip + 9-step reversible runbook + 07-QA-MATRIX go/no-go gate — ready and reversible, fires only on the user's A/B-winner declaration"
  - "POL-04 axe-core CI half done (07-03/07-04); the manual real-device QA matrix sign-off is DEFERRED to UAT and tracked in 07-QA-MATRIX.md — NOT claimed complete here"
  - "D-12 atomic noindex->index flip prepared as ONE commit in the runbook but deliberately NOT landed — winner-only, last commit before the DNS swap (Pitfall 6)"

patterns-established:
  - "Launch Runbook lives in the plan SUMMARY (the runbook IS the deliverable for the human-action cutover steps), mirroring _four's 07-05"

requirements-completed: [FOUND-03]  # POL-04 left PARTIAL/DEFERRED — see Requirement Honesty Note

# Metrics
duration: 12min
completed: 2026-05-29
---

# Phase 7 Plan 05: Production Cutover Infrastructure Summary

**Apex-domain cutover staged and reversible — `static/CNAME`, a manual-dispatch `deploy-production.yml` (BASE_PATH='', Verify-CNAME guard), the consolidated `07-QA-MATRIX.md` go/no-go gate, and a 9-step DNS-revert-reversible Launch Runbook — with the D-12 noindex->index flip prepared as ONE commit but NOT landed (winner-only).**

## Performance

- **Duration:** 12 min (incl. continuation finalization)
- **Started:** 2026-05-29 (Tasks 1-2 prior session)
- **Completed:** 2026-05-29T00:00:00Z
- **Tasks:** 3 (Tasks 1-2 auto; Task 3 human-verify checkpoint — APPROVED)
- **Files modified:** 3 created + this SUMMARY

## Accomplishments

- **Task 1 — apex cutover entrypoint staged.** `static/CNAME` (one line `michellengo.net`, ships into every `build/` artifact via adapter-static) + `.github/workflows/deploy-production.yml` (manual-dispatch only, `BASE_PATH=''`, `PUBLIC_SITE_URL=https://michellengo.net`, Verify-CNAME-in-artifact guard, shared `concurrency.group: pages` with staging). Staging `deploy.yml` left UNTOUCHED.
- **Task 2 — single go/no-go gate.** `07-QA-MATRIX.md` consolidates the Phase 3 reel matrix (28-cell BrowserStack 7-OS x 4-pillar + escalation Branch A/B), the iPhone 5-min thermal test, the 7 Phase 5 surface UAT items, the 21-cell responsive sweep, and the pre-cutover checklist (CONT-02, Lighthouse warn->error blocking flip, 5 traps, A/B-winner gate). It supersedes `03-HUMAN-UAT.md` + `05-HUMAN-UAT.md` (D-05).
- **Task 3 (human-verify checkpoint) — APPROVED.** The user reviewed the Launch Runbook + staged-flip + winner-gate and approved the terminal stop-at-infrastructure state ("approved — cutover-ready, stop at infrastructure"). The 9-step runbook is reproduced verbatim below.

## Task Commits

1. **Task 1: static/CNAME + deploy-production.yml** — `10ac679` (feat) — "stage apex CNAME + manual-dispatch production deploy (FOUND-03)"
2. **Task 2: 07-QA-MATRIX.md go/no-go gate** — `fe630e0` (docs) — "add consolidated go/no-go cutover gate 07-QA-MATRIX.md (POL-04, D-05)"
3. **Task 3: human-verify checkpoint** — no source files change (review gate; D-12 flip deliberately NOT landed) — APPROVED

**Plan metadata:** (this SUMMARY + STATE + ROADMAP + REQUIREMENTS) — see final commit.

## Files Created/Modified

- `static/CNAME` — GitHub Pages apex-domain assertion (`michellengo.net`), copied into `build/CNAME` on every build.
- `.github/workflows/deploy-production.yml` — manual-dispatch (`workflow_dispatch:` only) apex deploy: BASE_PATH='', Verify-CNAME guard, shared `concurrency.group: pages`, upload-pages-artifact -> deploy-pages.
- `.planning/phases/07-polish-cutover/07-QA-MATRIX.md` — the single consolidated go/no-go cutover gate (status: pending).

## Four Hard Invariants — Re-Confirmed at Finalization

All four cutover-safety invariants were re-verified after the checkpoint approval and STILL HOLD (no cutover fired, nothing indexable, production never auto-deploys):

1. **noindex STILL present.** `grep -c noindex src/routes/+layout.svelte` = **1** (line 52: `<meta name="robots" content="noindex, nofollow" />`). `static/robots.txt` still reads exactly:
   ```
   User-agent: *
   Disallow: /
   ```
   (`grep -c "Disallow: /" static/robots.txt` = 1). The D-12 flip is NOT landed.
2. **deploy-production.yml `on:` block is workflow_dispatch-only.** The single top-level `on:` key (line 10) has exactly one child, `workflow_dispatch:` (line 11). There is NO `push:` and NO `pull_request:` trigger — the only references to those are in the explanatory comment (lines 3-9) documenting their deliberate absence. Production can never auto-fire on a push.
3. **static/CNAME == michellengo.net.** Exact one-line content `michellengo.net` (+ trailing newline). Ships into `build/CNAME` and is asserted by the workflow's Verify-CNAME guard.
4. **No cutover fired.** No git tags; staging `deploy.yml` unchanged (`BASE_PATH=/${{ github.event.repository.name }}` intact); DNS still points to WordPress.com; the D-12 atomic flip is staged-only. Phase 7 delivers READINESS only.

## Launch Runbook (verbatim, user-approved)

> Reproduced exactly as reviewed and approved by the user at the Task 3 checkpoint. Do not edit.

---
Repo: `wolfwdavid/michelle_ngo_three`; staging stays at `BASE_PATH=/michelle_ngo_three`. Execute on cutover day — each step is gated; do NOT proceed past a failed step. Est. 60–120 min including the 15–60 min cert wait.

Pre-Flight (anytime before cutover):
1. `git push origin main` — land commits 10ac679 (CNAME + deploy-production.yml), fe630e0 (07-QA-MATRIX), plus the plan-metadata commit on the remote.
2. Confirm "Deploy to GitHub Pages (production / apex)" appears at https://github.com/wolfwdavid/michelle_ngo_three/actions.

Step 1 — Trigger production build (~5 min): Actions → "Deploy to GitHub Pages (production / apex)" → Run workflow → branch main. Wait for green; expand "Verify CNAME in build artifact" → confirm build/CNAME content: michellengo.net. If it fails or CNAME is wrong, STOP.

Step 2 — Add custom domain (~2 min): …/settings/pages → Custom domain → michellengo.net → Save. A yellow "DNS check unsuccessful" is NORMAL (DNS still points to WordPress.com).

Step 3 — Wait for cert provisioning (15–60 min, polling): Refresh Pages settings every 5–10 min until the yellow icon flips green (Let's Encrypt cert lands) and "Enforce HTTPS" becomes selectable. If stuck past 2 h, remove + re-save the custom domain to retry the ACME challenge.

Step 4 — Enable Enforce HTTPS (~10 sec): Check "Enforce HTTPS" in Pages settings.

Step 5 — Pre-DNS-flip verification via curl --resolve (~5 min): Prove GH Pages serves the apex BEFORE the DNS swap. GH Pages apex anycast IPs: 185.199.108.153 / .109.153 / .110.153 / .111.153.
  curl --resolve michellengo.net:443:185.199.108.153 https://michellengo.net/ -I        # expect HTTP/2 200, server: GitHub.com
  curl --resolve michellengo.net:443:185.199.108.153 https://michellengo.net/ -s -o /tmp/apex-home.html
  grep -c "favicon-192.png" /tmp/apex-home.html   # expect >=1
  grep -c "Michelle Ngo"   /tmp/apex-home.html    # expect >=1
  grep -c "wp-content"     /tmp/apex-home.html    # expect 0 (MUST be 0)
  grep -c "noindex"        /tmp/apex-home.html    # expect >=1 (noindex STILL in place pre-Step-6)
  curl --resolve michellengo.net:443:185.199.108.153 https://michellengo.net/watch/264677021/ -s | grep -c "VideoObject"  # expect >=1
  curl --resolve michellengo.net:443:185.199.108.153 https://michellengo.net/sitemap.xml -s | grep -c "<url>"            # expect >=70
If HTTP/2 404, non-GitHub server, or wp-content > 0 → STOP, re-trigger Step 1, re-verify.

Step 6 — Atomic noindex+robots flip (D-12 — ONE-WAY DOOR): Both files MUST change in ONE commit.
  - src/routes/+layout.svelte: DELETE the line <meta name="robots" content="noindex, nofollow" /> (absence = crawler default index,follow; do NOT replace with an index,follow tag).
  - static/robots.txt: REPLACE entirely with:
      User-agent: *
      Allow: /

      Sitemap: https://michellengo.net/sitemap.xml
  - Single atomic commit:
      git add src/routes/+layout.svelte static/robots.txt
      git commit -m "feat(07-05): atomic noindex+robots flip — site is now indexable (D-12)"
      git push origin main

Step 7 — Re-trigger production workflow with the flipped build (~5 min): Run the production workflow again on main. Re-verify:
  curl --resolve michellengo.net:443:185.199.108.153 https://michellengo.net/ -s | grep -c "noindex"   # expect 0
  curl --resolve michellengo.net:443:185.199.108.153 https://michellengo.net/robots.txt -s             # expect Allow: / + Sitemap:
If noindex count is not 0, the build picked up the wrong commit — re-trigger and re-verify.

Step 8 — DNS swap at registrar (the actual cutover — one-way door): Recommended ≥1 h prior: set the existing WordPress A-record TTL to 300 s. At swap time:
  - Remove the WordPress.com A records.
  - Add four apex A records: @ → 185.199.108.153 / .109.153 / .110.153 / .111.153.
  - Remove any www record; add CNAME www → wolfwdavid.github.io.
  - Save. Propagation typically 5 min – 1 h (some resolvers up to 48 h).

Step 9 — Post-cutover verification:
  dig michellengo.net +short        # expect the 4 GH Pages anycast IPs
  curl -I https://michellengo.net/  # expect HTTP/2 200, server: GitHub.com
  curl -I https://www.michellengo.net/   # expect 200 OR 301 → apex
Browser: https://michellengo.net loads the new SvelteKit site (not WordPress); PLAY REEL works; /work /press /about /contact /pbs-american-portrait/ all load. GitHub Pages settings shows a green check next to michellengo.net.

Rollback (if cutover fails after Step 8): The DNS swap is the ONLY step affecting real users. Restore the previous WordPress.com A records (remove GH Pages A records + www CNAME) at the registrar; with TTL=300 s prep, recovery typically < 5 min. The GH Pages deploy persists at https://wolfwdavid.github.io/michelle_ngo_three/ for debugging. Re-attempt from Step 8 (Steps 1–7 config is sticky). Note: the D-12 atomic flip (Step 6) is NOT undone by the DNS revert — anything already crawled may have been indexed; expected and acceptable.

---

## Requirement Honesty Note

- **FOUND-03 — COMPLETE.** "Production deploy reachable on `michellengo.net` apex with HTTPS (cutover-gated; only triggers if `_three` wins A/B)." The cutover infrastructure — `static/CNAME`, the manual-dispatch `deploy-production.yml`, the staged-but-unlanded D-12 atomic flip, the consolidated `07-QA-MATRIX.md` go/no-go gate, and the 9-step reversible Launch Runbook — is fully staged and reversible. It fires ONLY after the user declares `_three` the A/B winner (D-09). That IS exactly what FOUND-03 asks for: ready, A/B-winner-gated, reversible. Marked complete.
- **POL-04 — PARTIAL / DEFERRED (do NOT claim a false green).** POL-04's automated half (axe-core CI hardened to 7 routes + the cutover-infra files) is done across 07-03/07-04/07-05. BUT POL-04 also requires a **manual real-device QA matrix** (iOS Safari 16/17.0/17.1/17.2+, Chrome Android, Firefox desktop, Safari macOS + the iPhone 5-min thermal test) **SIGNED OFF before cutover**. That sign-off is **DEFERRED to UAT** and tracked as the blocking rows in `07-QA-MATRIX.md` (status: pending). If Plan 07-04 already checked POL-04, this note reconciles it: **the device-QA sign-off remains OUTSTANDING** — the phase verifier should treat POL-04 as partial until the BrowserStack matrix + thermal test in `07-QA-MATRIX.md` are GREEN. POL-04 is left unmarked / partial here intentionally.

## Decisions Made

- Stop-at-infrastructure terminal state for Phase 7: the live DNS flip is the user's cutover-day action (hard-gated on D-09 A/B-winner + D-06 GREEN BrowserStack), never autonomous.
- D-12 atomic noindex->index flip prepared as ONE commit in the runbook (Step 6) but deliberately NOT landed — winner-only, the last commit before DNS (Pitfall 6: never split, never land during the A/B).

## Deviations from Plan

None - plan executed exactly as written. Tasks 1-2 ran auto and committed atomically; Task 3 paused at the human-verify checkpoint as designed and was approved by the user; finalization wrote the verbatim runbook and re-confirmed the four invariants.

## Issues Encountered

None. The earlier `grep -c "push:\|pull_request:"` returning a non-zero count on `deploy-production.yml` was traced to the explanatory comment block (lines 3-9), NOT an actual trigger — the only top-level `on:` child is `workflow_dispatch:` (line 11). Invariant 2 confirmed clean.

## User Setup Required

None for this plan. The cutover itself (the Launch Runbook above) is the user's cutover-day action, hard-gated on the A/B-winner declaration (D-09) + a GREEN `07-QA-MATRIX.md` (D-06). The user also owns the BrowserStack runs, the iPhone thermal test, the 21-cell sweep, and the CONT-02 IMDb/LinkedIn personalized-URL swap decision against `07-QA-MATRIX.md`.

## Next Phase Readiness

- Phase 7 (Polish & Cutover) cutover infrastructure is COMPLETE and reviewable. `_three` is A/B-winner-ready and reversible.
- **Outstanding before any live cutover (all the user's to execute):** A/B-winner declaration (D-09), GREEN BrowserStack 28-cell matrix + iPhone thermal (D-06), 7 surface UAT items (D-07), 21-cell responsive sweep (D-08), CONT-02 swap decision, Lighthouse warn->error blocking flip, all 5 trap CI gates green — every blocking row of `07-QA-MATRIX.md`.
- The D-12 atomic noindex->index flip is staged-only; the site remains `noindex` until the user fires Step 6 of the runbook on cutover day.

## Self-Check: PASSED

- FOUND: `static/CNAME`
- FOUND: `.github/workflows/deploy-production.yml`
- FOUND: `.planning/phases/07-polish-cutover/07-QA-MATRIX.md`
- FOUND: `.planning/phases/07-polish-cutover/07-05-SUMMARY.md`
- FOUND commit: `10ac679` (Task 1)
- FOUND commit: `fe630e0` (Task 2)

---
*Phase: 07-polish-cutover*
*Completed: 2026-05-29*
