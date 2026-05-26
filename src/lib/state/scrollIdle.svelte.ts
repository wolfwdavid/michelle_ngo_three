/**
 * Module-scope rune for the chrome-fade scroll-idle signal (Phase 4 D-05).
 *
 * Listens to scroll events on the supplied target (Window OR the reel container
 * HTMLElement). Flips isScrolling=true on each scroll event; flips back to
 * false 600ms after the last event. TopNav.svelte consumes scrollIdle.isScrolling
 * in its $derived chromeClass to apply opacity-0 + pointer-events-none during
 * active scroll, restoring solid chrome on scroll-stop / hover-near-top /
 * focus-within / tap (last three handled in TopNav directly so this rune stays
 * single-purpose).
 *
 * Why a separate target arg (vs always Window): the reel-snap scroll fires on
 * the inner [role="region"][aria-label="Filmography reel"] container, NOT on
 * the document scroller. TopNav initializes this rune with that container once
 * it's queryable (passing window as a fallback works but produces zero scroll
 * events during reel scroll — wrong target).
 *
 * SSR-safe: defaults to isScrolling=false; no init runs during prerender.
 * Same __isBrowser idiom as $lib/state/motion.svelte.ts.
 */
import { __isBrowser } from '$lib/storage';

export const SCROLL_STOP_DEBOUNCE_MS = 600; // D-05 — Claude's Discretion tune-window during real-device QA

let _isScrolling = $state(false);
let _target: HTMLElement | Window | null = null;
let _timeoutHandle: ReturnType<typeof setTimeout> | undefined;
let _initialized = false;

function onScroll(): void {
  _isScrolling = true;
  if (_timeoutHandle !== undefined) clearTimeout(_timeoutHandle);
  _timeoutHandle = setTimeout(() => {
    _isScrolling = false;
  }, SCROLL_STOP_DEBOUNCE_MS);
}

export const scrollIdle = {
  get isScrolling(): boolean {
    return _isScrolling;
  },
};

export function initScrollIdle(target: HTMLElement | Window | null): void {
  if (!__isBrowser() || _initialized || !target) return;
  _initialized = true;
  _target = target;
  (_target as HTMLElement | Window).addEventListener('scroll', onScroll, { passive: true });
}

export function teardownScrollIdle(): void {
  if (!_initialized || !_target) return;
  (_target as HTMLElement | Window).removeEventListener('scroll', onScroll);
  if (_timeoutHandle !== undefined) clearTimeout(_timeoutHandle);
  _timeoutHandle = undefined;
  _isScrolling = false;
  _target = null;
  _initialized = false;
}

/** Test-only. Resets module-scope state for fresh per-test runs. */
export function __resetScrollIdleForTests(): void {
  teardownScrollIdle();
}
