/**
 * Poster lookup helper — reads src/lib/data/posters.json sidecar.
 *
 * Sidecar is populated by Plan 03-03's extension to scripts/check-embeds.ts
 * (D-04 — committed artifacts, not network-fetched at build). When entries
 * are missing (e.g., immediately after Plan 03-01 ships the empty stub), we
 * fall back to a deterministic path so the type stays non-null and components
 * render a `<img src="/posters/<source>-<id>.jpg">` that resolves once Plan
 * 03-03 commits the actual assets.
 *
 * The build-time validatePostersPlugin (Plan 03-03, vite.config.ts) fails
 * `pnpm build` if posters.json is missing entries; this helper is the runtime
 * read for components that survive the build gate.
 *
 * Why a separate module (not added to $lib/data/index.ts):
 *   Phase 2 D-22 / D-24 lock the 11-name public surface of $lib/data. Sidecar
 *   helpers live in a peer file; consumers import directly:
 *     `import { getPosterFor } from '$lib/data/posters'`.
 */
import type { Video } from './schema';
import sidecar from './posters.json';

const POSTERS = sidecar as Record<string, string>;

export function getPosterFor(video: Pick<Video, 'source' | 'id'>): string {
  const key = `${video.source}-${video.id}`;
  const entry = POSTERS[key];
  if (entry) return entry;
  // Plan 03-01 fallback: deterministic path. Plan 03-03 populates real entries.
  return `/posters/${video.source}-${video.id}.jpg`;
}
