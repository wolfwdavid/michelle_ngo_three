---
phase: 02-data-layer
plan: 03
subsystem: data
tags: [oembed, ci, github-actions, health-check, nightly-cron, issue-automation, pitfall-6]

# Dependency graph
requires:
  - phase: 02-data-layer
    plan: 01
    provides: "src/lib/data/videos.json (56 records with source ∈ {vimeo,youtube} and id field) — the catalog scripts/check-embeds.ts iterates"
provides:
  - "scripts/check-embeds.ts — standalone Node 22 oEmbed health-check script (zero new deps; stdlib + native fetch)"
  - "pnpm check:embeds — local opt-in invocation entrypoint"
  - ".embed-check-report.json gitignore rule (D-20)"
  - ".github/workflows/oembed-check.yml — nightly cron (06:00 UTC) + workflow_dispatch + auto-Issue handler (D-13, D-19)"
  - "embed-check GitHub label (created idempotently by the workflow on first failure)"
affects:
  - "07-polish-and-cutover: Phase 7 deploy-production.yml will invoke pnpm check:embeds as a pre-deploy gate (caller-side wiring is OUT OF SCOPE for Phase 2 per CONTEXT)"
  - "Operational surface: any video owner flipping embed-disabled bit is now caught within ≤24h (nightly cadence) as a tracked GitHub Issue, not as a runtime black box on the producer-facing site"

# Tech tracking
tech-stack:
  added:
    - "Node 22 --experimental-strip-types (native TS execution; avoided tsx devDep)"
  patterns:
    - "Standalone script over Vite plugin extension (D-18): keeps validateVideosPlugin() single-purpose; can't be accidentally triggered by `pnpm build`"
    - "Hand-rolled per-host concurrency queue (D-15): 30-line makeHostQueue(limit) closure, no p-limit dep"
    - "Retry-then-classify failure handling (D-14): 3 retries × 1s/2s/4s backoff; hard signals (401/403/404/410) stop retrying immediately; transient (5xx/network/timeout) absorbed as warnings"
    - "Auto-Issue debouncing via `gh issue list --label embed-check --state open` (D-19): comments on existing issue instead of opening duplicates"
    - "continue-on-error + downstream failure-mark step pattern: lets the failure handler run on a non-zero exit but still marks the workflow run red"

key-files:
  created:
    - "scripts/check-embeds.ts (234 lines; oembedUrl + classify + fetchOnce + probe + makeHostQueue + main)"
    - ".github/workflows/oembed-check.yml (128 lines; checkout + setup-node@v4 + pnpm/action-setup@v4 + check step + upload-artifact + gh issue auto-open/comment + mark-failed)"
  modified:
    - "package.json (added check:embeds script entry between check:watch and test)"
    - ".gitignore (appended .embed-check-report.json under Phase 2 D-20 section header)"

key-decisions:
  - "Standalone script implementation (D-18) — not an extension of validateVideosPlugin; not an env-gated plugin. Standalone can't be triggered by accidental OEMBED_CHECK=1 env in production builds."
  - "Hand-rolled concurrency queue (D-15 §discretion) — 30-line makeHostQueue closure. Zero new deps. Vimeo and YouTube buckets run independently (up to 12 in flight)."
  - "node --experimental-strip-types (Node 22+) over tsx devDep — package.json engines.node is already >=22; ExperimentalWarning is acceptable (the script is a CI/local tool, not user-facing). Fallback to tsx documented in plan but not needed."
  - "Separate oembed-check.yml workflow file, not a job inside deploy.yml — cron schedule unrelated to deploy; gh issue handler is workflow-specific; isolates the Phase 7 deploy-gate wiring (which will just invoke pnpm check:embeds, not this workflow)."
  - "Cron at 06:00 UTC over UTC midnight — off-peak for both Vimeo (PT business hours) and YouTube (US/EU asleep)."
  - "ExperimentalWarning is acceptable noise in the script — Node 22 emits an ExperimentalWarning for --experimental-strip-types even on stable usage; documented for future executors."

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-05-25
---

# Phase 2 Plan 3: oEmbed Health-Check Infrastructure Summary

**Pitfall 6 mitigation shipped: a standalone Node script + nightly GitHub Action probe Vimeo/YouTube oEmbed endpoints for all 56 videos with retry-then-classify failure handling, and auto-open or comment on a tracked `embed-check`-labeled Issue when any video has been embed-disabled or removed by its owner.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-25T18:57:30Z (approx — immediately after STATE record-session timestamp)
- **Completed:** 2026-05-25T19:09:00Z
- **Tasks:** 4 (3 type=auto file-producing + 1 type=auto smoke-test)
- **Files created:** 2 (scripts/check-embeds.ts, .github/workflows/oembed-check.yml)
- **Files modified:** 2 (package.json, .gitignore)

## Accomplishments

- **Goal Success Criterion #5 (oEmbed health-check) shipped.** Standalone script + nightly Action + auto-Issue tracker. Does NOT run on every `pnpm build` per D-13 — local opt-in via `pnpm check:embeds`, nightly cron at 06:00 UTC, and (Phase 7) a production-deploy pre-flight caller.
- **D-14 classification implemented exactly:** 401/403 → `embed_disabled` (fail), 404/410 → `removed` (fail), 5xx/network/timeout → `transient` (warn, no fail). Hard signals stop retrying immediately; transient retries 3 times with 1s/2s/4s backoff.
- **D-15 per-host concurrency limit honored:** 6 per host via `makeHostQueue(6)` × 2 lanes (Vimeo + YouTube independent). With 56 videos / 12 max in flight / ~300ms avg latency, real run timed at ~6s wall on the local machine.
- **D-16 no-caching:** Every invocation re-reads `videos.json` and re-fetches all 56 oEmbed URLs. No state persists between runs.
- **D-17 endpoints exact:** Vimeo `https://vimeo.com/api/oembed.json?url=https://vimeo.com/<id>`, YouTube `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json`.
- **D-19 auto-Issue handler:** Workflow's failure step runs `gh issue list --label embed-check --state open --json number --jq '.[0].number'` — if non-empty, `gh issue comment <n>`; else `gh label create embed-check --force` then `gh issue create --label embed-check --title "[embed-check] N video(s) failed..."`. Body templates a Markdown table of failing records sourced from `.embed-check-report.json`.
- **D-20 disk artifact contract:** On success, nothing written and script exits 0. On failure, `.embed-check-report.json` written at repo root with `{ranAt, totalChecked, failures: [...], warnings: [...]}` shape; gitignored.
- **Live smoke-test against production Vimeo/YouTube oEmbed servers:** 56/56 videos embeddable today, exit 0, no report file written. Confirms the catalog is healthy as of 2026-05-25.

## Task Commits

1. **Task 1: Create `scripts/check-embeds.ts` standalone Node script** — `6ed3fe0` (feat)
2. **Task 2: Wire `pnpm check:embeds` + gitignore `.embed-check-report.json`** — `9d4e85e` (chore)
3. **Task 3: Create `.github/workflows/oembed-check.yml` nightly + Issue handler** — `612f30a` (feat)
4. **Task 4: Local smoke-test happy + forced-failure paths** — no commit (verification-only task; tree restored to Task-3 state)

**Plan metadata commit:** pending (final docs commit covers SUMMARY + STATE + ROADMAP).

## Files Created/Modified

### Created (2)

- **`scripts/check-embeds.ts`** (234 lines) — Standalone Node 22 script. Reads `src/lib/data/videos.json` directly (no `$lib/data` import — keeps the script independent of SvelteKit's alias resolution in plain-Node context, per D-22). Concurrency-limited fetches via hand-rolled `makeHostQueue`. Exit 0 on all-pass, 1 on classified failure, 2 on unexpected uncaught error.

- **`.github/workflows/oembed-check.yml`** (128 lines) — Nightly cron `0 6 * * *` + `workflow_dispatch`. Single `check` job on `ubuntu-latest` with pinned actions: `actions/checkout@v4`, `actions/setup-node@v4` (Node 22), `pnpm/action-setup@v4` (pnpm 11.0.9, `standalone: true`), `actions/upload-artifact@v4` (`.embed-check-report.json`, 30-day retention). `concurrency: { group: oembed-check, cancel-in-progress: true }`. `permissions: { contents: read, issues: write }`. Failure handler step embeds a multi-line bash + node script that templates the Markdown body and chooses comment-vs-create via `gh issue list --label embed-check --state open`.

### Modified (2)

- **`package.json`** — Single line added to the `scripts` block:
  ```json
  "check:embeds": "node --experimental-strip-types scripts/check-embeds.ts",
  ```
  Placed between `check:watch` and `test` to keep the `check:` cluster contiguous.

- **`.gitignore`** — Appended a new section at the end:
  ```
  # oEmbed health-check report (Phase 2 D-20 — written only on failure, never committed)
  .embed-check-report.json
  ```
  No existing entries touched.

## Decisions Made (executor-side detail)

- **TypeScript execution path: `node --experimental-strip-types`.** Per the plan's primary recommendation. Confirmed locally with Node 22.14.0 (≥ 22.6 required for type-stripping). The `ExperimentalWarning` line emitted to stderr on every run is cosmetic; documented here so future executors don't mistake it for a script-side bug. **Fallback to `tsx` was NOT taken** — type-stripping worked first try on the local machine. CI runner is also Node 22 (per the workflow's `node-version: 22` pin), so this path will work in GH Actions identically.
- **Concurrency queue mechanism: hand-rolled `makeHostQueue` (D-15 §discretion).** A 30-line closure-based queue with `active` counter + `waiters[]` FIFO. Chosen over `p-limit` to avoid adding an npm dep for ~30 lines of code. Vimeo and YouTube get separate queue instances — limit applies per-host, not globally.
- **Cron schedule: `0 6 * * *` (06:00 UTC).** Off-peak for both providers (US Pacific business hours haven't started; US/EU traffic is at its lowest). Documented in the workflow's cron comment line as adjustable if Vimeo/YouTube start returning 5xx in this window.
- **Label color chosen: `d93f0b` (deep orange).** GitHub's recommended palette for the "alert / outage / external-signal" semantic bucket. Not load-bearing — first `gh label create` invocation sets it; subsequent `--force` re-invocations also set it (idempotent).
- **`continue-on-error: true` on the check step + a final "mark workflow failed" step.** Lets the failure handler (upload artifact + auto-Issue) run on a non-zero exit while still marking the workflow run red. Cleaner than wrapping the issue logic inside the check step's failure branch — keeps each step single-purpose.
- **Issue body template tightening.** Plan provided the data shape; executor's wording tightening: shortened "Next steps" to 4 numbered items, surfaced the workflow run URL inline, and explicitly named the attached artifact filename so the on-call human can find the structured payload.

## Smoke-Test Detail (D-20 verification record)

### Smoke-Test A — Happy path (live, against production oEmbed endpoints)

| Field | Value |
|---|---|
| Command | `pnpm check:embeds` |
| Exit code | 0 |
| Stdout | `✓ 56/56 videos embeddable` |
| Transient warnings | 0 |
| `.embed-check-report.json` present? | No (correct — D-20: not written on success) |
| Wall time | ~6s (per-host 6 concurrent × 2 hosts × ~300ms avg latency) |
| Verification | 56 oEmbed JSON endpoints all returned 2xx on first try; zero retries triggered. |

### Smoke-Test B — Forced failure (Option B1: non-destructive URL temp-edit)

| Field | Value |
|---|---|
| Forcing mechanism | Temp-edited `oembedUrl()` to return `https://www.youtube.com/oembed-NOTFOUND?...` for YouTube source rows; Vimeo URL left untouched |
| Command | `pnpm check:embeds` |
| Exit code | 1 (ELIFECYCLE; expected) |
| Stderr first line | `✗ 14/56 videos failed oEmbed check:` |
| Failure classification | All 14 YouTube rows → `removed` (404 from the bogus path) |
| Vimeo rows | All 42 still classified `ok` (untouched URL — happy path confirmation in the same run) |
| `.embed-check-report.json` written? | Yes |
| Report `ranAt` | `2026-05-25T19:07:19.415Z` (valid ISO 8601) |
| Report `totalChecked` | 56 |
| Report `failures.length` | 14 |
| Report `warnings.length` | 0 |
| First failure record shape | `{ source: "youtube", id: "9Zmw69UZSsI", title: "Amazon Employees Celebrate Their Asian Pacific American Heritage \| Amazon News", status: 404, classification: "removed" }` — matches the `<interfaces>` spec exactly |
| Restoration | `git restore scripts/check-embeds.ts` — clean working tree confirmed by `git status --porcelain \| grep -E "videos.json\|check-embeds.ts"` returning empty |
| Cleanup | `rm -f .embed-check-report.json` — no leftover artifact |
| Final happy-path re-run | Exit 0; `✓ 56/56 videos embeddable`; no report file |

## Deviations from Plan

None — plan executed exactly as written.

The single executor's-discretion call (cron schedule = 06:00 UTC over the plan's mentioned-as-acceptable "UTC midnight" default) was explicitly authorized by CONTEXT §D-13 and re-authorized in the plan's `<action>` block ("could shift to off-peak Vimeo/YouTube hours if needed"). Documented in Decisions Made above.

No Rule 1/2/3 auto-fixes were needed. No Rule 4 architectural escalation was needed. No authentication gates encountered.

## Issues Encountered

None.

Two potential blockers were anticipated by the plan but did not bite:

- **`--experimental-strip-types` availability on the local Node 22.** Plan provided a `tsx` fallback. Confirmed working first try; no fallback taken.
- **YAML parser availability for local validation.** Plan suggested `python3` OR `node -e "require('yaml')"` OR `node -e "require('js-yaml')"`. Project doesn't have `yaml` or `js-yaml` as top-level deps; both exist as transitive deps under `node_modules/.pnpm/` though. Validated by `cd node_modules/.pnpm/yaml@2.9.0/node_modules/yaml && node -e "..."` which parsed cleanly: 5 top-level keys (`name`, `on`, `permissions`, `concurrency`, `jobs`), 8 steps in the `check` job, both triggers (`schedule` + `workflow_dispatch`), correct cron string, correct permissions block, correct concurrency block.

## User Setup Required

None for Phase 2. Two observability touchpoints surface only AFTER the workflow first fires in production:

1. **First nightly failure** (whenever it occurs): an `embed-check`-labeled GitHub Issue will appear in the repo. No pre-creation of the label is needed — `gh label create embed-check --force` in the workflow creates it idempotently on first failure.
2. **Optional: subscribe to embed-check label** in repo notification settings if you want push notifications instead of polling the Issues tab. Not required for the workflow to function.

## Phase 7 Hook-In (OUT OF SCOPE for this plan)

**This is the explicit note requested by the plan's output spec.** Phase 7's `deploy-production.yml` workflow will invoke `pnpm check:embeds` as a pre-deploy gate. That caller-side wiring is OUT OF SCOPE for Phase 2 Plan 3. This plan ships:

1. The standalone script (`scripts/check-embeds.ts`) — reusable by any future caller.
2. The local opt-in entrypoint (`pnpm check:embeds`) — also reusable.
3. The nightly cron + auto-Issue tracker (`.github/workflows/oembed-check.yml`) — independent of any deploy workflow.

Phase 7 will reuse #1 and #2; it will NOT modify or extend `oembed-check.yml`. Future executors: do not bundle the deploy-gate logic into this workflow — the cron job's failure semantics (open a tracking Issue) are intentionally different from a deploy-time gate's failure semantics (block the deploy).

## Concurrency-Safety Note (Parallel Execution Context)

This plan ran as Wave 2 sibling of `02-02-PLAN.md` (cross-repo drift CI). The sibling modified `.github/workflows/deploy.yml` while this plan created a separate `.github/workflows/oembed-check.yml`. No file overlap, no contention. All commits in this plan used `--no-verify` per orchestrator instruction; pre-commit hook validation is delegated to the post-wave validator.

Verified in the final commit log:
```
612f30a feat(02-03): add nightly oEmbed health-check workflow       ← this plan's Task 3
b12096d feat(02-02): add drift-check job + pull_request trigger      ← sibling's commit (deploy.yml edit)
9d4e85e chore(02-03): wire pnpm check:embeds + gitignore             ← this plan's Task 2
6ed3fe0 feat(02-03): add scripts/check-embeds.ts oEmbed health-check ← this plan's Task 1
```

The two plans interleave cleanly with no rebases or fixups required.

## Next Phase Readiness

- **Phase 2 Plan 2 (drift-check):** Sibling plan completed in this wave. No coupling with this plan beyond shared phase scope.
- **Phase 3 (Reel System Core):** No dependency. The oEmbed check is operational infrastructure; the reel rendering path doesn't import from `scripts/`.
- **Phase 7 (Polish & Cutover):**
  - **POL-04 production deploy workflow** will invoke `pnpm check:embeds` as a pre-deploy gate (exit non-zero = block deploy). The script's exit code contract (0/1/2) is the only API the caller needs.
  - **No additional Phase 2-side work required.** Phase 7 wires the caller; this plan provides the callee.
- **Operational readiness:** Workflow will fire its first nightly run within ≤24h of the next push to `main` that enables the workflow (GitHub auto-enables on first push for new workflow files). `workflow_dispatch` is also available for an immediate manual run from the Actions tab.

## Self-Check

Verifying claims from this SUMMARY against the working tree and git history.

### Files Created
- FOUND: `scripts/check-embeds.ts`
- FOUND: `.github/workflows/oembed-check.yml`

### Files Modified
- FOUND: `package.json` (contains `"check:embeds":` script entry)
- FOUND: `.gitignore` (contains `.embed-check-report.json` line)

### Commits
- FOUND: `6ed3fe0` Task 1 (feat — scripts/check-embeds.ts)
- FOUND: `9d4e85e` Task 2 (chore — package.json + .gitignore)
- FOUND: `612f30a` Task 3 (feat — workflows/oembed-check.yml)

### Smoke-Tests
- VERIFIED: Smoke-test A exit 0, no report file written
- VERIFIED: Smoke-test B exit 1, report file written with documented `{ranAt, totalChecked, failures, warnings}` shape, 14 failures, restoration left tree clean

## Self-Check: PASSED

---

*Phase: 02-data-layer*
*Plan: 03*
*Completed: 2026-05-25*
