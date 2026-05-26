import { describe, test, expect, afterEach } from 'vitest';
import { menu, openMenu, closeMenu, __resetMenuStateForTests } from './menu.svelte';

/**
 * menu.svelte.ts — module-scope rune for mobile-menu open state (Phase 4 D-08).
 *
 * Plan 04-03 wires ReelStage to OR menu.menuOpen into its documentHidden $state
 * so the reel:visibility broadcast (Phase 3 D-12) pauses iframes when open.
 *
 * Tests wrap rune access in $effect.root (Svelte 5.55+ scoping rule) and reset
 * module state via __resetMenuStateForTests in afterEach.
 */
describe('menu.svelte (D-08 mobile-menu open signal)', () => {
  afterEach(() => {
    __resetMenuStateForTests();
  });

  test('default menuOpen is false (SSR-safe default)', () => {
    expect(menu.menuOpen).toBe(false);
  });

  test('openMenu flips menuOpen to true', () => {
    const cleanup = $effect.root(() => {
      openMenu();
      expect(menu.menuOpen).toBe(true);
    });
    cleanup();
  });

  test('closeMenu flips menuOpen back to false', () => {
    const cleanup = $effect.root(() => {
      openMenu();
      expect(menu.menuOpen).toBe(true);
      closeMenu();
      expect(menu.menuOpen).toBe(false);
    });
    cleanup();
  });

  test('openMenu is idempotent (multiple calls remain true)', () => {
    const cleanup = $effect.root(() => {
      openMenu();
      openMenu();
      openMenu();
      expect(menu.menuOpen).toBe(true);
    });
    cleanup();
  });

  test('closeMenu is idempotent (multiple calls remain false)', () => {
    const cleanup = $effect.root(() => {
      closeMenu();
      closeMenu();
      expect(menu.menuOpen).toBe(false);
    });
    cleanup();
  });

  test('__resetMenuStateForTests returns menuOpen to false', () => {
    const cleanup = $effect.root(() => {
      openMenu();
      expect(menu.menuOpen).toBe(true);
      __resetMenuStateForTests();
      expect(menu.menuOpen).toBe(false);
    });
    cleanup();
  });

  test('exported menu object has no direct setter for menuOpen', () => {
    const cleanup = $effect.root(() => {
      // The getter-only API forces openMenu/closeMenu as the only mutation path.
      // TypeScript strict blocks direct assignment at compile-time; at runtime,
      // assigning to a getter-only property is silently no-op in non-strict mode
      // and throws in strict mode. Wrap in try/catch to verify the public API
      // contract: direct mutation MUST NOT change the underlying state.
      try {
        (menu as unknown as { menuOpen: boolean }).menuOpen = true;
      } catch {
        // Strict-mode TypeError from getter-only property — also acceptable.
      }
      expect(menu.menuOpen).toBe(false);
    });
    cleanup();
  });
});
