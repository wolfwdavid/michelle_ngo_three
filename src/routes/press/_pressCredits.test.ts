import { describe, expect, it } from 'vitest';
import { getPressCredits } from './_pressCredits';

describe('getPressCredits — D-08 flat array shape', () => {
  it('returns exactly 13 records (1:1 with non-Michelle uploaders)', () => {
    expect(getPressCredits()).toHaveLength(13);
  });

  it('every record is shape { network: string; video: Video } (D-08 FLAT — not grouped)', () => {
    const result = getPressCredits();
    for (const c of result) {
      expect(typeof c.network).toBe('string');
      expect(c.video).toBeDefined();
      expect(typeof c.video.id).toBe('string');
      expect(typeof c.video.title).toBe('string');
    }
  });

  it('no record has uploader === "Michelle Ngo" (D-08 filter)', () => {
    const result = getPressCredits();
    expect(result.every((c) => c.video.uploader !== 'Michelle Ngo')).toBe(true);
  });
});

describe('getPressCredits — D-18 prestige order VERBATIM from _four', () => {
  it('network order matches PRESTIGE_ORDER exactly (13 strings)', () => {
    const result = getPressCredits();
    expect(result.map((r) => r.network)).toEqual([
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
    ]);
  });

  it('first record is HBO Max (top of prestige order)', () => {
    const result = getPressCredits();
    expect(result[0]?.network).toBe('HBO Max');
  });

  it('last record is Lenny Cooke (Movie) (bottom of prestige order)', () => {
    const result = getPressCredits();
    expect(result[result.length - 1]?.network).toBe('Lenny Cooke (Movie)');
  });
});

describe('getPressCredits — 1:1 uploader-to-video today', () => {
  it('each network has exactly 1 credit (no duplicates in current videos.json)', () => {
    const result = getPressCredits();
    const counts = new Map<string, number>();
    for (const c of result) {
      counts.set(c.network, (counts.get(c.network) ?? 0) + 1);
    }
    for (const [network, count] of counts) {
      expect(count, `network ${network} should have 1 credit, got ${count}`).toBe(1);
    }
  });
});
