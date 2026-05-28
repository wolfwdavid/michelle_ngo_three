/**
 * Phase 6 D-03 (06-CONTEXT.md): extracts the first
 * pbs.org/american-portrait/collection/... URL from a video's description.
 * Returns null if no match.
 *
 * Underscore prefix excludes this file from SvelteKit route detection
 * (SvelteKit 2.59.1 ignores `_*` files under src/routes/*).
 *
 * Defensive trailing-punctuation strip: today's 18 PBS descriptions have no
 * trailing punctuation on the URL (audit-verified at plan time), but a future
 * copy edit could introduce a `.` or `,` — this trim is a free safety net.
 *
 * Verified regex `[^\s)]+` (negate space AND closing paren) handles the
 * inline-parenthesis case from RESEARCH Pitfall 3.
 *
 * Verbatim port from `_four/src/routes/pbs-american-portrait/_pbsCollectionUrl.ts`
 * (Phase 5 D-21 there → Phase 6 D-03 here per 06-CONTEXT.md decision rename).
 */
const COLLECTION_URL =
  /https?:\/\/(?:www\.)?pbs\.org\/american-portrait\/collection\/[^\s)]+/;
const TRAILING_PUNCT = /[).,!?]+$/;

export function pbsCollectionUrl(description: string): string | null {
  const m = description.match(COLLECTION_URL);
  if (!m) return null;
  return m[0].replace(TRAILING_PUNCT, '');
}
