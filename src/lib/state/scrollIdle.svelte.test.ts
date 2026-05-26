import { describe, test, expect, afterEach, vi } from 'vitest';
import {
  scrollIdle,
  initScrollIdle,
  teardownScrollIdle,
  __resetScrollIdleForTests,
  SCROLL_STOP_DEBOUNCE_MS,
} from './scrollIdle.svelte';

/**
 * scrollIdle.svelte.ts — module-scope rune for chrome-fade scroll-idle signal
 * (Phase 4 D-05). TopNav consumes scrollIdle.isScrolling in $derived chromeClass.
 *
 * Tests use $effect.root to wrap rune access (Svelte 5.55+ scoping rule), follow
 * the motion.svelte.test.ts SSR pattern (vi.stubGlobal('window', undefined)), and
 * reset module state via __resetScrollIdleForTests in afterEach.
 */
describe('scrollIdle.svelte (D-05 chrome-fade signal)', () => {
  afterEach(() => {
    __resetScrollIdleForTests();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('default isScrolling is false (SSR-safe default)', () => {
    expect(scrollIdle.isScrolling).toBe(false);
  });

  test('initScrollIdle is a no-op when target is null', () => {
    initScrollIdle(null);
    expect(scrollIdle.isScrolling).toBe(false);
  });

  test('initScrollIdle no-ops when window is undefined (SSR / prerender)', () => {
    vi.stubGlobal('window', undefined);
    expect(() => initScrollIdle(null)).not.toThrow();
    expect(scrollIdle.isScrolling).toBe(false);
  });

  test('scroll event flips isScrolling=true within $effect.root', () => {
    const cleanup = $effect.root(() => {
      initScrollIdle(window);
      window.dispatchEvent(new Event('scroll'));
      expect(scrollIdle.isScrolling).toBe(true);
    });
    cleanup();
  });

  test('isScrolling flips back to false after SCROLL_STOP_DEBOUNCE_MS', () => {
    vi.useFakeTimers();
    const cleanup = $effect.root(() => {
      initScrollIdle(window);
      window.dispatchEvent(new Event('scroll'));
      expect(scrollIdle.isScrolling).toBe(true);
      vi.advanceTimersByTime(SCROLL_STOP_DEBOUNCE_MS + 50);
      expect(scrollIdle.isScrolling).toBe(false);
    });
    cleanup();
  });

  test('debounce resets on a second scroll event (no premature flip)', () => {
    vi.useFakeTimers();
    const cleanup = $effect.root(() => {
      initScrollIdle(window);
      window.dispatchEvent(new Event('scroll'));
      // Advance MOST of the debounce window (not all of it).
      vi.advanceTimersByTime(SCROLL_STOP_DEBOUNCE_MS - 100);
      // Fire a second scroll — should reset the timer.
      window.dispatchEvent(new Event('scroll'));
      // Advance past where the FIRST event would have expired, but not past
      // the SECOND event's expiry → should still be true.
      vi.advanceTimersByTime(200);
      expect(scrollIdle.isScrolling).toBe(true);
      // Now advance past the SECOND event's expiry.
      vi.advanceTimersByTime(SCROLL_STOP_DEBOUNCE_MS);
      expect(scrollIdle.isScrolling).toBe(false);
    });
    cleanup();
  });

  test('teardownScrollIdle flips isScrolling back to false and detaches listener', () => {
    const cleanup = $effect.root(() => {
      initScrollIdle(window);
      window.dispatchEvent(new Event('scroll'));
      expect(scrollIdle.isScrolling).toBe(true);
      teardownScrollIdle();
      expect(scrollIdle.isScrolling).toBe(false);
      // Dispatch after teardown — should NOT re-flip isScrolling.
      window.dispatchEvent(new Event('scroll'));
      expect(scrollIdle.isScrolling).toBe(false);
    });
    cleanup();
  });

  test('initScrollIdle is idempotent (second init no-ops when target is same)', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    initScrollIdle(window);
    initScrollIdle(window);
    initScrollIdle(window);
    const scrollAttachments = addSpy.mock.calls.filter((call) => call[0] === 'scroll');
    expect(scrollAttachments.length).toBe(1);
  });

  test('__resetScrollIdleForTests is idempotent (does not throw on uninitialized state)', () => {
    expect(() => __resetScrollIdleForTests()).not.toThrow();
    expect(() => __resetScrollIdleForTests()).not.toThrow();
    expect(scrollIdle.isScrolling).toBe(false);
  });

  test('teardownScrollIdle is a no-op when never initialized', () => {
    expect(() => teardownScrollIdle()).not.toThrow();
    expect(scrollIdle.isScrolling).toBe(false);
  });
});
