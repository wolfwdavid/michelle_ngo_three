import { describe, expect, it } from 'vitest';
import { pbsCollectionUrl } from './_pbsCollectionUrl';
import { videos } from '$lib/data';

// The 18 PBS records: 15 have a pbs.org/american-portrait/collection/... URL
// embedded in description; 3 do not. Audit-verified ids (per `_four` Phase 5
// RESEARCH §Code Examples 5; carry-forward verbatim per Phase 6 D-03):
const PBS_NULL_IDS = ['620232398', '1007061884', '1007027015'] as const;

describe('pbsCollectionUrl — 15 positive extractions (Phase 6 D-03 / PBS-02)', () => {
  it('extracts a https://www.pbs.org/american-portrait/collection/... URL from each of the 15 records that contain one', () => {
    const pbs = videos.filter((v) => v.category === 'PBS American Portrait');
    const withUrl = pbs.filter((v) => !PBS_NULL_IDS.includes(v.id as (typeof PBS_NULL_IDS)[number]));
    expect(withUrl.length).toBe(15);
    for (const v of withUrl) {
      // Video.description is z.string().optional() (schema D-06); the 18 PBS rows
      // all carry a description, but the type is widened — coalesce to '' so the
      // helper's `string` signature is satisfied.
      const url = pbsCollectionUrl(v.description ?? '');
      expect(url, `expected URL for video id ${v.id}`).toMatch(
        /^https?:\/\/(?:www\.)?pbs\.org\/american-portrait\/collection\//
      );
    }
  });
});

describe('pbsCollectionUrl — returns null for 3 records without URL (Pitfall 4)', () => {
  it('returns null for American Portrait Year in Review 2020 (id 620232398)', () => {
    const v = videos.find((x) => x.id === '620232398');
    expect(v, 'fixture missing').toBeDefined();
    expect(pbsCollectionUrl(v!.description ?? '')).toBeNull();
  });
  it('returns null for PBS American Portrait - Celebrity Message (id 1007061884)', () => {
    const v = videos.find((x) => x.id === '1007061884');
    expect(v, 'fixture missing').toBeDefined();
    expect(pbsCollectionUrl(v!.description ?? '')).toBeNull();
  });
  it('returns null for Introducing PBS American Portrait (id 1007027015)', () => {
    const v = videos.find((x) => x.id === '1007027015');
    expect(v, 'fixture missing').toBeDefined();
    expect(pbsCollectionUrl(v!.description ?? '')).toBeNull();
  });
});

describe('pbsCollectionUrl — edge cases', () => {
  it('strips trailing period', () => {
    const url = pbsCollectionUrl(
      'See the collection at https://www.pbs.org/american-portrait/collection/57/i-began-to-live-my-truth/.'
    );
    expect(url).toBe('https://www.pbs.org/american-portrait/collection/57/i-began-to-live-my-truth/');
  });
  it('strips trailing comma', () => {
    const url = pbsCollectionUrl(
      'Visit https://www.pbs.org/american-portrait/collection/55/i-want-justice/, and watch more.'
    );
    expect(url).toBe('https://www.pbs.org/american-portrait/collection/55/i-want-justice/');
  });
  it('returns the first match when multiple PBS collection URLs present', () => {
    const url = pbsCollectionUrl(
      'Collection one: https://www.pbs.org/american-portrait/collection/1/a/ and two: https://www.pbs.org/american-portrait/collection/2/b/'
    );
    expect(url).toBe('https://www.pbs.org/american-portrait/collection/1/a/');
  });
  it('ignores non-pbs.org URLs', () => {
    expect(pbsCollectionUrl('Visit https://example.com/some/path/')).toBeNull();
  });
  it('returns null on malformed protocol', () => {
    expect(pbsCollectionUrl('See: httpx://www.pbs.org/american-portrait/collection/57/x/')).toBeNull();
  });
});
