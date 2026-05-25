import { describe, test, expect, afterEach, vi } from 'vitest';
import { motion, initMotionState, __resetMotionStateForTests } from './motion.svelte';

/**
 * motion.svelte.ts — module-scope rune for prefers-reduced-motion (REEL-04 / D-08).
 *
 * Tests use $effect.root to wrap rune access (Svelte 5.55+ scoping rule), follow
 * the storage.test.ts SSR pattern (vi.stubGlobal('window', undefined)), and reset
 * module state via __resetMotionStateForTests + vi.unstubAllGlobals in afterEach.
 */
describe('motion.svelte (D-08 trigger 1: prefers-reduced-motion)', () => {
  afterEach(() => {
    __resetMotionStateForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('default prefersReducedMotion is false (SSR-safe / cinematic-autoplay default)', () => {
    expect(motion.prefersReducedMotion).toBe(false);
  });

  test('initMotionState is no-op when window is undefined (SSR/prerender)', () => {
    vi.stubGlobal('window', undefined);
    expect(() => initMotionState()).not.toThrow();
    expect(motion.prefersReducedMotion).toBe(false);
  });

  test('initMotionState reads matchMedia.matches on first call and flips the rune', () => {
    const addEventListener = vi.fn();
    const matchMediaSpy = vi.fn(() => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener,
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMediaSpy);
    // jsdom provides window; just patch matchMedia on it.
    (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia =
      matchMediaSpy as unknown as typeof window.matchMedia;

    const cleanup = $effect.root(() => {
      initMotionState();
      expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      expect(motion.prefersReducedMotion).toBe(true);
    });
    cleanup();
  });

  test('initMotionState is idempotent (matchMedia called only once on repeated init)', () => {
    const matchMediaSpy = vi.fn(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }));
    (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia =
      matchMediaSpy as unknown as typeof window.matchMedia;

    const cleanup = $effect.root(() => {
      initMotionState();
      initMotionState();
      initMotionState();
      expect(matchMediaSpy).toHaveBeenCalledTimes(1);
    });
    cleanup();
  });

  test('change event flips the rune reactively', () => {
    let capturedHandler: ((e: MediaQueryListEvent) => void) | null = null;
    const matchMediaSpy = vi.fn(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn((evt: string, h: (e: MediaQueryListEvent) => void) => {
        if (evt === 'change') capturedHandler = h;
      }),
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }));
    (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia =
      matchMediaSpy as unknown as typeof window.matchMedia;

    const cleanup = $effect.root(() => {
      initMotionState();
      expect(motion.prefersReducedMotion).toBe(false);
      // Simulate the OS toggling Reduce Motion on.
      expect(capturedHandler).not.toBeNull();
      capturedHandler?.({ matches: true } as MediaQueryListEvent);
      expect(motion.prefersReducedMotion).toBe(true);
      // And back off.
      capturedHandler?.({ matches: false } as MediaQueryListEvent);
      expect(motion.prefersReducedMotion).toBe(false);
    });
    cleanup();
  });
});
