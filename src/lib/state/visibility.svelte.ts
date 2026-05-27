/**
 * Module-scope rune for Page Visibility API + menu-open OR composite.
 *
 * Phase 5 Finding 10 option (a): lift the Phase 4 D-08 documentHidden bridge
 * out of ReelStage so HeroAmbient (Plan 05-03) and WatchPlayer (Plan 05-02)
 * subscribe to the SAME source-of-truth rune. The Phase 3 D-12
 * 'reel:visibility' setContext broadcast in ReelStage is preserved for
 * PreviewLoop consumers; only the WRITER side (visibilitychange listener)
 * migrates here.
 *
 * Composition rule:
 *   documentHidden ===
 *     (document.hidden via visibilitychange listener)
 *     OR (menu.menuOpen rune from $lib/state/menu.svelte)
 *
 * SSR-safe: _pageHidden defaults to false; initVisibilityListener() guards
 * with typeof document checks so prerender does not crash. The rune may be
 * imported in node-env data tests — the WRITER side is browser-only.
 *
 * Mirrors the menu.svelte.ts + motion.svelte.ts shape: private _x $state at
 * module scope, exported getter object, exported init helper (idempotent),
 * exported __resetForTests for fresh per-test runs.
 */
import { menu } from './menu.svelte';

let _pageHidden = $state(false);
let _listenerRegistered = false;

export const pageVisibility = {
  /**
   * The single source-of-truth signal: true when the page is backgrounded
   * (document.hidden) OR the mobile menu is open. ReelStage, HeroAmbient,
   * and WatchPlayer all read this to gate iframe playback.
   */
  get documentHidden(): boolean {
    return _pageHidden || menu.menuOpen;
  },
  /**
   * Bare document.hidden state without the menu OR. Exposed primarily for
   * tests + diagnostic introspection — production consumers should read
   * documentHidden instead.
   */
  get pageHidden(): boolean {
    return _pageHidden;
  },
};

/**
 * Register the document.visibilitychange listener ONCE at app boot. Called
 * from src/routes/+layout.svelte onMount. Idempotent — calling multiple
 * times is a no-op (the listener is only registered on the first call).
 *
 * SSR guard: typeof document check — the rune may be imported during
 * prerender by ReelStage / HeroAmbient module load, but the listener can
 * only be registered in a browser context.
 *
 * Seeds _pageHidden from document.hidden at registration so a page hydrated
 * while already backgrounded sees the correct initial state.
 */
export function initVisibilityListener(): void {
  if (_listenerRegistered) return;
  if (typeof document === 'undefined') return;
  _listenerRegistered = true;
  _pageHidden = document.hidden;
  document.addEventListener('visibilitychange', () => {
    _pageHidden = document.hidden;
  });
}

/**
 * Test-only reset. Mirrors menu.svelte.ts __resetMenuStateForTests + the
 * motion.svelte.ts pattern: clears the rune AND the initialized flag so
 * successive tests within the same module-load can re-run initVisibility-
 * Listener cleanly. Production code MUST NOT call this — the SPA lifetime
 * owns the listener.
 */
export function __resetVisibilityForTests(): void {
  _pageHidden = false;
  _listenerRegistered = false;
}
