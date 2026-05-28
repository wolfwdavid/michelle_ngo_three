/**
 * Phase 6 Plan 06-02 D-08: route-local helper that derives the press credit
 * list from `videos.json`. Returns a FLAT array `{ network, video }` (one
 * record per credit) in locked prestige order — D-08 divergence from _four's
 * grouped shape (`_four/src/routes/press/_pressCredits.ts:40-43` returns
 * `Array<{ network, videos: Video[] }>`).
 *
 * Today's data has 1:1 uploader-to-video ratio (13 distinct non-Michelle
 * uploaders, 1 credit each). Tomorrow's multi-credit data: each credit
 * gets its own scroll-snap section in a row — most cinematic per D-08.
 *
 * Underscore prefix excludes this file from SvelteKit route detection.
 *
 * Source: D-18 PRESTIGE_ORDER constant + D-08 filter — copy verbatim from
 * _four/_pressCredits.ts:24-38 (constant) and :48 (filter).
 */
import { videos, type Video } from '$lib/data';

/** D-18 prestige order — VERBATIM copy from _four/_pressCredits.ts:24-38. */
const PRESTIGE_ORDER = [
  'HBO Max',
  'HBO',
  'PBS',
  'ABC News',
  'U2',
  'Amazon News',
  'Music Box Films',
  'Monument Releasing',
  'Cargo Film & Releasing',
  'AZPM',
  'HBODocs',
  'GrasshalmClips',
  'Lenny Cooke (Movie)',
] as const;

export interface PressCredit {
  network: string;
  video: Video;
}

export function getPressCredits(): PressCredit[] {
  // D-08 filter — VERBATIM from _four/_pressCredits.ts:48.
  const pressVideos = videos.filter((v) => v.uploader !== 'Michelle Ngo');

  // Group by uploader (intermediate — collapsed to flat below).
  const byNetwork = new Map<string, Video[]>();
  for (const v of pressVideos) {
    const list = byNetwork.get(v.uploader);
    if (list) {
      list.push(v);
    } else {
      byNetwork.set(v.uploader, [v]);
    }
  }

  // D-08 flat emission: emit prestige-ordered networks first, one section
  // per credit (FLATTEN at emit, NOT grouped per _four). Within a network
  // with multiple credits, sub-sort by featured-first then published-desc
  // (matches Phase 3 D-25 default sort).
  const ordered: PressCredit[] = [];
  const consumed = new Set<string>();
  for (const network of PRESTIGE_ORDER) {
    const list = byNetwork.get(network);
    if (list && list.length > 0) {
      const sorted = [...list].toSorted((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.published.localeCompare(a.published);
      });
      for (const video of sorted) {
        ordered.push({ network, video });
      }
      consumed.add(network);
    }
  }
  // Defensive future-proofing: any unknown uploader appended last.
  for (const [network, list] of byNetwork) {
    if (!consumed.has(network)) {
      for (const video of list) {
        ordered.push({ network, video });
      }
    }
  }
  return ordered;
}
