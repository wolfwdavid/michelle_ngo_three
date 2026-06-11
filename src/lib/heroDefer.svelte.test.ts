import { describe, test, expect, afterEach, vi } from 'vitest';
import { createHeroDefer } from './heroDefer.svelte';

/**
 * heroDefer.svelte.ts — factory rune for the Phase 5 D-03 deferred-load
 * mechanism that races requestIdleCallback({ timeout: 2500 }), setTimeout(2500),
 * and the first window pointerdown/wheel/touchstart/scroll event. The idle/timeout
 * window was eased 1000ms -> 2500ms in quick 260610-vu7 (POL-02) to keep the hero
 * iframe fetch out of the LCP paint window; the interaction triggers are unchanged.
 *
 * Tests wrap rune mutations in $effect.root (Svelte 5.55+ scoping rule) and
 * use vi.useFakeTimers to drive the timer race. Each `createHeroDefer()` call
 * returns an independent instance — Phase 6 ABT-01 /about ambient bg can
 * instantiate its own without colliding with HeroAmbient's instance on /.
 *
 * jsdom NOTE: requestIdleCallback is NOT implemented in jsdom; the typeof
 * check in createHeroDefer.start() falls through to the setTimeout + event
 * listener triggers. The "fires via rIC" branch is exercised only on real
 * browsers (Chromium/Firefox) — verified by code review of the typeof guard.
 */

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('createHeroDefer (Phase 5 D-03)', () => {
  test('shouldMount defaults to false', () => {
    const defer = createHeroDefer();
    expect(defer.shouldMount).toBe(false);
    defer.dispose();
  });

  test('shouldMount flips true after 2500ms timeout', () => {
    vi.useFakeTimers();
    const cleanup = $effect.root(() => {
      const defer = createHeroDefer();
      expect(defer.shouldMount).toBe(false);
      defer.start();
      // Still false just before the 2500ms window elapses.
      vi.advanceTimersByTime(1000);
      expect(defer.shouldMount).toBe(false);
      vi.advanceTimersByTime(1501);
      expect(defer.shouldMount).toBe(true);
      defer.dispose();
    });
    cleanup();
  });

  test('shouldMount flips true on pointerdown before timeout', () => {
    vi.useFakeTimers();
    const cleanup = $effect.root(() => {
      const defer = createHeroDefer();
      defer.start();
      vi.advanceTimersByTime(500); // well before the 2500ms timer fires
      expect(defer.shouldMount).toBe(false);
      window.dispatchEvent(new Event('pointerdown'));
      expect(defer.shouldMount).toBe(true);
      defer.dispose();
    });
    cleanup();
  });

  test('shouldMount flips true on wheel event', () => {
    vi.useFakeTimers();
    const cleanup = $effect.root(() => {
      const defer = createHeroDefer();
      defer.start();
      vi.advanceTimersByTime(200);
      window.dispatchEvent(new Event('wheel'));
      expect(defer.shouldMount).toBe(true);
      defer.dispose();
    });
    cleanup();
  });

  test('shouldMount flips true on touchstart event', () => {
    vi.useFakeTimers();
    const cleanup = $effect.root(() => {
      const defer = createHeroDefer();
      defer.start();
      vi.advanceTimersByTime(200);
      window.dispatchEvent(new Event('touchstart'));
      expect(defer.shouldMount).toBe(true);
      defer.dispose();
    });
    cleanup();
  });

  test('shouldMount flips true on scroll event', () => {
    vi.useFakeTimers();
    const cleanup = $effect.root(() => {
      const defer = createHeroDefer();
      defer.start();
      vi.advanceTimersByTime(200);
      window.dispatchEvent(new Event('scroll'));
      expect(defer.shouldMount).toBe(true);
      defer.dispose();
    });
    cleanup();
  });

  test('dispose clears timers and removes listeners (no flip after dispose)', () => {
    vi.useFakeTimers();
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const cleanup = $effect.root(() => {
      const defer = createHeroDefer();
      defer.start();
      defer.dispose();
      // The 4 listeners (pointerdown, wheel, touchstart, scroll) should each
      // have been explicitly removed in dispose() — even though { once: true }
      // self-removes on first fire, we tear them down eagerly so the second
      // event never reaches a stale handler.
      const eventTypes = new Set(removeSpy.mock.calls.map((c) => c[0]));
      expect(eventTypes.has('pointerdown')).toBe(true);
      expect(eventTypes.has('wheel')).toBe(true);
      expect(eventTypes.has('touchstart')).toBe(true);
      expect(eventTypes.has('scroll')).toBe(true);
      // Timer should have been cleared — advance past the 2500ms window.
      vi.advanceTimersByTime(3000);
      expect(defer.shouldMount).toBe(false);
    });
    cleanup();
  });

  test('start is idempotent — second call does not double-register listeners', () => {
    vi.useFakeTimers();
    const addSpy = vi.spyOn(window, 'addEventListener');
    const cleanup = $effect.root(() => {
      const defer = createHeroDefer();
      defer.start();
      defer.start();
      defer.start();
      // The 4 events should each appear exactly ONCE in the addEventListener
      // call log (modulo unrelated calls jsdom may emit internally — filter
      // to our 4 events).
      const ourEvents = addSpy.mock.calls.filter(
        (c) =>
          c[0] === 'pointerdown' || c[0] === 'wheel' || c[0] === 'touchstart' || c[0] === 'scroll'
      );
      expect(ourEvents.length).toBe(4);
      defer.dispose();
    });
    cleanup();
  });

  test('dispose is idempotent — second call is a no-op', () => {
    const defer = createHeroDefer();
    defer.start();
    defer.dispose();
    expect(() => defer.dispose()).not.toThrow();
  });

  test('each createHeroDefer instance is independent (factory not singleton)', () => {
    vi.useFakeTimers();
    const cleanup = $effect.root(() => {
      const d1 = createHeroDefer();
      const d2 = createHeroDefer();
      d1.start();
      // Fire d1's pointer trigger
      window.dispatchEvent(new Event('pointerdown'));
      expect(d1.shouldMount).toBe(true);
      // d2 was never started — its trigger sources are inert.
      expect(d2.shouldMount).toBe(false);
      d1.dispose();
      d2.dispose();
    });
    cleanup();
  });

  test('post-fire trigger does not re-fire (one-shot latch)', () => {
    vi.useFakeTimers();
    const cleanup = $effect.root(() => {
      const defer = createHeroDefer();
      defer.start();
      vi.advanceTimersByTime(2501); // fire via timeout
      expect(defer.shouldMount).toBe(true);
      // Subsequent pointer events should NOT throw / re-fire / regress.
      window.dispatchEvent(new Event('pointerdown'));
      window.dispatchEvent(new Event('scroll'));
      expect(defer.shouldMount).toBe(true);
      defer.dispose();
    });
    cleanup();
  });
});
