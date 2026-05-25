/**
 * Module-scope rune for prefers-reduced-motion (REEL-04 fallback trigger 1, D-08).
 *
 * SSR-safe defaults: during prerender (typeof window === 'undefined'),
 * returns prefersReducedMotion = false (the cinematic-autoplay default).
 * Runtime hydration flips it if the user's matchMedia query matches.
 *
 * Init helper (`initMotionState`) is called once from src/routes/+layout.svelte
 * `onMount`. Module-scope listeners intentionally live for the SPA lifetime —
 * do NOT wrap in $effect.root (RESEARCH §Pattern 3 explicit note).
 *
 * Same .svelte.ts extension + __isBrowser() idiom as Phase 1's
 * src/lib/intersectionVisibility.svelte.ts (Svelte 5.55+ rune-scoping rule).
 */
import { __isBrowser } from '$lib/storage';

let _prefersReducedMotion = $state(false);

export const motion = {
  get prefersReducedMotion(): boolean {
    return _prefersReducedMotion;
  },
};

let initialized = false;

/**
 * Test-only: reset the module-scope initialized flag + rune so that successive
 * tests within the same module-load can re-run initMotionState cleanly.
 * Production code MUST NOT call this (the SPA lifetime owns the listener).
 */
export function __resetMotionStateForTests(): void {
  initialized = false;
  _prefersReducedMotion = false;
}

/**
 * Test-only: set prefersReducedMotion directly (bypass matchMedia). Used by
 * Plan 03-03 Task 2 ReelSection tests to assert the REEL-04 trigger-1 swap to
 * PosterImage without spinning up a matchMedia mock. Always reset via
 * `__resetMotionStateForTests` in afterEach.
 */
export function __setPrefersReducedMotionForTests(v: boolean): void {
  _prefersReducedMotion = v;
}

export function initMotionState(): void {
  if (!__isBrowser() || initialized) return;
  initialized = true;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  _prefersReducedMotion = mq.matches;
  const onChange = (e: MediaQueryListEvent): void => {
    _prefersReducedMotion = e.matches;
  };
  mq.addEventListener('change', onChange);
}
