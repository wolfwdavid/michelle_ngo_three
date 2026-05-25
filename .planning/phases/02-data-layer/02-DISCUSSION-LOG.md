# Phase 2: Data Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `02-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 02-data-layer
**Areas discussed:** videos.json sync mechanism, Cross-repo drift CI (DATA-04), oEmbed health-check, Loader file structure & deltas

---

## videos.json sync mechanism

### Q1: Day-one cp method

| Option | Description | Selected |
|--------|-------------|----------|
| Plain cp from sibling path | `cp ../michelle_ngo_four/src/lib/data/videos.json src/lib/data/videos.json` once in the plan task. Simple, transparent, leaves a real commit. Aligns with how `_four`'s files were mirrored in Phase 1. | ✓ |
| Wrap in pnpm sync:videos script | Add a `pnpm sync:videos` script that copies from a hardcoded sibling path. Same effect as cp but documented and re-runnable. Slight risk of treating the script as "the sync" instead of human review. | |
| Git subtree from _four | Use `git subtree add` to track `_four/src/lib/data/`. Preserves provenance via git history. Heavy machinery for one file; subtrees are notoriously easy to misuse. | |
| Fetch by raw GitHub URL at build | Skip checking videos.json into `_three`'s repo; fetch from `_four`'s main raw URL at build start. Maximal freshness, but breaks "static repo" posture and adds a build-time network dep. | |

**User's choice:** Plain cp (Recommended)
**Notes:** Matches PROJECT.md L110 posture ("manual review, no symlink").

### Q2: Ongoing sync mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Manual cp + PR per change | Human runs the cp, opens a PR titled "sync: pull _four videos.json @ <SHA>". Cross-repo drift CI catches drift if forgotten. | ✓ |
| pnpm sync:videos script + manual PR | Same as above but run a documented script instead of raw cp. Script logs the source path + `_four` commit SHA into the PR body for traceability. | |
| GitHub Action that auto-PRs on _four push | On every push to `_four`'s main, an Action opens a PR in `_three` with the updated videos.json. Automates the catch but adds cross-repo permissions/maintenance. | |
| Cron / scheduled sync check | Nightly Action checks for drift and opens a PR if found. Latency-tolerant but adds a scheduled job to maintain. | |

**User's choice:** Manual cp + PR per change (Recommended)
**Notes:** Drift CI is the safety net; manual ensures human review.

### Q3: Canonical source-of-truth direction

| Option | Description | Selected |
|--------|-------------|----------|
| _four is always canonical | PROJECT.md L110 + DATA-01 already say so. `_three` only ever pulls. After cutover, the losing repo is abandoned, so direction stops mattering. | ✓ |
| Either can be canonical with marker | Add an `// canonical: _four` comment in both repos' videos.json. If a future content edit happens in `_three` first by accident, the marker makes the inversion explicit. | |
| Shared schema repo (new package) | Extract videos.json + schema into a separate small repo, both siblings depend on it. Cleanest but heavy infra. | |

**User's choice:** _four is always canonical (Recommended)

### Q4: SHA pinning storage location

| Option | Description | Selected |
|--------|-------------|----------|
| Sidecar file (`.videos-source-sha`) | Header comment in videos.json impossible (DATA-01 byte-identity). Sidecar with SHA + sync date next to videos.json. | ✓ |
| PR body / commit message only | No file. Git history of sync PRs encodes the chain. Drift CI compares against `_four`'s current main HEAD. | |
| package.json field | Add `"sourceVideosSha": "<sha>"` to package.json. Survives PR squashes; lives next to other version-pin info. | |
| Drop SHA pinning entirely | Drift CI fetches `_four`'s current videos.json and byte-compares. Implicit floating "current `_four` main" contract. | |

**User's choice:** Sidecar file (Recommended)

### Q5: Bootstrap SHA — main HEAD vs frozen vs tag

| Option | Description | Selected |
|--------|-------------|----------|
| Current _four main HEAD at Phase 2 commit time | Whatever main is when the plan task runs. Simplest, matches "living sync" posture. | ✓ |
| Frozen _four SHA from PROJECT.md kickoff | Pin to whatever SHA `_four` was at when `_three` started. Reproducible. Higher friction. | |
| _four's most recent release tag | Use `_four`'s latest semver tag. Stable, intentional. Requires `_four` to be tagging. | |

**User's choice:** Current _four main HEAD (Recommended)

### Q6: Sidecar shape

| Option | Description | Selected |
|--------|-------------|----------|
| SHA + content hash + sync date | Three lines: `four_commit_sha`, `videos_json_sha256`, `synced_at`. Belt-and-suspenders. | ✓ |
| Just _four commit SHA | One value. Drift CI does the byte-compare so local sha256 would be redundant. | |
| JSON shape for parsability | `.videos-source.json` with `{ commit, hash, syncedAt }`. Easier to script. | |

**User's choice:** SHA + content hash + sync date (Recommended)

### Q7: Lost-SHA handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fail loud with fix-it message | `ERROR: _four@<sha> no longer reachable. Re-sync from _four's current main and update .videos-source-sha.` | ✓ |
| Fall back to comparing against _four main HEAD | Soft-fail: warn that the SHA is unreachable but still byte-compare against current main. | |
| Skip the check until SHA is fixed | Drift CI passes with a "skipped: source SHA unreachable" note. | |

**User's choice:** Fail loud (Recommended)

### Q8: Sidecar file location

| Option | Description | Selected |
|--------|-------------|----------|
| `src/lib/data/.videos-source-sha` | Co-located with the file it describes. Drift CI + sync script live in `scripts/`. | ✓ |
| `.planning/data-sync/source-sha` | Treat as project metadata. Keeps `src/lib/data/` pure runtime artifacts. | |
| package.json field | Lives in the existing config blob. PR diffs get noisier. | |

**User's choice:** `src/lib/data/.videos-source-sha` (Recommended)

---

## Cross-repo drift CI (DATA-04)

### Q9: Access method for _four's videos.json from CI

| Option | Description | Selected |
|--------|-------------|----------|
| actions/checkout with `repository: _four` | Second checkout step clones `wolfwdavid/michelle_ngo_four` at pinned SHA. Native, no auth for public repo, deterministic. | ✓ |
| Raw GitHub URL fetch with curl | `curl https://raw.githubusercontent.com/.../videos.json`. CDN cache could mask staleness. | |
| Git submodule | Add `_four` as a submodule. Heavy machinery; pollutes working tree. | |
| GitHub API contents endpoint | Use contents API with the SHA. Authenticated to avoid 60-req/hr limit. | |

**User's choice:** actions/checkout (Recommended)

### Q10: Drift check cadence

| Option | Description | Selected |
|--------|-------------|----------|
| Every PR + every push to main | Uniform gate, catches drift before merge AND before deploy. | ✓ |
| PR-only | Skip main pushes. Lighter CI bill. Loses safety net for direct main pushes. | |
| Main pushes only + nightly | Skip PRs (faster PR feedback), catch on deploy path + nightly. | |
| Nightly only | Single scheduled job opens a sync PR if drift detected. Most lenient. | |

**User's choice:** Every PR + every push to main (Recommended)

### Q11: Drift check workflow location

| Option | Description | Selected |
|--------|-------------|----------|
| New job in existing deploy.yml | Sibling to other smoke gates. Single workflow file for branch protection. | ✓ |
| Separate drift-check.yml workflow | Isolated file. Easier to disable/iterate. More files to maintain. | |
| Inline step inside existing build job | No new job. Failure mixes with other build errors. | |

**User's choice:** New job in deploy.yml (Recommended)

### Q12: Drift failure message wording

| Option | Description | Selected |
|--------|-------------|----------|
| Concrete fix instruction | Names file, names SHA, gives literal cp command. | ✓ |
| Diff snippet inline | Print actual `diff` output (first 50 lines). Helpful but noisy. | |
| Minimal error + link to runbook | `See docs/sync-runbook.md.` Tightest log; introduces a doc file to maintain. | |

**User's choice:** Concrete fix instruction (Recommended)

---

## oEmbed health-check

### Q13: When to run

| Option | Description | Selected |
|--------|-------------|----------|
| Nightly + opt-in flag, NOT every build | Scheduled GH Action nightly; opt-in via `pnpm check:embeds`. Production deploy gates on it. | ✓ |
| Every build (dev + CI) | Cinema-grade strictness. 56× oEmbed calls per build melts DX. | |
| CI-only (PR + main), skip in dev | Block on CI. Dev iteration stays fast. CI eats 56 outbound HTTPS calls per PR. | |
| Pre-deploy only (production cutover) | Tightest cost. Defers detection until very late. | |

**User's choice:** Nightly + opt-in (Recommended)

### Q14: Failure classification strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Retry 3× with backoff, then classify by final response | 401/403 = disabled (fail); 404 = removed (fail); 5xx/network = transient (warn, don't fail). | ✓ |
| Single attempt, any non-2xx is hard fail | Simplest. Brittle to transient hiccups. May produce flaky builds. | |
| Two passes — fast first, deep second | HEAD then full GET on failures. Reduces bandwidth but adds complexity. | |
| Treat all failures as warnings | Never fail the build. Defeats the goal. | |

**User's choice:** Retry 3× then classify (Recommended)

### Q15: Concurrency strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Concurrency limit 6, per-host | `p-limit` or hand-rolled batching at 6. ~3-4s total for 56 reqs. | ✓ |
| Sequential (1 at a time) | Safest for rate limits. ~17s of network. | |
| Unbounded Promise.all | Fastest (~1s). Likely trips Vimeo's per-IP throttle. | |

**User's choice:** Concurrency limit 6, per-host (Recommended)

### Q16: Caching between runs

| Option | Description | Selected |
|--------|-------------|----------|
| No cache — always fresh | The whole point is catching the moment an embed flips disabled. | ✓ |
| Cache by (source, id) for 24h | Cuts nightly load roughly in half on second daily run. Weakens "catch the moment it flipped" guarantee. | |
| Cache only on success, invalidate on videos.json change | Cache hit only for unchanged records. Moderate complexity. | |

**User's choice:** No cache (Recommended)

### Q17: oEmbed endpoint choice

| Option | Description | Selected |
|--------|-------------|----------|
| Official oEmbed JSON per provider | Vimeo `vimeo.com/api/oembed.json`, YouTube `youtube.com/oembed`. Returns 401/403 if disabled, 404 if removed. | ✓ |
| Direct embed URL HEAD request | HEAD `player.vimeo.com/video/{id}` and `youtube.com/embed/{id}`. Less reliable signal — Vimeo returns 200 for disabled-by-owner. | |
| iframe API ping | JS API + headless browser. Most fidelity, slowest, doesn't fit Node script. | |

**User's choice:** Official oEmbed JSON (Recommended)

### Q18: Implementation — Vite plugin vs standalone script

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone Node script under scripts/ | `scripts/check-embeds.ts` invoked by `pnpm check:embeds` and nightly Action. Vite plugin stays focused on schema validation. | ✓ |
| Extend validateVideosPlugin to call oEmbed | One place for all data validation. Risk: forgotten env-var-flip on prod deploy runs 56 outbound requests per build. | |
| Separate second Vite plugin | `oEmbedHealthPlugin()` next to existing plugin. Same env-gating risk. | |

**User's choice:** Standalone Node script (Recommended)

### Q19: Nightly failure reporting

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-open a GitHub Issue with failing video list | `gh issue create` with templated body. Comment on prior open issue instead of duplicating. | ✓ |
| Fail the workflow only (no issue) | Red Action badge + workflow logs. Lightest weight. | |
| Open a draft PR with .videos-source-sha bumped + a note | Treats "embed disabled" as a real data event. Heaviest weight; could create churn. | |
| Slack/email webhook | Requires a secret and recipient. No existing Slack workspace in PROJECT.md. | |

**User's choice:** Auto-open GitHub Issue (Recommended)

### Q20: Disk artifact policy

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing on success; .embed-check-report.json on failure | Successful runs print summary + exit 0. Failure writes structured report (gitignored). | ✓ |
| Always write .embed-check-report.json | Run always produces a JSON report. Noise on green runs. | |
| Markdown report committed to docs/ directory | Historical audit trail forever. Bloats the repo. | |
| No file ever, stdout only | Pure CLI. Brittle parsing if format changes. | |

**User's choice:** Nothing on success; report on failure (Recommended)

---

## Loader file structure & deltas

### Q21: File mirror fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Verbatim mirror of all 4 files | Copy categories.ts, schema.ts, videos.ts, index.ts byte-for-byte. New `_three`-specific helpers go in NEW files. | ✓ |
| Mirror structure but tune comments | Same 4 files, same exports, but rewrite docstrings to reference `_three`'s artifacts. | |
| Collapse into fewer files | Merge categories + schema + videos into one `videos.ts`. Less navigable, breaks "compiles unchanged" guarantee for sub-file imports. | |

**User's choice:** Verbatim mirror of all 4 files (Recommended)

### Q22: _three-specific helpers

| Option | Description | Selected |
|--------|-------------|----------|
| No deltas in Phase 2 — add later when callers exist | Phase 3 will know exactly what windowing/ordering helpers it needs. Helpers added later go in NEW files. | ✓ |
| Add `getAdjacentVideos(id, n)` helper now | For REEL-03 viewport-windowing. Speculative — Phase 3 may want different ergonomics. | |
| Add `getReelOrder()` returning cinematic ordering | _three-specific sort (featured first, category-clustered). Speculative until cinematic-ordering decisions land. | |

**User's choice:** No deltas in Phase 2 (Recommended)

### Q23: Tests

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror all 4 test files verbatim | Copy categories.test.ts, schema.test.ts, videos.test.ts, videos.json.test.ts. They already encode the contract. | ✓ |
| Mirror, then add _three-specific tests | Copy all 4 files, add new tests for `_three`-only concerns (e.g., assert .videos-source-sha exists). | |
| Skip tests in Phase 2, add in Phase 3 | Lean Phase 2: just videos.json + schema + loader + plugin. Loses "breaking a record fails build" verification. | |

**User's choice:** Mirror all 4 test files verbatim (Recommended)

### Q24: Public surface count

| Option | Description | Selected |
|--------|-------------|----------|
| Exact same as _four (11 named values + types) | DATA-03 success criterion is literal: "compiles unchanged against _four's import shape." | ✓ |
| Mirror + add _three-only exports later | Same 11 on day one; new exports get added to index.ts as Phase 3+ needs surface. | |
| Only export what _three actually uses | Skip anything Phase 3+ doesn't consume. Smaller surface. Breaks DATA-03. | |

**User's choice:** Exact same as _four (Recommended)

---

## Claude's Discretion

User explicitly deferred to Claude on:
- Exact subdirectory name where `_four` gets cloned in the drift-check CI job.
- Specific cron schedule for the nightly oEmbed Action.
- `p-limit` (npm) vs hand-rolled 30-line concurrency queue.
- Specific User-Agent header on oEmbed requests.
- HTTP timeout per request (10s suggested).
- Exact 410 Gone classification mapping.
- Exact wording of the auto-Issue body template.
- Optional `--verbose` / `--json` flags on `pnpm check:embeds`.
- Internal helper functions inside `scripts/check-embeds.ts`.
- Any minor `vitest.config` adjustments if `_three`'s test layout differs from `_four`'s.

## Deferred Ideas

Captured in `02-CONTEXT.md` `<deferred>` section:
- Cinematic-immersive loader helpers — Phase 3.
- `--allow-drift` PR label / intentional drift override — out of scope for v1.
- `pnpm sync:videos` script — explicitly rejected for now.
- Shared schema repo — heavy infra, only if a third sibling appears.
- `getAllVideosIncludingHidden()` helper — `_four` already defers; `_three` inherits.
- Lighthouse / axe-core CI — Phase 7.
- Production deploy gate on oEmbed check — Phase 7.
- Slack/email reporting for nightly failures — auto-Issue sufficient for v1.
- `--verbose` / `--json` flags — planner's discretion.
- Cache for embed-check between runs — explicitly rejected.
