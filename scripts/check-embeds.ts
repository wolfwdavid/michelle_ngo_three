#!/usr/bin/env node
/**
 * oEmbed health-check + poster-fetch script.
 *
 * Phase 2 (D-13..D-20; Pitfall 6 mitigation):
 *   For each video in src/lib/data/videos.json, probes the official oEmbed JSON
 *   endpoint (Vimeo or YouTube) with up to 3 retries + exponential backoff.
 *
 * Plan 03-03 Task 3 EXTENSION (D-01..D-04; Pitfall 16):
 *   --posters-only flag fetches Vimeo thumbnail_url (from the SAME oEmbed
 *   response) and YouTube i.ytimg.com/vi/{id}/maxresdefault.jpg (with
 *   hqdefault.jpg fallback per Pitfall 16) into static/posters/{source}-{id}.jpg
 *   AND atomically updates src/lib/data/posters.json sidecar
 *   (Record<string, string> matching 03-01 D-02 contract).
 *
 *   Default invocation (no flag) runs BOTH: oEmbed health-check first, then
 *   poster fetch (reusing Vimeo oEmbed responses from the health-check pass to
 *   avoid double-hitting Vimeo's endpoint per D-15 politeness).
 *
 *   --posters-only invocation skips the health-check, fetches Vimeo oEmbed
 *   fresh just to get thumbnail_url, then writes posters.
 *
 * Per-host concurrency limit: 6 (D-15). Vimeo bucket and YouTube bucket are
 * tracked independently — both can run 6 in parallel = up to 12 in flight.
 *
 * Classification (D-14):
 *   401 / 403 → "embed_disabled" — script fails (this video reported)
 *   404       → "removed"        — script fails (this video reported)
 *   410       → "removed"        — script fails (mapped into 404 bucket per CONTEXT discretion)
 *   5xx / DNS / network / timeout → "transient" — warning, does NOT fail the run
 *   200       → "ok"             — success
 *
 * Output (D-20):
 *   - All-pass: prints "✓ N/N videos embeddable" (+ poster summary) and exits 0.
 *     Writes no .embed-check-report.json on success (Phase 2 contract preserved).
 *   - Any oEmbed health-check failure: writes .embed-check-report.json + exits 1.
 *   - Any poster fetch failure: prints the failing videos; exits 1.
 *
 * No caching (D-16). Every invocation re-checks all videos fresh.
 *
 * Invoked by:
 *   pnpm check:embeds                                 (local opt-in, D-13)
 *   pnpm check:embeds --posters-only                  (Plan 03-03 Task 4 — populate static/posters)
 *   .github/workflows/oembed-check.yml (nightly cron) (D-13)
 *   .github/workflows/deploy-production.yml           (Phase 7, future)
 */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const VIDEOS_JSON = resolve(REPO_ROOT, 'src/lib/data/videos.json');
const POSTERS_JSON = resolve(REPO_ROOT, 'src/lib/data/posters.json');
const POSTERS_JSON_TMP = resolve(REPO_ROOT, 'src/lib/data/posters.json.tmp');
const POSTERS_DIR = resolve(REPO_ROOT, 'static/posters');
const REPORT_FILE = resolve(REPO_ROOT, '.embed-check-report.json');

const PER_HOST_CONCURRENCY = 6; // D-15
const MAX_RETRIES = 3; // D-14 (3 retries with exponential backoff)
const BACKOFF_MS = [1000, 2000, 4000]; // D-14 (1s, 2s, 4s)
const REQUEST_TIMEOUT_MS = 10_000; // HTTP timeout 10s default
const POSTER_FETCH_TIMEOUT_MS = 15_000; // Image bytes can be larger; allow more time.
const USER_AGENT =
  'michelle_ngo_three-embed-check/1.0 (https://wolfwdavid.github.io/michelle_ngo_three/)';
const POSTER_USER_AGENT =
  'michelle_ngo_three-poster-fetch/1.0 (https://wolfwdavid.github.io/michelle_ngo_three/)';

type Source = 'vimeo' | 'youtube';
type Classification = 'ok' | 'embed_disabled' | 'removed' | 'transient';

interface VideoRecord {
  source: Source;
  id: string;
  title: string;
}

interface ProbeResult {
  source: Source;
  id: string;
  title: string;
  status: number | null; // null = network error / DNS / timeout
  classification: Classification;
  attempts: number;
  error?: string;
  // Plan 03-03: cache Vimeo's thumbnail_url from the oEmbed response so the
  // poster-fetch pass doesn't re-hit Vimeo for the same data (D-15 politeness).
  vimeoThumbnailUrl?: string;
}

interface CliOpts {
  postersOnly: boolean;
}

/** Plan 03-03 D-02 sidecar shape: Record<{source}-{id}, "/posters/{source}-{id}.jpg">. */
type PostersSidecar = Record<string, string>;

function parseArgs(argv: string[]): CliOpts {
  return { postersOnly: argv.includes('--posters-only') };
}

function oembedUrl(v: VideoRecord): string {
  // D-17: official oEmbed JSON endpoints.
  if (v.source === 'vimeo') {
    return `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${v.id}`;
  }
  // YouTube
  return `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v.id}&format=json`;
}

function classify(status: number | null): Classification {
  if (status === null) return 'transient';
  if (status >= 200 && status < 300) return 'ok';
  // D-14: 401/403 → embed_disabled.
  if (status === 401 || status === 403) return 'embed_disabled';
  // D-14 + 410 mapping: 404, 410 → removed.
  if (status === 404 || status === 410) return 'removed';
  // 5xx + anything else → transient (do not fail the run).
  return 'transient';
}

/**
 * Single fetch with timeout. Returns the Response on success (any status code,
 * including non-2xx — caller decides via classify()), or null on
 * network/DNS/timeout/abort. Plan 03-03 extension: callers may need the
 * response body for Vimeo's thumbnail_url, so we return Response (not just
 * the status int like the Phase 2 fetchOnce did).
 */
async function fetchOnce(
  url: string,
  opts: { userAgent?: string; accept?: string; timeoutMs?: number } = {}
): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': opts.userAgent ?? USER_AGENT,
        Accept: opts.accept ?? 'application/json',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    return res;
  } catch {
    return null; // network error, DNS, timeout, abort
  } finally {
    clearTimeout(timer);
  }
}

async function probe(v: VideoRecord): Promise<ProbeResult> {
  const url = oembedUrl(v);
  let lastStatus: number | null = null;
  let lastError: string | undefined;
  let attempts = 0;
  let vimeoThumbnailUrl: string | undefined;

  for (let i = 0; i <= MAX_RETRIES; i++) {
    attempts = i + 1;
    const res = await fetchOnce(url);
    const status = res?.status ?? null;
    lastStatus = status;
    const cls = classify(status);

    // Hard signals: stop retrying immediately.
    if (cls === 'ok' || cls === 'embed_disabled' || cls === 'removed') {
      // Plan 03-03: cache Vimeo's thumbnail_url for the poster-fetch pass.
      if (cls === 'ok' && v.source === 'vimeo' && res) {
        try {
          const j = (await res.json()) as { thumbnail_url?: string };
          vimeoThumbnailUrl = j.thumbnail_url;
        } catch {
          // Body parse failure → just skip caching; poster pass will refetch.
        }
      }
      return {
        source: v.source,
        id: v.id,
        title: v.title,
        status,
        classification: cls,
        attempts,
        vimeoThumbnailUrl,
      };
    }

    // Transient: retry with backoff if attempts remain.
    if (i < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[i] ?? 4000));
    } else {
      lastError = status === null ? 'network/timeout' : `http ${status}`;
    }
  }

  return {
    source: v.source,
    id: v.id,
    title: v.title,
    status: lastStatus,
    classification: 'transient',
    attempts,
    error: lastError,
  };
}

/**
 * Per-host concurrency queue (D-15). Returns a function that, given a video,
 * schedules its probe through the host's lane. The two hosts run independently
 * (both up to 6 in flight at once).
 */
function makeHostQueue(limit: number) {
  let active = 0;
  const waiters: Array<() => void> = [];
  return async function <T>(fn: () => Promise<T>): Promise<T> {
    if (active >= limit) await new Promise<void>((r) => waiters.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      waiters.shift()?.();
    }
  };
}

// ---------------------------------------------------------------------------
// Plan 03-03 Task 3 — Poster fetch pipeline (D-01..D-04 + Pitfall 16)
// ---------------------------------------------------------------------------

/**
 * Fallback: scrape the og:image meta tag from the Vimeo video page HTML.
 *
 * Used when oEmbed returns a domain-restricted response that omits
 * `thumbnail_url` (some videos have stricter embed allow-lists). The og:image
 * URL points at i.vimeocdn.com — Vimeo's OFFICIAL CDN (NOT vumbnail.com,
 * which is the unofficial third-party shortener that Pitfall 16 / anti-pattern
 * grep gates ban). Both are reachable unauthenticated; we use the official one.
 *
 * Returns the i.vimeocdn.com URL or null if scrape failed.
 */
async function scrapeVimeoOgImage(videoId: string): Promise<string | null> {
  const res = await fetchOnce(`https://vimeo.com/${videoId}`, {
    userAgent: POSTER_USER_AGENT,
    accept: 'text/html,application/xhtml+xml',
    timeoutMs: POSTER_FETCH_TIMEOUT_MS,
  });
  if (!res || !res.ok) return null;
  const html = await res.text();
  // og:image meta tag — Vimeo HTML uses the property attribute.
  const m = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  if (m && m[1]) {
    // Decode HTML entities just in case (the URL has ?f=webp&region=us; raw
    // `&amp;` won't fetch correctly).
    return m[1].replace(/&amp;/g, '&');
  }
  return null;
}

/**
 * Fetch a Vimeo thumbnail. Reuses the oEmbed response cached in `oembedCache`
 * when available; otherwise hits oEmbed to get the thumbnail_url. Then GETs
 * the thumbnail bytes and writes them to static/posters/vimeo-{id}.jpg.
 *
 * Fallback path: if oEmbed returns a "domain-restricted" response that omits
 * thumbnail_url, scrape og:image from the public video page HTML. Both routes
 * ultimately point at i.vimeocdn.com (Vimeo's official CDN).
 */
async function fetchVimeoPoster(
  v: VideoRecord,
  oembedCache: Map<string, string>
): Promise<{ path: string; bytes: number; via: 'oembed' | 'og-scrape' }> {
  let thumbnailUrl = oembedCache.get(v.id);
  let via: 'oembed' | 'og-scrape' = 'oembed';
  if (!thumbnailUrl) {
    // Posters-only run path: oEmbed cache empty; fetch oEmbed fresh.
    const res = await fetchOnce(oembedUrl(v), { userAgent: POSTER_USER_AGENT });
    if (!res || !res.ok) {
      throw new Error(
        `Vimeo oEmbed fetch failed for vimeo:${v.id}: ${
          res ? `http ${res.status}` : 'network/timeout'
        }`
      );
    }
    const j = (await res.json()) as { thumbnail_url?: string };
    if (j.thumbnail_url) {
      thumbnailUrl = j.thumbnail_url;
      oembedCache.set(v.id, thumbnailUrl);
    } else {
      // Domain-restricted response — fall back to og:image scrape.
      const scraped = await scrapeVimeoOgImage(v.id);
      if (!scraped) {
        throw new Error(
          `Vimeo poster fetch failed for vimeo:${v.id}: oEmbed missing thumbnail_url AND og:image scrape returned no match`
        );
      }
      thumbnailUrl = scraped;
      via = 'og-scrape';
    }
  }

  const imgRes = await fetchOnce(thumbnailUrl, {
    userAgent: POSTER_USER_AGENT,
    accept: 'image/jpeg,image/webp,image/*',
    timeoutMs: POSTER_FETCH_TIMEOUT_MS,
  });
  if (!imgRes || !imgRes.ok) {
    throw new Error(
      `Vimeo thumbnail fetch failed for vimeo:${v.id} (${thumbnailUrl}): ${
        imgRes ? `http ${imgRes.status}` : 'network/timeout'
      }`
    );
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const outPath = resolve(POSTERS_DIR, `vimeo-${v.id}.jpg`);
  await writeFile(outPath, buf);
  return { path: `/posters/vimeo-${v.id}.jpg`, bytes: buf.length, via };
}

/**
 * Fetch a YouTube thumbnail. Pitfall 16: maxresdefault.jpg (1280×720) is the
 * canonical hi-res; falls back to hqdefault.jpg (480×360) when maxres returns
 * 404 (older / pre-HD uploads). Uses HEAD first to probe maxres without
 * downloading bytes.
 */
async function fetchYoutubePoster(v: VideoRecord): Promise<{ path: string; bytes: number }> {
  const maxres = `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`;
  const hqdef = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

  // HEAD probe maxres. i.ytimg.com returns 404 for videos without a maxres
  // derivative (Pitfall 16); fallback to hqdefault which exists for ALL videos.
  let url = maxres;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    const head = await fetch(maxres, {
      method: 'HEAD',
      headers: { 'User-Agent': POSTER_USER_AGENT },
      signal: ctrl.signal,
      redirect: 'follow',
    }).finally(() => clearTimeout(timer));
    if (!head.ok) url = hqdef;
  } catch {
    // HEAD failed (network/timeout) — try hqdefault directly which is more
    // likely to exist.
    url = hqdef;
  }

  const imgRes = await fetchOnce(url, {
    userAgent: POSTER_USER_AGENT,
    accept: 'image/jpeg,image/*',
    timeoutMs: POSTER_FETCH_TIMEOUT_MS,
  });
  if (!imgRes || !imgRes.ok) {
    // Last-ditch fallback: if we tried maxres and it 200'd HEAD but failed GET
    // (unlikely), retry with hqdefault.
    if (url !== hqdef) {
      const fallback = await fetchOnce(hqdef, {
        userAgent: POSTER_USER_AGENT,
        accept: 'image/jpeg,image/*',
        timeoutMs: POSTER_FETCH_TIMEOUT_MS,
      });
      if (fallback && fallback.ok) {
        const buf = Buffer.from(await fallback.arrayBuffer());
        const outPath = resolve(POSTERS_DIR, `youtube-${v.id}.jpg`);
        await writeFile(outPath, buf);
        return { path: `/posters/youtube-${v.id}.jpg`, bytes: buf.length };
      }
    }
    throw new Error(
      `YouTube thumbnail fetch failed for youtube:${v.id}: ${
        imgRes ? `http ${imgRes.status}` : 'network/timeout'
      }`
    );
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const outPath = resolve(POSTERS_DIR, `youtube-${v.id}.jpg`);
  await writeFile(outPath, buf);
  return { path: `/posters/youtube-${v.id}.jpg`, bytes: buf.length };
}

/**
 * Run the poster fetch pipeline for all videos. Honors D-15 per-host
 * concurrency (Vimeo bucket + YouTube bucket independent). Writes static/
 * posters/{source}-{id}.jpg + atomically updates src/lib/data/posters.json.
 *
 * If `oembedResults` is provided (default-mode run), the Vimeo thumbnail_url
 * cache is pre-populated from the health-check pass so we don't re-hit Vimeo.
 *
 * On any single video failure, the sidecar is STILL written for all videos
 * that succeeded (partial progress preserved), and the script exits non-zero
 * after the SUMMARY logs. The atomic temp+rename ensures Ctrl-C mid-run
 * leaves the sidecar in a consistent state.
 */
async function runPosterFetch(
  videos: VideoRecord[],
  oembedResults?: ProbeResult[]
): Promise<{ refreshed: number; failed: number }> {
  await mkdir(POSTERS_DIR, { recursive: true });

  // Pre-populate Vimeo oEmbed thumbnail cache from the health-check pass.
  const vimeoOembedCache = new Map<string, string>();
  for (const r of oembedResults ?? []) {
    if (r.source === 'vimeo' && r.vimeoThumbnailUrl) {
      vimeoOembedCache.set(r.id, r.vimeoThumbnailUrl);
    }
  }

  const vimeoLane = makeHostQueue(PER_HOST_CONCURRENCY);
  const youtubeLane = makeHostQueue(PER_HOST_CONCURRENCY);
  const sidecar: PostersSidecar = {};
  const failures: string[] = [];

  await Promise.all(
    videos.map((v) => {
      const lane = v.source === 'vimeo' ? vimeoLane : youtubeLane;
      return lane(async () => {
        try {
          if (v.source === 'vimeo') {
            const { path, bytes, via } = await fetchVimeoPoster(v, vimeoOembedCache);
            sidecar[`${v.source}-${v.id}`] = path;
            const tag = via === 'og-scrape' ? ' (og-scrape fallback)' : '';
            console.log(
              `  ✓ ${v.source}-${v.id} → ${path} (${(bytes / 1024).toFixed(1)} KB)${tag}`
            );
          } else {
            const { path, bytes } = await fetchYoutubePoster(v);
            sidecar[`${v.source}-${v.id}`] = path;
            console.log(`  ✓ ${v.source}-${v.id} → ${path} (${(bytes / 1024).toFixed(1)} KB)`);
          }
        } catch (e) {
          const msg = (e as Error).message;
          console.error(`  ✗ ${v.source}-${v.id}: ${msg}`);
          failures.push(`${v.source}-${v.id}`);
        }
      });
    })
  );

  // Atomic sidecar write: write to .tmp then rename so Ctrl-C mid-run leaves
  // either the old file intact or the new file complete (never partial).
  await writeFile(POSTERS_JSON_TMP, JSON.stringify(sidecar, null, 2) + '\n', 'utf-8');
  await rename(POSTERS_JSON_TMP, POSTERS_JSON);

  const refreshed = Object.keys(sidecar).length;
  return { refreshed, failed: failures.length };
}

/**
 * Phase 2 oEmbed health-check pass (extracted from main() for the --posters-only
 * branch to reuse logic without running the health-check itself). Returns
 * (1) the full ProbeResult[] (caller may pass to runPosterFetch to seed the
 * Vimeo cache), and (2) the script exit code that SHOULD be used IF
 * runPosterFetch is not going to overwrite it (0 if all ok, 1 on failures).
 */
async function runOembedHealthCheck(videos: VideoRecord[]): Promise<{
  results: ProbeResult[];
  exitCode: 0 | 1;
}> {
  const vimeoLane = makeHostQueue(PER_HOST_CONCURRENCY);
  const youtubeLane = makeHostQueue(PER_HOST_CONCURRENCY);

  const results = await Promise.all(
    videos.map((v) => {
      const lane = v.source === 'vimeo' ? vimeoLane : youtubeLane;
      return lane(() => probe(v));
    })
  );

  const failures = results.filter(
    (r) => r.classification === 'embed_disabled' || r.classification === 'removed'
  );
  const warnings = results.filter((r) => r.classification === 'transient');

  if (failures.length === 0) {
    console.log(
      `✓ ${results.length}/${results.length} videos embeddable` +
        (warnings.length ? ` (${warnings.length} transient warning(s) — see above)` : '')
    );
    if (warnings.length) {
      for (const w of warnings) {
        console.warn(
          `  warn: ${w.source}:${w.id} "${w.title}" — ${w.error ?? `status ${w.status}`} after ${w.attempts} attempts`
        );
      }
    }
    return { results, exitCode: 0 };
  }

  const report = {
    ranAt: new Date().toISOString(),
    totalChecked: results.length,
    failures: failures.map((f) => ({
      source: f.source,
      id: f.id,
      title: f.title,
      status: f.status,
      classification: f.classification,
    })),
    warnings: warnings.map((w) => ({
      source: w.source,
      id: w.id,
      title: w.title,
      status: w.status,
      classification: w.classification,
    })),
  };
  await writeFile(REPORT_FILE, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  console.error(`✗ ${failures.length}/${results.length} videos failed oEmbed check:`);
  for (const f of failures) {
    console.error(`  ${f.source}:${f.id} "${f.title}" — status ${f.status} (${f.classification})`);
  }
  console.error(`Report written to ${REPORT_FILE}`);
  return { results, exitCode: 1 };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  // Read videos.json directly (D-22: zero _three-specific helpers; we don't need
  // the loader's Zod-materialized defaults for this script).
  const raw = await readFile(VIDEOS_JSON, 'utf-8');
  const videos: VideoRecord[] = (JSON.parse(raw) as unknown[]).map((v) => {
    const r = v as { source: unknown; id: unknown; title: unknown };
    return {
      source: r.source as Source,
      id: String(r.id),
      title: String(r.title),
    };
  });

  if (opts.postersOnly) {
    // Plan 03-03 Task 4 invocation: just fetch posters, skip the oEmbed
    // health-check entirely. Vimeo oEmbed cache starts empty; runPosterFetch
    // will fetch Vimeo oEmbed inline as needed for thumbnail_url.
    console.log(`Fetching posters for ${videos.length} videos...`);
    const { refreshed, failed } = await runPosterFetch(videos);
    if (failed > 0) {
      console.error(`✗ ${failed}/${videos.length} posters failed to fetch (see above)`);
      process.exit(1);
    }
    console.log(`✓ ${refreshed}/${videos.length} posters refreshed`);
    process.exit(0);
  }

  // Default invocation: oEmbed health-check FIRST, then poster fetch reusing
  // any cached Vimeo thumbnail_urls from the health-check pass.
  const { results, exitCode: healthExit } = await runOembedHealthCheck(videos);

  // Always run the poster pass too — it's the same network round-trip
  // envelope and producers expect `pnpm check:embeds` to refresh posters.
  console.log(`\nFetching posters for ${videos.length} videos...`);
  const { refreshed, failed: posterFails } = await runPosterFetch(videos, results);
  if (posterFails > 0) {
    console.error(`✗ ${posterFails}/${videos.length} posters failed to fetch (see above)`);
    process.exit(1);
  }
  console.log(`✓ ${refreshed}/${videos.length} posters refreshed`);

  process.exit(healthExit);
}

main().catch((e) => {
  console.error('check-embeds: unexpected error:', e);
  process.exit(2);
});
