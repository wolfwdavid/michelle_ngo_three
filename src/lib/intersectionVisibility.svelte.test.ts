import { describe, test, expect } from 'vitest';
import { IntersectionVisibility } from './intersectionVisibility.svelte';

describe('IntersectionVisibility (runed IO hook smoke — Phase 1 SC #4)', () => {
  test('IntersectionVisibility class is importable and constructable', () => {
    // Smoke-level proof that runed is wired and the rune-native wrapper compiles.
    // Phase 3 ReelStage will exercise the real visibility logic with Playwright
    // against real Chromium IntersectionObserver behavior.
    expect(IntersectionVisibility).toBeDefined();
    expect(typeof IntersectionVisibility).toBe('function'); // class constructor
  });

  test('IntersectionVisibility constructs inside $effect.root scope and exposes isVisible getter', () => {
    // $effect.root provides the surrounding effect scope that runed's
    // useIntersectionObserver requires (Svelte 5.55+ rune scoping rules).
    // The class's JSDoc warns instantiators about this constraint.
    const cleanup = $effect.root(() => {
      const target = () => null;
      const v = new IntersectionVisibility(target);
      expect(v.isVisible).toBe(false);
    });
    cleanup();
  });

  test('IntersectionVisibility constructs with options inside $effect.root scope', () => {
    // Same scoping rule — verifies the options parameter compiles and the
    // wrapper accepts the IntersectionObserverInit shape.
    const cleanup = $effect.root(() => {
      const v = new IntersectionVisibility(() => null, {
        rootMargin: '0px',
        threshold: 0.5,
      });
      expect(v.isVisible).toBe(false);
    });
    cleanup();
  });
});
