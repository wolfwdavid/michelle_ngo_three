import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  pageVisibility,
  initVisibilityListener,
  __resetVisibilityForTests,
} from './visibility.svelte';
import { openMenu, closeMenu, __resetMenuStateForTests } from './menu.svelte';

/**
 * visibility.svelte.ts — module-scope rune that ORs document.hidden with
 * menu.menuOpen for the single source-of-truth documentHidden signal consumed
 * by ReelStage, HeroAmbient (Plan 05-03), and WatchPlayer (Plan 05-02).
 *
 * Phase 5 Finding 10 option (a): lift the bridge out of ReelStage so sibling
 * components subscribe to the SAME rune instead of a setContext broadcast.
 *
 * Tests wrap rune access in $effect.root (Svelte 5.55+ scoping rule) and reset
 * module state via __resetVisibilityForTests + __resetMenuStateForTests in
 * afterEach so successive tests don't carry the listener-registered flag.
 */

// Helper — set document.hidden in jsdom (the property is normally read-only).
function setDocumentHidden(value: boolean): void {
  Object.defineProperty(document, 'hidden', {
    value,
    configurable: true,
  });
}

describe('pageVisibility (Phase 5 Finding 10 option a)', () => {
  beforeEach(() => {
    __resetVisibilityForTests();
    __resetMenuStateForTests();
    setDocumentHidden(false);
  });

  afterEach(() => {
    __resetVisibilityForTests();
    __resetMenuStateForTests();
    setDocumentHidden(false);
    vi.restoreAllMocks();
  });

  test('pageVisibility.documentHidden defaults to false (SSR-safe default)', () => {
    expect(pageVisibility.documentHidden).toBe(false);
    expect(pageVisibility.pageHidden).toBe(false);
  });

  test('documentHidden returns true when document.hidden flips true', () => {
    const cleanup = $effect.root(() => {
      initVisibilityListener();
      expect(pageVisibility.documentHidden).toBe(false);
      setDocumentHidden(true);
      document.dispatchEvent(new Event('visibilitychange'));
      expect(pageVisibility.documentHidden).toBe(true);
    });
    cleanup();
  });

  test('documentHidden returns true when menu.menuOpen flips true (without touching document.hidden)', () => {
    const cleanup = $effect.root(() => {
      initVisibilityListener();
      expect(pageVisibility.documentHidden).toBe(false);
      openMenu();
      expect(pageVisibility.documentHidden).toBe(true);
      closeMenu();
      expect(pageVisibility.documentHidden).toBe(false);
    });
    cleanup();
  });

  test('documentHidden ORs document.hidden with menu.menuOpen', () => {
    const cleanup = $effect.root(() => {
      initVisibilityListener();
      // Both true
      setDocumentHidden(true);
      document.dispatchEvent(new Event('visibilitychange'));
      openMenu();
      expect(pageVisibility.documentHidden).toBe(true);
      // page-hidden true, menu false
      closeMenu();
      expect(pageVisibility.documentHidden).toBe(true);
      // both false
      setDocumentHidden(false);
      document.dispatchEvent(new Event('visibilitychange'));
      expect(pageVisibility.documentHidden).toBe(false);
      // page-hidden false, menu true
      openMenu();
      expect(pageVisibility.documentHidden).toBe(true);
    });
    cleanup();
  });

  test('initVisibilityListener is idempotent — second call does not double-register', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    initVisibilityListener();
    initVisibilityListener();
    initVisibilityListener();
    const visCalls = addSpy.mock.calls.filter((c) => c[0] === 'visibilitychange');
    expect(visCalls.length).toBe(1);
  });

  test('initVisibilityListener seeds _pageHidden from document.hidden at registration', () => {
    setDocumentHidden(true);
    initVisibilityListener();
    expect(pageVisibility.pageHidden).toBe(true);
    expect(pageVisibility.documentHidden).toBe(true);
  });

  test('pageHidden getter exposes raw document.hidden without the menu OR', () => {
    const cleanup = $effect.root(() => {
      initVisibilityListener();
      openMenu();
      // pageHidden should NOT reflect menu state — only document.hidden writer.
      expect(pageVisibility.pageHidden).toBe(false);
      // documentHidden, on the other hand, still ORs in menuOpen.
      expect(pageVisibility.documentHidden).toBe(true);
    });
    cleanup();
  });
});
