import { describe, test, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPosterFor } from './posters';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * posters.ts / posters.json — sidecar contract + fallback behavior.
 *
 * Runs in the `data` Vitest project (node env) per vite.config.ts include
 * `src/lib/data/**\/*.{test,spec}.{js,ts}`. Reads posters.json directly off disk
 * so the contract holds even if the static import was tree-shaken.
 *
 * Plan 03-01 ships posters.json as `{}` (empty). Plan 03-03's check-embeds
 * extension populates real entries; the regex assertions guard the eventual
 * shape so a stray hand-edit can't silently corrupt the sidecar.
 */
describe('posters.json sidecar contract (D-02, D-03 shape)', () => {
  const sidecar = JSON.parse(readFileSync(resolve(__dirname, 'posters.json'), 'utf-8')) as Record<
    string,
    unknown
  >;

  test('parses cleanly as JSON', () => {
    expect(typeof sidecar).toBe('object');
    expect(sidecar).not.toBeNull();
    expect(Array.isArray(sidecar)).toBe(false);
  });

  test('Plan 03-01 ships empty sidecar (no entries; Plan 03-03 populates)', () => {
    // This assertion intentionally fails once Plan 03-03 populates the sidecar.
    // At that point, replace with a count-based check (e.g., >= 56 entries).
    expect(Object.keys(sidecar).length).toBe(0);
  });

  test('every existing key matches /^(vimeo|youtube)-[A-Za-z0-9_-]+$/', () => {
    const keyShape = /^(vimeo|youtube)-[A-Za-z0-9_-]+$/;
    for (const key of Object.keys(sidecar)) {
      expect(key, `key "${key}" must match source-id pattern`).toMatch(keyShape);
    }
  });

  test('every existing value matches the /posters/<source>-<id>(-<hash>)?.<ext> path', () => {
    const valueShape =
      /^\/posters\/(vimeo|youtube)-[A-Za-z0-9_-]+(-[a-f0-9]{6,16})?\.(jpg|webp|avif)$/;
    for (const [key, value] of Object.entries(sidecar)) {
      expect(typeof value, `value for ${key} must be string`).toBe('string');
      expect(value as string, `value for ${key} must match poster path pattern`).toMatch(
        valueShape
      );
    }
  });
});

describe('getPosterFor (Plan 03-01 fallback + Plan 03-03 sidecar hit)', () => {
  test('returns deterministic fallback when sidecar entry is missing', () => {
    expect(getPosterFor({ source: 'vimeo', id: 'fake999' })).toBe('/posters/vimeo-fake999.jpg');
    expect(getPosterFor({ source: 'youtube', id: 'abc_XYZ-123' })).toBe(
      '/posters/youtube-abc_XYZ-123.jpg'
    );
  });

  test('returns sidecar value when present (mocked sidecar)', async () => {
    // Mock the static JSON import + reload the module to pick the mock up.
    vi.resetModules();
    vi.doMock('./posters.json', () => ({
      default: {
        'vimeo-264677021': '/posters/vimeo-264677021-abc12345.webp',
        'youtube-dQw4w9WgXcQ': '/posters/youtube-dQw4w9WgXcQ-def67890.jpg',
      },
    }));
    const { getPosterFor: getMocked } = await import('./posters');
    expect(getMocked({ source: 'vimeo', id: '264677021' })).toBe(
      '/posters/vimeo-264677021-abc12345.webp'
    );
    expect(getMocked({ source: 'youtube', id: 'dQw4w9WgXcQ' })).toBe(
      '/posters/youtube-dQw4w9WgXcQ-def67890.jpg'
    );
    // Unknown id still falls back even with populated sidecar.
    expect(getMocked({ source: 'vimeo', id: 'unknown' })).toBe('/posters/vimeo-unknown.jpg');
    vi.doUnmock('./posters.json');
    vi.resetModules();
  });
});
