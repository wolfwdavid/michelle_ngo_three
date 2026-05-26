/**
 * categoryAccent.ts — unit tests for the static Category → Tailwind class-string
 * accent map (D-02 from Phase 4 CONTEXT, mirroring Pitfall 7 carry-forward from
 * _four/src/lib/components/categoryAccent.ts).
 *
 * The three exports each return a different "flavor" of accent class for the
 * active-pill compound style:
 *   categoryAccent('Reel')       → 'text-cat-reel'
 *   categoryAccentBg('Reel')     → 'bg-cat-reel/15'
 *   categoryAccentRing('Reel')   → 'ring-cat-reel/40'
 *
 * The fifth test pins the Tailwind v4 scanner contract: every class string
 * MUST appear LITERALLY in the source file so the scanner emits the matching
 * utility CSS. We read the source and assert .includes() on representative
 * literals — a dynamic `text-cat-${slug}` template would silently break this.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { categoryAccent, categoryAccentBg, categoryAccentRing } from './categoryAccent';
import { CATEGORIES } from '$lib/data';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('categoryAccent — text-cat-* map (D-02 Phase 4)', () => {
  it('PBS American Portrait → text-cat-pbs', () => {
    expect(categoryAccent('PBS American Portrait')).toBe('text-cat-pbs');
  });

  it('Reel → text-cat-reel', () => {
    expect(categoryAccent('Reel')).toBe('text-cat-reel');
  });

  it('Other → text-cat-other', () => {
    expect(categoryAccent('Other')).toBe('text-cat-other');
  });

  it('returns a non-empty string for every CATEGORIES value (Record completeness)', () => {
    for (const c of CATEGORIES) {
      const v = categoryAccent(c);
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
      expect(v.startsWith('text-cat-')).toBe(true);
    }
  });
});

describe('categoryAccentBg — bg-cat-*/15 map (D-02 Phase 4)', () => {
  it('PBS American Portrait → bg-cat-pbs/15', () => {
    expect(categoryAccentBg('PBS American Portrait')).toBe('bg-cat-pbs/15');
  });

  it('Reel → bg-cat-reel/15', () => {
    expect(categoryAccentBg('Reel')).toBe('bg-cat-reel/15');
  });

  it('returns a non-empty bg-cat-*/15 string for every CATEGORIES value', () => {
    for (const c of CATEGORIES) {
      const v = categoryAccentBg(c);
      expect(typeof v).toBe('string');
      expect(v).toMatch(/^bg-cat-[a-z]+\/15$/);
    }
  });
});

describe('categoryAccentRing — ring-cat-*/40 map (D-02 Phase 4)', () => {
  it('PBS American Portrait → ring-cat-pbs/40', () => {
    expect(categoryAccentRing('PBS American Portrait')).toBe('ring-cat-pbs/40');
  });

  it('Reel → ring-cat-reel/40', () => {
    expect(categoryAccentRing('Reel')).toBe('ring-cat-reel/40');
  });

  it('returns a non-empty ring-cat-*/40 string for every CATEGORIES value', () => {
    for (const c of CATEGORIES) {
      const v = categoryAccentRing(c);
      expect(typeof v).toBe('string');
      expect(v).toMatch(/^ring-cat-[a-z]+\/40$/);
    }
  });
});

describe('categoryAccent.ts — Tailwind v4 scanner contract (Pitfall 7)', () => {
  // The scanner reads source files looking for LITERAL utility class names.
  // A dynamic `text-cat-${slug}` template would compute the class at runtime
  // but the build-time scanner would never see it, and the bundled CSS
  // wouldn't include the rule. This contract test reads the source file and
  // asserts every accent flavor's literal text is present.
  const sourcePath = resolve(__dirname, 'categoryAccent.ts');
  const source = readFileSync(sourcePath, 'utf-8');

  it('contains literal text-cat-pbs and text-cat-reel', () => {
    expect(source.includes('text-cat-pbs')).toBe(true);
    expect(source.includes('text-cat-reel')).toBe(true);
  });

  it('contains literal bg-cat-pbs/15 and ring-cat-pbs/40 (active-pill compound)', () => {
    expect(source.includes('bg-cat-pbs/15')).toBe(true);
    expect(source.includes('ring-cat-pbs/40')).toBe(true);
  });

  it('contains all 8 text-cat-* literals (pbs, promos, branded, docshort, reel, personal, edunon, other)', () => {
    for (const suffix of [
      'pbs',
      'promos',
      'branded',
      'docshort',
      'reel',
      'personal',
      'edunon',
      'other',
    ]) {
      expect(source.includes(`text-cat-${suffix}`)).toBe(true);
      expect(source.includes(`bg-cat-${suffix}/15`)).toBe(true);
      expect(source.includes(`ring-cat-${suffix}/40`)).toBe(true);
    }
  });
});
