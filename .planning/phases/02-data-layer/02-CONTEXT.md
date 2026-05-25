# Phase 2: Data Layer - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Mirror `_four`'s data layer (`videos.json`, Zod schema, `$lib/data` typed loader, Vite build-fail plugin) byte-for-byte into `_three`, then add two `_three`-specific guards `_four` doesn't have:

1. **Cross-repo drift CI** (DATA-04 / Trap A mitigation) — every PR + every push to main fails if `_three`'s `videos.json` no longer matches `_four`'s pinned-SHA copy.
2. **oEmbed health-check** (Pitfall 6 mitigation) — nightly + pre-deploy check that every video's embed is still reachable at the provider; catches "owner disabled embedding" before it ships as a runtime black box.

In scope:
- Copy `videos.json` from `_four` byte-for-byte at Phase 2 commit time, recording the source SHA in a sidecar file (`src/lib/data/.videos-source-sha`).
- Mirror `categories.ts`, `schema.ts`, `videos.ts`, `index.ts` (and their `.test.ts` counterparts) verbatim from `_four/src/lib/data/`.
- Wire the `validateVideosPlugin()` from `_four/vite.config.ts` into `_three/vite.config.ts` verbatim (sits between `tailwindcss()` and `sveltekit()`).
- Add a `drift-check` job to `.github/workflows/deploy.yml` that re-clones `_four` at the pinned SHA and byte-compares.
- Add a standalone `scripts/check-embeds.ts` script + nightly GH Action that hits Vimeo/YouTube oEmbed endpoints and opens a GitHub Issue on failure.

Out of scope (other phases):
- Any cinematic-immersive helpers (`getAdjacentVideos`, `getReelOrder`, viewport-windowing helpers) — deferred to Phase 3 where actual callers will know the exact ergonomics they need. Phase 2 adds zero `_three`-specific helpers.
- `<ReelStage />`, `<ReelSection />`, iframe lifecycle, poster fallback — Phase 3.
- Filter routes consuming `getByCategory()` — Phase 4.
- `/watch/[id]` consuming `getById()` — Phase 5.
- Lighthouse CI / axe-core CI — Phase 7 (the drift-check + oEmbed-check land standalone in Phase 2).
- Production cutover infra (`michellengo.net`) — Phase 7.

</domain>

<decisions>
## Implementation Decisions

### videos.json sync mechanism
- **D-01:** Day-one acquisition is a single plain `cp ../michelle_ngo_four/src/lib/data/videos.json src/lib/data/videos.json` step inside the Phase 2 plan task. No `pnpm sync:videos` script, no git-subtree, no runtime URL fetch — the goal is "real commit, transparent provenance," matching how Phase 1 mirrored `_four`'s config files.
- **D-02:** Ongoing sync (after Phase 2 ships) is also manual `cp` + PR per change. The PR title is `sync: pull _four videos.json @ <SHA>`. The cross-repo drift CI from D-09 catches the case where someone forgets. Matches `PROJECT.md` L110: "copied into `src/lib/data/videos.json` at Phase 2 and held in sync via manual review (no symlink; SvelteKit static builds work better with files in-tree)."
- **D-03:** `_four` is always the canonical source-of-truth; `_three` only ever pulls. Documented at `PROJECT.md` L110 + `REQUIREMENTS.md` DATA-01. Direction stops mattering after A/B cutover (the losing repo is abandoned), so no need for a "either can be canonical" marker.
- **D-04:** Source provenance is recorded in a sidecar file `src/lib/data/.videos-source-sha`. NOT a header comment inside `videos.json` itself — DATA-01 requires byte-identity to `_four`, so the JSON file cannot carry `_three`-specific metadata. The sidecar is the only place this lives.
- **D-05:** Phase 2's day-one `cp` pulls from `_four`'s current `main` HEAD at the commit time of the Phase 2 sync task. Recorded as the initial value of `four_commit_sha` in the sidecar. Not pinned to a frozen kickoff SHA — that would force an immediate sync-forward if `_four` advanced during Phase 1, which it did.
- **D-06:** Sidecar shape is three lines of `key=value`:
  ```
  four_commit_sha=<40-char hex>
  videos_json_sha256=<64-char hex>
  synced_at=<ISO 8601 date, e.g. 2026-05-25>
  ```
  SHA proves provenance against `_four`; `sha256` of the local `videos.json` catches accidental local edits between syncs; date orients human readers. Format is plain text (not JSON / not YAML) to keep the diff readable and to dodge "is this config or data?" parsing ambiguity.
- **D-07:** If `_four`'s referenced SHA is force-pushed away (no longer reachable), the drift CI fails loud with a concrete fix-it message: `ERROR: _four@<sha> no longer reachable. Re-sync from _four's current main and update .videos-source-sha.` No fallback to "compare against current main" — `_four` force-pushing `main` is a rare drama that warrants a human pause, not a silent recovery.
- **D-08:** Sidecar location is `src/lib/data/.videos-source-sha` (co-located with `videos.json`). Drift-CI script + future sync script both live at `scripts/`; the data files travel together. The dotfile prefix keeps it out of casual code scans without burying it.

### Cross-repo drift CI (DATA-04)
- **D-09:** CI accesses `_four`'s `videos.json` via a second `actions/checkout@v4` step that clones `wolfwdavid/michelle_ngo_four` into a subdirectory (`__four/` — Claude's discretion on exact path), pinned to the SHA read from `.videos-source-sha`. Native, no auth dance for a public repo, deterministic. Not raw GitHub URL fetch (CDN cache could mask staleness within minutes), not submodule (heavy machinery for one file), not GitHub API contents endpoint (rate-limit pain).
- **D-10:** Drift check runs on every PR AND every push to `main`. Same posture as Phase 1's D-17 grep gate — uniform gate, catches drift before merge AND before deploy. Not PR-only (loses the safety net for direct main pushes), not main-only (slower PR feedback), not nightly-only (a PR could ship and be live for hours before drift gets flagged).
- **D-11:** Drift check lives as a new `drift-check` job inside the existing `.github/workflows/deploy.yml` workflow file, NOT a separate `drift-check.yml`. Phase 1 STATE note already committed to "single CI workflow covers PR-time + deploy gates" — drift-check follows that posture. The job is a sibling to the existing build / smoke-test jobs, so branch protection sees a single workflow surface.
- **D-12:** Failure message is the concrete fix instruction (not a diff snippet, not a link to a runbook). Exact wording template:
  ```
  ::error::videos.json drift: src/lib/data/videos.json does not match
  _four@<sha>. Re-sync: cp ../michelle_ngo_four/src/lib/data/videos.json
  src/lib/data/videos.json && update src/lib/data/.videos-source-sha
  (refresh four_commit_sha, videos_json_sha256, synced_at). Then commit and push.
  ```
  GitHub Actions `::error::` annotation surfaces inline on the PR. Names the file, names the SHA, gives the literal `cp` command. No external runbook needed.

### oEmbed health-check (Pitfall 6)
- **D-13:** Runs in three contexts, NOT every dev build:
  1. **Nightly:** Scheduled GH Action runs `pnpm check:embeds` once per day (UTC midnight — Claude's discretion on exact cron).
  2. **Opt-in locally:** `pnpm check:embeds` (or `OEMBED_CHECK=1 pnpm build`, see D-18 on which mechanism) lets a developer trigger it on demand.
  3. **Pre-production deploy:** When Phase 7's `deploy-production.yml` workflow lands, it runs the check as a gate before publishing. Phase 2 wires the nightly job; Phase 7 adds the deploy-gate caller.
  Rationale: 56 outbound HTTPS calls per dev `pnpm build` would melt DX and waste rate budget. Nightly + opt-in + pre-deploy is the right cadence for "is the catalog still embeddable today."
- **D-14:** Network failure classification uses a retry-then-classify strategy:
  - 3 retries with exponential backoff (1s, 2s, 4s).
  - After exhaustion:
    - HTTP 401 / 403 → "embed disabled by owner" → script exit non-zero, this video reported as failure.
    - HTTP 404 → "video removed" → script exit non-zero, this video reported as failure.
    - HTTP 5xx OR network error (DNS, TLS, socket) → "transient" → log a warning, do NOT fail the run for this video.
    - HTTP 410 Gone → treat as "removed" (Claude's discretion to map into the 404 bucket).
  - Reasoning: the goal is catching "owner flipped the embed disabled" as a hard signal, while tolerating Vimeo/YouTube's occasional 5xx hiccups so we don't get flaky-CI fatigue and start ignoring the gate.
- **D-15:** Concurrency limit is 6 simultaneous requests, applied per-host (Vimeo bucket + YouTube bucket independently, NOT shared global). Either via `p-limit` (npm) or a 30-line hand-rolled batched promise queue — Claude's discretion. With 56 requests / 6 concurrent / ~300ms avg latency, total run time ≈ 3-4 seconds. Well under Vimeo's documented ~5 req/sec per-IP throttle and YouTube oEmbed's hourly quota.
- **D-16:** No caching between runs. Every invocation re-checks all 56 videos fresh. The whole point is catching the moment an embed flips to disabled — a cached pass on a since-disabled video is exactly the bug the check exists to catch. Concurrency limit keeps the no-cache cost acceptable.
- **D-17:** Endpoints are the official oEmbed JSON URLs per provider:
  - **Vimeo:** `https://vimeo.com/api/oembed.json?url=https://vimeo.com/<id>` — returns 403 if owner disabled embedding, 404 if removed.
  - **YouTube:** `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json` — returns 401 if embedding disabled, 404 if removed.
  Provider-supported, intended for exactly this kind of check, doesn't require an API key. NOT the direct `player.vimeo.com` / `youtube.com/embed` URLs — those return 200 even for disabled videos (you'd have to parse the HTML body for an error string).
- **D-18:** Implementation is a **standalone Node script** at `scripts/check-embeds.ts`, invoked by `pnpm check:embeds` (added to `package.json` scripts) and by the nightly GH Action. NOT an extension of `validateVideosPlugin()` and NOT a second Vite plugin. Two reasons: (a) the Vite plugin stays single-purpose (schema validation only — easy to audit), (b) an env-var-gated plugin invites the "OEMBED_CHECK=1 accidentally left on in production" footgun. Standalone script can't be accidentally triggered by a normal `pnpm build`.
- **D-19:** Nightly Action failure reporting: auto-open a GitHub Issue via `gh issue create` with a templated body (timestamp, failing-record table: source / id / title / response code / failure-mode classification). If a prior open Issue with title prefix `[embed-check]` already exists, the Action comments on it instead of opening a duplicate (uses `gh issue list --label embed-check --state open` to detect). Single tracked artifact per current outage; surfaces in the repo's Issues tab; assignable.
- **D-20:** Disk artifacts:
  - **On success:** nothing written. Script prints a one-line summary (`✓ 56/56 videos embeddable`) and exits 0.
  - **On failure:** writes `.embed-check-report.json` at repo root with structured failure data (`{ ranAt, failures: [{ source, id, title, status, classification }] }`). Nightly Action reads this file to template the GitHub Issue body.
  - `.embed-check-report.json` is gitignored — never committed.

### Loader file structure & deltas
- **D-21:** Verbatim mirror of `_four`'s 4-file loader split — copy `categories.ts`, `schema.ts`, `videos.ts`, `index.ts` byte-for-byte from `../michelle_ngo_four/src/lib/data/`. The only edit allowed during the copy is fixing path-relative comments if any reference `_four`-specific paths (none currently spotted — verify during plan). Comments / docstrings stay verbatim; even references to `_four`'s D-numbers stay (they're correct provenance, not stale).
- **D-22:** Zero `_three`-specific helpers added in Phase 2. No `getAdjacentVideos`, no `getReelOrder`, no viewport-windowing helpers. Phase 3 (Reel System Core) will know exactly what ergonomics it needs and add them then — speculative helpers would violate "no premature abstraction" (and risk diverging from `_four` in ways that complicate DATA-03 drop-in compat).
- **D-23:** Tests: mirror all 4 `_four` test files verbatim — `categories.test.ts`, `schema.test.ts`, `videos.test.ts`, `videos.json.test.ts`. They already encode the cross-row uniqueness check, loader narrowing checks under `noUncheckedIndexedAccess`, hidden-filter checks, slug round-trip checks, and the D-04 display-order check. If `_three`'s tests pass, the loader matches `_four`'s contract — that IS the DATA-03 verification.
- **D-24:** `index.ts` re-exports exactly the same 11 named values + types as `_four` (the public surface count is 11, not 9 — recount): `Video`, `Category`, `CATEGORIES`, `categoryToSlug`, `slugToCategory`, `videos`, `producerReelId`, `getById`, `getByCategory`, `getCategoriesInDisplayOrder`, `getCategoriesWithCounts`. Any future `_three`-specific exports added later go through a new file (e.g., `reel-helpers.ts`) so the original 11 stay stable and DATA-03's "compiles unchanged against `_four`'s import shape" guarantee holds forever.

### Claude's Discretion
- Exact subdirectory name where `_four` gets cloned in the drift-check CI job (`__four/`, `tmp/_four/`, `external/_four/` — any sensible, gitignored path).
- Specific cron schedule for the nightly oEmbed Action (UTC midnight is fine; could shift to off-peak Vimeo/YouTube hours if needed).
- Whether to use `p-limit` from npm or a hand-rolled 30-line concurrency queue for D-15.
- Specific User-Agent header on oEmbed requests (`michelle_ngo_three-embed-check/1.0` or similar — be a polite citizen).
- HTTP timeout per request (10s is a reasonable default).
- Exact 410 Gone → "removed" mapping (D-14 suggests it; planner confirms).
- Exact wording of the auto-Issue body template (D-19 specifies the data shape; wording can be tightened).
- Whether the `pnpm check:embeds` script command alias also accepts `--verbose` / `--json` flags.
- Internal helper functions inside the script (`scripts/check-embeds.ts` may import from `$lib/data` or re-parse `videos.json` directly — planner's call).
- Any minor `vitest.config` adjustments needed if `_four`'s test file paths or `$lib` alias resolution differ slightly in `_three`'s setup.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 2 requirements + success criteria
- `.planning/ROADMAP.md` §Phase 2: Data Layer — goal, depends-on, 5 success criteria, DATA-01 through DATA-04 mapping
- `.planning/REQUIREMENTS.md` §Data Layer — DATA-01 (byte-identical), DATA-02 (Zod + Vite build-fail plugin), DATA-03 (drop-in `$lib/data` loader surface), DATA-04 (cross-repo drift CI)

### Project-wide context (locked constraints)
- `.planning/PROJECT.md` §Constraints — "`videos.json` byte-identical to `_four`'s; same Zod schema; same Vite build-fail plugin"
- `.planning/PROJECT.md` L110 — "Source-of-truth: `../michelle_ngo_four/src/lib/data/videos.json` — copied into `src/lib/data/videos.json` at Phase 2 and held in sync via manual review (no symlink; SvelteKit static builds work better with files in-tree)"
- `.planning/PROJECT.md` §Key Decisions — "Reuse `_four`'s videos.json byte-for-byte; cross-repo CI drift guard required (Trap A)"
- `.planning/STATE.md` §Blockers — Trap A drift CI mandate; "REQUIREMENTS.md count drift — file said '41 total' but actually has 42 v1 requirements" (informational)

### Sibling-project reference (VERBATIM source of truth)
- `../michelle_ngo_four/src/lib/data/videos.json` — the 56-video catalog to copy byte-for-byte (DATA-01)
- `../michelle_ngo_four/src/lib/data/categories.ts` — 8-category taxonomy + `categoryToSlug` rule, copy verbatim (D-21)
- `../michelle_ngo_four/src/lib/data/schema.ts` — Zod 4 `VideoSchema` with `z.strictObject` + `z.discriminatedUnion('source', ...)` + `z.iso.date()`, copy verbatim (D-21)
- `../michelle_ngo_four/src/lib/data/videos.ts` — typed loader with `videos`, `producerReelId='264677021'`, `getById`, `getByCategory`, `getCategoriesInDisplayOrder`, `getCategoriesWithCounts`, copy verbatim (D-21, D-24)
- `../michelle_ngo_four/src/lib/data/index.ts` — public surface re-exporting the 11 names listed in D-24, copy verbatim
- `../michelle_ngo_four/src/lib/data/categories.test.ts` — slug round-trip + display-order tests, copy verbatim (D-23)
- `../michelle_ngo_four/src/lib/data/schema.test.ts` — Zod parsing + strict-object + discriminated-union tests, copy verbatim (D-23)
- `../michelle_ngo_four/src/lib/data/videos.test.ts` — loader behavior + hidden filter + narrowing tests, copy verbatim (D-23)
- `../michelle_ngo_four/src/lib/data/videos.json.test.ts` — cross-row uniqueness `(source, id)` test, copy verbatim (D-23)
- `../michelle_ngo_four/vite.config.ts` — `validateVideosPlugin()` definition + `tailwindcss() → validateVideosPlugin() → sveltekit()` plugin order; copy the plugin block verbatim into `_three/vite.config.ts` (DATA-02). Also defines the Vitest two-project split (data=node, ui=jsdom) — Phase 1 already adopted this pattern; Phase 2 just ensures the `data` project picks up the new test files.
- `../michelle_ngo_four/.planning/phases/02-data-layer/02-CONTEXT.md` — sibling Phase 2's decision inventory (`_four`'s D-01 through D-15 are the inheritance baseline for the schema and loader; helpful background for planner)
- `../michelle_ngo_four/.planning/phases/02-data-layer/02-RESEARCH.md` — sibling Phase 2's research on schema-forward defaults (D-08 in `_four`), Pitfall 2 (Zod default materialization), Vite plugin lifecycle hook choice; useful prior art the `_three` researcher can read instead of re-researching

### Phase 1 carry-forward decisions
- `.planning/phases/01-foundation/01-CONTEXT.md` — Phase 1 D-17 grep gate is the model for D-10 / D-11 here (CI workflow posture, error-annotation style)
- `.planning/phases/01-foundation/01-CONTEXT.md` §Established Patterns — "Tailwind v4 plugin order: `tailwindcss()` BEFORE `sveltekit()`" — the `validateVideosPlugin()` from `_four` slots between them
- `.planning/phases/01-foundation/01-CONTEXT.md` §Integration Points — pnpm-lock.yaml ↔ pnpm/action-setup@v4, GH Actions versions to match for the new drift-check job

### CI / workflow reference
- `../michelle_ngo_four/.github/workflows/deploy.yml` — base workflow shape Phase 1 already mirrored; Phase 2 adds a `drift-check` job (D-11) to `_three`'s existing `.github/workflows/deploy.yml`
- `.github/workflows/deploy.yml` (existing, Phase 1) — the file the new `drift-check` job lands in

### oEmbed provider docs (for the script)
- Vimeo oEmbed: `https://developer.vimeo.com/api/oembed/videos` — JSON endpoint contract, error codes, embed-disabled signal
- YouTube oEmbed: `https://developers.google.com/youtube/v3/guides/ratelimit` (rate limits) + the public `https://www.youtube.com/oembed` endpoint (no auth needed for the format=json variant)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (verbatim copy from `_four`)
- `_four/src/lib/data/videos.json` — 56-video catalog, 710 lines, sha256 stable. The byte-for-byte source.
- `_four/src/lib/data/categories.ts` — 8 categories + `categoryToSlug` rule + `slugToCategory` memo'd lookup. Zero edits.
- `_four/src/lib/data/schema.ts` — Zod 4 schema with `z.iso.date()` (Zod 4 idiom — confirm `_three`'s `package.json` already has `zod@4.4.3` from Phase 1 lock; it does). Zero edits.
- `_four/src/lib/data/videos.ts` — loader. Notable: `getCategoriesInDisplayOrder()` computes once at module load (count-desc, ties-alpha) over the validated public dataset. `producerReelId='264677021'` is a literal const. Zero edits.
- `_four/src/lib/data/index.ts` — public surface, 11 names. Zero edits.
- `_four/src/lib/data/*.test.ts` (4 files) — full test suite. Zero edits (modulo path-relative checks during cp).
- `_four/vite.config.ts` `validateVideosPlugin()` (lines 33-65) — the Rollup `buildStart`-hook plugin that runs `VideoArraySchema.safeParse()` + `(source, id)` uniqueness check + emits `z.prettifyError(...)` via `this.error()`. Copy this block into `_three/vite.config.ts` between `tailwindcss()` and `sveltekit()`.

### Built day-one in `_three` (no `_four` analogue)
- `src/lib/data/.videos-source-sha` — sidecar pinning the `_four` commit SHA + content hash + sync date (D-04 through D-08). No analogue in `_four` because `_four` has no upstream sibling to track.
- `.github/workflows/deploy.yml` `drift-check` job — clones `_four` at the pinned SHA, byte-compares `videos.json`, fails loud with the D-12 error message. No analogue in `_four` (it IS the upstream).
- `scripts/check-embeds.ts` — standalone Node script (D-18). Imports `videos.json` (or `videos` from `$lib/data`), concurrency-limited fetches the Vimeo + YouTube oEmbed endpoints, classifies failures (D-14), writes `.embed-check-report.json` on failure.
- `.github/workflows/oembed-check.yml` (or a job in `deploy.yml` — planner's call) — scheduled (nightly cron) GH Action that runs `pnpm check:embeds` and opens/comments a GitHub Issue on failure.
- `.gitignore` line for `.embed-check-report.json`.
- `pnpm check:embeds` script entry in `package.json`.

### Established Patterns (Phase 1 inherits)
- Tailwind v4 plugin order: `tailwindcss()` BEFORE `sveltekit()` (Phase 1 mirrors `_four`). The `validateVideosPlugin()` slots between them per `_four`'s comment "we put it immediately before `sveltekit()` so the validation failure aborts the build BEFORE Svelte starts compiling routes that import the data."
- Vitest two-project split (`data` = node env, `ui` = jsdom env) already present in `_three`'s `vite.config.ts` from Phase 1 (mirrored from `_four`). The 4 new `.test.ts` files land in the `data` project's `include: ['src/lib/data/**/*.{test,spec}.{js,ts}']` pattern automatically.
- TS strict + `noUncheckedIndexedAccess` (Phase 1 D-from-tsconfig) means `getById` returns `Video | undefined` — Phase 3+ callers MUST narrow. The mirrored docstrings already say this.
- GH Actions workflow posture from Phase 1 D-from-deploy.yml: single `deploy.yml`, `pnpm/action-setup@v4` + `actions/setup-node@v4` + Node 22 + pnpm 11.0.9, `concurrency: { group: pages, cancel-in-progress: false }`. The new `drift-check` and oEmbed jobs reuse this baseline.

### Integration Points
- **`$lib/data` ↔ Phase 3 `<ReelSection />`:** Phase 3 imports `videos` and (likely) adds a viewport-windowing helper in a new file — `_three`'s D-22 explicitly defers helper additions.
- **`$lib/data` ↔ Phase 4 `/work/[category]`:** Phase 4 imports `getByCategory()` + `categoryToSlug()` + `slugToCategory()` for the 8 prerendered routes. Drop-in compat from DATA-03 means Phase 4's import statements can be authored against `_four`'s shape without code changes.
- **`$lib/data` ↔ Phase 5 `/watch/[id]`:** Phase 5 imports `getById()` + `producerReelId` for the HeroAmbient default-load case.
- **`.videos-source-sha` ↔ drift-check job (Phase 2 internal):** drift-check reads the SHA from this file, passes it to `actions/checkout` as `ref:`, byte-compares the resulting `__four/src/lib/data/videos.json` against `_three`'s.
- **`scripts/check-embeds.ts` ↔ Phase 7 `deploy-production.yml`:** Phase 7's production deploy workflow will gate on this script before publishing. Phase 2 ships the script + nightly Action; Phase 7 adds the pre-deploy caller.
- **GH Actions `gh issue create` ↔ nightly Action:** the runner has `gh` CLI pre-installed and `GITHUB_TOKEN` scoped to issues — no extra setup needed.

</code_context>

<specifics>
## Specific Ideas

- Sidecar plain-text format (D-06) over JSON/YAML because the diff readability matters more than parseability — a sync PR with a 3-line `.videos-source-sha` change is more legible than a JSON object diff with quotes and braces. The sync script (if one is ever added) can `awk -F= '/four_commit_sha/ {print $2}' .videos-source-sha` trivially.
- Failure-message wording (D-12) includes the literal `cp` command on purpose — when a developer sees a red CI in the middle of a feature PR, "do exactly this" is more useful than "see runbook." Inspired by the Phase 1 D-17 grep-gate annotation style ("the helper-only path; cannot be silently violated by a forgetful commit").
- oEmbed check runs nightly (D-13) rather than every build because the underlying signal (owner disabled embedding) doesn't change minute-to-minute. The cost-benefit only breaks for the production cutover deploy, which Phase 7 wires up explicitly.
- Verbatim mirror (D-21 through D-24) instead of "mirror structure but rewrite docstrings" because the DATA-03 success criterion is literal: "a component written against `_four`'s import shape compiles unchanged against `_three`." Identical files are the simplest way to make that mechanically true. The docstrings citing `_four`'s D-numbers stay because they're correct historical provenance — they're not stale references, they're the citation chain.
- `_four` is always canonical (D-03) — this is settled at PROJECT.md level. Documenting it explicitly here so a Phase 3+ contributor isn't tempted to "fix a typo in `videos.json` in `_three`" — the fix goes to `_four` first, then re-syncs.

</specifics>

<deferred>
## Deferred Ideas

- **Cinematic-immersive loader helpers** (`getAdjacentVideos(id, n)`, `getReelOrder()`, viewport-windowing helpers) — Phase 3 (REEL-03). Will add to a new file, not edit the mirrored loader.
- **A way to mark intentional drift** — e.g., a `--allow-drift` PR label that the drift-check honors. Not needed for v1; if a `_three`-specific data delta is ever required, the question reopens (and we'd probably reject it on PROJECT.md L110 grounds).
- **`pnpm sync:videos` script** — explicitly rejected for now (D-01, D-02 prefer raw `cp`). Revisit if the sync becomes routine enough that the script earns its keep.
- **Shared schema repo** (D-03 alternative) — heavy infra; only revisit if a third sibling appears or the A/B winner has to share assets with a non-trivial successor build.
- **`getAllVideosIncludingHidden()` helper** — `_four` already has `allVideos: readonly Video[]` defined but explicitly NOT re-exported from `$lib/data/index.ts` ("reserved for future tooling"). `_three` inherits the same posture — defer until a caller exists.
- **Lighthouse CI / axe-core CI** — Phase 7 (POL-02, POL-04). Phase 2 ships the drift-check + oEmbed-check standalone.
- **Production deploy gate on oEmbed check** — Phase 7. Phase 2 wires the nightly Action; Phase 7 adds `deploy-production.yml`'s pre-deploy caller.
- **Slack/email reporting for nightly oEmbed failures** — out of scope; auto-Issue (D-19) is sufficient for v1. Revisit if response latency matters more.
- **`--verbose` / `--json` flags on `pnpm check:embeds`** — Claude's discretion in plan-phase; not load-bearing.
- **Cache for embed-check between runs** — explicitly rejected (D-16). Concurrency limit makes no-cache acceptable.

</deferred>

---

*Phase: 02-data-layer*
*Context gathered: 2026-05-25*
