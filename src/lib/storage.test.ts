import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage, STORAGE_PREFIX, __isBrowser } from './storage';

describe('$lib/storage', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear();
  });

  test('STORAGE_PREFIX is the locked mnp_three_ string (D-14)', () => {
    expect(STORAGE_PREFIX).toBe('mnp_three_');
  });

  test('set() auto-prefixes the key with mnp_three_', () => {
    storage.set('foo', { a: 1 });
    expect(window.localStorage.getItem('mnp_three_foo')).toBe('{"a":1}');
    expect(window.localStorage.getItem('foo')).toBeNull();
  });

  test('get() round-trips a set value with type inference', () => {
    storage.set<{ a: number }>('foo', { a: 1 });
    expect(storage.get<{ a: number }>('foo')).toEqual({ a: 1 });
  });

  test('get() returns null for an unset key', () => {
    expect(storage.get('missing')).toBeNull();
  });

  test('remove() deletes the prefixed key', () => {
    storage.set('foo', 1);
    storage.remove('foo');
    expect(storage.get('foo')).toBeNull();
    expect(window.localStorage.getItem('mnp_three_foo')).toBeNull();
  });

  test('clear() only removes mnp_three_ keys, not foreign keys (Trap D)', () => {
    storage.set('a', 1);
    window.localStorage.setItem('mnp_four_b', 'sibling-value');
    storage.clear();
    expect(storage.get('a')).toBeNull();
    expect(window.localStorage.getItem('mnp_four_b')).toBe('sibling-value');
  });

  test('get() returns null when stored value is corrupt JSON (D-15)', () => {
    window.localStorage.setItem('mnp_three_corrupt', '{not-json');
    expect(storage.get('corrupt')).toBeNull();
  });
});

describe('$lib/storage SSR safety', () => {
  afterEach(() => {
    // CRITICAL: restore window after each SSR test so other tests in the file
    // (which assume browser environment) still pass.
    vi.unstubAllGlobals();
  });

  test('__isBrowser() returns false and all methods no-op when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(__isBrowser()).toBe(false);
    expect(() => storage.set('x', 1)).not.toThrow();
    expect(storage.get('x')).toBeNull();
    expect(() => storage.remove('x')).not.toThrow();
    expect(() => storage.clear()).not.toThrow();
  });

  test('__isBrowser() returns true when window is defined (sanity)', () => {
    // No stubGlobal in this test — jsdom provides a real window.
    expect(__isBrowser()).toBe(true);
  });
});
