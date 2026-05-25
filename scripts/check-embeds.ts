#!/usr/bin/env node
/**
 * oEmbed health-check script (Phase 2 D-13 through D-20; Pitfall 6 mitigation).
 *
 * For each video in src/lib/data/videos.json, probes the official oEmbed JSON
 * endpoint (Vimeo or YouTube) with up to 3 retries + exponential backoff.
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
 *   - All-pass: prints "✓ N/N videos embeddable" and exits 0. Writes no file.
 *   - Any failure: writes .embed-check-report.json at repo root and exits 1.
 *
 * No caching (D-16). Every invocation re-checks all videos fresh.
 *
 * Invoked by:
 *   pnpm check:embeds                                 (local opt-in, D-13)
 *   .github/workflows/oembed-check.yml (nightly cron) (D-13)
 *   .github/workflows/deploy-production.yml           (Phase 7, future)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const VIDEOS_JSON = resolve(REPO_ROOT, 'src/lib/data/videos.json');
const REPORT_FILE = resolve(REPO_ROOT, '.embed-check-report.json');

const PER_HOST_CONCURRENCY = 6; // D-15
const MAX_RETRIES = 3; // D-14 (3 retries with exponential backoff)
const BACKOFF_MS = [1000, 2000, 4000]; // D-14 (1s, 2s, 4s)
const REQUEST_TIMEOUT_MS = 10_000; // Claude's discretion (D §Discretion: HTTP timeout 10s default)
const USER_AGENT =
	'michelle_ngo_three-embed-check/1.0 (https://wolfwdavid.github.io/michelle_ngo_three/)';

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

async function fetchOnce(url: string): Promise<number | null> {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			method: 'GET',
			headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
			signal: ctrl.signal,
			redirect: 'follow'
		});
		return res.status;
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

	for (let i = 0; i <= MAX_RETRIES; i++) {
		attempts = i + 1;
		const status = await fetchOnce(url);
		lastStatus = status;
		const cls = classify(status);

		// Hard signals: stop retrying immediately.
		if (cls === 'ok' || cls === 'embed_disabled' || cls === 'removed') {
			return { source: v.source, id: v.id, title: v.title, status, classification: cls, attempts };
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
		error: lastError
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

async function main(): Promise<void> {
	// Read videos.json directly (D-22: zero _three-specific helpers; we don't need
	// the loader's Zod-materialized defaults for this script).
	const raw = await readFile(VIDEOS_JSON, 'utf-8');
	const videos: VideoRecord[] = (JSON.parse(raw) as unknown[]).map((v) => {
		const r = v as { source: unknown; id: unknown; title: unknown };
		return {
			source: r.source as Source,
			id: String(r.id),
			title: String(r.title)
		};
	});

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
		process.exit(0);
	}

	const report = {
		ranAt: new Date().toISOString(),
		totalChecked: results.length,
		failures: failures.map((f) => ({
			source: f.source,
			id: f.id,
			title: f.title,
			status: f.status,
			classification: f.classification
		})),
		warnings: warnings.map((w) => ({
			source: w.source,
			id: w.id,
			title: w.title,
			status: w.status,
			classification: w.classification
		}))
	};
	await writeFile(REPORT_FILE, JSON.stringify(report, null, 2) + '\n', 'utf-8');

	console.error(`✗ ${failures.length}/${results.length} videos failed oEmbed check:`);
	for (const f of failures) {
		console.error(
			`  ${f.source}:${f.id} "${f.title}" — status ${f.status} (${f.classification})`
		);
	}
	console.error(`Report written to ${REPORT_FILE}`);
	process.exit(1);
}

main().catch((e) => {
	console.error('check-embeds: unexpected error:', e);
	process.exit(2);
});
