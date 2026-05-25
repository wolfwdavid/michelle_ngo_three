---
phase: 02-data-layer
plan: 02
subsystem: ci
tags: [ci, drift-check, data-layer, trap-a, data-04]
status: complete
completed: "2026-05-25T19:04:15Z"
duration_min: 2
wave: 2
depends_on:
  - 02-01
requirements:
  - DATA-04
dependency_graph:
  requires:
    - "src/lib/data/.videos-source-sha (sidecar from Plan 02-01: four_commit_sha, videos_json_sha256, synced_at)"
    - "src/lib/data/videos.json (byte-identical copy from _four; verified locally)"
    - ".github/workflows/deploy.yml (Phase 1 build+deploy workflow)"
    - "wolfwdavid/michelle_ngo_four repo (public, reachable at pinned SHA 07667658ee2fd16a3d56b66bbe832d08fc3badd5)"
  provides:
    - "drift-check job on every PR + push to main"
    - "D-12 inline ::error:: annotation with literal cp fix-it command on drift"
    - "D-07 force-push case detection with concrete fix-it message"
    - "Sidecar sha256 consistency check (catches local edits without sidecar refresh)"
    - "pull_request:branches:[main] trigger expansion (PRs now run the whole workflow)"
  affects:
    - "All future PRs touching src/lib/data/videos.json — must keep byte-identity or refresh sidecar"
    - "Branch protection on main can now require the drift-check status check"
    - "Phase 7 production deploy (POL-04) inherits the same gate"
tech_stack:
  added: []
  patterns:
    - "GH Actions ::error:: annotations as PR-inline fix-it instructions (D-17 grep gate posture extended)"
    - "actions/checkout@v4 with repository+ref+path to vendor a sibling repo into a job-scoped subdirectory"
    - "continue-on-error on a checkout step + conditional follow-up step for human-readable error wording"
    - "Sidecar key=value parsing via grep+cut (no jq/yq dependency on the runner)"
key_files:
  created: []
  modified:
    - ".github/workflows/deploy.yml — added pull_request: trigger; appended drift-check job (6 steps, 76 lines)"
decisions:
  - "Subdirectory __four/ chosen for the _four checkout (matches the comment in the action; double-underscore prefix visually separates it from src/)"
  - "YAML validation performed via Node + pnpm-vendored yaml@2.9.0 (no system python; project has no top-level yaml dep)"
  - "Did not add `needs:` between drift-check and build/deploy — drift-check runs in parallel to build per D-10 (independent gate, branch protection enforces)"
  - "Added an extra step (D-extra) checking videos_json_sha256 against the actual file's sha256 — catches the edge case where someone edits videos.json locally but forgets to refresh the sidecar (CONTEXT D-06 implies this; Plan 02-01 SUMMARY notes the sidecar carries the sha — surfacing it as a CI gate hardens the seam)"
metrics:
  duration_min: 2
  task_count: 1
  files_modified: 1
---

# Phase 02-data-layer Plan 02-02: Cross-repo Drift CI Summary

Wired DATA-04 / Trap A: a `drift-check` job in `.github/workflows/deploy.yml` that re-clones `_four` at the pinned SHA from the sidecar, byte-compares `videos.json`, and fails the PR/main-push with concrete D-12 / D-07 / sidecar-mismatch fix-it messages.

## Tasks Completed

| # | Task | Files | Commit | Status |
|---|------|-------|--------|--------|
| 1 | Add drift-check job + pull_request trigger to .github/workflows/deploy.yml | `.github/workflows/deploy.yml` (+76 lines) | `b12096d` | done |

## What Was Built

### `.github/workflows/deploy.yml` — two modifications

**1. Trigger expansion (D-10):**
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]   # NEW — drift-check now runs on PRs
  workflow_dispatch:
```

**2. New `drift-check` job (sibling to `build` and `deploy`):**

Six steps, in order:

1. **Checkout _three** — `actions/checkout@v4` (default depth, default ref).
2. **Read pinned _four SHA from sidecar** — shell: `grep '^four_commit_sha=' src/lib/data/.videos-source-sha | cut -d= -f2` → length-validated to 40 chars → `$GITHUB_OUTPUT`.
3. **Checkout _four at pinned SHA** — second `actions/checkout@v4` with `repository: wolfwdavid/michelle_ngo_four`, `ref: ${{ steps.pin.outputs.four_sha }}`, `path: __four`. `continue-on-error: true` so step 4 can speak human.
4. **Handle unreachable _four SHA (D-07)** — `if: steps.checkout_four.outcome == 'failure'` → emits the literal "no longer reachable" annotation + exits 1.
5. **Byte-compare videos.json against pinned _four** — `cmp -s __four/src/lib/data/videos.json src/lib/data/videos.json` → success exits 0; mismatch prints the D-12 wording (`::error::videos.json drift: ... cp ../michelle_ngo_four/src/lib/data/videos.json src/lib/data/videos.json && update src/lib/data/.videos-source-sha ...`) + a `diff -u | head -40` snippet for reviewer context + exits 1.
6. **Verify sidecar sha256 matches the local file** — defensive belt-and-suspenders: reads `videos_json_sha256=` from sidecar, computes actual via `sha256sum src/lib/data/videos.json | awk '{print $1}'`, fails with "Sidecar sha256 mismatch" annotation if drift detected. Catches the case where someone edits `videos.json` locally without refreshing the sidecar (the byte-compare would also catch this against `_four`, but the sidecar-mismatch surfaces the root cause faster).

## Subdirectory Choice (per CONTEXT §Claude's Discretion)

**Chosen:** `__four/` (double-underscore prefix).

Rationale: visually obvious it's a runner-ephemeral vendored checkout, not part of `_three`'s source tree. Alternatives `tmp/_four/` and `external/_four/` were equally valid; staying with `__four/` keeps consistency with the inline comment in the action's `path:` field and the plan's spec text.

## Local Dry-Run Output (the four `<verify>` commands)

```
=== Parse SHA from sidecar ===
$ FOUR_SHA=$(grep '^four_commit_sha=' src/lib/data/.videos-source-sha | cut -d= -f2)
$ echo "$FOUR_SHA" : len=${#FOUR_SHA}
07667658ee2fd16a3d56b66bbe832d08fc3badd5 : len=40
SHA format OK: 40-char hex

=== Byte-compare _four <-> _three videos.json ===
$ cmp -s ../michelle_ngo_four/src/lib/data/videos.json src/lib/data/videos.json ; echo $?
0
drift-check would PASS locally (cmp exit 0)

=== Sidecar sha256 consistency ===
RECORDED: fd15e0568425ef8a8472b8bae856bc43a5a85810e4fb1a8f9d0cff771d8ef91c
ACTUAL:   fd15e0568425ef8a8472b8bae856bc43a5a85810e4fb1a8f9d0cff771d8ef91c
Sidecar sha consistent locally ✓

=== _four current main HEAD vs pinned SHA ===
Current _four HEAD: 07667658ee2fd16a3d56b66bbe832d08fc3badd5
Pinned SHA matches _four's current HEAD ✓
```

All four checks green.

## YAML Validation

**Parser used:** Node + `yaml@2.9.0` (pnpm-vendored, resolved via direct require path `node_modules/.pnpm/yaml@2.9.0/node_modules/yaml`).

System `python3` was not available on this Windows host (`Python was not found...`), and the workspace has no top-level `yaml`/`js-yaml` direct dep. The vendored `yaml@2.9.0` (transitive) was the dep-free path.

**Result:**
```
YAML parsed OK
Jobs: build, deploy, drift-check
Triggers: push, pull_request, workflow_dispatch
drift-check step count: 6
drift-check runs-on: ubuntu-latest
deploy needs: build
```

All three expected jobs present, all three expected triggers present, `deploy needs: build` preserved (existing job untouched).

## Acceptance Criteria Verification (every bullet from PLAN.md)

| Criterion | Status |
|---|---|
| `.github/workflows/deploy.yml` parses as valid YAML | PASS (yaml@2.9.0) |
| Contains `pull_request:` under top-level `on:` | PASS |
| Top-level job `drift-check:` sibling to `build:` and `deploy:` | PASS (regex `^  drift-check:` matches) |
| Uses `actions/checkout@v4` at least twice | PASS (3 occurrences: build, drift-check x2) |
| Second checkout has `repository: wolfwdavid/michelle_ngo_four` | PASS |
| Reads `four_commit_sha` via `grep '^four_commit_sha=' ... cut -d= -f2` | PASS |
| Uses `cmp -s` to compare `__four/...` vs `src/lib/data/videos.json` | PASS |
| Byte-compare error contains `videos.json drift:` AND `cp ../michelle_ngo_four/src/lib/data/videos.json src/lib/data/videos.json` | PASS (single `::error::` line) |
| Force-push error contains `no longer reachable` | PASS |
| Sidecar-sha-consistency error contains `Sidecar sha256 mismatch` | PASS |
| Existing `build:` job's `D-17 grep gate` still present verbatim | PASS (grep -q "D-17 grep gate" → match) |
| Existing `deploy:` job still has `needs: build` | PASS (YAML parser confirms) |
| Local dry-run: SHA is 40-char hex, `cmp -s` exit 0, sidecar sha == file sha | PASS (all three) |

## Deviations from Plan

None. Plan executed exactly as written.

The optional extra step (sidecar sha256 consistency check) was specified verbatim in the PLAN.md action block (lines 183-193) — included as part of the spec, not a deviation. It hardens the D-06 sidecar contract by catching the "local edit without sidecar refresh" case faster than the cross-repo cmp would.

## CI Run Status

**First real CI run:** Will be verified on the next PR or push to `main` that includes commit `b12096d`. The local dry-run (all four checks green) confirms the shell logic is sound; the only thing the dry-run cannot prove is that `actions/checkout@v4` with `repository: wolfwdavid/michelle_ngo_four` + `ref: 07667658...` actually resolves to a public, unauthenticated clone on the runner. This will be visible in the Actions tab on the next workflow run.

**Expected outcome on next run (no drift):**
- `Read pinned _four SHA from sidecar` → "Pinned _four SHA: 07667658..."
- `Checkout _four at pinned SHA` → green (public repo, current main reachable at that SHA)
- `Handle unreachable _four SHA (D-07 force-push case)` → skipped (`if: steps.checkout_four.outcome == 'failure'` false)
- `Byte-compare videos.json against pinned _four` → "videos.json byte-identical to _four@07667658... ✓"
- `Verify sidecar sha256 matches the local file` → "Sidecar sha256 consistent ✓"

**Expected outcome on a sanity-edit PR** (e.g., add a space to videos.json):
- Byte-compare step fires the D-12 `::error::` annotation inline on the PR.
- Reverting the edit passes.

## Edits to Existing Jobs

**Zero.** The only modifications were:
1. Addition of `pull_request:` block to `on:` (additive — preserved existing `push:` and `workflow_dispatch:` lines).
2. Appending a new top-level `drift-check:` job after the existing `deploy:` job's last step.

`build:` and `deploy:` job bodies are byte-identical to Phase 1's state. The D-17 grep gate, lint, type-check, test, e2e, build, and upload-pages-artifact steps are untouched.

## Self-Check: PASSED

- `.github/workflows/deploy.yml` → exists, modified by commit `b12096d`
- `.planning/phases/02-data-layer/02-02-SUMMARY.md` → this file, exists
- Commit `b12096d` → found in git log (`feat(02-02): add drift-check job + pull_request trigger to deploy.yml`)

```bash
$ test -f .github/workflows/deploy.yml && echo FOUND
FOUND
$ git log --oneline --all | grep -q "b12096d" && echo FOUND
FOUND
```
